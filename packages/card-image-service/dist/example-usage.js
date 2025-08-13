"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePokerTableImage = generatePokerTableImage;
exports.generatePlayerHandImage = generatePlayerHandImage;
const index_1 = require("./index");
const generateTemplateImage_1 = require("./generateTemplateImage");
async function exampleUsage() {
    try {
        console.log('🎴 Card Image Service Example Usage\n');
        console.log('1. Generating PNG card image as photo (compressed)...');
        const messageId1 = await (0, index_1.generateAndSendCard)(['ace_of_hearts', 'king_of_spades', 'queen_of_diamonds'], 'general', 'club', 'Player 1 Hand (Photo)', 'png', false, false);
        console.log(`✅ Generated PNG photo with messageId: ${messageId1}\n`);
        console.log('2. Generating WebP image as document (no compression)...');
        const messageId2 = await (0, index_1.generateAndSendCard)(['ace_of_hearts', 'king_of_spades'], 'general', 'general', 'Player Hand (Document)', 'webp', true, true);
        console.log(`✅ Generated WebP document with messageId: ${messageId2}\n`);
        console.log('3. Generating better poker table template with JPEG...');
        const messageId3 = await (0, generateTemplateImage_1.generateAndSendTemplateImage)('poker-table', [
            'ace_of_hearts',
            'king_of_spades',
            'queen_of_diamonds',
            'jack_of_clubs',
            '10_of_hearts',
            '2_of_clubs',
            '3_of_hearts'
        ], 'general', 'Better Poker Table - JPEG', 'jpeg', false, false);
        console.log(`✅ Generated better template with messageId: ${messageId3}\n`);
        console.log('4. Generating template as document (no compression)...');
        const messageId4 = await (0, generateTemplateImage_1.generateAndSendTemplateImage)('poker-table', ['ace_of_hearts', 'king_of_spades', 'queen_of_diamonds', 'jack_of_clubs', '10_of_hearts'], 'general', 'Poker Table Document', 'jpeg', false, true);
        console.log(`✅ Generated template document with messageId: ${messageId4}\n`);
        console.log('5. Cache statistics:');
        const stats = (0, index_1.getCacheStats)();
        console.log(`   Total entries: ${stats.totalEntries}`);
        console.log(`   Expired entries: ${stats.expiredEntries}\n`);
        console.log('6. Force regenerate example (if messageId becomes invalid):');
        try {
        }
        catch (error) {
            console.log('   MessageId invalid, regenerating...');
            const newMessageId = await (0, index_1.regenerateCardImage)(['ace_of_hearts', 'king_of_spades'], 'general', 'club', 'Regenerated Hand', 'png', false, false);
            console.log(`   ✅ Regenerated with new messageId: ${newMessageId}\n`);
        }
        console.log('🎉 All examples completed successfully!');
    }
    catch (error) {
        console.error('❌ Error in example usage:', error);
    }
}
async function generatePokerTableImage(tableCards, playerCards, debugTag) {
    try {
        const allCards = [...tableCards, ...playerCards];
        if (allCards.length !== 7) {
            throw new Error('Poker table requires exactly 7 cards (5 table + 2 player)');
        }
        const messageId = await (0, generateTemplateImage_1.generateAndSendTemplateImage)('poker-table', allCards, 'general', debugTag || 'Poker Game State', 'jpeg', false, false);
        return messageId;
    }
    catch (error) {
        console.error('Error generating poker table image:', error);
        throw error;
    }
}
async function generatePlayerHandImage(playerCards, debugTag) {
    try {
        if (playerCards.length !== 2) {
            throw new Error('Player hand requires exactly 2 cards');
        }
        const messageId = await (0, index_1.generateAndSendCard)(playerCards, 'general', 'general', debugTag || 'Player Hand', 'png', false, false);
        return messageId;
    }
    catch (error) {
        console.error('Error generating player hand image:', error);
        throw error;
    }
}
if (require.main === module) {
    exampleUsage();
}
//# sourceMappingURL=example-usage.js.map