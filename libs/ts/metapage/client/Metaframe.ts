import {EventEmitter} from "./EventEmitter";
import {VERSION, METAPAGE_KEY_STATE, METAPAGE_KEY_DEFINITION} from "../Constants";
import {Versions} from "../MetaLibsVersion";
import {MetaframeInputMap, MetaframePipeId, MetaframeId, MetapageId} from "@definitions/all";
import {
  ApiPayloadPluginRequest,
  ApiPayloadPluginRequestMethod,
  JsonRpcMethodsFromParent,
  JsonRpcMethodsFromChild,
  SetupIframeServerResponseData,
  MinimumClientMessage
} from "@definitions/JsonRpcMethods";
import {getUrlParamDEBUG, stringToRgb, log as MetapageToolsLog} from "./MetapageTools";

enum MetaframeEvents {
  Input = "input",
  Inputs = "inputs",
  Message = "message"
}

export class Metaframe extends EventEmitter {
  public static isIframe(): boolean {
    //http://stackoverflow.com/questions/326069/how-to-identify-if-a-webpage-is-being-loaded-inside-an-iframe-or-directly-into-t
    try {
      return window !== window.top;
    } catch (ignored) {
      return false;
    }
  }

  public static readonly version = VERSION;

  public static readonly INPUT = MetaframeEvents.Input;
  public static readonly INPUTS = MetaframeEvents.Inputs;
  public static readonly MESSAGE = MetaframeEvents.Message;

  _inputPipeValues: MetaframeInputMap = {};
  _outputPipeValues: MetaframeInputMap = {};
  // obsoleted, use this.id
  _iframeId: MetaframeId;
  _parentId: MetapageId;
  _parentVersion: Versions;
  _isIframe: boolean;

  debug: boolean = false;
  ready: Promise<boolean>;
  color: string;
  plugin: MetaframePlugin;

  /**
   * This is the (locally) unique id that the parent metapage
   * assigns to the metaframe. Defaults to the name given in
   * then metapage definition.
   */
  // TODO obsoleted, use this.id
  // name:string;
  id: string;

  constructor() {
    super();
    this.debug = getUrlParamDEBUG();
    this._isIframe = Metaframe.isIframe();

    if (!this._isIframe) {
      //Don't add any of the machinery, it only works if we're iframes.
      //This will never return
      this.ready = new Promise((resolve, _) => {
        resolve(false);
      });
      this.log("Not an iframe, metaframe code disabled");
      return;
    }

    this.onWindowMessage = this.onWindowMessage.bind(this);

    window.addEventListener("message", this.onWindowMessage);

    //Get ready, request the parent to register to establish messaging pipes
    this.ready = new Promise(function (resolve, _) {
      // First listen to the parent metapage response
      this.once(JsonRpcMethodsFromParent.SetupIframeServerResponse, function (params : SetupIframeServerResponseData) {
        if (this._iframeId == null) {
          this._iframeId = params.iframeId;
          this.id = params.iframeId;
          this._parentVersion = params.version;
          this.color = stringToRgb(this._iframeId);
          this._parentId = params.parentId;
          this.log(
            `metapage[${this._parentId}](v${this._parentVersion
            ? this._parentVersion
            : "unknown"}) registered`);

          this._inputPipeValues = params.state != null && params.state.inputs != null
            ? params.state.inputs
            : this._inputPipeValues;

          //Tell the parent we have registered.
          this.sendRpc(JsonRpcMethodsFromChild.SetupIframeServerResponseAck, {version: this.version});

          //Send notifications of initial inputs (if non-null)
          //so you don't have to listen to the ready event if you don't want to
          if (this._inputPipeValues && this._inputPipeValues.keys().length > 0) {
            this.emit(MetaframeEvents.Inputs, this._inputPipeValues);
            Object.keys(this._inputPipeValues).forEach(pipeId => this.emit(MetaframeEvents.Input, pipeId, this._inputPipeValues[pipeId]));
          }

          // if this is a plugin, initialize the plugin object
          if (params.plugin) {
            this.plugin = new MetaframePlugin(this);
          }

          //Resolve AFTER sending inputs. This way consumers can either:
          //1) Just listen to inputs updates. The first will be when the metaframe is ready
          //2) Listen to the ready event, get the inputs if desired, and listen to subsequent
          //   inputs updates. You may not wish to respond to the first updates but you might
          //   want to know when the metaframe is ready
          //*** Does this distinction make sense?
          resolve(true);

          // window.addEventListener('resize', sendWindowDimensions);
          // sendWindowDimensions();
        } else {
          this.log("Got JsonRpcMethods.SetupIframeServerResponse but already resolved");
        }
      });
      // Now that we're listening, request to the parent to register us
      this.sendRpc(JsonRpcMethodsFromChild.SetupIframeClientRequest, {version: this.version});
    });
  }

  public log(o : any, color? : string, backgroundColor? : string) {
    if (!this.debug) {
      return;
    }
    this.logInternal(
      o, color != null
      ? color
      : this.color);
  }

  public warn(o : any) {
    if (!this.debug) {
      return;
    }
    this.logInternal(o, "000", this.color);
  }

  public error(err : any) {
    this.logInternal(err, this.color, "f00");
  }

  logInternal(o : any, color? : string, backgroundColor? : string) {
    let s: string;
    if (typeof o === "string") {
      s = o as string;
    } else if (typeof o === "number") {
      s = o + "";
    } else {
      s = JSON.stringify(o);
    }

    color = color != null
      ? color + ""
      : color;

    s = (
      this._iframeId != null
      ? "Metaframe[$_iframeId] "
      : "") + `${s}`;
    MetapageToolsLog(s, color, backgroundColor);
  }

  public dispose() {
    super.dispose();
    window.removeEventListener("message", this.onWindowMessage);
    this._inputPipeValues = null;
    this._outputPipeValues = null;
  }

  public addEventListener(event : MetaframeEvents, listener : any): () => void {
    const disposer = super.addEventListener(event, listener);

    //If it is an input or output, set the current input/output values when
    //attaching a listener on the next tick to ensure that the listener
    //will always get a value if it exists
    if (event === MetaframeEvents.Inputs) {
      window.setTimeout(() => {
        if (this._inputPipeValues != null) {
          listener(this._inputPipeValues);
        }
      }, 0);
    }

    return disposer;
  }

  public onInput(pipeId : MetaframePipeId, listener : any): () => void {
    return this.addEventListener(MetaframeEvents.Input, (pipe : MetaframePipeId, value : any) => {
      if (pipeId === pipe) {
        listener(value);
      }
    });
  }

  public onInputs(listener : (m : MetaframeInputMap) => void): () => void {
    return this.addEventListener(MetaframeEvents.Inputs, listener);
  }

  /**
   * This is a particular use case: metapage inputs are saved outside
   * the iframe, so when this iframe is restarted in the same metapage
   * it will start with this value. So in a way, it can be used for
   * state storage, by the metaframe itself.
   */
  public setInput(pipeId : MetaframePipeId, blob : any) {
    var inputs: MetaframeInputMap = {};
    inputs[pipeId] = blob;
    this.setInputs(inputs);
  }

  /**
   * This does NOT directly update internal inputs. It tells
   * the metapage parent, which then updates back. So if there
   * is no metapage parent, this will do nothing.
   *
   * @param inputs
   */
  public setInputs(inputs : MetaframeInputMap) {
    this.sendRpc(JsonRpcMethodsFromChild.InputsUpdate, inputs);
  }

  setInternalInputsAndNotify(inputs : MetaframeInputMap) {
    if (!this._inputPipeValues.merge(inputs)) {
      return;
    }
    Object.keys(inputs).forEach(pipeId => this.emit(MetaframeEvents.Input, pipeId, inputs[pipeId]));
    this.emit(MetaframeEvents.Inputs, inputs);
  }

  public getInput(pipeId : MetaframePipeId): any {
    console.assert(pipeId != null);
    return this._inputPipeValues.get(pipeId);
  }

  public getInputs(): MetaframeInputMap {
    return this._inputPipeValues;
  }

  public getOutput(pipeId : MetaframePipeId): any {
    console.assert(pipeId != null);
    return this._outputPipeValues.get(pipeId);
  }

  /**
   * What does setting this to null mean?
   * @param pipeId     :MetaframePipeId [description]
   * @param updateBlob :any        [description]
   */
  public setOutput(pipeId : MetaframePipeId, updateBlob : any): void {
    console.assert(pipeId != null);
    console.assert(updateBlob != null);

    var outputs: MetaframeInputMap = {};
    outputs[pipeId] = updateBlob;

    this.setOutputs(outputs);
  }

  public setOutputs(outputs : MetaframeInputMap): void {
    if (!this._outputPipeValues.merge(outputs)) {
      return;
    }
    this.sendRpc(JsonRpcMethodsFromChild.OutputsUpdate, outputs);
  }

  public getOutputs(): MetaframeInputMap {
    return this._outputPipeValues;
  }

  sendRpc(method : JsonRpcMethodsFromChild, params : any) {
    if (this._isIframe) {
      const message: MinimumClientMessage<any> = {
        jsonrpc: "2.0",
        id: null,
        // id     : MetapageTools.generateNonce(),
        method: method,
        params: params,
        iframeId: this._iframeId,
        parentId: this._parentId
      };
      this.log(message);
      window.parent.postMessage(message, "*");
    } else {
      this.error("Cannot send JSON-RPC window message: there is no window.parent which means we are not an iframe");
    }
  }

  onWindowMessage(e : any) {
    if (this.debug) {
      this.log("onWindowMessage: ${Json.stringify(e)}");
    }
    if (typeof e.data === "object") {
      let jsonrpc: MinimumClientMessage<any> = e.data;
      if (jsonrpc.jsonrpc === "2.0") {
        //Make sure this is a jsonrpc object
        var method = jsonrpc.method as JsonRpcMethodsFromParent;
        if (!(method == JsonRpcMethodsFromParent.SetupIframeServerResponse || (jsonrpc.parentId == this._parentId && jsonrpc.iframeId == this._iframeId))) {
          this.error(`window.message: received message but jsonrpc.parentId=${jsonrpc.parentId} _parentId=${this._parentId} jsonrpc.iframeId=${jsonrpc.iframeId} _iframeId=${this._iframeId}`);
          return;
        }

        switch (method) {
          case JsonRpcMethodsFromParent.SetupIframeServerResponse:
            break; //Handled elsewhere
          case JsonRpcMethodsFromParent.InputsUpdate:
            this.setInternalInputsAndNotify(jsonrpc.params.inputs);
            break;
          case JsonRpcMethodsFromParent.MessageAck:
            if (this.debug) 
              this.log("ACK: ${Json.stringify(jsonrpc)}");
            break;
          default:
            if (this.debug) 
              this.log("window.message: unknown JSON-RPC method: ${Json.stringify(jsonrpc)}");
            break;
        }

        this.emit(jsonrpc.method, jsonrpc.params);
        this.emit(MetaframeEvents.Message, jsonrpc);
      } else {
        //Some other message, e.g. webpack dev server, ignored
        if (this.debug) 
          this.log("window.message: not JSON-RPC: ${Json.stringify(jsonrpc)}");
        }
      } else {
      //Not an object, ignored
      if (this.debug) 
        this.log("window.message: not an object, ignored: ${Json.stringify(e)}");
      }
    }
}

/**
 * A special kind of metaframe that can get and set the metapage definition
 * and metapage state (so quite powerful).
 */
export class MetaframePlugin {
  _metaframe: Metaframe;

  constructor(metaframe : Metaframe) {
    this._metaframe = metaframe;
  }

  requestState() {
    var payload: ApiPayloadPluginRequest = {
      method: ApiPayloadPluginRequestMethod.State
    };
    this._metaframe.sendRpc(JsonRpcMethodsFromChild.PluginRequest, payload);
  }

  onState(listener : (_ : any) => void): () => void {
    const disposer = this._metaframe.onInput(METAPAGE_KEY_STATE, listener);
    if (this.getState() != null) {
      listener(this.getState());
    }
    return disposer;
  }

  getState(): any {
    return this._metaframe.getInput(METAPAGE_KEY_STATE);
  }

  setState(state : any) {
    this._metaframe.setOutput(METAPAGE_KEY_STATE, state);
  }

  onDefinition(listener : (a : any) => void): () => void {
    var disposer = this._metaframe.onInput(METAPAGE_KEY_DEFINITION, listener);
    if (this.getDefinition() != null) {
      listener(this.getDefinition());
    }
    return disposer;
  }

  setDefinition(definition : any) {
    this._metaframe.setOutput(METAPAGE_KEY_DEFINITION, definition);
  }

  getDefinition(): any {
    return this._metaframe.getInput(METAPAGE_KEY_DEFINITION);
  }
}
