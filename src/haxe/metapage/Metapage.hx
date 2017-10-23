package metapage;

@:expose("Metapage")
@:keep
class Metapage extends EventEmitter
{
	public static function fromDefinition(metaPageDef :MetapageDefinitionV1)
	{
		var metapage = new Metapage(metaPageDef.options);
		if (metaPageDef.iframes != null) {
			for (iframeId in metaPageDef.iframes.keys()) {
				var iframeDef = metaPageDef.iframes.get(iframeId);
				var iframe = metapage.createIFrame(iframeDef.url, iframeId);
				if (Reflect.field(iframeDef, 'in') != null) {
					var inPipes :DynamicAccess<PipeDefinitionV1> = Reflect.field(iframeDef, 'in');
					for (inPipeName in inPipes.keys()) {
						iframe.setInput(inPipeName, inPipes.get(inPipeName).value);
					}
				}
			}
		}
		if (metaPageDef.pipes != null) {
			for (pipeDef in metaPageDef.pipes) {
				metapage.pipe(pipeDef);
			}
		}
		return metapage;
	}

	/* [from][pipeId]=>Array<PipeInput>*/
	var _outputPipeMap :DynamicAccess<DynamicAccess<Array<PipeInput>>> = {};
	var _iframes :DynamicAccess<IFrameRpcClient> = {};
	var _id :String;
	public var _debug :Bool = false;
	var _consoleBackgroundColor :String;

	public static var CONSOLE_BACKGROUND_COLOR_DEFAULT = 'bcbcbc';

	static var LETTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_';

	public function new(?opts :MetapageOptionsV1)
	{
		super();
		_id = generateId();
		_debug = opts != null && opts.debug == true;
		_consoleBackgroundColor = (opts != null && opts.color != null ? opts.color : CONSOLE_BACKGROUND_COLOR_DEFAULT);
		Browser.window.addEventListener('message', onMessage);
		log('Initialized');
	}

	public function removeAll() :Void
	{
		for(id in _iframes.keys()) {
			_iframes.get(id).dispose();
		}
		_outputPipeMap = {};
		_iframes = {};
	}

	public function get_iframes() :DynamicAccess<IFrameElement>
	{
		var all :DynamicAccess<IFrameElement> = {};
		for (key in _iframes.keys()) {
			all.set(key, _iframes.get(key).iframe);
		}
		return all;
	}

	public function createIFrame(url :String, ?iframeId :String = null)
	{
		iframeId = iframeId != null ? iframeId : generateId();
		var iframeClient = new IFrameRpcClient(url, iframeId, _id, _consoleBackgroundColor, _debug);
		iframeClient._metapage = this;
		_iframes.set(iframeId, iframeClient);
		return iframeClient;
	}

	public function pipe(pipe :Pipe)
	{
		if (!_outputPipeMap.exists(pipe.from.id)) {
			_outputPipeMap.set(pipe.from.id, {});
		}
		if (!_outputPipeMap.get(pipe.from.id).exists(pipe.from.pipe)) {
			_outputPipeMap.get(pipe.from.id).set(pipe.from.pipe, []);
		}
		_outputPipeMap.get(pipe.from.id).get(pipe.from.pipe).push(pipe.to);
	}

	public function setInput(iframeId :String, inputPipeId :String, value :DataBlob)
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
				if (!(message.parentId == _id && _iframes.exists(message.iframeId))) {
					error('message.parentId=${message.parentId} _id=${_id} message.iframeId=${message.iframeId} _iframes.exists(message.iframeId)=${_iframes.exists(message.iframeId)} message=${Json.stringify(message).substr(0, 200)}');
				}
				return message.parentId == _id && _iframes.exists(message.iframeId);
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

				case OutputUpdate:
					var outputBlob :PipeOutputBlob = jsonrpc.params;
					assert(outputBlob != null);
					assert(outputBlob.name != null);
					var dataBlob :DataBlob = {
						value: outputBlob.value,
						type: outputBlob.type == null ? js.Lib.undefined : outputBlob.type,
						source: outputBlob.source,
						encoding: outputBlob.encoding
					};
					var pipeId :String = outputBlob.name;
					// var pipeValue :Dynamic = outputBlob.value;
					var iframeId :String = jsonrpc.iframeId;
					var iframe = _iframes.get(iframeId);
					iframe.debug('OutputPipeUpdate from=$iframeId pipeId=${outputBlob.name} params=${Json.stringify(jsonrpc.params).substr(0,200)}');
					if (iframe != null) {
						iframe.setOutput(outputBlob);
						//Set the downstream pipes
						//Does this metaframe have outgoing pipes?
						if (_outputPipeMap.exists(iframeId)) {
							//Are any of the outgoing pipes this one?
							if (_outputPipeMap.get(iframeId).exists(pipeId)) {
								//Get the incoming pipes from downstream metaframes
								var inputPipes = _outputPipeMap.get(iframeId).get(pipeId);
								if (inputPipes != null) {
									for (inputPipe in inputPipes) {
										var inputIframe = _iframes.get(inputPipe.id);
										if (inputIframe != null) {
											iframe.debug('Sending from $iframeId.$pipeId to ${inputPipe.id}.${inputPipe.pipe}');
											inputIframe.setInput(inputPipe.pipe, dataBlob);
										}
									}
								}
							} else {
								error('OutputPipeUpdate _outputPipeMap.get($iframeId).get($pipeId) is null');
							}
						} else {
							// error('OutputPipeUpdate !_outputPipeMap.exists($iframeId) keys=${_outputPipeMap.keys()}');
						}
					} else {
						error('missing iframe=$iframeId');
					}
				case OutputsUpdate:

					var iframeId :String = jsonrpc.iframeId;
					var iframe = _iframes.get(iframeId);
					var outputs :Array<PipeOutputBlob> = jsonrpc.params;
					iframe.debug('OutputsUpdate from=$iframeId outputs=${Json.stringify(jsonrpc.params).substr(0,200)}');
					if (iframe != null) {
						iframe.setOutputs(outputs);
						//Does this iframe have output pipes?
						if (_outputPipeMap.exists(iframeId)) {
							var iframeToInputs :DynamicAccess<Array<PipeUpdateBlob>> = {};
							for(output in outputs) {
								var outputName = output.name;
								//Does the output pipe go anywhere?
								if (_outputPipeMap.get(iframeId).exists(outputName)) {
									//Array of input pipes from the output pipe
									var inputPipes = _outputPipeMap.get(iframeId).get(outputName);
									if (inputPipes != null) {
										for (inputPipe in inputPipes) {
											var inputIframe = _iframes.get(inputPipe.id);
											if (inputIframe != null) {
												iframe.debug('Sending from $iframeId.$outputName to ${inputPipe.id}.${inputPipe.pipe}');
												if (iframeToInputs.get(inputPipe.id) == null) {
													iframeToInputs.set(inputPipe.id, []);
												}
												var thisOutputBlob :PipeUpdateBlob = Reflect.copy(output);
												thisOutputBlob.name = inputPipe.id;
												iframeToInputs.get(inputPipe.id).push(thisOutputBlob);
												// inputIframe.setInput(inputPipe.pipe, outputValue);
											}
										}
									}
								} else {
									error('OutputsUpdate _outputPipeMap.get($iframeId).get($outputName) is null');
								}
							}
							for (iframeId in iframeToInputs.keys()) {
								_iframes.get(iframeId).setInputs(iframeToInputs.get(iframeId));
							}
						} else {
							// error('OutputPipeUpdate !_outputPipeMap.exists($iframeId) keys=${_outputPipeMap.keys()}');
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

	static function generateId(?length :Int = 8) :String
	{
		var s = new StringBuf();
		while (length > 0) {
			s.add(LETTERS.charAt(Std.int(Math.max(0, Math.random()*LETTERS.length - 1))));
			length--;
		}
		return s.toString();
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
	public var id (default, null):String;
	var _color :String;
	var _consoleBackgroundColor :String;
	var _ready :Promise<Bool>;
	var _inputs :DynamicAccess<PipeUpdateBlob> = {};
	var _outputs :DynamicAccess<PipeUpdateBlob> = {};
	var _disposables :Array<Void->Void> = [];
	var _rpcListeners :Array<RequestDef->Void> = [];
	var _loaded :Bool = false;
	var _onLoaded : Array<Void->Void> = [];
	var _onOutput : Array<String->PipeUpdateBlob->Void> = [];
	var _parentId :String;
	var _url :String;
	var _debug :Bool;
	public var _metapage :Metapage;

	public function new(url :String, iframeId :String, parentId :String, consoleBackgroundColor :String, ?debug :Bool = false)
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
		sendInputs(_inputs.keys().map(_inputs.get));
	}

	public function setInput(name :String, inputBlob :DataBlob)
	{
		assert(inputBlob != null);
		assert(name != null);
		var pipeUpdateBlob :PipeUpdateClientV1 = cast Reflect.copy(inputBlob);
		pipeUpdateBlob.name = name;
		_inputs.set(name, pipeUpdateBlob);
		if (this.iframe.parentNode != null && _loaded) {
			sendInput(name);
		} else {
			debug('Not setting input bc _loaded=$_loaded');
		}
		var e :PipeInputBlob = cast Reflect.copy(pipeUpdateBlob);
		e.iframeId = new MetaframeId(id);
		_metapage.emit(JsonRpcMethodsFromParent.InputUpdate, e);
	}

	public function setInputs(inputs :Array<PipeUpdateBlob>)
	{
		debug({m:'IFrameRpcClient', inputs:inputs});
		for (input in inputs) {
			Reflect.setField(input, "iframeId", id);
			_inputs.set(input.name, input);
		}
		if (this.iframe.parentNode != null && _loaded) {
			sendInputs(inputs);
		} else {
			debug('Not setting input bc _loaded=$_loaded');
		}
		_metapage.emit(JsonRpcMethodsFromParent.InputsUpdate, {iframeId:id, inputs:inputs});
	}

	public function setOutput(value :PipeUpdateBlob)
	{
		_outputs.set(value.name, value);
		var e :PipeInputBlob = cast Reflect.copy(value);
		e.iframeId = new MetaframeId(id);
		_metapage.emit(JsonRpcMethodsFromChild.OutputUpdate, e);
		for (l in _onOutput) {
			if (l != null) {
				l(value.name, value);
			}
		}
	}

	public function setOutputs(outputs :Array<PipeUpdateBlob>)
	{
		for (output in outputs) {
			setOutput(output);
		}
		var e = {iframeId:id, outputs:outputs};
		_metapage.emit(JsonRpcMethodsFromChild.OutputsUpdate, e);
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
	}

	public function register()
	{
		var response :SetupIframeServerResponseData = {
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
		var inputs = _inputs.keys().map(_inputs.get);
		sendInputs(inputs);
		log('registered');
	}

	function sendInput(pipeId :String)
	{
		// var inputBlob :PipeInputBlob = {pipeId :pipeId, value: _inputs.get(pipeId), parentId: _parentId};
		sendRpc(JsonRpcMethodsFromParent.InputUpdate, _inputs.get(pipeId));
	}

	function sendInputs(inputs :Array<PipeUpdateBlob>)
	{
		sendRpc(JsonRpcMethodsFromParent.InputsUpdate, {inputs :inputs, parentId: _parentId});
	}

	function sendRpcInternal(method :String, params :Dynamic)
	{
		var messageJson = {'method':method, 'params':params, 'jsonrpc':'2.0', parentId:_parentId, iframeId:id};
		if (this.iframe != null) {
			debug('Sending to child iframe messageJson=${Json.stringify(messageJson).substr(0, 200)}');
			this.iframe.contentWindow.postMessage(messageJson, "*");
		} else {
			_metapage.error('Cannot send to child iframe messageJson=${Json.stringify(messageJson).substr(0, 200)}');
		}
	}
}

