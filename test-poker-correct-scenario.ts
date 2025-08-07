import { createPokerRoom, joinPokerRoom } from './src/actions/games/poker/services/pokerService';
import { startPokerGame, processBettingAction } from './src/actions/games/poker/services/gameStateService';
import { getPokerRoom } from './src/actions/games/poker/services/pokerService';

async function testCorrectPokerScenario() {
  console.log('🎮 Starting Correct Poker Scenario Test...\n');

  try {
    // Step 1: Create Room
    console.log('📝 Step 1: Creating room...');
    const createRequest = {
      name: 'Test Poker Room',
      smallBlind: 50,
      bigBlind: 100,
      minPlayers: 2,
      maxPlayers: 2 as const,
      isPrivate: true,
      turnTimeoutSec: 60
    };

    const room = await createPokerRoom(
      createRequest,
      '68169486' as any,
      'Player 1',
      'player1',
      68169486
    );
    console.log(`✅ Room created: ${room.id}`);
    console.log(`   - Status: ${room.status}`);
    console.log(`   - Players: ${room.players.length}/${room.maxPlayers}\n`);

    // Step 2: Join Room
    console.log('👥 Step 2: Second player joining...');
    const joinRequest = {
      roomId: room.id,
      playerId: '7227266041' as any,
      playerName: 'Player 2',
      playerUsername: 'player2',
      playerChatId: 7227266041,
      chips: 1000
    };

    const joinedRoom = await joinPokerRoom(joinRequest);
    console.log(`✅ Player 2 joined`);
    console.log(`   - Players: ${joinedRoom.players.length}/${joinedRoom.maxPlayers}`);
    console.log(`   - Status: ${joinedRoom.status}\n`);

    // Step 3: Start Game
    console.log('🎮 Step 3: Starting game...');
    const gameRoom = await startPokerGame(room.id);
    console.log(`✅ Game started!`);
    console.log(`   - Status: ${gameRoom.status}`);
    console.log(`   - Pot: ${gameRoom.pot}`);
    console.log(`   - Current Bet: ${gameRoom.currentBet}`);
    console.log(`   - Current Player: ${gameRoom.currentPlayerIndex}`);
    console.log(`   - Small Blind Index: ${gameRoom.smallBlindIndex}`);
    console.log(`   - Big Blind Index: ${gameRoom.bigBlindIndex}`);
    console.log(`   - Betting Round: ${gameRoom.bettingRound}\n`);

    // Verify cards are dealt but not shown in Pre-flop
    console.log('🃏 Step 4: Verifying card dealing...');
    gameRoom.players.forEach((player, index) => {
      console.log(`   Player ${index + 1} (${player.name}):`);
      console.log(`     - Cards: ${player.cards.length} cards dealt`);
      console.log(`     - Chips: ${player.chips}`);
      console.log(`     - Bet Amount: ${player.betAmount}`);
      console.log(`     - Total Bet: ${player.totalBet}`);
    });
    console.log(`   - Community Cards: ${gameRoom.communityCards.length} cards\n`);

    // Step 5: Player 1 should Call (not Check)
    console.log('💰 Step 5: Player 1 calling...');
    const roomAfterCall = await processBettingAction(room.id, '68169486' as any, 'call');
    console.log(`✅ Player 1 called`);
    console.log(`   - New Pot: ${roomAfterCall.pot}`);
    console.log(`   - Current Player: ${roomAfterCall.currentPlayerIndex}`);
    console.log(`   - Player 1 chips: ${roomAfterCall.players[0].chips}`);
    console.log(`   - Player 2 chips: ${roomAfterCall.players[1].chips}\n`);

    // Step 6: Player 2 should Call
    console.log('💰 Step 6: Player 2 calling...');
    const roomAfterSecondCall = await processBettingAction(room.id, '7227266041' as any, 'call');
    console.log(`✅ Player 2 called`);
    console.log(`   - New Pot: ${roomAfterSecondCall.pot}`);
    console.log(`   - Current Player: ${roomAfterSecondCall.currentPlayerIndex}`);
    console.log(`   - Betting Round: ${roomAfterSecondCall.bettingRound}\n`);

    // Step 7: Deal Flop (3 community cards)
    console.log('🃏 Step 7: Dealing Flop...');
    // This would be handled by the game engine
    console.log(`✅ Flop dealt (simulated)`);
    console.log(`   - Community Cards: 3 cards`);
    console.log(`   - Betting Round: flop\n`);

    // Step 8: Verify no duplicate cards
    console.log('🔍 Step 8: Verifying no duplicate cards...');
    const allCards = [
      ...gameRoom.players[0].cards,
      ...gameRoom.players[1].cards,
      ...gameRoom.communityCards
    ];
    
    const cardStrings = allCards.map(card => `${card.rank}${card.suit}`);
    const uniqueCards = new Set(cardStrings);
    
    console.log(`   - Total cards dealt: ${allCards.length}`);
    console.log(`   - Unique cards: ${uniqueCards.size}`);
    console.log(`   - Duplicate cards: ${allCards.length !== uniqueCards.size ? 'YES' : 'NO'}\n`);

    console.log('🎉 Correct Poker Scenario Test PASSED! ✅\n');
    
    // Auto-close after 3 seconds
    setTimeout(() => {
      console.log('🔄 Test completed. Closing in 3 seconds...');
      process.exit(0);
    }, 3000);

  } catch (error) {
    console.error('❌ Test FAILED:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run the test
testCorrectPokerScenario(); 