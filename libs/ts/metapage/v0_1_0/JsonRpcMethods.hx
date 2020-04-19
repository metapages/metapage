package js.metapage.v0_1_0;

import haxe.remoting.JsonRpc;

@:enum
abstract JsonRpcMethodsFromChild(String) to String {
  var InputsUpdate = "InputsUpdate";
  var OutputsUpdate = "OutputsUpdate";
  var SetupIframeClientRequest = "SetupIframeClientRequest";
  var SetupIframeServerResponseAck = "SetupIframeServerResponseAck";
  var Dimensions = "Dimensions";
}

@:enum
abstract JsonRpcMethodsFromParent(String) to String {
  var InputsUpdate = "InputsUpdate";
  var SetupIframeServerResponse = "SetupIframeServerResponse";
}

@:enum
abstract OtherEvents(String) to String {
  var Message = "Message";
}

typedef SetupIframeServerResponseData = {
	var iframeId :MetaframeId;
	var parentId :MetapageId;
  var state: {inputs:MetaframeInputMap};
}

typedef MinimumClientMessage = {>RequestDef,
	var iframeId :MetaframeId;
	var parentId :MetapageId;
}