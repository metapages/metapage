import { EventEmitter, ListenerFn } from 'eventemitter3';
import { JsonRpcMethodsFromChild, MetaframeInputMap, MetaframePipeId, MetapageId, SetupIframeServerResponseData, VersionsMetapage } from './v0_4';
export declare enum MetaframeLoadingState {
    WaitingForPageLoad = "WaitingForPageLoad",
    SentSetupIframeClientRequest = "SentSetupIframeClientRequest",
    Ready = "Ready"
}
export declare enum MetaframeEvents {
    Connected = "connected",
    Error = "error",
    Input = "input",
    Inputs = "inputs",
    Message = "message"
}
export type MetaframeOptions = {
    disableHashChangeEvent?: boolean;
};
export declare class Metaframe extends EventEmitter<MetaframeEvents | JsonRpcMethodsFromChild> {
    static readonly version: "0.3" | "0.4" | "0.5" | "0.6";
    static readonly ERROR = MetaframeEvents.Error;
    static readonly CONNECTED = MetaframeEvents.Connected;
    static readonly INPUT = MetaframeEvents.Input;
    static readonly INPUTS = MetaframeEvents.Inputs;
    static readonly MESSAGE = MetaframeEvents.Message;
    static deserializeInputs: (inputs: MetaframeInputMap) => Promise<MetaframeInputMap>;
    static serializeInputs: (inputs: MetaframeInputMap) => Promise<MetaframeInputMap>;
    _inputPipeValues: MetaframeInputMap;
    _outputPipeValues: MetaframeInputMap;
    _parentId: MetapageId | undefined;
    _parentVersion: VersionsMetapage | undefined;
    _isIframe: boolean;
    _state: MetaframeLoadingState;
    _messageSendCount: number;
    debug: boolean;
    color: string | undefined;
    plugin: MetaframePlugin | undefined;
    isInputOutputBlobSerialization: boolean;
    id: string;
    constructor(options?: MetaframeOptions);
    _resolveSetupIframeServerResponse(params: SetupIframeServerResponseData): void;
    connected(): Promise<void>;
    addListenerReturnDisposer(event: MetaframeEvents | JsonRpcMethodsFromChild, listener: ListenerFn<any[]>): () => void;
    log(o: any, color?: string, backgroundColor?: string): void;
    warn(o: any): void;
    error(err: any): void;
    logInternal(o: any, color?: string, backgroundColor?: string): void;
    dispose(): void;
    addListener(event: MetaframeEvents | JsonRpcMethodsFromChild, listener: ListenerFn<any[]>): this;
    onInput(pipeId: MetaframePipeId, listener: any): () => void;
    onInputs(listener: (m: MetaframeInputMap) => void): () => void;
    setInput(pipeId: MetaframePipeId, blob: any): void;
    setInputs(inputs: MetaframeInputMap): Promise<void>;
    setInternalInputsAndNotify(inputs: MetaframeInputMap): Promise<void>;
    getInput(pipeId: MetaframePipeId): any;
    getInputs(): MetaframeInputMap;
    setOutput(pipeId: MetaframePipeId, updateBlob: any): void;
    setOutputs(outputs: MetaframeInputMap): Promise<void>;
    disableNotifyOnHashUrlChange(): void;
    _onHashUrlChange(_: any): void;
    sendRpc(method: JsonRpcMethodsFromChild, params: any): void;
    onMessage(e: MessageEvent): void;
}
export declare class MetaframePlugin {
    _metaframe: Metaframe;
    constructor(metaframe: Metaframe);
    requestState(): void;
    onState(listener: (_: any) => void): () => void;
    getState(): any;
    setState(state: any): void;
    onDefinition(listener: (a: any) => void): () => void;
    setDefinition(definition: any): void;
    getDefinition(): any;
}
//# sourceMappingURL=Metaframe.d.ts.map