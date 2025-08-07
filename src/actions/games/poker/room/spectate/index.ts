import { HandlerContext } from '@/modules/core/handler';
import { generateSpectatorKeyboard } from '../../buttonHelpers';
import { getPokerRoom } from '../../services/pokerService';
import { validateRoomIdWithError, validatePlayerIdWithError } from '../../_utils/pokerUtils';
import { PokerRoom, Card } from '../../types';

// Export the action key for consistency and debugging
export const key = 'games.poker.room.spectate';

/**
 * Handle spectator mode - watch games without participating
 */
async function handleSpectate(context: HandlerContext, query: Record<string, string> = {}): Promise<void> {
  const { user, ctx } = context;
  const { roomId } = query;
  
  if (!roomId) {
    throw new Error('Room ID is required');
  }
  
  try {
    // Validate IDs
    const validatedRoomId = validateRoomIdWithError(roomId);
    const validatedPlayerId = validatePlayerIdWithError(user.id.toString());
    
    // Get current room state
    const room = await getPokerRoom(validatedRoomId);
    if (!room) {
      throw new Error('Room not found');
    }
    
    // Check if user is already a player in this room
    const isPlayer = room.players.some(p => p.id === validatedPlayerId);
    if (isPlayer) {
      throw new Error('You are already a player in this room. Use the game view instead.');
    }
    
    // Create spectator view
    const spectatorMessage = createSpectatorView(room);
    
    // Generate spectator keyboard
    const keyboard = generateSpectatorKeyboard(roomId);
    
    await ctx.replySmart(spectatorMessage, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
    
  } catch (error) {
    console.error('Spectate action error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    await ctx.replySmart(`❌ Failed to spectate: ${errorMessage}`, {
      parse_mode: 'HTML'
    });
  }
}

/**
 * Create spectator view of the game
 */
function createSpectatorView(room: PokerRoom): string {
  let view = `👁️ <b>Spectator Mode - ${room.name}</b>\n\n`;
  
  // Room status
  view += `📊 <b>Room Status:</b> ${room.status}\n`;
  view += `👥 <b>Players:</b> ${room.players.length}/${room.maxPlayers}\n`;
  view += `💰 <b>Blinds:</b> ${room.smallBlind}/${room.bigBlind} coins\n\n`;
  
  if (room.status === 'waiting') {
    // Waiting room view
    view += `⏳ <b>Waiting for players...</b>\n\n`;
    
    view += `👥 <b>Players in Room:</b>\n`;
    room.players.forEach((player, index) => {
      const status = player.isReady ? '✅ Ready' : '⏸️ Not Ready';
      const creator = room.createdBy === player.id ? ' (Creator)' : '';
      view += `${index + 1}. ${player.name}${creator} - ${status}\n`;
    });
    
    const readyCount = room.players.filter(p => p.isReady).length;
    const minPlayers = room.minPlayers;
    
    if (readyCount >= minPlayers) {
      view += `\n✅ <b>Ready to start!</b> (${readyCount}/${minPlayers} ready)`;
    } else {
      view += `\n⏳ <b>Waiting for more players...</b> (${readyCount}/${minPlayers} ready)`;
    }
    
  } else if (room.status === 'playing') {
    // Game in progress view
    view += `🎮 <b>Game in Progress</b>\n\n`;
    
    // Game info
    view += `💰 <b>Pot:</b> ${room.pot} coins\n`;
    view += `🎯 <b>Current Bet:</b> ${room.currentBet} coins\n`;
    view += `🔄 <b>Round:</b> ${room.bettingRound}\n\n`;
    
    // Community cards
    if (room.communityCards.length > 0) {
      view += `🃏 <b>Community Cards:</b>\n`;
      view += `${room.communityCards.map(card => getCardDisplay(card)).join(' ')}\n\n`;
    }
    
    // Players (without showing their cards)
    view += `👥 <b>Players:</b>\n`;
    room.players.forEach((player, index) => {
      const isCurrentPlayer = index === room.currentPlayerIndex;
      const status = player.isFolded ? '❌ Folded' : 
                    player.isAllIn ? '🔥 All-In' : 
                    isCurrentPlayer ? '🎯 Current Turn' :
                    player.betAmount > 0 ? `💰 Bet: ${player.betAmount}` : '⏳ Waiting';
      
      view += `${index + 1}. ${player.name}: ${player.chips} chips ${status}\n`;
    });
    
    // Current player info
    const currentPlayer = room.players[room.currentPlayerIndex];
    if (currentPlayer && !currentPlayer.isFolded) {
      view += `\n🎯 <b>Current Turn:</b> ${currentPlayer.name}`;
    }
    
  } else if (room.status === 'finished') {
    // Game finished view
    view += `🏆 <b>Game Complete!</b>\n\n`;
    view += `💰 <b>Final Pot:</b> ${room.pot} coins\n`;
    
    // Show community cards
    if (room.communityCards.length > 0) {
      view += `🃏 <b>Community Cards:</b>\n`;
      view += `${room.communityCards.map(card => getCardDisplay(card)).join(' ')}\n\n`;
    }
    
    // Show player results (without their hole cards)
    view += `👥 <b>Player Results:</b>\n`;
    room.players.forEach((player, index) => {
      const result = player.isFolded ? '❌ Folded' : 
                    player.chips > 1000 ? `🥇 Winner (+${player.chips - 1000})` :
                    player.chips < 1000 ? `🥈 Lost (${player.chips - 1000})` : '🥉 No change';
      
      view += `${index + 1}. ${player.name}: ${result}\n`;
    });
  }
  
  view += `\n\n👁️ <b>Spectator Mode</b>\n`;
  view += `You are watching this game as a spectator.`;
  
  return view;
}

/**
 * Get card display helper
 */
function getCardDisplay(card: Card): string {
  const suitSymbols: Record<string, string> = {
    'hearts': '♥️',
    'diamonds': '♦️',
    'clubs': '♣️',
    'spades': '♠️'
  };
  
  return `${card.rank}${suitSymbols[card.suit]}`;
}

export default handleSpectate; 