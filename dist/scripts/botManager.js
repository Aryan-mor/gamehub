#!/usr/bin/env tsx
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
async function findBotProcesses() {
    try {
        const { stdout } = await execAsync("ps aux | grep -E '(pnpm bot|tsx src/bot/index.ts)' | grep -v grep");
        return stdout
            .trim()
            .split("\n")
            .filter((line) => line.trim());
    }
    catch {
        return [];
    }
}
async function killBotProcesses() {
    console.log("🔍 Looking for bot processes...");
    const processes = await findBotProcesses();
    if (processes.length === 0) {
        console.log("✅ No bot processes found");
        return;
    }
    console.log(`📋 Found ${processes.length} bot process(es):`);
    processes.forEach((process, index) => {
        console.log(`  ${index + 1}. ${process}`);
    });
    try {
        await execAsync("pkill -f 'pnpm bot'");
        console.log("✅ Killed pnpm bot processes");
    }
    catch {
    }
    try {
        await execAsync("pkill -f 'tsx src/bot/index.ts'");
        console.log("✅ Killed tsx bot processes");
    }
    catch {
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const remainingProcesses = await findBotProcesses();
    if (remainingProcesses.length > 0) {
        console.log("⚠️  Some processes may still be running. Force killing...");
        try {
            await execAsync("pkill -9 -f 'pnpm bot'");
            await execAsync("pkill -9 -f 'tsx src/bot/index.ts'");
            console.log("✅ Force killed remaining processes");
        }
        catch {
            console.log("ℹ️  No remaining processes to force kill");
        }
    }
    else {
        console.log("✅ All bot processes stopped successfully");
    }
}
async function startBot() {
    console.log("🚀 Starting bot...");
    try {
        await execAsync("pnpm run bot");
    }
    catch (error) {
        console.error("❌ Failed to start bot:", error);
    }
}
async function restartBot() {
    console.log("🔄 Restarting bot...");
    await killBotProcesses();
    console.log("⏳ Waiting 2 seconds before starting...");
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await startBot();
}
async function main() {
    const command = process.argv[2];
    switch (command) {
        case "stop":
            await killBotProcesses();
            break;
        case "start":
            await startBot();
            break;
        case "restart":
            await restartBot();
            break;
        case "status":
            const processes = await findBotProcesses();
            if (processes.length > 0) {
                console.log("🟢 Bot is running:");
                processes.forEach((process, index) => {
                    console.log(`  ${index + 1}. ${process}`);
                });
            }
            else {
                console.log("🔴 Bot is not running");
            }
            break;
        default:
            console.log("Usage: pnpm run bot:manage <command>");
            console.log("Commands:");
            console.log("  stop     - Stop all bot processes");
            console.log("  start    - Start the bot");
            console.log("  restart  - Restart the bot");
            console.log("  status   - Check bot status");
            break;
    }
}
if (require.main === module) {
    main().catch(console.error);
}
//# sourceMappingURL=botManager.js.map