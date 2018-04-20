package js.metapage.v1.client;

@:enum abstract MetaframeEvents<T:haxe.Constraints.Function>(Dynamic) to Dynamic {
  var Input : MetaframeEvents<PipeUpdateClient->Void> = "input";
  var Inputs : MetaframeEvents<Array<PipeUpdateClient>->Void> = "inputs";
  var Output : MetaframeEvents<PipeUpdateClient->Void> = "output";
  var Outputs : MetaframeEvents<Array<PipeUpdateClient>->Void> = "outputs";
  var Message : MetaframeEvents<String->Void> = "message";
}

typedef MetaframeOptions = {
	@:optional var debug :Bool;
}

@:expose("Metaframe")
@:keep
class Metaframe extends EventEmitter
{
	static var METAPAGE_VERSION = MetapageVersion.Alpha;
	var _inputPipeValues :haxe.DynamicAccess<PipeUpdateClient> = {};
	var _outputPipeValues :haxe.DynamicAccess<PipeUpdateClient> = {};
	var _iframeId :String;
	var _parentId :String;
	var _color :String = '';
	var _debug :Bool = false;
	var _isIframe :Bool;

	public var ready :Promise<Bool>;

	public function new(?opt :MetaframeOptions)
	{
		super();
		_debug = (opt != null && opt.debug == true);
		_isIframe = isIframe();

		var window = Browser.window;

		if (!_isIframe) {
			//Don't add any of the machinery, it only works if we're iframes.
			//This will never return
			ready = new Promise(function(resolve, reject) {});
			log('Not an iframe, metaframe code disabled');
			return;
		}

		window.addEventListener('message', onWindowMessage);

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
					sendRpc(JsonRpcMethodsFromChild.OutputsUpdate, _outputPipeValues.keys().map(_outputPipeValues.get));
					// for (pipeId in _outputPipeValues.keys()) {
					// 	var e :PipeUpdateBlob = {pipeId:pipeId, value:_outputPipeValues.get(pipeId)};
					// 	sendRpc(JsonRpcMethodsFromChild.OutputUpdate, e);
					// }
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

	override public function addEventListener(event :String, listener :Dynamic) :Void->Void
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

	public function onInput(pipe :String, listener :PipeUpdateClient->Void) :Void->Void
	{
		return addEventListener(MetaframeEvents.Input, function(pipeId :String, value :PipeUpdateClient) {
			if (pipe == pipeId) {
				listener(value);
			}
		});
	}

	public function onInputs(listener :Array<PipeUpdateClient>->Void) :Void->Void
	{
		return addEventListener(MetaframeEvents.Inputs, listener);
	}

	public function onOutput(pipe :String, listener :PipeUpdateClient->Void) :Void->Void
	{
		return addEventListener(MetaframeEvents.Output, function(pipeId :String, value :PipeUpdateClient) {
			if (pipe == pipeId) {
				listener(value);
			}
		});
	}

	public function getInput (pipeId :String) :PipeUpdateClient
	{
		return _inputPipeValues.get(pipeId);
	}

	public function setInput(inputBlob :PipeUpdateClient)
	{
		var pipeId = inputBlob.name;
		assert(pipeId != null);
		_inputPipeValues.set(pipeId, inputBlob);

		// var inputBlob :PipeUpdateBlob = Reflect.copy(inputBlob);
		// inputBlob.pipeId = pipeId
		sendRpc(JsonRpcMethodsFromParent.InputUpdate, inputBlob);
		emit(MetaframeEvents.Input, pipeId, inputBlob);
		emit(MetaframeEvents.Inputs, _inputPipeValues.keys().map(_inputPipeValues.get));
	}

	public function setInputs(inputs :Array<PipeUpdateClient>)
	{
		for (input in inputs) {
			_inputPipeValues.set(input.name, input);
		}
		emit(MetaframeEvents.Inputs, _inputPipeValues.keys().map(_inputPipeValues.get));
		for (input in inputs) {
			emit(MetaframeEvents.Input, input.name, input);
		}
	}

	public function getInputs() :DynamicAccess<PipeUpdateClient>
	{
		var inputs :DynamicAccess<PipeUpdateClient>= {};
		for (key in _inputPipeValues.keys()) {
			inputs.set(key, _inputPipeValues.get(key));
		}
		return inputs;
	}

	public function getOutput(pipeId :String) :PipeUpdateClient
	{
		return _outputPipeValues.get(pipeId);
	}

	public function setOutput(updateBlob :PipeUpdateClient) :Void
	{
		require(updateBlob != null);
		require(updateBlob.name != null, updateBlob);
		_outputPipeValues.set(updateBlob.name, updateBlob);
		//Send the update to the parent for piping to other metaframes
		sendRpc(JsonRpcMethodsFromChild.OutputUpdate, updateBlob);
		//Notify internal listeners to output updates
		emit(MetaframeEvents.Output, updateBlob.name, updateBlob);
	}

	public function setOutputs(outputs :Array<PipeUpdateClient>, ?clearPrevious :Bool = false) :Void
	{
		trace('setOutputs outputs=$outputs');
		var previousOutputKeys = _outputPipeValues.keys();
		for (output in outputs) {
			_outputPipeValues.set(output.name, output);
			previousOutputKeys.remove(output.name);
		}
		if (clearPrevious) {
			for (key in previousOutputKeys) {
				_outputPipeValues.remove(key);
			}
		}
		sendRpc(JsonRpcMethodsFromChild.OutputsUpdate, outputs);
		//Notify internal listeners to output updates
		for (output in outputs) {
			emit(MetaframeEvents.Output, output.name, output);
		}
	}

	public function getOutputs() :DynamicAccess<PipeUpdateClient>
	{
		var outputs :DynamicAccess<PipeUpdateClient>= {};
		for (key in _outputPipeValues.keys()) {
			outputs.set(key, _outputPipeValues.get(key));
		}
		trace('getOutputs outputs=$outputs');
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
			error('Missing "name" value in the params object to identify the pipe. input=${input}');
		} else {
			debug('Setting input value from InputPipeUpdate pipeId=$pipeId');
			setInput(input);
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
}