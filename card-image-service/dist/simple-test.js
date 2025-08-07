"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sharp_1 = __importDefault(require("sharp"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
async function simpleImageTest() {
    console.log('🎴 Simple Image Test');
    try {
        const cardPath = path_1.default.join(__dirname, '../assets/card/general/2_of_clubs.png');
        const backgroundPath = path_1.default.join(__dirname, '../assets/card_area/general.png');
        console.log('📁 Loading images...');
        const backgroundBuffer = fs_1.default.readFileSync(backgroundPath);
        const background = (0, sharp_1.default)(backgroundBuffer).resize(400, 200, { fit: 'cover' });
        const cardBuffer = fs_1.default.readFileSync(cardPath);
        const card = (0, sharp_1.default)(cardBuffer).resize(100, 140, { fit: 'contain' });
        console.log('🔄 Processing images...');
        const result = await background.composite([
            {
                input: await card.toBuffer(),
                left: 50,
                top: 30,
            }
        ]).png().toBuffer();
        console.log('✅ Success! Result size:', result.length);
        fs_1.default.writeFileSync('test-output.png', result);
        console.log('💾 Saved as test-output.png');
    }
    catch (error) {
        console.error('❌ Error:', error);
    }
}
simpleImageTest().catch(console.error);
//# sourceMappingURL=simple-test.js.map