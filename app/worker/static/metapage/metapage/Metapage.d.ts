import { ListenerFn } from 'eventemitter3';
import { MetapageIFrameRpcClient } from './MetapageIFrameRpcClient';
import { MetapageShared } from './Shared';
import { MetaframeId, MetaframeInputMap, MetaframeInstance, MetaframePipeId, MetapageDefinitionV3, MetapageId, MetapageInstanceInputs, MetapageOptions, MinimumClientMessage, PipeInput, VersionsMetapage } from './v0_4';
import { MetapageEvents } from './v0_4/events';
export declare enum MetapageEventStateType {
    all = "all",
    delta = "delta"
}
interface MetapageStatePartial {
    inputs: MetapageInstanceInputs;
    outputs: MetapageInstanceInputs;
}
export interface MetapageState {
    metaframes: MetapageStatePartial;
    plugins: MetapageStatePartial;
}
type Url = string;
export declare const getLibraryVersionMatching: (version: string) => VersionsMetapage;
export declare const matchPipe: (outputPipeName: string, inputPipeName?: string) => boolean;
type MetaframeInputTargetsFromOutput = {
    metaframe: MetaframeId;
    pipe: MetaframePipeId;
};
export declare class Metapage extends MetapageShared {
    static readonly version: "0.3" | "0.2";
    static readonly DEFINITION = MetapageEvents.Definition;
    static readonly DEFINITION_UPDATE_REQUEST = MetapageEvents.DefinitionUpdateRequest;
    static readonly ERROR = MetapageEvents.Error;
    static readonly INPUTS = MetapageEvents.Inputs;
    static readonly MESSAGE = MetapageEvents.Message;
    static readonly OUTPUTS = MetapageEvents.Outputs;
    static readonly STATE = MetapageEvents.State;
    static deserializeInputs: (inputs: MetaframeInputMap) => Promise<MetaframeInputMap>;
    static serializeInputs: (inputs: MetaframeInputMap) => Promise<MetaframeInputMap>;
    static from(metaPageDef: any, inputs?: any): Metapage;
    _id: MetapageId;
    _state: MetapageState;
    _metaframes: {
        [key: string]: MetapageIFrameRpcClient;
    };
    _plugins: {
        [key: string]: MetapageIFrameRpcClient;
    };
    _pluginOrder: Url[];
    debug: boolean;
    _consoleBackgroundColor: string;
    _internalReceivedMessageCounter: number;
    _cachedInputLookupMap: {
        [key: string]: {
            [key: string]: MetaframeInputTargetsFromOutput[];
        };
    };
    _inputMap: {
        [key: string]: PipeInput[];
    };
    constructor(opts?: MetapageOptions);
    isDisposed(): boolean;
    addListenerReturnDisposer(event: MetapageEvents, listener: ListenerFn<any[]>): () => void;
    setDebugFromUrlParams(): Metapage;
    getState(): MetapageState;
    setState(newState: MetapageState): void;
    getStateMetaframes(): MetapageStatePartial;
    getDefinition(): MetapageDefinitionV3;
    setDefinition(def: any, state?: MetapageState): Metapage;
    _emitDefinitionEvent(): void;
    addPipe(target: MetaframeId, input: PipeInput): void;
    removeMetaframe(metaframeId: MetaframeId): void;
    removePlugin(url: Url): void;
    removeAll(): void;
    metaframes(): {
        [key: string]: MetapageIFrameRpcClient;
    };
    metaframeIds(): MetaframeId[];
    getMetaframeIds(): MetaframeId[];
    getMetaframes(): {
        [key: string]: MetapageIFrameRpcClient;
    };
    plugins(): {
        [key: string]: MetapageIFrameRpcClient;
    };
    pluginIds(): Array<Url>;
    getPluginIds(): Array<Url>;
    getMetaframe(id: MetaframeId): MetapageIFrameRpcClient;
    getPlugin(url: string): MetapageIFrameRpcClient;
    addMetaframe(metaframeId: MetaframeId, definition: MetaframeInstance): MetapageIFrameRpcClient;
    addPlugin(url: Url): MetapageIFrameRpcClient;
    dispose(): void;
    log(o: any, color?: string, backgroundColor?: string): void;
    error(err: any): void;
    emitErrorMessage(err: string): void;
    getInputsFromOutput(source: MetaframeId, outputPipeId: MetaframePipeId): MetaframeInputTargetsFromOutput[];
    isValidJSONRpcMessage(message: MinimumClientMessage<any>): boolean;
    setInput(iframeId: any, inputPipeId?: any, value?: any): void;
    setMetaframeClientInputAndSentClientEvent(iframeId: any, inputPipeId?: any, value?: any): void;
    setInputs(iframeId: any, inputPipeId?: any, value?: any): void;
    setOutputStateOnly(iframeId: any, inputPipeId?: any, value?: any): void;
    setInputStateOnly(iframeId: any, inputPipeId?: any, value?: any): void;
    _setStateOnly(isInputs: boolean, iframeId: any, inputPipeId?: any, value?: any): void;
    getMetaframeOrPlugin(key: string): MetapageIFrameRpcClient;
    onMessage(e: MessageEvent): void;
    updatePluginsWithDefinition(): void;
    logInternal(o: any, color?: string, backgroundColor?: string): void;
}
export {};
//# sourceMappingURL=Metapage.d.ts.map