import { MetaframeInputMap } from "./v0_4";
import { decode } from "base64-arraybuffer";
import {
  typedArrayToDataUrl,
  bufferToDataUrl,
  dataUrlToBuffer,
  dataUrlToTypedArray,
  isDataUrl,
  getParameters,
  getMimeType,
  type TypedArrayType,
} from "@metapages/dataref";

/** Cheap sync check: does this value need serialization? */
const needsSerialization = (value: any): boolean =>
  value instanceof ArrayBuffer ||
  value instanceof Blob || // File extends Blob, so this catches both
  ArrayBuffer.isView(value);

/** Cheap sync check: does this value need deserialization? */
const needsDeserialization = (value: any): boolean => {
  if (typeof value === "string") return value.startsWith("data:");
  if (value && typeof value === "object") {
    if (value._s === true && value._c) return true;
    if (value.ref === "base64" && value.c) return true;
  }
  return false;
};

/**
 * Serialize all values in inputs (one level deep).
 * Binary types (TypedArray, ArrayBuffer, Blob, File) become data URL strings.
 * Returns the original object if nothing needs serialization.
 */
export const serializeInputs = async (
  inputs: MetaframeInputMap,
): Promise<MetaframeInputMap> => {
  const keys = Object.keys(inputs);
  const keysToSerialize: string[] = [];
  for (const key of keys) {
    if (needsSerialization(inputs[key])) keysToSerialize.push(key);
  }
  if (keysToSerialize.length === 0) return inputs;

  const result: MetaframeInputMap = { ...inputs };
  for (const key of keysToSerialize) {
    result[key] = await possiblySerializeValueToDataref(inputs[key]);
  }
  return result;
};

/**
 * Deserialize all values in inputs (one level deep).
 * Handles v2 data URLs, legacy metapage _s/_c format, and dataref v1 ref/c format.
 * Returns the original object if nothing needs deserialization.
 */
export const deserializeInputs = async (
  inputs: MetaframeInputMap,
): Promise<MetaframeInputMap> => {
  const keys = Object.keys(inputs);
  const keysToDeserialize: string[] = [];
  for (const key of keys) {
    if (needsDeserialization(inputs[key])) keysToDeserialize.push(key);
  }
  if (keysToDeserialize.length === 0) return inputs;

  const result: MetaframeInputMap = { ...inputs };
  for (const key of keysToDeserialize) {
    result[key] = await possiblyDeserializeDatarefToValue(inputs[key]);
  }
  return result;
};

// Legacy types kept for backwards-compatible deserialization
export type DataRefSerialized = {
  _s: true;
  _c: string;
  value: string;
  size: number;
};

export type DataRefSerializedTypedArray = DataRefSerialized & {
  byteLength: number;
  byteOffset: number;
};

export type DataRefSerializedBlob = DataRefSerialized & {
  fileType?: string;
};

export type DataRefSerializedFile = DataRefSerializedBlob & {
  name: string;
  lastModified?: number;
};

const TYPED_ARRAY_NAMES: Set<string> = new Set([
  "Int8Array",
  "Uint8Array",
  "Uint8ClampedArray",
  "Int16Array",
  "Uint16Array",
  "Int32Array",
  "Uint32Array",
  "Float32Array",
  "Float64Array",
  "BigInt64Array",
  "BigUint64Array",
]);

/**
 * Serialize a value to a data URL string if it's a binary type.
 * Non-binary values pass through unchanged.
 */
export const possiblySerializeValueToDataref = async <T>(
  value: T,
): Promise<T | string> => {
  if (
    value instanceof Int8Array ||
    value instanceof Uint8Array ||
    value instanceof Uint8ClampedArray ||
    value instanceof Int16Array ||
    value instanceof Uint16Array ||
    value instanceof Int32Array ||
    value instanceof Uint32Array ||
    value instanceof Float32Array ||
    value instanceof Float64Array
  ) {
    return typedArrayToDataUrl(value, value.constructor.name as TypedArrayType);
  } else if (value instanceof File) {
    const arrayBuffer = await value.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const base64 = btoa(String.fromCharCode(...bytes));
    const mimeType = value.type || "application/octet-stream";
    const name = encodeURIComponent(value.name);
    return `data:${mimeType};file=true;name=${name};lastModified=${value.lastModified};base64,${base64}`;
  } else if (value instanceof Blob) {
    const arrayBuffer = await value.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const base64 = btoa(String.fromCharCode(...bytes));
    const mimeType = value.type || "application/octet-stream";
    return `data:${mimeType};blob=true;base64,${base64}`;
  } else if (value instanceof ArrayBuffer) {
    return bufferToDataUrl(value);
  }
  return value;
};

/**
 * Deserialize a value from any supported format:
 * 1. v2 data URL strings (new format)
 * 2. Legacy metapage format ({ _s: true, _c: "..." })
 * 3. dataref v1 format ({ ref: "base64", c: "..." })
 * 4. Anything else passes through unchanged
 */
export const possiblyDeserializeDatarefToValue = async (
  value: any,
): Promise<any> => {
  // 1. v2 data URL string
  if (isDataUrl(value)) {
    return deserializeDataUrl(value);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  // 2. Legacy metapage format: { _s: true, _c: "ConstructorName", value: "base64..." }
  if (value._s === true && value._c) {
    return deserializeLegacyMetapage(value);
  }

  // 3. dataref v1 format: { ref: "base64", c: "ConstructorName", value: "base64..." }
  if (value.ref === "base64" && value.c) {
    return deserializeDatarefV1(value);
  }

  // 4. Pass through
  return value;
};

/**
 * Attempt to deserialize a value to a File. Returns undefined if the value
 * is not a recognized serialized format.
 */
export const possiblyDeserializeDatarefToFile = async (
  value: any,
): Promise<File | undefined> => {
  const deserialized = await possiblyDeserializeDatarefToValue(value);
  if (deserialized instanceof File) {
    return deserialized;
  }
  if (deserialized instanceof Blob) {
    return new File([deserialized], "file", { type: deserialized.type });
  }
  if (deserialized instanceof ArrayBuffer) {
    return new File([deserialized], "file", {
      type: "application/octet-stream",
    });
  }
  if (ArrayBuffer.isView(deserialized)) {
    return new File([deserialized], "file", {
      type: "application/octet-stream",
    });
  }
  return undefined;
};

export const valueToFile = async (
  value: any,
  fileName: string,
  options?: FilePropertyBag,
): Promise<File> => {
  value = await possiblyDeserializeDatarefToValue(value);
  options = options || {};
  if (!options.type) {
    options.type = "application/octet-stream";
  }

  if (value instanceof ArrayBuffer) {
    return new File([value], fileName, options);
  }
  if (value instanceof File || value instanceof Blob) {
    const buffer = await value.arrayBuffer();
    if (value instanceof File) {
      options.type = value.type;
    }
    return new File([buffer], fileName, options);
  }
  if (ArrayBuffer.isView(value)) {
    return new File([value.buffer], fileName, options);
  }
  if (typeof value === "string") {
    const blob = new Blob([value], { type: "text/plain" });
    options.type = "text/plain";
    return new File([blob], fileName, options);
  }
  if (typeof value === "object") {
    const blob = new Blob([JSON.stringify(value)], {
      type: "application/json",
    });
    options.type = "application/json";
    return new File([blob], fileName, options);
  }

  const blob = new Blob([value as string], { type: "text/plain" });
  options.type = "text/plain";
  return new File([blob], fileName, options);
};

// --- Internal helpers ---

async function deserializeDataUrl(dataUrl: string): Promise<any> {
  const params = getParameters(dataUrl);

  // TypedArray: has "type" parameter (e.g. type=Float32Array)
  if (params.type && TYPED_ARRAY_NAMES.has(params.type)) {
    return dataUrlToTypedArray(dataUrl);
  }

  // File: has "file=true" parameter
  if (params.file === "true") {
    const name = params.name ? decodeURIComponent(params.name) : "file";
    const lastModified = params.lastModified
      ? parseInt(params.lastModified, 10)
      : undefined;
    const mimeType = getMimeType(dataUrl);
    const buffer = await dataUrlToBuffer(dataUrl);
    return new File([buffer], name, { type: mimeType, lastModified });
  }

  // Blob: has "blob=true" parameter
  if (params.blob === "true") {
    const mimeType = getMimeType(dataUrl);
    const buffer = await dataUrlToBuffer(dataUrl);
    return new Blob([buffer], { type: mimeType });
  }

  // Plain ArrayBuffer
  return dataUrlToBuffer(dataUrl);
}

function deserializeLegacyMetapage(value: DataRefSerialized): any {
  const _c = value._c;
  if (_c === "Blob") {
    const v = value as DataRefSerializedBlob;
    return new Blob([decode(value.value)], { type: v.fileType });
  } else if (_c === "File") {
    const v = value as DataRefSerializedFile;
    return new File([decode(value.value)], v.name, {
      type: v.fileType,
      lastModified: v.lastModified,
    });
  } else if (_c === "ArrayBuffer") {
    return decode(value.value);
  }
  // Typed array
  const arrayBuffer = decode(value.value);
  if (TYPED_ARRAY_NAMES.has(_c)) {
    try {
      // @ts-ignore
      return new globalThis[_c](arrayBuffer);
    } catch (_) {}
  }
  return value;
}

function deserializeDatarefV1(value: {
  ref: string;
  c: string;
  value: string;
  [key: string]: any;
}): any {
  const _c = value.c;
  if (_c === "Blob") {
    return new Blob([decode(value.value)], {
      type: value.fileType || undefined,
    });
  } else if (_c === "File") {
    return new File([decode(value.value)], value.name || "file", {
      type: value.fileType || undefined,
      lastModified: value.lastModified || undefined,
    });
  } else if (_c === "ArrayBuffer") {
    return decode(value.value);
  }
  // Typed array
  const arrayBuffer = decode(value.value);
  if (TYPED_ARRAY_NAMES.has(_c)) {
    try {
      // @ts-ignore
      return new globalThis[_c](arrayBuffer);
    } catch (_) {}
  }
  return value;
}
