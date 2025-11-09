import EventEmitter from "node:events";

// Generic type for event maps - ensures all values are functions
// Note: This doesn't require an index signature, allowing interfaces with only explicit keys
export type EventMap = {
  readonly [K: string]: never; // Prevent index signatures
} & {
  [K: string]: (...args: any[]) => any; // But require all values are functions
};

// Helper type to extract event listener signature
type EventListener<
  T extends {
    [K in keyof T]: T[K] extends (...args: any[]) => any ? T[K] : never;
  },
  K extends keyof T
> = T[K];

// Helper type to extract event arguments
type EventArgs<
  T extends {
    [K in keyof T]: T[K] extends (...args: any[]) => any ? T[K] : never;
  },
  K extends keyof T
> = T[K] extends (...args: infer P) => any ? P : never;

/**
 * A typed EventEmitter that ensures type safety for event names and payloads.
 *
 * @template T - An object where keys are event names and values are function signatures
 *
 * @example
 * ```typescript
 * interface MyEvents {
 *   userCreated: (user: User) => void;
 *   userDeleted: (userId: string, reason: string) => void;
 * }
 *
 * const emitter = new TypedEventEmitter<MyEvents>();
 * emitter.on('userCreated', (user) => { ... }); // user is typed as User
 * emitter.emit('userCreated', user); // TypeScript ensures correct arguments
 * ```
 */
export class TypedEventEmitter<
  T extends {
    [K in keyof T]: T[K] extends (...args: any[]) => any ? T[K] : never;
  }
> extends EventEmitter {
  // Store original untyped methods from base class
  private readonly _baseOn = super.on.bind(this);
  private readonly _baseOnce = super.once.bind(this);
  private readonly _baseEmit = super.emit.bind(this);
  private readonly _baseOff = super.off.bind(this);
  private readonly _baseRemoveListener = super.removeListener.bind(this);
  private readonly _baseRemoveAllListeners = super.removeAllListeners.bind(
    this
  );
  private readonly _baseListeners = super.listeners.bind(this);
  private readonly _basePrependListener = super.prependListener.bind(this);
  private readonly _basePrependOnceListener = super.prependOnceListener.bind(
    this
  );

  /**
   * Register a listener for an event
   */
  // @ts-expect-error - Intentionally narrowing the type from `string | symbol` to `keyof T` for strict type safety.
  // This ensures only typed events from the EventMap can be used, causing compile-time errors for untyped events.
  public on<K extends keyof T>(event: K, listener: EventListener<T, K>): this {
    return this._baseOn(
      event as string | symbol,
      listener as (...args: any[]) => void
    );
  }

  /**
   * Register a one-time listener for an event
   */
  // @ts-expect-error - Intentionally narrowing the type from `string | symbol` to `keyof T` for strict type safety.
  // This ensures only typed events from the EventMap can be used, causing compile-time errors for untyped events.
  public once<K extends keyof T>(
    event: K,
    listener: EventListener<T, K>
  ): this {
    return this._baseOnce(
      event as string | symbol,
      listener as (...args: any[]) => void
    );
  }

  /**
   * Emit an event with typed arguments
   */
  // @ts-expect-error - Intentionally narrowing the type from `string | symbol` to `keyof T` for strict type safety.
  // This ensures only typed events from the EventMap can be used, causing compile-time errors for untyped events.
  public emit<K extends keyof T>(
    event: K,
    ...args: EventArgs<T, K> extends any[] ? EventArgs<T, K> : never
  ): boolean {
    return this._baseEmit(event as string | symbol, ...args);
  }

  /**
   * Remove a listener for an event
   */
  // @ts-expect-error - Intentionally narrowing the type from `string | symbol` to `keyof T` for strict type safety.
  // This ensures only typed events from the EventMap can be used, causing compile-time errors for untyped events.
  public off<K extends keyof T>(event: K, listener: EventListener<T, K>): this {
    return this._baseOff(
      event as string | symbol,
      listener as (...args: any[]) => void
    );
  }

  /**
   * Remove a listener for an event (alias for off)
   */
  // @ts-expect-error - Intentionally narrowing the type from `string | symbol` to `keyof T` for strict type safety.
  // This ensures only typed events from the EventMap can be used, causing compile-time errors for untyped events.
  public removeListener<K extends keyof T>(
    event: K,
    listener: EventListener<T, K>
  ): this {
    return this._baseRemoveListener(
      event as string | symbol,
      listener as (...args: any[]) => void
    );
  }

  /**
   * Remove all listeners for an event (or all events if no event specified)
   */
  // @ts-expect-error - Intentionally narrowing the type from `string | symbol` to `keyof T` for strict type safety.
  // This ensures only typed events from the EventMap can be used, causing compile-time errors for untyped events.
  public removeAllListeners(event?: keyof T): this {
    return event
      ? this._baseRemoveAllListeners(event as string | symbol)
      : this._baseRemoveAllListeners();
  }

  /**
   * Get listeners for an event
   */
  // @ts-expect-error - Intentionally narrowing the type from `string | symbol` to `keyof T` for strict type safety.
  // This ensures only typed events from the EventMap can be used, causing compile-time errors for untyped events.
  public listeners<K extends keyof T>(event: K): EventListener<T, K>[] {
    return this._baseListeners(event as string | symbol) as EventListener<
      T,
      K
    >[];
  }

  /**
   * Prepend a listener to the listeners array
   */
  // @ts-expect-error - Intentionally narrowing the type from `string | symbol` to `keyof T` for strict type safety.
  // This ensures only typed events from the EventMap can be used, causing compile-time errors for untyped events.
  public prependListener<K extends keyof T>(
    event: K,
    listener: EventListener<T, K>
  ): this {
    return this._basePrependListener(
      event as string | symbol,
      listener as (...args: any[]) => void
    );
  }

  /**
   * Prepend a one-time listener to the listeners array
   */
  // @ts-expect-error - Intentionally narrowing the type from `string | symbol` to `keyof T` for strict type safety.
  // This ensures only typed events from the EventMap can be used, causing compile-time errors for untyped events.
  public prependOnceListener<K extends keyof T>(
    event: K,
    listener: EventListener<T, K>
  ): this {
    return this._basePrependOnceListener(
      event as string | symbol,
      listener as (...args: any[]) => void
    );
  }
}
