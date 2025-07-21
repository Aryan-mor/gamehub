import pino from 'pino';
import { LogContext } from './types';
declare const logger: import("pino").Logger<never, boolean>;
export declare const createLogger: (context?: LogContext) => pino.Logger<never, boolean>;
export declare const logFunctionStart: (functionName: string, context?: LogContext) => pino.Logger<never, boolean>;
export declare const logFunctionEnd: (functionName: string, result: unknown, context?: LogContext) => pino.Logger<never, boolean>;
export declare const logError: (functionName: string, error: Error, context?: LogContext) => pino.Logger<never, boolean>;
export default logger;
//# sourceMappingURL=logger.d.ts.map