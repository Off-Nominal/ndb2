import EventEmitter from "events";

// WIP
export class TypedEventEmitter extends EventEmitter {
  private _untypedOn = this.on;
  private _untypedEmit = this.emit;

  constructor(private events) {
    super();
  }

  public on<K extends keyof typeof this.events>(
    event: K,
    listener: (typeof this.events)[K]
  ): this {
    return this._untypedOn(event, listener);
  }

  public emit<K extends keyof typeof this.events>(
    event: K,
    ...args: Parameters<(typeof this.events)[typeof event]>
  ): boolean {
    return this._untypedEmit(event, ...args);
  }
}
