import "dotenv/config";
import fetch from "node-fetch";
import { writeFileSync } from "fs";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_BOT_TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN not set");
  process.exit(1);
}

const telegramApi = (method: string): string =>
  `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`;

async function exportBotConfig(): Promise<void> {
  try {
    const [getMe, getCommands, getDescription, getMenuButton] =
      await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fetch(telegramApi("getMe")).then((res: any) => res.json()),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fetch(telegramApi("getMyCommands")).then((res: any) => res.json()),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fetch(telegramApi("getMyDescription")).then((res: any) => res.json()),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fetch(telegramApi("getChatMenuButton")).then((res: any) => res.json()),
      ]);
    const config = {
      getMe,
      getCommands,
      getDescription,
      getMenuButton,
    };
    const json = JSON.stringify(config, null, 2);
    writeFileSync("bot-config.json", json);
    console.log("Bot config saved to bot-config.json");
    console.log(json);
  } catch (err) {
    console.error("Failed to export bot config:", err);
    process.exit(1);
  }
}

exportBotConfig();
