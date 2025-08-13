"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendCardWithFallback = sendCardWithFallback;
exports.testSend2PikWithFallback = testSend2PikWithFallback;
const generateAndSendCard_1 = require("./generateAndSendCard");
const logger_1 = require("./logger");
const fs_1 = __importDefault(require("fs"));
async function sendCardWithFallback(cards, style = 'general', area = 'general', debugTag) {
    logger_1.logger.info('🃏 Attempting to send card image...', { cards, style, area, debugTag });
    try {
        const messageId = await (0, generateAndSendCard_1.generateAndSendCard)(cards, style, area, debugTag);
        logger_1.logger.info('✅ Card sent to channel successfully!', { messageId });
        return messageId;
    }
    catch (error) {
        logger_1.logger.warn('⚠️ Failed to send to channel, saving locally...', { error: error.message });
        try {
            const imageBuffer = await (0, generateAndSendCard_1.generateImageBufferOnly)(cards, style, area, debugTag);
            const timestamp = Date.now();
            const cardNames = cards.join('_');
            const filename = `card-${cardNames}-${timestamp}.png`;
            fs_1.default.writeFileSync(filename, imageBuffer);
            const fakeMessageId = `local_${timestamp}`;
            logger_1.logger.info('✅ Card image saved locally!', {
                messageId: fakeMessageId,
                filename,
                bufferSize: imageBuffer.length,
                cards,
                dimensions: `${imageBuffer.length > 30000 ? '250x180' : '140x180'}`
            });
            return fakeMessageId;
        }
        catch (fallbackError) {
            logger_1.logger.error('❌ Failed to save locally as well', fallbackError);
            throw fallbackError;
        }
    }
}
async function testSend2PikWithFallback() {
    logger_1.logger.info('🃏 Testing 2 of Spades with fallback...');
    try {
        const messageId = await sendCardWithFallback(['2_of_spades'], 'general', 'general', '2 of Spades - Fallback Test');
        logger_1.logger.info('✅ Test completed!', { messageId });
        const messageId2 = await sendCardWithFallback(['2_of_spades', '3_of_hearts', 'ace_of_clubs'], 'general', 'general', 'Multiple Cards - Fallback Test');
        logger_1.logger.info('✅ Multiple cards test completed!', { messageId: messageId2 });
    }
    catch (error) {
        logger_1.logger.error('❌ Test failed', error);
    }
}
if (require.main === module) {
    testSend2PikWithFallback().catch(console.error);
}
//# sourceMappingURL=send-with-fallback.js.map