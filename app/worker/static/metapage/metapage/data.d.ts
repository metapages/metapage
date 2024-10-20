import { MetaframeInputMap } from "./v0_4";
export declare const serializeInputs: (inputs: MetaframeInputMap) => Promise<MetaframeInputMap>;
export declare const deserializeInputs: (inputs: MetaframeInputMap) => Promise<MetaframeInputMap>;
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
export declare const possiblySerializeValueToDataref: <T>(value: T) => Promise<DataRefSerialized | T>;
export declare const possiblyDeserializeDatarefToValue: (value: any) => any;
//# sourceMappingURL=data.d.ts.map