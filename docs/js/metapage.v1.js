// Generated by Haxe 3.4.7
(function ($hx_exports) { "use strict";
function $extend(from, fields) {
	function Inherit() {} Inherit.prototype = from; var proto = new Inherit();
	for (var name in fields) proto[name] = fields[name];
	if( fields.toString !== Object.prototype.toString ) proto.toString = fields.toString;
	return proto;
}
var EReg = function(r,opt) {
	this.r = new RegExp(r,opt.split("u").join(""));
};
EReg.__name__ = true;
EReg.prototype = {
	match: function(s) {
		if(this.r.global) {
			this.r.lastIndex = 0;
		}
		this.r.m = this.r.exec(s);
		this.r.s = s;
		return this.r.m != null;
	}
	,matched: function(n) {
		if(this.r.m != null && n >= 0 && n < this.r.m.length) {
			return this.r.m[n];
		} else {
			throw new js__$Boot_HaxeError("EReg::matched");
		}
	}
};
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
Std.parseInt = function(x) {
	var v = parseInt(x,10);
	if(v == 0 && (HxOverrides.cca(x,1) == 120 || HxOverrides.cca(x,1) == 88)) {
		v = parseInt(x);
	}
	if(isNaN(v)) {
		return null;
	}
	return v;
};
var StringBuf = function() {
	this.b = "";
};
StringBuf.__name__ = true;
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
var haxe_StackItem = { __ename__ : true, __constructs__ : ["CFunction","Module","FilePos","Method","LocalFunction"] };
haxe_StackItem.CFunction = ["CFunction",0];
haxe_StackItem.CFunction.__enum__ = haxe_StackItem;
haxe_StackItem.Module = function(m) { var $x = ["Module",1,m]; $x.__enum__ = haxe_StackItem; return $x; };
haxe_StackItem.FilePos = function(s,file,line) { var $x = ["FilePos",2,s,file,line]; $x.__enum__ = haxe_StackItem; return $x; };
haxe_StackItem.Method = function(classname,method) { var $x = ["Method",3,classname,method]; $x.__enum__ = haxe_StackItem; return $x; };
haxe_StackItem.LocalFunction = function(v) { var $x = ["LocalFunction",4,v]; $x.__enum__ = haxe_StackItem; return $x; };
var haxe_CallStack = function() { };
haxe_CallStack.__name__ = true;
haxe_CallStack.getStack = function(e) {
	if(e == null) {
		return [];
	}
	var oldValue = Error.prepareStackTrace;
	Error.prepareStackTrace = function(error,callsites) {
		var stack = [];
		var _g = 0;
		while(_g < callsites.length) {
			var site = callsites[_g];
			++_g;
			if(haxe_CallStack.wrapCallSite != null) {
				site = haxe_CallStack.wrapCallSite(site);
			}
			var method = null;
			var fullName = site.getFunctionName();
			if(fullName != null) {
				var idx = fullName.lastIndexOf(".");
				if(idx >= 0) {
					var className = HxOverrides.substr(fullName,0,idx);
					var methodName = HxOverrides.substr(fullName,idx + 1,null);
					method = haxe_StackItem.Method(className,methodName);
				}
			}
			stack.push(haxe_StackItem.FilePos(method,site.getFileName(),site.getLineNumber()));
		}
		return stack;
	};
	var a = haxe_CallStack.makeStack(e.stack);
	Error.prepareStackTrace = oldValue;
	return a;
};
haxe_CallStack.callStack = function() {
	try {
		throw new Error();
	} catch( e ) {
		if (e instanceof js__$Boot_HaxeError) e = e.val;
		var a = haxe_CallStack.getStack(e);
		a.shift();
		return a;
	}
};
haxe_CallStack.toString = function(stack) {
	var b = new StringBuf();
	var _g = 0;
	while(_g < stack.length) {
		var s = stack[_g];
		++_g;
		b.b += "\nCalled from ";
		haxe_CallStack.itemToString(b,s);
	}
	return b.b;
};
haxe_CallStack.itemToString = function(b,s) {
	switch(s[1]) {
	case 0:
		b.b += "a C function";
		break;
	case 1:
		var m = s[2];
		b.b += "module ";
		b.b += m == null ? "null" : "" + m;
		break;
	case 2:
		var line = s[4];
		var file = s[3];
		var s1 = s[2];
		if(s1 != null) {
			haxe_CallStack.itemToString(b,s1);
			b.b += " (";
		}
		b.b += file == null ? "null" : "" + file;
		b.b += " line ";
		b.b += line == null ? "null" : "" + line;
		if(s1 != null) {
			b.b += ")";
		}
		break;
	case 3:
		var meth = s[3];
		var cname = s[2];
		b.b += cname == null ? "null" : "" + cname;
		b.b += ".";
		b.b += meth == null ? "null" : "" + meth;
		break;
	case 4:
		var n = s[2];
		b.b += "local function #";
		b.b += n == null ? "null" : "" + n;
		break;
	}
};
haxe_CallStack.makeStack = function(s) {
	if(s == null) {
		return [];
	} else if(typeof(s) == "string") {
		var stack = s.split("\n");
		if(stack[0] == "Error") {
			stack.shift();
		}
		var m = [];
		var rie10 = new EReg("^   at ([A-Za-z0-9_. ]+) \\(([^)]+):([0-9]+):([0-9]+)\\)$","");
		var _g = 0;
		while(_g < stack.length) {
			var line = stack[_g];
			++_g;
			if(rie10.match(line)) {
				var path = rie10.matched(1).split(".");
				var meth = path.pop();
				var file = rie10.matched(2);
				var line1 = Std.parseInt(rie10.matched(3));
				m.push(haxe_StackItem.FilePos(meth == "Anonymous function" ? haxe_StackItem.LocalFunction() : meth == "Global code" ? null : haxe_StackItem.Method(path.join("."),meth),file,line1));
			} else {
				m.push(haxe_StackItem.Module(StringTools.trim(line)));
			}
		}
		return m;
	} else {
		return s;
	}
};
var haxe_IMap = function() { };
haxe_IMap.__name__ = true;
var haxe_ds_StringMap = function() { };
haxe_ds_StringMap.__name__ = true;
haxe_ds_StringMap.__interfaces__ = [haxe_IMap];
var haxe_remoting_JsonRpcConstants = function() { };
haxe_remoting_JsonRpcConstants.__name__ = true;
var hxassert_Assert = function() { };
hxassert_Assert.__name__ = true;
hxassert_Assert.on = function(handler) {
	hxassert_Assert._handlers.push(handler);
	return function() {
		HxOverrides.remove(hxassert_Assert._handlers,handler);
	};
};
hxassert_Assert.fail = function(reason,position) {
	if(reason == null) {
		reason = "Assert.fail";
	}
	hxassert_Assert.throwError(new hxassert_AssertionFailureError([reason],position));
};
hxassert_Assert.throwError = function(error) {
	var _g = 0;
	var _g1 = hxassert_Assert._handlers;
	while(_g < _g1.length) {
		var handler = _g1[_g];
		++_g;
		handler(error);
	}
	if(!error.recovered) {
		throw new js__$Boot_HaxeError(error);
	}
};
hxassert_Assert.throwAssertionFailureError = function(messages,position) {
	hxassert_Assert.throwError(new hxassert_AssertionFailureError(messages,position));
};
var hxassert_AssertionFailureError = function(messages,infos) {
	this.recovered = false;
	this._messages = messages;
	this.position = infos;
	this.callstack = haxe_CallStack.callStack();
};
hxassert_AssertionFailureError.__name__ = true;
hxassert_AssertionFailureError.prototype = {
	toString: function() {
		return this._messages.join("\n");
	}
	,getCallStackText: function() {
		if(this.callstack != null) {
			return haxe_CallStack.toString(this.callstack);
		} else {
			return "";
		}
	}
	,recovery: function() {
		this.recovered = true;
	}
};
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
var js_metapage_v1__$MetaframeId_MetaframeId_$Impl_$ = {};
js_metapage_v1__$MetaframeId_MetaframeId_$Impl_$.__name__ = true;
js_metapage_v1__$MetaframeId_MetaframeId_$Impl_$._new = function(s) {
	var this1 = s;
	return this1;
};
var js_metapage_v1__$MetaframePipeId_MetaframePipeId_$Impl_$ = {};
js_metapage_v1__$MetaframePipeId_MetaframePipeId_$Impl_$.__name__ = true;
js_metapage_v1__$MetaframePipeId_MetaframePipeId_$Impl_$._new = function(s) {
	var this1 = s;
	return this1;
};
var js_metapage_v1__$MetapageId_MetapageId_$Impl_$ = {};
js_metapage_v1__$MetapageId_MetapageId_$Impl_$.__name__ = true;
js_metapage_v1__$MetapageId_MetapageId_$Impl_$._new = function(s) {
	var this1 = s;
	return this1;
};
var js_metapage_v1_client_EventEmitter = function() {
	this._events = { };
};
js_metapage_v1_client_EventEmitter.__name__ = true;
js_metapage_v1_client_EventEmitter.prototype = {
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
var js_metapage_v1_client_Metapage = $hx_exports["Metapage"] = function(opts) {
	this._debug = false;
	this._iframes = { };
	this._outputPipeMap = { };
	js_metapage_v1_client_EventEmitter.call(this);
	this._id = js_metapage_v1_client_Metapage.generateId();
	this._debug = opts != null && opts.debug == true;
	this._consoleBackgroundColor = opts != null && opts.color != null ? opts.color : js_metapage_v1_client_Metapage.CONSOLE_BACKGROUND_COLOR_DEFAULT;
	window.addEventListener("message",$bind(this,this.onMessage));
	this.log("Initialized",null,null,{ fileName : "Metapage.hx", lineNumber : 48, className : "js.metapage.v1.client.Metapage", methodName : "new"});
};
js_metapage_v1_client_Metapage.__name__ = true;
js_metapage_v1_client_Metapage.fromDefinition = function(metaPageDef) {
	var metapage = new js_metapage_v1_client_Metapage(metaPageDef.options);
	if(metaPageDef.iframes != null) {
		var _g = 0;
		var _g1 = Reflect.fields(metaPageDef.iframes);
		while(_g < _g1.length) {
			var iframeId = _g1[_g];
			++_g;
			var iframeDef = metaPageDef.iframes[iframeId];
			var iframe = metapage.createIFrame(iframeDef.url,iframeId);
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
			metapage.pipe(pipeDef);
		}
	}
	return metapage;
};
js_metapage_v1_client_Metapage.generateId = function(length) {
	if(length == null) {
		length = 8;
	}
	var s_b = "";
	while(length > 0) {
		s_b += Std.string(js_metapage_v1_client_Metapage.LETTERS.charAt(Math.max(0,Math.random() * js_metapage_v1_client_Metapage.LETTERS.length - 1) | 0));
		--length;
	}
	return s_b;
};
js_metapage_v1_client_Metapage.__super__ = js_metapage_v1_client_EventEmitter;
js_metapage_v1_client_Metapage.prototype = $extend(js_metapage_v1_client_EventEmitter.prototype,{
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
			iframeId = js_metapage_v1_client_Metapage.generateId();
		}
		var iframeClient = new js_metapage_v1_client_IFrameRpcClient(url,iframeId,this._id,this._consoleBackgroundColor,this._debug);
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
			this.log("No iframe id=" + iframeId,"f00",this._consoleBackgroundColor,{ fileName : "Metapage.hx", lineNumber : 95, className : "js.metapage.v1.client.Metapage", methodName : "setInput"});
		}
	}
	,dispose: function() {
		js_metapage_v1_client_EventEmitter.prototype.dispose.call(this);
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
			this.log("message.jsonrpc != '2.0'","f00",this._consoleBackgroundColor,{ fileName : "Metapage.hx", lineNumber : 113, className : "js.metapage.v1.client.Metapage", methodName : "isValidJsonRpcMessage"});
			return false;
		}
		var method = message.method;
		if(method == "SetupIframeClientRequest") {
			return true;
		} else {
			if(!(message.parentId == this._id && Object.prototype.hasOwnProperty.call(this._iframes,message.iframeId))) {
				this.log("message.parentId=" + message.parentId + " _id=" + this._id + " message.iframeId=" + message.iframeId + " _iframes.exists(message.iframeId)=" + Std.string(Object.prototype.hasOwnProperty.call(this._iframes,message.iframeId)) + " message=" + HxOverrides.substr(JSON.stringify(message),0,200),"f00",this._consoleBackgroundColor,{ fileName : "Metapage.hx", lineNumber : 124, className : "js.metapage.v1.client.Metapage", methodName : "isValidJsonRpcMessage"});
			}
			if(message.parentId == this._id) {
				return Object.prototype.hasOwnProperty.call(this._iframes,message.iframeId);
			} else {
				return false;
			}
		}
	}
	,onMessage: function(e) {
		this.debug(HxOverrides.substr(Std.string(e.data),0,200),null,null,{ fileName : "Metapage.hx", lineNumber : 132, className : "js.metapage.v1.client.Metapage", methodName : "onMessage"});
		if(typeof e.data === "object") {
			var jsonrpc = e.data;
			if(!this.isValidJsonRpcMessage(jsonrpc)) {
				this.log("invalid message " + HxOverrides.substr(JSON.stringify(jsonrpc),0,200),"f00",this._consoleBackgroundColor,{ fileName : "Metapage.hx", lineNumber : 136, className : "js.metapage.v1.client.Metapage", methodName : "onMessage"});
				return;
			}
			var origin = e.origin;
			var source = e.source;
			var method = jsonrpc.method;
			switch(method) {
			case "Dimensions":
				this.debug("" + jsonrpc.iframeId + " Dimensions " + HxOverrides.substr(JSON.stringify(jsonrpc.params),0,200),null,null,{ fileName : "Metapage.hx", lineNumber : 261, className : "js.metapage.v1.client.Metapage", methodName : "onMessage"});
				var dimensions = jsonrpc.params;
				this.debug("" + jsonrpc.iframeId + " Dimensions " + Std.string(dimensions),null,null,{ fileName : "Metapage.hx", lineNumber : 263, className : "js.metapage.v1.client.Metapage", methodName : "onMessage"});
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
				var dataBlob = { value : outputBlob.value, type : outputBlob.type == null ? undefined : outputBlob.type, source : outputBlob.source, encoding : outputBlob.encoding};
				var pipeId = outputBlob.name;
				var iframeId = jsonrpc.iframeId;
				var iframe1 = this._iframes[iframeId];
				iframe1.debug("OutputPipeUpdate from=" + iframeId + " pipeId=" + outputBlob.name + " params=" + HxOverrides.substr(JSON.stringify(jsonrpc.params),0,200),{ fileName : "Metapage.hx", lineNumber : 182, className : "js.metapage.v1.client.Metapage", methodName : "onMessage"});
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
										iframe1.debug("Sending from " + iframeId + "." + pipeId + " to " + inputPipe.id + "." + inputPipe.pipe,{ fileName : "Metapage.hx", lineNumber : 196, className : "js.metapage.v1.client.Metapage", methodName : "onMessage"});
										inputIframe.setInput(inputPipe.pipe,dataBlob);
									}
								}
							}
						} else {
							this.log("OutputPipeUpdate _outputPipeMap.get(" + iframeId + ").get(" + pipeId + ") is null","f00",this._consoleBackgroundColor,{ fileName : "Metapage.hx", lineNumber : 202, className : "js.metapage.v1.client.Metapage", methodName : "onMessage"});
						}
					}
				} else {
					this.log("missing iframe=" + iframeId,"f00",this._consoleBackgroundColor,{ fileName : "Metapage.hx", lineNumber : 208, className : "js.metapage.v1.client.Metapage", methodName : "onMessage"});
				}
				break;
			case "OutputsUpdate":
				var iframeId1 = jsonrpc.iframeId;
				var iframe2 = this._iframes[iframeId1];
				var outputs = jsonrpc.params;
				iframe2.debug("OutputsUpdate from=" + iframeId1 + " outputs=" + HxOverrides.substr(JSON.stringify(jsonrpc.params),0,200),{ fileName : "Metapage.hx", lineNumber : 215, className : "js.metapage.v1.client.Metapage", methodName : "onMessage"});
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
											iframe2.debug("Sending from " + iframeId1 + "." + outputName + " to " + inputPipe1.id + "." + inputPipe1.pipe,{ fileName : "Metapage.hx", lineNumber : 231, className : "js.metapage.v1.client.Metapage", methodName : "onMessage"});
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
								this.log("OutputsUpdate _outputPipeMap.get(" + iframeId1 + ").get(" + outputName + ") is null","f00",this._consoleBackgroundColor,{ fileName : "Metapage.hx", lineNumber : 243, className : "js.metapage.v1.client.Metapage", methodName : "onMessage"});
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
					this.log("missing iframe=" + iframeId1,"f00",this._consoleBackgroundColor,{ fileName : "Metapage.hx", lineNumber : 253, className : "js.metapage.v1.client.Metapage", methodName : "onMessage"});
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
var js_metapage_v1_client_IFrameRpcClient = function(url,iframeId,parentId,consoleBackgroundColor,debug) {
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
js_metapage_v1_client_IFrameRpcClient.__name__ = true;
js_metapage_v1_client_IFrameRpcClient.prototype = {
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
		var pipeUpdateBlob = Reflect.copy(inputBlob);
		pipeUpdateBlob.name = name;
		this._inputs[name] = pipeUpdateBlob;
		if(this.iframe.parentNode != null && this._loaded) {
			this.sendInput(name);
		} else {
			this.debug("Not setting input bc _loaded=" + Std.string(this._loaded),{ fileName : "Metapage.hx", lineNumber : 397, className : "js.metapage.v1.client.IFrameRpcClient", methodName : "setInput"});
		}
		var e = Reflect.copy(pipeUpdateBlob);
		var this1 = this.id;
		e.iframeId = this1;
		this._metapage.emit("InputUpdate",e);
	}
	,setInputs: function(inputs) {
		this.debug({ m : "IFrameRpcClient", inputs : inputs},{ fileName : "Metapage.hx", lineNumber : 406, className : "js.metapage.v1.client.IFrameRpcClient", methodName : "setInputs"});
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
			this.debug("Not setting input bc _loaded=" + Std.string(this._loaded),{ fileName : "Metapage.hx", lineNumber : 414, className : "js.metapage.v1.client.IFrameRpcClient", methodName : "setInputs"});
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
			_this.log("sending rpc later","f00",_this._consoleBackgroundColor,{ fileName : "Metapage.hx", lineNumber : 446, className : "js.metapage.v1.client.IFrameRpcClient", methodName : "sendRpc"});
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
		this.log("registered",{ fileName : "Metapage.hx", lineNumber : 496, className : "js.metapage.v1.client.IFrameRpcClient", methodName : "registered"});
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
			this.debug("Sending to child iframe messageJson=" + HxOverrides.substr(JSON.stringify(messageJson),0,200),{ fileName : "Metapage.hx", lineNumber : 514, className : "js.metapage.v1.client.IFrameRpcClient", methodName : "sendRpcInternal"});
			this.iframe.contentWindow.postMessage(messageJson,"*");
		} else {
			var _this = this._metapage;
			_this.log("Cannot send to child iframe messageJson=" + HxOverrides.substr(JSON.stringify(messageJson),0,200),"f00",_this._consoleBackgroundColor,{ fileName : "Metapage.hx", lineNumber : 517, className : "js.metapage.v1.client.IFrameRpcClient", methodName : "sendRpcInternal"});
		}
	}
};
var js_metapage_v1_client_MetapageTools = function() { };
js_metapage_v1_client_MetapageTools.__name__ = true;
js_metapage_v1_client_MetapageTools.toDatablob = function(blob) {
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
js_metapage_v1_client_MetapageTools.log = function(o,color,backgroundColor,pos) {
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
js_metapage_v1_client_MetapageTools.stringToRgb = function(str) {
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
js_metapage_v1_client_MetapageTools.hashCode = function(str) {
	var hash = 0;
	var _g1 = 0;
	var _g = str.length;
	while(_g1 < _g) {
		var i = _g1++;
		hash = HxOverrides.cca(str,i) + ((hash << 5) - hash);
	}
	return hash;
};
js_metapage_v1_client_MetapageTools.intToRGB = function(i) {
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
var __map_reserved = {};
haxe_remoting_JsonRpcConstants.JSONRPC_VERSION_2 = "2.0";
haxe_remoting_JsonRpcConstants.MULTIPART_JSONRPC_KEY = "jsonrpc";
haxe_remoting_JsonRpcConstants.JSONRPC_NULL_ID = "_";
hxassert_Assert._handlers = [];
js_metapage_v1_client_Metapage.CONSOLE_BACKGROUND_COLOR_DEFAULT = "bcbcbc";
js_metapage_v1_client_Metapage.LETTERS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_";
})(typeof exports != "undefined" ? exports : typeof window != "undefined" ? window : typeof self != "undefined" ? self : this);
