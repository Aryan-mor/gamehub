import { 
  PokerRoom, 
  PlayerId
} from '../types';
import { 
  findBestHand, 
  getCardDisplay,
  getHandTypeDisplay
} from '../_utils/cardUtils';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';
// import { api } from '@/lib/api'; // TODO: Use API client instead of direct supabase calls

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
 * Track game statistics (placeholder - Firebase removed)
 */
export async function trackGameStatistics(
  room: PokerRoom,
  playerId: PlayerId
): Promise<void> {
  logFunctionStart('trackGameStatistics', { roomId: room.id, playerId });
  
  try {
    // TODO: Implement statistics tracking with Supabase
    console.log('Statistics tracking not implemented yet');
    
    logFunctionEnd('trackGameStatistics', {}, { roomId: room.id, playerId });
  } catch (error) {
    logError('trackGameStatistics', error as Error, { roomId: room.id, playerId });
    throw error;
  }
}

/**
 * Get player statistics (placeholder - Firebase removed)
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
    // TODO: Implement statistics retrieval with Supabase
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
  } catch (error) {
    logError('getPlayerStatistics', error as Error, { playerId });
    throw error;
  }
}

/**
 * Get hand strength for sorting
 */
// function getHandStrength(handType: string): number {
//   const strengths: Record<string, number> = {
//     'high-card': 1,
//     'pair': 2,
//     'two-pair': 3,
//     'three-of-a-kind': 4,
//     'straight': 5,
//     'flush': 6,
//     'full-house': 7,
//     'four-of-a-kind': 8,
//     'straight-flush': 9,
//     'royal-flush': 10
//   };
//   
//   return strengths[handType] || 0;
// }

/**
 * Get hand history for the game
 */
export function getHandHistory(room: PokerRoom): string {
  if (room.status !== 'finished') {
    return 'Game is not finished yet';
  }
  
  let history = `📜 <b>Game History</b>\n\n`;
  history += `🏠 Room: ${room.name}\n`;
  history += `💰 Final Pot: ${room.pot} coins\n`;
  history += `⏱️ Duration: ${getGameDuration(room)} minutes\n\n`;
  
  // Show community cards
  if (room.communityCards.length > 0) {
    history += `🃏 Community Cards:\n`;
    history += `${room.communityCards.map(card => getCardDisplay(card)).join(' ')}\n\n`;
  }
  
  // Show player hands
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
  
  history += `👥 Player Hands:\n`;
  playerHands.forEach(({ player, hand }) => {
    const displayName = player.name || player.username || 'Unknown Player';
    history += `   ${displayName}: ${getHandTypeDisplay(hand.type)} - ${hand.cards.map(card => getCardDisplay(card)).join(' ')}\n`;
  });
  
  return history;
}

/**
 * Get game summary
 */
export function getGameSummary(room: PokerRoom): string {
  if (room.status !== 'finished') {
    return 'Game is not finished yet';
  }
  
  let summary = `📊 <b>Game Summary</b>\n\n`;
  summary += `🏠 Room: ${room.name}\n`;
  summary += `💰 Final Pot: ${room.pot} coins\n`;
  summary += `⏱️ Duration: ${getGameDuration(room)} minutes\n\n`;
  
  // Find winner
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
  
  if (playerHands.length > 0) {
    const winner = playerHands[0];
    const displayName = winner.player.name || winner.player.username || 'Unknown Player';
    summary += `🏆 Winner: ${displayName}\n`;
    summary += `   ${getHandTypeDisplay(winner.hand.type)}\n`;
  }
  
  return summary;
} 