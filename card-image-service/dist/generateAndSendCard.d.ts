export declare function generateAndSendCard(cards: string[], style?: string, area?: string, debugTag?: string): Promise<string>;
export declare function generateImageBufferOnly(cards: string[], style?: string, area?: string, debugTag?: string): Promise<Buffer>;
export declare function getCacheStats(): {
    totalEntries: number;
    expiredEntries: number;
};
export declare function clearCache(): void;
//# sourceMappingURL=generateAndSendCard.d.ts.map