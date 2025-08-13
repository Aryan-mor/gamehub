"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAndSendCard = generateAndSendCard;
exports.generateImageBufferOnly = generateImageBufferOnly;
exports.getCacheStats = getCacheStats;
exports.clearCache = clearCache;
const composer_1 = require("./image/composer");
const cache_1 = require("./cache");
const telegram_1 = require("./telegram");
const config_1 = require("./config");
const logger_1 = require("./logger");
let telegramService = null;
let imageCache = null;
function initializeServices() {
    if (!telegramService || !imageCache) {
        const config = (0, config_1.loadConfig)();
        telegramService = new telegram_1.TelegramService(config);
        imageCache = new cache_1.ImageCache();
    }
}
async function generateAndSendCard(cards, style = 'general', area = 'general', debugTag) {
    (0, logger_1.logFunctionStart)('generateAndSendCard', { cards, style, area, debugTag });
    try {
        initializeServices();
        if (!telegramService || !imageCache) {
            throw new Error('Failed to initialize services');
        }
        const options = {
            cards,
            style,
            area,
            debugTag,
        };
        const requestHash = (0, composer_1.generateRequestHash)(options);
        const cached = imageCache.get(requestHash);
        if (cached) {
            (0, logger_1.logFunctionEnd)('generateAndSendCard', {
                result: 'cached',
                messageId: cached.messageId
            });
            return cached.messageId;
        }
        const imageBuffer = await (0, composer_1.generateImageBuffer)(options);
        const caption = debugTag ? `🎴 ${debugTag}` : '🎴 Card Image';
        const result = await telegramService.sendImage(imageBuffer, caption);
        imageCache.set(requestHash, result.messageId, result.fileId);
        (0, logger_1.logFunctionEnd)('generateAndSendCard', {
            result: 'generated',
            messageId: result.messageId,
            fileId: result.fileId
        });
        return result.messageId;
    }
    catch (error) {
        (0, logger_1.logError)('generateAndSendCard', error, { cards, style, area, debugTag });
        throw error;
    }
}
async function generateImageBufferOnly(cards, style = 'general', area = 'general', debugTag) {
    (0, logger_1.logFunctionStart)('generateImageBufferOnly', { cards, style, area, debugTag });
    try {
        const options = {
            cards,
            style,
            area,
            debugTag,
        };
        const buffer = await (0, composer_1.generateImageBuffer)(options);
        (0, logger_1.logFunctionEnd)('generateImageBufferOnly', {
            imageSize: buffer.length,
            cardCount: cards.length
        });
        return buffer;
    }
    catch (error) {
        (0, logger_1.logError)('generateImageBufferOnly', error, { cards, style, area, debugTag });
        throw error;
    }
}
function getCacheStats() {
    if (!imageCache) {
        initializeServices();
    }
    return imageCache?.getStats() || { totalEntries: 0, expiredEntries: 0 };
}
function clearCache() {
    if (!imageCache) {
        initializeServices();
    }
    imageCache?.clear();
}
//# sourceMappingURL=generateAndSendCard.js.map