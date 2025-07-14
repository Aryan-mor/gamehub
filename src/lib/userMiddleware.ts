// eslint-disable-next-line @typescript-eslint/no-unused-vars
const hasUserStartedBot = async (_unusedUserId: string) => true; // TODO: Implement actual check

/**
 * Middleware to check if user has started the bot
 * Throws an error if user hasn't started the bot
 */
export async function requireUserStarted(
  userId: string,
  chatId?: string,
  messageId?: string
): Promise<void> {
  console.log(
    `[MIDDLEWARE] requireUserStarted called for userId=${userId}, chatId=${
      chatId || "unknown"
    }, messageId=${messageId || "unknown"}`
  );
  const hasStarted = await hasUserStartedBot(userId);
  console.log(
    `[MIDDLEWARE] requireUserStarted result for userId=${userId}: ${hasStarted}`
  );

  if (!hasStarted) {
    const errorMsg = "User not found. Please start the bot first with /start";
    console.log(
      `[MIDDLEWARE] requireUserStarted: User ${userId} has not started bot, chatId=${
        chatId || "unknown"
      }, messageId=${messageId || "unknown"}, throwing error: ${errorMsg}`
    );
    throw new Error(errorMsg);
  }

  console.log(
    `[MIDDLEWARE] requireUserStarted: User ${userId} has started bot, proceeding`
  );
}

/**
 * Middleware to check if user has started the bot and has sufficient balance
 * Throws appropriate error messages for different scenarios
 */
export async function requireUserStartedAndBalance(
  userId: string,
  requiredAmount: number,
  chatId?: string,
  messageId?: string
): Promise<void> {
  console.log(
    `[MIDDLEWARE] requireUserStartedAndBalance called for userId=${userId}, requiredAmount=${requiredAmount}, chatId=${
      chatId || "unknown"
    }, messageId=${messageId || "unknown"}`
  );

  // First check if user has started the bot
  const hasStarted = await hasUserStartedBot(userId);
  console.log(
    `[MIDDLEWARE] requireUserStartedAndBalance: hasUserStartedBot result for userId=${userId}: ${hasStarted}`
  );

  if (!hasStarted) {
    const errorMsg = "User not found. Please start the bot first with /start";
    console.log(
      `[MIDDLEWARE] requireUserStartedAndBalance: User ${userId} has not started bot, chatId=${
        chatId || "unknown"
      }, messageId=${
        messageId || "unknown"
      }, requiredAmount=${requiredAmount}, throwing error: ${errorMsg}`
    );
    throw new Error(errorMsg);
  }

  console.log(
    `[MIDDLEWARE] requireUserStartedAndBalance: User ${userId} has started bot, checking balance`
  );

  // Then check balance using the existing coin service
  const { getUserCoins } = await import("./coinService");
  const user = await getUserCoins(userId);
  console.log(
    `[MIDDLEWARE] requireUserStartedAndBalance: User ${userId} balance=${user.coins}, required=${requiredAmount}`
  );

  if (user.coins < requiredAmount) {
    const errorMsg = "Insufficient coins";
    console.log(
      `[MIDDLEWARE] requireUserStartedAndBalance: User ${userId} insufficient coins, chatId=${
        chatId || "unknown"
      }, messageId=${
        messageId || "unknown"
      }, requiredAmount=${requiredAmount}, userBalance=${
        user.coins
      }, throwing error: ${errorMsg}`
    );
    throw new Error(errorMsg);
  }

  console.log(
    `[MIDDLEWARE] requireUserStartedAndBalance: User ${userId} has sufficient balance, proceeding`
  );
}
