import {EventEmitter, ListenerFn} from "eventemitter3";
import {VERSION, METAPAGE_KEY_STATE, METAPAGE_KEY_DEFINITION} from "./Constants";
import {Versions} from "./MetaLibsVersion";
import {MetaframeInputMap, MetaframePipeId, MetaframeId, MetapageId} from "./v0_3/all";
import {
  ApiPayloadPluginRequest,
  ApiPayloadPluginRequestMethod,
  JsonRpcMethodsFromParent,
  JsonRpcMethodsFromChild,
  SetupIframeServerResponseData,
  MinimumClientMessage
} from "./v0_3/JsonRpcMethods";
import {getUrlParamDEBUG, stringToRgb, log as MetapageToolsLog, merge} from "./MetapageTools";

enum MetaframeEvents {
  Input = "input",
  Inputs = "inputs",
  Message = "message"
}

export const isIframe = (): boolean => {
  //http://stackoverflow.com/questions/326069/how-to-identify-if-a-webpage-is-being-loaded-inside-an-iframe-or-directly-into-t
  try {
    return window !== window.top;
  } catch (ignored) {
    return false;
  }
};

export class Metaframe extends EventEmitter < MetaframeEvents | JsonRpcMethodsFromChild > {
  public static readonly version = VERSION;

  public static readonly INPUT = MetaframeEvents.Input;
  public static readonly INPUTS = MetaframeEvents.Inputs;
  public static readonly MESSAGE = MetaframeEvents.Message;

  _inputPipeValues: MetaframeInputMap = {};
  _outputPipeValues: MetaframeInputMap = {};
  // obsoleted, use this.id
  _iframeId: MetaframeId | undefined;
  _parentId: MetapageId | undefined;
  _parentVersion: Versions | undefined;
  _isIframe: boolean;

  debug: boolean = false;
  ready: Promise<boolean>;
  color: string | undefined;
  plugin: MetaframePlugin | undefined;

  /**
   * This is the (locally) unique id that the parent metapage
   * assigns to the metaframe. Defaults to the name given in
   * then metapage definition.
   */
  // TODO obsoleted, use this.id
  // name:string;
  id: string | undefined;

  constructor() {
    super();
    this.debug = getUrlParamDEBUG();
    this._isIframe = isIframe();

    this.addListener = this.addListener.bind(this);
    this.dispose = this.dispose.bind(this);
    this.error = this.error.bind(this);
    this.getInput = this.getInput.bind(this);
    this.getInputs = this.getInputs.bind(this);
    this.getOutput = this.getOutput.bind(this);
    this.getOutputs = this.getOutputs.bind(this);
    this.log = this.log.bind(this);
    this.logInternal = this.logInternal.bind(this);
    this.onInput = this.onInput.bind(this);
    this.onInputs = this.onInputs.bind(this);
    this.onWindowMessage = this.onWindowMessage.bind(this);
    this.sendRpc = this.sendRpc.bind(this);
    this.setInput = this.setInput.bind(this);
    this.setInputs = this.setInputs.bind(this);
    this.setInternalInputsAndNotify = this.setInternalInputsAndNotify.bind(this);
    this.setOutput = this.setOutput.bind(this);
    this.setOutputs = this.setOutputs.bind(this);
    this.warn = this.warn.bind(this);
    this._resolveSetupIframeServerResponse = this._resolveSetupIframeServerResponse.bind(this);

    if (!this._isIframe) {
      //Don't add any of the machinery, it only works if we're iframes.
      //This will never return
      this.ready = new Promise((_) => {});
      this.log("Not an iframe, metaframe code disabled");
      return;
    }

    window.addEventListener("message", this.onWindowMessage);

    //Get ready, request the parent to register to establish messaging pipes
    const thisRef = this;
    this.ready = new Promise(function (resolve, _) {
      thisRef._resolver = resolve;
      // First listen to the parent metapage response
      // thisRef.once(JsonRpcMethodsFromParent.SetupIframeServerResponse, 
      // });
      // Now that we're listening, request to the parent to register us
      thisRef.sendRpc(JsonRpcMethodsFromChild.SetupIframeClientRequest, {version: Metaframe.version});
    });
  }

  _resolver :((val :boolean)=>void) | undefined;

  _resolveSetupIframeServerResponse (params : SetupIframeServerResponseData) {
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
      this.sendRpc(JsonRpcMethodsFromChild.SetupIframeServerResponseAck, {version: Metaframe.version});

      //Send notifications of initial inputs (if non-null)
      //so you don't have to listen to the ready event if you don't want to
      if (this._inputPipeValues && Object.keys(this._inputPipeValues).length > 0) {
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
      if (this._resolver) this._resolver(true);

      // window.addEventListener('resize', sendWindowDimensions);
      // sendWindowDimensions();
    } else {
      this.log("Got JsonRpcMethods.SetupIframeServerResponse but already resolved");
    }
  }

  addListenerReturnDisposer(event : MetaframeEvents | JsonRpcMethodsFromChild, listener : ListenerFn<any[]>): () => void {
    super.addListener(event, listener);
    const disposer = () => {
      super.removeListener(event, listener);
    };
    return disposer;
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
    super.removeAllListeners();
    window.removeEventListener("message", this.onWindowMessage);
    // @ts-ignore
    this._inputPipeValues = undefined;
    // @ts-ignore
    this._outputPipeValues = undefined;
  }

  public addListener(event : MetaframeEvents | JsonRpcMethodsFromChild, listener : ListenerFn<any[]>) {
    super.addListener(event, listener);

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
    return this;
  }

  public onInput(pipeId : MetaframePipeId, listener : any): () => void {
    return this.addListenerReturnDisposer(MetaframeEvents.Input, (pipe : MetaframePipeId, value : any) => {
      if (pipeId === pipe) {
        listener(value);
      }
    });
  }

  public onInputs(listener : (m : MetaframeInputMap) => void): () => void {
    return this.addListenerReturnDisposer(MetaframeEvents.Inputs, listener);
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
    if (!merge(this._inputPipeValues, inputs)) {
      return;
    }
    Object.keys(inputs).forEach(pipeId => this.emit(MetaframeEvents.Input, pipeId, inputs[pipeId]));
    this.emit(MetaframeEvents.Inputs, inputs);
  }

  public getInput(pipeId : MetaframePipeId): any {
    console.assert(pipeId != null);
    return this._inputPipeValues[pipeId];
  }

  public getInputs(): MetaframeInputMap {
    return this._inputPipeValues;
  }

  public getOutput(pipeId : MetaframePipeId): any {
    console.assert(pipeId != null);
    return this._outputPipeValues[pipeId];
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
    if (!merge(this._outputPipeValues, outputs)) {
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
        id: undefined,
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
            this._resolveSetupIframeServerResponse(jsonrpc.params);
            break; //Handled elsewhere
          case JsonRpcMethodsFromParent.InputsUpdate:
            this.setInternalInputsAndNotify(jsonrpc.params.inputs);
            break;
          case JsonRpcMethodsFromParent.MessageAck:
            if (this.debug) 
              this.log(`ACK: ${JSON.stringify(jsonrpc)}`);
            break;
          default:
            if (this.debug) 
              this.log(`window.message: unknown JSON-RPC method: ${JSON.stringify(jsonrpc)}`);
            break;
        }

        // this.emit(jsonrpc.method, jsonrpc.params);
        this.emit(MetaframeEvents.Message, jsonrpc);
      }
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
    this.requestState = this.requestState.bind(this);
    this.onState = this.onState.bind(this);
    this.getState = this.getState.bind(this);
    this.setState = this.setState.bind(this);
    this.onDefinition = this.onDefinition.bind(this);
    this.getDefinition = this.getDefinition.bind(this);
    this.setDefinition = this.setDefinition.bind(this);
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
