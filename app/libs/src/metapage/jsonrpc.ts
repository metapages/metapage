import { JsonRpcRequest } from './jsonrpc2.js';
import {
  MetaframeId,
  MetaframeInputMap,
  MetapageId,
} from './v1/index.js';
import {
  VersionsMetaframe,
  VersionsMetapage,
} from './versions.js';

export enum JsonRpcMethodsFromChild {
  InputsUpdate = "InputsUpdate",
  OutputsUpdate = "OutputsUpdate",
  SetupIframeClientRequest = "SetupIframeClientRequest",
  SetupIframeServerResponseAck = "SetupIframeServerResponseAck",
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