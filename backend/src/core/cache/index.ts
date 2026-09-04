// Core Cache Service for Enterprise Restaurant Ecosystem
import { Env } from '../types/database';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
  metadata?: Record<string, any>; // Additional metadata
}

export class CacheService {
  private cache: KVNamespace;
  private defaultTTL: number = 300; // 5 minutes default

  constructor(env: Env) {
    this.cache = env.CACHE;
  }

  // Get value from cache
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.cache.get(key, 'json');
      return value as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  // Set value in cache
  async set<T = any>(key: string, value: T, options?: CacheOptions): Promise<void> {
    try {
      const ttl = options?.ttl || this.defaultTTL;
      const metadata = {
        ...options?.metadata,
        tags: options?.tags || [],
        cachedAt: new Date().toISOString(),
        ttl
      };

      const cacheValue = {
        data: value,
        metadata
      };

      await this.cache.put(key, JSON.stringify(cacheValue), {
        expirationTtl: ttl
      });

      // Store tag mappings for invalidation
      if (options?.tags) {
        await this.storeTagMappings(key, options.tags);
      }
    } catch (error) {
      console.error('Cache set error:', error);
      throw new Error(`Cache set failed: ${error.message}`);
    }
  }

  // Delete value from cache
  async delete(key: string): Promise<void> {
    try {
      await this.cache.delete(key);
      await this.removeTagMappings(key);
    } catch (error) {
      console.error('Cache delete error:', error);
      throw new Error(`Cache delete failed: ${error.message}`);
    }
  }

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    try {
      const value = await this.cache.get(key);
      return value !== null;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  // Clear cache by tags
  async clearByTags(tags: string[]): Promise<void> {
    try {
      for (const tag of tags) {
        const tagKey = `tag:${tag}`;
        const keys = await this.cache.get(tagKey, 'json');
        
        if (keys && Array.isArray(keys)) {
          // Delete all keys associated with this tag
          for (const key of keys) {
            await this.cache.delete(key);
          }
          
          // Clear the tag mapping
          await this.cache.delete(tagKey);
        }
      }
    } catch (error) {
      console.error('Cache clear by tags error:', error);
      throw new Error(`Cache clear by tags failed: ${error.message}`);
    }
  }

  // Clear all cache (use with caution)
  async clear(): Promise<void> {
    try {
      // List all keys and delete them
      const list = this.cache.list();
      const keys = [];
      
      for await (const key of list) {
        keys.push(key.name);
      }

      for (const key of keys) {
        await this.cache.delete(key);
      }
    } catch (error) {
      console.error('Cache clear error:', error);
      throw new Error(`Cache clear failed: ${error.message}`);
    }
  }

  // Get multiple values
  async mget<T = any>(keys: string[]): Promise<Record<string, T | null>> {
    const result: Record<string, T | null> = {};
    
    for (const key of keys) {
      result[key] = await this.get<T>(key);
    }
    
    return result;
  }

  // Set multiple values
  async mset<T = any>(entries: Record<string, T>, options?: CacheOptions): Promise<void> {
    for (const [key, value] of Object.entries(entries)) {
      await this.set(key, value, options);
    }
  }

  // Increment counter
  async increment(key: string, amount: number = 1, options?: CacheOptions): Promise<number> {
    try {
      const current = await this.get<number>(key) || 0;
      const newValue = current + amount;
      await this.set(key, newValue, options);
      return newValue;
    } catch (error) {
      console.error('Cache increment error:', error);
      throw new Error(`Cache increment failed: ${error.message}`);
    }
  }

  // Decrement counter
  async decrement(key: string, amount: number = 1, options?: CacheOptions): Promise<number> {
    return await this.increment(key, -amount, options);
  }

  // Get or set (pattern for cache-aside)
  async getOrSet<T = any>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      // If not in cache, get from factory and cache it
      const value = await factory();
      await this.set(key, value, options);
      return value;
    } catch (error) {
      console.error('Cache getOrSet error:', error);
      throw new Error(`Cache getOrSet failed: ${error.message}`);
    }
  }

  // Cache warming
  async warm(entries: Array<{ key: string; factory: () => Promise<any>; options?: CacheOptions }>): Promise<void> {
    const promises = entries.map(async ({ key, factory, options }) => {
      try {
        const value = await factory();
        await this.set(key, value, options);
      } catch (error) {
        console.error(`Cache warming failed for key ${key}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  // Cache statistics
  async getStats(): Promise<{
    totalKeys: number;
    hitRate?: number;
    memoryUsage?: number;
  }> {
    try {
      const list = this.cache.list();
      let totalKeys = 0;
      
      for await (const key of list) {
        totalKeys++;
      }

      return {
        totalKeys
        // Note: KV doesn't provide detailed stats like hit rate or memory usage
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return { totalKeys: 0 };
    }
  }

  // Private helper methods
  private async storeTagMappings(key: string, tags: string[]): Promise<void> {
    for (const tag of tags) {
      const tagKey = `tag:${tag}`;
      const keys = await this.cache.get(tagKey, 'json') || [];
      
      if (!keys.includes(key)) {
        keys.push(key);
        await this.cache.put(tagKey, JSON.stringify(keys));
      }
    }
  }

  private async removeTagMappings(key: string): Promise<void> {
    // Get the cached value to find its tags
    const value = await this.cache.get(key, 'json');
    if (value?.metadata?.tags) {
      for (const tag of value.metadata.tags) {
        const tagKey = `tag:${tag}`;
        const keys = await this.cache.get(tagKey, 'json') || [];
        
        const index = keys.indexOf(key);
        if (index > -1) {
          keys.splice(index, 1);
          await this.cache.put(tagKey, JSON.stringify(keys));
        }
      }
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const testKey = 'health_check';
      await this.set(testKey, 'ok', { ttl: 10 });
      const value = await this.get(testKey);
      await this.delete(testKey);
      return value === 'ok';
    } catch (error) {
      console.error('Cache health check failed:', error);
      return false;
    }
  }
}
