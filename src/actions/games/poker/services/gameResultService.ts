import { 
  PokerRoom, 
  RoomId, 
  PlayerId, 
  PokerPlayer, 
  HandEvaluation,
  PokerGameResult
} from '../types';
import { 
  findBestHand, 
  getHandDisplay, 
  getHandTypeDisplay 
} from '../_utils/cardUtils';
import { getPokerRoom, updatePokerRoom } from './pokerService';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';
import { ref, get, set } from 'firebase/database';
import { database } from '@/modules/core/firebase';

/**
 * Get detailed game result display
 */
export function getGameResultDisplay(room: PokerRoom): string {
  if (room.status !== 'finished') {
    throw new Error('Game is not finished');
  }
  
  let display = `🏆 <b>Game Complete!</b>\n\n`;
  display += `🏠 <b>Room:</b> ${room.name}\n`;
  display += `💰 <b>Final Pot:</b> ${room.pot} coins\n`;
  display += `⏱️ <b>Duration:</b> ${getGameDuration(room)} minutes\n\n`;
  
  // Show community cards
  if (room.communityCards.length > 0) {
    display += `🃏 <b>Community Cards:</b>\n`;
    display += `${room.communityCards.map(card => getCardDisplay(card)).join(' ')}\n\n`;
  }
  
  // Show player results
  display += `👥 <b>Player Results:</b>\n`;
  
  const activePlayers = room.players.filter(p => !p.isFolded);
  const playerHands = activePlayers.map(player => {
    const bestHand = findBestHand(player.cards, room.communityCards);
    return {
      player,
      hand: bestHand
    };
  });
  
  // Sort by hand strength
  playerHands.sort((a, b) => b.hand.value - a.hand.value);
  
  // Find winners (players with same highest hand value)
  const winningHandValue = playerHands[0].hand.value;
  const winners = playerHands.filter(ph => ph.hand.value === winningHandValue);
  
  // Display each player's result
  room.players.forEach(player => {
    const playerHand = playerHands.find(ph => ph.player.id === player.id);
    const isWinner = winners.some(w => w.player.id === player.id);
    const isFolded = player.isFolded;
    
    // Use display name (first_name + last_name) instead of username for privacy
    const displayName = player.name || player.username || 'Unknown Player';
    display += `\n${isWinner ? '🥇' : isFolded ? '❌' : '🥈'} <b>${displayName}</b>\n`;
    
    if (isFolded) {
      display += `   Folded\n`;
    } else if (playerHand) {
      display += `   Hand: ${getHandTypeDisplay(playerHand.hand.type)}\n`;
      display += `   Cards: ${playerHand.hand.cards.map(card => getCardDisplay(card)).join(' ')}\n`;
    }
    
    display += `   Chips: ${player.chips} (${player.chips > 1000 ? '+' : ''}${player.chips - 1000})\n`;
  });
  
  // Show winner announcement
  if (winners.length === 1) {
    const winner = winners[0];
    const displayName = winner.player.name || winner.player.username || 'Unknown Player';
    display += `\n🏆 <b>Winner: ${displayName}</b>\n`;
    display += `   ${getHandTypeDisplay(winner.hand.type)} - ${winner.hand.cards.map(card => getCardDisplay(card)).join(' ')}\n`;
  } else {
    display += `\n🏆 <b>Winners (Split Pot):</b>\n`;
    winners.forEach(winner => {
      const displayName = winner.player.name || winner.player.username || 'Unknown Player';
      display += `   ${displayName} - ${getHandTypeDisplay(winner.hand.type)}\n`;
    });
  }
  
  return display;
}

/**
 * Get game duration in minutes
 */
function getGameDuration(room: PokerRoom): number {
  if (!room.startedAt || !room.endedAt) {
    return 0;
  }
  
  const durationMs = room.endedAt - room.startedAt;
  return Math.round(durationMs / (1000 * 60));
}

/**
 * Get card display helper
 */
function getCardDisplay(card: any): string {
  const suitSymbols: Record<string, string> = {
    'hearts': '♥️',
    'diamonds': '♦️',
    'clubs': '♣️',
    'spades': '♠️'
  };
  
  return `${card.rank}${suitSymbols[card.suit]}`;
}

/**
 * Track game statistics for a player
 */
export async function trackGameStatistics(
  room: PokerRoom,
  playerId: PlayerId
): Promise<void> {
  logFunctionStart('trackGameStatistics', { roomId: room.id, playerId });
  
  try {
    const player = room.players.find(p => p.id === playerId);
    if (!player) {
      throw new Error('Player not found in room');
    }
    
    // Calculate statistics
    const initialChips = 1000; // Default starting chips
    const finalChips = player.chips;
    const chipsWon = finalChips - initialChips;
    const isWinner = chipsWon > 0;
    
    // Store statistics in Firebase
    const statsRef = ref(database, `playerStats/${playerId}`);
    const currentStats = await get(statsRef);
    
    const existingStats = currentStats.exists() ? currentStats.val() : {
      gamesPlayed: 0,
      gamesWon: 0,
      totalChipsWon: 0,
      totalChipsLost: 0,
      bestHand: 'None',
      lastUpdated: Date.now()
    };
    
    // Update statistics
    const updatedStats = {
      ...existingStats,
      gamesPlayed: existingStats.gamesPlayed + 1,
      gamesWon: existingStats.gamesWon + (isWinner ? 1 : 0),
      totalChipsWon: existingStats.totalChipsWon + (isWinner ? chipsWon : 0),
      totalChipsLost: existingStats.totalChipsLost + (isWinner ? 0 : Math.abs(chipsWon)),
      lastUpdated: Date.now()
    };
    
    // Update best hand if applicable
    if (!player.isFolded && room.communityCards.length === 5) {
      const bestHand = findBestHand(player.cards, room.communityCards);
      const handType = getHandTypeDisplay(bestHand.type);
      
      // Simple hand strength comparison (you might want to implement a more sophisticated ranking)
      const handStrength = getHandStrength(bestHand.type);
      const currentBestStrength = getHandStrength(existingStats.bestHand);
      
      if (handStrength > currentBestStrength) {
        updatedStats.bestHand = handType;
      }
    }
    
    await set(statsRef, updatedStats);
    
    logFunctionEnd('trackGameStatistics', updatedStats, { roomId: room.id, playerId });
  } catch (error) {
    logError('trackGameStatistics', error as Error, { roomId: room.id, playerId });
    throw error;
  }
}

/**
 * Get player statistics
 */
export async function getPlayerStatistics(playerId: PlayerId): Promise<{
  gamesPlayed: number;
  gamesWon: number;
  totalChipsWon: number;
  totalChipsLost: number;
  winRate: number;
  bestHand: string;
}> {
  logFunctionStart('getPlayerStatistics', { playerId });
  
  try {
    // Fetch statistics from Firebase
    const statsRef = ref(database, `playerStats/${playerId}`);
    const snapshot = await get(statsRef);
    
    if (!snapshot.exists()) {
      const defaultStats = {
        gamesPlayed: 0,
        gamesWon: 0,
        totalChipsWon: 0,
        totalChipsLost: 0,
        winRate: 0,
        bestHand: 'None'
      };
      
      logFunctionEnd('getPlayerStatistics', defaultStats, { playerId });
      return defaultStats;
    }
    
    const stats = snapshot.val();
    const winRate = stats.gamesPlayed > 0 ? (stats.gamesWon / stats.gamesPlayed) * 100 : 0;
    
    const result = {
      gamesPlayed: stats.gamesPlayed || 0,
      gamesWon: stats.gamesWon || 0,
      totalChipsWon: stats.totalChipsWon || 0,
      totalChipsLost: stats.totalChipsLost || 0,
      winRate: Math.round(winRate * 100) / 100, // Round to 2 decimal places
      bestHand: stats.bestHand || 'None'
    };
    
    logFunctionEnd('getPlayerStatistics', result, { playerId });
    return result;
  } catch (error) {
    logError('getPlayerStatistics', error as Error, { playerId });
    throw error;
  }
}

/**
 * Get hand strength for comparison
 */
function getHandStrength(handType: string): number {
  const strengthMap: Record<string, number> = {
    'high-card': 1,
    'pair': 2,
    'two-pair': 3,
    'three-of-a-kind': 4,
    'straight': 5,
    'flush': 6,
    'full-house': 7,
    'four-of-a-kind': 8,
    'straight-flush': 9,
    'royal-flush': 10
  };
  
  return strengthMap[handType] || 0;
}

/**
 * Get hand history for a game
 */
export function getHandHistory(room: PokerRoom): string {
  if (room.status !== 'finished') {
    throw new Error('Game is not finished');
  }
  
  let history = `📜 <b>Hand History</b>\n\n`;
  history += `🏠 Room: ${room.name}\n`;
  history += `💰 Final Pot: ${room.pot} coins\n\n`;
  
  // Show betting rounds
  history += `🔄 <b>Betting Rounds:</b>\n`;
  
  const activePlayers = room.players.filter(p => !p.isFolded);
  
  // Preflop
  history += `\n📋 <b>Preflop:</b>\n`;
  activePlayers.forEach(player => {
    const action = player.lastAction || 'No action';
    history += `   ${player.name}: ${action} (${player.totalBet} chips)\n`;
  });
  
  // Show community cards for each round
  if (room.communityCards.length >= 3) {
    history += `\n🃏 <b>Flop:</b> ${room.communityCards.slice(0, 3).map(card => getCardDisplay(card)).join(' ')}\n`;
  }
  
  if (room.communityCards.length >= 4) {
    history += `🃏 <b>Turn:</b> ${getCardDisplay(room.communityCards[3])}\n`;
  }
  
  if (room.communityCards.length >= 5) {
    history += `🃏 <b>River:</b> ${getCardDisplay(room.communityCards[4])}\n`;
  }
  
  // Show final hands
  history += `\n🎴 <b>Final Hands:</b>\n`;
  activePlayers.forEach(player => {
    const bestHand = findBestHand(player.cards, room.communityCards);
    history += `   ${player.name}: ${getHandTypeDisplay(bestHand.type)} - ${bestHand.cards.map(card => getCardDisplay(card)).join(' ')}\n`;
  });
  
  return history;
}

/**
 * Get game summary for quick overview
 */
export function getGameSummary(room: PokerRoom): string {
  if (room.status !== 'finished') {
    throw new Error('Game is not finished');
  }
  
  const activePlayers = room.players.filter(p => !p.isFolded);
  const playerHands = activePlayers.map(player => {
    const bestHand = findBestHand(player.cards, room.communityCards);
    return {
      player,
      hand: bestHand
    };
  });
  
  // Sort by hand strength
  playerHands.sort((a, b) => b.hand.value - a.hand.value);
  const winner = playerHands[0];
  
  let summary = `🏆 <b>Game Summary</b>\n\n`;
  summary += `🏠 Room: ${room.name}\n`;
  summary += `💰 Pot: ${room.pot} coins\n`;
  summary += `👥 Players: ${room.players.length}\n`;
  summary += `⏱️ Duration: ${getGameDuration(room)} minutes\n\n`;
  summary += `🥇 Winner: ${winner.player.name}\n`;
  summary += `   ${getHandTypeDisplay(winner.hand.type)}\n`;
  
  return summary;
} 