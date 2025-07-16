import { ref, get, set, push } from "firebase/database";
import { database } from "./firebase";

export interface Transfer {
  id: string;
  fromId: string;
  toId: string;
  amount: number;
  type: "stake" | "refund" | "payout" | "fee";
  gameId?: string;
  timestamp: number;
  reason?: string;
}

export interface UserCoinData {
  coins: number;
  lastFreeCoinAt?: number;
  createdAt?: number;
}

const USER_COIN_PATH = "users";
const TRANSFER_PATH = "transfers";

/**
 * Get user coin data, auto-creating with 0 coins if missing.
 */
export async function getUserCoins(userId: string): Promise<UserCoinData> {
  if (!database) throw new Error("Firebase not initialized");
  const userRef = ref(database, `${USER_COIN_PATH}/${userId}`);
  const snap = await get(userRef);
  if (snap.exists()) {
    return snap.val();
  } else {
    const data: UserCoinData = {
      coins: 0,
      createdAt: Date.now(),
    };
    await set(userRef, data);
    console.log(`[COIN] Created new user ${userId} with 0 coins`);
    return data;
  }
}

/**
 * Adjust user coins and log the transaction
 */
export async function adjustCoins(
  userId: string,
  delta: number,
  reason: string,
  gameId?: string
): Promise<void> {
  console.log(
    `[COIN] adjustCoins called: userId=${userId}, delta=${delta}, reason=${reason}, gameId=${gameId}`
  );

  if (!database) throw new Error("Firebase not initialized");

  const user = await getUserCoins(userId);
  const newBalance = user.coins + delta;

  if (newBalance < 0) {
    throw new Error(
      `Insufficient coins. Balance: ${user.coins}, Required: ${Math.abs(delta)}`
    );
  }

  // Update user balance
  await set(ref(database, `${USER_COIN_PATH}/${userId}`), {
    ...user,
    coins: newBalance,
  });

  // Log transfer
  const transfer: Omit<Transfer, "id"> = {
    fromId: delta < 0 ? userId : "system",
    toId: delta > 0 ? userId : "system",
    amount: Math.abs(delta),
    type: delta < 0 ? "stake" : "payout",
    timestamp: Date.now(),
    reason,
  };

  // Only add gameId if it's not undefined
  if (gameId !== undefined) {
    transfer.gameId = gameId;
  }

  console.log(
    `[COIN] Transfer object to push:`,
    JSON.stringify(transfer, null, 2)
  );
  await push(ref(database, TRANSFER_PATH), transfer);

  console.log(
    `[COIN] ${reason}: userId=${userId} delta=${delta} newBalance=${newBalance} gameId=${
      gameId || "N/A"
    }`
  );
}

/**
 * Check if user has sufficient balance
 */
export async function requireBalance(
  userId: string,
  amount: number
): Promise<boolean> {
  const user = await getUserCoins(userId);
  const hasBalance = user.coins >= amount;
  console.log(
    `[COIN] Balance check: userId=${userId} balance=${user.coins} required=${amount} hasBalance=${hasBalance}`
  );
  return hasBalance;
}

/**
 * Get user balance
 */
export async function getBalance(userId: string): Promise<number> {
  const user = await getUserCoins(userId);
  return user.coins;
}

/**
 * Log a transfer between users
 */
export async function logTransfer(
  transfer: Omit<Transfer, "id">
): Promise<void> {
  if (!database) throw new Error("Firebase not initialized");
  await push(ref(database, TRANSFER_PATH), transfer);
  console.log(
    `[COIN] Transfer logged: ${transfer.type} ${transfer.amount} from ${transfer.fromId} to ${transfer.toId}`
  );
}

/**
 * Process game payout
 */
export async function processGamePayout(
  winnerId: string,
  stakePool: number,
  gameId: string
): Promise<{ payout: number; fee: number }> {
  const payout = stakePool;
  const fee = 0;

  console.log(
    `[COIN] Processing payout: gameId=${gameId} winnerId=${winnerId} stakePool=${stakePool} payout=${payout} fee=${fee}`
  );

  // Transfer payout to winner
  await adjustCoins(winnerId, payout, "game_win", gameId);

  // No fee transfer

  return { payout, fee };
}

/**
 * Process game refund (draw)
 */
export async function processGameRefund(
  player1Id: string,
  player2Id: string,
  stakeAmount: number,
  gameId: string
): Promise<void> {
  console.log(
    `[COIN] Processing refund: gameId=${gameId} player1Id=${player1Id} player2Id=${player2Id} stakeAmount=${stakeAmount}`
  );

  // Refund both players
  await adjustCoins(player1Id, stakeAmount, "game_draw_refund", gameId);
  await adjustCoins(player2Id, stakeAmount, "game_draw_refund", gameId);
}

/**
 * Deduct stake from player
 */
export async function deductStake(
  userId: string,
  amount: number,
  gameId: string
): Promise<void> {
  console.log(
    `[COIN] Deducting stake: userId=${userId} amount=${amount} gameId=${gameId}`
  );
  await adjustCoins(userId, -amount, "game_stake", gameId);
}
