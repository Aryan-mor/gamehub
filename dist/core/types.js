"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRIVIA_CATEGORIES = exports.GameStatus = exports.GameType = void 0;
var GameType;
(function (GameType) {
    GameType["XO"] = "xo";
    GameType["DICE"] = "dice";
    GameType["BLACKJACK"] = "blackjack";
    GameType["FOOTBALL"] = "football";
    GameType["BASKETBALL"] = "basketball";
    GameType["BOWLING"] = "bowling";
    GameType["TRIVIA"] = "trivia";
})(GameType || (exports.GameType = GameType = {}));
var GameStatus;
(function (GameStatus) {
    GameStatus["WAITING"] = "waiting";
    GameStatus["PLAYING"] = "playing";
    GameStatus["FINISHED"] = "finished";
    GameStatus["CANCELLED"] = "cancelled";
})(GameStatus || (exports.GameStatus = GameStatus = {}));
exports.TRIVIA_CATEGORIES = [
    '🌍 Geography',
    '📚 Literature',
    '⚽ Sports',
    '🎬 Entertainment',
    '🔬 Science',
    '🎨 Art & Culture',
    '🍔 Food & Drink',
    '🌍 History',
    '🎵 Music',
    '💻 Technology'
];
//# sourceMappingURL=types.js.map