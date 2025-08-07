"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.i18next = void 0;
exports.initializeI18n = initializeI18n;
exports.i18nMiddleware = i18nMiddleware;
exports.t = t;
const i18next_1 = __importDefault(require("i18next"));
exports.i18next = i18next_1.default;
const i18next_fs_backend_1 = __importDefault(require("i18next-fs-backend"));
const logger_1 = require("./logger");
async function initializeI18n() {
    try {
        await i18next_1.default
            .use(i18next_fs_backend_1.default)
            .init({
            backend: {
                loadPath: './locales/{{lng}}/{{ns}}.json',
            },
            fallbackLng: 'en',
            debug: false,
            interpolation: {
                escapeValue: false,
            },
            supportedLngs: ['en', 'fa'],
            ns: ['translation'],
            defaultNS: 'translation',
            preload: ['en', 'fa'],
        });
        logger_1.logger.info('i18n initialized successfully');
    }
    catch (error) {
        logger_1.logger.error('Failed to initialize i18n', error);
        throw error;
    }
}
function i18nMiddleware() {
    return async (ctx, next) => {
        const userLanguage = ctx.from?.language_code || 'en';
        const language = i18next_1.default.languages.includes(userLanguage) ? userLanguage : 'en';
        ctx.t = (key, options) => {
            const result = i18next_1.default.t(key, { lng: language, ...options });
            return typeof result === 'string' ? result : key;
        };
        await next();
    };
}
function t(key, language = 'en', options) {
    const result = i18next_1.default.t(key, { lng: language, ...options });
    return typeof result === 'string' ? result : key;
}
//# sourceMappingURL=i18n.js.map