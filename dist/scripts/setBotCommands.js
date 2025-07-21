"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
const fs_1 = require("fs");
const [, , targetToken] = process.argv;
if (!targetToken) {
    console.error("Usage: pnpm run set:bot-commands <TELEGRAM_BOT_TOKEN>");
    process.exit(1);
}
const config = JSON.parse((0, fs_1.readFileSync)("bot-config.json", "utf-8"));
const commands = config.getCommands?.result;
if (!commands || !Array.isArray(commands)) {
    console.error("No commands found in bot-config.json");
    process.exit(1);
}
const telegramApi = (method) => `https://api.telegram.org/bot${targetToken}/${method}`;
async function setBotCommands() {
    try {
        const res = await (0, node_fetch_1.default)(telegramApi("setMyCommands"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ commands }),
        });
        const data = await res.json();
        console.log("setMyCommands response:", data);
    }
    catch (err) {
        console.error("Failed to set bot commands:", err);
        process.exit(1);
    }
}
setBotCommands();
//# sourceMappingURL=setBotCommands.js.map