"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logError = exports.logFunctionEnd = exports.logFunctionStart = exports.createLogger = void 0;
const pino_1 = __importDefault(require("pino"));
const logger = (0, pino_1.default)({
    level: process.env.LOG_LEVEL || 'info',
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
        },
    },
});
const createLogger = (context = {}) => {
    return logger.child(context);
};
exports.createLogger = createLogger;
const logFunctionStart = (functionName, context = {}) => {
    const log = (0, exports.createLogger)(context);
    log.info({ functionName }, 'Function started');
    return log;
};
exports.logFunctionStart = logFunctionStart;
const logFunctionEnd = (functionName, result, context = {}) => {
    const log = (0, exports.createLogger)(context);
    log.info({ functionName, result }, 'Function completed');
    return log;
};
exports.logFunctionEnd = logFunctionEnd;
const logError = (functionName, error, context = {}) => {
    const log = (0, exports.createLogger)(context);
    log.error({ functionName, error: error.message, stack: error.stack }, 'Function error');
    return log;
};
exports.logError = logError;
exports.default = logger;
//# sourceMappingURL=logger.js.map