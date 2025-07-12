"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { GameService } from '@/lib/gameService';
import { GameState, PlayerInfo } from '@/lib/game';

export default function TestTimeoutManualPage() {
  const { data: session, status } = useSession();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameId, setGameId] = useState<string>('');
  const [testResult, setTestResult] = useState<string>('');

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
        setTestResult(`Created test game: ${newGameId}`);

        // Subscribe to game updates
        const unsubscribe = GameService.subscribeToGame(newGameId, (state) => {
          setGameState(state);
          if (state) {
            setTestResult(prev => prev + `\nGame state updated: ${state.status}`);
          }
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error creating test game:', error);
        setTestResult(`Error creating game: ${error}`);
      }
    };

    createTestGame();
  }, [session?.user?.email]);

  const handleManualTimeoutCheck = async () => {
    if (!gameId) {
      setTestResult('No game ID available');
      return;
    }

    try {
      setTestResult('Checking timeout manually...');
      const timeoutOccurred = await GameService.checkAndHandleTimeout(gameId);
      setTestResult(prev => prev + `\nTimeout check result: ${timeoutOccurred ? 'TIMEOUT OCCURRED' : 'No timeout'}`);
    } catch (error) {
      setTestResult(prev => prev + `\nError checking timeout: ${error}`);
    }
  };

  const handleForceTimeout = async () => {
    if (!gameId) {
      setTestResult('No game ID available');
      return;
    }

    try {
      setTestResult('Forcing timeout...');
      await GameService.handleInactivityTimeout(gameId);
      setTestResult(prev => prev + '\nForced timeout completed');
    } catch (error) {
      setTestResult(prev => prev + `\nError forcing timeout: ${error}`);
    }
  };

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'unauthenticated') {
    return <div>Please log in to test timeout functionality.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Manual Timeout Test</h1>
        
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
            <p className="text-blue-800">
              <strong>Turn Started At:</strong> {gameState?.turnStartedAt ? new Date(gameState.turnStartedAt).toLocaleTimeString() : 'None'}
            </p>
            <p className="text-blue-800">
              <strong>Timeout Duration:</strong> {gameState?.timeoutDuration || 5000}ms
            </p>
          </div>
        )}

        <div className="bg-white rounded-lg p-6 border border-gray-200 mb-6">
          <h2 className="text-lg font-semibold mb-4">Test Controls</h2>
          <div className="space-y-4">
            <button
              onClick={handleManualTimeoutCheck}
              className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors mr-4"
            >
              Check Timeout Manually
            </button>
            <button
              onClick={handleForceTimeout}
              className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
            >
              Force Timeout
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Test Results</h2>
          <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-64">
            {testResult || 'No test results yet...'}
          </pre>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
          <h2 className="text-lg font-semibold mb-4">Instructions</h2>
          <ul className="list-disc list-inside space-y-2 text-yellow-800">
            <li>This page creates a test game with 5-second timeout</li>
            <li>Use "Check Timeout Manually" to test the timeout logic</li>
            <li>Use "Force Timeout" to immediately trigger a timeout</li>
            <li>Watch the console for detailed timeout debugging logs</li>
            <li>The game should end and show a winner when timeout occurs</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 