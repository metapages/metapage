package metapage;

@:enum
abstract JsonRpcMethodsFromChild(String) to String {
  var OutputUpdate = "OutputUpdate";
  var OutputsUpdate = "OutputsUpdate";
  var SetupIframeClientRequest = "SetupIframeClientRequest";
  var SetupIframeServerResponseAck = "SetupIframeServerResponseAck";
  // var AddRpcMethod = "AddRpcMethod";
  // var RPC = "RPC";
  var Dimensions = "Dimensions";
  // var Message = "Message";
}

@:enum
abstract JsonRpcMethodsFromParent(String) to String {
  var InputsUpdate = "InputsUpdate";
  var InputUpdate = "InputUpdate";
  var SetupIframeServerResponse = "SetupIframeServerResponse";
  // var AddRpcMethod = "AddRpcMethod";
  // var RPC = "RPC";
  // var Message = "Message";
}

@:enum
abstract OtherEvents(String) to String {
  // var AddRpcMethod = "AddRpcMethod";
  // var RPC = "RPC";
  var Message = "Message";
}

typedef SetupIframeServerResponseData = {
	var origin :String;
	var iframeId :String;
	var parentId :String;
}

typedef MinimumClientMessage = {>RequestDef,
	var origin :String;
	var iframeId :String;
	var parentId :String;
}