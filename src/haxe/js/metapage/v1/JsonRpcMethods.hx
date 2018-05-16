package js.metapage.v1;

import haxe.remoting.JsonRpc;

@:enum
abstract JsonRpcMethodsFromChild(String) to String {
  // var OutputUpdate = "OutputUpdate";
  var OutputsUpdate = "OutputsUpdate";
  var SetupIframeClientRequest = "SetupIframeClientRequest";
  var SetupIframeServerResponseAck = "SetupIframeServerResponseAck";
  var Dimensions = "Dimensions";
}

@:enum
abstract JsonRpcMethodsFromParent(String) to String {
  var InputsUpdate = "InputsUpdate";
  // var InputUpdate = "InputUpdate";
  var SetupIframeServerResponse = "SetupIframeServerResponse";
}

@:enum
abstract OtherEvents(String) to String {
  var Message = "Message";
}

typedef SetupIframeServerResponseData = {
	var origin :String;
	var iframeId :MetaframeId;
	var parentId :MetapageId;
  var state: {inputs:MetaframeInputMap, outputs:MetaframeInputMap};
}

typedef MinimumClientMessage = {>RequestDef,
	var origin :String;
	var iframeId :MetaframeId;
	var parentId :MetapageId;
}
