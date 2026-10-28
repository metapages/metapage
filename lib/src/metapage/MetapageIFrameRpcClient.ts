import { EventEmitter, ListenerFn } from "eventemitter3";

import { getHashParamValueJsonFromUrl } from "@metapages/hash-query";

import { VERSION_METAPAGE } from "./Constants";
import { convertMetaframeJsonToCurrentVersion } from "./conversions-metaframe";
import { Disposer, MetaframeId, MetaframePipeId, MetapageId } from "./core";
import { serializeInputs } from "./data";
import { MetapageEvents } from "./events";
import {
  ClientMessageRecievedAck,
  JsonRpcMethodsFromChild,
  JsonRpcMethodsFromParent,
  MinimumClientMessage,
  SetupIframeServerResponseData,
} from "./jsonrpc";
import { JsonRpcRequest } from "./jsonrpc2";
import {
  log as MetapageToolsLog,
  merge,
  pageLoaded,
  stringToRgb,
} from "./MetapageTools";
import { MetapageHashParams, MetapageShared } from "./Shared";
import { getMetaframeDefinitionFromUrl } from "./util";
import { MetaframeInputMap, MetapageInstanceInputs } from "./v0_4";
import { MetaframeDefinition } from "./v2";
import { VersionsMetaframe, VersionsMetapage } from "./versions";

/**
 * This class runs in the parent metapage, and connects the communication pipes
 * from the child metaframe iframe to the parent metapage.
 *
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
  _disposables: Disposer[] = [];
  _rpcListeners: ((r: JsonRpcRequest<any>) => void)[] = [];
  _loaded: boolean = false;
  _onLoaded: Disposer[] = [];
  // Set when the parent changes the iframe src: until the new document asks to
  // register, a SetupIframeServerResponseAck can only be from the old document
  // (see setUrl and registered)
  _awaitingSetupRequest: boolean = false;
  // The last mismatched origin reported, so a retrying metaframe at the wrong
  // origin is reported once, not on every retry
  _reportedOriginMismatch: string | undefined;
  // expectedOrigin, cached for the url it was computed from
  _expectedOriginUrl: string | undefined;
  _expectedOrigin: string | undefined;
  _parentId: MetapageId;
  _debug: boolean;
  _definition: MetaframeDefinition | undefined;

  _metapage: MetapageShared;

  constructor(
    metapage: MetapageShared,
    url: string,
    iframeId: MetaframeId,
    parentId: MetapageId,
    consoleBackgroundColor: string,
    debug: boolean = false,
  ) {
    super();
    // Url sanitation
    // Urls can be relative paths, if so, turn them into absolute URLs
    // Also local development often skips the "http:" part, so add that
    // on so the origin is valid
    if (!url.startsWith("data:") && !url.startsWith("http")) {
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
    this._debug = debug;
    // Add the custom URL params
    if (debug && !url.startsWith("data:")) {
      var urlBlob = new URL(this.url);
      urlBlob.searchParams.set(MetapageHashParams.mp_debug, "true");
      this.url = urlBlob.href;
    }

    this.id = iframeId;
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
          // check because possibly already disposed

          // iframe permissions (the "allow" attribute)
          // https://developer.mozilla.org/en-US/docs/Web/API/HTMLIFrameElement/allow
          // If there is an "allow" field in the frame definition in the metapage use that first
          if (this._metapage?._definition?.metaframes?.[this.id]?.allow) {
            selfThis._iframe.allow =
              this._metapage._definition.metaframes[this.id].allow!;
            if (this._debug) {
              this.log(
                `mf allow=${selfThis._iframe.allow} from this._metapage?._definition`,
              );
            }
          } else {
            // else use the url encoded definition
            let urlEncodedDefinition: MetaframeDefinition | undefined =
              getHashParamValueJsonFromUrl(this.url, "definition");

            urlEncodedDefinition =
              urlEncodedDefinition && urlEncodedDefinition?.version
                ? await convertMetaframeJsonToCurrentVersion(
                    urlEncodedDefinition,
                  )
                : undefined;
            if (!selfThis._iframe) {
              // possibly already disposed
              return;
            }
            if (urlEncodedDefinition?.allow) {
              selfThis._iframe.allow = urlEncodedDefinition.allow;
            } else {
              // Otherwise use whatever is in the metaframe.json
              let metaframeDef: MetaframeDefinition | undefined =
                await selfThis.getDefinition();
              if (this._debug) {
                this.log(`mf metaframeDef=${JSON.stringify(metaframeDef)}`);
              }
              metaframeDef =
                metaframeDef && metaframeDef?.version
                  ? await convertMetaframeJsonToCurrentVersion(metaframeDef)
                  : undefined;

              if (this._debug) {
                this.log(`mf metaframeDef=${JSON.stringify(metaframeDef)}`);
              }
              if (!selfThis._iframe) {
                // possibly already disposed
                return;
              }
              if (metaframeDef && metaframeDef.allow) {
                selfThis._iframe.allow = metaframeDef.allow;
              }
            }
          }
          // set the src after the allow attribute is set
          if (this._debug) {
            this.log(`mf allow=${selfThis._iframe.allow} from ${this.url}`);
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
    this.addListenerReturnDisposer = this.addListenerReturnDisposer.bind(this);
    this.isDisposed = this.isDisposed.bind(this);
  }

  addListenerReturnDisposer(
    event: JsonRpcMethodsFromParent | MetapageEvents,
    listener: ListenerFn<any[]>,
  ): Disposer {
    super.addListener(event, listener);
    const disposer = () => {
      super.removeListener(event, listener);
    };
    return disposer;
  }

  public setMetapage(metapage: MetapageShared): MetapageIFrameRpcClient {
    this._metapage = metapage;
    return this;
  }

  /**
   * The origin the document in the iframe must have for us to talk to it: the
   * origin of the configured url. "null" for data: urls (opaque origin).
   *
   * Origins are matched strictly (#40): a metaframe url that redirects to, or
   * a metaframe that navigates itself to, another origin is not sent anything
   * and its messages are ignored. Inputs can carry secrets, so they only ever
   * go to the origin written in the definition.
   *
   * Read on every message sent and received, so it is cached: parsing the url
   * each time costs ~0.2µs for a normal url but ~250µs for a 360KB data: url.
   * The cache is keyed on the url string rather than invalidated in setUrl,
   * because `url` is also assigned directly (e.g. when secrets are injected).
   */
  public get expectedOrigin(): string {
    if (this._expectedOriginUrl !== this.url) {
      this._expectedOriginUrl = this.url;
      try {
        this._expectedOrigin = new URL(this.url).origin;
      } catch (_) {
        this._expectedOrigin = "null";
      }
    }
    return this._expectedOrigin!;
  }

  /**
   * The postMessage targetOrigin. An opaque origin ("null", i.e. a data: url)
   * cannot be targeted: postMessage throws on a "data:..." targetOrigin. The
   * content of a data: url is written inline in the definition, so it is as
   * trusted as the metapage itself, and "*" is the only way to reach it.
   * Caveat: if a data: metaframe navigates itself away, messages sent before it
   * re-registers go to whatever it navigated to.
   */
  public get targetOrigin(): string {
    const origin = this.expectedOrigin;
    return origin === "null" ? "*" : origin;
  }

  /**
   * Point the iframe at a new url. Stops sending until the new document has
   * registered: anything sent before then reaches the old document (and if the
   * origin changed, the browser drops it with "The target origin provided does
   * not match the recipient window's origin"). Queued messages are flushed, and
   * all current inputs re-sent, by registered().
   */
  public setUrl(url: string) {
    this.url = url;
    this._loaded = false;
    this._awaitingSetupRequest = true;
    this._reportedOriginMismatch = undefined;
    if (this._iframe) {
      this._iframe.src = url;
    }
  }

  /**
   * A message the browser delivered to the metapage is from this metaframe
   * only if it came from the window in our iframe, at the expected origin.
   * Anything else is ignored. A registration request from our iframe at the
   * wrong origin (the url redirected, or the metaframe navigated away) is
   * reported once, since it otherwise leaves the metaframe silently blank.
   */
  public isMessageFromMetaframe(e: MessageEvent, method: string): boolean {
    if (!this._iframe || e.source !== this._iframe.contentWindow) {
      return false;
    }
    const expectedOrigin = this.expectedOrigin;
    if (e.origin === expectedOrigin) {
      return true;
    }
    if (
      method === JsonRpcMethodsFromChild.SetupIframeClientRequest &&
      this._reportedOriginMismatch !== e.origin
    ) {
      this._reportedOriginMismatch = e.origin;
      this._metapage?.error(
        `Metaframe "${this.id}" is at origin ${e.origin} but its url ${this.url} has origin ${expectedOrigin} (redirected, or navigated away?). Not connecting it: set the metaframe url to where it actually loads.`,
      );
    }
    return false;
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
  public async getDefinition(): Promise<MetaframeDefinition | undefined> {
    if (this._definition) {
      return this._definition;
    }

    try {
      const metaframeDef = await getMetaframeDefinitionFromUrl(this.url);
      if (metaframeDef) {
        this._definition = metaframeDef;
        return this._definition;
      }
    } catch (err: unknown) {
      // TODO: this should be retried?
      var url = this.getDefinitionUrl();
      // hmm silent on failures to load the metaframe.json?
      this.emit(
        MetapageEvents.Warning,
        `Failed to fetch or convert: ${url}\nError: ${
          (err as Error)?.message ? (err as Error)?.message : err?.toString()
        }`,
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

    const originalInputs = maybeNewInputs;
    this.inputs = merge(this.inputs, maybeNewInputs);
    if (this.inputs === originalInputs) {
      return this;
    }

    // Only send the new inputs to the actual metaframe iframe
    // if it's not registered, don't worry, inputs are merged,
    // and when the metaframe is registered, current inputs will
    // be sent (see registered())
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
    const originalOutputs = maybeNewOutputs;
    this.outputs = merge(this.outputs, maybeNewOutputs);
    if (this.outputs === originalOutputs) {
      return this;
    }

    this.emit(MetapageEvents.Outputs, maybeNewOutputs);

    if (this._metapage.listenerCount(MetapageEvents.Outputs) > 0) {
      var outputsUpdate: MetapageInstanceInputs = {};
      outputsUpdate[this.id] = maybeNewOutputs;
      this._metapage.emit(MetapageEvents.Outputs, outputsUpdate);
    }
  }

  public onInputs(f: (m: MetaframeInputMap) => void): Disposer {
    return this.addListenerReturnDisposer(MetapageEvents.Inputs, f);
  }

  public onInput(pipeName: MetaframePipeId, f: (_: any) => void): Disposer {
    var fWrap = function (inputs: MetaframeInputMap) {
      if (inputs.hasOwnProperty(pipeName)) {
        f(inputs[pipeName]);
      }
    };
    return this.addListenerReturnDisposer(MetapageEvents.Inputs, fWrap);
  }

  public onOutputs(f: (m: MetaframeInputMap) => void): Disposer {
    return this.addListenerReturnDisposer(MetapageEvents.Outputs, f);
  }

  public onOutput(pipeName: MetaframePipeId, f: (_: any) => void): Disposer {
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
   * Answer a metaframe's request to be registered: tell it its id, our id, and
   * the inputs it should start with.
   *
   * The iframe can send that request more than once (it reloads, is moved in
   * the DOM, or retried before our first answer arrived) so this is never
   * gated on the metaframe already being registered: the answer always carries
   * the current inputs, so a reloaded document starts with them rather than
   * waiting for the next upstream change.
   */
  public register() {
    // This request is from whatever document is in the iframe now
    this._awaitingSetupRequest = false;
    var response: SetupIframeServerResponseData = {
      iframeId: this.id,
      parentId: this._parentId,
      state: {
        inputs: this.inputs,
      },
      version: VERSION_METAPAGE as VersionsMetapage,
    };
    this.sendRpcInternal(
      JsonRpcMethodsFromParent.SetupIframeServerResponse,
      response,
    );
  }

  /**
   * The metaframe acknowledged our SetupIframeServerResponse: the channel to
   * the document currently in the iframe is live.
   *
   * This runs again every time the iframe re-registers, which happens whenever
   * its document is replaced: the metaframe navigated, the metapage changed its
   * url, or the iframe element was moved in the DOM (which reloads it).
   */
  public registered(version: VersionsMetaframe) {
    this.log({ m: "MetapageIFrameRpcClient.registered", inputs: this.inputs });
    if (!version) {
      throw "Cannot register without a version";
    }
    if (this._awaitingSetupRequest) {
      // The src changed since we last answered a registration request, so this
      // ack is from the old document, finishing its handshake late. Accepting
      // it would start sending to the old document before the new one loads.
      this.log("ignoring registration ack from the previous document");
      return;
    }
    this.version = version;
    this._loaded = true;
    // FIFO: these are queued messages, so the last one queued must be the last
    // one sent, otherwise an older input value overwrites a newer one
    while (this._onLoaded && this._onLoaded.length > 0) {
      this._onLoaded.shift()!();
    }
    // Always send the current inputs on registration, even if we believe the
    // metaframe already has them:
    //  - on a first registration they may have been updated between the
    //    SetupIframeServerResponse (which carries a snapshot) and this ack
    //  - on a re-registration everything we sent while the iframe was
    //    reloading went to a document that no longer exists, so the new one
    //    only has the snapshot from its own registration request. Anything
    //    newer than that snapshot is only here.
    // Inputs are a merge, so re-sending values the metaframe already has is
    // safe; dropping one is not.
    //
    // Sent even when there are none: a metaframe with no inputs yet (no pipes
    // into it, or nothing upstream has produced) has always been told so by an
    // empty InputsUpdate right after it registers, and some metaframes use
    // that as their cue to start (the container.mtfm.io leg of
    // worker/test io-pipe-names hangs without it).
    this.sendInputs(this.inputs);
  }

  async sendInputs(inputs: MetaframeInputMap) {
    if (!inputs) {
      return;
    }
    inputs = await serializeInputs(inputs);
    if (this.isDisposed()) {
      return;
    }
    this.sendRpc(JsonRpcMethodsFromParent.InputsUpdate, {
      inputs: inputs,
      parentId: this._parentId,
    });
  }

  public sendRpc(method: string, params: any) {
    if (this?._iframe?.parentNode && this._loaded) {
      this.sendRpcInternal(method, params);
    } else {
      this?._metapage?.error("sending rpc later");
      const thing = this;
      this?._onLoaded.push(() => {
        thing.sendRpcInternal(method, params);
      });
    }
  }

  public ack(message: any) {
    if (this._debug) {
      this.log("⚒ ⚒ ⚒ sending ack from client to frame");
      var payload: ClientMessageRecievedAck<any> = {
        message: message,
      };
      this.sendRpc(JsonRpcMethodsFromParent.MessageAck, payload);
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
      this._consoleBackgroundColor,
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
      if (this._metapage) {
        this._metapage.error(
          `Cannot send to child iframe messageJSON=${JSON.stringify(
            messageJSON,
          ).substring(0, 200)}`,
        );
      } else {
        console.error(
          `Cannot send to child iframe messageJSON=${JSON.stringify(
            messageJSON,
          ).substring(0, 200)}`,
        );
      }
    }
  }

  _bufferMessages: any[] | undefined;
  _bufferTimeout: number | undefined;
  sendOrBufferPostMessage(message: any) {
    if (this._iframe && this._iframe.contentWindow) {
      this._iframe.contentWindow.postMessage(message, this.targetOrigin);
    } else {
      if (!this._bufferMessages) {
        this._bufferMessages = [message];
        const thing = this;
        this._bufferTimeout = window.setInterval(function () {
          if (thing._iframe && thing._iframe.contentWindow) {
            thing._bufferMessages!.forEach((m) =>
              thing._iframe!.contentWindow!.postMessage(m, thing.targetOrigin),
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
