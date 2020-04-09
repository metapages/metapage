type Function = any;

export class EventEmitter {
  _events: {
    [key: string]: Function[]
  } = {};

  constructor() {}

  on(event : string, listener : Function): () => void {
    return this.addEventListener(event, listener);
  }

  isListeners(event : string): boolean {
    return this._events.hasOwnProperty(event)
      ? this._events[event].length > 0
      : false;
  }

  addEventListener(event : string, listener : Function): () => void {
    if (!this._events.hasOwnProperty(event)) {
      this._events[event] = [];
    }
    this._events._events[event].push(listener);
    return removeEventListener.bind(event, listener);
  }

  once(event : string, listener : Function): () => void {
    var g;
    g = function () {
      var args = arguments;
      removeEventListener(event, g);
      listener.apply(null, args);
    };
    return this.addEventListener(event, g);
  }

  removeEventListener(event : string, listener : Function): void {
    if (event in this._events) {
      const arr = this._events[event];
      const index = arr.indexOf(listener);
      if (index > -1) {
        arr.splice(index, 1);
      }
    }
  }

  emit(event : string, val1? : any, val2? : any, val3? : any, val4? : any): void {
    const args: any[] = [].slice.call(arguments, 1);

    if (this._events.hasOwnProperty(event)) {
      const listeners: Function[] = this._events[event].slice(0);
      listeners.forEach(listener => listener.apply(null, args));
    }
  }

  dispose() {
    this._events = {};
  }
}
