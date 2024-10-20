import { MetaframeId, MetapageDefinitionV3 } from ".";
import { MetapageIFrameRpcClient } from "../MetapageIFrameRpcClient";
export declare enum MetapageEvents {
    Inputs = "inputs",
    Outputs = "outputs",
    State = "state",
    Definition = "definition",
    DefinitionUpdateRequest = "definitionupdaterequest",
    Error = "error",
    UrlHashUpdate = "urlhashupdate",
    Message = "Message"
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
//# sourceMappingURL=events.d.ts.map