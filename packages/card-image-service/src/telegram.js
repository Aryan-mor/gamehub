"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramService = void 0;
const grammy_1 = require("grammy");
const logger_1 = require("./logger");
class TelegramService {
    constructor(config) {
        this.config = config;
        this.bot = new grammy_1.Bot(config.botToken);
    }
    async sendImage(imageBuffer, caption) {
        (0, logger_1.logFunctionStart)('sendImage', {
            imageSize: imageBuffer.length,
            hasCaption: !!caption,
            targetChannel: this.config.targetChannelId
        });
        try {
            const { InputFile } = await Promise.resolve().then(() => __importStar(require('grammy')));
            const inputFile = new InputFile(imageBuffer, `card_${Date.now()}.png`);
            const result = await this.bot.api.sendPhoto(this.config.targetChannelId, inputFile, {
                caption,
                parse_mode: 'HTML',
            });
            const response = {
                messageId: result.message_id.toString(),
                fileId: result.photo?.[0]?.file_id,
            };
            (0, logger_1.logFunctionEnd)('sendImage', response);
            return response;
        }
        catch (error) {
            (0, logger_1.logError)('sendImage', error, {
                imageSize: imageBuffer.length,
                targetChannel: this.config.targetChannelId
            });
            throw error;
        }
    }
    async getMessage(messageId) {
        (0, logger_1.logFunctionStart)('getMessage', { messageId });
        try {
            await this.bot.api.getChat(this.config.targetChannelId);
            (0, logger_1.logFunctionEnd)('getMessage', { messageId, found: false });
            return null;
        }
        catch (error) {
            (0, logger_1.logError)('getMessage', error, { messageId });
            return null;
        }
    }
    async deleteMessage(messageId) {
        (0, logger_1.logFunctionStart)('deleteMessage', { messageId });
        try {
            await this.bot.api.deleteMessage(this.config.targetChannelId, parseInt(messageId, 10));
            (0, logger_1.logFunctionEnd)('deleteMessage', { messageId, success: true });
            return true;
        }
        catch (error) {
            (0, logger_1.logError)('deleteMessage', error, { messageId });
            return false;
        }
    }
    getBot() {
        return this.bot;
    }
}
exports.TelegramService = TelegramService;
//# sourceMappingURL=telegram.js.map