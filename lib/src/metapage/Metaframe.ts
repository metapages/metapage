import { EventEmitter, ListenerFn } from "eventemitter3";

import {
  getHashParamFromWindow,
  getHashParamValueBase64DecodedFromWindow,
  getHashParamValueBooleanFromWindow,
  getHashParamValueFloatFromWindow,
  getHashParamValueIntFromWindow,
  getHashParamValueJsonFromWindow,
  setHashParamInWindow,
  setHashParamValueBase64EncodedInWindow,
  setHashParamValueBooleanInWindow,
  setHashParamValueFloatInWindow,
  setHashParamValueIntInWindow,
  setHashParamValueJsonInWindow,
} from "@metapages/hash-query";

import { VERSION_METAFRAME } from "./Constants";
import { Disposer, MetaframeId, MetaframePipeId, MetapageId } from "./core";
import { deserializeInputs, serializeInputs } from "./data";
import { MetapageEventUrlHashUpdate } from "./events";
import {
  JsonRpcMethodsFromChild,
  JsonRpcMethodsFromParent,
  MinimumClientMessage,
  SetupIframeClientRequestData,
  SetupIframeServerResponseData,
} from "./jsonrpc";
import {
  isDebugFromUrlsParams,
  log as MetapageToolsLog,
  merge,
  pageLoaded,
  stringToRgb,
} from "./MetapageTools";
import { isIframe } from "./Shared";
import { MetaframeInputMap } from "./v0_4";
import { VersionsMetapage } from "./versions";

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

/**
 * SetupIframeClientRequest is retried until the parent answers: the parent may
 * not have attached its postMessage listener when we send the first one, and a
 * single dropped request used to leave this metaframe blank forever.
 * Backs off from the first to the max interval, then keeps polling at the max.
 */
export const SETUP_REQUEST_RETRY_INTERVAL_START_MS = 200;
export const SETUP_REQUEST_RETRY_INTERVAL_MAX_MS = 5000;

/**
 * How many InputsUpdate messages that arrive before registration completes are
 * kept. The parent re-sends the complete current inputs every time we register,
 * so overflowing this buffer costs intermediate values, never the latest state.
 */
export const PRE_REGISTRATION_INPUTS_BUFFER_MAX = 100;

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
  _setupRequestTimeout: number | undefined;
  _setupRequestRetryIntervalMs: number = SETUP_REQUEST_RETRY_INTERVAL_START_MS;
  /** Number of SetupIframeClientRequest messages sent, for tests and debugging */
  _setupRequestSendCount = 0;
  /**
   * InputsUpdate messages that arrived before registration finished, kept in
   * arrival order and applied as soon as we are registered. See
   * `_bufferInputsUpdate`.
   */
  _pendingInputsUpdates: {
    parentId: MetapageId | undefined;
    inputs: MetaframeInputMap;
  }[] = [];
  /**
   * Applying an input update is asynchronous (deserializing can hit the
   * network), so updates are chained through this promise to apply in the
   * order they arrived. See `setInternalInputsAndNotify`.
   */
  _inputsApplyQueue: Promise<void> = Promise.resolve();
  /**
   * Set by `dispose()`. Registration and input updates resolve asynchronously,
   * so they check this after every await: a disposed instance must not touch
   * its (cleared) state, ack the parent, or emit.
   */
  _disposed = false;
  /**
   * The parent metapage asked for binary outputs as-is rather than as data
   * URLs (see MetapageOptionsV1.passByReference). Set on every registration.
   */
  _passByReference = false;

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
    this._setInternalInputsAndNotify =
      this._setInternalInputsAndNotify.bind(this);
    this._bufferInputsUpdate = this._bufferInputsUpdate.bind(this);
    this._drainPendingInputsUpdates =
      this._drainPendingInputsUpdates.bind(this);
    this._deserializeInputsKeepingFailures =
      this._deserializeInputsKeepingFailures.bind(this);
    this._reportError = this._reportError.bind(this);
    this.setOutput = this.setOutput.bind(this);
    this.setOutputs = this.setOutputs.bind(this);
    this.warn = this.warn.bind(this);
    this._resolveSetupIframeServerResponse =
      this._resolveSetupIframeServerResponse.bind(this);
    this.addListenerReturnDisposer = this.addListenerReturnDisposer.bind(this);
    this.connected = this.connected.bind(this);
    this.isConnected = this.isConnected.bind(this);
    this._sendSetupRequestUntilRegistered =
      this._sendSetupRequestUntilRegistered.bind(this);
    this._cancelSetupRequestRetry = this._cancelSetupRequestRetry.bind(this);
    this.disableNotifyOnHashUrlChange =
      this.disableNotifyOnHashUrlChange.bind(this);
    this._onHashUrlChange = this._onHashUrlChange.bind(this);

    this.setParameter = this.setParameter.bind(this);
    this.setParameterBoolean = this.setParameterBoolean.bind(this);
    this.setParameterJson = this.setParameterJson.bind(this);
    this.setParameterBase64 = this.setParameterBase64.bind(this);
    this.setParameterFloat = this.setParameterFloat.bind(this);
    this.setParameterInt = this.setParameterInt.bind(this);
    this.getParameter = this.getParameter.bind(this);
    this.getParameterBoolean = this.getParameterBoolean.bind(this);
    this.getParameterJson = this.getParameterJson.bind(this);
    this.getParameterBase64 = this.getParameterBase64.bind(this);
    this.getParameterFloat = this.getParameterFloat.bind(this);
    this.getParameterInt = this.getParameterInt.bind(this);
    this.deleteParameter = this.deleteParameter.bind(this);

    if (!this._isIframe) {
      //Don't add any of the machinery, it only works if we're iframes.
      //This will never return
      // this.ready = new Promise((_) => {});
      this.log("Not an iframe, metaframe code disabled");
      return;
    }

    const thisRef = this;
    // Do no listen or send messages until the page is loaded
    pageLoaded().then(() => {
      this.log("pageLoaded");
      window.addEventListener("message", this.onMessage);
      // Now that we're listening, request to the parent to register us so we can talk.
      // The parent may not be listening yet, so this keeps asking until it answers.
      thisRef._sendSetupRequestUntilRegistered();
    });

    if (!(options && options.disableHashChangeEvent)) {
      window.addEventListener("hashchange", this._onHashUrlChange);
    }
  }

  /**
   * Ask the parent metapage to register us, and keep asking until it answers.
   *
   * The parent only starts listening to postMessage when its own page has
   * loaded, and this iframe is not guaranteed to be created after that point:
   * a slow parent page (or one that creates iframes from an async definition)
   * can miss this request entirely. Since the request was previously sent
   * exactly once, a single miss left the metaframe permanently blank.
   */
  _sendSetupRequestUntilRegistered() {
    this._cancelSetupRequestRetry();
    if (this._state === MetaframeLoadingState.Ready) {
      return;
    }
    const request: SetupIframeClientRequestData = {
      version: Metaframe.version,
      // We can receive binary values as-is: deserializing leaves anything
      // that is not a data URL untouched. Not if we skip deserializing
      // (isInputOutputBlobSerialization = false): such a metaframe handles
      // data URLs itself and would be handed raw values it does not expect.
      passByReference: this.isInputOutputBlobSerialization,
    };
    this.sendRpc(JsonRpcMethodsFromChild.SetupIframeClientRequest, request);
    this._setupRequestSendCount++;
    this._state = MetaframeLoadingState.SentSetupIframeClientRequest;
    this._setupRequestTimeout = window.setTimeout(() => {
      this._setupRequestTimeout = undefined;
      this._setupRequestRetryIntervalMs = Math.min(
        this._setupRequestRetryIntervalMs * 2,
        SETUP_REQUEST_RETRY_INTERVAL_MAX_MS,
      );
      this._sendSetupRequestUntilRegistered();
    }, this._setupRequestRetryIntervalMs);
  }

  _cancelSetupRequestRetry() {
    if (this._setupRequestTimeout !== undefined) {
      window.clearTimeout(this._setupRequestTimeout);
      this._setupRequestTimeout = undefined;
    }
  }

  _resolveSetupIframeServerResponse(params: SetupIframeServerResponseData) {
    if (this._disposed) {
      return;
    }
    if (this._state === MetaframeLoadingState.WaitingForPageLoad) {
      throw "Got message but page has not finished loading, we should never get in this state";
    }

    // The parent answered: stop asking. Done synchronously (rather than when
    // the async registration below completes) so a slow deserialization of the
    // initial inputs does not send redundant requests.
    this._cancelSetupRequestRetry();

    // Already registered with this same parent: our retry crossed the parent's
    // first answer, or the parent asked us to register again. Acknowledge it
    // again rather than dropping it: the parent sends the current inputs on
    // every ack, so a silently ignored response leaves the parent believing we
    // received inputs that went into our previous (now replaced) document.
    if (this._parentId && this._parentId === params.parentId) {
      this.log(
        "Got JsonRpcMethods.SetupIframeServerResponse but already resolved, re-acking",
      );
      this.sendRpc(JsonRpcMethodsFromChild.SetupIframeServerResponseAck, {
        version: Metaframe.version,
      });
      return;
    }

    (async () => {
      // Either our first registration, or a response from a *different* parent
      // id, which means a new channel: the parent page was recreated. Register
      // against it, otherwise every subsequent InputsUpdate is rejected by the
      // parent id check in onMessage and this metaframe, still believing it is
      // connected, never receives another input.
      this._parentVersion = params.version;
      this.color = stringToRgb(this.id);
      this._parentId = params.parentId;
      this._passByReference = !!params.passByReference;
      // Not Ready until the initial inputs below are applied. On a
      // re-registration we were Ready for the previous parent, and updates
      // from the new one would otherwise be applied immediately, only to be
      // overwritten by its (older) initial inputs once they deserialize.
      // While not Ready they are buffered and applied after the initial inputs.
      this._state = MetaframeLoadingState.SentSetupIframeClientRequest;
      this.log(
        `metapage[${this._parentId}](v${
          this._parentVersion ? this._parentVersion : "unknown"
        }) registered`,
      );

      if (params.state && params.state.inputs) {
        // Through the apply queue, so an update from a previous parent that
        // is still deserializing cannot land on top of these
        const applied = this._inputsApplyQueue.then(async () => {
          const initialInputs = this.isInputOutputBlobSerialization
            ? await this._deserializeInputsKeepingFailures(params.state.inputs)
            : params.state.inputs;
          // Disposed while deserializing (e.g. React StrictMode unmounting
          // right after the parent answered): drop the registration entirely.
          if (this._disposed) {
            return;
          }
          // Merge rather than replace: these are the parent's current inputs,
          // but on a re-registration we may already hold values from it.
          this._inputPipeValues = merge(this._inputPipeValues, initialInputs);
        });
        this._inputsApplyQueue = applied.catch(() => {});
        await applied;
        if (this._disposed) {
          return;
        }
      }

      // Tell the parent we have registered.
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
        if (this.listenerCount(MetaframeEvents.Input) > 0) {
          Object.keys(this._inputPipeValues).forEach((pipeId) =>
            this.emit(
              MetaframeEvents.Input,
              pipeId,
              this._inputPipeValues[pipeId],
            ),
          );
        }
      }

      // this.emit(MetaframeEvents.Inputs, this._inputPipeValues);

      //Resolve AFTER sending inputs. This way consumers can either:
      //1) Just listen to inputs updates. The first will be when the metaframe is ready
      //2) Listen to the ready event, get the inputs if desired, and listen to subsequent
      //   inputs updates. You may not wish to respond to the first updates but you might
      //   want to know when the metaframe is ready
      //*** Does this distinction make sense?
      this.emit(MetaframeEvents.Connected);

      // Send the initial outputs to the parent, we have been accumulating them
      this.sendRpc(
        JsonRpcMethodsFromChild.OutputsUpdate,
        this._outputPipeValues,
      );

      // Finally apply anything the parent sent while we were registering
      await this._drainPendingInputsUpdates();
    })();
  }

  /**
   * Deserialize inputs from the parent without letting one bad value lose
   * the rest. A value that fails to deserialize (e.g. a malformed dataref)
   * used to reject the whole map: for the initial inputs that stopped
   * registration (we never became Ready, the setup request retry was already
   * cancelled, and every later InputsUpdate was buffered forever), and for a
   * later update it silently dropped every value in it. Such a value is now
   * passed on as-is, the same as an unreachable url dataref, and reported as
   * an error event.
   */
  async _deserializeInputsKeepingFailures(
    inputs: MetaframeInputMap,
  ): Promise<MetaframeInputMap> {
    const result: MetaframeInputMap = {};
    // One key at a time, as deserializeInputs does anyway, so each value is
    // deserialized (and a url dataref fetched) at most once
    for (const [pipeId, value] of Object.entries(inputs)) {
      try {
        result[pipeId] = (await deserializeInputs({ [pipeId]: value }))[pipeId];
      } catch (err) {
        result[pipeId] = value;
        this._reportError(`Could not deserialize input ${pipeId}: ${err}`);
      }
    }
    return result;
  }

  _reportError(message: string) {
    this.error(message);
    this.emit(MetaframeEvents.Error, message);
  }

  /**
   * Hold an InputsUpdate that arrived before registration finished.
   *
   * The parent considers us connected as soon as it has answered a
   * SetupIframeClientRequest, and it has no way to know when our registration
   * actually completes: resolving it is asynchronous, and deserializing the
   * initial inputs can even go to the network for url datarefs. An input
   * update that lands in that window used to throw out of the message handler,
   * which lost that input permanently. The same applies to an iframe that
   * reloaded (its own navigation, a changed url, being moved in the DOM): the
   * parent keeps sending inputs while the new document is still handshaking.
   */
  _bufferInputsUpdate(
    parentId: MetapageId | undefined,
    inputs: MetaframeInputMap,
  ) {
    if (!inputs) {
      return;
    }
    this._pendingInputsUpdates.push({ parentId, inputs });
    // Bounded: the parent re-sends all current inputs once we register, so
    // dropping the oldest intermediate values here cannot lose the latest state
    while (
      this._pendingInputsUpdates.length > PRE_REGISTRATION_INPUTS_BUFFER_MAX
    ) {
      this._pendingInputsUpdates.shift();
    }
  }

  /** Apply buffered input updates, in arrival order */
  async _drainPendingInputsUpdates(): Promise<void> {
    // Queue them all synchronously, before awaiting any: we are already
    // Ready, so an update arriving while one of these is still deserializing
    // goes straight onto the apply queue, and must land behind all of them.
    const pending = this._pendingInputsUpdates;
    this._pendingInputsUpdates = [];
    const applied = pending
      // Only from the parent we registered with: the same check onMessage
      // applies to updates arriving after registration, deferred to here
      // because the parent id was not yet known when this was buffered.
      .filter((p) => p.parentId === this._parentId)
      .map((p) =>
        this.setInternalInputsAndNotify(p.inputs).catch((err) =>
          this._reportError(`Could not apply inputs: ${err}`),
        ),
      );
    await Promise.all(applied);
  }

  isConnected(): boolean {
    return this._state === MetaframeLoadingState.Ready;
  }

  async connected(): Promise<void> {
    return new Promise((resolve, _) => {
      if (this._state === MetaframeLoadingState.Ready) {
        resolve();
        return;
      }
      let disposer: Disposer;
      disposer = this.addListenerReturnDisposer(
        MetaframeEvents.Connected,
        () => {
          resolve();
          disposer();
        },
      );
    });
  }

  addListenerReturnDisposer(
    event: MetaframeEvents | JsonRpcMethodsFromChild,
    listener: ListenerFn<any[]>,
  ): Disposer {
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
    this._disposed = true;
    super.removeAllListeners();
    this._cancelSetupRequestRetry();
    this._pendingInputsUpdates = [];
    window.removeEventListener("message", this.onMessage);
    this.disableNotifyOnHashUrlChange();
    // @ts-ignore
    this._inputPipeValues = undefined;
    // @ts-ignore
    this._outputPipeValues = undefined;
  }

  public addListener(
    event: MetaframeEvents | JsonRpcMethodsFromChild,
    listener: ListenerFn<any[]>,
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

  public onInput(pipeId: MetaframePipeId, listener: any): Disposer {
    return this.addListenerReturnDisposer(
      MetaframeEvents.Input,
      (pipe: MetaframePipeId, value: any) => {
        if (pipeId === pipe) {
          listener(value);
        }
      },
    );
  }

  public onInputs(listener: (m: MetaframeInputMap) => void): Disposer {
    const disposer = this.addListenerReturnDisposer(
      MetaframeEvents.Inputs,
      listener,
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

  /**
   * Apply an input update from the parent: deserialize, merge, notify.
   *
   * Updates are applied one at a time, in the order they arrived. Applying is
   * asynchronous (deserializing a url dataref fetches it), so without the
   * queue a slow update could land after a later fast one and leave a stale
   * value as the final state.
   */
  async setInternalInputsAndNotify(inputs: MetaframeInputMap): Promise<void> {
    const applied = this._inputsApplyQueue.then(() =>
      this._setInternalInputsAndNotify(inputs),
    );
    // Keep the chain alive if one update fails: a bad value must not stop
    // every subsequent input from being applied
    this._inputsApplyQueue = applied.catch(() => {});
    return applied;
  }

  async _setInternalInputsAndNotify(inputs: MetaframeInputMap) {
    if (this._disposed) {
      // disposed while this update was queued
      return;
    }
    // this is where we deserialize the inputs
    if (this.isInputOutputBlobSerialization) {
      inputs = await this._deserializeInputsKeepingFailures(inputs);
      if (this._disposed) {
        return;
      }
    }

    const originalInputs = inputs;
    this._inputPipeValues = merge(this._inputPipeValues, inputs);
    if (this._inputPipeValues === originalInputs) {
      return;
    }

    Object.keys(inputs).forEach((pipeId) => {
      try {
        // if we don't actually need this event, we should remove it
        this.emit(MetaframeEvents.Input, pipeId, inputs[pipeId]);
      } catch (err) {
        console.error(`Error emitting input ${pipeId}: ${err}`);
        this.emit(
          MetaframeEvents.Error,
          `Error emitting input ${pipeId}: ${err}`,
        );
      }
    });
    try {
      this.emit(MetaframeEvents.Inputs, inputs);
    } catch (err) {
      console.error(`Error emitting inputs: ${err}`);
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
    // Outputs set before we have registered are serialized: we do not know
    // yet whether the parent wants them as-is
    if (this.isInputOutputBlobSerialization && !this._passByReference) {
      outputs = await serializeInputs(outputs);
    }

    const originalOutputs = outputs;
    this._outputPipeValues = merge(this._outputPipeValues, outputs);
    if (this._outputPipeValues === originalOutputs) {
      return;
    }

    // If we are not ready/connected, outputs will be sent when connected
    if (this._state === MetaframeLoadingState.Ready) {
      this.sendRpc(JsonRpcMethodsFromChild.OutputsUpdate, outputs);
    }
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
        "Cannot send JSON-RPC window message: there is no window.parent which means we are not an iframe",
      );
    }
  }

  onMessage(e: MessageEvent) {
    if (typeof e.data === "object") {
      let jsonrpc: MinimumClientMessage<any> = e.data;
      if (jsonrpc.jsonrpc === "2.0") {
        //Make sure this is a jsonrpc object
        var method = jsonrpc.method as JsonRpcMethodsFromParent;
        // Inputs sent before we know our parent id are held (and checked
        // against the parent id once we do know it) rather than rejected:
        // see _bufferInputsUpdate
        const isUnregisteredInputsUpdate =
          method == "InputsUpdate" &&
          !this._parentId &&
          jsonrpc.iframeId == this.id;
        // Only the window embedding us can register us, and it registers us
        // again every time our document is replaced. `e.source` is unset for
        // events dispatched inside this window (tests, and any script already
        // running here, which can call this object directly anyway).
        if (
          method == "SetupIframeServerResponse" &&
          e.source &&
          e.source !== window.parent
        ) {
          this.log(
            "window.message: ignoring SetupIframeServerResponse from a window that is not our parent",
          );
          return;
        }
        if (!(
          method == "SetupIframeServerResponse" ||
          isUnregisteredInputsUpdate ||
          (jsonrpc.parentId == this._parentId && jsonrpc.iframeId == this.id)
        )) {
          this.log(
            `window.message: received message (method=${method}) but jsonrpc.parentId=${jsonrpc.parentId} _parentId=${this._parentId} jsonrpc.iframeId=${jsonrpc.iframeId} id=${this.id}`,
          );
          return;
        }

        switch (method) {
          case JsonRpcMethodsFromParent.SetupIframeServerResponse:
            this._resolveSetupIframeServerResponse(jsonrpc.params);
            break; //Handled elsewhere
          case JsonRpcMethodsFromParent.InputsUpdate:
            if (this._state !== MetaframeLoadingState.Ready) {
              // Not an error: the parent sends inputs as soon as it has
              // answered our registration request, which is before we have
              // finished registering. Throwing here lost the input forever.
              this._bufferInputsUpdate(
                jsonrpc.parentId,
                jsonrpc.params?.inputs,
              );
              break;
            }
            this.setInternalInputsAndNotify(jsonrpc.params.inputs).catch(
              (err) => this._reportError(`Could not apply inputs: ${err}`),
            );
            break;
          case JsonRpcMethodsFromParent.MessageAck:
            if (this.debug) this.log(`ACK: ${JSON.stringify(jsonrpc)}`);
            break;
          default:
            if (this.debug)
              this.log(
                `window.message: unknown JSON-RPC method: ${JSON.stringify(
                  jsonrpc,
                )}`,
              );
            break;
        }

        if (this.listenerCount(MetaframeEvents.Message) > 0) {
          this.emit(MetaframeEvents.Message, jsonrpc);
        }
      }
    }
  }

  setParameter(key: string, value: any) {
    setHashParamInWindow(key, value);
  }

  getParameter(key: string): string | undefined {
    return getHashParamFromWindow(key);
  }

  setParameterBoolean(key: string, value: boolean | undefined) {
    setHashParamValueBooleanInWindow(key, value);
  }

  getParameterBoolean(key: string): boolean | undefined {
    return getHashParamValueBooleanFromWindow(key);
  }

  setParameterJson(key: string, value: any) {
    setHashParamValueJsonInWindow(key, value);
  }

  getParameterJson<T>(key: string): T | undefined {
    return getHashParamValueJsonFromWindow<T>(key);
  }

  setParameterBase64(key: string, value: string | undefined) {
    setHashParamValueBase64EncodedInWindow(key, value);
  }

  getParameterBase64(key: string): string | undefined {
    return getHashParamValueBase64DecodedFromWindow(key);
  }

  setParameterFloat(key: string, value: number | undefined) {
    setHashParamValueFloatInWindow(key, value);
  }

  getParameterFloat(key: string): number | undefined {
    return getHashParamValueFloatFromWindow(key);
  }

  setParameterInt(key: string, value: number | undefined) {
    setHashParamValueIntInWindow(key, value);
  }

  getParameterInt(key: string): number | undefined {
    return getHashParamValueIntFromWindow(key);
  }

  deleteParameter(key: string) {
    setHashParamInWindow(key, undefined);
  }
}
