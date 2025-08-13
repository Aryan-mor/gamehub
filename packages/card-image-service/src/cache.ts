import fs from 'fs';
import path from 'path';
import { CachedImageData } from './types';
import { logFunctionStart, logFunctionEnd, logError } from './logger';

const CACHE_FILE = path.join(__dirname, '../cache.json');
const CACHE_EXPIRY_HOURS = 24; // Cache expires after 24 hours

export class ImageCache {
  private cache: Map<string, CachedImageData> = new Map();
  private cacheLoaded = false;

  constructor() {
    this.loadCache();
  }

  private loadCache(): void {
    logFunctionStart('loadCache');
    
    try {
      if (fs.existsSync(CACHE_FILE)) {
        const cacheData = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
        const now = Date.now();
        const expiryTime = CACHE_EXPIRY_HOURS * 60 * 60 * 1000;

        // Filter out expired entries
        for (const [key, value] of Object.entries(cacheData)) {
          const cachedData = value as CachedImageData;
          if (now - cachedData.timestamp < expiryTime) {
            this.cache.set(key, cachedData);
          }
        }

        logFunctionEnd('loadCache', { 
          loadedEntries: this.cache.size,
          expiredEntries: Object.keys(cacheData).length - this.cache.size
        });
      } else {
        logFunctionEnd('loadCache', { message: 'No cache file found, starting with empty cache' });
      }
    } catch (error) {
      logError('loadCache', error as Error);
      // Continue with empty cache if loading fails
    }
    
    this.cacheLoaded = true;
  }

  private saveCache(): void {
    logFunctionStart('saveCache');
    
    try {
      const cacheData: Record<string, CachedImageData> = {};
      for (const [key, value] of this.cache.entries()) {
        cacheData[key] = value;
      }
      
      fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheData, null, 2));
      logFunctionEnd('saveCache', { savedEntries: this.cache.size });
    } catch (error) {
      logError('saveCache', error as Error);
    }
  }

  public get(requestHash: string): CachedImageData | null {
    if (!this.cacheLoaded) {
      this.loadCache();
    }

    const cached = this.cache.get(requestHash);
    if (!cached) {
      return null;
    }

    // Check if cache entry is expired
    const now = Date.now();
    const expiryTime = CACHE_EXPIRY_HOURS * 60 * 60 * 1000;
    
    if (now - cached.timestamp > expiryTime) {
      this.cache.delete(requestHash);
      this.saveCache();
      return null;
    }

    return cached;
  }

  public set(requestHash: string, messageId: string, fileId?: string): void {
    if (!this.cacheLoaded) {
      this.loadCache();
    }

    const cachedData: CachedImageData = {
      messageId,
      fileId,
      timestamp: Date.now(),
      requestHash,
    };

    this.cache.set(requestHash, cachedData);
    this.saveCache();
    
    logFunctionEnd('set', { requestHash, messageId, fileId });
  }

  public remove(requestHash: string): void {
    if (!this.cacheLoaded) {
      this.loadCache();
    }

    const removed = this.cache.delete(requestHash);
    if (removed) {
      this.saveCache();
      logFunctionEnd('remove', { requestHash, message: 'Cache entry removed' });
    } else {
      logFunctionEnd('remove', { requestHash, message: 'Cache entry not found' });
    }
  }

  public clear(): void {
    this.cache.clear();
    if (fs.existsSync(CACHE_FILE)) {
      fs.unlinkSync(CACHE_FILE);
    }
    logFunctionEnd('clear', { message: 'Cache cleared' });
  }

  public getStats(): { totalEntries: number; expiredEntries: number } {
    const now = Date.now();
    const expiryTime = CACHE_EXPIRY_HOURS * 60 * 60 * 1000;
    let expiredCount = 0;

    for (const [, value] of this.cache.entries()) {
      if (now - value.timestamp > expiryTime) {
        expiredCount++;
      }
    }

    return {
      totalEntries: this.cache.size,
      expiredEntries: expiredCount,
    };
  }
} 