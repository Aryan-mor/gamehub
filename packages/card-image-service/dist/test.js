"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const generateAndSendCard_1 = require("./generateAndSendCard");
const logger_1 = require("./logger");
async function testImageGeneration() {
    logger_1.logger.info('Starting image generation test...');
    try {
        const testCards = ['2_of_clubs', '3_of_hearts', 'ace_of_spades'];
        logger_1.logger.info('Testing image generation with sample cards', { cards: testCards });
        const imageBuffer = await (0, generateAndSendCard_1.generateImageBufferOnly)(testCards, 'general', 'general', 'Test Image');
        logger_1.logger.info('Image generation successful', {
            bufferSize: imageBuffer.length,
            cardCount: testCards.length
        });
    }
    catch (error) {
        logger_1.logger.error('Image generation test failed', error);
    }
}
if (require.main === module) {
    testImageGeneration().catch((error) => {
        logger_1.logger.error('Test failed', error);
        process.exit(1);
    });
}
//# sourceMappingURL=test.js.map