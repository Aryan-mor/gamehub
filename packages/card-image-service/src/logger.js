"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logError = exports.logFunctionEnd = exports.logFunctionStart = exports.logger = void 0;
const pino_1 = __importDefault(require("pino"));
const logLevel = process.env.LOG_LEVEL || 'info';
exports.logger = (0, pino_1.default)({
    level: logLevel,
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
        },
    },
});
const logFunctionStart = (functionName, params) => {
    exports.logger.info({ function: functionName, action: 'start', params });
};
exports.logFunctionStart = logFunctionStart;
const logFunctionEnd = (functionName, result, context) => {
    exports.logger.info({ function: functionName, action: 'end', result, context });
};
exports.logFunctionEnd = logFunctionEnd;
const logError = (functionName, error, context) => {
    exports.logger.error({ function: functionName, action: 'error', error: error.message, stack: error.stack, context });
};
exports.logError = logError;
//# sourceMappingURL=logger.js.map