"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = require("./logger");
dotenv_1.default.config();
function loadConfig() {
    const botToken = process.env.BOT_TOKEN;
    const targetChannelId = process.env.TARGET_CHANNEL_ID;
    const logLevel = process.env.LOG_LEVEL || 'info';
    if (!botToken) {
        throw new Error('BOT_TOKEN environment variable is required');
    }
    if (!targetChannelId) {
        throw new Error('TARGET_CHANNEL_ID environment variable is required');
    }
    const config = {
        botToken,
        targetChannelId,
        logLevel,
    };
    logger_1.logger.info('Configuration loaded successfully', {
        targetChannelId,
        logLevel,
        hasBotToken: !!botToken
    });
    return config;
}
//# sourceMappingURL=config.js.map