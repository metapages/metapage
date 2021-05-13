// https://gist.github.com/RickCarlino/41b8ddd36e41e381c132bbfcd1c31f3a

/** A string specifying the version of the JSON-RPC protocol. MUST be exactly "2.0". */
export type JsonRpcVersion = "2.0";

/** Method names that begin with the word rpc followed by a period character
 * (U+002E or ASCII 46) are reserved for rpc-internal methods and extensions
 *  and MUST NOT be used for anything else. */
export type JsonRpcReservedMethod = string;

/** An identifier established by the Client that MUST contain a string, Number,
 *  or NULL value if included. If it is not included it is assumed to be a
 *  notification. The value SHOULD normally not be Null and Numbers SHOULD
 *  NOT contain fractional parts [2] */
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
  /** Must be an integer */
  code: number;
  message: string;
  data?: T;
}

//
// PRE-DEFINED ERROR CODES
//
//
/** An error occurred on the server while parsing the JSON text. */
export const PARSE_ERROR = -32700;
/** The JSON sent is not a valid Request object. */
export const INVALID_REQUEST = -32600;
/** The method does not exist / is not available. */
export const METHOD_NOT_FOUND = -32601;
/** Invalid method parameter(s). */
export const INVALID_PARAMS = -32602;
/** Internal JSON-RPC error. */
export const INTERNAL_ERROR = -32603;

//
// TYPE GUARDS (for convinience)
//
//
/** Determine if data is a properly formatted JSONRPC 2.0 ID. */
export function isJsonRpcId(input: JsonRpcId | any): input is JsonRpcId {
  switch (typeof input) {
    case "string":
      return true;
    case "number":
      return input % 1 != 0;
    case "object":
      let isNull = input === null;
      if (isNull) {
        console.warn("Use of null ID in JSONRPC 2.0 is discouraged.");
        return true;
      } else {
        return false;
      }
    default:
      return false;
  }
}
