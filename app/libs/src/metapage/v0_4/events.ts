import { MetaframeId, MetapageDefinitionV3 } from ".";
import { MetapageIFrameRpcClient } from "../MetapageIFrameRpcClient";

export enum MetapageEvents {
  Inputs = "inputs",
  Outputs = "outputs",
  State = "state",
  // The definition has already changed e.g. a metaframe changes its hash params
  // so the current definition now contains that change
  Definition = "definition",
  // A plugin is requesting to modify the definition
  // This is not automatically processed, the context of the metapage decides what
  // to do with this update (apply, recreate metapage, ignore etc)
  DefinitionUpdateRequest = "definitionupdaterequest",
  Error = "error",
  // when a metaframe wants to tell the metapage of the new URL (for saving state/config)
  UrlHashUpdate = "urlhashupdate",
  // general event, all events are emitted in their raw form to this namespace
  Message = "Message",
}

export interface MetapageEventDefinition {
  definition: MetapageDefinitionV3;
  metaframes: {
    [key: string]: MetapageIFrameRpcClient;
  };
  plugins?: {
    [key: string]: MetapageIFrameRpcClient;
  };
}

export type MetapageEventUrlHashUpdate = {
  metaframe: MetaframeId;
  hash: string;
};
