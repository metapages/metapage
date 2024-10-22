import { MetapageId, Url } from './core';
import { MetaframeInstance } from './metaframe';
import { VersionsMetapage } from './versions';
export interface MetapageOptions {
    id?: MetapageId;
    color?: string;
}
export type MetapageMetadata = Partial<{
    name: string;
    description: string;
    author: string;
    image: string;
    keywords: string[];
    layouts: {
        [key in string]: any;
    };
    sha256: string;
}>;
export interface MetapageDefinitionV3 {
    id?: MetapageId;
    version: VersionsMetapage;
    metaframes: {
        [key: string]: MetaframeInstance;
    };
    meta?: MetapageMetadata;
    plugins?: Url[];
}
export type MetaframeInputMap = {
    [key: string]: any;
};
export interface MetapageInstanceInputs {
    [key: string]: MetaframeInputMap;
}
//# sourceMappingURL=metapage.d.ts.map