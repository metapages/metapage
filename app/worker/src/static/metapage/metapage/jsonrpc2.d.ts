export type JsonRpcVersion = "2.0";
export type JsonRpcReservedMethod = string;
export type JsonRpcId = number | string | void;
export interface JsonRpcRequest<T> {
    jsonrpc: JsonRpcVersion;
    method: string;
    id: JsonRpcId;
    params?: T;
}
export interface JsonRpcNotification<T> extends JsonRpcResponse<T> {
    jsonrpc: JsonRpcVersion;
    params?: T;
}
export interface JsonRpcResponse<T> {
    jsonrpc: JsonRpcVersion;
    id: JsonRpcId;
}
export interface JsonRpcSuccess<T> extends JsonRpcResponse<T> {
    result: T;
}
export interface JsonRpcFailure<T> extends JsonRpcResponse<T> {
    error: JsonRpcError<T>;
}
export interface JsonRpcError<T> {
    code: number;
    message: string;
    data?: T;
}
export declare const PARSE_ERROR = -32700;
export declare const INVALID_REQUEST = -32600;
export declare const METHOD_NOT_FOUND = -32601;
export declare const INVALID_PARAMS = -32602;
export declare const INTERNAL_ERROR = -32603;
export declare function isJsonRpcId(input: JsonRpcId | any): input is JsonRpcId;
//# sourceMappingURL=jsonrpc2.d.ts.map