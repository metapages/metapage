import { EventEmitter } from "eventemitter3";
import {
  JsonRpcMethodsFromParent,
} from "./v0_3/JsonRpcMethods";
import {
  MetapageDefinition
} from "./v0_3/all";
import { Versions } from "./MetaLibsVersion";
import { MetapageEvents } from "./MetapageEvents";

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
  _definition: MetapageDefinition = { version: Versions.V0_3, metaframes: {} };

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
