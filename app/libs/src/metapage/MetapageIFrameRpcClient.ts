import { EventEmitter, ListenerFn } from "eventemitter3";
import {
  VERSION_METAPAGE,
  METAPAGE_KEY_STATE,
  METAPAGE_KEY_DEFINITION,
} from "./Constants";
import {
  JsonRpcMethodsFromParent,
  SetupIframeServerResponseData,
  MinimumClientMessage,
  ClientMessageRecievedAck,
  MetaframeInputMap,
  MetaframePipeId,
  MetaframeId,
  MetapageId,
  MetapageInstanceInputs,
  VersionsMetapage,
  VersionsMetaframe,
  MetaframeDefinitionV6,
} from "./v0_4";
import {
  stringToRgb,
  log as MetapageToolsLog,
  merge,
  pageLoaded,
  convertMetaframeJsonToCurrentVersion,
} from "./MetapageTools";
import { JsonRpcRequest } from "./jsonrpc2";
import { MetapageShared, MetapageHashParams } from "./Shared";
import { MetapageEvents } from "./v0_4/events";
import { serializeInputs } from "./data";

/**
 * Initialization sequence:
 *   1. the child iframe object waits until its page loads
 *   2. the child iframe object sends SetupIframeClientRequest
 *     - this marks the iframe as ready
 */
export class MetapageIFrameRpcClient extends EventEmitter<
  JsonRpcMethodsFromParent | MetapageEvents
> {
  iframe: Promise<HTMLIFrameElement>;
  _iframe: HTMLIFrameElement;
  id: MetaframeId;
  version: VersionsMetaframe | undefined;
  // Used for securing postMessage
  url: string;
  _color: string;
  _consoleBackgroundColor: string;
  inputs: MetaframeInputMap = {};
  outputs: MetaframeInputMap = {};
  _disposables: (() => void)[] = [];
  _rpcListeners: ((r: JsonRpcRequest<any>) => void)[] = [];
  _loaded: boolean = false;
  _onLoaded: (() => void)[] = [];
  _parentId: MetapageId;
  _debug: boolean;
  _sendInputsAfterRegistration: boolean = false;
  _definition: MetaframeDefinitionV6 | undefined;
  _plugin: boolean = false;

  _metapage: MetapageShared;

  constructor(
    metapage: MetapageShared,
    url: string,
    iframeId: MetaframeId,
    parentId: MetapageId,
    consoleBackgroundColor: string,
    debug: boolean = false
  ) {
    super();
    // Url sanitation
    // Urls can be relative paths, if so, turn them into absolute URLs
    // Also local development often skips the "http:" part, so add that
    // on so the origin is valid
    if (!url.startsWith("http")) {
      while (url.startsWith("/")) {
        url = url.substring(1);
      }
      url =
        window.location.protocol +
        "//" +
        window.location.hostname +
        (window.location.port && window.location.port != ""
          ? ":" + window.location.port
          : "") +
        "/" +
        url;
    }
    this.url = url;
    this._metapage = metapage;

    // Add the custom URL params
    var urlBlob = new URL(this.url);
    if (debug) {
      urlBlob.searchParams.set(MetapageHashParams.mp_debug, "true");
    }
    this.url = urlBlob.href;

    this.id = iframeId;

    this._debug = debug;

    this._parentId = parentId;
    this._color = stringToRgb(this.id);
    this._consoleBackgroundColor = consoleBackgroundColor;

    // Create but do not attach to the dom until the src attribute is set https://github.com/metapages/metapage/issues/91
    this._iframe = document.createElement("iframe");
    this._iframe.name = this.id;
    const selfThis = this;
    this.iframe = new Promise((resolve) => {
      // wait until the metapage page is loaded, otherwise
      // communication errors will likely occur
      pageLoaded().then(async () => {
        // parent page loaded, set the iframe src to start loading
        // get the definition in case we need to set allow permissions
        if (selfThis._iframe) {
          // possibly already disposed
          const metaframeDef = await selfThis.getDefinition();
          if (!selfThis._iframe) {
            // possibly already disposed
            return;
          }
          // https://developer.mozilla.org/en-US/docs/Web/HTTP/Feature_Policy/Using_Feature_Policy#the_iframe_allow_attribute
          if (metaframeDef && metaframeDef.allow) {
            selfThis._iframe.allow = metaframeDef.allow;
          }
          selfThis._iframe.src = this.url;
          resolve(selfThis._iframe);
        }
      });
    });

    this.ack = this.ack.bind(this);
    this.dispose = this.dispose.bind(this);
    this.getDefinition = this.getDefinition.bind(this);
    this.getDefinitionUrl = this.getDefinitionUrl.bind(this);
    this.setPlugin = this.setPlugin.bind(this);
    this.hasPermissionsDefinition = this.hasPermissionsDefinition.bind(this);
    this.hasPermissionsState = this.hasPermissionsState.bind(this);
    this.log = this.log.bind(this);
    this.logInternal = this.logInternal.bind(this);
    this.onInput = this.onInput.bind(this);
    this.onInputs = this.onInputs.bind(this);
    this.onOutput = this.onOutput.bind(this);
    this.onOutputs = this.onOutputs.bind(this);
    this.register = this.register.bind(this);
    this.registered = this.registered.bind(this);
    this.sendInputs = this.sendInputs.bind(this);
    this.sendOrBufferPostMessage = this.sendOrBufferPostMessage.bind(this);
    this.sendRpc = this.sendRpc.bind(this);
    this.sendRpcInternal = this.sendRpcInternal.bind(this);
    this.setInput = this.setInput.bind(this);
    this.setInputs = this.setInputs.bind(this);
    this.setMetapage = this.setMetapage.bind(this);
    this.setOutput = this.setOutput.bind(this);
    this.setOutputs = this.setOutputs.bind(this);
    this.setPlugin = this.setPlugin.bind(this);
    this.addListenerReturnDisposer = this.addListenerReturnDisposer.bind(this);
    this.isDisposed = this.isDisposed.bind(this);
  }

  addListenerReturnDisposer(
    event: JsonRpcMethodsFromParent | MetapageEvents,
    listener: ListenerFn<any[]>
  ): () => void {
    super.addListener(event, listener);
    const disposer = () => {
      super.removeListener(event, listener);
    };
    return disposer;
  }

  public setPlugin(): MetapageIFrameRpcClient {
    if (this._loaded) {
      throw "Cannot setPlugin after MetapageIFrameRpcClient already loaded";
    }
    this._plugin = true;
    return this;
  }

  public setMetapage(metapage: MetapageShared): MetapageIFrameRpcClient {
    this._metapage = metapage;
    return this;
  }

  public hasPermissionsState(): boolean {
    return (
      this._definition !== undefined &&
      this._definition.inputs !== undefined &&
      this._definition.inputs![METAPAGE_KEY_STATE] !== undefined
    );
  }

  public hasPermissionsDefinition(): boolean {
    return (
      this._definition !== undefined &&
      this._definition.inputs !== undefined &&
      this._definition.inputs![METAPAGE_KEY_DEFINITION] !== undefined
    );
  }

  public getDefinitionUrl(): string {
    var url = new URL(this.url);
    url.pathname =
      url.pathname +
      (url.pathname.endsWith("/") ? "metaframe.json" : "/metaframe.json");
    return url.href;
  }

  /**
   * Cached in memory. Fetches <metaframe url>/metaframe.json
   * metaframe.json defines inputs/outputs and other metadata
   * (how to operate and connect the metaframe)
   * It is optional in that the metaframe will still work without it
   * but advanced features e.g. allow permissions won't work and
   * anything relying on metadata.
   */
  public async getDefinition(): Promise<MetaframeDefinitionV6 | undefined> {
    if (this._definition) {
      return this._definition;
    }
    var url = this.getDefinitionUrl();
    try {
      // this should be retried?
      const response = await window.fetch(url);
      if (response.ok) {
        const metaframeDef = await response.json();

        const metaframeDefCurrent =
          convertMetaframeJsonToCurrentVersion(metaframeDef);
        this._definition = metaframeDefCurrent;
        return this._definition;
      } else {
        this.emit(
          MetapageEvents.Error,
          `Failed to fetch: ${url}\nStatus: ${response.status}\nStatus text: ${response.statusText}`
        );
      }
    } catch (err) {
      // hmm silent on failures to load the metaframe.json?
      this.emit(
        MetapageEvents.Error,
        `Failed to fetch or convert: ${url}\nError: ${err}`
      );
    }
  }

  public setInput(name: MetaframePipeId, inputBlob: any) {
    console.assert(!!name);
    var inputs: MetaframeInputMap = {};
    inputs[name] = inputBlob;
    this.setInputs(inputs);
  }

  /**
   * Sends the updated inputs to the iframe
   */
  _cachedEventInputsUpdate: {
    iframeId: string | undefined;
    inputs: MetaframeInputMap | undefined;
  } = {
    iframeId: undefined,
    inputs: undefined,
  };
  public setInputs(maybeNewInputs: MetaframeInputMap): MetapageIFrameRpcClient {
    this.log({ m: "MetapageIFrameRpcClient", inputs: maybeNewInputs });
    if (!merge(this.inputs, maybeNewInputs)) {
      return this;
    }
    if (!this._loaded) {
      this._sendInputsAfterRegistration = true;
    }
    // Only send the new inputs to the actual metaframe iframe
    // if it's not registered, don't worry, inputs are merged,
    // and when the metaframe is registered, current inputs will
    // be sent
    if (this._iframe.parentNode && this._loaded) {
      this.sendInputs(maybeNewInputs);
    }

    // Notify
    this.emit(MetapageEvents.Inputs, this.inputs);
    if (this._metapage.listenerCount(MetapageEvents.Inputs) > 0) {
      var inputUpdate: MetapageInstanceInputs = {};
      inputUpdate[this.id] = maybeNewInputs;
      this._metapage.emit(MetapageEvents.Inputs, inputUpdate);
    }
    // //TODO is this really used anymore?
    // this._cachedEventInputsUpdate.iframeId = this.id;
    // this._cachedEventInputsUpdate.inputs = this.inputs;
    // this._metapage.emit(JsonRpcMethodsFromParent.InputsUpdate, this._cachedEventInputsUpdate);

    return this;
  }

  public setOutput(pipeId: MetaframePipeId, updateBlob: any) {
    console.assert(!!pipeId);
    var outputs: MetaframeInputMap = {};
    outputs[pipeId] = updateBlob;
    this.setOutputs(outputs);
  }

  _cachedEventOutputsUpdate = {
    iframeId: null,
    inputs: null,
  };
  public setOutputs(maybeNewOutputs: MetaframeInputMap) {
    if (!merge(this.outputs, maybeNewOutputs)) {
      return;
    }
    this.emit(MetapageEvents.Outputs, maybeNewOutputs);

    if (this._metapage.listenerCount(MetapageEvents.Outputs) > 0) {
      var outputsUpdate: MetapageInstanceInputs = {};
      outputsUpdate[this.id] = this.outputs;
      this._metapage.emit(MetapageEvents.Outputs, outputsUpdate);
    }
  }

  public onInputs(f: (m: MetaframeInputMap) => void): () => void {
    return this.addListenerReturnDisposer(MetapageEvents.Inputs, f);
  }

  public onInput(pipeName: MetaframePipeId, f: (_: any) => void): () => void {
    var fWrap = function (inputs: MetaframeInputMap) {
      if (inputs.hasOwnProperty(pipeName)) {
        f(inputs[pipeName]);
      }
    };
    return this.addListenerReturnDisposer(MetapageEvents.Inputs, fWrap);
  }

  public onOutputs(f: (m: MetaframeInputMap) => void): () => void {
    return this.addListenerReturnDisposer(MetapageEvents.Outputs, f);
  }

  public onOutput(pipeName: MetaframePipeId, f: (_: any) => void): () => void {
    var fWrap = function (outputs: MetaframeInputMap) {
      if (outputs.hasOwnProperty(pipeName)) {
        f(outputs[pipeName]);
      }
    };
    return this.addListenerReturnDisposer(MetapageEvents.Outputs, fWrap);
  }

  public isDisposed() {
    return this.inputs === undefined;
  }

  public dispose() {
    super.removeAllListeners();
    while (this._disposables && this._disposables.length > 0) {
      const val = this._disposables.pop();
      if (val) {
        val();
      }
    }
    // @ts-ignore
    this._rpcListeners = undefined;
    // @ts-ignore
    this.inputs = undefined;
    // @ts-ignore
    this.outputs = undefined;
    // @ts-ignore
    if (this._iframe && this._iframe.parentNode) {
      this._iframe.parentNode.removeChild(this._iframe);
    }
    // @ts-ignore
    this._iframe = undefined;
    // @ts-ignore
    this._bufferMessages = undefined;
    if (this._bufferTimeout) {
      window.clearInterval(this._bufferTimeout);
      // @ts-ignore
      this._bufferTimeout = undefined;
    }
    // @ts-ignore
    this._metapage = undefined;
  }

  /**
   * Request that the parent metapage tell us what our id is.
   * The iframe might send this message more than once (it reloads for some reason)
   * so we can't gate this request if we think the metaframe
   * is already registered.
   */
  public register() {
    var response: SetupIframeServerResponseData = {
      iframeId: this.id,
      parentId: this._parentId,
      plugin: this._plugin,
      state: {
        inputs: this.inputs,
      },
      version: VERSION_METAPAGE as VersionsMetapage,
    };
    this.sendRpcInternal(
      JsonRpcMethodsFromParent.SetupIframeServerResponse,
      response
    );
  }

  public registered(version: VersionsMetaframe) {
    this.log({ m: "MetapageIFrameRpcClient.registered", inputs: this.inputs });
    if (this._loaded) {
      return;
    }
    if (!version) {
      throw "Cannot register without a version";
    }
    this.version = version;
    this._loaded = true;
    while (this._onLoaded && this._onLoaded.length > 0) {
      this._onLoaded.pop()!();
    }
    // You still need to set the inputs even though they
    // may have been set initially, because the inputs may
    // have been been updated before the metaframe internal
    // returned its server ack.
    if (this._sendInputsAfterRegistration) {
      this.sendInputs(this.inputs);
    }
  }

  async sendInputs(inputs: MetaframeInputMap) {
    inputs = await serializeInputs(inputs);
    this.sendRpc(JsonRpcMethodsFromParent.InputsUpdate, {
      inputs: inputs,
      parentId: this._parentId,
    });
  }

  public sendRpc(method: string, params: any) {
    if (this._iframe.parentNode && this._loaded) {
      this.sendRpcInternal(method, params);
    } else {
      this._metapage.error("sending rpc later");
      const thing = this;
      this._onLoaded.push(() => {
        thing.sendRpcInternal(method, params);
      });
    }
  }

  public ack(message: any) {
    this.log("⚒ ⚒ ⚒ calling ack");
    if (this._debug) {
      this.log("⚒ ⚒ ⚒ sending ack from client to frame");
      var payload: ClientMessageRecievedAck<any> = {
        message: message,
      };
      this.sendRpc(JsonRpcMethodsFromParent.MessageAck, payload);
    } else {
      this.log(
        "⚒ ⚒ ⚒ NOT sending ack from client to frame since not debug mode"
      );
    }
  }

  public log(o: any) {
    if (!this._debug) {
      return;
    }
    this.logInternal(o);
  }

  logInternal(o: any) {
    let s: string;
    if (typeof o === "string") {
      s = o as string;
    } else if (typeof o === "string") {
      s = o + "";
    } else {
      s = JSON.stringify(o);
    }
    MetapageToolsLog(
      `Metapage[${this._parentId}] Metaframe[${this.id}] ${s}`,
      this._color,
      this._consoleBackgroundColor
    );
  }

  sendRpcInternal(method: string, params: any) {
    const messageJSON: MinimumClientMessage<any> = {
      id: "_",
      iframeId: this.id,
      jsonrpc: "2.0",
      method: method,
      params: params,
      parentId: this._parentId,
    };
    if (this._iframe) {
      this.sendOrBufferPostMessage(messageJSON);
    } else {
      this._metapage.error(
        `Cannot send to child iframe messageJSON=${JSON.stringify(
          messageJSON
        ).substring(0, 200)}`
      );
    }
  }

  _bufferMessages: any[] | undefined;
  _bufferTimeout: number | undefined;
  sendOrBufferPostMessage(message: any) {
    if (this._iframe && this._iframe.contentWindow) {
      this._iframe.contentWindow.postMessage(message, this.url);
    } else {
      if (!this._bufferMessages) {
        this._bufferMessages = [message];
        const thing = this;
        this._bufferTimeout = window.setInterval(function () {
          if (thing._iframe && thing._iframe.contentWindow) {
            thing._bufferMessages!.forEach((m) =>
              thing._iframe!.contentWindow!.postMessage(m, thing.url)
            );
            window.clearInterval(thing._bufferTimeout);
            thing._bufferTimeout = undefined;
            thing._bufferMessages = undefined;
          }
        }, 0);
      } else {
        this._bufferMessages.push(message);
      }
    }
  }
}
