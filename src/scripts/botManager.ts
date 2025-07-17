#!/usr/bin/env tsx

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function findBotProcesses(): Promise<string[]> {
  try {
    const { stdout } = await execAsync(
      "ps aux | grep -E '(pnpm bot|tsx src/bot/index.ts)' | grep -v grep"
    );
    return stdout
      .trim()
      .split("\n")
      .filter((line) => line.trim());
  } catch {
    return [];
  }
}

async function killBotProcesses(): Promise<void> {
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
    // Kill pnpm bot processes
    await execAsync("pkill -f 'pnpm bot'");
    console.log("✅ Killed pnpm bot processes");
  } catch {
    // Ignore if no processes found
  }

  try {
    // Kill tsx bot processes
    await execAsync("pkill -f 'tsx src/bot/index.ts'");
    console.log("✅ Killed tsx bot processes");
  } catch {
    // Ignore if no processes found
  }

  // Wait a moment for processes to fully terminate
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Check if any processes are still running
  const remainingProcesses = await findBotProcesses();
  if (remainingProcesses.length > 0) {
    console.log("⚠️  Some processes may still be running. Force killing...");
    try {
      await execAsync("pkill -9 -f 'pnpm bot'");
      await execAsync("pkill -9 -f 'tsx src/bot/index.ts'");
      console.log("✅ Force killed remaining processes");
    } catch {
      console.log("ℹ️  No remaining processes to force kill");
    }
  } else {
    console.log("✅ All bot processes stopped successfully");
  }
}

async function startBot(): Promise<void> {
  console.log("🚀 Starting bot...");
  try {
    await execAsync("pnpm run bot");
  } catch (error) {
    console.error("❌ Failed to start bot:", error);
  }
}

async function restartBot(): Promise<void> {
  console.log("🔄 Restarting bot...");
  await killBotProcesses();
  console.log("⏳ Waiting 2 seconds before starting...");
  await new Promise((resolve) => setTimeout(resolve, 2000));
  await startBot();
}

async function main(): Promise<void> {
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
      } else {
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
