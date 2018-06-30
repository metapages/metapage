import haxe.Json;
import haxe.DynamicAccess;
import haxe.remoting.JsonRpc;

#if !macro
	import js.html.*;
	import js.Browser;
	import js.Promise;
#end

import js.metapage.v1.*;
import js.metapage.v1.JsonRpcMethods;

import util.TypedDynamicAccess;

using Lambda;
using StringTools;

using js.metapage.v1.client.MetapageTools;