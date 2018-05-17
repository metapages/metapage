package js.metapage.v1.client;

@:enum abstract MetaframeEvents<T:haxe.Constraints.Function>(Dynamic) to Dynamic {
  var Input : MetaframeEvents<PipeUpdateClient->Void> = "input";
  var Inputs : MetaframeEvents<MetaframeInputMap->Void> = "inputs";
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
	var _inputPipeValues :MetaframeInputMap = {};
	var _outputPipeValues :MetaframeInputMap = {};
	var _iframeId :MetaframeId;
	var _parentId :MetapageId;
	var _color :String = '';
	var _debug :Bool = false;
	var _isIframe :Bool;

	public var ready :Promise<Bool>;

	public function new(?opt :MetaframeOptions)
	{
		super();
		_debug = (opt != null && opt.debug == true);
		_isIframe = isIframe();

		if (!_isIframe) {
			//Don't add any of the machinery, it only works if we're iframes.
			//This will never return
			ready = new Promise(function(resolve, reject) {});
			log('Not an iframe, metaframe code disabled');
			return;
		}

		var window = Browser.window;

		window.addEventListener('message', onWindowMessage);

		//Get ready, request the parent to register to establish messaging pipes
		ready = new Promise(function(resolve, reject) {
			once(JsonRpcMethodsFromParent.SetupIframeServerResponse, function(params :SetupIframeServerResponseData) {

				debug('SetupIframeServerResponse params=${Std.string(params)}');
				if (_iframeId == null) {
					_iframeId = params.iframeId;
					_parentId = params.parentId;

					_inputPipeValues = params.state != null && params.state.inputs != null
						? params.state.inputs
						: _inputPipeValues;

					_outputPipeValues = params.state != null && params.state.outputs != null
						? params.state.outputs
						: _outputPipeValues;

					_color = MetapageTools.stringToRgb(_iframeId);
					debug('initialized parentId=${_parentId}', null);

					//Tell the parent we have registered.
					sendRpc(JsonRpcMethodsFromChild.SetupIframeServerResponseAck, {});

					resolve(true);
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
		if (event == MetaframeEvents.Inputs) {
			Browser.window.setTimeout(function() {
				if (_inputPipeValues != null) {
					listener(_inputPipeValues);
					// var keys = _inputPipeValues.keys();
					// untyped __js__('for (key in {1}) { try{ if (key !== undefined && {0}[key] !== undefined) { {1}.apply(null, key, {0}[key]); } }catch(e){console.error(e);} }', keys, _inputPipeValues, listener);
				}
			}, 0);
		}

		return disposer;
	}

	public function onInput(pipeId :MetaframePipeId, listener :DataBlob->Void) :Void->Void
	{
		return addEventListener(MetaframeEvents.Inputs, function(inputs :MetaframeInputMap) {
			if (inputs.exists(pipeId)) {
				listener(inputs.get(pipeId));
			}
		});
	}

	public function onInputs(listener :MetaframeInputMap->Void) :Void->Void
	{
		return addEventListener(MetaframeEvents.Inputs, listener);
	}

	public function getInput (pipeId :MetaframePipeId) :DataBlob
	{
		return _inputPipeValues.get(pipeId);
	}

	/**
	 * Not public. I dont' see the use case of allowing internal
	 * metaframes to set their own "inputs". It's state they know,
	 * it's not coming from the metapage parent, so it's not really
	 * a function argument, if you think about metaframes as
	 * functions.
	 * In fact, what's the use case of setting iframes inputs *outside*
	 * the initial setup?
	 * If you want to set the initial iframes inputs, or restore
	 * from a saved state, they come from the metapage, ie initial
	 * state.
	 */
	function setInputsFromMetapage(inputs :MetaframeInputMap)
	{
		if (inputs == null) {
			return;
		}

		var actualUpdates :MetaframeInputMap = null;
		for (pipeId in inputs.keys()) {
			var updateBlob = inputs[pipeId];
			if (_inputPipeValues.exists(pipeId) && _inputPipeValues[pipeId].equals(updateBlob)) {
				//No change
				continue;
			}
			//No version. Metaframe internal inputs are not versioned
			actualUpdates = actualUpdates == null ? {} : actualUpdates;
			actualUpdates.set(pipeId, updateBlob);
			_inputPipeValues.set(pipeId, updateBlob);
		}

		if (actualUpdates != null) {
			emit(MetaframeEvents.Inputs, actualUpdates);
			for (pipeId in actualUpdates.keys()) {
				emit(MetaframeEvents.Input, pipeId, actualUpdates[pipeId]);
			}
		}
	}

	public function getInputs() :MetaframeInputMap
	{
		return Reflect.copy(_inputPipeValues);
	}

	public function getOutput(pipeId :MetaframePipeId) :DataBlob
	{
		require(pipeId != null);
		return _outputPipeValues.get(pipeId);
	}

	/**
	 * What does setting this to null mean?
	 * @param pipeId     :MetaframePipeId [description]
	 * @param updateBlob :DataBlob        [description]
	 */
	public function setOutput(pipeId :MetaframePipeId, updateBlob :DataBlob) :Void
	{
		require(pipeId != null);
		// require(updateBlob.name != null, updateBlob);

		var outputs :MetaframeInputMap = {};
		outputs[pipeId] = updateBlob;

		setOutputs(outputs);
	}

	public function setOutputs(outputs :MetaframeInputMap, ?clearPrevious :Bool = false) :Void
	{
		if (clearPrevious) {
			_outputPipeValues = {};
		}

		if (outputs == null) {
			return;
		}

		var actualUpdates :MetaframeInputMap = null;
		for (pipeId in outputs.keys()) {
			var updateBlob = outputs[pipeId];
			if (_outputPipeValues.exists(pipeId) && _outputPipeValues[pipeId].equals(updateBlob)) {
				//No change
				continue;
			}

			var version = _outputPipeValues.exists(pipeId) && _outputPipeValues[pipeId].v != null
				? _outputPipeValues[pipeId].v
				: 0;
			version++;
			updateBlob = updateBlob == null ? {value :null} : updateBlob;
			updateBlob.v = version;
			actualUpdates = actualUpdates == null ? {} : actualUpdates;
			actualUpdates.set(pipeId, updateBlob);
			_outputPipeValues.set(pipeId, updateBlob);
		}

		if (actualUpdates != null) {
			sendRpc(JsonRpcMethodsFromChild.OutputsUpdate, outputs);
		}
	}

	public function getOutputs() :MetaframeInputMap
	{
		return Reflect.copy(_outputPipeValues);
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
					case InputsUpdate: setInputsFromMetapage(jsonrpc.params.inputs);
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