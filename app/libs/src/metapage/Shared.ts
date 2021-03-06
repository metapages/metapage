import { EventEmitter } from "eventemitter3";
import {
  JsonRpcMethodsFromParent,
  MetapageDefinition,
  VersionsMetapage
} from "./v0_4";
import { MetapageEvents } from "./v0_4/events";

export enum MetapageHashParams {
  mp_debug = "mp_debug",
}

export const isIframe = (): boolean => {
  //http://stackoverflow.com/questions/326069/how-to-identify-if-a-webpage-is-being-loaded-inside-an-iframe-or-directly-into-t
  try {
    return window !== window.top;
  } catch (ignored) {
    return false;
  }
};

export class MetapageShared extends EventEmitter<MetapageEvents | JsonRpcMethodsFromParent> {

  // Easier to ensure this value is never null|undefined
  _definition: MetapageDefinition = { version: VersionsMetapage.V0_3, metaframes: {} };

  constructor() {
    super();
    this.getDefinition = this.getDefinition.bind(this);
  }

  public error(err: any) {
    throw 'Subclass should implement';
  }
  public getDefinition(): MetapageDefinition {
    return this._definition;
  }
};
