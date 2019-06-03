package js.metapage.client;

@:enum abstract MetapageEvents<T:haxe.Constraints.Function>(Dynamic) to Dynamic {
  // Don't modify the underlying inputs object
  var Inputs : MetapageEvents<MetapageInstanceInputs->Void> = "inputs";
  // Don't modify the underlying inputs object
  var Outputs : MetapageEvents<MetapageInstanceInputs->Void> = "outputs";
  // Whenever the input or output or metaframe or plugin state changes
  var State : MetapageEvents<MetapageState->Void> = "state";
  // Whenever the definition changes
  var Definition : MetapageEvents<MetapageEventDefinition->Void> = "definition";
  // Errors in definitions, getting required resources, misc
  var Error : MetapageEvents<Dynamic->Void> = "error";
}

typedef MetapageStatePartial = {
	var inputs  :MetapageInstanceInputs;
	var outputs :MetapageInstanceInputs;
}

typedef MetapageState = {
	var metaframes: MetapageStatePartial;
	var plugins   : MetapageStatePartial;
}


@:expose("Metapage")
@:keep
class Metapage extends EventEmitter
{
	// The current version is always the latest
	public static var version :MetaLibsVersion = Constants.VERSION;

	// Event literals for users to listen to events
	public static var DEFINITION = MetapageEvents.Definition;
	public static var INPUTS     = MetapageEvents.Inputs;
	public static var OUTPUTS    = MetapageEvents.Outputs;
	public static var STATE      = MetapageEvents.State;
	public static var ERROR      = MetapageEvents.Error;

	// TODO: move to separate js import
	static var minimatch :String->String->Bool = js.Lib.require('minimatch');

	public static function from(metaPageDef :Dynamic, ?inputs :Dynamic) :Metapage
	{
		if (metaPageDef == null) {
			throw 'Metapage definition cannot be null';
		}
		if (js.Syntax.typeof(metaPageDef) == 'string') {
			try {
				metaPageDef = Json.parse(metaPageDef);
			} catch(err :Dynamic) {
				throw 'Cannot parse into JSON:\n${metaPageDef}';
			}
		}

		var metapage = new Metapage();
		return metapage.setDefinition(metaPageDef);
	}

	public static function getLibraryVersionMatching(version :String) :MetaLibsVersion
	{
		return MetapageTools.getMatchingVersion(version);
	}

	inline static function emptyState() :MetapageState
	{
		return {
			metaframes: cast {inputs: {}, outputs: {}},
			plugins   : cast {inputs: {}, outputs: {}},
		};
	}

	var _id :MetapageId;
	var _definition :MetapageDefinition;
	var _state :MetapageState = emptyState();

	// Current input values
	// var _inputsState :MetapageInstanceInputs = {};
	// var _inputsPlugins :MetapageInstanceInputs = {};
	
	var _metaframes :JSMap<MetaframeId, IFrameRpcClient> = {};
	var _plugins :JSMap<Url, IFrameRpcClient> = {};
	var _pluginOrder :Array<Url> = [];

	public var debug :Bool = false;
	var _consoleBackgroundColor :String;

	public static var CONSOLE_BACKGROUND_COLOR_DEFAULT = 'bcbcbc';

	public function new(?opts :MetapageOptions)
	{
		super();
		_id = opts != null && opts.id != null ? opts.id : MetapageTools.generateMetapageId();
		debug = getUrlParamDEBUG();
		_consoleBackgroundColor = (opts != null && opts.color != null ? opts.color : CONSOLE_BACKGROUND_COLOR_DEFAULT);
		Browser.window.addEventListener('message', onMessage);
		log('Initialized');
	}

	public function getState() :MetapageState
	{
		return _state;
	}

	public function onState(listener :Dynamic->Void) :Void->Void
	{
		var disposer = this.addEventListener(MetapageEvents.State, listener);
		listener(_state);
		return disposer;
	}

	public function setState(newState :MetapageState)
	{
		_state = newState;
		for (metaframeId in getMetaframeIds()) {
			getMetaframe(metaframeId).setInputs(_state.metaframes.inputs[metaframeId]);
			getMetaframe(metaframeId).setOutputs(_state.metaframes.outputs[metaframeId]);
		}
		for (pluginId in getPluginIds()) {
			getPlugin(pluginId).setInputs(_state.plugins.inputs[pluginId]);
			getPlugin(pluginId).setOutputs(_state.plugins.outputs[pluginId]);
		}
		emit(MetapageEvents.State, _state);
	}

	public function getStateMetaframes() :MetapageStatePartial
	{
		return _state.metaframes;
	}

	public function getStatePlugins() :MetapageStatePartial
	{
		return _state.metaframes;
	}

	public function getDefinition() :MetapageDefinition
	{
		return _definition;
	}

	public function setDefinition(def :Dynamic, ?state :MetapageState) :Metapage
	{
		// Some validation
		// can metaframes and plugins share IDs? No.
		var newDefinition = MetapageTools.convertToCurrentDefinition(def);
		if (newDefinition.metaframes != null) {
			for (metaframeId in newDefinition.metaframes.keys()) {
				if (newDefinition.plugins != null && newDefinition.plugins.has(metaframeId)) {
					emitErrorMessage('Plugin with url=${metaframeId} matches metaframe. Metaframe ids and plugin urls are not allowed to collide');
					throw 'Plugin with url=${metaframeId} matches metaframe. Metaframe ids and plugin urls are not allowed to collide';
				}
			}
		}

		// save previous to compare?
		// var previous = _definition;

		_definition = newDefinition;
		// try to be efficient with the new definition.
		// destroy any metaframes not in the new definition
		for (metaframeId in _metaframes.keys()) {
			// Doesn't exist? Destroy it
			if (_definition.metaframes == null || !_definition.metaframes.exists(metaframeId)) {
				// this removes the metaframe, pipes, inputs, caches
				removeMetaframe(metaframeId);
			}
		}

		// destroy any plugins not in the new definition
		for (url in _plugins.keys()) {
			// Doesn't exist? Destroy it
			if (!_definition.plugins.has(url)) {
				removePlugin(url);
			}
		}

		// the plugin order
		_pluginOrder = _definition.plugins != null ? _definition.plugins : [];

		// if the state is updated, set that now
		if (state != null) {
			_state = state;
		}

		// Create any new metaframes needed
		if (_definition.metaframes != null) {
			for (newMetaframeId in _definition.metaframes.keys()) {
				if (!_metaframes.exists(newMetaframeId)) {
					var metaframeDefinition = _definition.metaframes[newMetaframeId];
					addMetaframe(newMetaframeId, metaframeDefinition);
				}
			}
		}

		// Create any new plugins
		if (_definition.plugins != null) {
			for (url in _definition.plugins) {
				if (!_plugins.exists(url)) {
					addPlugin(url);
				}
			}
		}

		// TODO set the state of the new pieces? That should happen in the addMetaframe/addPlugin methods I think

		// Send the event on the next loop to give listeners time to re-add
		// after this method returns.
		var event :MetapageEventDefinition = {
			definition: this._definition,
			metaframes: this._metaframes,
			plugins   : this._plugins,
		};
		Browser.window.setTimeout(function() {
			this.emit(MetapageEvents.Definition, event);
			if (state != null) {
				this.emit(MetapageEvents.State, _state);
			}
		}, 0);

		return this;
	}

	// public function onInputs(f :Dynamic) :Void->Void
	// {
	// 	return this.on(MetapageEvents.Inputs, f);
	// }

	// public function onOutputs(f :Dynamic) :Void->Void
	// {
	// 	return this.on(MetapageEvents.Outputs, f);
	// }

	// do not expose, change definition instead
	function addPipe(target :MetaframeId, input :PipeInput)
	{
		// Do all the cache checking
		if (!_inputMap.exists(target)) {
			_inputMap.set(target, []);
		}
		_inputMap.get(target).push(input);
	}

	// do not expose, change definition instead
	function removeMetaframe(metaframeId :MetaframeId) :Void
	{
		if (!_metaframes.exists(metaframeId)) {
			return;
		}

		_metaframes[metaframeId].dispose();
		_metaframes.remove(metaframeId);
		_state.metaframes.inputs.remove(metaframeId);
		_state.metaframes.outputs.remove(metaframeId);

		_inputMap.remove(metaframeId);
		for (otherMetaframeId in _inputMap.keys()) {
			var inputPipes = _inputMap[otherMetaframeId];
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
		_cachedInputLookupMap = {};
	}

	// do not expose, change definition instead
	// to add/remove
	function removePlugin(url :Url) :Void
	{
		if (!_plugins.exists(url)) {
			return;
		}

		_plugins[url].dispose();
		_plugins.remove(url);
		_state.plugins.inputs.remove(url);
		_state.plugins.outputs.remove(url);
	}

	// do not expose, change definition instead
	// to add/remove
	function removeAll() :Void
	{
		for(id in _metaframes.keys()) {
			_metaframes.get(id).dispose();
		}
		for(id in _plugins.keys()) {
			_plugins.get(id).dispose();
		}
		_metaframes = {};
		_plugins = {};
		_state = emptyState();
		_inputMap = {};
		_cachedInputLookupMap = {};
	}

	public function metaframes() :JSMap<MetaframeId, IFrameRpcClient>
	{
		var all :JSMap<MetaframeId, IFrameRpcClient> = {};
		for (key in _metaframes.keys()) {
			all.set(key, _metaframes.get(key));
		}
		return all;
	}

	public function metaframeIds() :Array<MetaframeId>
	{
		return getMetaframeIds();
	}

	public function getMetaframeIds() :Array<MetaframeId>
	{
		var all :Array<MetaframeId> = [];
		for (key in _metaframes.keys()) {
			all.push(key);
		}
		return all;
	}

	// public function iframes() :JSMap<MetaframeId, IFrameElement>
	// {
	// 	var all :JSMap<MetaframeId, IFrameElement> = {};
	// 	for (key in _metaframes.keys()) {
	// 		all.set(key, _metaframes.get(key).iframe);
	// 	}
	// 	return all;
	// }

	public function plugins() :JSMap<Url, IFrameRpcClient>
	{
		var all :JSMap<Url, IFrameRpcClient> = {};
		for (key in _plugins.keys()) {
			all.set(key, _metaframes.get(key));
		}
		return all;
	}

	public function pluginIds() :Array<Url>
	{
		return getPluginIds();
	}

	public function getPluginIds() :Array<Url>
	{
		return _pluginOrder.slice(0);
	}

	// public function get(id :MetaframeId) :IFrameRpcClient
	// {
	// 	return _metaframes.get(id);
	// }

	public function getMetaframe(id :MetaframeId) :IFrameRpcClient
	{
		return _metaframes.get(id);
	}

	public function getPlugin(url :String) :IFrameRpcClient
	{
		return _plugins.get(url);
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

		if (metaframeId != null && _metaframes.exists(metaframeId)) {
			throw 'Existing metaframe for id=${metaframeId}';
		}

		if (definition.url == null) {
			throw 'Metaframe definition missing url id=${metaframeId}';
		}

		var iframeClient = new IFrameRpcClient(definition.url, metaframeId, _id, _consoleBackgroundColor, debug)
			.setMetapage(this);
		_metaframes.set(metaframeId, iframeClient);

		// add the pipes
		if (definition.inputs != null) {
			for (input in definition.inputs) {
				this.addPipe(metaframeId, input);
			}
		}

		// set the initial inputs
		iframeClient.setInputs(_state.metaframes.inputs[metaframeId]);
		
		return iframeClient;
	}

	// do not expose, change definition instead
	function addPlugin(url :Url) :IFrameRpcClient
	{
		if (url == null) {
			throw 'Plugin missing url';
		}

		var iframeClient = new IFrameRpcClient(url, url, _id, _consoleBackgroundColor, debug)
			.setInputs(_state.plugins.inputs[url])
			.setMetapage(this)
			.setPlugin();

		_plugins[url] = iframeClient;

		// set the initial plugin inputs
		// iframeClient.setInputs(_state.plugins.inputs[url]);

		// TODO is this really needed?
		// iframeClient.bindPlugin();
		return iframeClient;
	}

	/**
	 * Sets inputs
	 * First update internal state, so any events that check get the new value
	 * Then update the metaframe clients
	 * Fire events 
	 * @param iframeId Can be an object of metaframes 
	 * @param inputPipeId 
	 * @param value 
	 */
	inline public function setInput(iframeId :Dynamic, ?inputPipeId :Dynamic, ?value :Dynamic)
	{
		setInputStateOnly(iframeId, inputPipeId, value);
		setMetaframeClientInputAndSentClientEvent(iframeId, inputPipeId, value);
		// finally send the main events
		this.emit(MetapageEvents.State, _state);
		// this.emit(MetapageEvents.Inputs, _state);
	}

	function setMetaframeClientInputAndSentClientEvent(iframeId :Dynamic, ?inputPipeId :Dynamic, ?value :Dynamic)
	{
		if (js.Syntax.typeof(iframeId) == 'object') {
			if (inputPipeId != null || value != null) {
				throw 'bad arguments, see API docs';
			}
			var inputs :Dynamic = iframeId;
			for (id in Reflect.fields(inputs)) {
				var metaframeId :MetaframeId = id;
				var metaframeInputs = Reflect.field(inputs, metaframeId);
				if (js.Syntax.typeof(metaframeInputs) != 'object') {
					throw 'bad arguments, see API docs';
				}
				var iframeClient = _metaframes.get(metaframeId);
				if (iframeClient != null) {
					iframeClient.setInputs(metaframeInputs);
				} else {
					error('No iframe id=$metaframeId');
				}
			}
		} else if (js.Syntax.typeof(iframeId) == 'string') {
			var iframeClient = _metaframes.get(iframeId);
			if (iframeClient == null) {
				error('No iframe id=$iframeId');
			}
			if (js.Syntax.typeof(inputPipeId) == 'string') {
				iframeClient.setInput(inputPipeId, value);
			} else if (js.Syntax.typeof(inputPipeId) == 'object') {
				iframeClient.setInputs(inputPipeId);
			} else {
				throw 'bad arguments, see API docs';
			}
		} else {
			throw 'bad arguments, see API docs';
		}
	}

	public function setInputs(iframeId :Dynamic, ?inputPipeId :Dynamic, ?value :Dynamic) {
		setInput(iframeId, inputPipeId, value);
	}

	override public function dispose()
	{
		super.dispose();
		Browser.window.removeEventListener('message', onMessage);
		for (iframeId in _metaframes.keys()) {
			_metaframes.get(iframeId).dispose();
		}
		for (iframeId in _plugins.keys()) {
			_plugins.get(iframeId).dispose();
		}
		_id = null;
		_metaframes = null;
		_plugins = null;
		_state = null;
		_definition = null;
		_cachedInputLookupMap = null;
		_inputMap = null;
	}

	public function log(o :Dynamic, ?color :String, ?backgroundColor :String, ?pos:haxe.PosInfos)
	{
		if (!debug) {
			return;
		}
		logInternal(o, color, backgroundColor, pos);
	}

	public function error(err :Dynamic, ?pos :haxe.PosInfos)
	{
		logInternal(err, "f00", _consoleBackgroundColor, pos);
		emitErrorMessage('${err}');
	}

	public function emitErrorMessage(err :String)
	{
		this.emit(MetapageEvents.Error, err);
	}

	// This call is cached
	var _cachedInputLookupMap :JSMap<MetaframeId, JSMap<MetaframePipeId, Array<{metaframe :MetaframeId, pipe :MetaframePipeId}>>> = {};
	var _inputMap :JSMap<MetaframeId, Array<PipeInput>> = {};
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
		if (!_cachedInputLookupMap.exists(source)) {
			_cachedInputLookupMap.set(source, {});
		}

		if (!_cachedInputLookupMap.get(source).exists(outputPipeId)) {
			var targets :Array<{metaframe :MetaframeId, pipe :MetaframePipeId}> = [];
			_cachedInputLookupMap.get(source).set(outputPipeId, targets);
			// Go through the data structure, getting all the matching inputs that match this output
			for (metaframeId in _inputMap.keys()) {
				if (metaframeId == source) { // No self pipes, does not make sense
					continue;
				}
				for (inputPipe in _inputMap.get(metaframeId)) {
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

		return _cachedInputLookupMap.get(source).get(outputPipeId);
	}

	function isValidJsonRpcMessage(message :MinimumClientMessage)
	{
		if (message.jsonrpc != '2.0') {
			error("message.jsonrpc != '2.0'");
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
				if (!(message.parentId == _id && (_metaframes.exists(iframeId) || _plugins.exists(iframeId)))) {
					error('message.parentId=${message.parentId} _id=${_id} message.iframeId=${iframeId} _metaframes.exists(message.iframeId)=${_metaframes.exists(iframeId)} _plugins.exists(message.iframeId)=${_plugins.exists(iframeId)} message=${Json.stringify(message).substr(0, 200)}');
					return false;
				}
				return true;
		}
	}

	// Set the global inputs cache
	inline function setInputStateOnly(metaframeId :Dynamic, ?inputPipeId :Dynamic, ?value :Dynamic)
	{
		if (_metaframes.exists(metaframeId)) {
			setInputOrOutputStateOnlyInternal(_state.metaframes.inputs, metaframeId, inputPipeId, value);
		} else {
			setInputOrOutputStateOnlyInternal(_state.plugins.inputs, metaframeId, inputPipeId, value);
		}
	}

	inline function setOutputStateOnly(metaframeId :Dynamic, ?outputPipeId :Dynamic, ?value :Dynamic)
	{
		if (_metaframes.exists(metaframeId)) {
			setInputOrOutputStateOnlyInternal(_state.metaframes.outputs, metaframeId, outputPipeId, value);
		} else {
			setInputOrOutputStateOnlyInternal(_state.plugins.outputs, metaframeId, outputPipeId, value);
		}
	}

	inline function setInputOrOutputStateOnlyInternal(inputOrOutputMaps : MetapageInstanceInputs, metaframeId :Dynamic, ?inputOrOuputPipeId :Dynamic, ?value :Dynamic)
	{
		if (js.Syntax.typeof(metaframeId) == 'object') {
			if (inputOrOuputPipeId != null || value != null) {
				throw 'bad arguments';
			}
			var inputsOrOutputs :Dynamic = metaframeId;
			for (id in Reflect.fields(inputsOrOutputs)) {
				// Ensure
				var metaframeId :MetaframeId = cast id;
				inputOrOutputMaps[metaframeId] = inputOrOutputMaps[metaframeId] != null ? inputOrOutputMaps[metaframeId] : cast {};
				var metaframeInputsOrOutputs = Reflect.field(inputsOrOutputs, metaframeId);
				if (js.Syntax.typeof(metaframeInputsOrOutputs) != 'object') {
					throw 'bad arguments, see API docs';
				}
				for (inputOrOuputPipeId in Reflect.fields(metaframeInputsOrOutputs)) {
					var metaframePipdId :MetaframePipeId = cast inputOrOuputPipeId;
					inputOrOutputMaps[metaframeId][metaframePipdId] = Reflect.field(metaframeInputsOrOutputs, inputOrOuputPipeId);
				}
			}
		} else if (js.Syntax.typeof(metaframeId) == 'string') {
			// first create a {pipeId:value} dict for the metaframes inputs, if there isn't one
			inputOrOutputMaps[metaframeId] = inputOrOutputMaps[metaframeId] != null ? inputOrOutputMaps[metaframeId] : cast {};
			// inputOrOuputPipeId is either the inputOrOuputPipeId or an object {pipeId:value}
			if (js.Syntax.typeof(inputOrOuputPipeId) == 'string') {
				inputOrOutputMaps[metaframeId][inputOrOuputPipeId] = value;
			} else if (js.Syntax.typeof(inputOrOuputPipeId) == 'object') {
				var inputsOrOutputs :Dynamic = inputOrOuputPipeId;
				for (pipeId in Reflect.fields(inputsOrOutputs)) {
					inputOrOutputMaps[metaframeId][pipeId] = Reflect.field(inputsOrOutputs, pipeId);
				}
			} else {
				throw 'bad arguments';
			}
		} else {
			throw 'bad arguments';
		}
	}

	inline function getMetaframeOrPlugin(key :String) :IFrameRpcClient
	{
		var val = _metaframes[key];
		if (val == null) {
			val = _plugins[key];
		}
		return val;
	}

	function onMessage(e :Event)
	{
		if (js.Syntax.typeof(untyped e.data) == "object") {
			var jsonrpc :MinimumClientMessage = untyped e.data;
			if (!isValidJsonRpcMessage(jsonrpc)) {
				log('invalid message ${Json.stringify(jsonrpc).substr(0, 200)}');
				return;
			}
			// var origin :String = untyped e.origin;
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
					for (iframeId in _metaframes.keys()) {
						var iframeClient = _metaframes.get(iframeId);
						iframeClient.register();
					}

					for (url in _plugins.keys()) {
						var iframeClient = _plugins.get(url);
						iframeClient.register();
					}

				/* A client iframe responded */
				case SetupIframeServerResponseAck:
					/* Send all inputs when a client has registered.*/
					var params :SetupIframeClientAckData = jsonrpc.params;
					var iframe = getMetaframeOrPlugin(jsonrpc.iframeId);
					iframe.registered(params.version);

				case OutputsUpdate:
					var iframeId :MetaframeId = jsonrpc.iframeId;
					var outputs :MetaframeInputMap = jsonrpc.params;

					if (_metaframes.exists(iframeId)) {
						var iframe = _metaframes.get(iframeId);

						// set the internal state, no event yet
						setOutputStateOnly(iframeId, outputs);
						// iframe outputs, metaframe only event sent
						iframe.setOutputs(outputs);
						// now sent metapage event
						emit(MetapageEvents.State, _state);
						
						// cached lookup of where those outputs are going
						var modified = false;
						for (outputKey in outputs.keys()) {
							var targets = getInputsFromOutput(iframeId, outputKey);
							if (targets.length > 0) {
								for (outputSet in targets) {
									var inputBlob :MetaframeInputMap = {};
									inputBlob.set(outputSet.pipe, outputs.get(outputKey));
									// update the metapage state first (no events)
									setInputStateOnly(outputSet.metaframe, outputSet.pipe, outputs.get(outputKey));
									// setting the individual inputs sends an event
									_metaframes.get(outputSet.metaframe).setInputs(inputBlob);
									modified = true;
								}
							}
						}
						// only send a state event if downstream inputs were modified
						if (modified) {
							emit(MetapageEvents.State, _state);
						}
					} else if (_plugins.exists(iframeId)) {
						// the metapage state special pipes (definition and global state)
						// are not persisted in the plugin state
						if (outputs[METAPAGE_KEY_STATE] == null && outputs[METAPAGE_KEY_DEFINITION] == null) {
							setOutputStateOnly(iframeId, outputs);
						}
						_plugins.get(iframeId).setOutputs(outputs);
						if (outputs[METAPAGE_KEY_STATE] == null && outputs[METAPAGE_KEY_DEFINITION] == null) {
							emit(MetapageEvents.State, _state);
						}
					} else {
						error('missing metaframe/plugin=$iframeId');
					}

				case InputsUpdate:
					// logInternal("metapage InputsUpdate " + Json.stringify(jsonrpc, null, "  "));
					// This is triggered by the metaframe itself, meaning the metaframe
					// decided to save this state info.
					// We store it in the local state, then send it back so 
					// the metaframe is notified of its input state.
					var metaframeId :MetaframeId = jsonrpc.iframeId;
					var inputs :MetaframeInputMap = jsonrpc.params;
					if (debug) log('inputs ${inputs} from ${metaframeId}');
					if (_metaframes.exists(metaframeId)) {

						// Set the internal inputs state first so that anything that
						// responds to events will get the updated state if requested
						// Currently on for setting metaframe inputs that haven't loaded yet
						// logInternal('metaframe ${metaframeId} setInputStateOnly ');
						setInputStateOnly(metaframeId, inputs);

						switch(_metaframes.get(metaframeId).version) {
							// These old versions create a circular loop of inputs updating
							// if you just set the inputs here. Those internal metaframes
							// already have notified their own listeners, so just emit
							// events but do not process the inputs further
							// Emitting the events causes the internal state to get updated.
							case V0_0_1,V0_1_0:
								_metaframes.get(metaframeId).emit(MetapageEvents.Inputs, inputs);
								if (this.isListeners(MetapageEvents.Inputs)) {
									var metaframeInputs :MetapageInstanceInputs = {};
									metaframeInputs[metaframeId] = inputs;
									this.emit(MetapageEvents.Inputs, metaframeInputs);
								}
							default:
								// New versions can safely set their inputs here, their
								// own internal listeners have not yet been notified.
								// logInternal('metaframe ${metaframeId} setInputs ' + Json.stringify(inputs, null, "  "));
								_metaframes.get(metaframeId).setInputs(inputs);
						}
						emit(MetapageEvents.State, _state);
						
					} else if (_plugins.exists(metaframeId)) {
						// the metapage state special pipes (definition and global state)
						// are not persisted in the plugin state
						if (inputs[METAPAGE_KEY_STATE] == null && inputs[METAPAGE_KEY_DEFINITION] == null) {
							setInputStateOnly(metaframeId, inputs);
						}
						_plugins.get(metaframeId).setInputs(inputs);
						if (inputs[METAPAGE_KEY_STATE] == null && inputs[METAPAGE_KEY_DEFINITION] == null) {
							emit(MetapageEvents.State, _state);
						}
					} else {
						Browser.window.console.error('InputsUpdate failed no metaframe or plugin id: "${metaframeId}""');
						error('InputsUpdate failed no metaframe or plugin id: "${metaframeId}""');
					}
				case PluginRequest:
					var pluginId = jsonrpc.iframeId;
					if (_plugins[pluginId] != null && _plugins[pluginId].hasPermissionsState()) {
						_plugins[pluginId].setInput(METAPAGE_KEY_STATE, _state);
					}
			}

			emit(OtherEvents.Message, jsonrpc);
		}
	}
	
	function logInternal(o :Dynamic, ?color :String, ?backgroundColor :String, ?pos:haxe.PosInfos)
	{
		backgroundColor = backgroundColor != null ? backgroundColor : _consoleBackgroundColor;
		var s :String = switch(js.Syntax.typeof(o)) {
			case "string": cast o;
			case "number": o + "";
			default: Json.stringify(o);
		}
		s = _id != null ? 'Metapage[$_id] $s' : s;
		MetapageTools.log(s, color, backgroundColor);
	}
}

class IFrameRpcClient extends EventEmitter
{
	public var iframe (default, null):#if nodejs Dynamic #else IFrameElement #end;
	public var id (default, null):MetaframeId;
	public var version (default, null):MetaLibsVersion;
	var _color :String;
	var _consoleBackgroundColor :String;
	var _ready :Promise<Bool>;
	var inputs :MetaframeInputMap = {};
	var outputs :MetaframeInputMap = {};
	var _disposables :Array<Void->Void> = [];
	var _rpcListeners :Array<RequestDef->Void> = [];
	var _loaded :Bool = false;
	var _onLoaded : Array<Void->Void> = [];
	var _parentId :MetapageId;
	// Used for securing postMessage
	var _url :String;
	var _debug :Bool;
	var _sendInputsAfterRegistration :Bool = false;
	public var _definition :MetaframeDefinition;
	var _plugin :Bool;

	var _metapage :Metapage;

	public function new(url :String, iframeId :MetaframeId, parentId :MetapageId, consoleBackgroundColor :String, ?debug :Bool = false)
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
		_url = url;

		// Add the custom URL params
		var urlBlob = new js.html.URL(url);
		urlBlob.searchParams.set(URL_PARAM_METAFRAME_ID, iframeId);
		if (debug) {
			urlBlob.searchParams.set(URL_PARAM_DEBUG, '1');
		}
		url = urlBlob.href;

		this.id = iframeId;
		this.iframe = Browser.document.createIFrameElement();
		// this.iframe.scrolling = "no";
		this.iframe.src = url;
		this._debug = debug;
		_parentId = parentId;
		_color = MetapageTools.stringToRgb(this.id);
		_consoleBackgroundColor = consoleBackgroundColor;
	}

	public function setPlugin() :IFrameRpcClient
	{
		if (_loaded) {
			throw 'Cannot setPlugin after IFrameRpcClient already loaded';
		}
		_plugin = true;
		bindPlugin();
		return this;
	}

	public function setMetapage(metapage :Metapage) :IFrameRpcClient
	{
		_metapage = metapage;
		return this;
	}

	/**
	 * Pluging can get and set the metapage definition and state.
	 * The inputs/outputs of the plugin MUST define those inputs
	 * otherwise the 
	 * @return Promise<Bool>
	 */
	public function bindPlugin()
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
				if (hasPermissionsDefinition()) {
					var disposer = _metapage.addEventListener(MetapageEvents.Definition, function(definition) {
						this.setInput(METAPAGE_KEY_DEFINITION, definition.definition);
					});
					_disposables.push(disposer);
					// we do not need to send the current actual definition, because
					// a MetapageEvents.Definition event will be fired subsequent to adding this
					// Set the metapage definition now, otherwise it will not ever get
					// the event.
					var currentMetapageDef = _metapage.getDefinition();
					this.setInput(METAPAGE_KEY_DEFINITION, currentMetapageDef);

					if (metaframeDef.outputs != null) {
						var disposer = this.onOutput(METAPAGE_KEY_DEFINITION, function(definition) {
							_metapage.setDefinition(definition);
						});
						_disposables.push(disposer);
					}
				}

				if (hasPermissionsState()) {
					// if the plugin sets the metapage state, set it here
					if (metaframeDef.outputs != null) {
						var disposer = this.onOutput(METAPAGE_KEY_STATE, function(state) {
							_metapage.setState(state);
						});
						_disposables.push(disposer);
					}
				}
			})
			.then(function(_) {
				return true;
			})
			.catchError(function(err) {
				_metapage.emit(MetapageEvents.Error, 'Failed to get plugin definition from "${this.getDefinitionUrl()}", error=${err}');
			});
	}

	public function hasPermissionsState() :Bool
	{
		return _definition != null && _definition.inputs[METAPAGE_KEY_STATE] != null;
	}

	public function hasPermissionsDefinition() :Bool
	{
		return _definition != null && _definition.inputs[METAPAGE_KEY_DEFINITION] != null;
	}

	public function getDefinitionUrl() :String
	{
		var url = new URL(_url);
		url.pathname = url.pathname + (url.pathname.endsWith('/') ? 'metaframe.json' : '/metaframe.json');
		return url.href;
	}

	public function getDefinition() :Promise<MetaframeDefinition>
	{
		if (_definition != null) {
			return Promise.resolve(_definition);
		}
		var url = this.getDefinitionUrl();

		return Browser.window.fetch(url)
			.then(function(response) {
				return response.json();
			})
			.then(function(metaframeDef) {
				_definition = metaframeDef;
				return metaframeDef;
			});
	}

	public function setInput(name :MetaframePipeId, inputBlob :Dynamic)
	{
		assert(name != null);
		var inputs :MetaframeInputMap = {};
		inputs.set(name, inputBlob);
		setInputs(inputs);
	}

	/**
	 * Sends the updated inputs to the iframe
	 */
	var _cachedEventInputsUpdate = {iframeId:null,inputs:null};
	public function setInputs(maybeNewInputs :MetaframeInputMap) :IFrameRpcClient
	{
		// log({m:'IFrameRpcClient', inputs:maybeNewInputs});
		if (!this.inputs.merge(maybeNewInputs)) {
			return this;
		}
		if (!_loaded) {
			_sendInputsAfterRegistration = true;
		}
		// Only send the new inputs to the actual metaframe iframe
		// if it's not registered, don't worry, inputs are merged,
		// and when the metaframe is registered, current inputs will
		// be sent
		if (this.iframe.parentNode != null && _loaded) {
			sendInputs(maybeNewInputs);
		// } else {
		// 	log('Not setting input bc _loaded=$_loaded');
		}

		// Notify
		this.emit(MetapageEvents.Inputs, this.inputs);
		if (_metapage.isListeners(MetapageEvents.Inputs)) {
			var inputUpdate :MetapageInstanceInputs = {};
			inputUpdate[id] = maybeNewInputs;
			_metapage.emit(MetapageEvents.Inputs, inputUpdate);
		}
		//TODO is this really used anymore?
		_cachedEventInputsUpdate.iframeId = id;
		_cachedEventInputsUpdate.inputs = this.inputs;
		_metapage.emit(JsonRpcMethodsFromParent.InputsUpdate, _cachedEventInputsUpdate);

		return this;
	}

	public function setOutput(pipeId :MetaframePipeId, updateBlob :Dynamic)
	{
		assert(pipeId != null);
		var outputs :MetaframeInputMap = {};
		outputs.set(pipeId, updateBlob);
		setOutputs(outputs);
	}

	var _cachedEventOutputsUpdate = {iframeId:null,inputs:null};
	public function setOutputs(maybeNewOutputs :MetaframeInputMap)
	{
		if (!this.outputs.merge(maybeNewOutputs)) {
			return;
		}
		this.emit(MetapageEvents.Outputs, maybeNewOutputs);

		for (outputPipeId in maybeNewOutputs.keys()) {
			log('output [${outputPipeId}]');
		}
		if (_metapage.isListeners(MetapageEvents.Outputs)) {
			var outputsUpdate :MetapageInstanceInputs = {};
			outputsUpdate[this.id] = this.outputs;
			_metapage.emit(MetapageEvents.Outputs, outputsUpdate);
		}
	}

	public function onInputs(f :MetaframeInputMap->Void) :Void->Void
	{
		return this.on(MetapageEvents.Inputs, f);
	}

	public function onInput(pipeName :MetaframePipeId, f :Dynamic->Void) :Void->Void
	{
		var fWrap = function(inputs :MetaframeInputMap) {
			if (inputs.exists(pipeName)) {
				f(inputs[pipeName]);
			}
		}
		return this.on(MetapageEvents.Inputs, fWrap);
	}

	public function onOutputs(f :MetaframeInputMap->Void) :Void->Void
	{
		return this.on(MetapageEvents.Outputs, f);
	}

	public function onOutput(pipeName :MetaframePipeId, f :Dynamic->Void) :Void->Void
	{
		var fWrap = function(outputs :MetaframeInputMap) {
			if (outputs.exists(pipeName)) {
				f(outputs[pipeName]);
			}
		}
		return this.on(MetapageEvents.Outputs, fWrap);
	}

	override public function dispose()
	{
		super.dispose();
		while(_disposables != null && _disposables.length > 0) {
			_disposables.pop()();
		}
		_rpcListeners = null;
		this.inputs = null;
		this.outputs = null;
		_ready = null;
		if (this.iframe != null && this.iframe.parentNode != null) {
			this.iframe.parentNode.removeChild(this.iframe);
		}
		this.iframe = null;
		_bufferMessages = null;
		if (_bufferTimeout != null) {
			Browser.window.clearInterval(_bufferTimeout);
			_bufferTimeout = null;
		}
		_metapage = null;
	}

	/**
	 * Request that the parent metapage tell us what our id is
	 */
	public function register()
	{
		if (_loaded) {
			return;
		}
		
		var response :SetupIframeServerResponseData = {
			iframeId: id,
			parentId: _parentId,
			plugin  : _plugin,
			state   : {inputs:this.inputs},
			version : Metapage.version,
		};
		sendRpcInternal(JsonRpcMethodsFromParent.SetupIframeServerResponse, response);
	}

	public function registered(version :MetaLibsVersion)
	{
		if (_loaded) {
			return;
		}
		this.version = version;
		// Only very old versions don't send their version info
		// Obsoleted?
		if (this.version == null) {
			this.version = MetaLibsVersion.V0_1_0;
		}
		_loaded = true;
		while(_onLoaded != null && _onLoaded.length > 0) {
			_onLoaded.pop()();
		}
		// You still need to set the inputs even though they
		// may have been set initially, because the inputs may
		// have been been updated before the metaframe internal
		// returned its server ack.
		if (_sendInputsAfterRegistration) {
			sendInputs(this.inputs);
		}
		// log('registered version=${this.version}');
	}

	function sendInputs(inputs :MetaframeInputMap)
	{
		sendRpc(JsonRpcMethodsFromParent.InputsUpdate, {inputs :inputs, parentId: _parentId});
	}

	public function sendRpc(method :String, params :Dynamic)
	{
		if (this.iframe.parentNode != null && _loaded) {
			sendRpcInternal(method, params);
		} else {
			_metapage.error('sending rpc later');
			_onLoaded.push(function() {
				sendRpcInternal(method, params);
			});
		}
	}

	public function log(o :Dynamic, ?pos:haxe.PosInfos)
	{
		if (!_debug) {
			return;
		}
		logInternal(o, pos);
	}

	function logInternal(o :Dynamic, ?pos:haxe.PosInfos)
	{
		var s :String = switch(js.Syntax.typeof(o)) {
			case "string": cast o;
			case "number": o + "";
			default: Json.stringify(o);
		}
		MetapageTools.log('Metapage[$_parentId] Metaframe[$id] $s', _color, _consoleBackgroundColor);
	}

	function sendRpcInternal(method :String, params :Dynamic)
	{
		//TODO: typedef this
		var messageJson :MinimumClientMessage = {
			iframeId: id,
			jsonrpc : '2.0',
			method  : method,
			params  : params,
			parentId: _parentId,
		};
		if (this.iframe != null) {
			sendOrBufferPostMessage(messageJson);
		} else {
			_metapage.error('Cannot send to child iframe messageJson=${Json.stringify(messageJson).substr(0, 200)}');
		}
	}

	var _bufferMessages :Array<Dynamic>;
	var _bufferTimeout :Int;
	function sendOrBufferPostMessage(message :Dynamic)
	{
		if (this.iframe.contentWindow != null) {
			this.iframe.contentWindow.postMessage(message, _url);
		} else {
			if (_bufferMessages == null) {
				_bufferMessages = [message];
				_bufferTimeout = Browser.window.setInterval(function() {
					if (this.iframe.contentWindow != null) {
						for (m in _bufferMessages) {
							this.iframe.contentWindow.postMessage(m, _url);
						}
						Browser.window.clearInterval(_bufferTimeout);
						_bufferTimeout = null;
						_bufferMessages = null;
					}
				}, 0);
			} else {
				_bufferMessages.push(message);
			}
		}
	}
}
