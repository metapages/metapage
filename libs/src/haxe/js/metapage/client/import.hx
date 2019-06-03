import haxe.Json;
import haxe.DynamicAccess;
import haxe.remoting.JsonRpc;

import hxassert.Assert.*;

#if !macro
	import js.Browser;
	import js.Promise;
	import js.html.Event;
	import js.html.IFrameElement;
	import js.html.URL;
#end

import js.metapage.Constants;
import js.metapage.Constants.*;
import js.metapage.v0_2.MetaframeDefinition;
import js.metapage.v0_2.MetaframeInputMap;
import js.metapage.v0_2.MetaframeInstance;
import js.metapage.v0_2.PipeUpdateClient;
import js.metapage.v0_2.MetapageInstanceInputs;
import js.metapage.v0_2.MetapageOptions;
import js.metapage.v0_2.PipeInput;

import js.metapage.v0_3.JsonRpcMethods;
import js.metapage.v0_3.MetapageDefinition;
import js.metapage.v0_3.Url;
import js.metapage.v0_3.MetapageEventDefinition;

import util.TypedDynamicAccess;
import js.metapage.client.MetapageTools.*;

using Lambda;
using StringTools;

using js.metapage.client.MetapageTools;