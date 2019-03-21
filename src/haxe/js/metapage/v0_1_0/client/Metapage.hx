package js.metapage.v0_1_0.client;

@:enum abstract MetapageEvents<T:haxe.Constraints.Function>(Dynamic) to Dynamic {
  // This object is react-friendly (value equality failure equals state change)
  var Inputs : MetapageEvents<MetapageInstanceInputs->Void> = "inputs";
  var InputsDelete : MetapageEvents<MetapageInstanceInputsDeleted->Void> = "inputsDelete";
  // This object is react-friendly (value equality failure equals state change)
  var Outputs : MetapageEvents<MetapageInstanceInputs->Void> = "outputs";
}
@:expose("Metapage")
@:keep
class Metapage extends EventEmitter
{
	/**
	 * Entrypoint for this script. It looks for a metapage.json file
	 * in the same parent path. If it doesn't find one, it searches down
	 * to the root domain. If none are found execution halts for good.
	 * 
	 */
	public static function main()
	{
		var f :String->Promise<MetapageDefinition>;
		// path will always end with a /
		f = function(path :String) :Promise<MetapageDefinition> {
			if (path == null || path.length == 0) {
				//Exit condition
				return Promise.resolve(null);
			}
			return new Promise(function(resolve, reject) {
				var metapagePath = path + 'metapage.json';
				var _fetch :String->Dynamic->Promise<Dynamic> = untyped __js__('fetch');
				_fetch(metapagePath, {})
					.then(function(res) {
						var r :{json:Void->Promise<MetapageDefinition>} = res;
						return res.json();	
					})
					.then(function(metapageDef) {
						resolve(metapageDef);
					})
					.catchError(function(err) {
						if (path == '/') {
							resolve(null);
						} else {
							// Nothing found. Now chop the path down and keep going recursive
							path = path.substr(0, path.length - 1);
							var paths = path.split('/');
							paths.pop();
							path = paths.join('/');
							f(path)
								.then(function(metapageDef2) {
									resolve(metapageDef2);
								});
						}
					});
			});
		};
		// Make sure the search path starts with a '/' so that
		// we can search simply down the path structure.
		var pathname = Browser.window.location.pathname;
		f(pathname.endsWith('/') ? pathname : pathname + '/')
			.then(function(metaPageDef) {
				if (metaPageDef == null) {
					js.Browser.console.log('No metapage.json found in this domain. Metapage exiting.');
				}
			});
	}

	public static function fromDefinition(metaPageDef :Dynamic, ?inputs :Dynamic)
	{
		if (metaPageDef == null) {
			throw 'Missing Metapage definition';
		}
		var version :MetaframeDefinitionVersion = metaPageDef.version;
		return switch(version) {
			case V0_0_1: return fromDefinitionV0_0_1(metaPageDef);
			case V0_1_0: return fromDefinitionV0_1_0(metaPageDef, inputs);
			default: throw 'Unknown metapage version: ${version}';
		}
	}

	static function fromDefinitionV0_0_1(metaPageDef :js.metapage.v0_0_1.MetapageDefinition)
	{
		var metapage = new Metapage(cast metaPageDef.options);
		if (metaPageDef.iframes != null) {
			for (iframeId in metaPageDef.iframes.keys()) {
				var iframeDef = metaPageDef.iframes.get(iframeId);
				metapage.createIFrame(iframeDef.url, iframeId);
			}
		}
		if (metaPageDef.pipes != null) {
			for (pipeDef in metaPageDef.pipes) {
				var pipeDefNext :js.metapage.v0_1_0.PipeInput = {
					metaframe: pipeDef.target.id,
					source: pipeDef.target.name,
					target: pipeDef.target.name,
				}
				metapage.addPipe(pipeDef.target.id, pipeDefNext);
			}
		}
		return metapage;
	}

	static function fromDefinitionV0_1_0(metaPageDef :MetapageDefinition, ?initialState :MetapageInstanceInputs)
	{
		var metapage = new Metapage(metaPageDef.options);
		if (initialState == null) {
			initialState = {};
		}
		if (metaPageDef.iframes != null) {
			for (iframeId in metaPageDef.iframes.keys()) {
				var iframeDef = metaPageDef.iframes.get(iframeId);
				var iframe = metapage.createIFrame(iframeDef.url, iframeId);
				//Add the default input state from the metaframe def.
				//If there's an existing state from the passed in inputs we'll use
				//that and ignore the metaframe default
				// var initialInputs = initialState == null || initialState[iframeId] == null ? {} : initialState[iframeId];
				// if (iframeDef.metaframe != null && iframeDef.metaframe.inputs != null) {
				// 	for (inPipeName in iframeDef.metaframe.inputs.keys()) {
				// 		var inPipe = iframeDef.metaframe.inputs.get(inPipeName);
				// 		if (inPipe.value != null && !initialInputs.exists(inPipeName)) {
				// 			initialInputs = initialInputs == null ? {} : initialInputs;
				// 			initialInputs[inPipe.name] = inPipe;
				// 		}
				// 	}
				// }
				// iframe.setInitialState(initialInputs);
				if (iframeDef.inputs != null) {
					for (input in iframeDef.inputs) {
						metapage.addPipe(iframeId, input);
					}
				}
			}
		}
		return metapage;
	}

	/* [from][pipeId]=>Array<PipeInput> */
	// var _outputPipeMap :JSMap<MetaframeId, JSMap<MetaframePipeId, Array<PipeInput>>> = {};
	//React-friendly: value equality check failure means the value is updated
	//The 'version' field of the leaves can also be used, but that is less efficient
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

	public function addPipe(target :MetaframeId, input :PipeInput)
	{
		// Do all the cache checking
		if (!_inputMap.exists(target)) {
			_inputMap.set(target, []);
		}
		_inputMap.get(target).push(input);
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
	static var minimatch :String->String->Bool = js.Lib.require('minimatch');
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

	public function applyUpdates(updates :MetapageInstanceInputs)
	{
		//Go through and update the input DataBlobs.
		//Only update if the DataBlob.version is newer
		//If updated, copy the parent value, to trigger
		//downstream updates (they use equality for parent
		//values above the DataBlobs).
		var updated = false;
		for (metaframeId in updates.keys()) {

			//If there is no key, just update (set) en masse
			if (!_inputsState.exists(metaframeId)) {
				_inputsState.set(metaframeId, updates.get(metaframeId));
				updated = true;
			} else {
				var metaframeInputs = _inputsState.get(metaframeId);
				var incomingMetaframeInputs = updates.get(metaframeId);
				for (pipeId in incomingMetaframeInputs.keys()) {
					if (!metaframeInputs.exists(pipeId) || incomingMetaframeInputs.get(pipeId).v > metaframeInputs.get(pipeId).v) {
						//We're about to update a blob, so we need to ensure that
						//the parent object is also updated so that equality checks fail
						if (_inputsState.get(metaframeId) == metaframeInputs) {
							metaframeInputs = Reflect.copy(metaframeInputs);
						}
						metaframeInputs.set(pipeId, incomingMetaframeInputs.get(pipeId));
						updated = true;
					}
				}
				_inputsState.set(metaframeId, metaframeInputs);
			}
		}
		if (updated) {
			_inputsState = Reflect.copy(_inputsState);
			//Now, just set all the metaframes updates en masse
			//The metaframes have their own internal cache, and version checks
			//so for values that haven't actually changed, they are skipped
			//at the highest level efficiently (equality checks).
			//This kind of updates with nested data is a bit more work initially
			//but I think it pays off with simplicity and efficiency in the
			//actual updates.
			for (metaframeId in _inputsState.keys()) {
				if (_iframes.exists(metaframeId)) {
					_iframes.get(metaframeId).setInputs(_inputsState.get(metaframeId));
				}
			}
		}
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

	public function get_iframes() :JSMap<MetaframeId, IFrameElement>
	{
		var all :JSMap<MetaframeId, IFrameElement> = {};
		for (key in _iframes.keys()) {
			all.set(key, _iframes.get(key).iframe);
		}
		return all;
	}

	public function getIframe(id :MetaframeId) :IFrameElement
	{
		return _iframes.get(id) != null ? _iframes.get(id).iframe : null;
	}

	public function getMetaframe(id :MetaframeId) :IFrameRpcClient
	{
		return _iframes.get(id);
	}

	public function createIFrame(url :String, ?iframeId :MetaframeId = null) :IFrameRpcClient
	{
		iframeId = iframeId != null ? iframeId : MetapageTools.generateMetaframeId();
		var iframeClient = new IFrameRpcClient(url, iframeId, _id, _consoleBackgroundColor, debug);
		iframeClient._metapage = this;
		_iframes.set(iframeId, iframeClient);
		return iframeClient;
	}

	public function setInput(iframeId :MetaframeId, inputPipeId :MetaframePipeId, value :Dynamic)
	{
		var iframeClient = _iframes.get(iframeId);
		if (iframeClient != null) {
			iframeClient.setInput(inputPipeId, value);
		} else {
			error('No iframe id=$iframeId');
		}
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
					log('SetupIframeClientRequest from unknown, registered all metaframes');
					for (iframeId in _iframes.keys()) {
						var iframeClient = _iframes.get(iframeId);
						iframeClient.register();
					}

				/* A client iframe responded */
				case SetupIframeServerResponseAck:
					log('SetupIframeServerResponseAck iframeId=${jsonrpc.iframeId} jsonrpc.params=${Json.stringify(jsonrpc.params, null, "  ")}');
					/* Send all inputs when a client has registered.*/
					var params :MinimumClientMessage = jsonrpc.params;
					var iframe = _iframes.get(jsonrpc.iframeId);
					iframe.registered();

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
								}
							}
						}
					} else {
						error('missing iframe=$iframeId');
					}

				case InputsUpdate:
					//This is triggered by the metaframe itself, meaning the metaframe
					//decided to save this state info.
					var iframeId :MetaframeId = jsonrpc.iframeId;
					var inputs :MetaframeInputMap = jsonrpc.params;
					var e :MetapageInstanceInputs = {};
					e.set(iframeId, inputs);
					emit(MetapageEvents.Inputs, e);
				case Dimensions:
					log('${jsonrpc.iframeId} Dimensions ${Json.stringify(jsonrpc.params).substr(0, 200)}');
					// var dimensions :{height:Float,width:Float} = jsonrpc.params;
					// debug('${jsonrpc.iframeId} Dimensions ${dimensions}');
					// var iframe = _iframes.get(jsonrpc.iframeId);
					// if (iframe != null) {
					// 	if (dimensions.height != null) {
					// 		iframe.iframe.height = '${dimensions.height}px';
					// 	}
					// 	if (dimensions.width != null) {
					// 		iframe.iframe.width = '${dimensions.width}px';
					// 	}
					// }
			}

			emit(OtherEvents.Message, jsonrpc);
		}
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
	
	function logInternal(o :Dynamic, ?color :String, ?backgroundColor :String, ?pos:haxe.PosInfos)
	{
		backgroundColor = backgroundColor != null ? backgroundColor : _consoleBackgroundColor;
		var s :String = switch(untyped __typeof__(o)) {
			case "string": cast o;
			case "number": o + "";
			default: Json.stringify(o);
		}
		s = _id != null ? 'Metapage[$_id] $s' : s;
		MetapageTools.log(s, color, backgroundColor, pos);
	}	
}

class IFrameRpcClient
{
	public var iframe (default, null):#if nodejs Dynamic #else IFrameElement #end;
	public var id (default, null):MetaframeId;
	var _color :String;
	var _consoleBackgroundColor :String;
	var _ready :Promise<Bool>;
	var _inputs :MetaframeInputMap = {};
	var _outputs :MetaframeInputMap = {};
	var _disposables :Array<Void->Void> = [];
	var _rpcListeners :Array<RequestDef->Void> = [];
	var _loaded :Bool = false;
	var _onLoaded : Array<Void->Void> = [];
	var _onOutput : Array<String->PipeUpdateBlob->Void> = [];
	var _parentId :MetapageId;
	// Used for securing postMessage
	var _origin :String;
	var _debug :Bool;
	var _sendInputsAfterRegistration :Bool = false;
	public var _metapage :Metapage;

	public function new(url :String, iframeId :MetaframeId, parentId :MetapageId, consoleBackgroundColor :String, ?debug :Bool = false)
	{
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

	//This doesn't send anything, since the initial state
	//is send in the init message
	public function setInitialState(inputs :MetaframeInputMap)
	{
		_inputs = inputs;
	}

	public function sendAllInputs()
	{
		sendInputs(_inputs);
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
		log({m:'IFrameRpcClient', inputs:maybeNewInputs});
		if (!_inputs.merge(maybeNewInputs)) {
			return;
		}
		if (!_loaded) {
			_sendInputsAfterRegistration = true;
		}
		// Only send the new inputs to the actual metaframe iframe
		if (this.iframe.parentNode != null && _loaded) {
			sendInputs(maybeNewInputs);
		} else {
			log('Not setting input bc _loaded=$_loaded');
		}
		// Send all of the inputs. Consumers can use nested equality
		// to know what has actually been updated.
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
		_metapage.emit(JsonRpcMethodsFromChild.OutputsUpdate, _outputs);
	}

	public function onOutput(cb :String->Dynamic->Void) :Void->Void
	{
		var index = _onOutput.length;
		_onOutput[index] = cb;

		return function() {
			_onOutput[index] = null;
		}
	}

	public function dispose()
	{
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
	 * 
	 * Request that the parent metapage tell us what our
	 * id is
	 */
	public function register()
	{
		if (_loaded) {
			return;
		}
		var response :SetupIframeServerResponseData = {
			state: {inputs:_inputs},
			iframeId: id,
			parentId: _parentId,
		};
		sendRpcInternal(JsonRpcMethodsFromParent.SetupIframeServerResponse, response);
	}

	public function registered()
	{
		if (_loaded) {
			return;
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
		log('registered');
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
		var s :String = switch(untyped __typeof__(o)) {
			case "string": cast o;
			case "number": o + "";
			default: Json.stringify(o);
		}
		MetapageTools.log('Metapage[$_parentId] Metaframe[$id] $s', _color, _consoleBackgroundColor, pos);
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
