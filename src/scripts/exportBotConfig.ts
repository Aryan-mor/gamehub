import { logger } from '@/modules/core/logger';
import "dotenv/config";
import { writeFileSync } from "fs";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_BOT_TOKEN) {
  logger.error("TELEGRAM_BOT_TOKEN not set");
  process.exit(1);
}

const telegramApi = (method: string): string =>
  `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`;

async function exportBotConfig(): Promise<void> {
  try {
    const [getMe, getCommands, getDescription, getMenuButton] =
      await Promise.all([
        fetch(telegramApi("getMe")).then((res: Response) => res.json()),
        fetch(telegramApi("getMyCommands")).then((res: Response) => res.json()),
        fetch(telegramApi("getMyDescription")).then((res: Response) => res.json()),
        fetch(telegramApi("getChatMenuButton")).then((res: Response) => res.json()),
      ]);
    const config = {
      getMe,
      getCommands,
      getDescription,
      getMenuButton,
    };
    const json = JSON.stringify(config, null, 2);
    writeFileSync("bot-config.json", json);
    logger.info("Bot config saved to bot-config.json");
    logger.info(json);
  } catch (err) {
    logger.error({ err }, "Failed to export bot config:");
    process.exit(1);
  }
}

exportBotConfig();
