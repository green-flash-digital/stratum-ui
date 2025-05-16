import type { Draft } from "immer";
import { produce } from "immer";

export type SetAsyncStateQueueState<T extends Record<string, unknown>> = (
  fn: (draft: Draft<T>) => void,
  options?: { shouldLog?: boolean }
) => void;

/**
 * A stateful async-safe queue that supports both synchronous and asynchronous consumption of state updates.
 *
 * This class is ideal for managing centralized state where updates are queued, logged, and dispatched in a
 * predictable order — while still allowing consumers to subscribe to changes (like in React) or iterate
 * over updates asynchronously (like in a worker or streaming pipeline).
 *
 * @template T - The shape of the state object being tracked.
 *
 * Features:
 * - Uses Immer to apply state mutations in an immutable, draft-safe way.
 * - Emits state updates to both:
 *   - **React-style listeners** via `.subscribe()`
 *   - **Async consumers** via `for await...of`
 * - All state mutations are queued and optionally logged via `Isoscribe`.
 * - Queue can be consumed using the standard async iteration protocol (`Symbol.asyncIterator`).
 *
 * @example
 * const queue = new AsyncStateQueue({ count: 0 }, logger);
 * queue.setState(draft => { draft.count++ });
 *
 * queue.subscribe(() => {
 *   console.log("State changed:", queue.getSnapshot());
 * });
 *
 * for await (const state of queue) {
 *   console.log("Received async state:", state);
 * }
 */
export class AsyncStateQueue<T> implements AsyncIterable<T> {
  private _queue: T[] = [];
  private _resolvers: ((value: IteratorResult<T>) => void)[] = [];
  private _listeners = new Set<() => void>();
  private _closed = false;
  private _state: T;

  constructor(initialState: T) {
    this._state = initialState;
    this.subscribe = this.subscribe.bind(this);
    this.getSnapshot = this.getSnapshot.bind(this);
    this.getQueue = this.getQueue.bind(this);
    this.setState = this.setState.bind(this);
  }

  setState(fn: (draft: Draft<typeof this._state>) => void) {
    this._state = produce(this._state, fn);
    this.dispatchState();
  }

  dispatchState() {
    this._enqueue(this._state);
  }

  getQueue() {
    return this._queue;
  }

  getState() {
    return this._state;
  }

  private _enqueue(item: T) {
    this._state = item;

    // For async consumers
    if (this._resolvers.length > 0) {
      const resolve = this._resolvers.shift()!;
      resolve({ value: item, done: false });
    } else {
      this._queue.push(item);
    }

    // Notify React-style subscribers
    this._listeners.forEach((fn) => fn());
  }

  getSnapshot(): T {
    return this._state;
  }

  subscribe(callback: () => void): () => void {
    this._listeners.add(callback);
    return () => this._listeners.delete(callback);
  }

  [Symbol.asyncIterator](): AsyncIterator<T> {
    return this;
  }

  async next(): Promise<IteratorResult<T>> {
    if (this._queue.length > 0) {
      return { value: this._queue.shift()!, done: false };
    }
    if (this._closed) {
      return { value: undefined as unknown, done: true };
    }
    return new Promise((resolve) => this._resolvers.push(resolve));
  }
}
