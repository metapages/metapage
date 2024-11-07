import { ListenerFn } from 'eventemitter3';
import { create } from 'mutative';

import { VERSION_METAPAGE } from './Constants';
import {
  convertMetapageDefinitionToCurrentVersion,
  getMatchingMetapageVersion,
} from './conversions';
import {
  deserializeInputs,
  serializeInputs,
} from './data';
import {
  MetapageEventDefinition,
  MetapageEvents,
  MetapageEventUrlHashUpdate,
} from './events';
import {
  JsonRpcMethodsFromChild,
  MinimumClientMessage,
  SetupIframeClientAckData,
} from './jsonrpc';
import { MetapageIFrameRpcClient } from './MetapageIFrameRpcClient';
import {
  generateMetapageId,
  isDebugFromUrlsParams,
  log as MetapageToolsLog,
  pageLoaded,
} from './MetapageTools';
import {
  INITIAL_NULL_METAPAGE_DEFINITION,
  MetapageShared,
} from './Shared';
import { MetapageId, MetaframeId, MetaframePipeId } from "./core";
import {
  MetapageDefinitionV1,
  MetapageOptionsV1,
} from './v1';
import {
  MetaframeInputMap,
  MetaframeInstance,
  MetapageInstanceInputs,
  PipeInput,
  PipeUpdateBlob,
} from './v0_4';
import { VersionsMetapage } from './versions';

interface MetapageStatePartial {
  inputs: MetapageInstanceInputs;
  outputs: MetapageInstanceInputs;
}

export interface MetapageState {
  metaframes: MetapageStatePartial;
}

const emptyState :MetapageState= create<MetapageState>({
  metaframes: {
    inputs: {},
    outputs: {},
  },
}, draft => draft);

export const getLibraryVersionMatching = (
  version: string
): VersionsMetapage => {
  return getMatchingMetapageVersion(version);
};

export const matchPipe = (
  outputPipeName: string,
  inputPipeName?: string
): boolean => {
  if (!inputPipeName || inputPipeName === "*") {
    return true;
  }

  if (outputPipeName === inputPipeName) {
    return true;
  }

  if (inputPipeName.endsWith("*")) {
    return outputPipeName.startsWith(inputPipeName.slice(0, -1));
  }

  if (inputPipeName.startsWith("*")) {
    return outputPipeName.endsWith(inputPipeName.slice(1));
  }

  return false;
};

type MetaframeInputTargetsFromOutput = {
  metaframe: MetaframeId;
  pipe: MetaframePipeId;
};

type CachedInputLookupMap = {
  [key: string]: {
    [key: MetaframeId]: MetaframeInputTargetsFromOutput[]; // <metaframeId, MetaframeInputTargetsFromOutput[]>
  };
};

type MetaframeClients = {
  [key: MetaframeId]: MetapageIFrameRpcClient;
};

const CONSOLE_BACKGROUND_COLOR_DEFAULT = "bcbcbc";

export class Metapage extends MetapageShared {
  // The current version is always the latest
  public static readonly version = VERSION_METAPAGE;

  // Event literals for users to listen to events
  public static readonly DEFINITION = MetapageEvents.Definition;
  public static readonly ERROR = MetapageEvents.Error;
  public static readonly INPUTS = MetapageEvents.Inputs;
  public static readonly MESSAGE = MetapageEvents.Message;
  public static readonly OUTPUTS = MetapageEvents.Outputs;
  public static readonly STATE = MetapageEvents.State;

  public static deserializeInputs = deserializeInputs;
  public static serializeInputs = serializeInputs;

  public static async from(metaPageDef: any, inputs?: any): Promise<Metapage> {
    if (metaPageDef == null) {
      throw "Metapage definition cannot be null";
    }
    if (typeof metaPageDef === "string") {
      try {
        metaPageDef = JSON.parse(metaPageDef);
      } catch (err) {
        throw "Cannot parse into JSON:\n${metaPageDef}";
      }
    }

    var metapage = new Metapage();
    return metapage.setDefinition(metaPageDef);
  }

  _id: MetapageId;
  _state: MetapageState = emptyState;
  _metaframes: MetaframeClients = create({}, draft => draft); //<MetaframeId, MetapageIFrameRpcClient>

  debug: boolean = isDebugFromUrlsParams();
  _consoleBackgroundColor: string;

  // Useful for debugging duplicate messages
  _internalReceivedMessageCounter: number = 0;

  // for caching input lookups
  _cachedInputLookupMap: CachedInputLookupMap = create<CachedInputLookupMap>({}, draft => draft);
  _inputMap: {
    [key: string]: PipeInput[];
  } = {};
  // Example:
  // 	{
  //     "version": "1",
  //     "metaframes": {
  //       "metaframe1": {
  //         "url": "{{site.baseurl}}/metaframes/example00_iframe1/",
  //         "inputs": [
  //           {
  //             "metaframe":"metaframe2",
  //             "source": "barOut",
  //             "target": "barIn",
  //           }
  //         ]
  //       },
  //       "metaframe2": {
  //         "url": "{{site.baseurl}}/metaframes/example00_iframe2/",
  //         "inputs": [
  //           {
  //             "metaframe":"metaframe1",
  //             "source": "fooOut",
  //             "target": "fooIn",
  //           }
  //         ]
  //       }
  //     }
  // }

  constructor(opts?: MetapageOptionsV1) {
    super();
    this._id = opts && opts.id ? opts.id : generateMetapageId();
    this._consoleBackgroundColor =
      opts && opts.color ? opts.color : CONSOLE_BACKGROUND_COLOR_DEFAULT;

    this.addPipe = this.addPipe.bind(this);
    this.dispose = this.dispose.bind(this);
    // this.getDefinition = this.getDefinition.bind(this);
    this.addMetaframe = this.addMetaframe.bind(this);
    this.getInputsFromOutput = this.getInputsFromOutput.bind(this);
    this.getMetaframe = this.getMetaframe.bind(this);
    this.getMetaframeIds = this.getMetaframeIds.bind(this);
    this.getMetaframe = this.getMetaframe.bind(this);
    this.getMetaframes = this.getMetaframes.bind(this);
    this.getState = this.getState.bind(this);
    this.getStateMetaframes = this.getStateMetaframes.bind(this);
    this.isValidJSONRpcMessage = this.isValidJSONRpcMessage.bind(this);
    this.log = this.log.bind(this);
    this.logInternal = this.logInternal.bind(this);
    this.metaframeIds = this.metaframeIds.bind(this);
    this.metaframes = this.metaframes.bind(this);
    this.onMessage = this.onMessage.bind(this);
    this.removeAll = this.removeAll.bind(this);
    this.removeMetaframe = this.removeMetaframe.bind(this);
    this.setDebugFromUrlParams = this.setDebugFromUrlParams.bind(this);
    this.setDefinition = this.setDefinition.bind(this);
    this.setInput = this.setInput.bind(this);
    this.setInputs = this.setInputs.bind(this);
    this.setInputStateOnlyMetaframeInputValue = this.setInputStateOnlyMetaframeInputValue.bind(this);
    this.setInputStateOnlyMetaframeInputMap = this.setInputStateOnlyMetaframeInputMap.bind(this);
    this.setInputStateOnlyMetapageInstanceInputs = this.setInputStateOnlyMetapageInstanceInputs.bind(this);
    this.setOutputStateOnlyMetaframeInputValue = this.setOutputStateOnlyMetaframeInputValue.bind(this);
    this.setOutputStateOnlyMetaframeInputMap = this.setOutputStateOnlyMetaframeInputMap.bind(this);
    this.setOutputStateOnlyMetapageInstanceInputs = this.setOutputStateOnlyMetapageInstanceInputs.bind(this);
    this.setMetaframeClientInputAndSentClientEvent =
    this.setMetaframeClientInputAndSentClientEvent.bind(this);
    this.setState = this.setState.bind(this);
    this.isDisposed = this.isDisposed.bind(this);
    this._emitDefinitionEvent = this._emitDefinitionEvent.bind(this);

    // see ARCHITECTURE.md
    // when the page is loaded, only then start listening to messages from metaframes
    pageLoaded().then(() => {
      if (this.isDisposed()) {
        return;
      }
      window.addEventListener("message", this.onMessage);
      this.log("Initialized");
    });
  }

  public isDisposed() {
    return this._metaframes === undefined;
  }

  addListenerReturnDisposer(
    event: MetapageEvents,
    listener: ListenerFn<any[]>
  ): () => void {
    super.addListener(event, listener);
    const disposer = () => {
      super.removeListener(event, listener);
    };
    return disposer;
  }

  public setDebugFromUrlParams(): Metapage {
    const url = new URL(window.location.href);
    this.debug = ["debug", "mp_debug"].reduce((exists, flag) => {
      return exists || url.searchParams.get(flag) === "true" || url.searchParams.get(flag) === "1"
    }, false)
    return this;
  }

  public getState(): MetapageState {
    return this._state;
  }

  public setState(newState: MetapageState) {
    this._state = create<MetapageState>(newState, (draft) => draft);
    this.getMetaframeIds().forEach((metaframeId) => {
      this.getMetaframe(metaframeId).setInputs(
        this._state.metaframes.inputs[metaframeId]
      );
      this.getMetaframe(metaframeId).setOutputs(
        this._state.metaframes.outputs[metaframeId]
      );
    });

    if (this.listenerCount(MetapageEvents.State) > 0 && emptyState !== this._state) {
      this.emit(MetapageEvents.State, this._state);
    }
  }

  public getStateMetaframes(): MetapageStatePartial {
    return this._state.metaframes;
  }

  public getDefinition(): MetapageDefinitionV1 {
    return this._definition;
  }

  public async setDefinition(def: any, state?: MetapageState): Promise<Metapage> {
    // Some validation
    if (!def.version) {
      throw "Metapage definition must have a version";
    }

    const newDefinition: MetapageDefinitionV1 = await
      convertMetapageDefinitionToCurrentVersion(def);

    if (this.isDisposed()) {
      // we got disposed while converting
      return this;
    }

    if (newDefinition.metaframes) {
      Object.keys(newDefinition.metaframes).forEach((metaframeId) => {
        var metaframeDefinition = newDefinition.metaframes[metaframeId];
        if (typeof metaframeDefinition !== "object") {
          this.emitErrorMessage(`Metaframe "${metaframeId}" is not an object`);
          throw `Metaframe "${metaframeId}" is not an object`;
        }

        if (!metaframeDefinition.url) {
          this.emitErrorMessage(
            `Metaframe "${metaframeId}" missing field: url`
          );
          throw `Metaframe "${metaframeId}" missing field: url`;
        }
      });
    }

    // TODO: revisit this assumption?
    // If there is not an earlier definition, we don't fire an event
    const previousDefinition = this._definition;

    this._definition = newDefinition;
    // try to be efficient with the new definition.
    // destroy any metaframes not in the new definition
    Object.keys(this._metaframes).forEach((metaframeId) => {
      // Doesn't exist? Destroy it
      if (!newDefinition.metaframes || !newDefinition.metaframes[metaframeId]) {
        // this removes the metaframe, pipes, inputs, caches
        this.removeMetaframe(metaframeId);
      }
    });

    // if the state is updated, set that now
    if (state) {
      this._state = create<MetapageState>(state, (draft) => draft);
    }

    // Create any new metaframes needed
    if (newDefinition.metaframes) {
      Object.keys(newDefinition.metaframes).forEach((newMetaframeId) => {
        if (!this._metaframes.hasOwnProperty(newMetaframeId)) {
          const metaframeDefinition = newDefinition.metaframes[newMetaframeId];
          // this will also set the inputs from our state
          this.addMetaframe(newMetaframeId, metaframeDefinition);
        }
      });
    }

    // TODO: fire the event anyway, but use immutable state so we 
    // can do a quick compare
    // Only fire a definition update event IF this is not the first
    // time the definition is externally set
    if (previousDefinition !== INITIAL_NULL_METAPAGE_DEFINITION) {
      // Send the event on the next loop to give listeners time to re-add
      // after this method returns.
      window.setTimeout(() => {
        if (!this.isDisposed() && newDefinition === this._definition) {
          this._emitDefinitionEvent();
          if (state && this.listenerCount(MetapageEvents.State) > 0 && emptyState !== this._state) {
            this.emit(MetapageEvents.State, this._state);
          }
        }
      }, 0);
    }

    return this;
  }

  // Convenience method
  _emitDefinitionEvent() {
    if (this.listenerCount(MetapageEvents.Definition) > 0) {
      const event: MetapageEventDefinition = {
        definition: this._definition,
        metaframes: this._metaframes,
      };
      this.emit(MetapageEvents.Definition, event);
    }
  }

  // do not expose, change definition instead
  addPipe(target: MetaframeId, input: PipeInput) {
    // Do all the cache checking
    this._inputMap = create(this._inputMap, (draft) => {
      if (!draft[target]) {
        draft[target] = [];
      }
      draft[target].push(input);
    });
  }

  // do not expose, change definition instead
  removeMetaframe(metaframeId: MetaframeId) {
    if (!this._metaframes[metaframeId]) {
      return;
    }

    this._metaframes[metaframeId].dispose();

    this._metaframes = create(this._metaframes, (draft) => {
      delete draft[metaframeId];
    });

    this._state = create(this._state, (draft) => {
      delete draft.metaframes.inputs[metaframeId];
      delete draft.metaframes.outputs[metaframeId];
    });

    this._inputMap = create(this._inputMap, (draft) => {
      delete draft[metaframeId];
      Object.keys(draft).forEach((otherMetaframeId) => {
        const inputPipes = draft[otherMetaframeId];
        let index = 0;
        while (index <= inputPipes.length) {
          if (inputPipes[index] && inputPipes[index].metaframe === metaframeId) {
            inputPipes.splice(index, 1);
          } else {
            index++;
          }
        }
      });
    });

    // This will regenerate, simpler than surgery
    this._cachedInputLookupMap = create({}, draft => draft);
  }

  // do not expose, change definition instead
  // to add/remove
  removeAll(): void {
    Object.keys(this._metaframes).forEach((id) =>
      this._metaframes[id].dispose()
    );
    this._metaframes = create({}, draft => draft);
    this._state = emptyState;
    this._inputMap = create({}, draft => draft);
    this._cachedInputLookupMap = create({}, draft => draft);
  }

  public metaframes() {
    return this.getMetaframes();
  }

  public metaframeIds(): MetaframeId[] {
    return this.getMetaframeIds();
  }

  public getMetaframeIds(): MetaframeId[] {
    return Object.keys(this._metaframes);
  }

  public getMetaframes(): {
    [key: string]: MetapageIFrameRpcClient;
  } {
    return this._metaframes;
  }

  public getMetaframe(id: MetaframeId): MetapageIFrameRpcClient {
    return this?._metaframes[id];
  }

  // do not expose, change definition instead
  addMetaframe(
    metaframeId: MetaframeId,
    definition: MetaframeInstance
  ): MetapageIFrameRpcClient {
    if (!metaframeId) {
      throw "addMetaframe missing metaframeId";
    }

    if (!definition) {
      throw "addMetaframe missing definition";
    }

    if (this._metaframes[metaframeId]) {
      this.emitErrorMessage(`Existing metaframe for id=${metaframeId}`);
      throw `Existing metaframe for id=${metaframeId}`;
    }

    if (!definition.url) {
      this.emitErrorMessage(
        `Metaframe definition missing url id=${metaframeId}`
      );
      throw `Metaframe definition missing url id=${metaframeId}`;
    }

    var iframeClient = new MetapageIFrameRpcClient(
      this,
      definition.url,
      metaframeId,
      this._id,
      this._consoleBackgroundColor,
      this.debug
    ).setMetapage(this);
    this._metaframes = create<MetaframeClients>(this._metaframes, (draft: MetaframeClients) => {
      draft[metaframeId] = iframeClient;
    });

    iframeClient.addListener(MetapageEvents.Error, (err) => {
      // These can be displayed
      this.emit(MetapageEvents.Error, {
        metaframeId: iframeClient.id,
        metaframeUrl: iframeClient.url,
        error: err,
      });
    });

    // add the pipes
    if (definition.inputs) {
      definition.inputs.forEach((input) => this.addPipe(metaframeId, input));
    }

    // set the initial inputs
    iframeClient.setInputs(this._state.metaframes.inputs[metaframeId]);

    return iframeClient;
  }

  public dispose() {
    this.log("disposing");
    super.removeAllListeners();
    window.removeEventListener("message", this.onMessage);
    if (this._metaframes) {
      Object.keys(this._metaframes).forEach((metaframeId) =>
        this._metaframes[metaframeId].dispose()
      );
    }

    // help the gc remove references but ignore the TS warnings as this object is now gone so don't touch it
    // @ts-ignore
    this._id = undefined;
    // @ts-ignore
    this._metaframes = undefined;
    // @ts-ignore
    this._state = undefined;
    // @ts-ignore
    this._cachedInputLookupMap = undefined;
    // @ts-ignore
    this._inputMap = undefined;
  }

  public log(o: any, color?: string, backgroundColor?: string) {
    if (!this.debug) {
      return;
    }
    this.logInternal(o, color, backgroundColor);
  }

  public error(err: any) {
    this.logInternal(err, "f00", this._consoleBackgroundColor);
    this.emitErrorMessage(`${err}`);
  }

  public emitErrorMessage(err: string) {
    this.emit(MetapageEvents.Error, err);
  }

  // This call is cached
  getInputsFromOutput(
    source: MetaframeId,
    outputPipeId: MetaframePipeId
  ): MetaframeInputTargetsFromOutput[] {
    // Do all the cache checking
    if (!this._cachedInputLookupMap[source]) {
      this._cachedInputLookupMap = create(this._cachedInputLookupMap, (draft: CachedInputLookupMap) => {
        draft[source] = create({}, __ => __);
      });
    }

    if (!this._cachedInputLookupMap[source][outputPipeId]) {

      this._cachedInputLookupMap = create(this._cachedInputLookupMap, (draft: CachedInputLookupMap) => {
        var targets: MetaframeInputTargetsFromOutput[] = [];
        draft[source][outputPipeId] = targets;
        // Go through the data structure, getting all the matching inputs that match this output
        Object.keys(this._inputMap).forEach((metaframeId) => {
          if (metaframeId === source) {
            // No self pipes, does not make sense
            return;
          }
          this._inputMap[metaframeId].forEach((inputPipe) => {
            // At least the source metaframe matches, now check pipes
            if (inputPipe.metaframe === source) {
              // Check the kind of source string
              // it could be a basic string, or a glob?
              if (matchPipe(outputPipeId, inputPipe.source)) {
                // A match, now figure out the actual input pipe name
                // since it might be * or absent meaning that the input
                // field name is the same as the incoming
                var targetName = inputPipe.target;
                if (
                  !inputPipe.target ||
                  inputPipe.target.startsWith("*") ||
                  inputPipe.target === ""
                ) {
                  targetName = outputPipeId;
                }
                targets.push({ metaframe: metaframeId, pipe: targetName });
              }
            }
          });
        });
      });
    }

    return this._cachedInputLookupMap[source][outputPipeId];
  }

  isValidJSONRpcMessage(message: MinimumClientMessage<any>) {
    if (message.jsonrpc !== "2.0") {
      // do not even log messages that we do not recogize. We cannot control random scripts sending messages on
      // the only communications channel
      return false;
    }
    const method = message.method as JsonRpcMethodsFromChild;
    switch (method) {
      case JsonRpcMethodsFromChild.SetupIframeClientRequest:
        //No validation possible here
        return true;
      default:
        // TODO: check origin+source
        var iframeId: MetaframeId | undefined = message.iframeId;
        if (
          iframeId &&
          !(
            message.parentId === this._id &&
            (this._metaframes[iframeId])
          )
        ) {
          return false;
        }
        return true;
    }
  }

  /**
   * Sets inputs
   * First update internal state, so any events that check get the new value
   * Then update the metaframe clients
   * Fire events
   * @param iframeId Can be an object of {metaframeId:{pipeId:value}} or the metaframe id
   * @param inputPipeId If the above is a string id, then inputPipeId can be the pipe id or an object {pipeId:value}
   * @param value If the above is a pipe id, then the is the value.
   */
  public setInput(iframeId: MetaframeId | MetapageInstanceInputs,
    inputPipeId?: MetaframePipeId | MetaframeInputMap,
    value?: PipeUpdateBlob) {

    if (typeof iframeId === "object") {
      this.setInputStateOnlyMetapageInstanceInputs(iframeId);
    } else if (typeof inputPipeId === "string") {
      this.setInputStateOnlyMetaframeInputValue(iframeId, inputPipeId, value);
    } else {
      this.setInputStateOnlyMetaframeInputMap(iframeId, inputPipeId || {});
    }

    this.setMetaframeClientInputAndSentClientEvent(
      iframeId,
      inputPipeId,
      value
    );
    // finally send the main events
    if (
      this.listenerCount(MetapageEvents.State) > 0 ||
      this.listenerCount(MetapageEvents.Inputs) > 0
    ) {
      if (emptyState !== this._state) {
        this.emit(MetapageEvents.State, this._state);
        this.emit(MetapageEvents.Inputs, this._state?.metaframes?.inputs);
      }
    }
  }

  setMetaframeClientInputAndSentClientEvent(
    iframeId: MetaframeId | MetapageInstanceInputs,
    inputPipeId?: MetaframePipeId | MetaframeInputMap,
    value?: PipeUpdateBlob
  ) {
    if (typeof iframeId === "object") {
      if (inputPipeId || value) {
        throw "bad arguments, see API docs";
      }
      const inputs: any = iframeId;
      Object.keys(inputs).forEach((id) => {
        var metaframeId: MetaframeId = id;
        var metaframeInputs = inputs[metaframeId];
        if (typeof metaframeInputs !== "object") {
          throw "bad arguments, see API docs";
        }
        var iframeClient = this._metaframes[metaframeId];
        if (iframeClient) {
          iframeClient.setInputs(metaframeInputs);
        } else {
          this.error("No iframe id=$metaframeId");
        }
      });
    } else if (typeof iframeId === "string") {
      const iframeClient = this._metaframes[iframeId];
      if (iframeClient == null) {
        this.error(`No iframe id=${iframeId}`);
      }
      if (typeof inputPipeId === "string") {
        iframeClient.setInput(inputPipeId, value);
      } else if (typeof inputPipeId === "object") {
        iframeClient.setInputs(inputPipeId);
      } else {
        throw "bad arguments, see API docs";
      }
    } else {
      throw "bad arguments, see API docs";
    }
  }

  public setInputs(iframeId: MetaframeId | MetapageInstanceInputs, inputPipeId?: MetaframePipeId | MetaframeInputMap, value?: PipeUpdateBlob) {
    this.setInput(iframeId, inputPipeId, value);
  }

  setOutputStateOnlyMetapageInstanceInputs(metapageInputs: MetapageInstanceInputs) {
    this._setStateOnlyMetaframes(false, metapageInputs);
  }

  setOutputStateOnlyMetaframeInputValue(metaframeId: MetaframeId, inputPipeId: MetaframePipeId, value?: PipeUpdateBlob) {
    this._setStateOnlyMetaframeInputValue(false, metaframeId, inputPipeId, value);
  }

  setOutputStateOnlyMetaframeInputMap(metaframeId: MetaframeId, metaframeValuesNew: MetaframeInputMap) {
    this._setStateOnlyMetaframeInputMap(false, metaframeId, metaframeValuesNew);
  }

  setInputStateOnlyMetapageInstanceInputs(metapageInputs: MetapageInstanceInputs) {
    this._setStateOnlyMetaframes(true, metapageInputs);
  }

  setInputStateOnlyMetaframeInputValue(metaframeId: MetaframeId, inputPipeId: MetaframePipeId, value?: PipeUpdateBlob) {
    this._setStateOnlyMetaframeInputValue(true, metaframeId, inputPipeId, value);
  }

  setInputStateOnlyMetaframeInputMap(metaframeId: MetaframeId, metaframeValuesNew: MetaframeInputMap) {
    this._setStateOnlyMetaframeInputMap(true, metaframeId, metaframeValuesNew);
  }

  _setStateOnlyMetaframeInputValue(
    isInputs: boolean,
    metaframeId: MetaframeId,
    metaframePipeId: MetaframePipeId,
    value?: PipeUpdateBlob
  ): void {

    this._state = create(this._state, (draft: MetapageState) => {

      const isMetaframe = this._metaframes.hasOwnProperty(metaframeId);
      if (!isMetaframe) {
        throw `No metaframe: ${metaframeId}`;
      }
      if (!draft.metaframes) {
        draft.metaframes = { inputs: {}, outputs: {} };
      }

      if (isInputs) {
        if (!draft.metaframes.inputs) {
          draft.metaframes.inputs = {};
        }
      } else {
        if (!draft.metaframes.outputs) {
          draft.metaframes.outputs = {};
        }
      }

      let inputOrOutputState = isInputs
        ? draft.metaframes.inputs
        : draft.metaframes.outputs

      // Ensure a map
      inputOrOutputState = inputOrOutputState || {};
      inputOrOutputState[metaframeId] = !!inputOrOutputState[metaframeId]
        ? inputOrOutputState[metaframeId]
        : ({} as MetaframeInstance);

      // A key with a value of undefined means remove the key from the state object
      if (value === undefined) {
        delete inputOrOutputState[metaframeId][metaframePipeId];
      } else {
        // otherwise set the new value
        inputOrOutputState[metaframeId][metaframePipeId] = value;
      }
    });
  }



  _setStateOnlyMetaframeInputMap(
    isInputs: boolean,
    metaframeId: MetaframeId,
    metaframeValuesNew: MetaframeInputMap
  ): void {

    if (!metaframeValuesNew || Object.keys(metaframeValuesNew).length === 0) {
      return;
    }

    this._state = create(this._state, (draft: MetapageState) => {

      const isMetaframe = this._metaframes.hasOwnProperty(metaframeId);
      if (!isMetaframe) {
        throw `No metaframe: ${metaframeId}`;
      }

      let inputOrOutputState = isInputs
        ? draft.metaframes.inputs
        : draft.metaframes.outputs

      // Ensure a map
      inputOrOutputState[metaframeId] = inputOrOutputState[metaframeId]
        ? inputOrOutputState[metaframeId]
        : ({} as MetaframeInstance);

      Object.keys(metaframeValuesNew).forEach((metaframePipedId) => {
        // A key with a value of undefined means remove the key from the state object
        if (metaframeValuesNew[metaframePipedId] === undefined) {
          delete inputOrOutputState[metaframeId][metaframePipedId];
        } else {
          // otherwise set the new value
          inputOrOutputState[metaframeId][metaframePipedId] =
            metaframeValuesNew[metaframePipedId];
        }
      });

    });
  }

  _setStateOnlyMetaframes(
    isInputs: boolean,
    inputsMetaframesNew: MetapageInstanceInputs,
  ): void {

    if (!inputsMetaframesNew || Object.keys(inputsMetaframesNew).length === 0) {
      return;
    }

    this._state = create(this._state, (draft: MetapageState) => {
      Object.keys(inputsMetaframesNew).forEach((metaframeId) => {
        var metaframeValuesNew: MetaframeInputMap =
          inputsMetaframesNew[metaframeId];
        if (typeof metaframeValuesNew !== "object") {
          throw "Object values must be objects";
        }

        const isMetaframe = this._metaframes.hasOwnProperty(metaframeId);
        if (!isMetaframe) {
          throw "No metaframe: ${metaframeId}";
        }

        const inputOrOutputState = isInputs
          ? draft.metaframes.inputs
          : draft.metaframes.outputs

        // Ensure a map
        inputOrOutputState[metaframeId] = inputOrOutputState[metaframeId]
          ? inputOrOutputState[metaframeId]
          : ({} as MetaframeInstance);

        Object.keys(metaframeValuesNew).forEach((metaframePipedId) => {
          // A key with a value of undefined means remove the key from the state object
          if (metaframeValuesNew[metaframePipedId] === undefined) {
            delete inputOrOutputState[metaframeId][metaframePipedId];
          } else {
            // otherwise set the new value
            inputOrOutputState[metaframeId][metaframePipedId] =
              metaframeValuesNew[metaframePipedId];
          }
        });
      })
    });
  }

  onMessage(e: MessageEvent) {
    // any other type of messages are ignored
    // maybe in the future we can pass around strings or ArrayBuffers
    if (typeof e.data === "object") {
      const jsonrpc = e.data as MinimumClientMessage<any>;
      if (!this.isValidJSONRpcMessage(jsonrpc)) {
        return;
      }
      //Verify here
      var method = jsonrpc.method as JsonRpcMethodsFromChild;
      const metaframeId = jsonrpc.iframeId;
      // The metaframe gets its id from the window.name field so the iframe knows
      // its id from the very beginning
      if (!metaframeId) {
        // so if it's missing, bail early
        return;
      }

      const metaframe = this.getMetaframe(metaframeId);
      if (!metaframe) {
        this.error(`💥 onMessage no metaframe id=${metaframeId}`);
        return;
      }

      // debugging: track messsages internally
      (jsonrpc as any)["_messageCount"] = ++this
        ._internalReceivedMessageCounter;

      if (this.debug) {
        this.log(
          `processing ${JSON.stringify(jsonrpc, null, "  ").substring(0, 500)}`
        );
      }

      let stateImmutable: MetapageState | undefined = undefined;

      switch (method) {
        /**
         * An iframe is sending a connection request.
         * Here we register it to set up a secure
         * communication channel.
         */
        case JsonRpcMethodsFromChild.SetupIframeClientRequest:
          if (metaframe) {
            metaframe.register();
          }
          break;

        /* A client iframe responded */
        case JsonRpcMethodsFromChild.SetupIframeServerResponseAck:
          /* Send all inputs when a client has registered. */
          if (metaframe) {
            const params = jsonrpc.params as SetupIframeClientAckData<any>;
            metaframe.registered(params.version);
          }
          break;

        case JsonRpcMethodsFromChild.OutputsUpdate:
          const outputs: MetaframeInputMap = jsonrpc.params;

          if (this._metaframes[metaframeId]) {
            var iframe = this._metaframes[metaframeId];

            // set the internal state, no event yet, nor downstream inputs update (yet)
            this.setOutputStateOnlyMetaframeInputMap(metaframeId, outputs);
            // iframe outputs, metaframe only event sent
            iframe.setOutputs(outputs);
            // let's not send the state event until AFTER
            // cached lookup of where those outputs are going
            // Multiple outputs going to multiple inputs on the same metaframe must
            // arrive as a single blob
            var modified = false;
            const outputKeys = Object.keys(outputs);
            const collectedOutputs: { [key in string]: MetaframeInputMap } = {};
            outputKeys.forEach((outputKey, i) => {
              const targets: MetaframeInputTargetsFromOutput[] =
                this.getInputsFromOutput(metaframeId!, outputKey);
              if (targets.length > 0) {
                targets.forEach((target) => {
                  if (!collectedOutputs[target.metaframe]) {
                    collectedOutputs[target.metaframe] = {};
                  }
                  collectedOutputs[target.metaframe][target.pipe] =
                    outputs[outputKey];
                  modified = true;
                });
              }
            });
            if (modified) {
              this.setInputStateOnlyMetapageInstanceInputs(collectedOutputs);
              Object.keys(collectedOutputs).forEach((metaframeId) => {
                this._metaframes[metaframeId].setInputs(
                  collectedOutputs[metaframeId]
                  // then actually set the inputs once collected
                );
              });
            }
            // only send a state event if downstream inputs were modified
            if (this.listenerCount(MetapageEvents.State) > 0 && emptyState !== this._state) {
              this.emit(MetapageEvents.State, this._state);
            }
            if (this.debug) {
              iframe.ack({ jsonrpc: jsonrpc, state: this._state });
            }
          } else {
            this.error(`missing metaframe=${metaframeId}`);
          }

          break;

        case JsonRpcMethodsFromChild.InputsUpdate:
          // This is triggered by the metaframe itself, meaning the metaframe
          // decided to save this state info.
          // We store it in the local state, then send it back so
          // the metaframe is notified of its input state.
          var inputs: MetaframeInputMap = jsonrpc.params;
          if (this.debug)
            this.log(`inputs ${JSON.stringify(inputs)} from ${metaframeId}`);
          if (this._metaframes[metaframeId]) {
            // Set the internal inputs state first so that anything that
            // responds to events will get the updated state if requested
            // Currently on for setting metaframe inputs that haven't loaded yet
            this.setInputStateOnlyMetaframeInputMap(metaframeId, inputs);
            this._metaframes[metaframeId].setInputs(inputs);
            if (this.listenerCount(MetapageEvents.State) > 0 && emptyState !== this._state) {
              this.emit(MetapageEvents.State, this._state);
            }

            if (this.debug) {
              this._metaframes[metaframeId].ack({
                jsonrpc: jsonrpc,
                state: this._state,
              });
            }
          } else {
            console.error(
              `InputsUpdate failed no metaframe id: "${metaframeId}"`
            );
            this.error(
              `InputsUpdate failed no metaframe id: "${metaframeId}"`
            );
          }
          break;
        case JsonRpcMethodsFromChild.HashParamsUpdate:
          // Not really sure how to "automatically" process this right here
          // It's a potential automatic security concern, IF we want to put credentials
          // in the hash params (and we do)
          // So for now, just emit an event, and let the parent context handle it
          // In the current use case this app: https://github.com/metapages/metapage-app
          // will listen for the event and update the definition accordingly
          if (metaframe) {
            // Update in place the local references to the new metaframe URL with the
            // new hash params:
            //   - if you call metapage.getDefinition() it will include the new URL
            //   - compare metapage.getDefinition() with any updates outside of this
            //     context to decide wether to re-render or recreate
            const hashParamsUpdatePayload: MetapageEventUrlHashUpdate =
              jsonrpc.params;
            const url = new URL(metaframe.url);
            url.hash = hashParamsUpdatePayload.hash;
            // Update the local metaframe client reference
            metaframe.url = url.href;
            // Update the definition in place
            this._definition = create<MetapageDefinitionV1>(
              this._definition,
              (draft) => {
                draft.metaframes[hashParamsUpdatePayload.metaframe].url = url.href;
              }
            );

            this._emitDefinitionEvent();
          }
          break;
        default:
          if (this.debug) {
            this.log(`Unknown RPC method: "${method}"`);
          }
      }
      if (this.listenerCount(MetapageEvents.Message) > 0) {
        this.emit(MetapageEvents.Message, jsonrpc);
      }
    }
  }

  logInternal(o: any, color?: string, backgroundColor?: string) {
    backgroundColor = backgroundColor
      ? backgroundColor
      : this._consoleBackgroundColor;
    let s: string;
    if (typeof o === "string") {
      s = o as string;
    } else if (typeof o === "number") {
      s = o + "";
    } else {
      s = JSON.stringify(o);
    }
    s = this._id ? `Metapage[${this._id}] ${s}` : s;
    MetapageToolsLog(s, color, backgroundColor);
  }
}
