"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const generateAndSendCard_1 = require("./generateAndSendCard");
const logger_1 = require("./logger");
const fs_1 = __importDefault(require("fs"));
async function simulateSend2Pik() {
    logger_1.logger.info('🃏 Simulating sending 2 of Spades card...');
    try {
        const imageBuffer = await (0, generateAndSendCard_1.generateImageBufferOnly)(['2_of_spades'], 'general', 'general', '2 of Spades - Simulated Send');
        const filename = `2-of-spades-${Date.now()}.png`;
        fs_1.default.writeFileSync(filename, imageBuffer);
        const fakeMessageId = `msg_${Date.now()}`;
        logger_1.logger.info('✅ 2 of Spades card image generated successfully!', {
            messageId: fakeMessageId,
            filename,
            bufferSize: imageBuffer.length,
            cardName: '2_of_spades',
            dimensions: '140x180'
        });
        logger_1.logger.info('💾 Image saved locally as:', { filename });
        logger_1.logger.info('📊 Image details:', {
            size: imageBuffer.length,
            format: 'PNG',
            card: '2_of_spades',
            style: 'general',
            area: 'general'
        });
        logger_1.logger.info('🃏 Creating 2 cards test...');
        const twoCardsBuffer = await (0, generateAndSendCard_1.generateImageBufferOnly)(['2_of_spades', '3_of_hearts'], 'general', 'general', '2 Cards - 2♠ + 3♥');
        const twoCardsFilename = `2-cards-${Date.now()}.png`;
        fs_1.default.writeFileSync(twoCardsFilename, twoCardsBuffer);
        const fakeMessageId2 = `msg_${Date.now()}_2`;
        logger_1.logger.info('✅ 2 cards image generated successfully!', {
            messageId: fakeMessageId2,
            filename: twoCardsFilename,
            bufferSize: twoCardsBuffer.length,
            cards: ['2_of_spades', '3_of_hearts']
        });
        logger_1.logger.info('🎉 Simulation completed successfully!');
        logger_1.logger.info('📁 Generated files:', {
            singleCard: filename,
            twoCards: twoCardsFilename
        });
    }
    catch (error) {
        logger_1.logger.error('❌ Failed to simulate sending 2 of spades card', error);
    }
}
simulateSend2Pik().catch((error) => {
    logger_1.logger.error('❌ Test failed', error);
    process.exit(1);
});
//# sourceMappingURL=simulate-send.js.map