"use client";

import { useState } from 'react';
import { CellValue, Player } from '@/lib/game';

interface TicTacToeBoardProps {
  board: CellValue[];
  currentPlayer: Player;
  onCellClick: (index: number) => void;
  disabled: boolean;
  winner: Player | null;
  isDraw: boolean;
  isMyTurn?: boolean;
  playerXName?: string;
  playerOName?: string;
  gameStatus?: string;
}

export default function TicTacToeBoard({
  board,
  currentPlayer,
  onCellClick,
  disabled,
  winner,
  isDraw,
  isMyTurn = false,
  playerXName = 'Player X',
  playerOName = 'Player O',
  gameStatus = 'playing',
}: TicTacToeBoardProps) {
  const [hoveredCell, setHoveredCell] = useState<number | null>(null);

  // Ensure board is always a valid array
  const safeBoard = Array.isArray(board) && board.length === 9 ? board : Array(9).fill(null);
  
  // Debug logging
  console.log('TicTacToeBoard render:', {
    board,
    safeBoard,
    currentPlayer,
    disabled,
    winner,
    isDraw
  });
  
  const getCellContent = (value: CellValue, index: number) => {
    // Add safety check for value
    if (value === 'X' || value === 'O') {
      return (
        <span className={`text-4xl font-bold ${value === 'X' ? 'text-blue-600' : 'text-red-600'}`}>
          {value}
        </span>
      );
    }
    
    if (hoveredCell === index && !disabled && !winner && !isDraw) {
      return (
        <span className={`text-4xl font-bold text-gray-300 ${currentPlayer === 'X' ? 'text-blue-300' : 'text-red-300'}`}>
          {currentPlayer}
        </span>
      );
    }
    
    return null;
  };

  const getCellClasses = (index: number) => {
    const baseClasses = "w-20 h-20 border-2 border-gray-300 flex items-center justify-center text-2xl font-bold cursor-pointer transition-all duration-200";
    
    if (disabled || winner || isDraw) {
      return `${baseClasses} cursor-not-allowed`;
    }
    
    if (hoveredCell === index) {
      return `${baseClasses} bg-gray-50 border-gray-400`;
    }
    
    return `${baseClasses} hover:bg-gray-50 hover:border-gray-400`;
  };

  const handleCellClick = (index: number) => {
    // Don't allow clicks if:
    // - Component is disabled
    // - Game is over (winner or draw)
    // - Cell is already occupied
    if (disabled || winner || isDraw || safeBoard[index] !== "-") {
      return;
    }
    
    onCellClick(index);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      
      <div className="grid grid-cols-3 gap-2 bg-gray-100 p-4 rounded-lg">
        {safeBoard.map((cell, index) => (
          <button
            key={index}
            className={getCellClasses(index)}
            onClick={() => handleCellClick(index)}
            onMouseEnter={() => setHoveredCell(index)}
            onMouseLeave={() => setHoveredCell(null)}
            disabled={disabled || !!winner || isDraw || (cell !== "-") || !Array.isArray(safeBoard)}
          >
            {getCellContent(cell, index)}
          </button>
        ))}
      </div>
      
      {winner && (
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600 mb-2">
            Player {winner} wins! 🎉
          </p>
        </div>
      )}
      
      {isDraw && !winner && (
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-600 mb-2">
            It&apos;s a draw! 🤝
          </p>
        </div>
      )}
      
      {gameStatus === 'timeout' && winner && (
        <div className="text-center">
          <p className="text-2xl font-bold text-orange-600 mb-2">
            Player {winner} won due to inactivity from opponent! ⏰
          </p>
        </div>
      )}
      
      {!winner && !isDraw && gameStatus !== 'timeout' && (
        <div className="text-center">
          <p className="text-lg text-gray-700">
            {isMyTurn ? (
              <>
                <span className="text-green-600 font-semibold">It&apos;s your turn!</span>
              </>
            ) : (
              <>
                <span className="text-gray-600">It&apos;s </span>
                <span className={`font-bold ${currentPlayer === 'X' ? 'text-blue-600' : 'text-red-600'}`}>
                  {currentPlayer === 'X' ? playerXName : playerOName}
                </span>
                <span className="text-gray-600">&apos;s turn</span>
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
} 