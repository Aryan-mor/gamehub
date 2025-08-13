"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAndSendCard = generateAndSendCard;
exports.regenerateCardImage = regenerateCardImage;
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
async function generateAndSendCard(cards, style = 'general', area = 'general', debugTag, format = 'png', transparent = false, asDocument = false) {
    (0, logger_1.logFunctionStart)('generateAndSendCard', { cards, style, area, debugTag, format, transparent, asDocument });
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
            format,
            transparent,
            asDocument,
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
        const result = await telegramService.sendImage(imageBuffer, caption, asDocument, format);
        imageCache.set(requestHash, result.messageId, result.fileId);
        (0, logger_1.logFunctionEnd)('generateAndSendCard', {
            result: 'generated',
            messageId: result.messageId,
            fileId: result.fileId,
            format,
            transparent,
            asDocument
        });
        return result.messageId;
    }
    catch (error) {
        (0, logger_1.logError)('generateAndSendCard', error, { cards, style, area, debugTag, format, transparent, asDocument });
        throw error;
    }
}
async function regenerateCardImage(cards, style = 'general', area = 'general', debugTag, format = 'png', transparent = false, asDocument = false) {
    (0, logger_1.logFunctionStart)('regenerateCardImage', { cards, style, area, debugTag, format, transparent, asDocument });
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
            format,
            transparent,
            asDocument,
        };
        const requestHash = (0, composer_1.generateRequestHash)(options);
        imageCache.remove(requestHash);
        const imageBuffer = await (0, composer_1.generateImageBuffer)(options);
        const caption = debugTag ? `🎴 ${debugTag}` : '🎴 Card Image';
        const result = await telegramService.sendImage(imageBuffer, caption, asDocument, format);
        imageCache.set(requestHash, result.messageId, result.fileId);
        (0, logger_1.logFunctionEnd)('regenerateCardImage', {
            result: 'regenerated',
            messageId: result.messageId,
            fileId: result.fileId,
            format,
            transparent,
            asDocument
        });
        return result.messageId;
    }
    catch (error) {
        (0, logger_1.logError)('regenerateCardImage', error, { cards, style, area, debugTag, format, transparent, asDocument });
        throw error;
    }
}
async function generateImageBufferOnly(cards, style = 'general', area = 'general', debugTag, format = 'png', transparent = false) {
    (0, logger_1.logFunctionStart)('generateImageBufferOnly', { cards, style, area, debugTag, format, transparent });
    try {
        const options = {
            cards,
            style,
            area,
            debugTag,
            format,
            transparent,
        };
        const buffer = await (0, composer_1.generateImageBuffer)(options);
        (0, logger_1.logFunctionEnd)('generateImageBufferOnly', {
            imageSize: buffer.length,
            cardCount: cards.length,
            format,
            transparent
        });
        return buffer;
    }
    catch (error) {
        (0, logger_1.logError)('generateImageBufferOnly', error, { cards, style, area, debugTag, format, transparent });
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