// Generated by Haxe 3.4.4
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
HxOverrides.iter = function(a) {
	return { cur : 0, arr : a, hasNext : function() {
		return this.cur < this.arr.length;
	}, next : function() {
		return this.arr[this.cur++];
	}};
};
Math.__name__ = true;
var Reflect = function() { };
Reflect.__name__ = true;
Reflect.field = function(o,field) {
	try {
		return o[field];
	} catch( e ) {
		return null;
	}
};
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
Reflect.deleteField = function(o,field) {
	if(!Object.prototype.hasOwnProperty.call(o,field)) {
		return false;
	}
	delete(o[field]);
	return true;
};
Reflect.copy = function(o) {
	var o2 = { };
	var _g = 0;
	var _g1 = Reflect.fields(o);
	while(_g < _g1.length) {
		var f = _g1[_g];
		++_g;
		o2[f] = Reflect.field(o,f);
	}
	return o2;
};
var Std = function() { };
Std.__name__ = true;
Std.string = function(s) {
	return js_Boot.__string_rec(s,"");
};
var StringTools = function() { };
StringTools.__name__ = true;
StringTools.startsWith = function(s,start) {
	if(s.length >= start.length) {
		return HxOverrides.substr(s,0,start.length) == start;
	} else {
		return false;
	}
};
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
				str1 += (i2 > 0 ? "," : "") + js_Boot.__string_rec(o[i2],s);
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
var metapage__$MetaframeId_MetaframeId_$Impl_$ = {};
metapage__$MetaframeId_MetaframeId_$Impl_$.__name__ = true;
metapage__$MetaframeId_MetaframeId_$Impl_$._new = function(s) {
	var this1 = s;
	return this1;
};
var metapage__$MetaframePipeId_MetaframePipeId_$Impl_$ = {};
metapage__$MetaframePipeId_MetaframePipeId_$Impl_$.__name__ = true;
metapage__$MetaframePipeId_MetaframePipeId_$Impl_$._new = function(s) {
	var this1 = s;
	return this1;
};
var metapage__$MetapageId_MetapageId_$Impl_$ = {};
metapage__$MetapageId_MetapageId_$Impl_$.__name__ = true;
metapage__$MetapageId_MetapageId_$Impl_$._new = function(s) {
	var this1 = s;
	return this1;
};
var metapage_client_library_Assert = function() { };
metapage_client_library_Assert.__name__ = true;
var metapage_client_library_AssertionFailure = function(message,parts) {
	this.message = message;
	this.parts = parts;
};
metapage_client_library_AssertionFailure.__name__ = true;
metapage_client_library_AssertionFailure.prototype = {
	toString: function() {
		var buf_b = "";
		buf_b += Std.string("Assertion failure: " + this.message);
		var _g = 0;
		var _g1 = this.parts;
		while(_g < _g1.length) {
			var part = _g1[_g];
			++_g;
			buf_b += Std.string("\n\t" + part.expr + ": " + Std.string(part.value));
		}
		return buf_b;
	}
};
var metapage_client_library_EventEmitter = function() {
	this._events = { };
};
metapage_client_library_EventEmitter.__name__ = true;
metapage_client_library_EventEmitter.prototype = {
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
var metapage_client_library_Metapage = $hx_exports["Metapage"] = function(opts) {
	this._debug = false;
	this._iframes = { };
	this._outputPipeMap = { };
	metapage_client_library_EventEmitter.call(this);
	this._id = metapage_client_library_Metapage.generateId();
	this._debug = opts != null && opts.debug == true;
	this._consoleBackgroundColor = opts != null && opts.color != null ? opts.color : metapage_client_library_Metapage.CONSOLE_BACKGROUND_COLOR_DEFAULT;
	window.addEventListener("message",$bind(this,this.onMessage));
	this.log("Initialized",null,null,{ fileName : "Metapage.hx", lineNumber : 48, className : "metapage.client.library.Metapage", methodName : "new"});
};
metapage_client_library_Metapage.__name__ = true;
metapage_client_library_Metapage.fromDefinition = function(metaPageDef) {
	var metapage1 = new metapage_client_library_Metapage(metaPageDef.options);
	if(metaPageDef.iframes != null) {
		var _g = 0;
		var _g1 = Reflect.fields(metaPageDef.iframes);
		while(_g < _g1.length) {
			var iframeId = _g1[_g];
			++_g;
			var iframeDef = metaPageDef.iframes[iframeId];
			var iframe = metapage1.createIFrame(iframeDef.url,iframeId);
			if(Reflect.field(iframeDef,"in") != null) {
				var inPipes = Reflect.field(iframeDef,"in");
				var _g2 = 0;
				var _g3 = Reflect.fields(inPipes);
				while(_g2 < _g3.length) {
					var inPipeName = _g3[_g2];
					++_g2;
					iframe.setInput(inPipeName,inPipes[inPipeName].value);
				}
			}
		}
	}
	if(metaPageDef.pipes != null) {
		var _g4 = 0;
		var _g11 = metaPageDef.pipes;
		while(_g4 < _g11.length) {
			var pipeDef = _g11[_g4];
			++_g4;
			metapage1.pipe(pipeDef);
		}
	}
	return metapage1;
};
metapage_client_library_Metapage.generateId = function(length) {
	if(length == null) {
		length = 8;
	}
	var s_b = "";
	while(length > 0) {
		s_b += Std.string(metapage_client_library_Metapage.LETTERS.charAt(Math.max(0,Math.random() * metapage_client_library_Metapage.LETTERS.length - 1) | 0));
		--length;
	}
	return s_b;
};
metapage_client_library_Metapage.__super__ = metapage_client_library_EventEmitter;
metapage_client_library_Metapage.prototype = $extend(metapage_client_library_EventEmitter.prototype,{
	removeAll: function() {
		var _g = 0;
		var _g1 = Reflect.fields(this._iframes);
		while(_g < _g1.length) {
			var id = _g1[_g];
			++_g;
			this._iframes[id].dispose();
		}
		this._outputPipeMap = { };
		this._iframes = { };
	}
	,get_iframes: function() {
		var all = { };
		var _g = 0;
		var _g1 = Reflect.fields(this._iframes);
		while(_g < _g1.length) {
			var key = _g1[_g];
			++_g;
			all[key] = this._iframes[key].iframe;
		}
		return all;
	}
	,createIFrame: function(url,iframeId) {
		if(iframeId != null) {
			iframeId = iframeId;
		} else {
			iframeId = metapage_client_library_Metapage.generateId();
		}
		var iframeClient = new metapage_client_library_IFrameRpcClient(url,iframeId,this._id,this._consoleBackgroundColor,this._debug);
		iframeClient._metapage = this;
		this._iframes[iframeId] = iframeClient;
		return iframeClient;
	}
	,pipe: function(pipe) {
		if(!Object.prototype.hasOwnProperty.call(this._outputPipeMap,pipe.from.id)) {
			this._outputPipeMap[pipe.from.id] = { };
		}
		if(!Object.prototype.hasOwnProperty.call(this._outputPipeMap[pipe.from.id],pipe.from.pipe)) {
			this._outputPipeMap[pipe.from.id][pipe.from.pipe] = [];
		}
		this._outputPipeMap[pipe.from.id][pipe.from.pipe].push(pipe.to);
	}
	,setInput: function(iframeId,inputPipeId,value) {
		var iframeClient = this._iframes[iframeId];
		if(iframeClient != null) {
			iframeClient.setInput(inputPipeId,value);
		} else {
			this.log("No iframe id=" + iframeId,"f00",this._consoleBackgroundColor,{ fileName : "Metapage.hx", lineNumber : 95, className : "metapage.client.library.Metapage", methodName : "setInput"});
		}
	}
	,dispose: function() {
		metapage_client_library_EventEmitter.prototype.dispose.call(this);
		window.removeEventListener("message",$bind(this,this.onMessage));
		var _g = 0;
		var _g1 = Reflect.fields(this._iframes);
		while(_g < _g1.length) {
			var iframeId = _g1[_g];
			++_g;
			this._iframes[iframeId].dispose();
		}
		this._iframes = null;
		this._outputPipeMap = null;
	}
	,isValidJsonRpcMessage: function(message) {
		if(message.jsonrpc != "2.0") {
			this.log("message.jsonrpc != '2.0'","f00",this._consoleBackgroundColor,{ fileName : "Metapage.hx", lineNumber : 113, className : "metapage.client.library.Metapage", methodName : "isValidJsonRpcMessage"});
			return false;
		}
		var method = message.method;
		if(method == "SetupIframeClientRequest") {
			return true;
		} else {
			if(!(message.parentId == this._id && Object.prototype.hasOwnProperty.call(this._iframes,message.iframeId))) {
				this.log("message.parentId=" + message.parentId + " _id=" + this._id + " message.iframeId=" + message.iframeId + " _iframes.exists(message.iframeId)=" + Std.string(Object.prototype.hasOwnProperty.call(this._iframes,message.iframeId)) + " message=" + HxOverrides.substr(JSON.stringify(message),0,200),"f00",this._consoleBackgroundColor,{ fileName : "Metapage.hx", lineNumber : 124, className : "metapage.client.library.Metapage", methodName : "isValidJsonRpcMessage"});
			}
			if(message.parentId == this._id) {
				return Object.prototype.hasOwnProperty.call(this._iframes,message.iframeId);
			} else {
				return false;
			}
		}
	}
	,onMessage: function(e) {
		this.debug(HxOverrides.substr(Std.string(e.data),0,200),null,null,{ fileName : "Metapage.hx", lineNumber : 132, className : "metapage.client.library.Metapage", methodName : "onMessage"});
		if(typeof e.data === "object") {
			var jsonrpc = e.data;
			if(!this.isValidJsonRpcMessage(jsonrpc)) {
				this.log("invalid message " + HxOverrides.substr(JSON.stringify(jsonrpc),0,200),"f00",this._consoleBackgroundColor,{ fileName : "Metapage.hx", lineNumber : 136, className : "metapage.client.library.Metapage", methodName : "onMessage"});
				return;
			}
			var origin = e.origin;
			var source = e.source;
			var method = jsonrpc.method;
			switch(method) {
			case "Dimensions":
				this.debug("" + jsonrpc.iframeId + " Dimensions " + HxOverrides.substr(JSON.stringify(jsonrpc.params),0,200),null,null,{ fileName : "Metapage.hx", lineNumber : 261, className : "metapage.client.library.Metapage", methodName : "onMessage"});
				var dimensions = jsonrpc.params;
				this.debug("" + jsonrpc.iframeId + " Dimensions " + Std.string(dimensions),null,null,{ fileName : "Metapage.hx", lineNumber : 263, className : "metapage.client.library.Metapage", methodName : "onMessage"});
				var iframe = this._iframes[jsonrpc.iframeId];
				if(iframe != null) {
					if(dimensions.height != null) {
						iframe.iframe.height = "" + dimensions.height + "px";
					}
					if(dimensions.width != null) {
						iframe.iframe.width = "" + dimensions.width + "px";
					}
				}
				break;
			case "OutputUpdate":
				var outputBlob = jsonrpc.params;
				var _tmp0 = outputBlob;
				var _tmp1 = _tmp0 != null;
				if(!_tmp1) {
					throw new js__$Boot_HaxeError(new metapage_client_library_AssertionFailure("outputBlob != null",[{ expr : "outputBlob", value : _tmp0},{ expr : "outputBlob != null", value : _tmp1}]));
				}
				var _tmp01 = outputBlob;
				var _tmp11 = _tmp01.name;
				var _tmp2 = _tmp11 != null;
				if(!_tmp2) {
					throw new js__$Boot_HaxeError(new metapage_client_library_AssertionFailure("outputBlob.name != null",[{ expr : "outputBlob", value : _tmp01},{ expr : "outputBlob.name", value : _tmp11},{ expr : "outputBlob.name != null", value : _tmp2}]));
				}
				var dataBlob = { value : outputBlob.value, type : outputBlob.type == null ? undefined : outputBlob.type, source : outputBlob.source, encoding : outputBlob.encoding};
				var pipeId = outputBlob.name;
				var iframeId = jsonrpc.iframeId;
				var iframe1 = this._iframes[iframeId];
				iframe1.debug("OutputPipeUpdate from=" + iframeId + " pipeId=" + outputBlob.name + " params=" + HxOverrides.substr(JSON.stringify(jsonrpc.params),0,200),{ fileName : "Metapage.hx", lineNumber : 182, className : "metapage.client.library.Metapage", methodName : "onMessage"});
				if(iframe1 != null) {
					iframe1.setOutput(outputBlob);
					if(Object.prototype.hasOwnProperty.call(this._outputPipeMap,iframeId)) {
						if(Object.prototype.hasOwnProperty.call(this._outputPipeMap[iframeId],pipeId)) {
							var inputPipes = this._outputPipeMap[iframeId][pipeId];
							if(inputPipes != null) {
								var _g = 0;
								while(_g < inputPipes.length) {
									var inputPipe = inputPipes[_g];
									++_g;
									var inputIframe = this._iframes[inputPipe.id];
									if(inputIframe != null) {
										iframe1.debug("Sending from " + iframeId + "." + pipeId + " to " + inputPipe.id + "." + inputPipe.pipe,{ fileName : "Metapage.hx", lineNumber : 196, className : "metapage.client.library.Metapage", methodName : "onMessage"});
										inputIframe.setInput(inputPipe.pipe,dataBlob);
									}
								}
							}
						} else {
							this.log("OutputPipeUpdate _outputPipeMap.get(" + iframeId + ").get(" + pipeId + ") is null","f00",this._consoleBackgroundColor,{ fileName : "Metapage.hx", lineNumber : 202, className : "metapage.client.library.Metapage", methodName : "onMessage"});
						}
					}
				} else {
					this.log("missing iframe=" + iframeId,"f00",this._consoleBackgroundColor,{ fileName : "Metapage.hx", lineNumber : 208, className : "metapage.client.library.Metapage", methodName : "onMessage"});
				}
				break;
			case "OutputsUpdate":
				var iframeId1 = jsonrpc.iframeId;
				var iframe2 = this._iframes[iframeId1];
				var outputs = jsonrpc.params;
				iframe2.debug("OutputsUpdate from=" + iframeId1 + " outputs=" + HxOverrides.substr(JSON.stringify(jsonrpc.params),0,200),{ fileName : "Metapage.hx", lineNumber : 215, className : "metapage.client.library.Metapage", methodName : "onMessage"});
				if(iframe2 != null) {
					iframe2.setOutputs(outputs);
					if(Object.prototype.hasOwnProperty.call(this._outputPipeMap,iframeId1)) {
						var iframeToInputs = { };
						var _g1 = 0;
						while(_g1 < outputs.length) {
							var output = outputs[_g1];
							++_g1;
							var outputName = output.name;
							if(Object.prototype.hasOwnProperty.call(this._outputPipeMap[iframeId1],outputName)) {
								var inputPipes1 = this._outputPipeMap[iframeId1][outputName];
								if(inputPipes1 != null) {
									var _g11 = 0;
									while(_g11 < inputPipes1.length) {
										var inputPipe1 = inputPipes1[_g11];
										++_g11;
										var inputIframe1 = this._iframes[inputPipe1.id];
										if(inputIframe1 != null) {
											iframe2.debug("Sending from " + iframeId1 + "." + outputName + " to " + inputPipe1.id + "." + inputPipe1.pipe,{ fileName : "Metapage.hx", lineNumber : 231, className : "metapage.client.library.Metapage", methodName : "onMessage"});
											if(iframeToInputs[inputPipe1.id] == null) {
												iframeToInputs[inputPipe1.id] = [];
											}
											var thisOutputBlob = Reflect.copy(output);
											thisOutputBlob.name = inputPipe1.id;
											iframeToInputs[inputPipe1.id].push(thisOutputBlob);
										}
									}
								}
							} else {
								this.log("OutputsUpdate _outputPipeMap.get(" + iframeId1 + ").get(" + outputName + ") is null","f00",this._consoleBackgroundColor,{ fileName : "Metapage.hx", lineNumber : 243, className : "metapage.client.library.Metapage", methodName : "onMessage"});
							}
						}
						var _g2 = 0;
						var _g12 = Reflect.fields(iframeToInputs);
						while(_g2 < _g12.length) {
							var iframeId2 = _g12[_g2];
							++_g2;
							this._iframes[iframeId2].setInputs(iframeToInputs[iframeId2]);
						}
					}
				} else {
					this.log("missing iframe=" + iframeId1,"f00",this._consoleBackgroundColor,{ fileName : "Metapage.hx", lineNumber : 253, className : "metapage.client.library.Metapage", methodName : "onMessage"});
				}
				break;
			case "SetupIframeClientRequest":
				var _g3 = 0;
				var _g13 = Reflect.fields(this._iframes);
				while(_g3 < _g13.length) {
					var iframeId3 = _g13[_g3];
					++_g3;
					var iframeClient = this._iframes[iframeId3];
					iframeClient.register();
				}
				break;
			case "SetupIframeServerResponseAck":
				var params = jsonrpc.params;
				var iframe3 = this._iframes[jsonrpc.iframeId];
				iframe3.registered();
				break;
			}
			this.emit("Message",jsonrpc);
		}
	}
	,debug: function(o,color,backgroundColor,pos) {
		if(!this._debug) {
			return;
		}
		this.log(o,color,backgroundColor,pos);
	}
	,log: function(o,color,backgroundColor,pos) {
		if(!this._debug) {
			return;
		}
		if(backgroundColor != null) {
			backgroundColor = backgroundColor;
		} else {
			backgroundColor = this._consoleBackgroundColor;
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
		if(this._id != null) {
			s = "Metapage[" + this._id + "] " + s;
		} else {
			s = s;
		}
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
			s1 = (s == null ? "null" : "" + s) + "";
			break;
		case "string":
			s1 = s;
			break;
		default:
			s1 = JSON.stringify(s);
		}
		var posString = pos == null ? "" : "" + pos.fileName + ":" + pos.lineNumber + " ";
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
	,error: function(err,pos) {
		this.log(err,"f00",this._consoleBackgroundColor,pos);
	}
});
var metapage_client_library_IFrameRpcClient = function(url,iframeId,parentId,consoleBackgroundColor,debug) {
	if(debug == null) {
		debug = false;
	}
	this._onOutput = [];
	this._onLoaded = [];
	this._loaded = false;
	this._rpcListeners = [];
	this._disposables = [];
	this._outputs = { };
	this._inputs = { };
	if(!StringTools.startsWith(url,"http")) {
		while(StringTools.startsWith(url,"/")) url = HxOverrides.substr(url,1,null);
		var location = window.location;
		url = location.protocol + "//" + location.hostname + (location.port != null && location.port != "" ? ":" + location.port : "") + "/" + url;
	}
	this.id = iframeId;
	this.iframe = window.document.createElement("iframe");
	this.iframe.scrolling = "no";
	this.iframe.src = url;
	this._debug = debug;
	this._parentId = parentId;
	var str = this.id;
	var hash = 0;
	var _g1 = 0;
	var _g = str.length;
	while(_g1 < _g) {
		var i = _g1++;
		hash = HxOverrides.cca(str,i) + ((hash << 5) - hash);
	}
	var c = (hash & 16777215).toString(16).toUpperCase();
	this._color = "00000".substring(0,6 - c.length) + Std.string(c);
	this._consoleBackgroundColor = consoleBackgroundColor;
};
metapage_client_library_IFrameRpcClient.__name__ = true;
metapage_client_library_IFrameRpcClient.prototype = {
	log: function(o,pos) {
		if(!this._debug) {
			return;
		}
		console.log(typeof(o));
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
		var o1 = "Metapage[" + this._parentId + "] Metaframe[" + this.id + "] " + s;
		var color = this._color;
		var backgroundColor = this._consoleBackgroundColor;
		if(color != null) {
			color = color;
		} else {
			color = "000";
		}
		if(color != null && StringTools.trim(color) == "") {
			color = null;
		}
		var s1;
		var _g1 = typeof(o1);
		switch(_g1) {
		case "number":
			s1 = Std.string(o1) + "";
			break;
		case "string":
			s1 = o1;
			break;
		default:
			s1 = JSON.stringify(o1);
		}
		var posString = pos == null ? "" : "" + pos.fileName + ":" + pos.lineNumber + " ";
		s1 = posString + s1;
		if(color != null && StringTools.trim(color) != "") {
			var cssString = "color: #" + color;
			if(backgroundColor != null) {
				cssString = "" + cssString + "; background: #" + backgroundColor;
			}
			s1 = "%c" + s1;
			window.console.log(s1,cssString);
		} else {
			window.console.log(s1);
		}
	}
	,debug: function(o,pos) {
		if(this._metapage._debug) {
			this.log(o,pos);
		}
	}
	,sendAllInputs: function() {
		var tmp = Reflect.fields(this._inputs);
		var _e = this._inputs;
		this.sendInputs(tmp.map(function(key) {
			return _e[key];
		}));
	}
	,setInput: function(name,inputBlob) {
		var _tmp0 = inputBlob;
		var _tmp1 = _tmp0 != null;
		if(!_tmp1) {
			throw new js__$Boot_HaxeError(new metapage_client_library_AssertionFailure("inputBlob != null",[{ expr : "inputBlob", value : _tmp0},{ expr : "inputBlob != null", value : _tmp1}]));
		}
		var _tmp01 = name;
		var _tmp11 = _tmp01 != null;
		if(!_tmp11) {
			throw new js__$Boot_HaxeError(new metapage_client_library_AssertionFailure("name != null",[{ expr : "name", value : _tmp01},{ expr : "name != null", value : _tmp11}]));
		}
		var pipeUpdateBlob = Reflect.copy(inputBlob);
		pipeUpdateBlob.name = name;
		this._inputs[name] = pipeUpdateBlob;
		if(this.iframe.parentNode != null && this._loaded) {
			this.sendInput(name);
		} else {
			this.debug("Not setting input bc _loaded=" + Std.string(this._loaded),{ fileName : "Metapage.hx", lineNumber : 397, className : "metapage.client.library.IFrameRpcClient", methodName : "setInput"});
		}
		var e = Reflect.copy(pipeUpdateBlob);
		var this1 = this.id;
		e.iframeId = this1;
		this._metapage.emit("InputUpdate",e);
	}
	,setInputs: function(inputs) {
		this.debug({ m : "IFrameRpcClient", inputs : inputs},{ fileName : "Metapage.hx", lineNumber : 406, className : "metapage.client.library.IFrameRpcClient", methodName : "setInputs"});
		var _g = 0;
		while(_g < inputs.length) {
			var input = inputs[_g];
			++_g;
			input["iframeId"] = this.id;
			this._inputs[input.name] = input;
		}
		if(this.iframe.parentNode != null && this._loaded) {
			this.sendInputs(inputs);
		} else {
			this.debug("Not setting input bc _loaded=" + Std.string(this._loaded),{ fileName : "Metapage.hx", lineNumber : 414, className : "metapage.client.library.IFrameRpcClient", methodName : "setInputs"});
		}
		this._metapage.emit("InputsUpdate",{ iframeId : this.id, inputs : inputs});
	}
	,setOutput: function(value) {
		this._outputs[value.name] = value;
		var e = Reflect.copy(value);
		var this1 = this.id;
		e.iframeId = this1;
		this._metapage.emit("OutputUpdate",e);
		var _g = 0;
		var _g1 = this._onOutput;
		while(_g < _g1.length) {
			var l = _g1[_g];
			++_g;
			if(l != null) {
				l(value.name,value);
			}
		}
	}
	,setOutputs: function(outputs) {
		var _g = 0;
		while(_g < outputs.length) {
			var output = outputs[_g];
			++_g;
			this.setOutput(output);
		}
		var e = { iframeId : this.id, outputs : outputs};
		this._metapage.emit("OutputsUpdate",e);
	}
	,sendRpc: function(method,params) {
		var _gthis = this;
		if(this.iframe.parentNode != null && this._loaded) {
			this.sendRpcInternal(method,params);
		} else {
			var _this = this._metapage;
			_this.log("sending rpc later","f00",_this._consoleBackgroundColor,{ fileName : "Metapage.hx", lineNumber : 446, className : "metapage.client.library.IFrameRpcClient", methodName : "sendRpc"});
			this._onLoaded.push(function() {
				_gthis.sendRpcInternal(method,params);
			});
		}
	}
	,onOutput: function(cb) {
		var _gthis = this;
		var index = this._onOutput.length;
		this._onOutput[index] = cb;
		return function() {
			_gthis._onOutput[index] = null;
		};
	}
	,dispose: function() {
		while(this._disposables != null && this._disposables.length > 0) (this._disposables.pop())();
		this._rpcListeners = null;
		this._inputs = null;
		this._outputs = null;
		this._ready = null;
		if(this.iframe != null && this.iframe.parentNode != null) {
			this.iframe.parentNode.removeChild(this.iframe);
		}
		this.iframe = null;
	}
	,register: function() {
		var response = { origin : null, iframeId : this.id, parentId : this._parentId};
		this.sendRpcInternal("SetupIframeServerResponse",response);
	}
	,registered: function() {
		this._loaded = true;
		while(this._onLoaded != null && this._onLoaded.length > 0) (this._onLoaded.pop())();
		var inputs = Reflect.fields(this._inputs);
		var _e = this._inputs;
		var inputs1 = inputs.map(function(key) {
			return _e[key];
		});
		this.sendInputs(inputs1);
		this.log("registered",{ fileName : "Metapage.hx", lineNumber : 496, className : "metapage.client.library.IFrameRpcClient", methodName : "registered"});
	}
	,sendInput: function(pipeId) {
		this.sendRpc("InputUpdate",this._inputs[pipeId]);
	}
	,sendInputs: function(inputs) {
		this.sendRpc("InputsUpdate",{ inputs : inputs, parentId : this._parentId});
	}
	,sendRpcInternal: function(method,params) {
		var messageJson = { "method" : method, "params" : params, "jsonrpc" : "2.0", parentId : this._parentId, iframeId : this.id};
		if(this.iframe != null) {
			this.debug("Sending to child iframe messageJson=" + HxOverrides.substr(JSON.stringify(messageJson),0,200),{ fileName : "Metapage.hx", lineNumber : 514, className : "metapage.client.library.IFrameRpcClient", methodName : "sendRpcInternal"});
			this.iframe.contentWindow.postMessage(messageJson,"*");
		} else {
			var _this = this._metapage;
			_this.log("Cannot send to child iframe messageJson=" + HxOverrides.substr(JSON.stringify(messageJson),0,200),"f00",_this._consoleBackgroundColor,{ fileName : "Metapage.hx", lineNumber : 517, className : "metapage.client.library.IFrameRpcClient", methodName : "sendRpcInternal"});
		}
	}
};
var metapage_client_library_MetapageTools = function() { };
metapage_client_library_MetapageTools.__name__ = true;
metapage_client_library_MetapageTools.toDatablob = function(blob) {
	var data = { value : blob.value};
	if(blob.type != null) {
		data.type = blob.type;
	}
	if(blob.source != null) {
		data.source = blob.source;
	}
	if(blob.encoding != null) {
		data.encoding = blob.encoding;
	}
	return data;
};
metapage_client_library_MetapageTools.log = function(o,color,backgroundColor,pos) {
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
	var posString = pos == null ? "" : "" + pos.fileName + ":" + pos.lineNumber + " ";
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
metapage_client_library_MetapageTools.stringToRgb = function(str) {
	var hash = 0;
	var _g1 = 0;
	var _g = str.length;
	while(_g1 < _g) {
		var i = _g1++;
		hash = HxOverrides.cca(str,i) + ((hash << 5) - hash);
	}
	var c = (hash & 16777215).toString(16).toUpperCase();
	return "00000".substring(0,6 - c.length) + Std.string(c);
};
metapage_client_library_MetapageTools.hashCode = function(str) {
	var hash = 0;
	var _g1 = 0;
	var _g = str.length;
	while(_g1 < _g) {
		var i = _g1++;
		hash = HxOverrides.cca(str,i) + ((hash << 5) - hash);
	}
	return hash;
};
metapage_client_library_MetapageTools.intToRGB = function(i) {
	var c = (i & 16777215).toString(16).toUpperCase();
	return "00000".substring(0,6 - c.length) + Std.string(c);
};
var util__$TypedDynamicAccess_TypedDynamicAccess_$Impl_$ = {};
util__$TypedDynamicAccess_TypedDynamicAccess_$Impl_$.__name__ = true;
util__$TypedDynamicAccess_TypedDynamicAccess_$Impl_$._new = function() {
	var this1 = { };
	return this1;
};
util__$TypedDynamicAccess_TypedDynamicAccess_$Impl_$.get = function(this1,key) {
	return this1[key];
};
util__$TypedDynamicAccess_TypedDynamicAccess_$Impl_$.set = function(this1,key,value) {
	return this1[key] = value;
};
util__$TypedDynamicAccess_TypedDynamicAccess_$Impl_$.exists = function(this1,key) {
	return Object.prototype.hasOwnProperty.call(this1,key);
};
util__$TypedDynamicAccess_TypedDynamicAccess_$Impl_$.remove = function(this1,key) {
	return Reflect.deleteField(this1,key);
};
util__$TypedDynamicAccess_TypedDynamicAccess_$Impl_$.keys = function(this1) {
	return Reflect.fields(this1);
};
var $_, $fid = 0;
function $bind(o,m) { if( m == null ) return null; if( m.__id__ == null ) m.__id__ = $fid++; var f; if( o.hx__closures__ == null ) o.hx__closures__ = {}; else f = o.hx__closures__[m.__id__]; if( f == null ) { f = function(){ return f.method.apply(f.scope, arguments); }; f.scope = o; f.method = m; o.hx__closures__[m.__id__] = f; } return f; }
String.__name__ = true;
Array.__name__ = true;
haxe_remoting_JsonRpcConstants.JSONRPC_VERSION_2 = "2.0";
haxe_remoting_JsonRpcConstants.MULTIPART_JSONRPC_KEY = "jsonrpc";
haxe_remoting_JsonRpcConstants.JSONRPC_NULL_ID = "_";
metapage_client_library_Metapage.CONSOLE_BACKGROUND_COLOR_DEFAULT = "bcbcbc";
metapage_client_library_Metapage.LETTERS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_";
})(typeof exports != "undefined" ? exports : typeof window != "undefined" ? window : typeof self != "undefined" ? self : this);

//# sourceMappingURL=metapage.js.map