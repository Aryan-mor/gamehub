"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTemplateImageBuffer = generateTemplateImageBuffer;
exports.generateTemplateRequestHash = generateTemplateRequestHash;
const sharp_1 = __importDefault(require("sharp"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const logger_1 = require("../../logger");
async function generateTemplateImageBuffer(options) {
    (0, logger_1.logFunctionStart)('generateTemplateImageBuffer', options);
    try {
        const { templateId, cards, style = 'general', format = 'jpeg', transparent = false } = options;
        const configPath = path_1.default.join(__dirname, '../../../assets/template-configs', `${templateId}.json`);
        if (!fs_1.default.existsSync(configPath)) {
            throw new Error(`Template config not found: ${configPath}`);
        }
        const config = JSON.parse(fs_1.default.readFileSync(configPath, 'utf8'));
        const svgPath = path_1.default.join(__dirname, '../../../assets/templates', `${templateId}.svg`);
        if (!fs_1.default.existsSync(svgPath)) {
            throw new Error(`SVG template not found: ${svgPath}`);
        }
        const svgBuffer = fs_1.default.readFileSync(svgPath);
        let background;
        if (transparent && format !== 'jpeg') {
            background = (0, sharp_1.default)({
                create: {
                    width: config.width,
                    height: config.height,
                    channels: 4,
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                }
            });
        }
        else {
            background = (0, sharp_1.default)(svgBuffer).resize(config.width, config.height);
        }
        const cardCompositions = [];
        for (let i = 0; i < Math.min(cards.length, config.cardPositions.length); i++) {
            const card = cards[i];
            const position = config.cardPositions[i];
            if (typeof card === 'string' && card.toLowerCase() === 'blank') {
                continue;
            }
            const cardPath = path_1.default.join(__dirname, '../../../assets/card', style, `${card}.png`);
            if (!fs_1.default.existsSync(cardPath)) {
                throw new Error(`Card image not found: ${cardPath}`);
            }
            const cardBuffer = fs_1.default.readFileSync(cardPath);
            let cardImage = (0, sharp_1.default)(cardBuffer).resize(position.width, position.height, { fit: 'contain' });
            if (position.rotation && position.rotation !== 0) {
                cardImage = cardImage.rotate(position.rotation);
            }
            cardCompositions.push({
                input: await cardImage.toBuffer(),
                left: position.x,
                top: position.y,
            });
        }
        let result;
        if (format === 'webp') {
            result = await background.composite(cardCompositions).webp({
                quality: 90,
                lossless: transparent
            }).toBuffer();
        }
        else if (format === 'jpeg') {
            result = await background.composite(cardCompositions).jpeg({
                quality: 85,
                progressive: true
            }).toBuffer();
        }
        else {
            result = await background.composite(cardCompositions).png().toBuffer();
        }
        (0, logger_1.logFunctionEnd)('generateTemplateImageBuffer', {
            templateId,
            cardCount: cards.length,
            imageSize: result.length,
            format,
            transparent,
            dimensions: { width: config.width, height: config.height }
        });
        return result;
    }
    catch (error) {
        (0, logger_1.logError)('generateTemplateImageBuffer', error, options);
        throw error;
    }
}
function generateTemplateRequestHash(options) {
    const { templateId, cards, style = 'general', debugTag, format = 'jpeg', transparent = false } = options;
    const hashData = {
        templateId,
        cards: cards.sort(),
        style,
        debugTag,
        format,
        transparent
    };
    return Buffer.from(JSON.stringify(hashData)).toString('base64');
}
//# sourceMappingURL=composer.js.map