"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const node_fetch_1 = __importDefault(require("node-fetch"));
const fs_1 = require("fs");
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TELEGRAM_BOT_TOKEN) {
    console.error("TELEGRAM_BOT_TOKEN not set");
    process.exit(1);
}
const telegramApi = (method, params = "") => `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}${params}`;
async function exportBotConfig() {
    try {
        const [getMe, getCommands, getDescription, getMenuButton] = await Promise.all([
            (0, node_fetch_1.default)(telegramApi("getMe")).then((res) => res.json()),
            (0, node_fetch_1.default)(telegramApi("getMyCommands")).then((res) => res.json()),
            (0, node_fetch_1.default)(telegramApi("getMyDescription")).then((res) => res.json()),
            (0, node_fetch_1.default)(telegramApi("getChatMenuButton")).then((res) => res.json()),
        ]);
        const config = {
            getMe,
            getCommands,
            getDescription,
            getMenuButton,
        };
        const json = JSON.stringify(config, null, 2);
        (0, fs_1.writeFileSync)("bot-config.json", json);
        console.log("Bot config saved to bot-config.json");
        console.log(json);
    }
    catch (err) {
        console.error("Failed to export bot config:", err);
        process.exit(1);
    }
}
exportBotConfig();
//# sourceMappingURL=exportBotConfig.js.map