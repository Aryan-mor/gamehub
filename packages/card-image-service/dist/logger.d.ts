export declare const logger: import("pino").Logger<never, boolean>;
export declare const logFunctionStart: (functionName: string, params?: Record<string, unknown>) => void;
export declare const logFunctionEnd: (functionName: string, result?: Record<string, unknown>, context?: Record<string, unknown>) => void;
export declare const logError: (functionName: string, error: Error, context?: Record<string, unknown>) => void;
//# sourceMappingURL=logger.d.ts.map