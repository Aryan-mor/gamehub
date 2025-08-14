import { CachedImageData } from './types';
export declare class ImageCache {
    private cache;
    private cacheLoaded;
    constructor();
    private loadCache;
    private saveCache;
    get(requestHash: string): CachedImageData | null;
    set(requestHash: string, messageId: string, fileId?: string): void;
    remove(requestHash: string): void;
    clear(): void;
    getStats(): {
        totalEntries: number;
        expiredEntries: number;
    };
}
//# sourceMappingURL=cache.d.ts.map