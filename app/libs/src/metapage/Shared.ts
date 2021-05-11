import {EventEmitter} from "eventemitter3";
import {
  JsonRpcMethodsFromParent,
} from "./v0_3/JsonRpcMethods";

export enum MetapageEvents {
  Inputs = "inputs",
  Outputs = "outputs",
  State = "state",
  Definition = "definition",
  Error = "error",
  // when a metaframe wants to tell the metapage of the new URL (for saving state/config)
  UrlHashUpdate = "urlhashupdate",
  // general event, all events are emitted in their raw form to this namespace
  Message = "Message",
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
