import haxe.Json;
import haxe.DynamicAccess;
import haxe.remoting.JsonRpc;

import hxassert.Assert.*;

#if !macro
	import js.html.*;
	import js.Browser;
	import js.Promise;
	import js.Lib;
#end

import js.metapage.v0_2.*;
import js.metapage.v0_2.JsonRpcMethods;

import util.TypedDynamicAccess;
import js.metapage.client.MetapageTools.*;

using Lambda;
using StringTools;

using js.metapage.client.MetapageTools;