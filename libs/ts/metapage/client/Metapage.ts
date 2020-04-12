import {EventEmitter} from "./EventEmitter";
import {VERSION, METAPAGE_KEY_STATE, METAPAGE_KEY_DEFINITION } from "../Constants";
import {Versions} from "../MetaLibsVersion";
import { PipeInput, MetapageOptions, MetaframeInputMap, MetaframePipeId, MetaframeId, MetapageId, MetapageInstanceInputs, MetapageDefinition} from "@definitions/all";
import {
  ApiPayloadPluginRequest,
  ApiPayloadPluginRequestMethod,
  JsonRpcMethodsFromParent,
  JsonRpcMethodsFromChild,
  SetupIframeServerResponseData,
  MinimumClientMessage,
} from "@definitions/JsonRpcMethods";
import {getUrlParamDEBUG, stringToRgb, log as MetapageToolsLog, getMatchingVersion, generateMetapageId, existsAnyUrlParam, convertToCurrentDefinition} from "./MetapageTools";

export export enum MetapageEvents {
	Inputs = "inputs",
	Outputs = "outputs",
	State = "state",
	Definition = "definition",
	Error = "error",
  }

  export enum MetapageEventStateType {
    all = "all",
    delta = "delta"
  }

  export interface MetapageEventDefinition {
    definition :MetapageDefinition;
    metaframes :{ [key: string]: IFrameRpcClient; };
    plugins ?:{ [key: string]: IFrameRpcClient; };
  }

  

interface MetapageStatePartial {
	inputs  :MetapageInstanceInputs;
	outputs :MetapageInstanceInputs;
}

export interface MetapageState {
	metaframes: MetapageStatePartial;
	plugins   : MetapageStatePartial;
}

type Url=string;
type Listener = (a1?:any, a2?:any)=>void;

const emptyState = () :MetapageState => 
	{
		return {
			metaframes:  {inputs: {}, outputs: {}},
			plugins   : {inputs: {}, outputs: {}},
		};
	}
export const getLibraryVersionMatching = (version :string) :Versions =>
{
	return getMatchingVersion(version);
}

const CONSOLE_BACKGROUND_COLOR_DEFAULT = 'bcbcbc';

export class Metapage extends EventEmitter
{
	// The current version is always the latest
	public static readonly version = VERSION;

	// Event literals for users to listen to events
	public static readonly DEFINITION = MetapageEvents.Definition;
	public static readonly INPUTS     = MetapageEvents.Inputs;
	public static readonly OUTPUTS    = MetapageEvents.Outputs;
	public static readonly STATE      = MetapageEvents.State;
	public static readonly ERROR      = MetapageEvents.Error;

	public static from(metaPageDef :any, inputs ?:any) :Metapage
	{
		if (metaPageDef == null) {
			throw 'Metapage definition cannot be null';
		}
		if (typeof(metaPageDef) === 'string') {
			try {
				metaPageDef = JSON.parse(metaPageDef);
			} catch(err) {
				throw 'Cannot parse into JSON:\n${metaPageDef}';
			}
		}

		var metapage = new Metapage();
		return metapage.setDefinition(metaPageDef);
	}

	_id :MetapageId;
	_definition :MetapageDefinition;
	_state :MetapageState = emptyState();
	_metaframes :{ [key: string]: IFrameRpcClient; } = {}; //<MetaframeId, IFrameRpcClient>
	_plugins :{ [key: string]: IFrameRpcClient; } = {}; // <Url, IFrameRpcClient>
	_pluginOrder :Url[] = [];

	debug :boolean = false;
	_consoleBackgroundColor :string;

	constructor(opts ?:MetapageOptions)
	{
		super();
		this._id = opts != null && opts.id != null ? opts.id : generateMetapageId();
		this._consoleBackgroundColor = (opts != null && opts.color != null ? opts.color : CONSOLE_BACKGROUND_COLOR_DEFAULT);

		this.onMessage = this.onMessage.bind(this);
		window.addEventListener('message', this.onMessage);

		this.log('Initialized');
	}

	public setDebugFromUrlParams() :Metapage
	{
		this.debug = existsAnyUrlParam(['MP_DEBUG', 'DEBUG', 'debug', 'mp_debug']);
		return this;
	}

	public getState() :MetapageState
	{
		return this._state;
	}

	public onState(listener :Listener) :()=>void
	{
		var disposer = this.addEventListener(MetapageEvents.State, listener);
		listener(this._state);
		return disposer;
	}

	public setState(newState :MetapageState)
	{
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

	public getStateMetaframes() :MetapageStatePartial
	{
		return this._state.metaframes;
	}

	public getStatePlugins() :MetapageStatePartial
	{
		return this._state.metaframes;
	}

	public getDefinition() :MetapageDefinition
	{
		return this._definition;
	}

	public setDefinition(def :any, state ?:MetapageState) :Metapage
	{
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
				if (typeof(metaframeDefinition) !== 'object') {
					this.emitErrorMessage(`Metaframe "${metaframeId}" is not an object`);
					throw `Metaframe "${metaframeId}" is not an object`;
				}

				if (!metaframeDefinition.url) {
					this.emitErrorMessage(`Metaframe "${metaframeId}" missing field: url`);
					throw `Metaframe "${metaframeId}" missing field: url`;
				}
			})
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
				removeMetaframe(metaframeId);
			}
		});

		// destroy any plugins not in the new definition
		Object.keys(this._plugins).forEach(url => {
			// Doesn't exist? Destroy it
			if (!this._definition.plugins.includes(url)) {
				removePlugin(url);
			}
		});

		// the plugin order
		this._pluginOrder = this._definition.plugins != null ? this._definition.plugins : [];

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
		const event :MetapageEventDefinition = {
			definition: this._definition,
			metaframes: this._metaframes,
			plugins   : this._plugins,
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
	addPipe(target :MetaframeId, input :PipeInput)
	{
		// Do all the cache checking
		if (!this._inputMap.exists(target)) {
			this._inputMap.set(target, []);
		}
		this._inputMap.get(target).push(input);
	}

	// do not expose, change definition instead
	function removeMetaframe(metaframeId :MetaframeId) :void
	{
		if (!this._metaframes.exists(metaframeId)) {
			return;
		}

		this._metaframes[metaframeId].dispose();
		this._metaframes.remove(metaframeId);
		this._state.metaframes.inputs.remove(metaframeId);
		this._state.metaframes.outputs.remove(metaframeId);

		this._inputMap.remove(metaframeId);
		for (otherMetaframeId in this._inputMap.keys()) {
			var inputPipes = this._inputMap[otherMetaframeId];
			var index = 0;
			while (index <= inputPipes.length) {
				if (inputPipes[index].metaframe == metaframeId) {
					inputPipes.splice(index, 1);
				} else {
					index++;
				}
			}
		}

		// This will regenerate, simpler than surgery
		this._cachedInputLookupMap = {};
	}

	// do not expose, change definition instead
	// to add/remove
	function removePlugin(url :Url) :void
	{
		if (!this._plugins.exists(url)) {
			return;
		}

		this._plugins[url].dispose();
		this._plugins.remove(url);
		this._state.plugins.inputs.remove(url);
		this._state.plugins.outputs.remove(url);
	}

	// do not expose, change definition instead
	// to add/remove
	function removeAll() :void
	{
		for(id in this._metaframes.keys()) {
			this._metaframes.get(id).dispose();
		}
		for(id in this._plugins.keys()) {
			this._plugins.get(id).dispose();
		}
		this._metaframes = {};
		this._plugins = {};
		this._state = emptyState();
		this._inputMap = {};
		this._cachedInputLookupMap = {};
	}

	public metaframes() :JSMap<MetaframeId, IFrameRpcClient>
	{
		return getMetaframes();
	}

	public metaframeIds() :Array<MetaframeId>
	{
		return getMetaframeIds();
	}

	public getMetaframeIds() :Array<MetaframeId>
	{
		var all :Array<MetaframeId> = [];
		for (key in this._metaframes.keys()) {
			all.push(key);
		}
		return all;
	}

	public getMetaframes() :JSMap<MetaframeId, IFrameRpcClient>
	{
		var all :JSMap<MetaframeId, IFrameRpcClient> = {};
		for (key in this._metaframes.keys()) {
			all.set(key, this._metaframes.get(key));
		}
		return all;
	}

	public plugins() :JSMap<Url, IFrameRpcClient>
	{
		var all :JSMap<Url, IFrameRpcClient> = {};
		for (key in this._plugins.keys()) {
			all.set(key, this._metaframes.get(key));
		}
		return all;
	}

	public pluginIds() :Array<Url>
	{
		return getPluginIds();
	}

	public getPluginIds() :Array<Url>
	{
		return this._pluginOrder.slice(0);
	}

	public getMetaframe(id :MetaframeId) :IFrameRpcClient
	{
		return this._metaframes.get(id);
	}

	public getPlugin(url :string) :IFrameRpcClient
	{
		return this._plugins.get(url);
	}

	// do not expose, change definition instead
	function addMetaframe(metaframeId: MetaframeId, definition: MetaframeInstance) :IFrameRpcClient
	{
		if (metaframeId == null) {
			throw 'addMetaframe missing metaframeId';
		}

		if (definition == null) {
			throw 'addMetaframe missing definition';
		}

		if (metaframeId != null && this._metaframes.exists(metaframeId)) {
			this.emitErrorMessage('Existing metaframe for id=${metaframeId}');
			throw 'Existing metaframe for id=${metaframeId}';
		}

		if (definition.url == null) {
			this.emitErrorMessage('Metaframe definition missing url id=${metaframeId}');
			throw 'Metaframe definition missing url id=${metaframeId}';
		}

		var iframeClient = new IFrameRpcClient(definition.url, metaframeId, this._id, this._consoleBackgroundColor, debug)
			.setMetapage(this);
		this._metaframes.set(metaframeId, iframeClient);

		// add the pipes
		if (definition.inputs != null) {
			for (input in definition.inputs) {
				this.addPipe(metaframeId, input);
			}
		}

		// set the initial inputs
		iframeClient.setInputs(this._state.metaframes.inputs[metaframeId]);
		
		return iframeClient;
	}

	// do not expose, change definition instead
	function addPlugin(url :Url) :IFrameRpcClient
	{
		if (url == null) {
			throw 'Plugin missing url';
		}

		var iframeClient = new IFrameRpcClient(url, url, this._id, this._consoleBackgroundColor, debug)
			.setInputs(this._state.plugins.inputs[url])
			.setMetapage(this)
			.setPlugin();

		this._plugins[url] = iframeClient;

		return iframeClient;
	}

	override public dispose()
	{
		super.dispose();
		Browser.window.removeEventListener('message', onMessage);
		for (iframeId in this._metaframes.keys()) {
			this._metaframes.get(iframeId).dispose();
		}
		for (iframeId in this._plugins.keys()) {
			this._plugins.get(iframeId).dispose();
		}
		this._id = null;
		this._metaframes = null;
		this._plugins = null;
		this._state = null;
		this._definition = null;
		this._cachedInputLookupMap = null;
		this._inputMap = null;
	}

	public log(o :any, ?color :string, ?backgroundColor :string, ?pos:haxe.PosInfos)
	{
		if (!debug) {
			return;
		}
		logInternal(o, color, backgroundColor, pos);
	}

	public error(err :any, ?pos :haxe.PosInfos)
	{
		logInternal(err, "f00", this._consoleBackgroundColor, pos);
		this.emitErrorMessage('${err}');
	}

	public emitErrorMessage(err :string)
	{
		this.emit(MetapageEvents.Error, err);
	}

	// This call is cached
	var this._cachedInputLookupMap :JSMap<MetaframeId, JSMap<MetaframePipeId, Array<{metaframe :MetaframeId, pipe :MetaframePipeId}>>> = {};
	var this._inputMap :JSMap<MetaframeId, Array<PipeInput>> = {};
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
	
	function getInputsFromOutput(source :MetaframeId, outputPipeId :MetaframePipeId) :Array<{metaframe :MetaframeId, pipe :MetaframePipeId}>
	{
		// Do all the cache checking
		if (!this._cachedInputLookupMap.exists(source)) {
			this._cachedInputLookupMap.set(source, {});
		}

		if (!this._cachedInputLookupMap.get(source).exists(outputPipeId)) {
			var targets :Array<{metaframe :MetaframeId, pipe :MetaframePipeId}> = [];
			this._cachedInputLookupMap.get(source).set(outputPipeId, targets);
			// Go through the data structure, getting all the matching inputs that match this output
			for (metaframeId in this._inputMap.keys()) {
				if (metaframeId == source) { // No self pipes, does not make sense
					continue;
				}
				for (inputPipe in this._inputMap.get(metaframeId)) {
					// At least the source metaframe matches, now check pipes
					if (inputPipe.metaframe == source) {
						//Check the kind of source string
						// it could be a basic string, or a glob?
						if (minimatch(outputPipeId, inputPipe.source)) {
							// A match, now figure out the actual input pipe name
							// since it might be * or absent meaning that the input
							// field name is the same as the incoming
							var targetName = inputPipe.target;
							if (inputPipe.target == null || inputPipe.target.startsWith('*') || inputPipe.target == '') {
								targetName = outputPipeId;
							}
							targets.push({metaframe:metaframeId, pipe:targetName});
						}
					}
				}
			}
		}

		return this._cachedInputLookupMap.get(source).get(outputPipeId);
	}

	function isValidJSONRpcMessage(message :MinimumClientMessage)
	{
		if (message.jsonrpc != '2.0') {
			// do not even log messages that we do not recogize. We cannot control random scripts sending messages on
			// the only communications channel
			return false;
		}
		var method :JsonRpcMethodsFromChild = cast message.method;
		switch(method) {
			case SetupIframeClientRequest:
				//No validation possible here
				return true;
			default:
				// TODO: check origin+source
				var iframeId :MetaframeId = message.iframeId;
				if (!(message.parentId == this._id && (this._metaframes.exists(iframeId) || this._plugins.exists(iframeId)))) {
					error('message.parentId=${message.parentId} this._id=${_id} message.iframeId=${iframeId} this._metaframes.exists(message.iframeId)=${_metaframes.exists(iframeId)} this._plugins.exists(message.iframeId)=${_plugins.exists(iframeId)} message=${JSON.stringify(message).substr(0, 200)}');
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
	inline public setInput(iframeId :any, ?inputPipeId :any, ?value :any)
	{
		setInputStateOnly(iframeId, inputPipeId, value);
		setMetaframeClientInputAndSentClientEvent(iframeId, inputPipeId, value);
		// finally send the main events
		this.emit(MetapageEvents.State, this._state);
		// this.emit(MetapageEvents.Inputs, this._state);
	}

	// this is 
	function setMetaframeClientInputAndSentClientEvent(iframeId :any, ?inputPipeId :any, ?value :any)
	{
		if (typeof(iframeId) == 'object') {
			if (inputPipeId != null || value != null) {
				throw 'bad arguments, see API docs';
			}
			var inputs :any = iframeId;
			for (id in Reflect.fields(inputs)) {
				var metaframeId :MetaframeId = id;
				var metaframeInputs = Reflect.field(inputs, metaframeId);
				if (typeof(metaframeInputs) != 'object') {
					throw 'bad arguments, see API docs';
				}
				var iframeClient = this._metaframes.get(metaframeId);
				if (iframeClient != null) {
					iframeClient.setInputs(metaframeInputs);
				} else {
					error('No iframe id=$metaframeId');
				}
			}
		} else if (typeof(iframeId) == 'string') {
			var iframeClient = this._metaframes.get(iframeId);
			if (iframeClient == null) {
				error('No iframe id=$iframeId');
			}
			if (typeof(inputPipeId) == 'string') {
				iframeClient.setInput(inputPipeId, value);
			} else if (typeof(inputPipeId) == 'object') {
				iframeClient.setInputs(inputPipeId);
			} else {
				throw 'bad arguments, see API docs';
			}
		} else {
			throw 'bad arguments, see API docs';
		}
	}

	public setInputs(iframeId :any, ?inputPipeId :any, ?value :any) {
		setInput(iframeId, inputPipeId, value);
	}

	inline function setOutputStateOnly(iframeId :any, ?inputPipeId :any, ?value :any)
	{
		this._setStateOnly(false, iframeId, inputPipeId, value);
	}

	// Set the global inputs cache
	inline function setInputStateOnly(iframeId :any, ?inputPipeId :any, ?value :any)
	{
		this._setStateOnly(true, iframeId, inputPipeId, value);
	}

	// need to set the boolean first because we don't know the metaframe/pluginId until we dig into
	// the object. but it might not be an object. this flexibility might not be worth it, although
	// the logic is reasonble to test
	function this._setStateOnly(isInputs :boolean, iframeId :any, ?inputPipeId :any, ?value :any)
	{
		if (typeof(iframeId) == 'object') {
			// it's an object of metaframeIds to pipeIds to values [metaframeId][pipeId]
			// so the other fields should be undefined
			if (inputPipeId != null || value != null) {
				throw 'Second argument cannot be null';
			}
			var inputsMetaframesNew :MetapageInstanceInputs = iframeId;
			for (metaframeId in inputsMetaframesNew.keys()) {
				var metaframeValuesNew :MetaframeInputMap = inputsMetaframesNew[metaframeId];
				if (typeof(metaframeValuesNew) != 'object') {
					throw 'Object values must be objects';
				}

				var isMetaframe = this._metaframes.exists(metaframeId);
				if (!isMetaframe && !this._plugins.exists(metaframeId)) {
					throw 'No metaframe or plugin: ${metaframeId}';
				}
				var inputOrOutputState = isMetaframe
					? (isInputs ? this._state.metaframes.inputs : this._state.metaframes.outputs)
					: (isInputs ? this._state.plugins.inputs : this._state.plugins.outputs);

				// Ensure a map
				inputOrOutputState[metaframeId] = inputOrOutputState[metaframeId] != null ? inputOrOutputState[metaframeId] : cast {};

				for (metaframePipedId in metaframeValuesNew.keys()) {
					// A key with a value of undefined means remove the key from the state object
					if (js.Syntax.strictEq(metaframeValuesNew[metaframePipedId], js.Lib.undefined)) {
						js.Syntax.delete(inputOrOutputState[metaframeId], metaframePipedId);
					} else {
						// otherwise set the new value
						inputOrOutputState[metaframeId][metaframePipedId] = metaframeValuesNew[metaframePipedId];
					}
				}
			}
		} else if (typeof(iframeId) == 'string') {
			var metaframeId :MetaframeId  = iframeId;
			var isMetaframe = this._metaframes.exists(metaframeId);
			if (!isMetaframe && !this._plugins.exists(metaframeId)) {
				throw 'No metaframe or plugin: ${metaframeId}';
			}
			var inputOrOutputState = isMetaframe
				? (isInputs ? this._state.metaframes.inputs : this._state.metaframes.outputs)
				: (isInputs ? this._state.plugins.inputs : this._state.plugins.outputs);

			if (typeof(inputPipeId) == 'string') {
				// Ensure a map
				inputOrOutputState[metaframeId] = inputOrOutputState[metaframeId] != null ? inputOrOutputState[metaframeId] : cast {};

				var metaframePipeId :MetaframePipeId = inputPipeId;

				// A key with a value of undefined means remove the key from the state object
				if (js.Syntax.strictEq(value, js.Lib.undefined)) {
					js.Syntax.delete(inputOrOutputState[metaframeId], metaframePipeId);
				} else {
					// otherwise set the new value
					inputOrOutputState[metaframeId][metaframePipeId] = value;
				}
			} else if (typeof(inputPipeId) == 'object') {
				// Ensure a map
				inputOrOutputState[metaframeId] = inputOrOutputState[metaframeId] != null ? inputOrOutputState[metaframeId] : cast {};

				var metaframeValuesNew :MetaframeInputMap = inputPipeId;

				for (metaframePipedId in metaframeValuesNew.keys()) {
					// A key with a value of undefined means remove the key from the state object
					if (js.Syntax.strictEq(metaframeValuesNew[metaframePipedId], js.Lib.undefined)) {
						js.Syntax.delete(inputOrOutputState[metaframeId], metaframePipedId);
					} else {
						// otherwise set the new value
						inputOrOutputState[metaframeId][metaframePipedId] = metaframeValuesNew[metaframePipedId];
					}
				}
			} else {
				throw 'Second argument must be a string or an object';
			}			
		} else {
			throw 'First argument must be a string or an object';
		}
	}

	inline function getMetaframeOrPlugin(key :string) :IFrameRpcClient
	{
		var val = this._metaframes[key];
		if (val == null) {
			val = this._plugins[key];
		}
		return val;
	}

	function onMessage(e :Event)
	{
		if (typeof(untyped e.data) == "object") {
			var jsonrpc :MinimumClientMessage = untyped e.data;
			if (!isValidJSONRpcMessage(jsonrpc)) {
				if (this.debug) {
					log('invalid message ${JSON.stringify(jsonrpc).substr(0, 200)}');
				}
				return;
			}
			// var origin :string = untyped e.origin;
			// var source :IFrameElement = untyped e.source;
			//Verify here
			var method :JsonRpcMethodsFromChild = cast jsonrpc.method;

			switch(method) {
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
				case SetupIframeClientRequest:
					for (metaframeId in this._metaframes.keys()) {
						var iframeClient = this._metaframes.get(metaframeId);
						iframeClient.register();
					}

					for (url in this._plugins.keys()) {
						var iframeClient = this._plugins.get(url);
						iframeClient.register();
					}

				/* A client iframe responded */
				case SetupIframeServerResponseAck:
					/* Send all inputs when a client has registered.*/
					var params :SetupIframeClientAckData = jsonrpc.params;
					var metaframe = getMetaframeOrPlugin(jsonrpc.iframeId);
					metaframe.registered(params.version);

				case OutputsUpdate:
					var metaframeId :MetaframeId = jsonrpc.iframeId;
					var outputs :MetaframeInputMap = jsonrpc.params;

					if (debug) log('outputs ${outputs} from ${metaframeId}');

					if (this._metaframes.exists(metaframeId)) {
						var iframe = this._metaframes.get(metaframeId);

						// set the internal state, no event yet
						setOutputStateOnly(metaframeId, outputs);
						// iframe outputs, metaframe only event sent
						iframe.setOutputs(outputs);
						// now sent metapage event
						this.emit(MetapageEvents.State, this._state);
						
						// cached lookup of where those outputs are going
						var modified = false;
						for (outputKey in outputs.keys()) {
							var targets = getInputsFromOutput(metaframeId, outputKey);
							if (targets.length > 0) {
								for (outputSet in targets) {
									var inputBlob :MetaframeInputMap = {};
									inputBlob.set(outputSet.pipe, outputs.get(outputKey));
									// update the metapage state first (no events)
									setInputStateOnly(outputSet.metaframe, outputSet.pipe, outputs.get(outputKey));
									// setting the individual inputs sends an event
									this._metaframes.get(outputSet.metaframe).setInputs(inputBlob);
									modified = true;
								}
							}
						}
						// only send a state event if downstream inputs were modified
						if (modified) {
							this.emit(MetapageEvents.State, this._state);
						}
						if (debug) {
							iframe.ack({jsonrpc:jsonrpc, state:_state});
						}
					} else if (this._plugins.exists(metaframeId)) {
						// the metapage state special pipes (definition and global state)
						// are not persisted in the plugin state
						var outputPersistanceAllowed = outputs[METAPAGE_KEY_STATE] == null && outputs[METAPAGE_KEY_DEFINITION] == null;
						if (outputPersistanceAllowed) {
							setOutputStateOnly(metaframeId, outputs);
						}
						// it might not seem meaningful to set the plugin outputs, since plugin outputs
						// do not flow into other plugin inputs. However, the outputs are specifically
						// listened to, for the purposes of e.g. setting the definition or state
						this._plugins.get(metaframeId).setOutputs(outputs);

						// TODO: question
						// I'm not sure if plugin outputs should trigger a state event, since it's not
						// metaframe state.
						if (outputPersistanceAllowed) {
							this.emit(MetapageEvents.State, this._state);
						}
						if (debug) {
							this._plugins.get(metaframeId).ack({jsonrpc:jsonrpc, state:_state});
						}
					} else {
						error('missing metaframe/plugin=$metaframeId');
					}

				case InputsUpdate:
					// logInternal("metapage InputsUpdate " + JSON.stringify(jsonrpc, null, "  "));
					// This is triggered by the metaframe itself, meaning the metaframe
					// decided to save this state info.
					// We store it in the local state, then send it back so 
					// the metaframe is notified of its input state.
					var metaframeId :MetaframeId = jsonrpc.iframeId;
#if jsondiff
					logDiff = getDiffRelease('${metaframeId}: ${method}');
#end
					var inputs :MetaframeInputMap = jsonrpc.params;
					if (debug) log('inputs ${inputs} from ${metaframeId}');
					if (this._metaframes.exists(metaframeId)) {

						// Set the internal inputs state first so that anything that
						// responds to events will get the updated state if requested
						// Currently on for setting metaframe inputs that haven't loaded yet
						// logInternal('metaframe ${metaframeId} setInputStateOnly ');
						setInputStateOnly(metaframeId, inputs);

						switch(this._metaframes.get(metaframeId).version) {
							// These old versions create a circular loop of inputs updating
							// if you just set the inputs here. Those internal metaframes
							// already have notified their own listeners, so just emit
							// events but do not process the inputs further
							// Emitting the events causes the internal state to get updated.
							case V0_0_1,V0_1_0:
								this._metaframes.get(metaframeId).emit(MetapageEvents.Inputs, inputs);
								if (this.isListeners(MetapageEvents.Inputs)) {
									var metaframeInputs :MetapageInstanceInputs = {};
									metaframeInputs[metaframeId] = inputs;
									this.emit(MetapageEvents.Inputs, metaframeInputs);
								}
							default:
								// New versions can safely set their inputs here, their
								// own internal listeners have not yet been notified.
								// logInternal('metaframe ${metaframeId} setInputs ' + JSON.stringify(inputs, null, "  "));
								this._metaframes.get(metaframeId).setInputs(inputs);
						}
						this.emit(MetapageEvents.State, this._state);
						if (debug) {
							this._metaframes.get(metaframeId).ack({jsonrpc:jsonrpc, state:_state});
						}
						
					} else if (this._plugins.exists(metaframeId)) {
						// the metapage state special pipes (definition and global state)
						// are not persisted in the plugin state
						var inputPersistanceAllowed = inputs[METAPAGE_KEY_STATE] == null && inputs[METAPAGE_KEY_DEFINITION] == null;
						if (inputPersistanceAllowed) {
							setInputStateOnly(metaframeId, inputs);
						}
						this._plugins.get(metaframeId).setInputs(inputs);
						if (inputPersistanceAllowed) {
							this.emit(MetapageEvents.State, this._state);
						}
						if (debug) {
							this._plugins.get(metaframeId).ack({jsonrpc:jsonrpc, state:_state});
						}
					} else {
						Browser.window.console.error('InputsUpdate failed no metaframe or plugin id: "${metaframeId}""');
						error('InputsUpdate failed no metaframe or plugin id: "${metaframeId}""');
					}
				case PluginRequest:
					var pluginId = jsonrpc.iframeId;
#if jsondiff
					logDiff = getDiffRelease('${pluginId}: ${method}');
#end
					if (this._plugins[pluginId] != null && this._plugins[pluginId].hasPermissionsState()) {
						this._plugins[pluginId].setInput(METAPAGE_KEY_STATE, this._state);
						if (debug) {
							this._plugins.get(pluginId).ack({jsonrpc:jsonrpc, state:_state});
						}
					}
				default:
					if (debug) {
						log('Unknown RPC method: "${method}"');
					}
			}
#if jsondiff
			if (logDiff != null) logDiff();
#end

			this.emit(OtherEvents.Message, jsonrpc);
		}
	}
	
	function logInternal(o :any, ?color :string, ?backgroundColor :string, ?pos:haxe.PosInfos)
	{
		backgroundColor = backgroundColor != null ? backgroundColor : this._consoleBackgroundColor;
		var s :string = switch(typeof(o)) {
			case "string": cast o;
			case "number": o + "";
			default: JSON.stringify(o);
		}
		s = this._id != null ? 'Metapage[$_id] $s' : s;
		MetapageTools.log(s, color, backgroundColor, pos);
	}

#if jsondiff
	// get the state, and log the diff on the callback
	function getDiffRelease(label :string) :void=>void
	{
		var mp = this;
		var state = JSON.parse(JSON.stringify(mp.getState()));
		return function() {
			var newState = mp.getState();
			Browser.console.log(label + ': '+ JSONDiff.diffstring(state, newState));
		};
	}
}

@:jsRequire("json-diff")
extern class JSONDiff
{
    // @:selfCall
    public static function diffstring(v1 :any, v2 :any) :string;
	
}
#else
}
#end


class IFrameRpcClient extends EventEmitter
{
	public var iframe (default, null):#if nodejs any #else IFrameElement #end;
	public var id (default, null):MetaframeId;
	public var version (default, null):MetaLibsVersion;
	// Used for securing postMessage
	public var url :string;
	var this._color :string;
	var this._consoleBackgroundColor :string;
	var this._ready :Promise<boolean>;
	var inputs :MetaframeInputMap = {};
	var outputs :MetaframeInputMap = {};
	var this._disposables :Array<void=>void> = [];
	var this._rpcListeners :Array<RequestDef=>void> = [];
	var this._loaded :boolean = false;
	var this._onLoaded : Array<void=>void> = [];
	var this._parentId :MetapageId;
	var this._debug :boolean;
	var this._sendInputsAfterRegistration :boolean = false;
	public var this._definition :MetaframeDefinition;
	var this._plugin :boolean;

	var this._metapage :Metapage;

	public new(url :string, iframeId :MetaframeId, parentId :MetapageId, consoleBackgroundColor :string, ?debug :boolean = false)
	{
		super();
		// Url sanitation
		// Urls can be relative paths, if so, turn them into absolute URLs
		// Also local development often skips the "http:" part, so add that
		// on so the origin is valid
		if (!url.startsWith('http')) {
			while(url.startsWith('/')) {
				url = url.substr(1);
			}
			var location = js.Browser.location;
			url = location.protocol + '//' + location.hostname + (location.port != null && location.port != '' ? ':' + location.port: '') + '/' + url;
		}
		this.url = url;

		// Add the custom URL params
		var urlBlob = new js.html.URL(this.url);
		if (debug) {
			urlBlob.searchParams.set(URL_PARAM_DEBUG, '1');
		}
		this.url = urlBlob.href;

		this.id = iframeId;
		this.iframe = Browser.document.createIFrameElement();
		// this.iframe.scrolling = "no";
		this.iframe.src = this.url;
		this._debug = debug || existsAnyUrlParam(['DEBUG_METAFRAMES', 'debug_metaframes', 'debug_' + this.id, 'DEBUG_' + this.id]);
		this.iframe.frameBorder = "0";
		this._parentId = parentId;
		this._color = MetapageTools.stringToRgb(this.id);
		this._consoleBackgroundColor = consoleBackgroundColor;
	}

	public setPlugin() :IFrameRpcClient
	{
		if (this._loaded) {
			throw 'Cannot setPlugin after IFrameRpcClient already loaded';
		}
		this._plugin = true;
		bindPlugin();
		return this;
	}

	public setMetapage(metapage :Metapage) :IFrameRpcClient
	{
		this._metapage = metapage;
		return this;
	}

	/**
	 * Plugins can get and set the metapage definition and state.
	 * The inputs/outputs of the plugin MUST define those inputs
	 * otherwise the 
	 * @return Promise<boolean>
	 */
	function bindPlugin()
	{
		//   1) check for metapage/definition inputs and outputs
		//		- if found, wire up listeners and responses and send current definition
		//   2) check for metapage/state inputs and outputs
		//		- if found, listen for JSON-RPC events from that plugin and send the state.
		//      - if found, set the entire state on 'metapage/state' output
		return getDefinition()
			.then(function(metaframeDef) {
				// definition get/set
				// send the metapage/definition immediately
				// on getting a metapage/definition value, set that
				// value on the metapage itself. 
				trace('${id} hasPermissionsDefinition()  ${hasPermissionsDefinition()}');
				if (hasPermissionsDefinition()) {
					var disposer = this._metapage.addEventListener(MetapageEvents.Definition, function(definition) {
						this.setInput(METAPAGE_KEY_DEFINITION, definition.definition);
					});
					this._disposables.push(disposer);
					// we do not need to send the current actual definition, because
					// a MetapageEvents.Definition event will be fired subsequent to adding this
					// Set the metapage definition now, otherwise it will not ever get
					// the event.
					var currentMetapageDef = this._metapage.getDefinition();
					this.setInput(METAPAGE_KEY_DEFINITION, currentMetapageDef);

					if (metaframeDef.outputs != null) {
						var disposer = this.onOutput(METAPAGE_KEY_DEFINITION, function(definition) {
							trace('_metapage.setDefinition, definition=${definition}');
							this._metapage.setDefinition(definition);
						});
						this._disposables.push(disposer);
					}
				}

				if (hasPermissionsState()) {
					// if the plugin sets the metapage state, set it here
					if (metaframeDef.outputs != null) {
						var disposer = this.onOutput(METAPAGE_KEY_STATE, function(state) {
							this._metapage.setState(state);
						});
						this._disposables.push(disposer);
					}
				}
			})
			.then(function(this._) {
				return true;
			})
			.catchError(function(err) {
				this._metapage.emit(MetapageEvents.Error, 'Failed to get plugin definition from "${this.getDefinitionUrl()}", error=${err}');
			});
	}

	public hasPermissionsState() :boolean
	{
		return this._definition != null && this._definition.inputs[METAPAGE_KEY_STATE] != null;
	}

	public hasPermissionsDefinition() :boolean
	{
		return this._definition != null && this._definition.inputs[METAPAGE_KEY_DEFINITION] != null;
	}

	public getDefinitionUrl() :string
	{
		var url = new URL(this.url);
		url.pathname = url.pathname + (url.pathname.endsWith('/') ? 'metaframe.json' : '/metaframe.json');
		return url.href;
	}

	public getDefinition() :Promise<MetaframeDefinition>
	{
		if (this._definition != null) {
			return Promise.resolve(this._definition);
		}
		var url = this.getDefinitionUrl();

		return Browser.window.fetch(url)
			.then(function(response) {
				return response.json();
			})
			.then(function(metaframeDef) {
				this._definition = metaframeDef;
				return metaframeDef;
			});
	}

	public setInput(name :MetaframePipeId, inputBlob :any)
	{
		assert(name != null);
		var inputs :MetaframeInputMap = {};
		inputs.set(name, inputBlob);
		setInputs(inputs);
	}

	/**
	 * Sends the updated inputs to the iframe
	 */
	var this._cachedEventInputsUpdate = {iframeId:null,inputs:null};
	public setInputs(maybeNewInputs :MetaframeInputMap) :IFrameRpcClient
	{
		// log({m:'IFrameRpcClient', inputs:maybeNewInputs});
		if (!this.inputs.merge(maybeNewInputs)) {
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
			sendInputs(maybeNewInputs);
		// } else {
		// 	log('Not setting input bc this._loaded=$_loaded');
		}

		// Notify
		this.emit(MetapageEvents.Inputs, this.inputs);
		if (this._metapage.isListeners(MetapageEvents.Inputs)) {
			var inputUpdate :MetapageInstanceInputs = {};
			inputUpdate[id] = maybeNewInputs;
			this._metapage.emit(MetapageEvents.Inputs, inputUpdate);
		}
		//TODO is this really used anymore?
		this._cachedEventInputsUpdate.iframeId = id;
		this._cachedEventInputsUpdate.inputs = this.inputs;
		this._metapage.emit(JsonRpcMethodsFromParent.InputsUpdate, this._cachedEventInputsUpdate);

		return this;
	}

	public setOutput(pipeId :MetaframePipeId, updateBlob :any)
	{
		assert(pipeId != null);
		var outputs :MetaframeInputMap = {};
		outputs.set(pipeId, updateBlob);
		setOutputs(outputs);
	}

	var this._cachedEventOutputsUpdate = {iframeId:null,inputs:null};
	public setOutputs(maybeNewOutputs :MetaframeInputMap)
	{
		if (!this.outputs.merge(maybeNewOutputs)) {
			return;
		}
		this.emit(MetapageEvents.Outputs, maybeNewOutputs);

		for (outputPipeId in maybeNewOutputs.keys()) {
			log('output [${outputPipeId}]');
		}
		if (this._metapage.isListeners(MetapageEvents.Outputs)) {
			var outputsUpdate :MetapageInstanceInputs = {};
			outputsUpdate[this.id] = this.outputs;
			this._metapage.emit(MetapageEvents.Outputs, outputsUpdate);
		}
	}

	public onInputs(f :MetaframeInputMap=>void) :void=>void
	{
		return this.on(MetapageEvents.Inputs, f);
	}

	public onInput(pipeName :MetaframePipeId, f :any=>void) :void=>void
	{
		var fWrap = function(inputs :MetaframeInputMap) {
			if (inputs.exists(pipeName)) {
				f(inputs[pipeName]);
			}
		}
		return this.on(MetapageEvents.Inputs, fWrap);
	}

	public onOutputs(f :MetaframeInputMap=>void) :void=>void
	{
		return this.on(MetapageEvents.Outputs, f);
	}

	public onOutput(pipeName :MetaframePipeId, f :any=>void) :void=>void
	{
		var fWrap = function(outputs :MetaframeInputMap) {
			if (outputs.exists(pipeName)) {
				f(outputs[pipeName]);
			}
		}
		return this.on(MetapageEvents.Outputs, fWrap);
	}

	override public dispose()
	{
		super.dispose();
		while(this._disposables != null && this._disposables.length > 0) {
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
			Browser.window.clearInterval(this._bufferTimeout);
			this._bufferTimeout = null;
		}
		this._metapage = null;
	}

	/**
	 * Request that the parent metapage tell us what our id is
	 */
	public register()
	{
		if (this._loaded) {
			return;
		}
		
		var response :SetupIframeServerResponseData = {
			iframeId: id,
			parentId: this._parentId,
			plugin  : this._plugin,
			state   : {inputs:this.inputs},
			version : Metapage.version,
		};
		sendRpcInternal(JsonRpcMethodsFromParent.SetupIframeServerResponse, response);
	}

	public registered(version :MetaLibsVersion)
	{
		if (this._loaded) {
			return;
		}
		this.version = version;
		// Only very old versions don't send their version info
		// Obsoleted?
		if (this.version == null) {
			this.version = MetaLibsVersion.V0_1_0;
		}
		this._loaded = true;
		while(this._onLoaded != null && this._onLoaded.length > 0) {
			this._onLoaded.pop()();
		}
		// You still need to set the inputs even though they
		// may have been set initially, because the inputs may
		// have been been updated before the metaframe internal
		// returned its server ack.
		if (this._sendInputsAfterRegistration) {
			sendInputs(this.inputs);
		}
		// log('registered version=${this.version}');
	}

	function sendInputs(inputs :MetaframeInputMap)
	{
		sendRpc(JsonRpcMethodsFromParent.InputsUpdate, {inputs :inputs, parentId: this._parentId});
	}

	public sendRpc(method :string, params :any)
	{
		if (this.iframe.parentNode != null && this._loaded) {
			sendRpcInternal(method, params);
		} else {
			this._metapage.error('sending rpc later');
			this._onLoaded.push(function() {
				sendRpcInternal(method, params);
			});
		}
	}

	public ack(message :any)
	{
		log('⚒ ⚒ ⚒ calling ack');
		if (this._debug) {
			log('⚒ ⚒ ⚒ sending ack from client to frame');
			var payload :ClientMessageRecievedAck = {message: message};
			sendRpc(JsonRpcMethodsFromParent.MessageAck, payload);
		} else {
			log('⚒ ⚒ ⚒ NOT sending ack from client to frame since not debug mode');
		}
	}

	public log(o :any, ?pos:haxe.PosInfos)
	{
		if (!this._debug) {
			return;
		}
		logInternal(o, pos);
	}

	function logInternal(o :any, pos:haxe.PosInfos)
	{
		var s :string = switch(typeof(o)) {
			case "string": cast o;
			case "number": o + "";
			default: JSON.stringify(o);
		}
		MetapageTools.log('Metapage[$_parentId] Metaframe[$id] $s', this._color, this._consoleBackgroundColor, pos);
	}

	function sendRpcInternal(method :string, params :any)
	{
		var messageJSON :MinimumClientMessage = {
			iframeId: id,
			jsonrpc : '2.0',
			method  : method,
			params  : params,
			parentId: this._parentId,
		};
		if (this.iframe != null) {
			sendOrBufferPostMessage(messageJSON);
		} else {
			this._metapage.error('Cannot send to child iframe messageJSON=${JSON.stringify(messageJSON).substr(0, 200)}');
		}
	}

	var this._bufferMessages :Array<any>;
	var this._bufferTimeout :Int;
	function sendOrBufferPostMessage(message :any)
	{
		if (this.iframe.contentWindow != null) {
			this.iframe.contentWindow.postMessage(message, this.url);
		} else {
			if (this._bufferMessages == null) {
				this._bufferMessages = [message];
				this._bufferTimeout = Browser.window.setInterval(function() {
					if (this.iframe.contentWindow != null) {
						for (m in this._bufferMessages) {
							this.iframe.contentWindow.postMessage(m, this.url);
						}
						Browser.window.clearInterval(this._bufferTimeout);
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
