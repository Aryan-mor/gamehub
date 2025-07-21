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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerBasketballHandlers = exports.resolveBasketballResult = exports.handleBasketballTurn = exports.startBasketballGame = void 0;
var startGame_1 = require("./startGame");
Object.defineProperty(exports, "startBasketballGame", { enumerable: true, get: function () { return startGame_1.startBasketballGame; } });
var handleTurn_1 = require("./handleTurn");
Object.defineProperty(exports, "handleBasketballTurn", { enumerable: true, get: function () { return handleTurn_1.handleBasketballTurn; } });
var resolveResult_1 = require("./resolveResult");
Object.defineProperty(exports, "resolveBasketballResult", { enumerable: true, get: function () { return resolveResult_1.resolveBasketballResult; } });
var handlers_1 = require("./handlers");
Object.defineProperty(exports, "registerBasketballHandlers", { enumerable: true, get: function () { return handlers_1.registerBasketballHandlers; } });
__exportStar(require("./types"), exports);
//# sourceMappingURL=index.js.map