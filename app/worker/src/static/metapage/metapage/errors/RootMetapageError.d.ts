type RootMetapageErrorParams = {
    message: string;
    metaframeErrorUrl?: string;
};
export declare class RootMetapageError extends Error {
    metaframeErrorUrl: string | undefined;
    constructor(params: RootMetapageErrorParams);
}
export {};
//# sourceMappingURL=RootMetapageError.d.ts.map