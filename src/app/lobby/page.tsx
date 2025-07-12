"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { GameService } from '@/lib/gameService';
import { PlayerInfo } from '@/lib/game';
import { 
  PlusIcon, 
  ArrowRightIcon, 
  ClipboardDocumentIcon,
  CheckIcon 
} from '@heroicons/react/24/outline';

export default function LobbyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [gameCode, setGameCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const [newGameId, setNewGameId] = useState('');
  const [copied, setCopied] = useState(false);

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

  const handleCreateGame = async () => {
    console.log('Create game clicked');
    console.log('Session:', session);
    
    if (!session?.user) {
      console.error('No session user found');
      setError('No user session found. Please log in again.');
      return;
    }
    
    setIsCreating(true);
    setError('');
    
    try {
      console.log('Creating player info...');
      const playerInfo: PlayerInfo = {
        id: session.user.email!,
        name: session.user.name || 'Anonymous',
        email: session.user.email!,
        image: session.user.image || undefined,
      };
      
      console.log('Player info:', playerInfo);
      console.log('Calling GameService.createGame...');
      
      const gameId = await GameService.createGame(playerInfo);
      console.log('Game created with ID:', gameId);
      
      setNewGameId(gameId);
    } catch (err: unknown) {
      console.error('Error creating game:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create game. Please try again.';
      setError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinGame = async () => {
    if (!session?.user || !gameCode.trim()) return;
    
    setIsJoining(true);
    setError('');
    
    try {
      const playerInfo: PlayerInfo = {
        id: session.user.email!,
        name: session.user.name || 'Anonymous',
        email: session.user.email!,
        image: session.user.image || undefined,
      };
      
      await GameService.joinGame(gameCode.trim().toUpperCase(), playerInfo);
      router.push(`/game/${gameCode.trim().toUpperCase()}`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join game. Please check the game code.';
      setError(errorMessage);
      console.error('Error joining game:', err);
    } finally {
      setIsJoining(false);
    }
  };

  const copyToClipboard = async () => {
    const gameUrl = `${window.location.origin}/game/${newGameId}`;
    try {
      await navigator.clipboard.writeText(gameUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Game Lobby</h1>
          <p className="text-gray-600">Create a new game or join an existing one</p>
        </div>

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>Debug:</strong> Session status: {status}, User: {session?.user?.name || 'None'}
            </p>
          </div>
        )}

        {/* Create Game Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <PlusIcon className="h-6 w-6 mr-2 text-blue-600" />
            Create New Game
          </h2>
          
          {!newGameId ? (
            <button
              onClick={handleCreateGame}
              disabled={isCreating}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isCreating ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating...
                </div>
              ) : (
                'Create Game'
              )}
            </button>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">Game Code:</p>
                <p className="text-2xl font-mono font-bold text-gray-900">{newGameId}</p>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={copyToClipboard}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  {copied ? (
                    <div className="flex items-center justify-center">
                      <CheckIcon className="h-5 w-5 mr-2" />
                      Copied!
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <ClipboardDocumentIcon className="h-5 w-5 mr-2" />
                      Copy Link
                    </div>
                  )}
                </button>
                
                <button
                  onClick={() => router.push(`/game/${newGameId}`)}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  <div className="flex items-center justify-center">
                    Join Game
                    <ArrowRightIcon className="h-5 w-5 ml-2" />
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Join Game Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Join Game</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="gameCode" className="block text-sm font-medium text-gray-700 mb-2">
                Game Code
              </label>
              <input
                type="text"
                id="gameCode"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-character code"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={6}
              />
            </div>
            
            <button
              onClick={handleJoinGame}
              disabled={isJoining || !gameCode.trim()}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isJoining ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Joining...
                </div>
              ) : (
                'Join Game'
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
} 