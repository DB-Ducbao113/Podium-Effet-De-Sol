export interface CacheEntry<T> {
  storedAt: number;
  payload: T;
}

export class BoundedCache<T> {
  private readonly entries = new Map<string, CacheEntry<T>>();

  constructor(private readonly maximumEntries: number) {}

  get(key: string): CacheEntry<T> | undefined {
    return this.entries.get(key);
  }

  set(key: string, payload: T, storedAt = Date.now()): void {
    this.entries.delete(key);
    this.entries.set(key, { storedAt, payload });
    while (this.entries.size > this.maximumEntries) {
      const oldest = this.entries.keys().next();
      if (oldest.done) break;
      this.entries.delete(oldest.value);
    }
  }
}
