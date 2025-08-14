"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAndSendTemplateImage = generateAndSendTemplateImage;
exports.regenerateTemplateImage = regenerateTemplateImage;
exports.generateTemplateBufferOnly = generateTemplateBufferOnly;
const composer_1 = require("./image/templates/composer");
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
async function generateAndSendTemplateImage(templateId, cards, style = 'general', debugTag, format = 'jpeg', transparent = false, asDocument = false) {
    (0, logger_1.logFunctionStart)('generateAndSendTemplateImage', { templateId, cards, style, debugTag, format, transparent, asDocument });
    try {
        initializeServices();
        if (!telegramService || !imageCache) {
            throw new Error('Failed to initialize services');
        }
        const options = {
            templateId,
            cards,
            style,
            debugTag,
            format,
            transparent,
            asDocument,
        };
        const requestHash = (0, composer_1.generateTemplateRequestHash)(options);
        const cached = imageCache.get(requestHash);
        if (cached) {
            (0, logger_1.logFunctionEnd)('generateAndSendTemplateImage', {
                result: 'cached',
                messageId: cached.messageId
            });
            return cached.messageId;
        }
        const imageBuffer = await (0, composer_1.generateTemplateImageBuffer)(options);
        const caption = debugTag ? `🎴 ${debugTag}` : '🎴 Template Card Image';
        const result = await telegramService.sendImage(imageBuffer, caption, asDocument, format);
        imageCache.set(requestHash, result.messageId, result.fileId);
        (0, logger_1.logFunctionEnd)('generateAndSendTemplateImage', {
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
        (0, logger_1.logError)('generateAndSendTemplateImage', error, { templateId, cards, style, debugTag, format, transparent, asDocument });
        throw error;
    }
}
async function regenerateTemplateImage(templateId, cards, style = 'general', debugTag, format = 'jpeg', transparent = false, asDocument = false) {
    (0, logger_1.logFunctionStart)('regenerateTemplateImage', { templateId, cards, style, debugTag, format, transparent, asDocument });
    try {
        initializeServices();
        if (!telegramService || !imageCache) {
            throw new Error('Failed to initialize services');
        }
        const options = {
            templateId,
            cards,
            style,
            debugTag,
            format,
            transparent,
            asDocument,
        };
        const requestHash = (0, composer_1.generateTemplateRequestHash)(options);
        imageCache.remove(requestHash);
        const imageBuffer = await (0, composer_1.generateTemplateImageBuffer)(options);
        const caption = debugTag ? `🎴 ${debugTag}` : '🎴 Template Card Image';
        const result = await telegramService.sendImage(imageBuffer, caption, asDocument, format);
        imageCache.set(requestHash, result.messageId, result.fileId);
        (0, logger_1.logFunctionEnd)('regenerateTemplateImage', {
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
        (0, logger_1.logError)('regenerateTemplateImage', error, { templateId, cards, style, debugTag, format, transparent, asDocument });
        throw error;
    }
}
async function generateTemplateBufferOnly(templateId, cards, style = 'general', debugTag, format = 'jpeg', transparent = false) {
    (0, logger_1.logFunctionStart)('generateTemplateBufferOnly', { templateId, cards, style, debugTag, format, transparent });
    try {
        const options = {
            templateId,
            cards,
            style,
            debugTag,
            format,
            transparent,
        };
        const buffer = await (0, composer_1.generateTemplateImageBuffer)(options);
        (0, logger_1.logFunctionEnd)('generateTemplateBufferOnly', {
            imageSize: buffer.length,
            cardCount: cards.length,
            format,
            transparent
        });
        return buffer;
    }
    catch (error) {
        (0, logger_1.logError)('generateTemplateBufferOnly', error, { templateId, cards, style, debugTag, format, transparent });
        throw error;
    }
}
//# sourceMappingURL=generateTemplateImage.js.map