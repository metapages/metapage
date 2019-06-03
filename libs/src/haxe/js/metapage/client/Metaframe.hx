package js.metapage.client;

@:enum abstract MetaframeEvents<T:haxe.Constraints.Function>(Dynamic) to Dynamic {
  var Input : MetaframeEvents<PipeUpdateClient->Void> = "input";
  var Inputs : MetaframeEvents<MetaframeInputMap->Void> = "inputs";
  var Message : MetaframeEvents<String->Void> = "message";
}

@:expose("Metaframe")
@:keep
@:allow(js.metapage.client.MetaframePlugin)
class Metaframe extends EventEmitter
{
	public static var version :MetaLibsVersion = Constants.VERSION;

	public static var INPUT = MetaframeEvents.Input;
	public static var INPUTS = MetaframeEvents.Inputs;
	public static var MESSAGE = MetaframeEvents.Message;

	var _inputPipeValues :MetaframeInputMap = {};
	var _outputPipeValues :MetaframeInputMap = {};
	// obsoleted, use this.id
	var _iframeId :MetaframeId;
	var _parentId :MetapageId;
	var _parentVersion :MetaLibsVersion;
	var _isIframe :Bool;

	public var debug :Bool = false;
	public var ready(default, null) :Promise<Bool>;
	public var color :String = '000';

	public var plugin :MetaframePlugin;
	
	/**
	 * This is the (locally) unique id that the parent metapage
	 * assigns to the metaframe. Defaults to the name given in
	 * then metapage definition.
	 */
	// TODO obsoleted, use this.id
	public var name(default, null) :String;
	public var id(default, null) :String;

	public function new()
	{
		super();
		debug = MetapageTools.getUrlParamDEBUG();
		_isIframe = isIframe();
		// this.name = MetapageTools.getUrlParamMF_ID();

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
			// First listen to the parent metapage response
			once(JsonRpcMethodsFromParent.SetupIframeServerResponse, function(params :SetupIframeServerResponseData) {

				if (_iframeId == null) {
					_iframeId = params.iframeId;
					this.id = params.iframeId;
					_parentVersion = params.version;
					this.color = MetapageTools.stringToRgb(_iframeId);
					_parentId = params.parentId;
					log('metapage[${_parentId}](v${_parentVersion != null ? _parentVersion : "unknown"}) registered');

					_inputPipeValues = params.state != null && params.state.inputs != null
						? params.state.inputs
						: _inputPipeValues;

					//Tell the parent we have registered.
					sendRpc(JsonRpcMethodsFromChild.SetupIframeServerResponseAck, {version:version});

					//Send notifications of initial inputs (if non-null)
					//so you don't have to listen to the ready event if you don't want to
					if (_inputPipeValues != null && _inputPipeValues.keys().length > 0) {
						emit(MetaframeEvents.Inputs, _inputPipeValues);
						for (pipeId in _inputPipeValues.keys()) {
							emit(MetaframeEvents.Input, pipeId, _inputPipeValues[pipeId]);
						}
					}

					// if this is a plugin, initialize the plugin object
					if (params.plugin) {
						this.plugin = new MetaframePlugin(this);
					}
					

					//Resolve AFTER sending inputs. This way consumers can either:
					//1) Just listen to inputs updates. The first will be when the metaframe is ready
					//2) Listen to the ready event, get the inputs if desired, and listen to subsequent
					//   inputs updates. You may not wish to respond to the first updates but you might
					//   want to know when the metaframe is ready
					//*** Does this distinction make sense?
					resolve(true);

					// window.addEventListener('resize', sendWindowDimensions);
					// sendWindowDimensions();
				} else {
					log('Got JsonRpcMethods.SetupIframeServerResponse but already resolved');
				}
			});
			// Now that we're listening, request to the parent to register us
			sendRpc(JsonRpcMethodsFromChild.SetupIframeClientRequest, {version:version});
		});
	}

	public function log(o :Dynamic, ?color :String, ?backgroundColor :String, ?pos:haxe.PosInfos)
	{
		if (!debug) {
			return;
		}
		logInternal(o, color != null ? color : this.color, null);
	}

	public function warn(o :Dynamic, ?pos:haxe.PosInfos)
	{
		if (!debug) {
			return;
		}
		logInternal(o, "000", color);
	}

	// public function error(err :Dynamic, ?pos:haxe.PosInfos)
	public function error(err :Dynamic)
	{
		logInternal(err, color, "f00");
	}

	// function logInternal(o :Dynamic, ?color :String, ?backgroundColor :String, ?pos:haxe.PosInfos)
	function logInternal(o :Dynamic, ?color :String, ?backgroundColor :String)
	{
		var s :String = switch(js.Syntax.typeof(o)) {
			case "string": cast o;
			case "number": o + "";
			default: Json.stringify(o);
		}

		color = color != null ? color + '' : color;

		s = (_iframeId != null ? 'Metaframe[$_iframeId] ' : '')  + Std.string(s);
		MetapageTools.log(s, color, backgroundColor);
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
				}
			}, 0);
		}

		return disposer;
	}

	public function onInput(pipeId :MetaframePipeId, listener :Dynamic->Void) :Void->Void
	{
		return addEventListener(MetaframeEvents.Input, function(pipe :MetaframePipeId, value :Dynamic) {
			if (pipeId == pipe) {
				listener(value);
			}
		});
	}

	public function onInputs(listener :MetaframeInputMap->Void) :Void->Void
	{
		return addEventListener(MetaframeEvents.Inputs, listener);
	}

	/**
	 * This is a particular use case: metapage inputs are saved outside
	 * the iframe, so when this iframe is restarted in the same metapage
	 * it will start with this value. So in a way, it can be used for
	 * state storage, by the metaframe itself.
	 */
	public function setInput(pipeId :MetaframePipeId, blob :Dynamic)
	{
		var inputs :MetaframeInputMap = {};
		inputs[pipeId] = blob;
		setInputs(inputs);
	}

	/**
	 * This does NOT directly update internal inputs. It tells
	 * the metapage parent, which then updates back. So if there
	 * is no metapage parent, this will do nothing.
	 * 
	 * @param inputs 
	 */
	public function setInputs(inputs :MetaframeInputMap)
	{
		sendRpc(JsonRpcMethodsFromChild.InputsUpdate, inputs);
	}

	function setInternalInputsAndNotify(inputs :MetaframeInputMap)
	{		
		if (!_inputPipeValues.merge(inputs)) {
			return;
		}
		for (pipeId in inputs.keys()) {
			emit(MetaframeEvents.Input, pipeId, inputs[pipeId]);
		}
		emit(MetaframeEvents.Inputs, inputs);
	}

	public function getInput (pipeId :MetaframePipeId) :Dynamic
	{
		require(pipeId != null);
		return _inputPipeValues.get(pipeId);
	}

	public function getInputs() :MetaframeInputMap
	{
		return _inputPipeValues;
	}

	public function getOutput(pipeId :MetaframePipeId) :Dynamic
	{
		require(pipeId != null);
		return _outputPipeValues.get(pipeId);
	}

	/**
	 * What does setting this to null mean?
	 * @param pipeId     :MetaframePipeId [description]
	 * @param updateBlob :Dynamic        [description]
	 */
	public function setOutput(pipeId :MetaframePipeId, updateBlob :Dynamic) :Void
	{
		require(pipeId != null);
		require(updateBlob != null);

		var outputs :MetaframeInputMap = {};
		outputs[pipeId] = updateBlob;

		setOutputs(outputs);
	}

	public function setOutputs(outputs :MetaframeInputMap) :Void
	{
		if (!_outputPipeValues.merge(outputs)) {
			return;
		}
		sendRpc(JsonRpcMethodsFromChild.OutputsUpdate, outputs);
	}

	public function getOutputs() :MetaframeInputMap
	{
		return _outputPipeValues;
	}

	function sendRpc(method :JsonRpcMethodsFromChild, params :Dynamic)
	{
		if (_isIframe) {
			var message :MinimumClientMessage = {
				jsonrpc: '2.0',
				// id     : MetapageTools.generateNonce(),
				method: method,
				params: params,
				iframeId: _iframeId,
				parentId: _parentId
			};
			log(message);
			Browser.window.parent.postMessage(message, "*");
		} else {
			error('Cannot send JSON-RPC window message: there is no window.parent which means we are not an iframe');
		}
	}

	function onWindowMessage(e :Dynamic)
	{
		if (js.Syntax.typeof(e.data) == "object") {
			var jsonrpc :MinimumClientMessage = e.data;
			if (jsonrpc.jsonrpc == '2.0') { //Make sure this is a jsonrpc object
				log(e);
				var method :JsonRpcMethodsFromParent = cast jsonrpc.method;
				if (!(method == JsonRpcMethodsFromParent.SetupIframeServerResponse || (
					jsonrpc.parentId == _parentId &&
					jsonrpc.iframeId == _iframeId))) {
					error('window.message: received message but jsonrpc.parentId=${jsonrpc.parentId} _parentId=$_parentId jsonrpc.iframeId=${jsonrpc.iframeId} _iframeId=$_iframeId');
					return;
				}

				switch(method) {
					case SetupIframeServerResponse: //Handled elsewhere
					case InputsUpdate: setInternalInputsAndNotify(jsonrpc.params.inputs);
					default: if (debug) log('window.message: unknown JSON-RPC method: ${Json.stringify(jsonrpc)}');
				}

				emit(jsonrpc.method, jsonrpc.params);
				emit(MetaframeEvents.Message, jsonrpc);

			} else {
				//Some other message, e.g. webpack dev server, ignored
				if (debug) log('window.message: not JSON-RPC: ${Json.stringify(jsonrpc)}');
			}
		} else {
			//Not an object, ignored
			if (debug) log('window.message: not an object, ignored: ${Json.stringify(e)}');
		}
	}

	public static function isIframe() :Bool
	{
		//http://stackoverflow.com/questions/326069/how-to-identify-if-a-webpage-is-being-loaded-inside-an-iframe-or-directly-into-t
		try {
			return js.Syntax.strictNeq(Browser.window, Browser.window.top);
		} catch(ignored :Dynamic) {
			return false;
		}
	}
}

class MetaframePlugin
{
	var _metaframe :Metaframe;

	public function new(metaframe :Metaframe)
	{
		_metaframe = metaframe;
	}

	public function requestState()
	{
		var payload :ApiPayloadPluginRequest = {
			method: ApiPayloadPluginRequestMethod.State,
		}
		_metaframe.sendRpc(JsonRpcMethodsFromChild.PluginRequest, payload);
	}

	public function onState(listener :Dynamic->Void) :Void->Void
	{
		var disposer = _metaframe.onInput(METAPAGE_KEY_STATE, listener);
		if (this.getState() != null) {
			listener(this.getState());
		}
		return disposer;
	}

	public function getState() :Dynamic
	{
		return _metaframe.getInput(METAPAGE_KEY_STATE);
	}

	public function setState(state :Dynamic)
	{
		_metaframe.setOutput(METAPAGE_KEY_STATE, state);
	}

	public function onDefinition(listener :Dynamic->Void) :Void->Void
	{
		var disposer = _metaframe.onInput(METAPAGE_KEY_DEFINITION, listener);
		if (this.getDefinition() != null) {
			listener(this.getDefinition());
		}
		return disposer;
	}

	public function setDefinition(definition :Dynamic)
	{
		_metaframe.setOutput(METAPAGE_KEY_DEFINITION, definition);
	}

	public function getDefinition() :Dynamic
	{
		return _metaframe.getInput(METAPAGE_KEY_DEFINITION);
	}
}
