package js.metapage.client;

@:enum abstract MetapageEvents<T:haxe.Constraints.Function>(Dynamic) to Dynamic {
  // Don't modify the underlying inputs object
  var Inputs : MetapageEvents<MetapageInstanceInputs->Void> = "inputs";
  // Don't modify the underlying inputs object
  var Outputs : MetapageEvents<MetapageInstanceInputs->Void> = "outputs";
}
@:expose("Metapage")
@:keep
class Metapage extends EventEmitter
{
	inline public static var version :MetaframeDefinitionVersion = MetaframeDefinitionVersion.V0_2;
	public static var INPUTS = MetapageEvents.Inputs;
	public static var OUTPUTS = MetapageEvents.Outputs;
	static var minimatch :String->String->Bool = js.Lib.require('minimatch');

	public static function from(metaPageDef :Dynamic, ?inputs :Dynamic)
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
		return switch(getMatchingVersion(metaPageDef.version)) {
			case V0_0_1: return fromDefinitionV0_0_1(metaPageDef);
			case V0_1_0: return fromDefinitionV0_1_0(metaPageDef, inputs);
			case V0_2:   return fromDefinitionV0_2(metaPageDef, inputs);
			default: throw 'Unknown metapage version: ${metaPageDef.version}';
		}
	}

	public static function getLibraryVersionMatching(version :String) :MetaframeDefinitionVersion
	{
		return MetapageTools.getMatchingVersion(version);
	}

	// Current input values
	var _inputsState :MetapageInstanceInputs = {};
	var _iframes :JSMap<MetaframeId, IFrameRpcClient> = {};
	var _id :MetapageId;
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

	public function onInputs(f :Dynamic) :Void->Void
	{
		return this.on(MetapageEvents.Inputs, f);
	}

	public function onOutputs(f :Dynamic) :Void->Void
	{
		return this.on(MetapageEvents.Outputs, f);
	}

	public function addPipe(target :MetaframeId, input :PipeInput)
	{
		// Do all the cache checking
		if (!_inputMap.exists(target)) {
			_inputMap.set(target, []);
		}
		_inputMap.get(target).push(input);
	}

	public function removeAll() :Void
	{
		for(id in _iframes.keys()) {
			_iframes.get(id).dispose();
		}
		_iframes = {};
		_cachedInputLookupMap = {};
		_inputMap = {};
	}

	public function metaframes() :JSMap<MetaframeId, IFrameRpcClient>
	{
		var all :JSMap<MetaframeId, IFrameRpcClient> = {};
		for (key in _iframes.keys()) {
			all.set(key, _iframes.get(key));
		}
		return all;
	}

	public function metaframeIds() :Array<MetaframeId>
	{
		var all :Array<MetaframeId> = [];
		for (key in _iframes.keys()) {
			all.push(key);
		}
		return all;
	}

	public function iframes() :JSMap<MetaframeId, IFrameElement>
	{
		var all :JSMap<MetaframeId, IFrameElement> = {};
		for (key in _iframes.keys()) {
			all.set(key, _iframes.get(key).iframe);
		}
		return all;
	}

	public function get(id :MetaframeId) :IFrameRpcClient
	{
		return _iframes.get(id);
	}

	public function addMetaframe(url :String, ?iframeId :MetaframeId = null) :IFrameRpcClient
	{
		if (iframeId != null && _iframes.exists(iframeId)) {
			throw 'Existing metaframe for id=${iframeId}';
		}
		iframeId = iframeId != null ? iframeId : MetapageTools.generateMetaframeId();
		var iframeClient = new IFrameRpcClient(url, iframeId, _id, _consoleBackgroundColor, debug);
		iframeClient._metapage = this;
		_iframes.set(iframeId, iframeClient);
		return iframeClient;
	}

	/**
	 * Sets inputs
	 * @param iframeId Can be an object of metaframes 
	 * @param inputPipeId 
	 * @param value 
	 */
	public function setInput(iframeId :Dynamic, ?inputPipeId :Dynamic, ?value :Dynamic)
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
				var iframeClient = _iframes.get(metaframeId);
				if (iframeClient != null) {
					iframeClient.setInputs(metaframeInputs);
				} else {
					error('No iframe id=$metaframeId');
				}
			}
		} else if (js.Syntax.typeof(iframeId) == 'string') {
			var iframeClient = _iframes.get(iframeId);
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

		setInputCache(iframeId, inputPipeId, value);
	}

	public function setInputs(iframeId :Dynamic, ?inputPipeId :Dynamic, ?value :Dynamic) {
		setInputs(iframeId, inputPipeId, value);
	}

	override public function dispose()
	{
		super.dispose();
		Browser.window.removeEventListener('message', onMessage);
		for (iframeId in _iframes.keys()) {
			_iframes.get(iframeId).dispose();
		}
		_iframes = null;
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

	inline public function error(err :Dynamic, ?pos :haxe.PosInfos)
	{
		logInternal(err, "f00", _consoleBackgroundColor, pos);
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
				//TODO: check origin+source
				var iframeId :MetaframeId = message.iframeId;
				if (!(message.parentId == _id && _iframes.exists(iframeId))) {
					error('message.parentId=${message.parentId} _id=${_id} message.iframeId=${iframeId} _iframes.exists(message.iframeId)=${_iframes.exists(iframeId)} message=${Json.stringify(message).substr(0, 200)}');
				}
				return message.parentId == _id && _iframes.exists(iframeId);
		}
	}

	// Set the global inputs cache
	inline function setInputCache(metaframeId :Dynamic, ?inputPipeId :Dynamic, ?value :Dynamic)
	{
		if (js.Syntax.typeof(metaframeId) == 'object') {
			if (inputPipeId != null || value != null) {
				throw 'bad arguments';
			}
			var inputs :Dynamic = metaframeId;
			for (id in Reflect.fields(inputs)) {
				// Ensure
				var metaframeId :MetaframeId = cast id;
				_inputsState[metaframeId] = _inputsState[metaframeId] != null ? _inputsState[metaframeId] : cast {};
				var metaframeInputs = Reflect.field(inputs, metaframeId);
				if (js.Syntax.typeof(metaframeInputs) != 'object') {
					throw 'bad arguments, see API docs';
				}
				for (inputPipeId in Reflect.fields(metaframeInputs)) {
					var metaframePipdId :MetaframePipeId = cast inputPipeId;
					_inputsState[metaframeId][metaframePipdId] = Reflect.field(metaframeInputs, inputPipeId);
				}
			}
		} else if (js.Syntax.typeof(metaframeId) == 'string') {
			_inputsState[metaframeId] = _inputsState[metaframeId] != null ? _inputsState[metaframeId] : {};
			if (js.Syntax.typeof(inputPipeId) == 'string') {
				_inputsState[metaframeId][inputPipeId] = value;
			} else if (js.Syntax.typeof(inputPipeId) == 'object') {
				for (inputPipeId in Reflect.fields(inputPipeId)) {
					_inputsState[metaframeId][inputPipeId] = Reflect.field(inputPipeId, inputPipeId);
				}
			} else {
				throw 'bad arguments';
			}
		} else {
			throw 'bad arguments';
		}
	}

	function onMessage(e :Event)
	{
		if (untyped __js__('typeof e.data === "object"')) {
			var jsonrpc :MinimumClientMessage = untyped e.data;
			if (!isValidJsonRpcMessage(jsonrpc)) {
				log('invalid message ${Json.stringify(jsonrpc).substr(0, 200)}');
				return;
			}
			var origin :String = untyped e.origin;
			var source :IFrameElement = untyped e.source;
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
				 * The response is idempotent.
				 */
				case SetupIframeClientRequest:
					for (iframeId in _iframes.keys()) {
						var iframeClient = _iframes.get(iframeId);
						iframeClient.register();
					}

				/* A client iframe responded */
				case SetupIframeServerResponseAck:
					/* Send all inputs when a client has registered.*/
					var params :SetupIframeClientAckData = jsonrpc.params;
					var iframe = _iframes.get(jsonrpc.iframeId);
					iframe.registered(params.version);

				case OutputsUpdate:
					var iframeId :MetaframeId = jsonrpc.iframeId;
					var outputs :MetaframeInputMap = jsonrpc.params;
					// var star = new MetaframePipeId('*');
					var iframe = _iframes.get(iframeId);
					if (iframe != null) {
						iframe.setOutputs(outputs);
						// cached lookup of where those outputs are going
						for (outputKey in outputs.keys()) {
							var targets = getInputsFromOutput(iframeId, outputKey);
							if (targets.length > 0) {
								for (outputSet in targets) {
									var inputBlob :MetaframeInputMap = {};
									inputBlob.set(outputSet.pipe, outputs.get(outputKey));
									_iframes.get(outputSet.metaframe).setInputs(inputBlob);
									// Set the global inputs cache
									// Currently on for setting metaframe inputs that haven't loaded yet
									setInputCache(outputSet.metaframe, outputSet.pipe, outputs.get(outputKey));
								}
							}
						}
					} else {
						error('missing iframe=$iframeId');
					}

				case InputsUpdate:
					//This is triggered by the metaframe itself, meaning the metaframe
					//decided to save this state info.
					var metaframeId :MetaframeId = jsonrpc.iframeId;
					var inputs :MetaframeInputMap = jsonrpc.params;
					switch(_iframes.get(metaframeId).version) {
						// These old versions create a circular loop of inputs updating
						// if you just set the inputs here. Those internal metaframes
						// already have notified their own listeners, so just emit
						// events but do not process the inputs further
						case V0_0_1,V0_1_0:
							_iframes.get(metaframeId).emit(MetapageEvents.Inputs, inputs);
							if (this.isListeners(MetapageEvents.Inputs)) {
								var metaframeInputs :MetapageInstanceInputs = {};
								metaframeInputs[metaframeId] = inputs;
								this.emit(MetapageEvents.Inputs, metaframeInputs);
							}
						case V0_2:
							// New versions can safely set their inputs here, their
							// own internal listeners have not yet been notified.
							_iframes.get(metaframeId).setInputs(inputs);
					}
					
					// Set the global inputs cache
					// Currently on for setting metaframe inputs that haven't loaded yet
					setInputCache(metaframeId, inputs);
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

	static function fromDefinitionV0_0_1(metaPageDef :js.metapage.v0_0_1.MetapageDefinition)
	{
		var metapage = new Metapage(cast metaPageDef.options);
		if (metaPageDef.iframes != null) {
			for (iframeId in metaPageDef.iframes.keys()) {
				var iframeDef = metaPageDef.iframes.get(iframeId);
				metapage.addMetaframe(iframeDef.url, iframeId);
			}
		}
		if (metaPageDef.pipes != null) {
			for (pipeDef in metaPageDef.pipes) {
				var pipeDefNext :js.metapage.v0_2.PipeInput = {
					metaframe: pipeDef.target.id,
					source: pipeDef.target.name,
					target: pipeDef.target.name,
				}
				metapage.addPipe(pipeDef.target.id, pipeDefNext);
			}
		}
		return metapage;
	}

	static function fromDefinitionV0_1_0(metaPageDef :js.metapage.v0_1_0.MetapageDefinition, ?initialState :MetapageInstanceInputs)
	{
		var metapage = new Metapage(metaPageDef.options);
		if (initialState == null) {
			initialState = {};
		}
		if (metaPageDef.iframes != null) {
			for (iframeId in metaPageDef.iframes.keys()) {
				var iframeDef = metaPageDef.iframes.get(iframeId);
				var iframe = metapage.addMetaframe(iframeDef.url, iframeId);
				if (iframeDef.inputs != null) {
					for (input in iframeDef.inputs) {
						metapage.addPipe(iframeId, input);
					}
				}
			}
		}
		return metapage;
	}

	static function fromDefinitionV0_2(metaPageDef :js.metapage.v0_2.MetapageDefinition, ?initialState :MetapageInstanceInputs)
	{
		var metapage = new Metapage(metaPageDef.options);
		if (initialState == null) {
			initialState = {};
		}
		if (metaPageDef.metaframes != null) {
			for (iframeId in metaPageDef.metaframes.keys()) {
				var iframeDef = metaPageDef.metaframes.get(iframeId);
				var iframe = metapage.addMetaframe(iframeDef.url, iframeId);
				if (iframeDef.inputs != null) {
					for (input in iframeDef.inputs) {
						metapage.addPipe(iframeId, input);
					}
				}
			}
		}
		return metapage;
	}
}

class IFrameRpcClient extends EventEmitter
{
	public var iframe (default, null):#if nodejs Dynamic #else IFrameElement #end;
	public var id (default, null):MetaframeId;
	public var version (default, null):MetaframeDefinitionVersion;
	var _color :String;
	var _consoleBackgroundColor :String;
	var _ready :Promise<Bool>;
	var _inputs :MetaframeInputMap = {};
	var _outputs :MetaframeInputMap = {};
	var _disposables :Array<Void->Void> = [];
	var _rpcListeners :Array<RequestDef->Void> = [];
	var _loaded :Bool = false;
	var _onLoaded : Array<Void->Void> = [];
	var _parentId :MetapageId;
	// Used for securing postMessage
	var _origin :String;
	var _debug :Bool;
	var _sendInputsAfterRegistration :Bool = false;
	public var _metapage :Metapage;

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
		_origin = url;

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
	public function setInputs(maybeNewInputs :MetaframeInputMap)
	{
		// log({m:'IFrameRpcClient', inputs:maybeNewInputs});
		if (!_inputs.merge(maybeNewInputs)) {
			return;
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
		this.emit(MetapageEvents.Inputs, _inputs);
		if (_metapage.isListeners(MetapageEvents.Inputs)) {
			var inputUpdate :MetapageInstanceInputs = {};
			inputUpdate[id] = maybeNewInputs;
			_metapage.emit(MetapageEvents.Inputs, inputUpdate);
		}
		//TODO is this really used anymore?
		_cachedEventInputsUpdate.iframeId = id;
		_cachedEventInputsUpdate.inputs = _inputs;
		_metapage.emit(JsonRpcMethodsFromParent.InputsUpdate, _cachedEventInputsUpdate);
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
		if (!_outputs.merge(maybeNewOutputs)) {
			return;
		}
		this.emit(MetapageEvents.Outputs, maybeNewOutputs);

		for (outputPipeId in maybeNewOutputs.keys()) {
			log('output [${outputPipeId}]');
		}
		if (_metapage.isListeners(MetapageEvents.Outputs)) {
			var outputsUpdate :MetapageInstanceInputs = {};
			outputsUpdate[this.id] = _outputs;
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
		_inputs = null;
		_outputs = null;
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
			state   : {inputs:_inputs},
			version : Metapage.version,
		};
		// log('register ${Json.stringify(response)}');
		sendRpcInternal(JsonRpcMethodsFromParent.SetupIframeServerResponse, response);
	}

	public function registered(version :MetaframeDefinitionVersion)
	{
		if (_loaded) {
			return;
		}
		this.version = version;
		// Only very old versions don't send their version info
		// Obsoleted?
		if (this.version == null) {
			this.version = MetaframeDefinitionVersion.V0_1_0;
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
			sendInputs(_inputs);
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
			method: method,
			params: params,
			jsonrpc: '2.0',
			parentId: _parentId,
			iframeId :id,
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
			this.iframe.contentWindow.postMessage(message, _origin);
		} else {
			if (_bufferMessages == null) {
				_bufferMessages = [message];
				_bufferTimeout = Browser.window.setInterval(function() {
					if (this.iframe.contentWindow != null) {
						for (m in _bufferMessages) {
							this.iframe.contentWindow.postMessage(m, _origin);
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
