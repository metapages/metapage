import { MetaframeId, MetapageId } from "./core";
import { VersionsMetaframe, VersionsMetapage } from "./versions";
import { MetaframeInputMap} from "./metapage";
import { JsonRpcRequest } from '../jsonrpc2';

export enum JsonRpcMethodsFromChild {
  InputsUpdate = "InputsUpdate",
  OutputsUpdate = "OutputsUpdate",
  SetupIframeClientRequest = "SetupIframeClientRequest",
  SetupIframeServerResponseAck = "SetupIframeServerResponseAck",
  // Plugin API
  PluginRequest = "SetupIframeServerPluginRequestResponseAck", // See further definitions: ApiPayloadPluginRequest*
  // Experimental feature
  HashParamsUpdate = "HashParamsUpdate",
}

export enum JsonRpcMethodsFromParent {
  InputsUpdate = "InputsUpdate",
  MessageAck = "MessageAck",
  SetupIframeServerResponse = "SetupIframeServerResponse"
}

export interface SetupIframeServerResponseData {
  iframeId: MetaframeId;
  parentId: MetapageId;
  state: {
    inputs: MetaframeInputMap
  };
  // Allow newer metaframes to handle older metapage versions
  version: VersionsMetapage;
  //is this metaframe a plugin?
  plugin: boolean;
}

export interface MinimumClientMessage<T> extends JsonRpcRequest<T> {
  iframeId: MetaframeId | undefined;
  parentId: MetapageId | undefined;
}

export interface SetupIframeClientAckData<T> extends MinimumClientMessage<T> {
  version: VersionsMetaframe;
}

export interface ClientMessageRecievedAck<T> {
  message: MinimumClientMessage<T>;
}

// Plugin API definitions
export enum ApiPayloadPluginRequestMethod {
  State = "metapage/state"
}

export interface ApiPayloadPluginRequest {
  method: ApiPayloadPluginRequestMethod;
}
