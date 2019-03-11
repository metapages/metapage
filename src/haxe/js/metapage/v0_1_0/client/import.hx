import haxe.Json;
import haxe.DynamicAccess;
import haxe.remoting.JsonRpc;

#if !macro
	import js.html.*;
	import js.Browser;
	import js.Promise;
#end

import js.metapage.v0_1_0.*;
import js.metapage.v0_1_0.JsonRpcMethods;

import util.TypedDynamicAccess;
import js.metapage.v0_1_0.client.MetapageTools.*;

using Lambda;
using StringTools;

using js.metapage.v0_1_0.client.MetapageTools;