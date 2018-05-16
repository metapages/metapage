package js.metapage.v1.client;

@:enum abstract MetapageEvents<T:haxe.Constraints.Function>(Dynamic) to Dynamic {
  // This object is react-friendly (value equality failure equals state change)
  var Inputs : MetapageEvents<MetapageInstanceInputs->Void> = "inputs";
  // This object is react-friendly (value equality failure equals state change)
  var Outputs : MetapageEvents<MetapageInstanceInputs->Void> = "outputs";
}

@:expose("Metapage")
@:keep
class Metapage extends EventEmitter
{
	public static function fromDefinition(metaPageDef :MetapageDefinition, ?inputs :MetapageInstanceInputs)
	{
		var metapage = new Metapage(metaPageDef.options);
		if (inputs ==  null) {
			inputs = {};
		}
		if (metaPageDef.iframes != null) {
			for (iframeId in metaPageDef.iframes.keys()) {
				var iframeDef = metaPageDef.iframes.get(iframeId);
				var iframe = metapage.createIFrame(iframeDef.url, iframeId);
				//Add the default input state from the metaframe def.
				//If there's an existing state from the passed in inputs we'll use
				//that and ignore the metaframe default
				var initialInputs = inputs == null || inputs[iframeId] == null ? {} : inputs[iframeId];
				if (iframeDef.metaframe != null && iframeDef.metaframe.inputs != null) {
					for (inPipe in iframeDef.metaframe.inputs) {
						if (initialInputs == null || !initialInputs.exists(inPipe.name)) {
							initialInputs = initialInputs == null ? {} : initialInputs;
							initialInputs[inPipe.name] = inPipe;
						}
						// if (!initialInputs.exists(inPipe.name)) {
						// 	initialInputs[inPipe.name] = inPipe;
						// }
						// iframe.setInput(inPipe.name, inPipe);
					}
				}
				iframe.setInitialState(initialInputs);
			}
		}
		if (metaPageDef.pipes != null) {
			for (pipeDef in metaPageDef.pipes) {
				metapage.pipe(pipeDef);
			}
		}
		metapage.applyUpdates(inputs);
		return metapage;
	}

	/* [from][pipeId]=>Array<PipeInput>*/
	var _outputPipeMap :JSMap<MetaframeId, JSMap<MetaframePipeId, Array<PipeInput>>> = {};
	//React-friendly: value equality check failure means the value is updated
	//The 'version' field of the leaves can also be used, but that is less efficient
	var _inputsState :MetapageInstanceInputs = {};
	var _iframes :JSMap<MetaframeId, IFrameRpcClient> = {};
	var _id :MetapageId;
	public var _debug :Bool = false;
	var _consoleBackgroundColor :String;

	public static var CONSOLE_BACKGROUND_COLOR_DEFAULT = 'bcbcbc';

	public function new(?opts :MetapageOptions)
	{
		super();
		_id = opts != null && opts.id != null ? opts.id : MetapageTools.generateMetapageId();
		_debug = opts != null && opts.debug == true;
		_consoleBackgroundColor = (opts != null && opts.color != null ? opts.color : CONSOLE_BACKGROUND_COLOR_DEFAULT);
		Browser.window.addEventListener('message', onMessage);
		log('Initialized');
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
			// var inputs = [];
			// for (pipeId in updates.get(metaframeId).keys()) {
			// 	//Gotta add the pipe name, some unneeded duplication here.
			// 	var update :PipeUpdateBlob = cast Reflect.copy(updates.get(metaframeId).get(pipeId));
			// 	update.name = pipeId;
			// 	inputs.push(update);
			// }
		// }
	}

	public function removeAll() :Void
	{
		for(id in _iframes.keys()) {
			_iframes.get(id).dispose();
		}
		_outputPipeMap = {};
		_iframes = {};
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

	public function createIFrame(url :String, ?iframeId :MetaframeId = null) :IFrameRpcClient
	{
		iframeId = iframeId != null ? iframeId : MetapageTools.generateMetaframeId();
		var iframeClient = new IFrameRpcClient(url, iframeId, _id, _consoleBackgroundColor, _debug);
		iframeClient._metapage = this;
		_iframes.set(iframeId, iframeClient);
		return iframeClient;
	}

	public function pipe(pipe :Pipe)
	{
		if (!_outputPipeMap.exists(pipe.source.id)) {
			_outputPipeMap.set(pipe.source.id, {});
		}
		if (!_outputPipeMap.get(pipe.source.id).exists(pipe.source.name)) {
			_outputPipeMap.get(pipe.source.id).set(pipe.source.name, []);
		}
		_outputPipeMap.get(pipe.source.id).get(pipe.source.name).push(pipe.target);
	}

	public function setInput(iframeId :MetaframeId, inputPipeId :MetaframePipeId, value :DataBlob)
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
		_outputPipeMap = null;
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
		debug(Std.string(untyped e.data).substr(0, 200));
		if (untyped __js__('typeof e.data === "object"')) {
			var jsonrpc :MinimumClientMessage = untyped e.data;
			if (!isValidJsonRpcMessage(jsonrpc)) {
				error('invalid message ${Json.stringify(jsonrpc).substr(0, 200)}');
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
					var params :MinimumClientMessage = jsonrpc.params;
					var iframe = _iframes.get(jsonrpc.iframeId);
					iframe.registered();

				// case OutputUpdate:
				// 	var outputBlob :PipeOutputBlob = jsonrpc.params;
				// 	assert(outputBlob != null);
				// 	assert(outputBlob.name != null);
				// 	var dataBlob :DataBlob = {
				// 		value: outputBlob.value,
				// 		type: outputBlob.type == null ? js.Lib.undefined : outputBlob.type,
				// 		source: outputBlob.source,
				// 		encoding: outputBlob.encoding
				// 	};
				// 	var pipeId :MetaframePipeId = outputBlob.name;
				// 	// var pipeValue :Dynamic = outputBlob.value;
				// 	var iframeId :MetaframeId = jsonrpc.iframeId;
				// 	var iframe = _iframes.get(iframeId);
				// 	iframe.debug('OutputPipeUpdate source=$iframeId pipeId=${outputBlob.name} params=${Json.stringify(jsonrpc.params).substr(0,200)}');
				// 	if (iframe != null) {
				// 		iframe.setOutput(outputBlob);
				// 		//Set the downstream pipes
				// 		//Does this metaframe have outgoing pipes?
				// 		if (_outputPipeMap.exists(iframeId)) {
				// 			//Are any of the outgoing pipes this one?
				// 			if (_outputPipeMap.get(iframeId).exists(pipeId)) {
				// 				//Get the incoming pipes from downstream metaframes
				// 				var inputPipes = _outputPipeMap.get(iframeId).get(pipeId);
				// 				if (inputPipes != null) {
				// 					for (inputPipe in inputPipes) {
				// 						var inputIframe = _iframes.get(inputPipe.id);
				// 						if (inputIframe != null) {
				// 							iframe.debug('Sending from $iframeId.$pipeId to ${inputPipe.id}.${inputPipe.name}');
				// 							inputIframe.setInput(inputPipe.name, dataBlob);
				// 						}
				// 					}
				// 				}
				// 			} else {
				// 				error('OutputPipeUpdate _outputPipeMap.get($iframeId).get($pipeId) is null');
				// 			}
				// 		} else {
				// 			// error('OutputPipeUpdate !_outputPipeMap.exists($iframeId) keys=${_outputPipeMap.keys()}');
				// 		}
				// 	} else {
				// 		error('missing iframe=$iframeId');
				// 	}
				case OutputsUpdate:

					var iframeId :MetaframeId = jsonrpc.iframeId;
					var iframe = _iframes.get(iframeId);
					var outputs :MetaframeInputMap = jsonrpc.params;
					iframe.debug('OutputsUpdate source=$iframeId outputs=${Json.stringify(jsonrpc.params).substr(0,200)}');
					if (iframe != null) {
						iframe.setOutputs(outputs);
						//Does this iframe have output pipes?
						if (_outputPipeMap.exists(iframeId)) {
							var iframeToInputs :JSMap<MetaframeId, MetaframeInputMap> = null;// = {};
							for (pipeId in outputs.keys()) {
								var output = outputs[pipeId];
								//Does the output pipe go anywhere?
								//TODO: this is also where the glob pattern checks occur
								if (_outputPipeMap.get(iframeId).exists(pipeId)) {
									//Array of input pipes from the output pipe
									var inputPipesToOtherFrames = _outputPipeMap.get(iframeId).get(pipeId);
									if (inputPipesToOtherFrames != null) {
										for (inputPipe in inputPipesToOtherFrames) {
											var inputIframe = _iframes.get(inputPipe.id);
											if (inputIframe != null) {
												iframe.debug('Sending from $iframeId.${pipeId} to ${inputPipe.id}.${inputPipe.name}');
												iframeToInputs = iframeToInputs == null ? {} : iframeToInputs;
												if (!iframeToInputs.exists(inputPipe.id)) {
													iframeToInputs.set(inputPipe.id, {});
												}
												// var thisOutputBlob :PipeUpdateBlob = Reflect.copy(output);
												// thisOutputBlob.name = inputPipe.name;
												iframeToInputs.get(inputPipe.id).set(inputPipe.name, output);
												// inputIframe.setInput(inputPipe.name, outputValue);
											}
										}
									}
								} else {
									error('OutputsUpdate _outputPipeMap.get($iframeId).get(${pipeId}) is null');
								}
							}
							for (iframeId in iframeToInputs.keys()) {
								_iframes.get(iframeId).setInputs(iframeToInputs.get(iframeId));
							}
						}
					} else {
						error('missing iframe=$iframeId');
					}

				// case InputUpdate,InputsUpdate:
					//In the future, we might update the state of the system
					//to preserve metapage states.
					//Until then InputPipeUpdates (from iframes) are ignored
				case Dimensions:
					debug('${jsonrpc.iframeId} Dimensions ${Json.stringify(jsonrpc.params).substr(0, 200)}');
					var dimensions :{height:Float,width:Float} = jsonrpc.params;
					debug('${jsonrpc.iframeId} Dimensions ${dimensions}');
					var iframe = _iframes.get(jsonrpc.iframeId);
					if (iframe != null) {
						if (dimensions.height != null) {
							iframe.iframe.height = '${dimensions.height}px';
						}
						if (dimensions.width != null) {
							iframe.iframe.width = '${dimensions.width}px';
						}
					}
				// case AddRpcMethod,Message,RPC,SetParentId,SetupIframeServerResponse:
					//Client methods
			}

			emit(OtherEvents.Message, jsonrpc);
		}
	}

	public function debug(o :Dynamic, ?color :String, ?backgroundColor :String, ?pos:haxe.PosInfos)
	{
		if (!_debug) {
			return;
		}
		log(o, color, backgroundColor, pos);
	}
	public function log(o :Dynamic, ?color :String, ?backgroundColor :String, ?pos:haxe.PosInfos)
	{
		if (!_debug) {
			return;
		}
		backgroundColor = backgroundColor != null ? backgroundColor : _consoleBackgroundColor;
		var s :String = switch(untyped __typeof__(o)) {
			case "string": cast o;
			case "number": o + "";
			default: Json.stringify(o);
		}
		s = _id != null ? 'Metapage[$_id] $s' : s;
		MetapageTools.log(s, color, backgroundColor, pos);
	}

	inline public function error(err :Dynamic, ?pos :haxe.PosInfos)
	{
		log(err, "f00", _consoleBackgroundColor, pos);
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
	var _url :String;
	var _debug :Bool;
	public var _metapage :Metapage;

	public function new(url :String, iframeId :MetaframeId, parentId :MetapageId, consoleBackgroundColor :String, ?debug :Bool = false)
	{
		//Url sanitation
		if (!url.startsWith('http')) {
			while(url.startsWith('/')) {
				url = url.substr(1);
			}
			var location = js.Browser.location;
			url = location.protocol + '//' + location.hostname + (location.port != null && location.port != '' ? ':' + location.port: '') + '/' + url;
		}

		this.id = iframeId;
		this.iframe = Browser.document.createIFrameElement();
		// this.iframe.width = '100%';
		// this.iframe.height = '100%';
		this.iframe.scrolling = "no";
		this.iframe.src = url;
		this._debug = debug;
		_parentId = parentId;
		_color = MetapageTools.stringToRgb(this.id);
		_consoleBackgroundColor = consoleBackgroundColor;
	}

	public function setInitialState(inputs :MetaframeInputMap)
	{
		_inputs = inputs;
	}

	public function log(o :Dynamic, ?pos:haxe.PosInfos)
	{
		if (!_debug) {
			return;
		}
		trace(untyped __typeof__(o));
		var s :String = switch(untyped __typeof__(o)) {
			case "string": cast o;
			case "number": o + "";
			default: Json.stringify(o);
		}
		MetapageTools.log('Metapage[$_parentId] Metaframe[$id] $s', _color, _consoleBackgroundColor, pos);
	}

	public function debug(o :Dynamic, ?pos:haxe.PosInfos)
	{
		if (_metapage._debug) {
			log(o, pos);
		}
	}

	public function sendAllInputs()
	{
		sendInputs(_inputs);
	}

	public function setInput(name :MetaframePipeId, inputBlob :DataBlob)
	{
		assert(inputBlob != null);
		assert(name != null);
		if (_inputs.exists(name) && _inputs.get(name).equals(inputBlob)) {
			//Ignoring, same value
			return;
		}
		var inputs :MetaframeInputMap = {};
		inputs.set(name, inputBlob);
		setInputs(inputs);

		
		// var pipeUpdateBlob :PipeUpdateClient = cast Reflect.copy(inputBlob);
		// pipeUpdateBlob.name = name;
		// _inputs.set(name, pipeUpdateBlob);
		// if (this.iframe.parentNode != null && _loaded) {
		// 	sendInput(name);
		// } else {
		// 	debug('Not setting input bc _loaded=$_loaded');
		// }
		// var e :PipeInputBlob = cast Reflect.copy(pipeUpdateBlob);
		// e.iframeId = new MetaframeId(id);
		// _metapage.emit(JsonRpcMethodsFromParent.InputUpdate, e);
	}

	public function setInputs(maybeNewInputs :MetaframeInputMap)
	{
		debug({m:'IFrameRpcClient', inputs:maybeNewInputs});
		if (maybeNewInputs == _inputs) {
			//Equality means no updates
			return;
		}

		var actuallyNewInputs :MetaframeInputMap = null;
		var updatedKeys :Array<MetaframePipeId> = null;
		for (pipeId in maybeNewInputs.keys()) {
			if (!_inputs.exists(pipeId) || _inputs.get(pipeId).v == null || maybeNewInputs.get(pipeId).v == null || _inputs.get(pipeId).v < maybeNewInputs.get(pipeId).v) {
				if (actuallyNewInputs == null) {
					actuallyNewInputs = {};
					updatedKeys = [];
				}
				var version = _inputs.exists(pipeId) && _inputs.get(pipeId).v != null ? _inputs.get(pipeId).v : 0;
				version++;
				var newValue = maybeNewInputs.get(pipeId);
				newValue.v = version;
				actuallyNewInputs.set(pipeId, newValue);
				_inputs.set(pipeId, newValue);
				updatedKeys.push(pipeId);
			}
		}
		if (updatedKeys == null || updatedKeys.length == 0) {
			return;
		}
		//Updated, so create a new copy
		_inputs = Reflect.copy(_inputs);
		// for (input in inputs) {
		// 	Reflect.setField(input, "iframeId", id);
		// 	_inputs.set(input.name, input);
		// }
		if (this.iframe.parentNode != null && _loaded) {
			sendInputs(actuallyNewInputs);
		} else {
			debug('Not setting input bc _loaded=$_loaded');
		}
		var e = {iframeId:id, inputs:actuallyNewInputs};
		_metapage.emit(JsonRpcMethodsFromParent.InputsUpdate, e);
		// for (updatedKey in updatedKeys) {
		// 	_metapage.emit(JsonRpcMethodsFromParent.InputUpdate, e);
		// }
	}

	public function setOutput(pipeId :MetaframePipeId, updateBlob :DataBlob)
	{
		if (pipeId == null) {
			return;
		}
		if (_outputs.exists(pipeId) && _outputs[pipeId].equals(updateBlob)) {
			return;
		}

		var outputs :MetaframeInputMap = {};
		outputs.set(pipeId, updateBlob);
		setOutputs(outputs);

		// _outputs.set(value.name, value);
		// var e :PipeInputBlob = cast Reflect.copy(value);
		// e.iframeId = new MetaframeId(id);
		// _metapage.emit(JsonRpcMethodsFromChild.OutputUpdate, e);
		// for (l in _onOutput) {
		// 	if (l != null) {
		// 		l(value.name, value);
		// 	}
		// }
	}

	public function setOutputs(maybeNewOutputs :MetaframeInputMap)
	{
		if (maybeNewOutputs == null || _outputs == maybeNewOutputs) {
			return;
		}

		var actuallyNewOutputs :MetaframeInputMap = null;
		var updatedKeys :Array<MetaframePipeId> = null;
		for (pipeId in maybeNewOutputs.keys()) {
			//No version means it came from the metaframe itself
			if (!_outputs.exists(pipeId) || _outputs.get(pipeId).v == null || maybeNewOutputs.get(pipeId).v == null || _outputs.get(pipeId).v < maybeNewOutputs.get(pipeId).v) {
				if (actuallyNewOutputs == null) {
					actuallyNewOutputs = {};
					updatedKeys = [];
				}
				var version = _outputs.exists(pipeId) && _outputs.get(pipeId).v != null ? _outputs.get(pipeId).v : 0;
				version++;
				var newValue = maybeNewOutputs.get(pipeId);
				newValue = newValue == null ? {value:null} : newValue;
				newValue.v = version;
				actuallyNewOutputs.set(pipeId, newValue);
				_outputs.set(pipeId, newValue);
				updatedKeys.push(pipeId);
			}
		}
		if (updatedKeys == null || updatedKeys.length == 0) {
			return;
		}
		//Updated, so create a new copy
		_outputs = Reflect.copy(_outputs);
		// for (input in inputs) {
		// 	Reflect.setField(input, "iframeId", id);
		// 	_inputs.set(input.name, input);
		// }
		// if (this.iframe.parentNode != null && _loaded) {
		// 	sendInputs(actuallyNewOutputs);
		// } else {
		// 	debug('Not setting input bc _loaded=$_loaded');
		// }
		// var e = {iframeId:id, inputs:actuallyNewOutputs};
		// _metapage.emit(JsonRpcMethodsFromParent.InputsUpdate, e);
		// for (updatedKey in updatedKeys) {
		// 	_metapage.emit(JsonRpcMethodsFromParent.InputUpdate, e);
		// }


		// for (output in outputs) {
		// 	setOutput(output);
		// }
		// var e = {iframeId:id, outputs:outputs};
		_metapage.emit(JsonRpcMethodsFromChild.OutputsUpdate, actuallyNewOutputs);
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

	public function register()
	{
		if (_loaded) {
			return;
		}
		var response :SetupIframeServerResponseData = {
			state: {inputs:_inputs,outputs:_outputs},
			origin: null, //TODO
			iframeId: id,
			parentId: _parentId,
		};
		sendRpcInternal(JsonRpcMethodsFromParent.SetupIframeServerResponse, response);
	}

	public function registered()
	{
		_loaded = true;
		while(_onLoaded != null && _onLoaded.length > 0) {
			_onLoaded.pop()();
		}
		// var inputs = _inputs.keys().map(_inputs.get);
		// sendInputs(_inputs);
		log('registered');
	}

	// function sendInput(pipeId :String)
	// {
	// 	// var inputBlob :PipeInputBlob = {pipeId :pipeId, value: _inputs.get(pipeId), parentId: _parentId};
	// 	sendRpc(JsonRpcMethodsFromParent.InputUpdate, _inputs.get(pipeId));
	// }

	function sendInputs(inputs :MetaframeInputMap)
	{
		sendRpc(JsonRpcMethodsFromParent.InputsUpdate, {inputs :inputs, parentId: _parentId});
	}

	function sendRpcInternal(method :String, params :Dynamic)
	{
		var messageJson = {'method':method, 'params':params, 'jsonrpc':'2.0', parentId:_parentId, iframeId:id};
		if (this.iframe != null) {
			debug('Sending to child iframe messageJson=${Json.stringify(messageJson).substr(0, 200)}');
			// this.iframe.contentWindow.postMessage(messageJson, "*");
			sendOrBufferPostMessage(messageJson, "*");
		} else {
			_metapage.error('Cannot send to child iframe messageJson=${Json.stringify(messageJson).substr(0, 200)}');
		}
	}


	var _bufferMessages :Array<{message:Dynamic,url:String}>;
	var _bufferTimeout :Int;
	function sendOrBufferPostMessage(message :Dynamic, ?url :String = "*")
	{
		if (this.iframe.contentWindow != null) {
			this.iframe.contentWindow.postMessage(message, url);
		} else {
			if (_bufferMessages == null) {
				_bufferMessages = [{message:message,url:url}];
				_bufferTimeout = Browser.window.setInterval(function() {
					if (this.iframe.contentWindow != null) {
						for (m in _bufferMessages) {
							this.iframe.contentWindow.postMessage(m.message, m.url);
						}
						Browser.window.clearInterval(_bufferTimeout);
						_bufferTimeout = null;
						_bufferMessages = null;
					}
				}, 0);
			} else {
				_bufferMessages.push({message:message,url:url});
			}
		}
	}
}

