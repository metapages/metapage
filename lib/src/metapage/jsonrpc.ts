import { JsonRpcRequest } from "./jsonrpc2.js";

import { MetaframeId, MetapageId } from "./core.js";
import { VersionsMetaframe, VersionsMetapage } from "./versions.js";
import { MetaframeInputMap } from "./v0_4/index.js";

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
  SetupIframeServerResponse = "SetupIframeServerResponse",
}

export interface SetupIframeServerResponseData {
  iframeId: MetaframeId;
  parentId: MetapageId;
  state: {
    inputs: MetaframeInputMap;
  };
  // Allow newer metaframes to handle older metapage versions
  version: VersionsMetapage;
  /**
   * The metapage wants binary values passed as-is (structured clone) rather
   * than serialized to data URLs. Only set if the metaframe said it supports
   * it in its SetupIframeClientRequest. Absent from older metapages.
   */
  passByReference?: boolean;
}

export interface SetupIframeClientRequestData {
  version: VersionsMetaframe;
  /**
   * The metaframe accepts binary values as-is (structured clone), and will
   * send its outputs that way if the metapage asks. Absent from older
   * metaframes, which only understand data URLs.
   */
  passByReference?: boolean;
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
