import { 
  PokerRoom, 
  RoomId, 
  PlayerId, 
  HandType, 
  Card, 
  RoomStatus 
  } from '../types';
import { 
  createDeck, 
  shuffleDeck, 
  dealCards, 
  findBestHand, 
  } from '../_utils/cardUtils';
import { getPokerRoom, updatePokerRoom } from './pokerService';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';

/**
 * Start a poker game in a room
 */
export const startPokerGame = async (roomId: RoomId): Promise<PokerRoom> => {
  logFunctionStart('startPokerGame', { roomId });
  
  try {
    const room = await getPokerRoom(roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    
    if (room.status !== 'waiting') {
      throw new Error('Room is not in waiting status');
    }
    
    if (room.players.length < room.minPlayers) {
      throw new Error(`Need at least ${room.minPlayers} players to start`);
    }
    
    const readyPlayers = room.players.filter(p => p.isReady);
    if (readyPlayers.length < room.minPlayers) {
      throw new Error(`Need at least ${room.minPlayers} ready players to start`);
    }
    
    // Create and shuffle deck
    const deck = shuffleDeck(createDeck());
    
    // Deal 2 cards to each player
    const updatedPlayers = room.players.map(player => {
      const { cards } = dealCards(deck, 2);
      return {
        ...player,
        cards,
        betAmount: 0,
        totalBet: 0,
        isFolded: false,
        isAllIn: false
      };
    });
    
    // Set up initial game state
    const updatedRoom: PokerRoom = {
      ...room,
      status: 'playing',
      players: updatedPlayers,
      deck: deck.slice(room.players.length * 2), // Remove dealt cards
      communityCards: [],
      pot: 0,
      currentBet: 0,
      minRaise: room.bigBlind,
      bettingRound: 'preflop',
      dealerIndex: 0,
      smallBlindIndex: 1 % room.players.length,
      bigBlindIndex: 2 % room.players.length,
      currentPlayerIndex: (room.bigBlindIndex + 1) % room.players.length,
      startedAt: Date.now(),
      updatedAt: Date.now()
    };
    
    // Post blinds
    const roomWithBlinds = await postBlinds(updatedRoom);
    
    logFunctionEnd('startPokerGame', roomWithBlinds, { roomId });
    return roomWithBlinds;
  } catch (error) {
    logError('startPokerGame', error as Error, { roomId });
    throw error;
  }
};

/**
 * Post small and big blinds
 */
async function postBlinds(room: PokerRoom): Promise<PokerRoom> {
  const updatedPlayers = [...room.players];
  
  // Post small blind
  const smallBlindPlayer = updatedPlayers[room.smallBlindIndex];
  const smallBlindAmount = Math.min(room.smallBlind, smallBlindPlayer.chips);
  updatedPlayers[room.smallBlindIndex] = {
    ...smallBlindPlayer,
    chips: smallBlindPlayer.chips - smallBlindAmount,
    betAmount: smallBlindAmount,
    totalBet: smallBlindAmount,
    isAllIn: smallBlindAmount === smallBlindPlayer.chips
  };
  
  // Post big blind
  const bigBlindPlayer = updatedPlayers[room.bigBlindIndex];
  const bigBlindAmount = Math.min(room.bigBlind, bigBlindPlayer.chips);
  updatedPlayers[room.bigBlindIndex] = {
    ...bigBlindPlayer,
    chips: bigBlindPlayer.chips - bigBlindAmount,
    betAmount: bigBlindAmount,
    totalBet: bigBlindAmount,
    isAllIn: bigBlindAmount === bigBlindPlayer.chips
  };
  
  const updatedRoom = {
    ...room,
    players: updatedPlayers,
    pot: smallBlindAmount + bigBlindAmount,
    currentBet: bigBlindAmount,
    minRaise: room.bigBlind
  };
  
  return await updatePokerRoom(room.id, updatedRoom);
}

/**
 * Process a betting action
 */
export const processBettingAction = async (
  roomId: RoomId,
  playerId: PlayerId,
  action: 'fold' | 'check' | 'call' | 'raise' | 'all-in',
  amount?: number
): Promise<PokerRoom> => {
  logFunctionStart('processBettingAction', { roomId, playerId, action, amount });
  
  try {
    const room = await getPokerRoom(roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    
    if (room.status !== 'playing') {
      throw new Error('Game is not in progress');
    }
    
    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      throw new Error('Player not in room');
    }
    
    if (playerIndex !== room.currentPlayerIndex) {
      throw new Error('Not your turn');
    }
    
    const player = room.players[playerIndex];
    if (player.isFolded) {
      throw new Error('Player has already folded');
    }
    
    const updatedPlayers = [...room.players];
    let updatedRoom = { ...room };
    
    switch (action) {
      case 'fold':
        updatedPlayers[playerIndex] = {
          ...player,
          isFolded: true,
          lastAction: 'fold'
        };
        break;
        
      case 'check':
        if (player.betAmount < room.currentBet) {
          throw new Error('Cannot check when there is a bet to call');
        }
        updatedPlayers[playerIndex] = {
          ...player,
          lastAction: 'check'
        };
        break;
        
      case 'call':
        const callAmount = room.currentBet - player.betAmount;
        if (callAmount > player.chips) {
          throw new Error('Not enough chips to call');
        }
        updatedPlayers[playerIndex] = {
          ...player,
          chips: player.chips - callAmount,
          betAmount: player.betAmount + callAmount,
          totalBet: player.totalBet + callAmount,
          lastAction: 'call'
        };
        updatedRoom.pot += callAmount;
        break;
        
      case 'raise':
        if (!amount || amount <= room.currentBet) {
          throw new Error('Invalid raise amount');
        }
        if (amount > player.chips) {
          throw new Error('Not enough chips to raise');
        }
        const raiseAmount = amount - player.betAmount;
        updatedPlayers[playerIndex] = {
          ...player,
          chips: player.chips - raiseAmount,
          betAmount: amount,
          totalBet: player.totalBet + raiseAmount,
          lastAction: 'raise'
        };
        updatedRoom.pot += raiseAmount;
        updatedRoom.currentBet = amount;
        updatedRoom.minRaise = amount - room.currentBet;
        break;
        
      case 'all-in':
        const allInAmount = player.chips;
        updatedPlayers[playerIndex] = {
          ...player,
          chips: 0,
          betAmount: player.betAmount + allInAmount,
          totalBet: player.totalBet + allInAmount,
          isAllIn: true,
          lastAction: 'all-in'
        };
        updatedRoom.pot += allInAmount;
        if (player.betAmount + allInAmount > updatedRoom.currentBet) {
          updatedRoom.currentBet = player.betAmount + allInAmount;
          updatedRoom.minRaise = allInAmount;
        }
        break;
        
      default:
        throw new Error('Invalid action');
    }
    
    updatedRoom.players = updatedPlayers;
    
    // Move to next player
    updatedRoom = await moveToNextPlayer(updatedRoom);
    
    logFunctionEnd('processBettingAction', updatedRoom, { roomId, playerId, action, amount });
    return updatedRoom;
  } catch (error) {
    logError('processBettingAction', error as Error, { roomId, playerId, action, amount });
    throw error;
  }
};

/**
 * Move to the next player or advance betting round
 */
async function moveToNextPlayer(room: PokerRoom): Promise<PokerRoom> {
  let nextPlayerIndex = (room.currentPlayerIndex + 1) % room.players.length;
  
  // Skip folded players
  while (room.players[nextPlayerIndex].isFolded && nextPlayerIndex !== room.currentPlayerIndex) {
    nextPlayerIndex = (nextPlayerIndex + 1) % room.players.length;
  }
  
  // Check if betting round is complete
  const activePlayers = room.players.filter(p => !p.isFolded);
  const allBetsEqual = activePlayers.every(p => p.betAmount === room.currentBet || p.isAllIn);
  
  if (allBetsEqual && nextPlayerIndex === getFirstActivePlayerIndex(room)) {
    // Betting round is complete, advance to next round
    return await advanceBettingRound(room);
  }
  
  return await updatePokerRoom(room.id, {
    ...room,
    currentPlayerIndex: nextPlayerIndex,
    updatedAt: Date.now()
  });
}

/**
 * Get index of first active (non-folded) player
 */
function getFirstActivePlayerIndex(room: PokerRoom): number {
  for (let i = 0; i < room.players.length; i++) {
    if (!room.players[i].isFolded) {
      return i;
    }
  }
  return 0;
}

/**
 * Advance to the next betting round
 */
async function advanceBettingRound(room: PokerRoom): Promise<PokerRoom> {
  let updatedRoom = { ...room };
  
  switch (room.bettingRound) {
    case 'preflop':
      // Deal flop (3 community cards)
      const { cards: flopCards, remainingDeck } = dealCards(room.deck as Card[], 3);
      updatedRoom = {
        ...updatedRoom,
        communityCards: flopCards,
        deck: remainingDeck,
        bettingRound: 'flop',
        currentBet: 0,
        minRaise: room.bigBlind
      };
      break;
      
    case 'flop':
      // Deal turn (1 community card)
      const { cards: turnCard, remainingDeck: deckAfterTurn } = dealCards(updatedRoom.deck as Card[], 1);
      updatedRoom = {
        ...updatedRoom,
        communityCards: [...updatedRoom.communityCards, ...turnCard],
        deck: deckAfterTurn,
        bettingRound: 'turn',
        currentBet: 0,
        minRaise: room.bigBlind
      };
      break;
      
    case 'turn':
      // Deal river (1 community card)
      const { cards: riverCard, remainingDeck: deckAfterRiver } = dealCards(updatedRoom.deck as Card[], 1);
      updatedRoom = {
        ...updatedRoom,
        communityCards: [...updatedRoom.communityCards, ...riverCard],
        deck: deckAfterRiver,
        bettingRound: 'river',
        currentBet: 0,
        minRaise: room.bigBlind
      };
      break;
      
    case 'river':
      // Game is complete, determine winner
      return await endGame(updatedRoom);
  }
  
  // Reset player bets for new round
  updatedRoom.players = updatedRoom.players.map(player => ({
    ...player,
    betAmount: 0
  }));
  
  // Set current player to first active player after dealer
  updatedRoom.currentPlayerIndex = (updatedRoom.dealerIndex + 1) % room.players.length;
  while (updatedRoom.players[updatedRoom.currentPlayerIndex].isFolded) {
    updatedRoom.currentPlayerIndex = (updatedRoom.currentPlayerIndex + 1) % room.players.length;
  }
  
  return await updatePokerRoom(room.id, updatedRoom);
}

/**
 * End the game and determine winner
 */
async function endGame(room: PokerRoom): Promise<PokerRoom> {
  const activePlayers = room.players.filter(p => !p.isFolded);
  
  if (activePlayers.length === 1) {
    // Only one player left, they win
    const winner = activePlayers[0];
    winner.chips += room.pot;
    
    const updatedRoom = {
      ...room,
      status: 'finished' as RoomStatus,
      players: room.players.map(p => 
        p.id === winner.id ? winner : p
      ),
      endedAt: Date.now(),
      updatedAt: Date.now()
    };
    
    return await updatePokerRoom(room.id, updatedRoom);
  }
  
  // Multiple players, evaluate hands
  const playerHands = activePlayers.map(player => {
    const bestHand = findBestHand(player.cards, room.communityCards);
    return {
      player,
      hand: bestHand
    };
  });
  
  // Find winner(s)
  const sortedHands = playerHands.sort((a, b) => b.hand.value - a.hand.value);
  const winners = sortedHands.filter(hand => hand.hand.value === sortedHands[0].hand.value);
  
  // Split pot among winners
  const potPerWinner = Math.floor(room.pot / winners.length);
  const remainder = room.pot % winners.length;
  
  const updatedPlayers = room.players.map(player => {
    const winner = winners.find(w => w.player.id === player.id);
    if (winner) {
      return {
        ...player,
        chips: player.chips + potPerWinner + (remainder > 0 ? 1 : 0)
      };
    }
    return player;
  });
  
  const updatedRoom = {
    ...room,
    status: 'finished' as RoomStatus,
    players: updatedPlayers,
    endedAt: Date.now(),
    updatedAt: Date.now()
  };
  
  return await updatePokerRoom(room.id, updatedRoom);
}

/**
 * Get game state display for a player
 */
export function getGameStateDisplay(room: PokerRoom, playerId: PlayerId): string {
  const player = room.players.find(p => p.id === playerId);
  if (!player) {
    throw new Error('Player not found');
  }
  
  let display = `🎰 <b>Poker Game - ${room.name}</b>\n\n`;
  
  // Check if game is finished
  if (room.status === 'finished') {
    display += `🏆 <b>Game Complete!</b>\n\n`;
    display += `💰 <b>Final Pot:</b> ${room.pot} coins\n`;
    display += `⏱️ <b>Duration:</b> ${getGameDuration(room)} minutes\n\n`;
    
    // Show community cards
    if (room.communityCards.length > 0) {
      display += `🃏 <b>Community Cards:</b>\n`;
      display += `${room.communityCards.map(card => getCardDisplay(card)).join(' ')}\n\n`;
    }
    
    // Show player's final result
    const activePlayers = room.players.filter(p => !p.isFolded);
    const playerHands = activePlayers.map(p => {
      const bestHand = findBestHand(p.cards, room.communityCards);
      return { player: p, hand: bestHand };
    });
    
    const sortedHands = playerHands.sort((a, b) => b.hand.value - a.hand.value);
    const winningHandValue = sortedHands[0].hand.value;
    const winners = sortedHands.filter(ph => ph.hand.value === winningHandValue);
    const isWinner = winners.some(w => w.player.id === playerId);
    
    display += `🎴 <b>Your Cards:</b>\n`;
    display += `${player.cards.map(card => getCardDisplay(card)).join(' ')}\n\n`;
    
    if (player.isFolded) {
      display += `❌ <b>You folded</b>\n`;
    } else {
      const playerHand = playerHands.find(ph => ph.player.id === playerId);
      if (playerHand) {
        display += `${isWinner ? '🥇' : '🥈'} <b>Your Hand:</b> ${getHandTypeDisplay(playerHand.hand.type)}\n`;
        display += `   ${playerHand.hand.cards.map(card => getCardDisplay(card)).join(' ')}\n\n`;
      }
    }
    
    display += `💎 <b>Final Chips:</b> ${player.chips} (${player.chips > 1000 ? '+' : ''}${player.chips - 1000})\n\n`;
    
    // Show winner announcement
    if (winners.length === 1) {
      const winner = winners[0];
      display += `🏆 <b>Winner: ${winner.player.name}</b>\n`;
      display += `   ${getHandTypeDisplay(winner.hand.type)} - ${winner.hand.cards.map(card => getCardDisplay(card)).join(' ')}\n`;
    } else {
      display += `🏆 <b>Winners (Split Pot):</b>\n`;
      winners.forEach(winner => {
        display += `   ${winner.player.name} - ${getHandTypeDisplay(winner.hand.type)}\n`;
      });
    }
    
    return display;
  }
  
  // Game in progress
  display += `💰 <b>Pot:</b> ${room.pot} coins\n`;
  display += `🎯 <b>Current Bet:</b> ${room.currentBet} coins\n`;
  display += `🔄 <b>Round:</b> ${room.bettingRound}\n\n`;
  
  // Community cards
  if (room.communityCards.length > 0) {
    display += `🃏 <b>Community Cards:</b>\n`;
    display += `${room.communityCards.map(card => getCardDisplay(card)).join(' ')}\n\n`;
  }
  
  // Player's cards
  display += `🎴 <b>Your Cards:</b>\n`;
  display += `${player.cards.map(card => getCardDisplay(card)).join(' ')}\n\n`;
  
  // Player's chips and bet
  display += `💎 <b>Your Chips:</b> ${player.chips}\n`;
  display += `💸 <b>Your Bet:</b> ${player.betAmount}\n\n`;
  
  // Other players
  display += `👥 <b>Players:</b>\n`;
  room.players.forEach(p => {
    if (p.id !== playerId) {
      const status = p.isFolded ? '❌ Folded' : 
                    p.isAllIn ? '🔥 All-In' : 
                    p.betAmount > 0 ? `💰 Bet: ${p.betAmount}` : '⏳ Waiting';
      display += `• ${p.name}: ${p.chips} chips ${status}\n`;
    }
  });
  
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
 * Get hand type display helper
 */
function getHandTypeDisplay(type: HandType): string {
  const displayNames: Record<string, string> = {
    'high-card': 'High Card',
    'pair': 'Pair',
    'two-pair': 'Two Pair',
    'three-of-a-kind': 'Three of a Kind',
    'straight': 'Straight',
    'flush': 'Flush',
    'full-house': 'Full House',
    'four-of-a-kind': 'Four of a Kind',
    'straight-flush': 'Straight Flush',
    'royal-flush': 'Royal Flush'
  };
  
  return displayNames[type] || 'Unknown';
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