import haxe.Json;
import haxe.DynamicAccess;
import haxe.remoting.JsonRpc;

#if !macro
	import js.html.*;
	import js.Browser;
	import js.Promise;
#end

import js.metapage.v0_0_1.*;
import js.metapage.v0_0_1.JsonRpcMethods;

import util.TypedDynamicAccess;

using Lambda;
using StringTools;

using js.metapage.v0_0_1.client.MetapageTools;