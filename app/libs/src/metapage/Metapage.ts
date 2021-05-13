import { ListenerFn } from "eventemitter3";
import minimatch from "minimatch";
import { VERSION, METAPAGE_KEY_STATE, METAPAGE_KEY_DEFINITION } from "./Constants";
import { Versions } from "./MetaLibsVersion";
import {
  MetaframeInstance,
  PipeInput,
  MetapageOptions,
  MetaframeInputMap,
  MetaframePipeId,
  MetaframeId,
  MetapageId,
  MetapageInstanceInputs,
  MetapageDefinition
} from "./v0_3/all";
import {
  JsonRpcMethodsFromChild,
  MinimumClientMessage,
  SetupIframeClientAckData,
} from "./v0_3/JsonRpcMethods";
import {
  log as MetapageToolsLog,
  getMatchingVersion,
  generateMetapageId,
  existsAnyUrlParam,
  convertToCurrentDefinition,
  pageLoaded,
} from "./MetapageTools";
import { MetapageShared } from "./Shared";
import { MetapageEvents, MetapageEventDefinition, MetapageEventUrlHashUpdate } from "./MetapageEvents";
import { MetapageIFrameRpcClient } from "./MetapageIFrameRpcClient";

export enum MetapageEventStateType {
  all = "all",
  delta = "delta"
}

interface MetapageStatePartial {
  inputs: MetapageInstanceInputs;
  outputs: MetapageInstanceInputs;
}

export interface MetapageState {
  metaframes: MetapageStatePartial;
  plugins: MetapageStatePartial;
}

type Url = string;
// type Listener = (a1? : any, a2? : any) => void;

const emptyState = (): MetapageState => {
  return {
    metaframes: {
      inputs: {},
      outputs: {}
    },
    plugins: {
      inputs: {},
      outputs: {}
    }
  };
};
export const getLibraryVersionMatching = (version: string): Versions => {
  return getMatchingVersion(version);
};

type MetaframeInputTargetsFromOutput = {
  metaframe: MetaframeId;
  pipe: MetaframePipeId;
}

const CONSOLE_BACKGROUND_COLOR_DEFAULT = "bcbcbc";

// export class Metapage extends EventEmitter<MetapageEvents | JsonRpcMethodsFromParent | OtherEvents> {
export class Metapage extends MetapageShared {
  // The current version is always the latest
  public static readonly version = VERSION;

  // Event literals for users to listen to events
  public static readonly DEFINITION = MetapageEvents.Definition;
  public static readonly INPUTS = MetapageEvents.Inputs;
  public static readonly OUTPUTS = MetapageEvents.Outputs;
  public static readonly STATE = MetapageEvents.State;
  public static readonly ERROR = MetapageEvents.Error;

  public static from(metaPageDef: any, inputs?: any): Metapage {
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
  // Easier to ensure this value is never null|undefined
  // _definition: MetapageDefinition = { version: Versions.V0_3, metaframes: {} };
  _state: MetapageState = emptyState();
  _metaframes: {
    [key: string]: MetapageIFrameRpcClient;
  } = {}; //<MetaframeId, MetapageIFrameRpcClient>
  _plugins: {
    [key: string]: MetapageIFrameRpcClient;
  } = {}; // <Url, MetapageIFrameRpcClient>
  _pluginOrder: Url[] = [];

  debug: boolean = false;
  _consoleBackgroundColor: string;

  // for caching input lookups
  _cachedInputLookupMap: {
    [key: string]: { // metaframeId
      [key: string]: MetaframeInputTargetsFromOutput[]; // <metaframeId, MetaframeInputTargetsFromOutput[]>
    };
  } = {};
  _inputMap: {
    [key: string]: PipeInput[];
  } = {};
  // Example:
  // 	{
  //     "version": "0.1.0",
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

  constructor(opts?: MetapageOptions) {
    super();
    this._id = opts && opts.id
      ? opts.id
      : generateMetapageId();
    this._consoleBackgroundColor = opts && opts.color
      ? opts.color
      : CONSOLE_BACKGROUND_COLOR_DEFAULT;

    this.addPipe = this.addPipe.bind(this);
    this.dispose = this.dispose.bind(this);
    // this.getDefinition = this.getDefinition.bind(this);
    this.addMetaframe = this.addMetaframe.bind(this);
    this.addPlugin = this.addPlugin.bind(this);
    this.getInputsFromOutput = this.getInputsFromOutput.bind(this);
    this.getMetaframe = this.getMetaframe.bind(this);
    this.getMetaframeIds = this.getMetaframeIds.bind(this);
    this.getMetaframeOrPlugin = this.getMetaframeOrPlugin.bind(this);
    this.getMetaframes = this.getMetaframes.bind(this);
    this.getPlugin = this.getPlugin.bind(this);
    this.getPluginIds = this.getPluginIds.bind(this);
    this.getState = this.getState.bind(this);
    this.getStateMetaframes = this.getStateMetaframes.bind(this);
    this.isValidJSONRpcMessage = this.isValidJSONRpcMessage.bind(this);
    this.log = this.log.bind(this);
    this.logInternal = this.logInternal.bind(this);
    this.metaframeIds = this.metaframeIds.bind(this);
    this.metaframes = this.metaframes.bind(this);
    this.onMessage = this.onMessage.bind(this);
    this.pluginIds = this.pluginIds.bind(this);
    this.plugins = this.plugins.bind(this);
    this.removeAll = this.removeAll.bind(this);
    this.removeMetaframe = this.removeMetaframe.bind(this);
    this.removePlugin = this.removePlugin.bind(this);
    this.setDebugFromUrlParams = this.setDebugFromUrlParams.bind(this);
    this.setDefinition = this.setDefinition.bind(this);
    this.setInput = this.setInput.bind(this);
    this.setInputs = this.setInputs.bind(this);
    this.setInputStateOnly = this.setInputStateOnly.bind(this);
    this.setMetaframeClientInputAndSentClientEvent = this.setMetaframeClientInputAndSentClientEvent.bind(this);
    this.setOutputStateOnly = this.setOutputStateOnly.bind(this);
    this.setState = this.setState.bind(this);
    // TODO is updatePluginsWithDefinition necessary with the emitDefinitionEvent?
    this.updatePluginsWithDefinition = this.updatePluginsWithDefinition.bind(this);
    this._emitDefinitionEvent = this._emitDefinitionEvent.bind(this);


    // see ARCHITECTURE.md
    // when the page is loaded, only then start listening to messages from metaframes
    pageLoaded().then(() => {
      window.addEventListener("message", this.onMessage);
      this.log("Initialized");
    });
  }

  addListenerReturnDisposer(event: MetapageEvents, listener: ListenerFn<any[]>): () => void {
    super.addListener(event, listener);
    const disposer = () => {
      super.removeListener(event, listener);
    };
    return disposer;
  }

  public setDebugFromUrlParams(): Metapage {
    this.debug = existsAnyUrlParam(["MP_DEBUG", "DEBUG", "debug", "mp_debug"]);
    return this;
  }

  public getState(): MetapageState {
    return this._state;
  }

  public setState(newState: MetapageState) {
    this._state = newState;
    this.getMetaframeIds().forEach(metaframeId => {
      this.getMetaframe(metaframeId).setInputs(this._state.metaframes.inputs[metaframeId]);
      this.getMetaframe(metaframeId).setOutputs(this._state.metaframes.outputs[metaframeId]);
    });
    this.getPluginIds().forEach((pluginId: string) => {
      this.getPlugin(pluginId).setInputs(this._state.plugins.inputs[pluginId]);
      this.getPlugin(pluginId).setOutputs(this._state.plugins.outputs[pluginId]);
    });
    this.emit(MetapageEvents.State, this._state);
  }

  public getStateMetaframes(): MetapageStatePartial {
    return this._state.metaframes;
  }

  public getDefinition(): MetapageDefinition {
    return this._definition;
  }

  public setDefinition(def: any, state?: MetapageState): Metapage {
    // Some validation
    // can metaframes and plugins share IDs? No.
    const newDefinition: MetapageDefinition = convertToCurrentDefinition(def);

    if (newDefinition.metaframes) {
      Object.keys(newDefinition.metaframes).forEach(metaframeId => {
        if (newDefinition.plugins && newDefinition.plugins.includes(metaframeId)) {
          this.emitErrorMessage(`Plugin with url=${metaframeId} matches metaframe. Metaframe ids and plugin urls are not allowed to collide`);
          throw `Plugin with url=${metaframeId} matches metaframe. Metaframe ids and plugin urls are not allowed to collide`;
        }

        var metaframeDefinition = newDefinition.metaframes[metaframeId];
        if (typeof metaframeDefinition !== "object") {
          this.emitErrorMessage(`Metaframe "${metaframeId}" is not an object`);
          throw `Metaframe "${metaframeId}" is not an object`;
        }

        if (!metaframeDefinition.url) {
          this.emitErrorMessage(`Metaframe "${metaframeId}" missing field: url`);
          throw `Metaframe "${metaframeId}" missing field: url`;
        }
      });
    }

    this._definition = newDefinition;
    // try to be efficient with the new definition.
    // destroy any metaframes not in the new definition
    Object.keys(this._metaframes).forEach(metaframeId => {
      // Doesn't exist? Destroy it
      if (!newDefinition.metaframes || !newDefinition.metaframes[metaframeId]) {
        // this removes the metaframe, pipes, inputs, caches

        this.removeMetaframe(metaframeId);
      }
    });

    // destroy any plugins not in the new definition
    Object.keys(this._plugins).forEach(url => {
      // Doesn't exist? Destroy it
      if (newDefinition.plugins && !newDefinition.plugins.includes(url)) {
        this.removePlugin(url);
      }
    });

    // the plugin order
    this._pluginOrder = newDefinition.plugins
      ? newDefinition.plugins
      : [];

    // if the state is updated, set that now
    if (state) {
      this._state = state;
    }

    // Create any new metaframes needed
    if (newDefinition.metaframes) {
      Object.keys(newDefinition.metaframes).forEach(newMetaframeId => {
        if (!this._metaframes.hasOwnProperty(newMetaframeId)) {
          const metaframeDefinition = newDefinition.metaframes[newMetaframeId];
          this.addMetaframe(newMetaframeId, metaframeDefinition);
        }
      });
    }

    // Create any new plugins
    if (newDefinition.plugins) {
      newDefinition.plugins.forEach(url => {
        if (!this._plugins.hasOwnProperty(url)) {
          this.addPlugin(url);
        }
      });
    }

    // TODO set the state of the new pieces? That should happen in the addMetaframe/addPlugin methods I think

    // Send the event on the next loop to give listeners time to re-add
    // after this method returns.
    window.setTimeout(() => {
      this._emitDefinitionEvent();
      if (state) {
        this.emit(MetapageEvents.State, this._state);
      }
    }, 0);

    return this;
  }

  // Convenience method
  _emitDefinitionEvent() {
    const event: MetapageEventDefinition = {
      definition: this._definition,
      metaframes: this._metaframes,
      plugins: this._plugins
    };
    this.emit(MetapageEvents.Definition, event);
  }

  // do not expose, change definition instead
  addPipe(target: MetaframeId, input: PipeInput) {
    // Do all the cache checking
    if (!this._inputMap[target]) {
      this._inputMap[target] = [];
    }
    this._inputMap[target].push(input);
  }

  // do not expose, change definition instead
  removeMetaframe(metaframeId: MetaframeId) {
    if (!this._metaframes[metaframeId]) {
      return;
    }

    this._metaframes[metaframeId].dispose();
    delete this._metaframes[metaframeId];
    delete this._state.metaframes.inputs[metaframeId];
    delete this._state.metaframes.outputs[metaframeId];

    delete this._inputMap[metaframeId];
    Object.keys(this._inputMap).forEach(otherMetaframeId => {
      const inputPipes = this._inputMap[otherMetaframeId];
      let index = 0;
      while (index <= inputPipes.length) {
        if (inputPipes[index].metaframe === metaframeId) {
          inputPipes.splice(index, 1);
        } else {
          index++;
        }
      }
    });

    // This will regenerate, simpler than surgery
    this._cachedInputLookupMap = {};
  }

  // do not expose, change definition instead
  // to add/remove
  removePlugin(url: Url): void {
    if (!this._plugins[url]) {
      return;
    }

    this._plugins[url].dispose();
    delete this._plugins[url];
    delete this._state.plugins.inputs[url];
    delete this._state.plugins.outputs[url];
  }

  // do not expose, change definition instead
  // to add/remove
  removeAll(): void {
    Object.keys(this._metaframes).forEach(id => this._metaframes[id].dispose());
    Object.keys(this._plugins).forEach(id => this._plugins[id].dispose());
    this._metaframes = {};
    this._plugins = {};
    this._state = emptyState();
    this._inputMap = {};
    this._cachedInputLookupMap = {};
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
    //<MetaframeId,MetapageIFrameRpcClient>
    return Object.assign({}, this._metaframes);
  }

  public plugins(): {
    [key: string]: MetapageIFrameRpcClient;
  } {
    //<Url,MetapageIFrameRpcClient>
    return Object.assign({}, this._plugins);
  }

  public pluginIds(): Array<Url> {
    return this.getPluginIds();
  }

  public getPluginIds(): Array<Url> {
    return this._pluginOrder.slice(0);
  }

  public getMetaframe(id: MetaframeId): MetapageIFrameRpcClient {
    return this._metaframes[id];
  }

  public getPlugin(url: string): MetapageIFrameRpcClient {
    return this._plugins[url];
  }

  // do not expose, change definition instead
  addMetaframe(metaframeId: MetaframeId, definition: MetaframeInstance): MetapageIFrameRpcClient {
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
      this.emitErrorMessage(`Metaframe definition missing url id=${metaframeId}`);
      throw `Metaframe definition missing url id=${metaframeId}`;
    }

    var iframeClient = new MetapageIFrameRpcClient(this, definition.url, metaframeId, this._id, this._consoleBackgroundColor, this.debug).setMetapage(this);
    this._metaframes[metaframeId] = iframeClient;

    // add the pipes
    if (definition.inputs) {
      definition.inputs.forEach(input => this.addPipe(metaframeId, input));
    }

    // set the initial inputs
    iframeClient.setInputs(this._state.metaframes.inputs[metaframeId]);

    return iframeClient;
  }

  // do not expose, change definition instead
  addPlugin(url: Url): MetapageIFrameRpcClient {
    if (!url) {
      throw "Plugin missing url";
    }

    var iframeClient = new MetapageIFrameRpcClient(this, url, url, this._id, this._consoleBackgroundColor, this.debug).setInputs(this._state.plugins.inputs[url]).setMetapage(this).setPlugin();
    bindPlugin(this, iframeClient);
    this._plugins[url] = iframeClient;

    return iframeClient;
  }

  public dispose() {
    super.removeAllListeners();
    window.removeEventListener("message", this.onMessage);
    if (this._metaframes) {
      Object.keys(this._metaframes).forEach(metaframeId => this._metaframes[metaframeId].dispose());
    }
    if (this._plugins) {
      Object.keys(this._plugins).forEach(pluginId => this._plugins[pluginId].dispose());
    }

    // help the gc remove references but ignore the TS warnings as this object is now gone so don't touch it
    // @ts-ignore
    this._id = undefined;
    // @ts-ignore
    this._metaframes = undefined;
    // @ts-ignore
    this._plugins = undefined;
    // @ts-ignore
    this._state = undefined;
    // this._definition = undefined;
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
  getInputsFromOutput(source: MetaframeId, outputPipeId: MetaframePipeId): MetaframeInputTargetsFromOutput[] {
    // Do all the cache checking
    if (!this._cachedInputLookupMap[source]) {
      this._cachedInputLookupMap[source] = {};
    }

    if (!this._cachedInputLookupMap[source][outputPipeId]) {
      var targets: MetaframeInputTargetsFromOutput[] = [];
      this._cachedInputLookupMap[source][outputPipeId] = targets;
      // Go through the data structure, getting all the matching inputs that match this output
      Object.keys(this._inputMap).forEach(metaframeId => {
        if (metaframeId === source) {
          // No self pipes, does not make sense
          return;
        }
        this._inputMap[metaframeId].forEach(inputPipe => {
          // At least the source metaframe matches, now check pipes
          if (inputPipe.metaframe == source) {
            //Check the kind of source string
            // it could be a basic string, or a glob?
            if (minimatch(outputPipeId, inputPipe.source)) {
              // A match, now figure out the actual input pipe name
              // since it might be * or absent meaning that the input
              // field name is the same as the incoming
              var targetName = inputPipe.target;
              if (!inputPipe.target || inputPipe.target.startsWith("*") || inputPipe.target === "") {
                targetName = outputPipeId;
              }
              targets.push({ metaframe: metaframeId, pipe: targetName });
            }
          }
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
        if (iframeId && !(message.parentId === this._id && (this._metaframes[iframeId] || this._plugins[iframeId]))) {
          // if (iframeId && !(message.parentId === this._id && this._metaframes[iframeId])) {
          // this.error(`message.parentId=${message.parentId} this._id=${this._id} message.iframeId=${iframeId} this._metaframes.hasOwnProperty(message.iframeId)=${this._metaframes[iframeId] !== undefined} this._plugins.hasOwnProperty(message.iframeId)=${this._plugins[iframeId] !== undefined} message=${JSON.stringify(message).substr(0, 200)}`);
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
   * @param iframeId Can be an object of {metaframeId:{pipeId:value}} or the metaframe/plugin id
   * @param inputPipeId If the above is a string id, then inputPipeId can be the pipe id or an object {pipeId:value}
   * @param value If the above is a pipe id, then the is the value.
   */
  public setInput(iframeId: any, inputPipeId?: any, value?: any) {
    this.setInputStateOnly(iframeId, inputPipeId, value);
    this.setMetaframeClientInputAndSentClientEvent(iframeId, inputPipeId, value);
    // finally send the main events
    this.emit(MetapageEvents.State, this._state);
    this.emit(MetapageEvents.Inputs, this._state);
  }

  // this is
  setMetaframeClientInputAndSentClientEvent(iframeId: any, inputPipeId?: any, value?: any) {
    if (typeof iframeId === "object") {
      if (inputPipeId || value) {
        throw "bad arguments, see API docs";
      }
      const inputs: any = iframeId;
      Object.keys(inputs).forEach(id => {
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

  public setInputs(iframeId: any, inputPipeId?: any, value?: any) {
    this.setInput(iframeId, inputPipeId, value);
  }

  setOutputStateOnly(iframeId: any, inputPipeId?: any, value?: any) {
    this._setStateOnly(false, iframeId, inputPipeId, value);
  }

  // Set the global inputs cache
  setInputStateOnly(iframeId: any, inputPipeId?: any, value?: any) {
    this._setStateOnly(true, iframeId, inputPipeId, value);
  }

  // need to set the boolean first because we don't know the metaframe/pluginId until we dig into
  // the object. but it might not be an object. this flexibility might not be worth it, although
  // the logic is reasonble to test
  _setStateOnly(isInputs: boolean, iframeId: any, inputPipeId?: any, value?: any) {
    if (typeof iframeId === "object") {
      // it's an object of metaframeIds to pipeIds to values [metaframeId][pipeId]
      // so the other fields should be undefined
      if (inputPipeId || value) {
        throw "If first argument is an object, subsequent args should be undefined";
      }
      const inputsMetaframesNew: MetapageInstanceInputs = iframeId;
      Object.keys(inputsMetaframesNew).forEach(metaframeId => {
        var metaframeValuesNew: MetaframeInputMap = inputsMetaframesNew[metaframeId];
        if (typeof metaframeValuesNew !== "object") {
          throw "Object values must be objects";
        }

        const isMetaframe = this._metaframes.hasOwnProperty(metaframeId);
        if (!isMetaframe && !this._plugins.hasOwnProperty(metaframeId)) {
          throw "No metaframe or plugin: ${metaframeId}";
        }

        const inputOrOutputState = isMetaframe
          ? isInputs
            ? this._state.metaframes.inputs
            : this._state.metaframes.outputs
          : isInputs
            ? this._state.plugins.inputs
            : this._state.plugins.outputs;

        // Ensure a map
        inputOrOutputState[metaframeId] = inputOrOutputState[metaframeId]
          ? inputOrOutputState[metaframeId]
          : ({} as MetaframeInstance);

        Object.keys(metaframeValuesNew).forEach(metaframePipedId => {
          // A key with a value of undefined means remove the key from the state object
          if (metaframeValuesNew[metaframePipedId] === undefined) {
            delete inputOrOutputState[metaframeId][metaframePipedId];
          } else {
            // otherwise set the new value
            inputOrOutputState[metaframeId][metaframePipedId] = metaframeValuesNew[metaframePipedId];
          }
        });
      });
    } else if (typeof iframeId === "string") {
      const metaframeId: MetaframeId = iframeId;
      const isMetaframe = this._metaframes.hasOwnProperty(metaframeId);
      if (!isMetaframe && !this._plugins.hasOwnProperty(metaframeId)) {
        throw `No metaframe or plugin: ${metaframeId}`;
      }
      const inputOrOutputState = isMetaframe
        ? isInputs
          ? this._state.metaframes.inputs
          : this._state.metaframes.outputs
        : isInputs
          ? this._state.plugins.inputs
          : this._state.plugins.outputs;

      if (typeof inputPipeId === "string") {
        // Ensure a map
        inputOrOutputState[metaframeId] = inputOrOutputState[metaframeId]
          ? inputOrOutputState[metaframeId]
          : ({} as MetaframeInstance);

        const metaframePipeId: MetaframePipeId = inputPipeId;

        // A key with a value of undefined means remove the key from the state object
        if (value === undefined) {
          delete inputOrOutputState[metaframeId][metaframePipeId];
        } else {
          // otherwise set the new value
          inputOrOutputState[metaframeId][metaframePipeId] = value;
        }
      } else if (typeof inputPipeId === "object") {
        // Ensure a map
        inputOrOutputState[metaframeId] = inputOrOutputState[metaframeId]
          ? inputOrOutputState[metaframeId]
          : ({} as MetaframeInstance);

        const metaframeValuesNew: MetaframeInputMap = inputPipeId;

        Object.keys(metaframeValuesNew).forEach(metaframePipedId => {
          // A key with a value of undefined means remove the key from the state object
          if (metaframeValuesNew[metaframePipedId] === undefined) {
            delete inputOrOutputState[metaframeId][metaframePipedId];
          } else {
            // otherwise set the new value
            inputOrOutputState[metaframeId][metaframePipedId] = metaframeValuesNew[metaframePipedId];
          }
        });
      } else {
        throw "Second argument must be a string or an object";
      }
    } else {
      throw "First argument must be a string or an object";
    }
  }

  getMetaframeOrPlugin(key: string): MetapageIFrameRpcClient {
    // TODO: this is not good, it will lead to subtle bugs, fix it
    var val = this._metaframes[key];
    if (!val) {
      val = this._plugins[key];
    }
    return val;
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
      if (!metaframeId) { // so if it's missing, bail early
        return;
      }

      const metaframeOrPlugin = this.getMetaframeOrPlugin(metaframeId);
      const isPlugin = this._plugins[metaframeId]!!;

      switch (method) {
        /**
         * An iframe is sending a connection request.
         * Here we register it to set up a secure
         * communication channel.
         */
        case JsonRpcMethodsFromChild.SetupIframeClientRequest:
          if (metaframeOrPlugin) {
            metaframeOrPlugin.register();
          }
          break;

        /* A client iframe responded */
        case JsonRpcMethodsFromChild.SetupIframeServerResponseAck:
          /* Send all inputs when a client has registered. */
          if (metaframeOrPlugin) {
            const params = jsonrpc.params as SetupIframeClientAckData<any>;
            metaframeOrPlugin.registered(params.version);
          }
          break;

        case JsonRpcMethodsFromChild.OutputsUpdate:
          const outputs: MetaframeInputMap = jsonrpc.params;

          if (this.debug)
            this.log(`outputs from ${metaframeId}: ${JSON.stringify(outputs, null, '  ').substr(0, 100)}`);

          if (this._metaframes[metaframeId]) {
            var iframe = this._metaframes[metaframeId];

            // set the internal state, no event yet, nor downstream inputs update (yet)
            this.setOutputStateOnly(metaframeId, outputs);
            // iframe outputs, metaframe only event sent
            iframe.setOutputs(outputs);
            // now sent metapage event
            this.emit(MetapageEvents.State, this._state);

            // cached lookup of where those outputs are going
            var modified = false;
            Object.keys(outputs).forEach(outputKey => {
              const targets: MetaframeInputTargetsFromOutput[] = this.getInputsFromOutput(metaframeId!, outputKey);
              if (targets.length > 0) {
                targets.forEach(target => {
                  var inputBlob: MetaframeInputMap = {};
                  inputBlob[target.pipe] = outputs[outputKey];
                  // update the metapage state first (no events)
                  this.setInputStateOnly(target.metaframe, target.pipe, outputs[outputKey]);
                  // setting the individual inputs sends an event
                  this._metaframes[target.metaframe].setInputs(inputBlob);
                  modified = true;
                });
              }
            });
            // only send a state event if downstream inputs were modified
            if (modified) {
              this.emit(MetapageEvents.State, this._state);
            }
            if (this.debug) {
              iframe.ack({ jsonrpc: jsonrpc, state: this._state });
            }
          }
          else if (this._plugins[metaframeId]) {
            // the metapage state special pipes (definition and global state)
            // are not persisted in the plugin state
            const outputPersistanceAllowed = !outputs[METAPAGE_KEY_STATE] && !outputs[METAPAGE_KEY_DEFINITION];
            if (outputPersistanceAllowed) {
              this.setOutputStateOnly(metaframeId, outputs);
            }
            // it might not seem meaningful to set the plugin outputs, since plugin outputs
            // do not flow into other plugin inputs. However, the outputs are specifically
            // listened to, for the purposes of e.g. setting the definition or state
            this._plugins[metaframeId].setOutputs(outputs);

            // TODO: question
            // I'm not sure if plugin outputs should trigger a state event, since it's not
            // metaframe state.
            if (outputPersistanceAllowed) {
              this.emit(MetapageEvents.State, this._state);
            }
            if (this.debug) {
              this._plugins[metaframeId].ack({ jsonrpc: jsonrpc, state: this._state });
            }
          }
          else {
            this.error(`missing metaframe/plugin=$metaframeId`);
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
            // logInternal('metaframe ${metaframeId} _metaframes[metaframeId] ');
            this.setInputStateOnly(metaframeId, inputs);

            switch (this._metaframes[metaframeId].version) {
              // These old versions create a circular loop of inputs updating
              // if you just set the inputs here. Those internal metaframes
              // already have notified their own listeners, so just emit
              // events but do not process the inputs further
              // Emitting the events causes the internal state to get updated.
              case Versions.V0_0_1:
              case Versions.V0_1_0:
                this._metaframes[metaframeId].emit(MetapageEvents.Inputs, inputs);
                if (this.listenerCount(MetapageEvents.Inputs) > 0) {
                  var metaframeInputs: MetapageInstanceInputs = {};
                  metaframeInputs[metaframeId] = inputs;
                  this.emit(MetapageEvents.Inputs, metaframeInputs);
                }
                break;
              default:
                // New versions can safely set their inputs here, their
                // own internal listeners have not yet been notified.
                // logInternal('metaframe ${metaframeId} setInputs ' + JSON.stringify(inputs, null, "  "));
                this._metaframes[metaframeId].setInputs(inputs);
                break;
            }
            this.emit(MetapageEvents.State, this._state);
            if (this.debug) {
              this._metaframes[metaframeId].ack({ jsonrpc: jsonrpc, state: this._state });
            }
          }
          else if (this._plugins[metaframeId]) {
            // the metapage state special pipes (definition and global state)
            // are not persisted in the plugin state
            const inputPersistanceAllowed = !inputs[METAPAGE_KEY_STATE] && !inputs[METAPAGE_KEY_DEFINITION];
            if (inputPersistanceAllowed) {
              this.setInputStateOnly(metaframeId, inputs);
            }
            this._plugins[metaframeId].setInputs(inputs);
            if (inputPersistanceAllowed) {
              this.emit(MetapageEvents.State, this._state);
            }
            if (this.debug) {
              this._plugins[metaframeId].ack({ jsonrpc: jsonrpc, state: this._state });
            }
          }
          else {
            console.error(`InputsUpdate failed no metaframe or plugin id: "${metaframeId}"`);
            this.error(`InputsUpdate failed no metaframe or plugin id: "${metaframeId}"`);
          }
          break;
        case JsonRpcMethodsFromChild.PluginRequest:
          if (isPlugin && metaframeOrPlugin) {
            if (metaframeOrPlugin.hasPermissionsState()) {
              metaframeOrPlugin.setInput(METAPAGE_KEY_STATE, this._state);
              if (this.debug) {
                metaframeOrPlugin.ack({ jsonrpc: jsonrpc, state: this._state });
              }
            }
          }
          break;
        case JsonRpcMethodsFromChild.HashParamsUpdate:
          // Not really sure how to "automatically" process this right here
          // It's a potential automatic security concern, IF we want to put credentials
          // in the hash params (and we do)
          // So for now, just emit an event, and let the parent context handle it
          // In the current use case this app: https://github.com/metapages/metapage-app
          // will listen for the event and update the definition accordingly
          if (!isPlugin && metaframeOrPlugin) {
            // Update in place the local references to the new metaframe URL with the
            // new hash params:
            //   - if you call metapage.getDefinition() it will include the new URL
            //   - compare metapage.getDefinition() with any updates outside of this
            //     context to decide wether to re-render or recreate
            const hashParamsUpdatePayload: MetapageEventUrlHashUpdate = jsonrpc.params;
            const url = new URL(metaframeOrPlugin.url);
            url.hash = hashParamsUpdatePayload.hash;
            // Update the local metaframe client reference
            metaframeOrPlugin.url = url.href;
            // Update the definition in place
            this._definition.metaframes[hashParamsUpdatePayload.metaframe].url = url.href;
            // TODO needed?
            this.emit(MetapageEvents.UrlHashUpdate, jsonrpc.params);
            this._emitDefinitionEvent();
          }
          break;
        default:
          if (this.debug) {
            this.log(`Unknown RPC method: "${method}"`);
          }
      }
      this.emit(MetapageEvents.Message, jsonrpc);
    }
  }

  updatePluginsWithDefinition() {
    const currentMetapageDef = this.getDefinition();
    Object.values(this._plugins).forEach(plugin => {
      if (plugin.hasPermissionsDefinition()) {
        updatePluginWithDefinition(plugin);
      }
    });
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
    s = this._id
      ? `Metapage[${this._id}] ${s}`
      : s;
    MetapageToolsLog(s, color, backgroundColor);
  }
}

/**
   * Plugins can get and set the metapage definition and state.
   * The inputs/outputs of the plugin MUST define those inputs
   * otherwise the
   * @return Promise<boolean>
   */
const bindPlugin = async (metapage: Metapage, plugin: MetapageIFrameRpcClient) => {
  //   1) check for metapage/definition inputs and outputs
  //		- if found, wire up listeners and responses and send current definition
  //   2) check for metapage/state inputs and outputs
  //		- if found, listen for JSON-RPC events from that plugin and send the state.
  //      - if found, set the entire state on 'metapage/state' output
  try {
    const metaframeDef = await plugin.getDefinition();
    // A new definition can be loaded before the above finishes
    if (plugin.isDisposed()) {
      return;
    }
    // definition get/set
    // send the metapage/definition immediately
    // on getting a metapage/definition value, set that
    // value on the metapage itself.
    if (plugin.hasPermissionsDefinition()) {
      var disposer = metapage.addListenerReturnDisposer(MetapageEvents.Definition, definition => {
        plugin.setInput(METAPAGE_KEY_DEFINITION, definition.definition);
      });
      plugin._disposables.push(disposer);
      // we do not need to send the current actual definition, because
      // a MetapageEvents.Definition event will be fired subsequent to adding this
      // Set the metapage definition now, otherwise it will not ever get
      // the event.
      var currentMetapageDef = metapage.getDefinition();
      plugin.setInput(METAPAGE_KEY_DEFINITION, currentMetapageDef);

      if (metaframeDef.outputs) {
        var disposer = plugin.onOutput(METAPAGE_KEY_DEFINITION, definition => {
          // trace('_metapage.setDefinition, definition=${definition}');
          metapage.emit(MetapageEvents.DefinitionUpdateRequest, definition)
          // metapage.setDefinition(definition);
        });
        plugin._disposables.push(disposer);
      }
    }

    if (plugin.hasPermissionsState()) {
      // if the plugin sets the metapage state, set it here
      if (metaframeDef.outputs) {
        var disposer = plugin.onOutput(METAPAGE_KEY_STATE, state => {
          metapage.setState(state);
        });
        plugin._disposables.push(disposer);
      }
    }
  } catch (err) {
    console.error(err);
    metapage.emit(MetapageEvents.Error, `Failed to get plugin definition from "${plugin.getDefinitionUrl()}", error=${err}`);
  }
}

const updatePluginWithDefinition = (plugin: MetapageIFrameRpcClient) => {
  const currentMetapageDef = plugin._metapage.getDefinition();
  plugin.setInput(METAPAGE_KEY_DEFINITION, currentMetapageDef);
}

// const ERROR_MESSAGE_PAGE_NOT_LOADED = `
// The page must be loaded before metaframes(iframes) can be created:
//     import { pageLoaded } from "@metapages/metapage";
//     // somewhere in your code
//     await pageLoaded();
//     Metapage.from(... <definition>...)
// `
