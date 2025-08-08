#!/usr/bin/env tsx

import { exec } from "child_process";
import { logger } from '@/modules/core/logger';
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
  logger.info("🔍 Looking for bot processes...");

  const processes = await findBotProcesses();

  if (processes.length === 0) {
    logger.info("✅ No bot processes found");
    return;
  }

  logger.info(`📋 Found ${processes.length} bot process(es):`);
  processes.forEach((process, index) => {
    logger.info(`  ${index + 1}. ${process}`);
  });

  try {
    // Kill pnpm bot processes
    await execAsync("pkill -f 'pnpm bot'");
    logger.info("✅ Killed pnpm bot processes");
  } catch {
    // Ignore if no processes found
  }

  try {
    // Kill tsx bot processes
    await execAsync("pkill -f 'tsx src/bot/index.ts'");
    logger.info("✅ Killed tsx bot processes");
  } catch {
    // Ignore if no processes found
  }

  // Wait a moment for processes to fully terminate
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Check if any processes are still running
  const remainingProcesses = await findBotProcesses();
  if (remainingProcesses.length > 0) {
    logger.warn("⚠️  Some processes may still be running. Force killing...");
    try {
      await execAsync("pkill -9 -f 'pnpm bot'");
      await execAsync("pkill -9 -f 'tsx src/bot/index.ts'");
      logger.info("✅ Force killed remaining processes");
    } catch {
      logger.info("ℹ️  No remaining processes to force kill");
    }
  } else {
    logger.info("✅ All bot processes stopped successfully");
  }
}

async function startBot(): Promise<void> {
  logger.info("🚀 Starting bot...");
  try {
    await execAsync("pnpm run bot");
  } catch (error) {
    logger.error({ err: error }, "❌ Failed to start bot");
  }
}

async function restartBot(): Promise<void> {
  logger.info("🔄 Restarting bot...");
  await killBotProcesses();
  logger.info("⏳ Waiting 2 seconds before starting...");
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
        logger.info("🟢 Bot is running:");
        processes.forEach((process, index) => {
          logger.info(`  ${index + 1}. ${process}`);
        });
      } else {
        logger.info("🔴 Bot is not running");
      }
      break;
    default:
      logger.info("Usage: pnpm run bot:manage <command>");
      logger.info("Commands:");
      logger.info("  stop     - Stop all bot processes");
      logger.info("  start    - Start the bot");
      logger.info("  restart  - Restart the bot");
      logger.info("  status   - Check bot status");
      break;
  }
}

if (require.main === module) {
  main().catch((err) => logger.error({ err }, 'botManager main error'));
}
