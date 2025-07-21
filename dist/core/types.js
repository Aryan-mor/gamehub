"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameStatus = exports.GameType = void 0;
var GameType;
(function (GameType) {
    GameType["XO"] = "xo";
    GameType["DICE"] = "dice";
    GameType["BLACKJACK"] = "blackjack";
    GameType["FOOTBALL"] = "football";
    GameType["BASKETBALL"] = "basketball";
    GameType["BOWLING"] = "bowling";
})(GameType || (exports.GameType = GameType = {}));
var GameStatus;
(function (GameStatus) {
    GameStatus["WAITING"] = "waiting";
    GameStatus["PLAYING"] = "playing";
    GameStatus["FINISHED"] = "finished";
    GameStatus["CANCELLED"] = "cancelled";
})(GameStatus || (exports.GameStatus = GameStatus = {}));
//# sourceMappingURL=types.js.map