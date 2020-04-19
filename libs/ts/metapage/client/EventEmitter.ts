type Function = any;

export class EventEmitter extends EventTarget {
  // _events: {
  //   [key: string]: Function[]
  // } = {};

  constructor() {
    super();
    this.on = this.on.bind(this);
    // this.isListeners = this.isListeners.bind(this);
    this.addEventListener = this.addEventListener.bind(this);
    this.once = this.once.bind(this);
    // this.removeEventListener = this.removeEventListener.bind(this);
    // this.emit = this.emit.bind(this);
    // this.dispose = this.dispose.bind(this);

  }

  on(event : string, listener : Function): () => void {
    return this.addEventListener(event, listener);
  }

  // isListeners(event : string): boolean {
  //   return this._events.hasOwnProperty(event)
  //     ? this._events[event].length > 0
  //     : false;
  // }

  addEventListener(event : string, listener : Function): () => void {
    super.addEventListener(event, listener);
    const disposer = () => {
      super.removeEventListener(event, listener);
    }
    return disposer;
  }

  once(event : string, listener : Function): () => void {
    let g :()=>void;
    g = function () {
      var args = arguments;
      removeEventListener(event, g);
      listener.apply(null, args);
    };
    return this.addEventListener(event, g);
  }

  // removeEventListener(event : string, listener : Function): void {
  //   if (event in this._events) {
  //     const arr = this._events[event];
  //     const index = arr.indexOf(listener);
  //     if (index > -1) {
  //       arr.splice(index, 1);
  //     }
  //   }
  // }

  // emit(event : string, val1? : any, val2? : any, val3? : any, val4? : any): void {
  //   const args: any[] = [].slice.call(arguments, 1);

  //   if (this._events.hasOwnProperty(event)) {
  //     const listeners: Function[] = this._events[event].slice(0);
  //     // listeners.forEach(listener => listener.apply(null, args));
  //     listeners.forEach(listener => {
  //       console.log('listener', listener);
  //       listener.apply(null, args);
  //     });
  //   }
  // }
}
