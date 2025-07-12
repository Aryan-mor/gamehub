"use client";

import { useState } from 'react';
import { CellValue, Player } from '@/lib/game';
import TicTacToeBoard from '@/components/TicTacToeBoard';

export default function TestBoardPage() {
  const [board, setBoard] = useState<CellValue[]>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [winner, setWinner] = useState<Player | null>(null);
  const [isDraw, setIsDraw] = useState(false);

  const handleCellClick = (index: number) => {
    if (board[index] !== null || winner || isDraw) return;
    
    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);
    
    // Check for winner
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6] // diagonals
    ];
    
    for (const [a, b, c] of lines) {
      if (newBoard[a] && newBoard[a] === newBoard[b] && newBoard[a] === newBoard[c]) {
        setWinner(newBoard[a]);
        return;
      }
    }
    
    // Check for draw
    if (newBoard.every(cell => cell !== null)) {
      setIsDraw(true);
      return;
    }
    
    // Switch player
    setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinner(null);
    setIsDraw(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">TicTacToe Test Board</h1>
        
        <div className="flex justify-center mb-4">
          <button
            onClick={resetGame}
            className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
          >
            Reset Game
          </button>
        </div>
        
        <TicTacToeBoard
          board={board}
          currentPlayer={currentPlayer}
          onCellClick={handleCellClick}
          disabled={false}
          winner={winner}
          isDraw={isDraw}
        />
        
        <div className="mt-4 text-center">
          <p className="text-lg">
            Current Player: <span className={`font-bold ${currentPlayer === 'X' ? 'text-blue-600' : 'text-red-600'}`}>{currentPlayer}</span>
          </p>
          {winner && <p className="text-2xl font-bold text-green-600">Player {winner} wins!</p>}
          {isDraw && <p className="text-2xl font-bold text-gray-600">It&apos;s a draw!</p>}
        </div>
      </div>
    </div>
  );
} 