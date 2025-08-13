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
const generateAndSendCard_1 = require("./generateAndSendCard");
const logger_1 = require("./logger");
async function send2PikCard() {
    logger_1.logger.info('🃏 Sending 2 of Spades card to channel...');
    try {
        const messageId = await (0, generateAndSendCard_1.generateAndSendCard)(['2_of_spades'], 'general', 'general', '2 of Spades - Test Card');
        logger_1.logger.info('✅ 2 of Spades card sent successfully!', { messageId });
        const { generateImageBufferOnly } = await Promise.resolve().then(() => __importStar(require('./generateAndSendCard')));
        const imageBuffer = await generateImageBufferOnly(['2_of_spades'], 'general', 'general', '2 of Spades - Local Save');
        const fs = await Promise.resolve().then(() => __importStar(require('fs')));
        fs.writeFileSync('2-of-spades-sent.png', imageBuffer);
        logger_1.logger.info('💾 Image also saved locally as: 2-of-spades-sent.png');
        logger_1.logger.info('📊 Image details:', {
            messageId,
            bufferSize: imageBuffer.length,
            cardName: '2_of_spades'
        });
    }
    catch (error) {
        logger_1.logger.error('❌ Failed to send 2 of spades card', error);
    }
}
send2PikCard().catch((error) => {
    logger_1.logger.error('❌ Test failed', error);
    process.exit(1);
});
//# sourceMappingURL=send-2-pik.js.map