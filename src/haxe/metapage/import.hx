import haxe.Json;
import haxe.DynamicAccess;
import haxe.remoting.JsonRpc;
#if !macro
	import js.html.*;
	import js.Browser;
	import js.Promise;
#end
import metapage.Definitions;
import metapage.JsonRpcMethods;
using Lambda;
using StringTools;