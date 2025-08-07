"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const generateAndSendCard_1 = require("./generateAndSendCard");
const logger_1 = require("./logger");
const fs_1 = __importDefault(require("fs"));
async function saveTest() {
    logger_1.logger.info('💾 Starting save test...');
    try {
        const testCards = ['2_of_clubs', '3_of_hearts', 'ace_of_spades'];
        logger_1.logger.info('🔄 Generating image...', { cards: testCards });
        const imageBuffer = await (0, generateAndSendCard_1.generateImageBufferOnly)(testCards, 'general', 'general', 'Save Test - Card Image Service');
        logger_1.logger.info('✅ Image generated successfully!', { bufferSize: imageBuffer.length });
        const filename = `test-card-image-${Date.now()}.png`;
        fs_1.default.writeFileSync(filename, imageBuffer);
        logger_1.logger.info('💾 Image saved to file:', { filename });
        const testCards2 = ['king_of_hearts', 'queen_of_diamonds', 'jack_of_clubs'];
        logger_1.logger.info('🔄 Generating second image...', { cards: testCards2 });
        const imageBuffer2 = await (0, generateAndSendCard_1.generateImageBufferOnly)(testCards2, 'general', 'general', 'Save Test 2 - Card Image Service');
        logger_1.logger.info('✅ Second image generated successfully!', { bufferSize: imageBuffer2.length });
        const filename2 = `test-card-image-2-${Date.now()}.png`;
        fs_1.default.writeFileSync(filename2, imageBuffer2);
        logger_1.logger.info('💾 Second image saved to file:', { filename2 });
    }
    catch (error) {
        logger_1.logger.error('❌ Save test failed', error);
    }
}
saveTest().catch((error) => {
    logger_1.logger.error('❌ Test failed', error);
    process.exit(1);
});
//# sourceMappingURL=save-test.js.map