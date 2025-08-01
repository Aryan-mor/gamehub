import fetch from "node-fetch";
import { readFileSync } from "fs";

const [, , targetToken] = process.argv;

if (!targetToken) {
  console.error("Usage: pnpm run set:bot-commands <TELEGRAM_BOT_TOKEN>");
  process.exit(1);
}

const config = JSON.parse(readFileSync("bot-config.json", "utf-8"));
const commands = config.getCommands?.result;

if (!commands || !Array.isArray(commands)) {
  console.error("No commands found in bot-config.json");
  process.exit(1);
}

const telegramApi = (method: string): string =>
  `https://api.telegram.org/bot${targetToken}/${method}`;

async function setBotCommands(): Promise<void> {
  try {
    const res = await fetch(telegramApi("setMyCommands"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commands }),
    });
    const data = await res.json();
    console.log("setMyCommands response:", data);
  } catch (err) {
    console.error("Failed to set bot commands:", err);
    process.exit(1);
  }
}

setBotCommands();
