import {EventEmitter} from "./EventEmitter";
import * as match from "minimatch";
import {URL_PARAM_DEBUG, VERSION, METAPAGE_KEY_STATE, METAPAGE_KEY_DEFINITION} from "../Constants";
import {Versions} from "../MetaLibsVersion";
import {
  MetaframeDefinition,
  MetaframeInstance,
  PipeInput,
  MetapageOptions,
  MetaframeInputMap,
  MetaframePipeId,
  MetaframeId,
  MetapageId,
  MetapageInstanceInputs,
  MetapageDefinition
} from "../v0_3/all";
import {
  JsonRpcMethodsFromParent,
  JsonRpcMethodsFromChild,
  SetupIframeServerResponseData,
  MinimumClientMessage,
  SetupIframeClientAckData,
  OtherEvents,
  ClientMessageRecievedAck
} from "../v0_3/JsonRpcMethods";
import {
  stringToRgb,
  log as MetapageToolsLog,
  getMatchingVersion,
  generateMetapageId,
  existsAnyUrlParam,
  convertToCurrentDefinition,
  merge,
} from "./MetapageTools";
import {JsonRpcRequest} from "../jsonrpc2";

export enum MetapageEvents {
  Inputs = "inputs",
  Outputs = "outputs",
  State = "state",
  Definition = "definition",
  Error = "error"
}

export enum MetapageEventStateType {
  all = "all",
  delta = "delta"
}

export interface MetapageEventDefinition {
  definition: MetapageDefinition;
  metaframes: {
    [key: string]: IFrameRpcClient
  };
  plugins?: {
    [key: string]: IFrameRpcClient
  };
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
type Listener = (a1? : any, a2? : any) => void;

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
export const getLibraryVersionMatching = (version : string): Versions => {
  return getMatchingVersion(version);
};

const CONSOLE_BACKGROUND_COLOR_DEFAULT = "bcbcbc";

export class Metapage extends EventEmitter {
  // The current version is always the latest
  public static readonly version = VERSION;

  // Event literals for users to listen to events
  public static readonly DEFINITION = MetapageEvents.Definition;
  public static readonly INPUTS = MetapageEvents.Inputs;
  public static readonly OUTPUTS = MetapageEvents.Outputs;
  public static readonly STATE = MetapageEvents.State;
  public static readonly ERROR = MetapageEvents.Error;

  public static from(metaPageDef : any, inputs? : any): Metapage {
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
  _definition: MetapageDefinition;
  _state: MetapageState = emptyState();
  _metaframes: {
    [key: string]: IFrameRpcClient
  } = {}; //<MetaframeId, IFrameRpcClient>
  _plugins: {
    [key: string]: IFrameRpcClient
  } = {}; // <Url, IFrameRpcClient>
  _pluginOrder: Url[] = [];

  debug: boolean = false;
  _consoleBackgroundColor: string;

  // for caching input lookups
  // _cachedInputLookupMap :JSMap<MetaframeId, JSMap<MetaframePipeId, Array<{metaframe :MetaframeId, pipe :MetaframePipeId}>>> = {};
  _cachedInputLookupMap: {
    [key: string]: {
      [key: string]: {
        metaframe: MetaframeId;
        pipe: MetaframePipeId
      }[];
    };
  } = {};
  // _inputMap :JSMap<MetaframeId, Array<PipeInput>> = {};
  _inputMap: {
    [key: string]: PipeInput[]
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

  constructor(opts? : MetapageOptions) {
    super();
    this._id = opts != null && opts.id != null
      ? opts.id
      : generateMetapageId();
    this._consoleBackgroundColor = opts != null && opts.color != null
      ? opts.color
      : CONSOLE_BACKGROUND_COLOR_DEFAULT;

    this.addPipe = this.addPipe.bind(this);
    this.dispose = this.dispose.bind(this);
    this.getDefinition = this.getDefinition.bind(this);
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
    this.onState = this.onState.bind(this);
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

    window.addEventListener("message", this.onMessage);

    this.log("Initialized");
  }

  public setDebugFromUrlParams(): Metapage {
    this.debug = existsAnyUrlParam(["MP_DEBUG", "DEBUG", "debug", "mp_debug"]);
    return this;
  }

  public getState(): MetapageState {
    return this._state;
  }

  public onState(listener : Listener): () => void {
    var disposer = this.addEventListener(MetapageEvents.State, listener);
    listener(this._state);
    return disposer;
  }

  public setState(newState : MetapageState) {
    this._state = newState;
    this.getMetaframeIds().forEach(metaframeId => {
      this.getMetaframe(metaframeId).setInputs(this._state.metaframes.inputs[metaframeId]);
      this.getMetaframe(metaframeId).setOutputs(this._state.metaframes.outputs[metaframeId]);
    });
    this.getPluginIds().forEach(pluginId => {
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

  public setDefinition(def : any, state? : MetapageState): Metapage {
    // Some validation
    // can metaframes and plugins share IDs? No.
    const newDefinition = convertToCurrentDefinition(def);
    if (newDefinition.metaframes != null) {
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

    // save previous to compare?
    // var previous = this._definition;

    this._definition = newDefinition;
    // try to be efficient with the new definition.
    // destroy any metaframes not in the new definition
    Object.keys(this._metaframes).forEach(metaframeId => {
      // Doesn't exist? Destroy it
      if (!this._definition.metaframes || !this._definition.metaframes[metaframeId]) {
        // this removes the metaframe, pipes, inputs, caches
        this.removeMetaframe(metaframeId);
      }
    });

    // destroy any plugins not in the new definition
    Object.keys(this._plugins).forEach(url => {
      // Doesn't exist? Destroy it
      if (!this._definition.plugins.includes(url)) {
        this.removePlugin(url);
      }
    });

    // the plugin order
    this._pluginOrder = this._definition.plugins != null
      ? this._definition.plugins
      : [];

    // if the state is updated, set that now
    if (state != null) {
      this._state = state;
    }

    // Create any new metaframes needed
    if (this._definition.metaframes != null) {
      Object.keys(this._definition.metaframes).forEach(newMetaframeId => {
        if (!this._metaframes.hasOwnProperty(newMetaframeId)) {
          const metaframeDefinition = this._definition.metaframes[newMetaframeId];
          this.addMetaframe(newMetaframeId, metaframeDefinition);
        }
      });
    }

    // Create any new plugins
    if (this._definition.plugins != null) {
      this._definition.plugins.forEach(url => {
        if (!this._plugins.hasOwnProperty(url)) {
          this.addPlugin(url);
        }
      });
    }

    // TODO set the state of the new pieces? That should happen in the addMetaframe/addPlugin methods I think

    // Send the event on the next loop to give listeners time to re-add
    // after this method returns.
    const event: MetapageEventDefinition = {
      definition: this._definition,
      metaframes: this._metaframes,
      plugins: this._plugins
    };
    window.setTimeout(() => {
      this.emit(MetapageEvents.Definition, event);
      if (state != null) {
        this.emit(MetapageEvents.State, this._state);
      }
    }, 0);

    return this;
  }

  // do not expose, change definition instead
  addPipe(target : MetaframeId, input : PipeInput) {
    // Do all the cache checking
    if (!this._inputMap[target]) {
      this._inputMap[target] = [];
    }
    this._inputMap[target].push(input);
  }

  // do not expose, change definition instead
  removeMetaframe(metaframeId : MetaframeId) {
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
        if (inputPipes[index].metaframe == metaframeId) {
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
  removePlugin(url : Url): void {
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

  public metaframeIds(): MetaframeId[]{
    return this.getMetaframeIds();
  }

  public getMetaframeIds(): MetaframeId[]{
    return Object.keys(this._metaframes);
  }

  public getMetaframes(): {
    [key: string]: IFrameRpcClient
  } { //<MetaframeId,IFrameRpcClient>
    return Object.assign({}, this._metaframes);
  }

  public plugins(): {
    [key: string]: IFrameRpcClient
  } { //<Url,IFrameRpcClient>
    return Object.assign({}, this._plugins);
  }

  public pluginIds(): Array<Url> {
    return this.getPluginIds();
  }

  public getPluginIds(): Array<Url> {
    return this._pluginOrder.slice(0);
  }

  public getMetaframe(id : MetaframeId): IFrameRpcClient {
    return this._metaframes[id];
  }

  public getPlugin(url : string): IFrameRpcClient {
    return this._plugins[url];
  }

  // do not expose, change definition instead
  addMetaframe(metaframeId : MetaframeId, definition : MetaframeInstance): IFrameRpcClient {
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

    var iframeClient = new IFrameRpcClient(definition.url, metaframeId, this._id, this._consoleBackgroundColor, this.debug).setMetapage(this);
    this._metaframes[metaframeId] = iframeClient;

    // add the pipes
    if (definition.inputs != null) {
      definition.inputs.forEach(input => this.addPipe(metaframeId, input));
    }

    // set the initial inputs
    iframeClient.setInputs(this._state.metaframes.inputs[metaframeId]);

    return iframeClient;
  }

  // do not expose, change definition instead
  addPlugin(url : Url): IFrameRpcClient {
    if (!url) {
      throw "Plugin missing url";
    }

    var iframeClient = new IFrameRpcClient(url, url, this._id, this._consoleBackgroundColor, this.debug).setInputs(this._state.plugins.inputs[url]).setMetapage(this).setPlugin();

    this._plugins[url] = iframeClient;

    return iframeClient;
  }

  public dispose() {
    super.dispose();
    window.removeEventListener("message", this.onMessage);
    if (this._metaframes) {
      Object.keys(this._metaframes).forEach(metaframeId => this._metaframes[metaframeId].dispose());
    }
    if (this._plugins) {
      Object.keys(this._plugins).forEach(pluginId => this._plugins[pluginId].dispose());
    }

    this._id = null;
    this._metaframes = null;
    this._plugins = null;
    this._state = null;
    this._definition = null;
    this._cachedInputLookupMap = null;
    this._inputMap = null;
  }

  public log(o : any, color? : string, backgroundColor? : string) {
    if (!this.debug) {
      return;
    }
    this.logInternal(o, color, backgroundColor);
  }

  public error(err : any) {
    this.logInternal(err, "f00", this._consoleBackgroundColor);
    this.emitErrorMessage(`${err}`);
  }

  public emitErrorMessage(err : string) {
    this.emit(MetapageEvents.Error, err);
  }

  // This call is cached

  getInputsFromOutput(source : MetaframeId, outputPipeId : MetaframePipeId): {
    metaframe: MetaframeId;
    pipe: MetaframePipeId
  }[]{
    // Do all the cache checking
    if (!this._cachedInputLookupMap[source]) {
      this._cachedInputLookupMap[source] = {};
    }

    if (!this._cachedInputLookupMap[source][outputPipeId]) {
      var targets: {
        metaframe: MetaframeId;
        pipe: MetaframePipeId
      }[] = [];
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
            console.log('attempting to match with:', match);
            if (match(outputPipeId, inputPipe.source)) {
              // A match, now figure out the actual input pipe name
              // since it might be * or absent meaning that the input
              // field name is the same as the incoming
              var targetName = inputPipe.target;
              if (!inputPipe.target || inputPipe.target.startsWith("*") || inputPipe.target === "") {
                targetName = outputPipeId;
              }
              targets.push({metaframe: metaframeId, pipe: targetName});
            }
          }
        });
      });
    }

    return this._cachedInputLookupMap[source][outputPipeId];
  }

  isValidJSONRpcMessage(message : MinimumClientMessage<any>) {
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
        var iframeId: MetaframeId = message.iframeId;
        if (!(message.parentId === this._id && (this._metaframes[iframeId] || this._plugins[iframeId]))) {
          // this.error(`message.parentId=${message.parentId} this._id=${this._id} message.iframeId=${iframeId} this._metaframes.exists(message.iframeId)=${this._metaframes[iframeId] !== undefined} this._plugins.exists(message.iframeId)=${this._plugins[iframeId] !== undefined} message=${JSON.stringify(message).substr(0, 200)}`);
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
  public setInput(iframeId : any, inputPipeId? : any, value? : any) {
    this.setInputStateOnly(iframeId, inputPipeId, value);
    this.setMetaframeClientInputAndSentClientEvent(iframeId, inputPipeId, value);
    // finally send the main events
    this.emit(MetapageEvents.State, this._state);
    // this.emit(MetapageEvents.Inputs, this._state);
  }

  // this is
  setMetaframeClientInputAndSentClientEvent(iframeId : any, inputPipeId? : any, value? : any) {
    if (typeof iframeId === "object") {
      if (inputPipeId || value) {
        throw "bad arguments, see API docs";
      }
      const inputs: any = iframeId;
      Object.keys(inputs).forEach(id => {
        // for (id in Reflect.fields(inputs)) {
        var metaframeId: MetaframeId = id;
        var metaframeInputs = inputs[metaframeId];
        if (typeof metaframeInputs !== "object") {
          throw "bad arguments, see API docs";
        }
        var iframeClient = this._metaframes[metaframeId];
        if (iframeClient != null) {
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

  public setInputs(iframeId : any, inputPipeId? : any, value? : any) {
    this.setInput(iframeId, inputPipeId, value);
  }

  setOutputStateOnly(iframeId : any, inputPipeId? : any, value? : any) {
    this._setStateOnly(false, iframeId, inputPipeId, value);
  }

  // Set the global inputs cache
  setInputStateOnly(iframeId : any, inputPipeId? : any, value? : any) {
    this._setStateOnly(true, iframeId, inputPipeId, value);
  }

  // need to set the boolean first because we don't know the metaframe/pluginId until we dig into
  // the object. but it might not be an object. this flexibility might not be worth it, although
  // the logic is reasonble to test
  _setStateOnly(isInputs : boolean, iframeId : any, inputPipeId? : any, value? : any) {
    if (typeof iframeId === "object") {
      // it's an object of metaframeIds to pipeIds to values [metaframeId][pipeId]
      // so the other fields should be undefined
      if (inputPipeId || value) {
        throw "If first argument is an object, subsequent args should be undefined";
      }
      const inputsMetaframesNew: MetapageInstanceInputs = iframeId;
      Object.keys(inputsMetaframesNew).forEach(metaframeId => {
        // for (metaframeId in inputsMetaframesNew.keys()) {
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
        inputOrOutputState[metaframeId] = inputOrOutputState[metaframeId] != null ? inputOrOutputState[metaframeId] : {} as MetaframeInstance;

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
        inputOrOutputState[metaframeId] = inputOrOutputState[metaframeId] != null
          ? inputOrOutputState[metaframeId] : {} as MetaframeInstance;

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
        inputOrOutputState[metaframeId] = inputOrOutputState[metaframeId] != null ? inputOrOutputState[metaframeId] : {} as MetaframeInstance;

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

  getMetaframeOrPlugin(key : string): IFrameRpcClient {
    // TODO: this is not good, it will lead to subtle bugs, fix it
    var val = this._metaframes[key];
    if (!val) {
      val = this._plugins[key];
    }
    return val;
  }

  onMessage(e : any) {
    if (typeof e.data === "object") {
      const jsonrpc = e.data as MinimumClientMessage<any>;
      if (!this.isValidJSONRpcMessage(jsonrpc)) {
        // if (this.debug) {
        //   this.log(`invalid message ${JSON.stringify(jsonrpc).substr(0, 200)}`);
        // }
        return;
      }
      // var origin :string = untyped e.origin;
      // var source :IFrameElement = untyped e.source;
      //Verify here
      var method = jsonrpc.method as JsonRpcMethodsFromChild;

      switch (method) {
          /**
         * An iframe has created a connection object.
         * Here we register it to set up a secure
         * communication channel between other
         * iframe clients.
         * Any time *any* SetupIframeClientRequest
         * message is received, send the appropriate
         * response to all clients, since we do not
         * know who sent the SetupIframeClientRequest.
         * The response is idempotent (already registerd
         * metaframes ignore further registration requests).
         */
        case JsonRpcMethodsFromChild.SetupIframeClientRequest:
          Object.keys(this._metaframes).forEach(metaframeId => {
            const iframeClient = this._metaframes[metaframeId];
            iframeClient.register();
          });

          Object.keys(this._plugins).forEach(url => {
            const iframeClient = this._plugins[url];
            iframeClient.register();
          });
          break;

          /* A client iframe responded */
        case JsonRpcMethodsFromChild.SetupIframeServerResponseAck:
          /* Send all inputs when a client has registered. */
          var params = jsonrpc.params as SetupIframeClientAckData<any>;
          var metaframe = this.getMetaframeOrPlugin(jsonrpc.iframeId);
          metaframe.registered(params.version);
          break;

        case JsonRpcMethodsFromChild.OutputsUpdate:
          var metaframeId: MetaframeId = jsonrpc.iframeId;
          var outputs: MetaframeInputMap = jsonrpc.params;

          if (this.debug) 
            this.log(`outputs ${outputs} from ${metaframeId}`);
          
          if (this._metaframes[metaframeId]) {
            var iframe = this._metaframes[metaframeId];

            // set the internal state, no event yet
            this.setOutputStateOnly(metaframeId, outputs);
            // iframe outputs, metaframe only event sent
            iframe.setOutputs(outputs);
            // now sent metapage event
            this.emit(MetapageEvents.State, this._state);

            // cached lookup of where those outputs are going
            var modified = false;
            Object.keys(outputs).forEach(outputKey => {
              const targets = this.getInputsFromOutput(metaframeId, outputKey);
              if (targets.length > 0) {
                Object.keys(targets).forEach(id => {
                  const outputSet = targets[id];
                  var inputBlob: MetaframeInputMap = {};
                  inputBlob[outputSet.pipe] = outputs[outputKey];
                  // update the metapage state first (no events)
                  this.setInputStateOnly(outputSet.metaframe, outputSet.pipe, outputs[outputKey]);
                  // setting the individual inputs sends an event
                  this._metaframes[outputSet.metaframe].setInputs(inputBlob);
                  modified = true;
                });
              }
            });
            // only send a state event if downstream inputs were modified
            if (modified) {
              this.emit(MetapageEvents.State, this._state);
            }
            if (this.debug) {
              iframe.ack({jsonrpc: jsonrpc, state: this._state});
            }
          } else if (this._plugins[metaframeId]) {
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
              this._plugins[metaframeId].ack({jsonrpc: jsonrpc, state: this._state});
            }
          } else {
            this.error(`missing metaframe/plugin=$metaframeId`);
          }

        case JsonRpcMethodsFromChild.InputsUpdate:
          // logInternal("metapage InputsUpdate " + JSON.stringify(jsonrpc, null, "  "));
          // This is triggered by the metaframe itself, meaning the metaframe
          // decided to save this state info.
          // We store it in the local state, then send it back so
          // the metaframe is notified of its input state.
          var metaframeId: MetaframeId = jsonrpc.iframeId;
          // #if jsondiff
          // 					logDiff = getDiffRelease('${metaframeId}: ${method}');
          // #end
          var inputs: MetaframeInputMap = jsonrpc.params;
          if (this.debug) 
            this.log(`inputs ${inputs} from ${metaframeId}`);
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
                if (this.isListeners(MetapageEvents.Inputs)) {
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
              this._metaframes[metaframeId].ack({jsonrpc: jsonrpc, state: this._state});
            }
          } else if (this._plugins[metaframeId]) {
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
              this._plugins[metaframeId].ack({jsonrpc: jsonrpc, state: this._state});
            }
          } else {
            console.error(`InputsUpdate failed no metaframe or plugin id: "${metaframeId}"`);
            this.error(`InputsUpdate failed no metaframe or plugin id: "${metaframeId}"`);
          }
        case JsonRpcMethodsFromChild.PluginRequest:
          var pluginId = jsonrpc.iframeId;
          // #if jsondiff
          // 					logDiff = getDiffRelease('${pluginId}: ${method}');
          // #end
          if (this._plugins[pluginId] != null && this._plugins[pluginId].hasPermissionsState()) {
            this._plugins[pluginId].setInput(METAPAGE_KEY_STATE, this._state);
            if (this.debug) {
              this._plugins[pluginId].ack({jsonrpc: jsonrpc, state: this._state});
            }
          }
        default:
          if (this.debug) {
            this.log(`Unknown RPC method: "${method}"`);
          }
      }
      // #if jsondiff
      // 			if (logDiff != null) logDiff();
      // #end

      this.emit(OtherEvents.Message, jsonrpc);
    }
  }

  logInternal(o : any, color? : string, backgroundColor ?:string) {
    backgroundColor = backgroundColor != null
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
    s = this._id != null
      ? `Metapage[${this._id}] ${s}`
      : s;
    MetapageToolsLog(s, color, backgroundColor);
  }

  // #if jsondiff
  //   get the state, and log the diff on the callback
  // 	getDiffRelease(label :string) :()=>void
  // 	{
  // 		var mp = this;
  // 		var state = JSON.parse(JSON.stringify(mp.getState()));
  // 		return function() {
  // 			var newState = mp.getState();
  // 			Browser.console.log(label + ': '+ JSONDiff.diffstring(state, newState));
  // 		};
  // 	}
  // }

  // @:jsRequire("json-diff")
  // extern class JSONDiff
  // {
  //      @:selfCall
  //     public static diffstring(v1 :any, v2 :any) :string;

  // }
  // #else
}
// #end

class IFrameRpcClient extends EventEmitter {
  iframe: HTMLIFrameElement;
  id: MetaframeId;
  version: Versions;
  // Used for securing postMessage
  url: string;
  _color: string;
  _consoleBackgroundColor: string;
  _ready: Promise<boolean>;
  inputs: MetaframeInputMap = {};
  outputs: MetaframeInputMap = {};
  _disposables: (() => void)[] = [];
  _rpcListeners: ((r : JsonRpcRequest<any>) => void)[] = [];
  _loaded: boolean = false;
  _onLoaded: (() => void)[] = [];
  _parentId: MetapageId;
  _debug: boolean;
  _sendInputsAfterRegistration: boolean = false;
  _definition: MetaframeDefinition;
  _plugin: boolean;

  _metapage: Metapage;

  constructor(url : string, iframeId : MetaframeId, parentId : MetapageId, consoleBackgroundColor : string, debug : boolean = false) {
    super();
    // Url sanitation
    // Urls can be relative paths, if so, turn them into absolute URLs
    // Also local development often skips the "http:" part, so add that
    // on so the origin is valid
    if (!url.startsWith("http")) {
      while (url.startsWith("/")) {
        url = url.substr(1);
      }
      url = location.protocol + "//" + location.hostname + (
        location.port != null && location.port != ""
        ? ":" + location.port
        : "") + "/" + url;
    }
    this.url = url;

    // Add the custom URL params
    var urlBlob = new URL(this.url);
    if (debug) {
      urlBlob.searchParams.set(URL_PARAM_DEBUG, "1");
    }
    this.url = urlBlob.href;

    this.id = iframeId;
    this.iframe = document.createElement("iframe");
    // this.iframe.scrolling = "no";
    this.iframe.src = this.url;
    this._debug = debug || existsAnyUrlParam([
      "DEBUG_METAFRAMES", "debug_metaframes", "debug_" + this.id,
      "DEBUG_" + this.id
    ]);
    this.iframe.frameBorder = "0";
    this._parentId = parentId;
    this._color = stringToRgb(this.id);
    this._consoleBackgroundColor = consoleBackgroundColor;

    this.ack = this.ack.bind(this);
    this.bindPlugin = this.bindPlugin.bind(this);
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
  }

  public setPlugin(): IFrameRpcClient {
    if (this._loaded) {
      throw "Cannot setPlugin after IFrameRpcClient already loaded";
    }
    this._plugin = true;
    this.bindPlugin();
    return this;
  }

  public setMetapage(metapage : Metapage): IFrameRpcClient {
    this._metapage = metapage;
    return this;
  }

  /**
   * Plugins can get and set the metapage definition and state.
   * The inputs/outputs of the plugin MUST define those inputs
   * otherwise the
   * @return Promise<boolean>
   */
  async bindPlugin() {
    //   1) check for metapage/definition inputs and outputs
    //		- if found, wire up listeners and responses and send current definition
    //   2) check for metapage/state inputs and outputs
    //		- if found, listen for JSON-RPC events from that plugin and send the state.
    //      - if found, set the entire state on 'metapage/state' output
    try {
      const metaframeDef = await this.getDefinition();
      // definition get/set
      // send the metapage/definition immediately
      // on getting a metapage/definition value, set that
      // value on the metapage itself.
      // trace('${id} hasPermissionsDefinition()  ${hasPermissionsDefinition()}');
      if (this.hasPermissionsDefinition()) {
        var disposer = this._metapage.addEventListener(MetapageEvents.Definition, definition => {
          this.setInput(METAPAGE_KEY_DEFINITION, definition.definition);
        });
        this._disposables.push(disposer);
        // we do not need to send the current actual definition, because
        // a MetapageEvents.Definition event will be fired subsequent to adding this
        // Set the metapage definition now, otherwise it will not ever get
        // the event.
        var currentMetapageDef = this._metapage.getDefinition();
        this.setInput(METAPAGE_KEY_DEFINITION, currentMetapageDef);

        if (metaframeDef.outputs) {
          var disposer = this.onOutput(METAPAGE_KEY_DEFINITION, definition => {
            // trace('_metapage.setDefinition, definition=${definition}');
            this._metapage.setDefinition(definition);
          });
          this._disposables.push(disposer);
        }
      }

      if (this.hasPermissionsState()) {
        // if the plugin sets the metapage state, set it here
        if (metaframeDef.outputs != null) {
          var disposer = this.onOutput(METAPAGE_KEY_STATE, state => {
            this._metapage.setState(state);
          });
          this._disposables.push(disposer);
        }
      }
    } catch (err) {
      this._metapage.emit(MetapageEvents.Error, `Failed to get plugin definition from "${this.getDefinitionUrl()}", error=${err}`);
    }
  }

  public hasPermissionsState(): boolean {
    return (this._definition != null && this._definition.inputs[METAPAGE_KEY_STATE] != null);
  }

  public hasPermissionsDefinition(): boolean {
    return (this._definition != null && this._definition.inputs[METAPAGE_KEY_DEFINITION] != null);
  }

  public getDefinitionUrl(): string {
    var url = new URL(this.url);
    url.pathname = url.pathname + (
      url.pathname.endsWith("/")
      ? "metaframe.json"
      : "/metaframe.json");
    return url.href;
  }

  public async getDefinition(): Promise<MetaframeDefinition> {
    if(this._definition != null) {
      return this._definition;
    }
    var url = this.getDefinitionUrl();
    const response = await window.fetch(url);
    const metaframeDef = await response.json();
    this._definition = metaframeDef;
    return metaframeDef;
  }

  public setInput(name : MetaframePipeId, inputBlob : any) {
    console.assert(name != null);
    var inputs: MetaframeInputMap = {};
    inputs.set(name, inputBlob);
    this.setInputs(inputs);
  }

  /**
   * Sends the updated inputs to the iframe
   */
  _cachedEventInputsUpdate = {
    iframeId: null,
    inputs: null
  };
  public setInputs(maybeNewInputs : MetaframeInputMap): IFrameRpcClient {
    // this.log({m:'IFrameRpcClient', inputs:maybeNewInputs});
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
    if (this.iframe.parentNode != null && this._loaded) {
      this.sendInputs(maybeNewInputs);
      // } else {
      // 	log('Not setting input bc this._loaded=$_loaded');
    }

    // Notify
    this.emit(MetapageEvents.Inputs, this.inputs);
    if (this._metapage.isListeners(MetapageEvents.Inputs)) {
      var inputUpdate: MetapageInstanceInputs = {};
      inputUpdate[this.id] = maybeNewInputs;
      this._metapage.emit(MetapageEvents.Inputs, inputUpdate);
    }
    //TODO is this really used anymore?
    this._cachedEventInputsUpdate.iframeId = this.id;
    this._cachedEventInputsUpdate.inputs = this.inputs;
    this._metapage.emit(JsonRpcMethodsFromParent.InputsUpdate, this._cachedEventInputsUpdate);

    return this;
  }

  public setOutput(pipeId : MetaframePipeId, updateBlob : any) {
    console.assert(pipeId != null);
    var outputs: MetaframeInputMap = {};
    outputs.set(pipeId, updateBlob);
    this.setOutputs(outputs);
  }

  _cachedEventOutputsUpdate = {
    iframeId: null,
    inputs: null
  };
  public setOutputs(maybeNewOutputs : MetaframeInputMap) {
    if (!merge(this.outputs, maybeNewOutputs)) {
      return;
    }
    this.emit(MetapageEvents.Outputs, maybeNewOutputs);

    // for (outputPipeId in maybeNewOutputs.keys()) {
    // 	log('output [${outputPipeId}]');
    // }
    if (this._metapage.isListeners(MetapageEvents.Outputs)) {
      var outputsUpdate: MetapageInstanceInputs = {};
      outputsUpdate[this.id] = this.outputs;
      this._metapage.emit(MetapageEvents.Outputs, outputsUpdate);
    }
  }

  public onInputs(f : (m : MetaframeInputMap) => void): () => void {
    return this.on(MetapageEvents.Inputs, f);
  }

  public onInput(pipeName : MetaframePipeId, f : (_ : any) => void): () => void {
    var fWrap = function (inputs : MetaframeInputMap) {
      if (inputs.exists(pipeName)) {
        f(inputs[pipeName]);
      }
    };
    return this.on(MetapageEvents.Inputs, fWrap);
  }

  public onOutputs(f : (m : MetaframeInputMap) => void): () => void {
    return this.on(MetapageEvents.Outputs, f);
  }

  public onOutput(pipeName : MetaframePipeId, f : (_ : any) => void): () => void {
    var fWrap = function (outputs : MetaframeInputMap) {
      if (outputs.exists(pipeName)) {
        f(outputs[pipeName]);
      }
    };
    return this.on(MetapageEvents.Outputs, fWrap);
  }

  public dispose() {
    super.dispose();
    while (this._disposables != null && this._disposables.length > 0) {
      this._disposables.pop()();
    }
    this._rpcListeners = null;
    this.inputs = null;
    this.outputs = null;
    this._ready = null;
    if (this.iframe != null && this.iframe.parentNode != null) {
      this.iframe.parentNode.removeChild(this.iframe);
    }
    this.iframe = null;
    this._bufferMessages = null;
    if (this._bufferTimeout != null) {
      window.clearInterval(this._bufferTimeout);
      this._bufferTimeout = null;
    }
    this._metapage = null;
  }

  /**
   * Request that the parent metapage tell us what our id is
   */
  public register() {
    if (this._loaded) {
      return;
    }

    var response: SetupIframeServerResponseData = {
      iframeId: this.id,
      parentId: this._parentId,
      plugin: this._plugin,
      state: {
        inputs: this.inputs
      },
      version: Metapage.version as Versions
    };
    this.sendRpcInternal(JsonRpcMethodsFromParent.SetupIframeServerResponse, response);
  }

  public registered(version : Versions) {
    if (this._loaded) {
      return;
    }
    this.version = version;
    // Only very old versions don't send their version info
    // Obsoleted?
    if (this.version == null) {
      this.version = Versions.V0_1_0;
    }
    this._loaded = true;
    while (this._onLoaded != null && this._onLoaded.length > 0) {
      this._onLoaded.pop()();
    }
    // You still need to set the inputs even though they
    // may have been set initially, because the inputs may
    // have been been updated before the metaframe internal
    // returned its server ack.
    if (this._sendInputsAfterRegistration) {
      this.sendInputs(this.inputs);
    }
    // this.log('registered version=${this.version}');
  }

  sendInputs(inputs : MetaframeInputMap) {
    this.sendRpc(JsonRpcMethodsFromParent.InputsUpdate, {
      inputs: inputs,
      parentId: this._parentId
    });
  }

  public sendRpc(method : string, params : any) {
    if (this.iframe.parentNode != null && this._loaded) {
      this.sendRpcInternal(method, params);
    } else {
      this._metapage.error("sending rpc later");
      this._onLoaded.push(function () {
        this.sendRpcInternal(method, params);
      });
    }
  }

  public ack(message : any) {
    this.log("⚒ ⚒ ⚒ calling ack");
    if (this._debug) {
      this.log("⚒ ⚒ ⚒ sending ack from client to frame");
      var payload: ClientMessageRecievedAck<any> = {
        message: message
      };
      this.sendRpc(JsonRpcMethodsFromParent.MessageAck, payload);
    } else {
      this.log("⚒ ⚒ ⚒ NOT sending ack from client to frame since not debug mode");
    }
  }

  public log(o : any) {
    if (!this._debug) {
      return;
    }
    this.logInternal(o);
  }

  logInternal(o : any) {
    let s: string;
    if (typeof o === "string") {
      s = o as string;
    } else if (typeof o === "string") {
      s = o + "";
    } else {
      s = JSON.stringify(o);
    }
    MetapageToolsLog(`Metapage[${this._parentId}] Metaframe[$id] ${s}`, this._color, this._consoleBackgroundColor);
  }

  sendRpcInternal(method : string, params : any) {
    const messageJSON: MinimumClientMessage<any> = {
      id: "_",
      iframeId: this.id,
      jsonrpc: "2.0",
      method: method,
      params: params,
      parentId: this._parentId
    };
    if (this.iframe != null) {
      this.sendOrBufferPostMessage(messageJSON);
    } else {
      this._metapage.error("Cannot send to child iframe messageJSON=${JSON.stringify(messageJSON).substr(0, 200)}");
    }
  }

  _bufferMessages: any[];
  _bufferTimeout: number;
  sendOrBufferPostMessage(message : any) {
    if (!this.iframe || !this.iframe.contentWindow) {
      console.log('no this.iframe.contentWindow, not sending message');
    }
    if (this.iframe.contentWindow != null) {
      this.iframe.contentWindow.postMessage(message, this.url);
    } else {
      if (this._bufferMessages == null) {
        this._bufferMessages = [message];
        this._bufferTimeout = window.setInterval(function () {
          if (this.iframe && this.iframe.contentWindow) {
            this._bufferMessages.forEach(m => this.iframe.contentWindow.postMessage(m, this.url));
            window.clearInterval(this._bufferTimeout);
            this._bufferTimeout = null;
            this._bufferMessages = null;
          }
        }, 0);
      } else {
        this._bufferMessages.push(message);
      }
    }
  }
}
