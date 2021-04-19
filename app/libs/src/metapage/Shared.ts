import {EventEmitter} from "eventemitter3";
import {
  JsonRpcMethodsFromParent,
  OtherEvents,
} from "./v0_3/JsonRpcMethods";

export enum MetapageEvents {
  Inputs = "inputs",
  Outputs = "outputs",
  State = "state",
  Definition = "definition",
  Error = "error"
}

export const isIframe = (): boolean => {
  //http://stackoverflow.com/questions/326069/how-to-identify-if-a-webpage-is-being-loaded-inside-an-iframe-or-directly-into-t
  try {
    return window !== window.top;
  } catch (ignored) {
    return false;
  }
};

export class MetapageShared extends EventEmitter<MetapageEvents | JsonRpcMethodsFromParent | OtherEvents> {
  public error(err: any) {
    throw 'Subclass should implement';
  }
};
