"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const generateAndSendCard_1 = require("./generateAndSendCard");
const logger_1 = require("./logger");
const fs_1 = __importDefault(require("fs"));
async function create2PikImage() {
    logger_1.logger.info('🃏 Creating 2 of Spades card image...');
    try {
        const imageBuffer = await (0, generateAndSendCard_1.generateImageBufferOnly)(['2_of_spades'], 'general', 'general', '2 of Spades - Local Test');
        fs_1.default.writeFileSync('2-of-spades.png', imageBuffer);
        logger_1.logger.info('✅ 2 of Spades image created successfully!', {
            bufferSize: imageBuffer.length,
            cardName: '2_of_spades'
        });
        logger_1.logger.info('💾 Image saved as: 2-of-spades.png');
        logger_1.logger.info('🃏 Creating multiple cards test...');
        const multiCardBuffer = await (0, generateAndSendCard_1.generateImageBufferOnly)(['2_of_spades', '3_of_hearts', 'ace_of_clubs'], 'general', 'general', 'Multiple Cards Test');
        fs_1.default.writeFileSync('multiple-cards.png', multiCardBuffer);
        logger_1.logger.info('✅ Multiple cards image created successfully!', {
            bufferSize: multiCardBuffer.length,
            cards: ['2_of_spades', '3_of_hearts', 'ace_of_clubs']
        });
        logger_1.logger.info('💾 Multiple cards image saved as: multiple-cards.png');
    }
    catch (error) {
        logger_1.logger.error('❌ Failed to create 2 of spades image', error);
    }
}
create2PikImage().catch((error) => {
    logger_1.logger.error('❌ Test failed', error);
    process.exit(1);
});
//# sourceMappingURL=create-2-pik.js.map