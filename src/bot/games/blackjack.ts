import { ref, set, get, push } from "firebase/database";
import { database } from "../../lib/firebase";
import { adjustCoins, requireBalance } from "../../lib/coinService";

export interface BlackjackGameState {
  id: string;
  userId: string;
  stake: number;
  playerHand: Card[];
  dealerHand: Card[];
  deck: Card[];
  status: "pending" | "completed";
  result?: "win" | "lose" | "push";
  reward?: number;
  createdAt: number;
  completedAt?: number;
}

export interface Card {
  suit: "hearts" | "diamonds" | "clubs" | "spades";
  value: number; // 1-13 (1=Ace, 11=Jack, 12=Queen, 13=King)
  displayValue: string; // "A", "2", "3", ..., "10", "J", "Q", "K"
}

export interface BlackjackGameResult {
  won: boolean;
  reward: number;
  fee: number;
  message: string;
}

export const BLACKJACK_STAKES = [2, 5, 10, 20, 30, 50] as const;
export type BlackjackStake = (typeof BLACKJACK_STAKES)[number];

const GAMES_PATH = "blackjackGames";
const TRANSFERS_PATH = "transfers";

/**
 * Create a new deck of cards
 */
function createDeck(): Card[] {
  const suits: Card["suit"][] = ["hearts", "diamonds", "clubs", "spades"];
  const deck: Card[] = [];

  for (const suit of suits) {
    for (let value = 1; value <= 13; value++) {
      let displayValue: string;
      if (value === 1) displayValue = "A";
      else if (value === 11) displayValue = "J";
      else if (value === 12) displayValue = "Q";
      else if (value === 13) displayValue = "K";
      else displayValue = value.toString();

      deck.push({ suit, value, displayValue });
    }
  }

  // Shuffle the deck
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

/**
 * Calculate hand value in blackjack
 */
export function calculateHandValue(hand: Card[]): number {
  let value = 0;
  let aces = 0;

  for (const card of hand) {
    if (card.value === 1) {
      aces++;
      value += 11;
    } else if (card.value >= 10) {
      value += 10;
    } else {
      value += card.value;
    }
  }

  // Adjust for aces
  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }

  return value;
}

/**
 * Check if hand is blackjack (Ace + 10-value card)
 */
function isBlackjack(hand: Card[]): boolean {
  if (hand.length !== 2) return false;
  const hasAce = hand.some((card) => card.value === 1);
  const hasTenValue = hand.some((card) => card.value >= 10);
  return hasAce && hasTenValue;
}

/**
 * Create a new blackjack game
 */
export async function createBlackjackGame(
  userId: string,
  stake: BlackjackStake
): Promise<BlackjackGameState> {
  console.log(
    `[BLACKJACK] createBlackjackGame called: userId=${userId}, stake=${stake}`
  );

  if (!database) throw new Error("Firebase not initialized");

  // Check balance
  console.log(
    `[BLACKJACK] Checking balance for userId=${userId}, required=${stake}`
  );
  const hasBalance = await requireBalance(userId, stake);
  console.log(`[BLACKJACK] Balance check result: hasBalance=${hasBalance}`);

  if (!hasBalance) {
    throw new Error("Insufficient coins");
  }

  const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
  console.log(`[BLACKJACK] Generated gameId: ${gameId}`);

  // Deduct stake
  console.log(`[BLACKJACK] Deducting stake: userId=${userId}, amount=${stake}`);
  await adjustCoins(userId, -stake, "blackjack_stake", gameId);

  // Create and deal initial hands
  const deck = createDeck();
  const playerHand = [deck.pop()!, deck.pop()!];
  const dealerHand = [deck.pop()!, deck.pop()!];

  // Check for automatic win conditions
  const playerValue = calculateHandValue(playerHand);
  const playerBlackjack = isBlackjack(playerHand);
  const dealerBlackjack = isBlackjack(dealerHand);

  let status: "pending" | "completed" = "pending";
  let result: "win" | "lose" | "push" | undefined;
  let reward: number | undefined;

  // Check for automatic win/lose conditions
  if (playerBlackjack && !dealerBlackjack) {
    // Player blackjack pays 3:2
    status = "completed";
    result = "win";
    reward = Math.floor(stake * 2.5);
  } else if (dealerBlackjack && !playerBlackjack) {
    status = "completed";
    result = "lose";
    reward = 0;
  } else if (playerBlackjack && dealerBlackjack) {
    status = "completed";
    result = "push";
    reward = stake;
  } else if (playerValue === 21 && !playerBlackjack) {
    // Player has 21 (not blackjack) - automatic win
    status = "completed";
    result = "win";
    reward = stake * 2;
  }

  const gameState: BlackjackGameState = {
    id: gameId,
    userId,
    stake,
    playerHand,
    dealerHand,
    deck,
    status,
    createdAt: Date.now(),
  };

  // Only add result and reward if game is completed
  if (status === "completed" && result) {
    gameState.result = result;
    gameState.reward = reward;
  }

  console.log(
    `[BLACKJACK] Game state to save:`,
    JSON.stringify(gameState, null, 2)
  );
  await set(ref(database, `${GAMES_PATH}/${gameId}`), gameState);

  // Process payout if game is already completed
  if (status === "completed" && result === "win" && reward && reward > 0) {
    console.log(
      `[BLACKJACK] Processing automatic win payout: userId=${userId}, reward=${reward}, gameId=${gameId}`
    );
    await adjustCoins(userId, reward, "blackjack_win", gameId);

    // Log fee if applicable
    if (reward > stake) {
      const fee = Math.floor((reward - stake) * 0.05);
      if (fee > 0) {
        const feeTransfer = {
          fromId: "system",
          toId: "system_fee",
          amount: fee,
          type: "fee",
          timestamp: Date.now(),
          reason: "blackjack_fee",
          gameId,
        };
        await push(ref(database, TRANSFERS_PATH), feeTransfer);
      }
    }
  }

  console.log(
    `[BLACKJACK] Created game ${gameId} with stake ${stake} for user ${userId}`
  );

  return gameState;
}

/**
 * Hit (draw a card) in blackjack
 */
export async function hitCard(gameId: string): Promise<BlackjackGameState> {
  console.log(`[BLACKJACK] hitCard called: gameId=${gameId}`);

  if (!database) throw new Error("Firebase not initialized");

  const gameRef = ref(database, `${GAMES_PATH}/${gameId}`);
  const snapshot = await get(gameRef);

  if (!snapshot.exists()) {
    throw new Error("Game not found");
  }

  const gameState: BlackjackGameState = snapshot.val();

  if (gameState.status !== "pending") {
    throw new Error("Game already completed");
  }

  // Draw a card for player
  const drawnCard = gameState.deck.pop()!;
  gameState.playerHand.push(drawnCard);

  // Check if player busted
  const playerValue = calculateHandValue(gameState.playerHand);
  if (playerValue > 21) {
    gameState.status = "completed";
    gameState.result = "lose";
    gameState.reward = 0;
    gameState.completedAt = Date.now();
  }

  await set(gameRef, gameState);
  return gameState;
}

/**
 * Stand (end player's turn) in blackjack
 */
export async function standGame(gameId: string): Promise<BlackjackGameResult> {
  console.log(`[BLACKJACK] standGame called: gameId=${gameId}`);

  if (!database) throw new Error("Firebase not initialized");

  const gameRef = ref(database, `${GAMES_PATH}/${gameId}`);
  const snapshot = await get(gameRef);

  if (!snapshot.exists()) {
    throw new Error("Game not found");
  }

  const gameState: BlackjackGameState = snapshot.val();

  if (gameState.status !== "pending") {
    throw new Error("Game already completed");
  }

  // Dealer plays
  let dealerValue = calculateHandValue(gameState.dealerHand);
  while (dealerValue < 17) {
    const drawnCard = gameState.deck.pop()!;
    gameState.dealerHand.push(drawnCard);
    dealerValue = calculateHandValue(gameState.dealerHand);
  }

  // Determine winner
  const playerValue = calculateHandValue(gameState.playerHand);
  const playerBlackjack = isBlackjack(gameState.playerHand);
  const dealerBlackjack = isBlackjack(gameState.dealerHand);

  let result: "win" | "lose" | "push";
  let reward = 0;
  let fee = 0;

  if (playerBlackjack && !dealerBlackjack) {
    // Player blackjack pays 3:2
    result = "win";
    reward = Math.floor(gameState.stake * 2.5);
  } else if (dealerBlackjack && !playerBlackjack) {
    result = "lose";
    reward = 0;
  } else if (playerBlackjack && dealerBlackjack) {
    result = "push";
    reward = gameState.stake;
  } else if (playerValue > 21) {
    result = "lose";
    reward = 0;
  } else if (dealerValue > 21) {
    result = "win";
    reward = gameState.stake * 2;
  } else if (playerValue > dealerValue) {
    result = "win";
    reward = gameState.stake * 2;
  } else if (dealerValue > playerValue) {
    result = "lose";
    reward = 0;
  } else {
    result = "push";
    reward = gameState.stake;
  }

  // Calculate fee (5% of winnings)
  if (reward > gameState.stake) {
    fee = Math.floor((reward - gameState.stake) * 0.05);
    reward -= fee;
  }

  // Update game state
  gameState.status = "completed";
  gameState.result = result;
  gameState.reward = reward;
  gameState.completedAt = Date.now();

  await set(gameRef, gameState);

  // Process payout if won
  if (result === "win" && reward > 0) {
    await adjustCoins(gameState.userId, reward, "blackjack_win", gameId);

    // Log fee
    if (fee > 0) {
      const feeTransfer = {
        fromId: "system",
        toId: "system_fee",
        amount: fee,
        type: "fee",
        timestamp: Date.now(),
        reason: "blackjack_fee",
        gameId,
      };
      await push(ref(database, TRANSFERS_PATH), feeTransfer);
    }
  }

  const message = getBlackjackResultText(
    result,
    reward,
    playerValue,
    dealerValue,
    gameState.stake
  );

  return {
    won: result === "win",
    reward,
    fee,
    message,
  };
}

/**
 * Get blackjack result text
 */
export function getBlackjackResultText(
  result: "win" | "lose" | "push",
  reward: number,
  playerValue: number,
  dealerValue: number,
  stake: number
): string {
  const resultEmoji = result === "win" ? "🎉" : result === "lose" ? "💔" : "🤝";
  const resultText =
    result === "win" ? "WIN!" : result === "lose" ? "LOSE!" : "PUSH!";

  let message = `${resultEmoji} BLACKJACK ${resultText}\n\n`;
  message += `💰 Stake: ${stake} Coins\n`;
  message += `👤 Your Hand: ${playerValue}\n`;
  message += `🎰 Dealer's Hand: ${dealerValue}\n\n`;

  if (result === "win") {
    message += `🎉 You won ${reward} Coins!`;
  } else if (result === "lose") {
    message += `💔 You lost ${stake} Coins`;
  } else {
    message += `🤝 It's a push! Your stake is returned`;
  }

  return message;
}

/**
 * Get blackjack statistics for a user
 */
export async function getBlackjackStats(userId: string): Promise<{
  totalGames: number;
  totalWins: number;
  totalWinnings: number;
}> {
  if (!database) throw new Error("Firebase not initialized");

  const gamesRef = ref(database, GAMES_PATH);
  const snapshot = await get(gamesRef);

  let totalGames = 0;
  let totalWins = 0;
  let totalWinnings = 0;

  if (snapshot.exists()) {
    const games = snapshot.val();
    for (const gameId in games) {
      const game = games[gameId] as BlackjackGameState;
      if (game.userId === userId && game.status === "completed") {
        totalGames++;
        if (game.result === "win") {
          totalWins++;
          totalWinnings += game.reward || 0;
        }
      }
    }
  }

  return { totalGames, totalWins, totalWinnings };
}

/**
 * Get recent blackjack games for a user
 */
export async function getRecentBlackjackGames(
  userId: string,
  limit: number = 10
): Promise<BlackjackGameState[]> {
  if (!database) throw new Error("Firebase not initialized");

  const gamesRef = ref(database, GAMES_PATH);
  const snapshot = await get(gamesRef);

  const games: BlackjackGameState[] = [];

  if (snapshot.exists()) {
    const allGames = snapshot.val();
    for (const gameId in allGames) {
      const game = allGames[gameId] as BlackjackGameState;
      if (game.userId === userId && game.status === "completed") {
        games.push(game);
      }
    }
  }

  // Sort by completion time (newest first) and limit results
  return games
    .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
    .slice(0, limit);
}
