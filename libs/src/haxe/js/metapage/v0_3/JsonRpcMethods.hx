package js.metapage.v0_3;

import haxe.remoting.JsonRpc;

@:enum
abstract JsonRpcMethodsFromChild(String) to String {
  var InputsUpdate                 = "InputsUpdate";
  var OutputsUpdate                = "OutputsUpdate";
  var SetupIframeClientRequest     = "SetupIframeClientRequest";
  var SetupIframeServerResponseAck = "SetupIframeServerResponseAck";

  // Plugin API
  var PluginRequest = "PluginRequest"; // See further definitions: ApiPayloadPluginRequest*
}

@:enum
abstract JsonRpcMethodsFromParent(String) to String {
  var InputsUpdate              = "InputsUpdate";
  var SetupIframeServerResponse = "SetupIframeServerResponse";
}

@:enum
abstract OtherEvents(String) to String {
  var Message = "Message";
}

typedef SetupIframeServerResponseData = {
	var iframeId: MetaframeId;
	var parentId: MetapageId;
	var state   : {inputs:MetaframeInputMap};
  // Allow newer metaframes to handle older metapage versions
	var version : MetaLibsVersion;
  //is this metaframe a plugin?
  var plugin  : Bool;
}

typedef MinimumClientMessage = {>RequestDef,
	var iframeId :MetaframeId;
	var parentId :MetapageId;
}

typedef SetupIframeClientAckData = {>MinimumClientMessage,
  var version  :MetaLibsVersion;
}

// Plugin API definitions
@:enum
abstract ApiPayloadPluginRequestMethod(String) to String {
  // request the state
  var State = "metapage/state";
}

typedef ApiPayloadPluginRequest = {
  var method : ApiPayloadPluginRequestMethod;
}
