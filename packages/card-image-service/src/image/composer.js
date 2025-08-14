"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateImageBuffer = generateImageBuffer;
exports.generateRequestHash = generateRequestHash;
const sharp_1 = __importDefault(require("sharp"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const logger_1 = require("../logger");
const CARD_WIDTH = 80;
const CARD_HEIGHT = 112;
const CARD_SPACING = 15;
const TOTAL_WIDTH = 400;
const TOTAL_HEIGHT = 400;
async function generateImageBuffer(options) {
    (0, logger_1.logFunctionStart)('generateImageBuffer', options);
    try {
        const { cards, style = 'general', area = 'general', format = 'png', transparent = false } = options;
        if (!cards || cards.length === 0) {
            throw new Error('No cards provided for image generation');
        }
        const totalWidth = TOTAL_WIDTH;
        const totalHeight = TOTAL_HEIGHT;
        let background;
        if (transparent) {
            background = (0, sharp_1.default)({
                create: {
                    width: totalWidth,
                    height: totalHeight,
                    channels: 4,
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                }
            });
        }
        else {
            const backgroundPath = path_1.default.join(__dirname, '../../assets/card_area', `${area}.png`);
            if (fs_1.default.existsSync(backgroundPath)) {
                const backgroundBuffer = fs_1.default.readFileSync(backgroundPath);
                background = (0, sharp_1.default)(backgroundBuffer).resize(totalWidth, totalHeight, { fit: 'cover' });
            }
            else {
                background = (0, sharp_1.default)({
                    create: {
                        width: totalWidth,
                        height: totalHeight,
                        channels: 4,
                        background: { r: 34, g: 139, b: 34, alpha: 1 }
                    }
                });
            }
        }
        const cardImages = [];
        for (const card of cards) {
            const cardPath = path_1.default.join(__dirname, '../../assets/card', style, `${card}.png`);
            if (!fs_1.default.existsSync(cardPath)) {
                throw new Error(`Card image not found: ${cardPath}`);
            }
            const cardBuffer = fs_1.default.readFileSync(cardPath);
            const cardImage = (0, sharp_1.default)(cardBuffer).resize(CARD_WIDTH, CARD_HEIGHT, { fit: 'contain' });
            cardImages.push(cardImage);
        }
        const cardCompositions = [];
        const totalCardsHeight = (2 * CARD_HEIGHT) + CARD_SPACING;
        const startY = (totalHeight - totalCardsHeight) / 2;
        const topRowY = startY;
        const bottomRowY = startY + CARD_HEIGHT + CARD_SPACING;
        const topRowStartX = (totalWidth - (3 * CARD_WIDTH + 2 * CARD_SPACING)) / 2;
        const bottomRowStartX = (totalWidth - (2 * CARD_WIDTH + 1 * CARD_SPACING)) / 2;
        for (let i = 0; i < cardImages.length; i++) {
            let x;
            let y;
            if (i < 3) {
                x = topRowStartX + i * (CARD_WIDTH + CARD_SPACING);
                y = topRowY;
            }
            else {
                x = bottomRowStartX + (i - 3) * (CARD_WIDTH + CARD_SPACING);
                y = bottomRowY;
            }
            cardCompositions.push({
                input: await cardImages[i].toBuffer(),
                left: Math.round(x),
                top: Math.round(y),
            });
        }
        let result;
        if (format === 'webp') {
            result = await background.composite(cardCompositions).webp({
                quality: 90,
                lossless: transparent
            }).toBuffer();
        }
        else {
            result = await background.composite(cardCompositions).png().toBuffer();
        }
        (0, logger_1.logFunctionEnd)('generateImageBuffer', {
            cardCount: cards.length,
            imageSize: result.length,
            format,
            transparent,
            dimensions: { width: totalWidth, height: totalHeight }
        });
        return result;
    }
    catch (error) {
        (0, logger_1.logError)('generateImageBuffer', error, options);
        throw error;
    }
}
function generateRequestHash(options) {
    const { cards, style = 'general', area = 'general', debugTag, format = 'png', transparent = false, asDocument = false } = options;
    const hashData = {
        cards: cards.sort(),
        style,
        area,
        debugTag,
        format,
        transparent,
        asDocument
    };
    return Buffer.from(JSON.stringify(hashData)).toString('base64');
}
//# sourceMappingURL=composer.js.map