"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageCache = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("./logger");
const CACHE_FILE = path_1.default.join(__dirname, '../cache.json');
const CACHE_EXPIRY_HOURS = 24;
class ImageCache {
    constructor() {
        this.cache = new Map();
        this.cacheLoaded = false;
        this.loadCache();
    }
    loadCache() {
        (0, logger_1.logFunctionStart)('loadCache');
        try {
            if (fs_1.default.existsSync(CACHE_FILE)) {
                const cacheData = JSON.parse(fs_1.default.readFileSync(CACHE_FILE, 'utf8'));
                const now = Date.now();
                const expiryTime = CACHE_EXPIRY_HOURS * 60 * 60 * 1000;
                for (const [key, value] of Object.entries(cacheData)) {
                    const cachedData = value;
                    if (now - cachedData.timestamp < expiryTime) {
                        this.cache.set(key, cachedData);
                    }
                }
                (0, logger_1.logFunctionEnd)('loadCache', {
                    loadedEntries: this.cache.size,
                    expiredEntries: Object.keys(cacheData).length - this.cache.size
                });
            }
            else {
                (0, logger_1.logFunctionEnd)('loadCache', { message: 'No cache file found, starting with empty cache' });
            }
        }
        catch (error) {
            (0, logger_1.logError)('loadCache', error);
        }
        this.cacheLoaded = true;
    }
    saveCache() {
        (0, logger_1.logFunctionStart)('saveCache');
        try {
            const cacheData = {};
            for (const [key, value] of this.cache.entries()) {
                cacheData[key] = value;
            }
            fs_1.default.writeFileSync(CACHE_FILE, JSON.stringify(cacheData, null, 2));
            (0, logger_1.logFunctionEnd)('saveCache', { savedEntries: this.cache.size });
        }
        catch (error) {
            (0, logger_1.logError)('saveCache', error);
        }
    }
    get(requestHash) {
        if (!this.cacheLoaded) {
            this.loadCache();
        }
        const cached = this.cache.get(requestHash);
        if (!cached) {
            return null;
        }
        const now = Date.now();
        const expiryTime = CACHE_EXPIRY_HOURS * 60 * 60 * 1000;
        if (now - cached.timestamp > expiryTime) {
            this.cache.delete(requestHash);
            this.saveCache();
            return null;
        }
        return cached;
    }
    set(requestHash, messageId, fileId) {
        if (!this.cacheLoaded) {
            this.loadCache();
        }
        const cachedData = {
            messageId,
            fileId,
            timestamp: Date.now(),
            requestHash,
        };
        this.cache.set(requestHash, cachedData);
        this.saveCache();
        (0, logger_1.logFunctionEnd)('set', { requestHash, messageId, fileId });
    }
    clear() {
        this.cache.clear();
        if (fs_1.default.existsSync(CACHE_FILE)) {
            fs_1.default.unlinkSync(CACHE_FILE);
        }
        (0, logger_1.logFunctionEnd)('clear', { message: 'Cache cleared' });
    }
    getStats() {
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
exports.ImageCache = ImageCache;
//# sourceMappingURL=cache.js.map