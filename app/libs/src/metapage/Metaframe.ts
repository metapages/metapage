import {
  EventEmitter,
  ListenerFn,
} from 'eventemitter3';

import { VERSION_METAFRAME } from './Constants';
import {
  deserializeInputs,
  serializeInputs,
} from './data';
import {
  isDebugFromUrlsParams,
  log as MetapageToolsLog,
  merge,
  pageLoaded,
  stringToRgb,
} from './MetapageTools';
import { isIframe } from './Shared';
import {
  MetaframeInputMap,
} from './v0_4';
import {
  MetaframeId,
  MetaframePipeId,
  MetapageId,
} from './core';
import { MetapageEventUrlHashUpdate } from './events';
import { JsonRpcMethodsFromChild, JsonRpcMethodsFromParent, MinimumClientMessage, SetupIframeServerResponseData } from './jsonrpc';
import { VersionsMetapage } from './versions';

// TODO combine/unify MetaframeEvents and MetaframeLoadingState
export enum MetaframeLoadingState {
  WaitingForPageLoad = "WaitingForPageLoad",
  SentSetupIframeClientRequest = "SentSetupIframeClientRequest",
  Ready = "Ready",
}

export enum MetaframeEvents {
  Connected = "connected",
  Error = "error",
  Input = "input",
  Inputs = "inputs",
  Message = "message",
}

export type MetaframeOptions = {
  disableHashChangeEvent?: boolean;
};

export class Metaframe extends EventEmitter<
  MetaframeEvents | JsonRpcMethodsFromChild
> {
  public static readonly version = VERSION_METAFRAME;

  public static readonly ERROR = MetaframeEvents.Error;
  public static readonly CONNECTED = MetaframeEvents.Connected;
  public static readonly INPUT = MetaframeEvents.Input;
  public static readonly INPUTS = MetaframeEvents.Inputs;
  public static readonly MESSAGE = MetaframeEvents.Message;

  public static deserializeInputs = deserializeInputs;
  public static serializeInputs = serializeInputs;

  _inputPipeValues: MetaframeInputMap = {};
  _outputPipeValues: MetaframeInputMap = {};
  _parentId: MetapageId | undefined;
  _parentVersion: VersionsMetapage | undefined;
  _isIframe: boolean;
  _state: MetaframeLoadingState = MetaframeLoadingState.WaitingForPageLoad;
  _messageSendCount = 0;

  debug: boolean = isDebugFromUrlsParams();
  color: string | undefined;
  /**
   * If this is false, Files and Blobs will not be automatically serialized and deserialized
   * This is useful to avoid the overhead of serialization/deserialization if you know you won't be using it
   */
  isInputOutputBlobSerialization: boolean = true;

  /**
   * This is the (locally) unique id that the parent metapage
   * assigns to the metaframe via iframe.name which we get here as window.name
   */
  id: string = window.name;

  constructor(options?: MetaframeOptions) {
    super();
    this.debug = isDebugFromUrlsParams();
    this._isIframe = isIframe();

    this.addListener = this.addListener.bind(this);
    this.dispose = this.dispose.bind(this);
    this.error = this.error.bind(this);
    this.getInput = this.getInput.bind(this);
    this.getInputs = this.getInputs.bind(this);
    this.log = this.log.bind(this);
    this.logInternal = this.logInternal.bind(this);
    this.onInput = this.onInput.bind(this);
    this.onInputs = this.onInputs.bind(this);
    this.onMessage = this.onMessage.bind(this);
    this.sendRpc = this.sendRpc.bind(this);
    this.setInput = this.setInput.bind(this);
    this.setInputs = this.setInputs.bind(this);
    this.setInternalInputsAndNotify =
    this.setInternalInputsAndNotify.bind(this);
    this.setOutput = this.setOutput.bind(this);
    this.setOutputs = this.setOutputs.bind(this);
    this.warn = this.warn.bind(this);
    this._resolveSetupIframeServerResponse =
    this._resolveSetupIframeServerResponse.bind(this);
    this.addListenerReturnDisposer = this.addListenerReturnDisposer.bind(this);
    this.connected = this.connected.bind(this);
    this.disableNotifyOnHashUrlChange =
    this.disableNotifyOnHashUrlChange.bind(this);
    this._onHashUrlChange = this._onHashUrlChange.bind(this);

    if (!this._isIframe) {
      //Don't add any of the machinery, it only works if we're iframes.
      //This will never return
      // this.ready = new Promise((_) => {});
      this.log("Not an iframe, metaframe code disabled");
      return;
    }

    const thisRef = this;
    // Do no listen or send messages until the page is loaded
    // This iframe is not created UNTIL the parent page is loaded and listening to messages
    pageLoaded().then(() => {
      this.log("pageLoaded");
      window.addEventListener("message", this.onMessage);
      // Now that we're listening, request to the parent to register us so we can talk
      thisRef.sendRpc(JsonRpcMethodsFromChild.SetupIframeClientRequest, {
        version: Metaframe.version,
      });
      thisRef._state = MetaframeLoadingState.SentSetupIframeClientRequest;
    });

    if (!(options && options.disableHashChangeEvent)) {
      window.addEventListener("hashchange", this._onHashUrlChange);
    }
  }

  _resolveSetupIframeServerResponse(params: SetupIframeServerResponseData) {
    if (this._state === MetaframeLoadingState.WaitingForPageLoad) {
      throw "Got message but page has not finished loading, we should never get in this state";
    }

    (async () => {

      if (!this._parentId) {
        this._parentVersion = params.version;
        this.color = stringToRgb(this.id);
        this._parentId = params.parentId;
        this.log(
          `metapage[${this._parentId}](v${
            this._parentVersion ? this._parentVersion : "unknown"
          }) registered`
        );


        if (params.state && params.state.inputs) {
          if (this.isInputOutputBlobSerialization) {
            this._inputPipeValues = await deserializeInputs(params.state.inputs);
          } else {
            this._inputPipeValues = params.state.inputs;
          }
        }

        // this._inputPipeValues =
        //   params.state && params.state.inputs
        //     ? this.isInputOutputBlobSerialization
        //       ? deserializeInputs(params.state.inputs)
        //       : params.state.inputs
        //     : this._inputPipeValues;

        //Tell the parent we have registered.
        this._state = MetaframeLoadingState.Ready;
        // TODO why do we need  Metaframe.version here? It was sent in the initial SetupIframeClientRequest
        this.sendRpc(JsonRpcMethodsFromChild.SetupIframeServerResponseAck, {
          version: Metaframe.version,
        });

        //Send notifications of initial inputs (if non-null)
        //so you don't have to listen to the ready event if you don't want to
        if (
          this._inputPipeValues &&
          Object.keys(this._inputPipeValues).length > 0
        ) {
          this.emit(MetaframeEvents.Inputs, this._inputPipeValues);
          Object.keys(this._inputPipeValues).forEach((pipeId) =>
            this.emit(
              MetaframeEvents.Input,
              pipeId,
              this._inputPipeValues[pipeId]
            )
          );
        }

        this.emit(MetaframeEvents.Inputs, this._inputPipeValues);

        //Resolve AFTER sending inputs. This way consumers can either:
        //1) Just listen to inputs updates. The first will be when the metaframe is ready
        //2) Listen to the ready event, get the inputs if desired, and listen to subsequent
        //   inputs updates. You may not wish to respond to the first updates but you might
        //   want to know when the metaframe is ready
        //*** Does this distinction make sense?
        this.emit(MetaframeEvents.Connected);
      } else {
        this.log(
          "Got JsonRpcMethods.SetupIframeServerResponse but already resolved"
        );
      }
    })();
  }

  async connected(): Promise<void> {
    if (this._state === MetaframeLoadingState.Ready) {
      return;
    }
    return new Promise((resolve, _) => {
      let disposer: () => void;
      disposer = this.addListenerReturnDisposer(
        MetaframeEvents.Connected,
        () => {
          resolve();
          disposer();
        }
      );
    });
  }

  addListenerReturnDisposer(
    event: MetaframeEvents | JsonRpcMethodsFromChild,
    listener: ListenerFn<any[]>
  ): () => void {
    super.addListener(event, listener);
    const disposer = () => {
      super.removeListener(event, listener);
    };
    return disposer;
  }

  public log(o: any, color?: string, backgroundColor?: string) {
    if (!this.debug) {
      return;
    }
    this.logInternal(o, color ? color : this.color);
  }

  public warn(o: any) {
    if (!this.debug) {
      return;
    }
    this.logInternal(o, "000", this.color);
  }

  public error(err: any) {
    this.logInternal(err, this.color, "f00");
  }

  logInternal(o: any, color?: string, backgroundColor?: string) {
    let s: string;
    if (typeof o === "string") {
      s = o as string;
    } else if (typeof o === "number") {
      s = o + "";
    } else {
      s = JSON.stringify(o);
    }

    color = color ? color + "" : color;

    s = (this.id ? `Metaframe[${this.id}] ` : "") + `${s}`;
    MetapageToolsLog(s, color, backgroundColor);
  }

  public dispose() {
    super.removeAllListeners();
    window.removeEventListener("message", this.onMessage);
    this.disableNotifyOnHashUrlChange();
    // @ts-ignore
    this._inputPipeValues = undefined;
    // @ts-ignore
    this._outputPipeValues = undefined;
  }

  public addListener(
    event: MetaframeEvents | JsonRpcMethodsFromChild,
    listener: ListenerFn<any[]>
  ) {
    super.addListener(event, listener);

    //If it is an input or output, set the current input/output values when
    //attaching a listener on the next tick to ensure that the listener
    //will always get a value if it exists
    if (event === MetaframeEvents.Inputs) {
      window.setTimeout(() => {
        if (this._inputPipeValues) {
          listener(this._inputPipeValues);
        }
      }, 0);
    }
    return this;
  }

  public onInput(pipeId: MetaframePipeId, listener: any): () => void {
    return this.addListenerReturnDisposer(
      MetaframeEvents.Input,
      (pipe: MetaframePipeId, value: any) => {
        if (pipeId === pipe) {
          listener(value);
        }
      }
    );
  }

  public onInputs(listener: (m: MetaframeInputMap) => void): () => void {
    const disposer = this.addListenerReturnDisposer(
      MetaframeEvents.Inputs,
      listener
    );
    return disposer;
  }

  /**
   * This is a particular use case: metapage inputs are saved outside
   * the iframe, so when this iframe is restarted in the same metapage
   * it will start with this value. So in a way, it can be used for
   * state storage, by the metaframe itself.
   */
  public setInput(pipeId: MetaframePipeId, blob: any) {
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
  public async setInputs(inputs: MetaframeInputMap) {
    if (this.isInputOutputBlobSerialization) {
      inputs = await deserializeInputs(inputs);
    }
    this.sendRpc(JsonRpcMethodsFromChild.InputsUpdate, inputs);
  }

  async setInternalInputsAndNotify(inputs: MetaframeInputMap) {
    // this is where we deserialize the inputs

    if (this.isInputOutputBlobSerialization) {
      inputs = await deserializeInputs(inputs);
    }

    if (!merge(this._inputPipeValues, inputs)) {
      return;
    }

    Object.keys(inputs).forEach((pipeId) => {
      try {
        // if we don't actually need this event, we should remove it
        this.emit(MetaframeEvents.Input, pipeId, inputs[pipeId])
      } catch(err) {
        console.error(`Error emitting input ${pipeId}: ${err}`)
        this.emit(MetaframeEvents.Error, `Error emitting input ${pipeId}: ${err}`);
      }
    });
    try {
      this.emit(MetaframeEvents.Inputs, inputs);
    } catch(err) {
      console.error(`Error emitting inputs: ${err}`)
      this.emit(MetaframeEvents.Error, `Error emitting inputs: ${err}`);
    }
  }

  public getInput(pipeId: MetaframePipeId): any {
    console.assert(!!pipeId);
    return this._inputPipeValues[pipeId];
  }

  public getInputs(): MetaframeInputMap {
    return this._inputPipeValues;
  }

  /**
   * What does setting this to null mean?
   * @param pipeId     :MetaframePipeId [description]
   * @param updateBlob :any        [description]
   */
  public setOutput(pipeId: MetaframePipeId, updateBlob: any): void {
    console.assert(!!pipeId);

    var outputs: MetaframeInputMap = {};
    outputs[pipeId] = updateBlob;

    this.setOutputs(outputs);
  }

  public async setOutputs(outputs: MetaframeInputMap): Promise<void> {
    if (this.isInputOutputBlobSerialization) {
      outputs = await serializeInputs(outputs);
    }
    if (!merge(this._outputPipeValues, outputs)) {
      return;
    }
    this.sendRpc(JsonRpcMethodsFromChild.OutputsUpdate, outputs);
  }

  /**
   * If the hash params of our URL changes, e.g. from updating because
   * our state changed, then notify the parent metapage so that the
   * parent metapage can save the state
   */
  public disableNotifyOnHashUrlChange(): void {
    window.removeEventListener("hashchange", this._onHashUrlChange);
  }

  // public getHashParam(key:string): string {
  //   window.removeEventListener("hashchange", this._onHashUrlChange);
  // }



  /** Tell the parent metapage our hash params changed */
  _onHashUrlChange(_: any): void {
    const payload: MetapageEventUrlHashUpdate = {
      hash: window.location.hash,
      metaframe: this.id as MetaframeId,
    };
    this.sendRpc(JsonRpcMethodsFromChild.HashParamsUpdate, payload);
  }

  sendRpc(method: JsonRpcMethodsFromChild, params: any) {
    if (this._isIframe) {
      const message: MinimumClientMessage<any> = {
        jsonrpc: "2.0",
        id: ++this._messageSendCount, // just increment the counter for the id
        method: method,
        params: params,
        iframeId: this.id,
        parentId: this._parentId, // TODO this is likely not actually needed ? iframes cannot send to anyone but the parent? But the parent does not automatically know where a message comes from
      };
      if (window.parent) {
        window.parent.postMessage(message, "*");
      }
    } else {
      this.log(
        "Cannot send JSON-RPC window message: there is no window.parent which means we are not an iframe"
      );
    }
  }

  onMessage(e: MessageEvent) {
    if (typeof e.data === "object") {
      let jsonrpc: MinimumClientMessage<any> = e.data;
      if (jsonrpc.jsonrpc === "2.0") {
        //Make sure this is a jsonrpc object
        var method = jsonrpc.method as JsonRpcMethodsFromParent;
        if (
          !(
            method == JsonRpcMethodsFromParent.SetupIframeServerResponse ||
            (jsonrpc.parentId == this._parentId && jsonrpc.iframeId == this.id)
          )
        ) {
          this.log(
            `window.message: received message but jsonrpc.parentId=${jsonrpc.parentId} _parentId=${this._parentId} jsonrpc.iframeId=${jsonrpc.iframeId} id=${this.id}`
          );
          return;
        }

        switch (method) {
          case JsonRpcMethodsFromParent.SetupIframeServerResponse:
            this._resolveSetupIframeServerResponse(jsonrpc.params);
            break; //Handled elsewhere
          case JsonRpcMethodsFromParent.InputsUpdate:
            if (this._state !== MetaframeLoadingState.Ready) {
              throw "Got InputsUpdate but metaframe is not MetaframeLoadingState.Ready";
            }
            this.setInternalInputsAndNotify(jsonrpc.params.inputs);
            break;
          case JsonRpcMethodsFromParent.MessageAck:
            if (this.debug) this.log(`ACK: ${JSON.stringify(jsonrpc)}`);
            break;
          default:
            if (this.debug)
              this.log(
                `window.message: unknown JSON-RPC method: ${JSON.stringify(
                  jsonrpc
                )}`
              );
            break;
        }

        this.emit(MetaframeEvents.Message, jsonrpc);
      }
    }
  }
}