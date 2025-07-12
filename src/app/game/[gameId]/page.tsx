"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { GameService } from '@/lib/gameService';
import { GameState, PlayerInfo, isDraw } from '@/lib/game';
import TicTacToeBoard from '@/components/TicTacToeBoard';
import Timer from '@/components/Timer';
import { 
  ArrowLeftIcon, 
  ArrowPathIcon,
  UserIcon 
} from '@heroicons/react/24/outline';

export default function GamePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const gameId = params.gameId as string;
  
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMakingMove, setIsMakingMove] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const getCurrentPlayer = () => {
    if (!gameState || !session?.user?.email) return null;
    
    const userEmail = session.user.email;
    if (gameState.players.X?.id === userEmail) return 'X';
    if (gameState.players.O?.id === userEmail) return 'O';
    return null;
  };

  useEffect(() => {
    if (!gameId || !session?.user?.email) return;

    // Subscribe to game updates
    const unsubscribe = GameService.subscribeToGame(gameId, (state) => {
      setGameState(state);
      setIsLoading(false);
      
      if (!state) {
        setError('Game not found or has been deleted.');
      }
    });

    // Handle page unload (tab close, navigation) to mark player as disconnected
    const handleBeforeUnload = () => {
      if (session?.user?.email) {
        // Use sendBeacon for reliable disconnect notification
        const data = JSON.stringify({
          gameId,
          playerId: session.user.email,
          action: 'disconnect'
        });
        navigator.sendBeacon('/api/game/disconnect', data);
      }
    };

    // Periodic heartbeat to keep player marked as connected
    const heartbeatInterval = setInterval(() => {
      if (session?.user?.email && gameState) {
        GameService.rejoinGame(gameId, session.user.email).catch(console.error);
      }
    }, 30000); // Every 30 seconds

    // Periodic timeout checking - moved to separate useEffect

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(heartbeatInterval);
      
      // Also handle disconnect on component unmount
      if (session?.user?.email) {
        GameService.handlePlayerDisconnect(gameId, session.user.email).catch(console.error);
      }
    };
  }, [gameId, session?.user?.email]);

  // Separate effect for joining game or reconnecting
  useEffect(() => {
    if (!gameState || !session?.user?.email) return;
    
    const currentPlayer = getCurrentPlayer();
    const userEmail = session.user.email;
    
    // Check if user is already in the game but disconnected
    const isDisconnectedPlayer = 
      (gameState.players.X?.id === userEmail && gameState.players.X?.disconnected) ||
      (gameState.players.O?.id === userEmail && gameState.players.O?.disconnected);
    
    // Join if not a player, or reconnect if disconnected
    if (!currentPlayer && (gameState.status === 'waiting' || isDisconnectedPlayer)) {
      const joinGameIfNeeded = async () => {
        try {
          const playerInfo: PlayerInfo = {
            id: session.user?.email || '',
            name: session.user?.name || 'Anonymous',
            email: session.user?.email || '',
            image: session.user?.image || undefined,
          };
          
          await GameService.joinGame(gameId, playerInfo);
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to join game.';
          setError(errorMessage);
          console.error('Error joining game:', err);
        }
      };

      joinGameIfNeeded();
    }
  }, [gameState?.status, gameState?.players, session?.user?.email, gameId]);

  // Separate effect for timeout checking - runs continuously
  useEffect(() => {
    if (!gameId) return;

    const timeoutInterval = setInterval(() => {
      console.log('Continuous timeout check for game:', gameId);
      GameService.checkAndHandleTimeout(gameId).catch(console.error);
    }, 1000); // Check every 1 second

    return () => {
      clearInterval(timeoutInterval);
    };
  }, [gameId]);

  const handleCellClick = async (index: number) => {
    if (!gameState || !session?.user?.email || isMakingMove) return;
    
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer || gameState.currentPlayer !== currentPlayer) return;
    
    // Additional checks to prevent invalid moves
    if (gameState.status !== 'playing') {
      setError(`Game is in ${gameState.status} state. Cannot make moves.`);
      return;
    }
    
    // Remove the redundant cell occupation check - the TicTacToeBoard component handles this
    // The board state might be stale here due to Firebase real-time updates
    
    setIsMakingMove(true);
    setError(''); // Clear any previous errors
    
    try {
      const userEmail = session?.user?.email;
      if (!userEmail) {
        throw new Error('User email is required');
      }
      await GameService.makeMove(gameId, userEmail, index);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to make move.';
      setError(errorMessage);
      console.error('Error making move:', err);
    } finally {
      setIsMakingMove(false);
    }
  };

  const handleResetGame = async () => {
    if (!session?.user?.email || isResetting) return;
    
    setIsResetting(true);
    
    try {
      await GameService.resetGame(gameId);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset game.';
      setError(errorMessage);
      console.error('Error resetting game:', err);
    } finally {
      setIsResetting(false);
    }
  };

  const handleLeaveGame = async () => {
    if (!session?.user?.email) return;
    
    try {
      // Handle disconnect gracefully - don't actually leave the game
      await GameService.handlePlayerDisconnect(gameId, session.user.email);
      router.push('/lobby');
    } catch (err: unknown) {
      console.error('Error handling disconnect:', err);
      router.push('/lobby');
    }
  };

  // Redirect to login if not authenticated
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !gameState) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800 text-lg mb-4">{error}</p>
            <button
              onClick={() => router.push('/lobby')}
              className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Lobby
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentPlayer = getCurrentPlayer();
  const isMyTurn = currentPlayer === gameState.currentPlayer;
  const gameOver = gameState.status === 'won' || gameState.status === 'draw' || gameState.status === 'timeout';
  
  // Debug logging
  console.log('Game page render:', {
    gameState,
    board: gameState.board,
    currentPlayer,
    isMyTurn,
    gameOver
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleLeaveGame}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Leave Game
          </button>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Game #{gameId}</h1>
            <p className="text-sm text-gray-600">
              {gameState.status === 'waiting' && (
                <span className="text-orange-600">
                  Waiting for another player to join...
                </span>
              )}
              {gameState.status === 'playing' && (
                <span className={isMyTurn ? 'text-green-600 font-semibold' : 'text-gray-600'}>
                  {isMyTurn ? 'Your turn' : 'Opponent\'s turn'}
                </span>
              )}
              {gameState.status === 'won' && (
                <span className="text-green-600 font-semibold">
                  Player {gameState.winner} wins!
                </span>
              )}
              {gameState.status === 'draw' && (
                <span className="text-gray-600 font-semibold">
                  It&apos;s a draw!
                </span>
              )}
              {gameState.status === 'timeout' && (
                <span className="text-orange-600 font-semibold">
                  Game ended due to inactivity
                </span>
              )}
            </p>
          </div>
          
          {gameOver && (
            <button
              onClick={handleResetGame}
              disabled={isResetting}
              className="flex items-center bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              {isResetting ? 'Resetting...' : 'New Game'}
            </button>
          )}
        </div>

        {/* Players Info */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className={`bg-white rounded-lg p-4 border-2 ${gameState.currentPlayer === 'X' && gameState.status === 'playing' ? 'border-blue-500' : 'border-gray-200'}`}>
            <div className="flex items-center space-x-3">
              {gameState.players.X?.image ? (
                <img 
                  src={gameState.players.X.image} 
                  alt={gameState.players.X.name}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <UserIcon className="w-10 h-10 text-gray-400" />
              )}
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Player X</p>
                <p className="text-sm text-gray-600">{gameState.players.X?.name || 'Waiting...'}</p>
              </div>
            </div>
          </div>
          
          <div className={`bg-white rounded-lg p-4 border-2 ${gameState.currentPlayer === 'O' && gameState.status === 'playing' ? 'border-red-500' : 'border-gray-200'}`}>
            <div className="flex items-center space-x-3">
              {gameState.players.O?.image ? (
                <img 
                  src={gameState.players.O.image} 
                  alt={gameState.players.O.name}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <UserIcon className="w-10 h-10 text-gray-400" />
              )}
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Player O</p>
                <p className="text-sm text-gray-600">{gameState.players.O?.name || 'Waiting...'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Timer */}
        <div className="mb-6">
          <Timer
            turnStartedAt={gameState.turnStartedAt}
            timeoutDuration={gameState.timeoutDuration}
            isMyTurn={isMyTurn}
            gameStatus={gameState.status}
          />
        </div>

        {/* Game Board */}
        <div className="flex justify-center">
          <TicTacToeBoard
            board={Array.isArray(gameState.board) ? gameState.board : Array(9).fill(null)}
            currentPlayer={gameState.currentPlayer}
            onCellClick={handleCellClick}
            disabled={!currentPlayer || !isMyTurn || gameOver || isMakingMove}
            winner={gameState.winner}
            isDraw={Array.isArray(gameState.board) && isDraw(gameState.board)}
            isMyTurn={isMyTurn}
            playerXName={gameState.players.X?.name || 'Player X'}
            playerOName={gameState.players.O?.name || 'Player O'}
            gameStatus={gameState.status}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
} 