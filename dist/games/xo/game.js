"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALID_STAKES = exports.GAME_DESCRIPTION = exports.GAME_NAME = exports.GAME_TYPE = exports.createInitialGameState = void 0;
exports.checkWinner = checkWinner;
exports.isDraw = isDraw;
exports.getNextPlayer = getNextPlayer;
exports.createXoGame = createXoGame;
exports.joinXoGame = joinXoGame;
exports.getXoGame = getXoGame;
exports.deleteXoGame = deleteXoGame;
exports.isPlayerInXoGame = isPlayerInXoGame;
exports.setXoGame = setXoGame;
exports.formatXoBoard = formatXoBoard;
exports.processGameCompletion = processGameCompletion;
exports.getUnfinishedGamesForUser = getUnfinishedGamesForUser;
exports.getAllUnfinishedGames = getAllUnfinishedGames;
const game_1 = require("../../lib/game");
Object.defineProperty(exports, "createInitialGameState", { enumerable: true, get: function () { return game_1.createInitialGameState; } });
const coinService_1 = require("../../lib/coinService");
const xoGames = new Map();
exports.GAME_TYPE = "xo";
exports.GAME_NAME = "X/O Game";
exports.GAME_DESCRIPTION = "Classic TicTacToe game for 2 players";
exports.VALID_STAKES = [5, 10, 20];
const WINNING_COMBINATIONS = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
];
function checkWinner(board) {
    for (const [a, b, c] of WINNING_COMBINATIONS) {
        if (board[a] !== "-" && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    return null;
}
function isDraw(board) {
    return board.every((cell) => cell !== "-");
}
function getNextPlayer(currentPlayer) {
    return currentPlayer === "X" ? "O" : "X";
}
async function createXoGame(creatorId, creatorName, stake) {
    if (!exports.VALID_STAKES.includes(stake)) {
        throw new Error(`Invalid stake amount. Must be one of: ${exports.VALID_STAKES.join(", ")}`);
    }
    const hasBalance = await (0, coinService_1.requireBalance)(creatorId, stake);
    if (!hasBalance) {
        throw new Error("Insufficient coins");
    }
    const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const playerInfo = {
        id: creatorId,
        name: creatorName,
        email: `${creatorId}@telegram.user`,
        disconnected: false,
        lastSeen: Date.now(),
    };
    const gameState = {
        ...(0, game_1.createInitialGameState)(),
        players: { X: playerInfo },
        status: "waiting",
        stake,
        stakePool: stake,
        creatorId,
    };
    await (0, coinService_1.deductStake)(creatorId, stake, gameId);
    xoGames.set(gameId, gameState);
    return { gameId, gameState };
}
async function joinXoGame(gameId, joinerId, joinerName) {
    const gameState = xoGames.get(gameId);
    if (!gameState || gameState.players.O || gameState.status !== "waiting") {
        return null;
    }
    if (gameState.players.X?.id === joinerId) {
        return null;
    }
    const hasBalance = await (0, coinService_1.requireBalance)(joinerId, gameState.stake);
    if (!hasBalance) {
        throw new Error("Insufficient coins");
    }
    const playerInfo = {
        id: joinerId,
        name: joinerName,
        email: `${joinerId}@telegram.user`,
        disconnected: false,
        lastSeen: Date.now(),
    };
    gameState.players.O = playerInfo;
    gameState.status = "playing";
    gameState.currentPlayer = "X";
    gameState.turnStartedAt = Date.now();
    gameState.stakePool = gameState.stake * 2;
    gameState.joinerId = joinerId;
    await (0, coinService_1.deductStake)(joinerId, gameState.stake, gameId);
    xoGames.set(gameId, gameState);
    return gameState;
}
function getXoGame(gameId) {
    return xoGames.get(gameId);
}
function deleteXoGame(gameId) {
    return xoGames.delete(gameId);
}
function isPlayerInXoGame(gameId, userId) {
    const gameState = xoGames.get(gameId);
    if (!gameState)
        return false;
    return (gameState.players.X?.id === userId || gameState.players.O?.id === userId);
}
function setXoGame(gameId, gameState) {
    xoGames.set(gameId, gameState);
}
function formatXoBoard(board) {
    const symbols = board.map((cell) => cell === "-" ? "⬜" : cell === "X" ? "❌" : "🟢");
    return `
${symbols[0]} | ${symbols[1]} | ${symbols[2]}
---------
${symbols[3]} | ${symbols[4]} | ${symbols[5]}
---------
${symbols[6]} | ${symbols[7]} | ${symbols[8]}
  `.trim();
}
async function processGameCompletion(gameId) {
    const gameState = xoGames.get(gameId);
    if (!gameState || !gameState.stakePool)
        return;
    gameState.finishedAt = Date.now();
    if (gameState.winner) {
        const winnerId = gameState.winner === "X"
            ? gameState.players.X?.id
            : gameState.players.O?.id;
        if (winnerId) {
            gameState.winnerId = winnerId;
            const { payout, fee } = await (0, coinService_1.processGamePayout)(winnerId, gameState.stakePool, gameId);
            console.log(`[XO] Game ${gameId} won by ${winnerId}. Payout: ${payout}, Fee: ${fee}`);
        }
    }
    else if (gameState.status === "draw") {
        const playerXId = gameState.players.X?.id;
        const playerOId = gameState.players.O?.id;
        if (playerXId && playerOId) {
            await (0, coinService_1.processGameRefund)(playerXId, playerOId, gameState.stake, gameId);
            console.log(`[XO] Game ${gameId} drawn. Refunds processed for ${playerXId} and ${playerOId}`);
        }
    }
}
function getUnfinishedGamesForUser(userId) {
    const unfinishedGames = [];
    for (const [gameId, gameState] of xoGames.entries()) {
        const isPlayer = gameState.players.X?.id === userId || gameState.players.O?.id === userId;
        const isUnfinished = gameState.status === "waiting" || gameState.status === "playing";
        if (isPlayer && isUnfinished) {
            unfinishedGames.push({ gameId, gameState });
        }
    }
    return unfinishedGames;
}
function getAllUnfinishedGames() {
    const unfinishedGames = [];
    for (const [gameId, gameState] of xoGames.entries()) {
        if (gameState.status === "waiting" || gameState.status === "playing") {
            unfinishedGames.push({ gameId, gameState });
        }
    }
    return unfinishedGames;
}
//# sourceMappingURL=game.js.map