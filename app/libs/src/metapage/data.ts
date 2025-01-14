import { MetaframeInputMap } from "./v0_4";
import { encode, decode } from "base64-arraybuffer";
import { create } from 'mutative';

/**
 * Modifies in place!!!
 * @param inputs
 * @returns
 */
export const serializeInputs = async (
  inputs: MetaframeInputMap
): Promise<MetaframeInputMap> => {
  // only serialize one level deep
  return create<MetaframeInputMap>(inputs, async (draft: MetaframeInputMap) => {
    for (const key of Object.keys(inputs)) {
      const maybeNewObject = await possiblySerializeValueToDataref(inputs[key]);
      draft[key] = maybeNewObject;
      return draft;
    }
  });
};

/**
 * Modifies in place!!!
 * @param inputs
 * @returns
 */
export const deserializeInputs = async (
  inputs: MetaframeInputMap
): Promise<MetaframeInputMap> => {
  // only deserialize one level deep
  return create<MetaframeInputMap>(inputs, async (draft: MetaframeInputMap) => {
    for (const key of Object.keys(inputs)) {
      const maybeNewObject = await possiblyDeserializeDatarefToValue(inputs[key]);
      draft[key] = maybeNewObject;
      return draft;
    }
  });
};

export type DataRefSerialized = {
  // This means it's a serialized DataRef
  _s: true;
  // constructor
  _c: string;
  // value is base64 encoded
  value: string;
  size: number;
};

export type DataRefSerializedTypedArray = DataRefSerialized & {
  // Typed arrays are from ArrayBufferView
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

export const valueToFile = async (value: any, fileName: string, options?: FilePropertyBag): Promise<File> => {
  value = possiblyDeserializeDatarefToValue(value);
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
      options.type = (value as File).type;
    }
    return new File([buffer], fileName, options);
  }
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
    const typedValue = value as ArrayBufferView;
    return new File([typedValue.buffer], fileName, options);
  }
  if (typeof(value) === "string") {
    var blob = new Blob([value], { type: 'text/plain' });
    options.type = "text/plain";
    return new File([blob], fileName, options);
  }
  if (typeof(value) === "object") {
    const blob = new Blob([JSON.stringify(value)], {
      type: 'application/json',
    });
    options.type = "application/json";
    return new File([blob], fileName, options);
  }

  // assume it's a string
  var blob = new Blob([value as string], { type: 'text/plain' });
  options.type = "text/plain";
  return new File([blob], fileName, options);
};

export const possiblySerializeValueToDataref = async <T>(
  value: T
): Promise<T | DataRefSerialized> => {
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
    const typedValue = value as ArrayBufferView;
    const replacement: DataRefSerializedTypedArray = {
      _s: true,
      _c: value.constructor.name,
      value: encode(typedValue.buffer),
      byteLength: typedValue.byteLength,
      byteOffset: typedValue.byteOffset,
      size: typedValue.byteLength,
    };
    return Promise.resolve(replacement);
  } else if (value instanceof File) {
    const typedValue = value as File;
    const arrayBuffer = await typedValue.arrayBuffer();
    const replacement: DataRefSerializedFile = {
      _s: true,
      _c: File.name,
      value: encode(arrayBuffer),
      name: typedValue.name,
      fileType: typedValue.type,
      lastModified: typedValue.lastModified,
      size: arrayBuffer.byteLength,
    };
    return replacement;
  } else if (value instanceof Blob) {
    const typedValue = value as Blob;
    const arrayBuffer = await typedValue.arrayBuffer();
    const replacement: DataRefSerializedBlob = {
      _s: true,
      _c: Blob.name,
      value: encode(arrayBuffer),
      fileType: typedValue.type,
      size: arrayBuffer.byteLength,
    };
    return replacement;
  } else if (value instanceof ArrayBuffer) {
    const typedValue = value as ArrayBuffer;
    const replacement: DataRefSerialized = {
      _s: true,
      _c: ArrayBuffer.name,
      value: encode(typedValue),
      size: typedValue.byteLength,
    };
    return Promise.resolve(replacement);
  }
  return Promise.resolve(value);
};

export const possiblyDeserializeDatarefToValue = (value: any): any => {
  if (
    !(
      value &&
      typeof value === "object" &&
      (value as DataRefSerialized)._s === true
    )
  ) {
    return value;
  }
  const serializedRef = value as DataRefSerialized;
  const _c: string = serializedRef._c;
  if (_c === Blob.name) {
    const serializedRefBlob = value as DataRefSerializedBlob;
    const blob = new Blob(
      [decode(serializedRef.value)],
      {
        type: serializedRefBlob.fileType,
      }
    );
    return blob;
  } else if (_c === File.name) {
    const serializedRefFile = value as DataRefSerializedFile;
    const file = new File(
      [decode(serializedRef.value)],
      serializedRefFile.name,
      {
        type: serializedRefFile.fileType,
        lastModified: serializedRefFile.lastModified,
      }
    );
    return file;
  } else if (_c === ArrayBuffer.name) {
    const arrayBuffer: ArrayBuffer = decode(serializedRef.value);
    return arrayBuffer;
  }
  // Assume typed array
  const serializedRefTypedArray = value as DataRefSerializedTypedArray;

  const arrayBuffer: ArrayBuffer = decode(
    serializedRefTypedArray.value
  );
  const constructorName: string = serializedRefTypedArray._c;

  try {
    // @ts-ignore
    const typedArray: ArrayBufferView = new globalThis[constructorName](
      arrayBuffer,
      // serializedRefTypedArray.byteOffset,
      // serializedRefTypedArray.byteLength
    );
    return typedArray;
  } catch (e) {}
  return value;
};

export const possiblyDeserializeDatarefToFile = (value: any): File | undefined => {
  if (
    !(
      value &&
      typeof value === "object" &&
      (value as DataRefSerialized)._s === true
    )
  ) {
    return undefined;
  }
  const serializedRef = value as DataRefSerialized;
  const _c: string = serializedRef._c;
  if (_c === Blob.name) {
    const serializedRefBlob = value as DataRefSerializedBlob;
    const blob = new Blob(
      [decode(serializedRef.value)],
      {
        type: serializedRefBlob.fileType,
      }
    );
    return new File([blob], 'file', {
        type: blob.type,
    });
  } else if (_c === File.name) {
    const serializedRefFile = value as DataRefSerializedFile;
    const file = new File(
      [decode(serializedRef.value)],
      serializedRefFile.name,
      {
        type: serializedRefFile.fileType,
        lastModified: serializedRefFile.lastModified,
      }
    );
    return file;
  } else if (_c === ArrayBuffer.name) {
    const arrayBuffer: ArrayBuffer = decode(serializedRef.value);
    return new File(
      [arrayBuffer],
      "file",
      {
        type: "application/octet-stream",
      }
    );
  }
  // Assume typed array
  const serializedRefTypedArray = value as DataRefSerializedTypedArray;
  const arrayBuffer: ArrayBuffer = decode(
    serializedRefTypedArray.value
  );
  const constructorName: string = serializedRefTypedArray._c;

  try {
    // @ts-ignore
    const typedArray: ArrayBufferView = new globalThis[constructorName](
      arrayBuffer,
    );
    return new File(
      [typedArray],
      "file",
      {
        type: "application/octet-stream",
      }
    );
  } catch (e) {}
  return undefined;
};
