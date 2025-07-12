"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { GameService } from '@/lib/gameService';
import { GameState, PlayerInfo } from '@/lib/game';
import Timer from '@/components/Timer';

export default function TestTimeoutPage() {
  const { data: session, status } = useSession();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameId, setGameId] = useState<string>('');

  useEffect(() => {
    if (!session?.user?.email) return;

    const createTestGame = async () => {
      try {
        const playerInfo: PlayerInfo = {
          id: session.user?.email || '',
          name: session.user?.name || 'Test Player',
          email: session.user?.email || '',
          image: session.user?.image || undefined,
        };

        const newGameId = await GameService.createGame(playerInfo);
        setGameId(newGameId);

        // Subscribe to game updates
        const unsubscribe = GameService.subscribeToGame(newGameId, (state) => {
          setGameState(state);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error creating test game:', error);
      }
    };

    createTestGame();
  }, [session?.user?.email]);

  const getCurrentPlayer = () => {
    if (!gameState || !session?.user?.email) return null;
    
    const userEmail = session.user.email;
    if (gameState.players.X?.id === userEmail) return 'X';
    if (gameState.players.O?.id === userEmail) return 'O';
    return null;
  };

  const currentPlayer = getCurrentPlayer();
  const isMyTurn = currentPlayer === gameState?.currentPlayer;

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'unauthenticated') {
    return <div>Please log in to test timeout functionality.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Timeout Test</h1>
        
        {gameId && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800">
              <strong>Game ID:</strong> {gameId}
            </p>
            <p className="text-blue-800">
              <strong>Status:</strong> {gameState?.status || 'Loading...'}
            </p>
            <p className="text-blue-800">
              <strong>Current Player:</strong> {gameState?.currentPlayer || 'None'}
            </p>
            <p className="text-blue-800">
              <strong>Winner:</strong> {gameState?.winner || 'None'}
            </p>
          </div>
        )}

        {gameState && (
          <div className="mb-6">
            <Timer
              turnStartedAt={gameState.turnStartedAt}
              timeoutDuration={gameState.timeoutDuration}
              isMyTurn={isMyTurn}
              gameStatus={gameState.status}
            />
          </div>
        )}

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Test Instructions</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>This test creates a game with a 5-second timeout</li>
            <li>Open this page in two different browser windows/tabs</li>
            <li>Log in with different accounts in each window</li>
            <li>Join the same game from both windows</li>
            <li>Wait for 5 seconds without making any moves</li>
            <li>The game should automatically end due to inactivity</li>
            <li>The active player should be declared the winner</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 