import { EventEmitter } from "eventemitter3";
import { JsonRpcMethodsFromParent, MetapageDefinitionV3 } from "./v0_4";
import { MetapageEvents } from "./v0_4/events";
export declare enum MetapageHashParams {
    mp_debug = "mp_debug"
}
export declare const isIframe: () => boolean;
export declare const INITIAL_NULL_METAPAGE_DEFINITION: MetapageDefinitionV3;
export declare class MetapageShared extends EventEmitter<MetapageEvents | JsonRpcMethodsFromParent> {
    _definition: MetapageDefinitionV3;
    constructor();
    error(err: any): void;
    getDefinition(): MetapageDefinitionV3;
}
//# sourceMappingURL=Shared.d.ts.map