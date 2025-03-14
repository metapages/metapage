import { MetaframeId } from "./core";
import { MetapageDefinitionV2 } from "./v2";
import { MetapageIFrameRpcClient } from "./MetapageIFrameRpcClient";

export enum MetapageEvents {
  Inputs = "inputs",
  Outputs = "outputs",
  State = "state",
  // The definition has already changed e.g. a metaframe changes its hash params
  // so the current definition now contains that change
  Definition = "definition",
  Error = "error",
  Warning = "warning",
  // when a metaframe wants to tell the metapage of the new URL (for saving state/config)
  UrlHashUpdate = "urlhashupdate",
  // general event, all events are emitted in their raw form to this namespace
  Message = "Message",
}

export interface MetapageEventDefinition {
  definition: MetapageDefinitionV2;
  metaframes: {
    [key: string]: MetapageIFrameRpcClient;
  };
}

export type MetapageEventUrlHashUpdate = {
  metaframe: MetaframeId;
  hash: string;
};
