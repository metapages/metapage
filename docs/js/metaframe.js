// Generated by Haxe 3.3.0
(function ($hx_exports) { "use strict";
function $extend(from, fields) {
	function Inherit() {} Inherit.prototype = from; var proto = new Inherit();
	for (var name in fields) proto[name] = fields[name];
	if( fields.toString !== Object.prototype.toString ) proto.toString = fields.toString;
	return proto;
}
var HxOverrides = function() { };
HxOverrides.__name__ = true;
HxOverrides.cca = function(s,index) {
	var x = s.charCodeAt(index);
	if(x != x) {
		return undefined;
	}
	return x;
};
HxOverrides.substr = function(s,pos,len) {
	if(len == null) {
		len = s.length;
	} else if(len < 0) {
		if(pos == 0) {
			len = s.length + len;
		} else {
			return "";
		}
	}
	return s.substr(pos,len);
};
HxOverrides.remove = function(a,obj) {
	var i = a.indexOf(obj);
	if(i == -1) {
		return false;
	}
	a.splice(i,1);
	return true;
};
Math.__name__ = true;
var Reflect = function() { };
Reflect.__name__ = true;
Reflect.fields = function(o) {
	var a = [];
	if(o != null) {
		var hasOwnProperty = Object.prototype.hasOwnProperty;
		for( var f in o ) {
		if(f != "__id__" && f != "hx__closures__" && hasOwnProperty.call(o,f)) {
			a.push(f);
		}
		}
	}
	return a;
};
var Std = function() { };
Std.__name__ = true;
Std.string = function(s) {
	return js_Boot.__string_rec(s,"");
};
var StringTools = function() { };
StringTools.__name__ = true;
StringTools.isSpace = function(s,pos) {
	var c = HxOverrides.cca(s,pos);
	if(!(c > 8 && c < 14)) {
		return c == 32;
	} else {
		return true;
	}
};
StringTools.ltrim = function(s) {
	var l = s.length;
	var r = 0;
	while(r < l && StringTools.isSpace(s,r)) ++r;
	if(r > 0) {
		return HxOverrides.substr(s,r,l - r);
	} else {
		return s;
	}
};
StringTools.rtrim = function(s) {
	var l = s.length;
	var r = 0;
	while(r < l && StringTools.isSpace(s,l - r - 1)) ++r;
	if(r > 0) {
		return HxOverrides.substr(s,0,l - r);
	} else {
		return s;
	}
};
StringTools.trim = function(s) {
	return StringTools.ltrim(StringTools.rtrim(s));
};
var haxe_remoting_JsonRpcConstants = function() { };
haxe_remoting_JsonRpcConstants.__name__ = true;
var js__$Boot_HaxeError = function(val) {
	Error.call(this);
	this.val = val;
	this.message = String(val);
	if(Error.captureStackTrace) {
		Error.captureStackTrace(this,js__$Boot_HaxeError);
	}
};
js__$Boot_HaxeError.__name__ = true;
js__$Boot_HaxeError.wrap = function(val) {
	if((val instanceof Error)) {
		return val;
	} else {
		return new js__$Boot_HaxeError(val);
	}
};
js__$Boot_HaxeError.__super__ = Error;
js__$Boot_HaxeError.prototype = $extend(Error.prototype,{
});
var js_Boot = function() { };
js_Boot.__name__ = true;
js_Boot.__string_rec = function(o,s) {
	if(o == null) {
		return "null";
	}
	if(s.length >= 5) {
		return "<...>";
	}
	var t = typeof(o);
	if(t == "function" && (o.__name__ || o.__ename__)) {
		t = "object";
	}
	switch(t) {
	case "function":
		return "<function>";
	case "object":
		if(o instanceof Array) {
			if(o.__enum__) {
				if(o.length == 2) {
					return o[0];
				}
				var str = o[0] + "(";
				s += "\t";
				var _g1 = 2;
				var _g = o.length;
				while(_g1 < _g) {
					var i = _g1++;
					if(i != 2) {
						str += "," + js_Boot.__string_rec(o[i],s);
					} else {
						str += js_Boot.__string_rec(o[i],s);
					}
				}
				return str + ")";
			}
			var l = o.length;
			var i1;
			var str1 = "[";
			s += "\t";
			var _g11 = 0;
			var _g2 = l;
			while(_g11 < _g2) {
				var i2 = _g11++;
				str1 += (i2 > 0?",":"") + js_Boot.__string_rec(o[i2],s);
			}
			str1 += "]";
			return str1;
		}
		var tostr;
		try {
			tostr = o.toString;
		} catch( e ) {
			return "???";
		}
		if(tostr != null && tostr != Object.toString && typeof(tostr) == "function") {
			var s2 = o.toString();
			if(s2 != "[object Object]") {
				return s2;
			}
		}
		var k = null;
		var str2 = "{\n";
		s += "\t";
		var hasp = o.hasOwnProperty != null;
		for( var k in o ) {
		if(hasp && !o.hasOwnProperty(k)) {
			continue;
		}
		if(k == "prototype" || k == "__class__" || k == "__super__" || k == "__interfaces__" || k == "__properties__") {
			continue;
		}
		if(str2.length != 2) {
			str2 += ", \n";
		}
		str2 += s + k + " : " + js_Boot.__string_rec(o[k],s);
		}
		s = s.substring(1);
		str2 += "\n" + s + "}";
		return str2;
	case "string":
		return o;
	default:
		return String(o);
	}
};
var metapage_EventEmitter = function() {
	this._events = { };
};
metapage_EventEmitter.__name__ = true;
metapage_EventEmitter.prototype = {
	on: function(event,listener) {
		return this.addEventListener(event,listener);
	}
	,addEventListener: function(event,listener) {
		if(!Object.prototype.hasOwnProperty.call(this._events,event)) {
			this._events[event] = [];
		}
		this._events[event].push(listener);
		var f = $bind(this,this.removeListener);
		var a1 = event;
		var a2 = listener;
		return function() {
			f(a1,a2);
		};
	}
	,once: function(event,listener) {
		var _gthis = this;
		var g = function() {
			var args = arguments;
			_gthis.removeListener(event,g);
			listener.apply(null, args);
		};
		return this.addEventListener(event,g);
	}
	,removeListener: function(event,listener) {
		if(event in this._events) {
			var arr = this._events[event];
			HxOverrides.remove(arr,listener);
		}
	}
	,emit: function(event,val1,val2,val3,val4) {
		var args = [].slice.call(arguments, 1);
		if(Object.prototype.hasOwnProperty.call(this._events,event)) {
			var listeners = this._events[event].slice();
			var _g = 0;
			while(_g < listeners.length) {
				var listener = listeners[_g];
				++_g;
				listener.apply(null, args);
			}
		}
	}
	,dispose: function() {
		this._events = { };
	}
};
var metapage_Metaframe = $hx_exports["Metaframe"] = function(opt) {
	this._debug = false;
	this._color = "";
	this._outputPipeValues = { };
	this._inputPipeValues = { };
	var _gthis = this;
	metapage_EventEmitter.call(this);
	this._debug = opt != null && opt.debug == true;
	this._isIframe = metapage_Metaframe.isIframe();
	var $window = window;
	if(opt != null && opt.showBanner && !this._isIframe) {
		metapage_Metaframe.showBanner();
	}
	if(!this._isIframe) {
		this.ready = new Promise(function(resolve,reject) {
		});
		this.log("Not an iframe, metaframe code disabled",null,null,{ fileName : "Metaframe.hx", lineNumber : 42, className : "metapage.Metaframe", methodName : "new"});
		return;
	}
	$window.addEventListener("message",$bind(this,this.onWindowMessage));
	this.ready = new Promise(function(resolve1,reject1) {
		_gthis.once("SetupIframeServerResponse",function(params) {
			_gthis.debug("SetupIframeServerResponse params=" + Std.string(params),{ fileName : "Metaframe.hx", lineNumber : 76, className : "metapage.Metaframe", methodName : "new"});
			if(_gthis._iframeId == null) {
				_gthis._iframeId = params.iframeId;
				_gthis._parentId = params.parentId;
				var str = _gthis._iframeId;
				var hash = 0;
				var _g1 = 0;
				var _g = str.length;
				while(_g1 < _g) hash = HxOverrides.cca(str,_g1++) + ((hash << 5) - hash);
				var c = (hash & 16777215).toString(16).toUpperCase();
				_gthis._color = "00000".substring(0,6 - c.length) + Std.string(c);
				_gthis.debug("initialized parentId=" + _gthis._parentId,null);
				resolve1(true);
				_gthis.sendRpc("SetupIframeServerResponseAck",{ });
				var _g2 = 0;
				var _g11 = Reflect.fields(_gthis._outputPipeValues);
				while(_g2 < _g11.length) {
					var pipeId = _g11[_g2];
					++_g2;
					_gthis.sendRpc("OutputUpdate",{ name : pipeId, value : _gthis._outputPipeValues[pipeId]});
				}
			} else {
				_gthis.debug("Got JsonRpcMethods.SetupIframeServerResponse but already resolved",{ fileName : "Metaframe.hx", lineNumber : 95, className : "metapage.Metaframe", methodName : "new"});
			}
		});
		_gthis.sendRpc("SetupIframeClientRequest",{ });
	});
};
metapage_Metaframe.__name__ = true;
metapage_Metaframe.isIframe = function() {
	try {
		return ((window) !== window.top);
	} catch( ignored ) {
		return false;
	}
};
metapage_Metaframe.generateId = function(length) {
	if(length == null) {
		length = 8;
	}
	var s_b = "";
	while(length > 0) {
		s_b += Std.string(metapage_Metaframe.LETTERS.charAt(Math.max(0,Math.random() * metapage_Metaframe.LETTERS.length - 1) | 0));
		--length;
	}
	return s_b;
};
metapage_Metaframe.showBanner = function() {
	var document = window.document;
	var span = document.createElement("span");
	span.id = "metapagebanner";
	span.innerHTML = "<a href=\"https://https://github.com/dionjwa/metapage\">Metapage Enabled</a>";
	document.body.insertBefore(span,document.body.firstChild);
	var style = document.createElement("style");
	style.innerHTML = metapage_Metaframe.BANNER_STYLE_TEXT;
	document.body.insertBefore(style,document.body.firstChild);
};
metapage_Metaframe.__super__ = metapage_EventEmitter;
metapage_Metaframe.prototype = $extend(metapage_EventEmitter.prototype,{
	debug: function(o,pos) {
		if(this._debug) {
			this.log(o,null,null,pos);
		}
	}
	,log: function(o,color,backgroundColor,pos) {
		var s;
		var _g = typeof(o);
		switch(_g) {
		case "number":
			s = Std.string(o) + "";
			break;
		case "string":
			s = o;
			break;
		default:
			s = JSON.stringify(o);
		}
		if(color != null) {
			color += "";
		} else {
			color = this._color;
		}
		s = (this._iframeId != null?"Metaframe[" + this._iframeId + "] ":"") + (s == null?"null":"" + s);
		var color1 = color;
		if(color1 != null) {
			color1 = color1;
		} else {
			color1 = "000";
		}
		if(color1 != null && StringTools.trim(color1) == "") {
			color1 = null;
		}
		var s1;
		var _g1 = typeof(s);
		switch(_g1) {
		case "number":
			s1 = (s == null?"null":"" + s) + "";
			break;
		case "string":
			s1 = s;
			break;
		default:
			s1 = JSON.stringify(s);
		}
		var posString = pos == null?"":"" + pos.fileName + ":" + pos.lineNumber + " ";
		s1 = posString + s1;
		if(color1 != null && StringTools.trim(color1) != "") {
			var cssString = "color: #" + color1;
			if(backgroundColor != null) {
				cssString = "" + cssString + "; background: #" + backgroundColor;
			}
			s1 = "%c" + s1;
			window.console.log(s1,cssString);
		} else {
			window.console.log(s1);
		}
	}
	,warn: function(o,pos) {
		if(!this._debug) {
			return;
		} else {
			this.log(o,"000",this._color,pos);
		}
	}
	,error: function(err,pos) {
		this.log(err,this._color,"f00",pos);
	}
	,dispose: function() {
		metapage_EventEmitter.prototype.dispose.call(this);
		window.removeEventListener("message",$bind(this,this.onWindowMessage));
		this._inputPipeValues = null;
		this._outputPipeValues = null;
	}
	,addEventListener: function(event,listener) {
		var _gthis = this;
		var disposer = metapage_EventEmitter.prototype.addEventListener.call(this,event,listener);
		if(event == "input") {
			window.setTimeout(function() {
				for (key in _gthis._inputPipeValues) { listener.apply(null, key, _gthis._inputPipeValues[key]); }
			},0);
		} else if(event == "output") {
			window.setTimeout(function() {
				for (key in _gthis._outputPipeValues) { listener.apply(null, key, _gthis._outputPipeValues[key]); }
			},0);
		}
		return disposer;
	}
	,onInput: function(pipe,listener) {
		return this.addEventListener("input",function(pipeId,value) {
			if(pipe == pipeId) {
				listener(value);
			}
		});
	}
	,onInputs: function(listener) {
		return this.addEventListener("inputs",listener);
	}
	,onOutput: function(pipe,listener) {
		return this.addEventListener("output",function(pipeId,value) {
			if(pipe == pipeId) {
				listener(value);
			}
		});
	}
	,getInput: function(pipeId) {
		return this._inputPipeValues[pipeId];
	}
	,setInput: function(pipeId,pipeValue) {
		var _gthis = this;
		this._inputPipeValues[pipeId] = pipeValue;
		this.sendRpc("InputUpdate",{ name : pipeId, value : pipeValue});
		this.emit("input",pipeId,pipeValue);
		this.emit("inputs",Reflect.fields(this._inputPipeValues).map(function(key) {
			return { name : key, value : _gthis._inputPipeValues[key]};
		}));
	}
	,setInputs: function(inputs) {
		var _gthis = this;
		var _g = 0;
		while(_g < inputs.length) {
			var input = inputs[_g];
			++_g;
			this._inputPipeValues[input.name] = input.value;
		}
		this.emit("inputs",Reflect.fields(this._inputPipeValues).map(function(key) {
			return { name : key, value : _gthis._inputPipeValues[key]};
		}));
		var _g1 = 0;
		while(_g1 < inputs.length) {
			var input1 = inputs[_g1];
			++_g1;
			this.emit("input",input1.name,input1.value);
		}
	}
	,getInputs: function() {
		var inputs = { };
		var _g = 0;
		var _g1 = Reflect.fields(this._inputPipeValues);
		while(_g < _g1.length) {
			var key = _g1[_g];
			++_g;
			inputs[key] = this._inputPipeValues[key];
		}
		return inputs;
	}
	,getOutput: function(pipeId) {
		return this._outputPipeValues[pipeId];
	}
	,setOutput: function(pipeId,pipeValue) {
		this._outputPipeValues[pipeId] = pipeValue;
		this.sendRpc("OutputUpdate",{ name : pipeId, value : pipeValue});
		this.emit("output",pipeId,pipeValue);
	}
	,setOutputs: function(outputs) {
		var _g = 0;
		while(_g < outputs.length) {
			var output = outputs[_g];
			++_g;
			this._outputPipeValues[output.name] = output.value;
		}
		this.sendRpc("OutputsUpdate",outputs);
		var _g1 = 0;
		while(_g1 < outputs.length) {
			var output1 = outputs[_g1];
			++_g1;
			this.emit("output",output1.name,output1.value);
		}
	}
	,getOutputs: function() {
		var outputs = { };
		var _g = 0;
		var _g1 = Reflect.fields(this._outputPipeValues);
		while(_g < _g1.length) {
			var key = _g1[_g];
			++_g;
			outputs[key] = this._outputPipeValues[key];
		}
		return outputs;
	}
	,sendRpc: function(method,params) {
		if(this._isIframe) {
			var message = { origin : null, jsonrpc : "2.0", method : method, params : params, iframeId : this._iframeId, parentId : this._parentId};
			this.debug("Sending message=" + HxOverrides.substr(JSON.stringify(message),0,200),{ fileName : "Metaframe.hx", lineNumber : 269, className : "metapage.Metaframe", methodName : "sendRpc"});
			window.parent.postMessage(message,"*");
		} else {
			this.error("Cannot send JSON-RPC window message: there is no window.parent which means we are not an iframe",{ fileName : "Metaframe.hx", lineNumber : 272, className : "metapage.Metaframe", methodName : "sendRpc"});
		}
	}
	,onWindowMessage: function(e) {
		if(typeof e.data === "object") {
			var jsonrpc = e.data;
			if(jsonrpc.jsonrpc == "2.0") {
				var method = jsonrpc.method;
				if(!(method == "SetupIframeServerResponse" || jsonrpc.parentId == this._parentId && jsonrpc.iframeId == this._iframeId)) {
					this.error("Received message but jsonrpc.parentId=" + jsonrpc.parentId + " _parentId=" + this._parentId + " jsonrpc.iframeId=" + jsonrpc.iframeId + " _iframeId=" + this._iframeId,{ fileName : "Metaframe.hx", lineNumber : 285, className : "metapage.Metaframe", methodName : "onWindowMessage"});
					return;
				}
				switch(method) {
				case "InputUpdate":
					this.internalOnInput(jsonrpc.params);
					break;
				case "InputsUpdate":
					this.setInputs(jsonrpc.params.inputs);
					break;
				case "SetupIframeServerResponse":
					break;
				}
				this.emit(jsonrpc.method,jsonrpc.params);
				this.emit("message",jsonrpc);
			} else {
				this.log("!Bad JsonRPC version=" + jsonrpc.jsonrpc,null,null,{ fileName : "Metaframe.hx", lineNumber : 299, className : "metapage.Metaframe", methodName : "onWindowMessage"});
			}
		} else {
			this.log("!message is not an object",null,null,{ fileName : "Metaframe.hx", lineNumber : 302, className : "metapage.Metaframe", methodName : "onWindowMessage"});
		}
	}
	,internalOnInput: function(input) {
		this.debug("InputUpdate from registed RPC pipeId=" + input.name + " value=" + HxOverrides.substr(JSON.stringify(input.value),0,200),{ fileName : "Metaframe.hx", lineNumber : 308, className : "metapage.Metaframe", methodName : "internalOnInput"});
		var pipeId = input != null?input.name:null;
		var pipeValue = input != null?input.value:null;
		if(pipeId == null) {
			this.error("Missing \"id\" value in the params object to identify the pipe. input=" + Std.string(input),{ fileName : "Metaframe.hx", lineNumber : 312, className : "metapage.Metaframe", methodName : "internalOnInput"});
		} else {
			this.debug("Setting input value from InputPipeUpdate pipeId=" + pipeId,{ fileName : "Metaframe.hx", lineNumber : 314, className : "metapage.Metaframe", methodName : "internalOnInput"});
			this.setInput(pipeId,pipeValue);
		}
	}
	,internalOnInputs: function(inputs) {
		this.debug("InputUpdates from registed RPC inputs=" + HxOverrides.substr(JSON.stringify(inputs),0,200),{ fileName : "Metaframe.hx", lineNumber : 321, className : "metapage.Metaframe", methodName : "internalOnInputs"});
	}
	,sendDimensions: function(dimensions) {
		var $window = window;
		if(dimensions == null) {
			var height = $window.document.documentElement.scrollHeight != null?$window.document.documentElement.scrollHeight:$window.document.body.scrollHeight;
			dimensions = { width : null, height : height, 'window.innerWidth' : $window.innerWidth, 'window.innerHeight' : $window.innerHeight, 'window.document.body.scrollHeight' : $window.document.body.scrollHeight, 'window.document.documentElement.scrollHeight' : $window.document.documentElement.scrollHeight};
		} else if(typeof(dimensions) != "object") {
			throw new js__$Boot_HaxeError({ dimensions : dimensions, error : "sendDimensions(..) expecting {width:Float, height:Float}"});
		} else if(!(Object.prototype.hasOwnProperty.call(dimensions,"width") && Object.prototype.hasOwnProperty.call(dimensions,"height"))) {
			throw new js__$Boot_HaxeError({ dimensions : dimensions, error : "sendDimensions(..) missing either width or height field, expecting: {width:Float, height:Float}"});
		}
		this.sendRpc("Dimensions",dimensions);
	}
});
var metapage_MetapageTools = function() { };
metapage_MetapageTools.__name__ = true;
metapage_MetapageTools.log = function(o,color,backgroundColor,pos) {
	if(color != null) {
		color = color;
	} else {
		color = "000";
	}
	if(color != null && StringTools.trim(color) == "") {
		color = null;
	}
	var s;
	var _g = typeof(o);
	switch(_g) {
	case "number":
		s = Std.string(o) + "";
		break;
	case "string":
		s = o;
		break;
	default:
		s = JSON.stringify(o);
	}
	var posString = pos == null?"":"" + pos.fileName + ":" + pos.lineNumber + " ";
	s = posString + s;
	if(color != null && StringTools.trim(color) != "") {
		var cssString = "color: #" + color;
		if(backgroundColor != null) {
			cssString = "" + cssString + "; background: #" + backgroundColor;
		}
		s = "%c" + s;
		window.console.log(s,cssString);
	} else {
		window.console.log(s);
	}
};
metapage_MetapageTools.stringToRgb = function(str) {
	var hash = 0;
	var _g1 = 0;
	var _g = str.length;
	while(_g1 < _g) hash = HxOverrides.cca(str,_g1++) + ((hash << 5) - hash);
	var c = (hash & 16777215).toString(16).toUpperCase();
	return "00000".substring(0,6 - c.length) + Std.string(c);
};
metapage_MetapageTools.hashCode = function(str) {
	var hash = 0;
	var _g1 = 0;
	var _g = str.length;
	while(_g1 < _g) hash = HxOverrides.cca(str,_g1++) + ((hash << 5) - hash);
	return hash;
};
metapage_MetapageTools.intToRGB = function(i) {
	var c = (i & 16777215).toString(16).toUpperCase();
	return "00000".substring(0,6 - c.length) + Std.string(c);
};
var $_, $fid = 0;
function $bind(o,m) { if( m == null ) return null; if( m.__id__ == null ) m.__id__ = $fid++; var f; if( o.hx__closures__ == null ) o.hx__closures__ = {}; else f = o.hx__closures__[m.__id__]; if( f == null ) { f = function(){ return f.method.apply(f.scope, arguments); }; f.scope = o; f.method = m; o.hx__closures__[m.__id__] = f; } return f; }
String.__name__ = true;
Array.__name__ = true;
haxe_remoting_JsonRpcConstants.JSONRPC_VERSION_2 = "2.0";
haxe_remoting_JsonRpcConstants.MULTIPART_JSONRPC_KEY = "jsonrpc";
haxe_remoting_JsonRpcConstants.JSONRPC_NULL_ID = "_";
metapage_Metaframe.LETTERS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_";
metapage_Metaframe.BANNER_STYLE_TEXT = "#metapagebanner a{background:#3cf;color:#fff;text-decoration:none;font-family:arial,sans-serif;text-align:center;font-weight:bold;padding:5px 40px;font-size:1rem;line-height:2rem;position:relative;transition:0.5s;}#metapagebanner a:hover{background:#3cf;color:#fff;}#metapagebanner a::before,#metapagebanner a::after{content:\"\";width:100%;display:block;position:absolute;top:1px;left:0;height:1px;background:#fff;}#metapagebanner a::after{bottom:1px;top:auto;}@media screen and (min-width:800px){#metapagebanner{position:fixed;display:block;top:0;right:0;width:200px;overflow:hidden;height:200px;z-index:9999;}#metapagebanner a{width:200px;position:absolute;top:60px;right:-60px;transform:rotate(45deg);-webkit-transform:rotate(45deg);-ms-transform:rotate(45deg);-moz-transform:rotate(45deg);-o-transform:rotate(45deg);box-shadow:4px 4px 10px rgba(0,0,0,0.8);}}";
})(typeof exports != "undefined" ? exports : typeof window != "undefined" ? window : typeof self != "undefined" ? self : this);

//# sourceMappingURL=metaframe.js.map