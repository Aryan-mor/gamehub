"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sharp_1 = __importDefault(require("sharp"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
async function debugImageLoading() {
    console.log('🔍 Debug: Testing image loading...');
    try {
        const cardPath = path_1.default.join(__dirname, '../assets/card/general/2_of_clubs.png');
        const backgroundPath = path_1.default.join(__dirname, '../assets/card_area/general.png');
        console.log('📁 Card path:', cardPath);
        console.log('📁 Background path:', backgroundPath);
        console.log('✅ Card exists:', fs_1.default.existsSync(cardPath));
        console.log('✅ Background exists:', fs_1.default.existsSync(backgroundPath));
        if (fs_1.default.existsSync(cardPath)) {
            console.log('🃏 Testing card image loading...');
            const cardBuffer = fs_1.default.readFileSync(cardPath);
            console.log('📊 Card buffer size:', cardBuffer.length);
            const cardImage = (0, sharp_1.default)(cardBuffer);
            const cardMetadata = await cardImage.metadata();
            console.log('📐 Card metadata:', cardMetadata);
            const resizedCard = cardImage.resize(100, 140, { fit: 'contain' });
            const cardResult = await resizedCard.png().toBuffer();
            console.log('✅ Card processing successful, result size:', cardResult.length);
        }
        if (fs_1.default.existsSync(backgroundPath)) {
            console.log('🖼️ Testing background image loading...');
            const backgroundBuffer = fs_1.default.readFileSync(backgroundPath);
            console.log('📊 Background buffer size:', backgroundBuffer.length);
            const backgroundImage = (0, sharp_1.default)(backgroundBuffer);
            const backgroundMetadata = await backgroundImage.metadata();
            console.log('📐 Background metadata:', backgroundMetadata);
            const resizedBackground = backgroundImage.resize(400, 200, { fit: 'cover' });
            const backgroundResult = await resizedBackground.png().toBuffer();
            console.log('✅ Background processing successful, result size:', backgroundResult.length);
        }
        console.log('🎉 All tests completed successfully!');
    }
    catch (error) {
        console.error('❌ Error in debug test:', error);
    }
}
debugImageLoading().catch(console.error);
//# sourceMappingURL=debug-test.js.map