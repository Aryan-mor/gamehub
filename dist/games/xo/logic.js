"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeXoMove = makeXoMove;
exports.restartXoGame = restartXoGame;
exports.newXoGame = newXoGame;
const game_1 = require("./game");
const userStats_1 = require("../../bot/games/userStats");
async function makeXoMove(gameId, playerId, position) {
    const gameState = (0, game_1.getXoGame)(gameId);
    if (!gameState) {
        return { success: false, error: "Game not found" };
    }
    const currentPlayerInfo = gameState.players[gameState.currentPlayer];
    if (!currentPlayerInfo || currentPlayerInfo.id !== playerId) {
        return { success: false, error: "Not your turn" };
    }
    if (gameState.board[position] !== "-") {
        return { success: false, error: "Cell already occupied" };
    }
    gameState.board[position] = gameState.currentPlayer;
    gameState.lastMoveAt = Date.now();
    const winner = (0, game_1.checkWinner)(gameState.board);
    if (winner) {
        gameState.status = "won";
        gameState.winner = winner;
        const winnerId = winner === "X" ? gameState.players.X?.id : gameState.players.O?.id;
        const loserId = winner === "X" ? gameState.players.O?.id : gameState.players.X?.id;
        if (winnerId && loserId) {
            await (0, userStats_1.recordWin)(winnerId, loserId, "xo");
        }
        await (0, game_1.processGameCompletion)(gameId);
    }
    else if ((0, game_1.isDraw)(gameState.board)) {
        gameState.status = "draw";
        const playerXId = gameState.players.X?.id;
        const playerOId = gameState.players.O?.id;
        if (playerXId && playerOId) {
            await (0, userStats_1.recordDraw)(playerXId, playerOId, "xo");
        }
        await (0, game_1.processGameCompletion)(gameId);
    }
    else {
        gameState.currentPlayer = (0, game_1.getNextPlayer)(gameState.currentPlayer);
        gameState.turnStartedAt = Date.now();
    }
    return { success: true, gameState };
}
async function restartXoGame(gameId) {
    const gameState = (0, game_1.getXoGame)(gameId);
    if (!gameState) {
        return null;
    }
    const originalX = gameState.players.X;
    const originalO = gameState.players.O;
    const newGameState = {
        ...(0, game_1.createInitialGameState)(),
        players: {
            X: originalO,
            O: originalX,
        },
        status: "playing",
        currentPlayer: "X",
        turnStartedAt: Date.now(),
        stake: gameState.stake,
        stakePool: gameState.stake * 2,
        creatorId: gameState.creatorId,
        joinerId: gameState.joinerId,
    };
    if (originalX?.id && originalO?.id && gameState.stake) {
        try {
            const { deductStake } = await Promise.resolve().then(() => __importStar(require("../../lib/coinService")));
            await deductStake(originalX.id, gameState.stake, gameId);
            await deductStake(originalO.id, gameState.stake, gameId);
        }
        catch (error) {
            console.error("Failed to deduct stakes for restart:", error);
            return null;
        }
    }
    (0, game_1.setXoGame)(gameId, newGameState);
    return newGameState;
}
async function newXoGame(gameId) {
    const gameState = (0, game_1.getXoGame)(gameId);
    if (!gameState) {
        return null;
    }
    const newGameState = {
        ...(0, game_1.createInitialGameState)(),
        players: {
            X: gameState.players.X,
            O: gameState.players.O,
        },
        status: "playing",
        currentPlayer: "X",
        turnStartedAt: Date.now(),
        stake: gameState.stake,
        stakePool: gameState.stake * 2,
        creatorId: gameState.creatorId,
        joinerId: gameState.joinerId,
    };
    if (gameState.players.X?.id && gameState.players.O?.id && gameState.stake) {
        try {
            const { deductStake } = await Promise.resolve().then(() => __importStar(require("../../lib/coinService")));
            await deductStake(gameState.players.X.id, gameState.stake, gameId);
            await deductStake(gameState.players.O.id, gameState.stake, gameId);
        }
        catch (error) {
            console.error("Failed to deduct stakes for new game:", error);
            return null;
        }
    }
    (0, game_1.setXoGame)(gameId, newGameState);
    return newGameState;
}
//# sourceMappingURL=logic.js.map