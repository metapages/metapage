package metapage;

@:enum
abstract MetaframeEvents(String) to String {
  var Input = "input";
  var Inputs = "inputs";
  var Output = "output";
  var Message = "message";
}

@:expose("Metaframe")
@:keep
class Metaframe extends EventEmitter
{
	var _inputPipeValues :haxe.DynamicAccess<Dynamic> = {};
	var _outputPipeValues :haxe.DynamicAccess<Dynamic> = {};
	var _iframeId :String;
	var _parentId :String;
	var _color :String = '';
	var _debug :Bool = false;
	var _isIframe :Bool;

	public var ready :Promise<Bool>;

	public function new(opt :MetaframeOptionsV1)
	{
		super();
		_debug = (opt != null && opt.debug == true);
		_isIframe = isIframe();

		var window = js.Browser.window;

		if (opt != null && opt.showBanner && !_isIframe) {
			showBanner();
		}

		if (!_isIframe) {
			//Don't add any of the machinery, it only works if we're iframes.
			//This will never return
			ready = new Promise(function(resolve, reject) {
			});
			log('Not an iframe, metaframe code disabled');
			return;
		}

		window.addEventListener('message', onWindowMessage);

		//Add the custom RPCs
		// addEventListener(JsonRpcMethodsFromParent.InputUpdate, function(params :PipeUpdateBlob) {
		// 	debug('InputUpdate from registed RPC pipeId=${params.name} value=${Json.stringify(params.value).substr(0,200)}');
		// 	var pipeId = params != null ? params.name : null;
		// 	var pipeValue = params != null ? params.value : null;
		// 	if (pipeId == null) {
		// 		error('Missing "id" value in the params object to identify the pipe. params=${params}');
		// 	} else {
		// 		debug('Setting input value from InputPipeUpdate pipeId=$pipeId');
		// 		setInput(pipeId, pipeValue);
		// 	}
		// });

		// addEventListener(JsonRpcMethodsFromParent.InputsUpdate, function(params :Array<PipeUpdateBlob>) {
		// 	debug('InputsUpdate from registed RPC params=${Json.stringify(params).substr(0,200)}');
		// 	//Update ALL the values before firing any events
		// 	for (inputUpdate in params) {
		// 		_inputPipeValues.set(inputUpdate.name, inputUpdate.value);
		// 	}
		// 	emit(MetaframeEvents.Inputs, params);
		// 	for (inputUpdate in params) {
		// 		emit(MetaframeEvents.Input, inputUpdate.name, inputUpdate.value);
		// 	}
		// });

		//Get ready, request the parent to register to establish messaging pipes
		ready = new Promise(function(resolve, reject) {
			once(JsonRpcMethodsFromParent.SetupIframeServerResponse, function(params) {
				debug('SetupIframeServerResponse params=${Std.string(params)}');
				if (_iframeId == null) {
					_iframeId = params.iframeId;
					_parentId = params.parentId;

					_color = MetapageTools.stringToRgb(_iframeId);
					debug('initialized parentId=${_parentId}', null);

					resolve(true);

					//Tell the parent we have registered.
					sendRpc(JsonRpcMethodsFromChild.SetupIframeServerResponseAck, {});

					//Set all the output pipe values (if we set the values before setup)
					for (pipeId in _outputPipeValues.keys()) {
						var e :PipeUpdateBlob = {name:pipeId, value:_outputPipeValues.get(pipeId)};
						sendRpc(JsonRpcMethodsFromChild.OutputUpdate, e);
					}
				} else {
					debug('Got JsonRpcMethods.SetupIframeServerResponse but already resolved');
				}
			});
			sendRpc(JsonRpcMethodsFromChild.SetupIframeClientRequest, {});
		});
	}

	public function debug(o :Dynamic, ?pos:haxe.PosInfos)
	{
		if (_debug) {
			log(o, null, null, pos);
		}
	}

	public function log(o :Dynamic, ?color :String, ?backgroundColor :String, ?pos:haxe.PosInfos)
	{
		var s :String = switch(untyped __typeof__(o)) {
			case "string": cast o;
			case "number": o + "";
			default: Json.stringify(o);
		}

		color = color != null ? color + '' : _color;

		s = (_iframeId != null ? 'Metaframe[$_iframeId] ' : '')  + Std.string(s);
		MetapageTools.log(s, color, backgroundColor, pos);
	}

	public function warn(o :Dynamic, ?pos:haxe.PosInfos)
	{
		if (!_debug) {
			return;
		} else {
			log(o, "000", _color, pos);
		}
	}

	public function error(err :Dynamic, ?pos:haxe.PosInfos)
	{
		log(err, _color, "f00", pos);
	}

	override public function dispose()
	{
		super.dispose();
		js.Browser.window.removeEventListener('message', onWindowMessage);
		_inputPipeValues = null;
		_outputPipeValues = null;
	}

	override public function addEventListener(event :String, listener :Function) :Void->Void
	{
		var disposer = super.addEventListener(event, listener);

		//If it is an input or output, set the current input/output values when
		//attaching a listener on the next tick to ensure that the listener
		//will always get a value if it exists
		if (event == MetaframeEvents.Input) {
			Browser.window.setTimeout(function() {
				untyped __js__('for (key in {0}) { {1}.apply(null, key, {0}[key]); }', _inputPipeValues, listener);
			}, 0);
		} else if (event == MetaframeEvents.Output) {
			Browser.window.setTimeout(function() {
				untyped __js__('for (key in {0}) { {1}.apply(null, key, {0}[key]); }', _outputPipeValues, listener);
			}, 0);
		}

		return disposer;
	}

	public function onInput(pipe :String, listener :Dynamic->Void) :Void->Void
	{
		return addEventListener(MetaframeEvents.Input, function(pipeId :String, value :Dynamic) {
			if (pipe == pipeId) {
				listener(value);
			}
		});
	}

	public function onInputs(listener :Array<PipeUpdateBlob>->Void) :Void->Void
	{
		return addEventListener(MetaframeEvents.Inputs, listener);
	}

	public function onOutput(pipe :String, listener :Dynamic->Void) :Void->Void
	{
		return addEventListener(MetaframeEvents.Output, function(pipeId :String, value :Dynamic) {
			if (pipe == pipeId) {
				listener(value);
			}
		});
	}

	public function getInput (pipeId :String) :Dynamic
	{
		return _inputPipeValues.get(pipeId);
	}

	public function setInput(pipeId, pipeValue)
	{
		_inputPipeValues.set(pipeId, pipeValue);
		var inputBlob :PipeUpdateBlob = {name:pipeId, value:pipeValue};
		sendRpc(JsonRpcMethodsFromParent.InputUpdate, inputBlob);
		emit(MetaframeEvents.Input, pipeId, pipeValue);
		emit(MetaframeEvents.Inputs, _inputPipeValues.keys().map(function(key) return {name:key,value:_inputPipeValues.get(key)}));
	}

	public function setInputs(inputs :Array<PipeUpdateBlob>)
	{
		for (input in inputs) {
			_inputPipeValues.set(input.name, input.value);
		}
		emit(MetaframeEvents.Inputs, _inputPipeValues.keys().map(function(key) return {name:key, value:_inputPipeValues.get(key)}));
		for (input in inputs) {
			emit(MetaframeEvents.Input, input.name, input.value);
		}
	}

	public function getInputs() :DynamicAccess<Dynamic>
	{
		var inputs :DynamicAccess<Dynamic>= {};
		for (key in _inputPipeValues.keys()) {
			inputs.set(key, _inputPipeValues.get(key));
		}
		return inputs;
	}

	public function getOutput (pipeId :String) :Dynamic
	{
		return _outputPipeValues.get(pipeId);
	}

	public function setOutput(pipeId :String, pipeValue :Dynamic) :Void
	{
		_outputPipeValues.set(pipeId, pipeValue);
		//Send the update to the parent for piping to other metaframes
		var outputBlob :PipeUpdateBlob = {name:pipeId, value:pipeValue};
		sendRpc(JsonRpcMethodsFromChild.OutputUpdate, outputBlob);
		//Notify internal listeners to output updates
		emit(MetaframeEvents.Output, pipeId, pipeValue);
	}

	public function setOutputs(outputs :Array<PipeUpdateBlob>) :Void
	{
		for (output in outputs) {
			_outputPipeValues.set(output.name, output.value);
		}
		sendRpc(JsonRpcMethodsFromChild.OutputsUpdate, outputs);
		//Notify internal listeners to output updates
		for (output in outputs) {
			emit(MetaframeEvents.Output, output.name, output.value);
		}
	}

	public function getOutputs() :DynamicAccess<Dynamic>
	{
		var outputs :DynamicAccess<Dynamic>= {};
		for (key in _outputPipeValues.keys()) {
			outputs.set(key, _outputPipeValues.get(key));
		}
		return outputs;
	}

	function sendRpc(method :String, params :Dynamic) :Void
	{
		if (_isIframe) {
			var message :MinimumClientMessage = {
				origin: null,
				jsonrpc: '2.0',
				method: method,
				params: params,
				iframeId: _iframeId,
				parentId: _parentId
			};
			debug('Sending message=' + Json.stringify(message).substr(0, 200));
			Browser.window.parent.postMessage(message, "*");
		} else {
			error('Cannot send JSON-RPC window message: there is no window.parent which means we are not an iframe');
		}
	}

	function onWindowMessage(e :Dynamic)
	{
		if (untyped __js__('typeof e.data === "object"')) {
			var jsonrpc :MinimumClientMessage = e.data;
			if (jsonrpc.jsonrpc == '2.0') {//Make sure this is a jsonrpc object
				var method :JsonRpcMethodsFromParent = cast jsonrpc.method;
				if (!(method == JsonRpcMethodsFromParent.SetupIframeServerResponse || (
					jsonrpc.parentId == _parentId &&
					jsonrpc.iframeId == _iframeId))) {
					error('Received message but jsonrpc.parentId=${jsonrpc.parentId} _parentId=$_parentId jsonrpc.iframeId=${jsonrpc.iframeId} _iframeId=$_iframeId');
					return;
				}

				switch(method) {
					case SetupIframeServerResponse: //Handled elsewhere
					case InputUpdate: internalOnInput(jsonrpc.params);
					case InputsUpdate: setInputs(jsonrpc.params.inputs);
				}

				emit(jsonrpc.method, jsonrpc.params);
				emit(MetaframeEvents.Message, jsonrpc);

			} else {
				log('!Bad JsonRPC version=${jsonrpc.jsonrpc}');
			}
		} else {
			log('!message is not an object');
		}
	}

	function internalOnInput(input :PipeUpdateBlob)
	{
		debug('InputUpdate from registed RPC pipeId=${input.name} value=${Json.stringify(input.value).substr(0,200)}');
		var pipeId = input != null ? input.name : null;
		var pipeValue = input != null ? input.value : null;
		if (pipeId == null) {
			error('Missing "id" value in the params object to identify the pipe. input=${input}');
		} else {
			debug('Setting input value from InputPipeUpdate pipeId=$pipeId');
			setInput(pipeId, pipeValue);
		}
	}

	function internalOnInputs(inputs :Array<PipeUpdateBlob>)
	{
		debug('InputUpdates from registed RPC inputs=${Json.stringify(inputs).substr(0,200)}');
	}

	function sendDimensions(?dimensions :{width :Float, height:Float})
	{
		var window = Browser.window;
		if (dimensions == null) {
			var height = window.document.documentElement.scrollHeight != null ? window.document.documentElement.scrollHeight : window.document.body.scrollHeight;
			dimensions = {
				width: null,
				height:height,
				"window.innerWidth": window.innerWidth,
				"window.innerHeight": window.innerHeight,
				"window.document.body.scrollHeight": window.document.body.scrollHeight,
				"window.document.documentElement.scrollHeight": window.document.documentElement.scrollHeight,
			};
		} else {
			if (untyped __typeof__(dimensions) != 'object') {
				throw {dimensions:dimensions, error:'sendDimensions(..) expecting {width:Float, height:Float}'};
			} else {
				if (!(Reflect.hasField(dimensions, 'width') && Reflect.hasField(dimensions, 'height'))) {
					throw {dimensions:dimensions, error:'sendDimensions(..) missing either width or height field, expecting: {width:Float, height:Float}'};
				}
			}
		}
		sendRpc(JsonRpcMethodsFromChild.Dimensions, dimensions);
	}

	static function isIframe() :Bool
	{
		//http://stackoverflow.com/questions/326069/how-to-identify-if-a-webpage-is-being-loaded-inside-an-iframe-or-directly-into-t
		try {
			return untyped __strict_neq__(window, window.top);
		} catch(ignored :Dynamic) {
			return false;
		}
	}

	static var LETTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_';
	static function generateId(?length :Int = 8) :String
	{
		var s = new StringBuf();
		while (length > 0) {
			s.add(LETTERS.charAt(Std.int(Math.max(0, Math.random()*LETTERS.length - 1))));
			length--;
		}
		return s.toString();
	}

	static var BANNER_STYLE_TEXT = '#metapagebanner a{background:#3cf;color:#fff;text-decoration:none;font-family:arial,sans-serif;text-align:center;font-weight:bold;padding:5px 40px;font-size:1rem;line-height:2rem;position:relative;transition:0.5s;}#metapagebanner a:hover{background:#3cf;color:#fff;}#metapagebanner a::before,#metapagebanner a::after{content:"";width:100%;display:block;position:absolute;top:1px;left:0;height:1px;background:#fff;}#metapagebanner a::after{bottom:1px;top:auto;}@media screen and (min-width:800px){#metapagebanner{position:fixed;display:block;top:0;right:0;width:200px;overflow:hidden;height:200px;z-index:9999;}#metapagebanner a{width:200px;position:absolute;top:60px;right:-60px;transform:rotate(45deg);-webkit-transform:rotate(45deg);-ms-transform:rotate(45deg);-moz-transform:rotate(45deg);-o-transform:rotate(45deg);box-shadow:4px 4px 10px rgba(0,0,0,0.8);}}';
	static function showBanner()
	{
		var document = Browser.document;

		var span :SpanElement = cast document.createElement('span');
		span.id = "metapagebanner";
		span.innerHTML = '<a href="https://https://github.com/dionjwa/metapage">Metapage Enabled</a>';
		document.body.insertBefore(span, document.body.firstChild);

		var style :StyleElement = cast document.createElement('style');
		style.innerHTML = BANNER_STYLE_TEXT;
		document.body.insertBefore(style, document.body.firstChild);
	}
}