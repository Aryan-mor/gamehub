import { adjustCoins } from "../../lib/coinService";

export interface PokerPlayer {
  userId: string;
  username: string;
  chips: number;
  cards: string[];
  bet: number;
  totalBet: number;
  folded: boolean;
  allIn: boolean;
  isDealer: boolean;
  isSmallBlind: boolean;
  isBigBlind: boolean;
  lastAction: string;
  lastActionTime: number;
  timeoutCount: number;
}

export interface PokerGame {
  gameId: string;
  players: PokerPlayer[];
  deck: string[];
  communityCards: string[];
  pot: number;
  currentBet: number;
  smallBlind: number;
  bigBlind: number;
  dealerIndex: number;
  currentPlayerIndex: number;
  gamePhase:
    | "waiting"
    | "preflop"
    | "flop"
    | "turn"
    | "river"
    | "showdown"
    | "finished";
  minPlayers: number;
  maxPlayers: number;
  minPlayersToContinue: number;
  timeoutDuration: number; // in milliseconds
  gameStartTime: number;
  lastActionTime: number;
  roundNumber: number;
  handHistory: string[];
}

export interface PokerStats {
  totalGames: number;
  totalWins: number;
  totalWinnings: number;
  biggestPot: number;
  totalHandsPlayed: number;
}

const SUITS = ["♠️", "♥️", "♦️", "♣️"];
const RANKS = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A",
];

export function createDeck(): string[] {
  const deck: string[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(`${rank}${suit}`);
    }
  }
  return shuffleDeck(deck);
}

export function shuffleDeck(deck: string[]): string[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealCards(
  deck: string[],
  numCards: number
): { cards: string[]; remainingDeck: string[] } {
  const cards = deck.slice(0, numCards);
  const remainingDeck = deck.slice(numCards);
  return { cards, remainingDeck };
}

export function createPokerGame(
  gameId: string,
  smallBlind: number = 10,
  bigBlind: number = 20,
  minPlayers: number = 2,
  maxPlayers: number = 6,
  timeoutDuration: number = 30000 // 30 seconds
): PokerGame {
  return {
    gameId,
    players: [],
    deck: createDeck(),
    communityCards: [],
    pot: 0,
    currentBet: 0,
    smallBlind,
    bigBlind,
    dealerIndex: 0,
    currentPlayerIndex: 0,
    gamePhase: "waiting",
    minPlayers,
    maxPlayers,
    minPlayersToContinue: 2,
    timeoutDuration,
    gameStartTime: Date.now(),
    lastActionTime: Date.now(),
    roundNumber: 1,
    handHistory: [],
  };
}

export function addPlayerToGame(
  game: PokerGame,
  userId: string,
  username: string,
  buyIn: number
): boolean {
  if (game.players.length >= game.maxPlayers) {
    return false;
  }

  // Check if player already in game
  if (game.players.find((p) => p.userId === userId)) {
    return false;
  }

  const player: PokerPlayer = {
    userId,
    username,
    chips: buyIn,
    cards: [],
    bet: 0,
    totalBet: 0,
    folded: false,
    allIn: false,
    isDealer: false,
    isSmallBlind: false,
    isBigBlind: false,
    lastAction: "joined",
    lastActionTime: Date.now(),
    timeoutCount: 0,
  };

  game.players.push(player);
  return true;
}

export function removePlayerFromGame(game: PokerGame, userId: string): boolean {
  const playerIndex = game.players.findIndex((p) => p.userId === userId);
  if (playerIndex === -1) {
    return false;
  }

  // Return chips to player if game hasn't started
  if (game.gamePhase === "waiting") {
    const player = game.players[playerIndex];
    adjustCoins(userId, player.chips, "poker_leave", "poker");
  }

  game.players.splice(playerIndex, 1);
  return true;
}

export function startPokerGame(game: PokerGame): boolean {
  if (game.players.length < game.minPlayers) {
    return false;
  }

  // Set up dealer and blinds
  game.dealerIndex = Math.floor(Math.random() * game.players.length);
  game.players[game.dealerIndex].isDealer = true;

  const smallBlindIndex = (game.dealerIndex + 1) % game.players.length;
  const bigBlindIndex = (game.dealerIndex + 2) % game.players.length;

  game.players[smallBlindIndex].isSmallBlind = true;
  game.players[bigBlindIndex].isBigBlind = true;

  // Post blinds
  const smallBlindPlayer = game.players[smallBlindIndex];
  const bigBlindPlayer = game.players[bigBlindIndex];

  const smallBlindAmount = Math.min(game.smallBlind, smallBlindPlayer.chips);
  const bigBlindAmount = Math.min(game.bigBlind, bigBlindPlayer.chips);

  smallBlindPlayer.chips -= smallBlindAmount;
  smallBlindPlayer.bet = smallBlindAmount;
  smallBlindPlayer.totalBet = smallBlindAmount;
  game.pot += smallBlindAmount;

  bigBlindPlayer.chips -= bigBlindAmount;
  bigBlindPlayer.bet = bigBlindAmount;
  bigBlindPlayer.totalBet = bigBlindAmount;
  game.pot += bigBlindAmount;

  game.currentBet = bigBlindAmount;

  // Deal cards
  for (const player of game.players) {
    const { cards, remainingDeck } = dealCards(game.deck, 2);
    player.cards = cards;
    game.deck = remainingDeck;
  }

  // Set first player to act (after big blind)
  game.currentPlayerIndex = (bigBlindIndex + 1) % game.players.length;
  game.gamePhase = "preflop";
  game.gameStartTime = Date.now();
  game.lastActionTime = Date.now();

  return true;
}

export function getNextPlayer(game: PokerGame): number {
  let nextIndex = (game.currentPlayerIndex + 1) % game.players.length;

  // Find next active player
  while (nextIndex !== game.currentPlayerIndex) {
    const player = game.players[nextIndex];
    if (!player.folded && !player.allIn) {
      return nextIndex;
    }
    nextIndex = (nextIndex + 1) % game.players.length;
  }

  return nextIndex;
}

export function canPlayerAct(game: PokerGame, playerIndex: number): boolean {
  const player = game.players[playerIndex];
  if (player.folded || player.allIn) {
    return false;
  }

  // Check if player has already matched the current bet
  return player.totalBet < game.currentBet || player.chips > 0;
}

export function handlePlayerAction(
  game: PokerGame,
  playerIndex: number,
  action: "fold" | "check" | "call" | "raise" | "all-in",
  amount?: number
): boolean {
  const player = game.players[playerIndex];

  if (!canPlayerAct(game, playerIndex)) {
    return false;
  }

  const callAmount = game.currentBet - player.totalBet;
  const playerChips = player.chips;

  switch (action) {
    case "fold":
      player.folded = true;
      player.lastAction = "folded";
      break;

    case "check":
      if (callAmount > 0) {
        return false; // Can't check when there's a bet to call
      }
      player.lastAction = "checked";
      break;

    case "call":
      if (callAmount === 0) {
        return false; // Can't call when there's nothing to call
      }
      const callChips = Math.min(callAmount, playerChips);
      player.chips -= callChips;
      player.bet += callChips;
      player.totalBet += callChips;
      game.pot += callChips;
      player.lastAction = `called ${callChips}`;

      if (playerChips <= callAmount) {
        player.allIn = true;
        player.lastAction += " (all-in)";
      }
      break;

    case "raise":
      if (!amount || amount <= game.currentBet) {
        return false;
      }
      const raiseAmount = Math.min(amount - player.totalBet, playerChips);
      if (raiseAmount <= 0) {
        return false;
      }
      player.chips -= raiseAmount;
      player.bet += raiseAmount;
      player.totalBet += raiseAmount;
      game.pot += raiseAmount;
      game.currentBet = player.totalBet;
      player.lastAction = `raised to ${player.totalBet}`;

      if (playerChips <= raiseAmount) {
        player.allIn = true;
        player.lastAction += " (all-in)";
      }
      break;

    case "all-in":
      const allInAmount = playerChips;
      player.chips = 0;
      player.bet += allInAmount;
      player.totalBet += allInAmount;
      game.pot += allInAmount;
      player.allIn = true;
      player.lastAction = `all-in ${allInAmount}`;

      if (player.totalBet > game.currentBet) {
        game.currentBet = player.totalBet;
      }
      break;
  }

  player.lastActionTime = Date.now();
  game.lastActionTime = Date.now();
  game.currentPlayerIndex = getNextPlayer(game);

  return true;
}

export function checkRoundComplete(game: PokerGame): boolean {
  const activePlayers = game.players.filter((p) => !p.folded);
  const playersToAct = activePlayers.filter(
    (p) => !p.allIn && p.totalBet < game.currentBet
  );

  return playersToAct.length <= 1;
}

export function advanceGamePhase(game: PokerGame): void {
  switch (game.gamePhase) {
    case "preflop":
      // Deal flop
      const { cards: flopCards, remainingDeck } = dealCards(game.deck, 3);
      game.communityCards = flopCards;
      game.deck = remainingDeck;
      game.gamePhase = "flop";
      break;

    case "flop":
      // Deal turn
      const { cards: turnCard, remainingDeck: deckAfterTurn } = dealCards(
        game.deck,
        1
      );
      game.communityCards.push(turnCard[0]);
      game.deck = deckAfterTurn;
      game.gamePhase = "turn";
      break;

    case "turn":
      // Deal river
      const { cards: riverCard, remainingDeck: deckAfterRiver } = dealCards(
        game.deck,
        1
      );
      game.communityCards.push(riverCard[0]);
      game.deck = deckAfterRiver;
      game.gamePhase = "river";
      break;

    case "river":
      // Go to showdown
      game.gamePhase = "showdown";
      break;
  }

  // Reset bets for new round
  game.currentBet = 0;
  for (const player of game.players) {
    player.bet = 0;
    player.totalBet = 0;
  }

  // Find first active player
  for (let i = 0; i < game.players.length; i++) {
    if (!game.players[i].folded && !game.players[i].allIn) {
      game.currentPlayerIndex = i;
      break;
    }
  }
}

export function evaluateHand(cards: string[]): {
  rank: number;
  name: string;
  cards: string[];
} {
  // Simple hand evaluation - in a real implementation, you'd want a more sophisticated algorithm
  const allCards = [...cards];
  const sortedCards = allCards.sort((a, b) => {
    const rankA = RANKS.indexOf(a.replace(/[♠️♥️♦️♣️]/g, ""));
    const rankB = RANKS.indexOf(b.replace(/[♠️♥️♦️♣️]/g, ""));
    return rankB - rankA;
  });

  // Check for pairs, three of a kind, etc.
  const rankCounts = new Map<string, number>();
  for (const card of allCards) {
    const rank = card.replace(/[♠️♥️♦️♣️]/g, "");
    rankCounts.set(rank, (rankCounts.get(rank) || 0) + 1);
  }

  const counts = Array.from(rankCounts.values()).sort((a, b) => b - a);

  if (counts[0] === 4) {
    return { rank: 7, name: "Four of a Kind", cards: sortedCards };
  } else if (counts[0] === 3 && counts[1] === 2) {
    return { rank: 6, name: "Full House", cards: sortedCards };
  } else if (counts[0] === 3) {
    return { rank: 3, name: "Three of a Kind", cards: sortedCards };
  } else if (counts[0] === 2 && counts[1] === 2) {
    return { rank: 2, name: "Two Pair", cards: sortedCards };
  } else if (counts[0] === 2) {
    return { rank: 1, name: "Pair", cards: sortedCards };
  } else {
    return { rank: 0, name: "High Card", cards: sortedCards };
  }
}

export function determineWinner(game: PokerGame): {
  winners: PokerPlayer[];
  handRank: number;
  handName: string;
} {
  const activePlayers = game.players.filter((p) => !p.folded);

  if (activePlayers.length === 1) {
    return {
      winners: activePlayers,
      handRank: 0,
      handName: "Last Player Standing",
    };
  }

  let bestHand = { rank: -1, name: "", cards: [] as string[] };
  const winners: PokerPlayer[] = [];

  for (const player of activePlayers) {
    const allCards = [...player.cards, ...game.communityCards];
    const hand = evaluateHand(allCards);

    if (hand.rank > bestHand.rank) {
      bestHand = hand;
      winners.length = 0;
      winners.push(player);
    } else if (hand.rank === bestHand.rank) {
      winners.push(player);
    }
  }

  return {
    winners,
    handRank: bestHand.rank,
    handName: bestHand.name,
  };
}

export function endPokerGame(game: PokerGame): {
  winners: PokerPlayer[];
  pot: number;
  handName: string;
} {
  const result = determineWinner(game);

  // Split pot among winners
  const potPerWinner = Math.floor(game.pot / result.winners.length);
  const remainder = game.pot % result.winners.length;

  for (let i = 0; i < result.winners.length; i++) {
    const winner = result.winners[i];
    const winnings = potPerWinner + (i < remainder ? 1 : 0);
    winner.chips += winnings;

    // Update player stats
    adjustCoins(winner.userId, winnings, "poker_win", "poker");
  }

  game.gamePhase = "finished";
  return {
    winners: result.winners,
    pot: game.pot,
    handName: result.handName,
  };
}

export function checkTimeout(game: PokerGame): PokerPlayer[] {
  const now = Date.now();
  const timedOutPlayers: PokerPlayer[] = [];

  for (const player of game.players) {
    if (
      !player.folded &&
      !player.allIn &&
      now - player.lastActionTime > game.timeoutDuration
    ) {
      player.timeoutCount++;

      if (player.timeoutCount >= 3) {
        // Auto-fold after 3 timeouts
        player.folded = true;
        player.lastAction = "folded (timeout)";
        timedOutPlayers.push(player);
      } else {
        // Auto-check/call on timeout
        const callAmount = game.currentBet - player.totalBet;
        if (callAmount > 0) {
          const callChips = Math.min(callAmount, player.chips);
          player.chips -= callChips;
          player.bet += callChips;
          player.totalBet += callChips;
          game.pot += callChips;
          player.lastAction = `called ${callChips} (timeout)`;

          if (player.chips === 0) {
            player.allIn = true;
          }
        } else {
          player.lastAction = "checked (timeout)";
        }
        player.lastActionTime = now;
      }
    }
  }

  return timedOutPlayers;
}

export function getPokerStats(_userId: string): Promise<PokerStats> {
  // This would be implemented with database queries
  // For now, return default stats
  return Promise.resolve({
    totalGames: 0,
    totalWins: 0,
    totalWinnings: 0,
    biggestPot: 0,
    totalHandsPlayed: 0,
  });
}
