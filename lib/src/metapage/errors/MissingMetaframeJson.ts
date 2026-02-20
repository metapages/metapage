type RootMetapageErrorParams = {
  message: string;
  // If this is set, replace the metaframe iframe.src with this
  // it will show a website that shows the error to the user
  // so it has to be a pretty uncoverable error
  metaframeErrorUrl?: string;
};

export class RootMetapageError extends Error {
  metaframeErrorUrl: string | undefined;

  constructor(params: RootMetapageErrorParams) {
    super(params.message);
    this.name = "RootMetapageError";
  }
}
