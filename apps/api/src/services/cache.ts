import { env } from '../config/env.js';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private maxEntries = 250;

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlSeconds = env.API_CACHE_TTL_SECONDS): void {
    if (this.store.size >= this.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) this.store.delete(oldestKey);
    }
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000
    });
  }

  invalidatePrefix(prefix: string): number {
    let removed = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        removed++;
      }
    }
    return removed;
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }
}

export const apiCache = new MemoryCache();

export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds = env.API_CACHE_TTL_SECONDS
): Promise<T> {
  const cached = apiCache.get<T>(key);
  if (cached !== null) return cached;
  const fresh = await fetcher();
  apiCache.set(key, fresh, ttlSeconds);
  return fresh;
}
