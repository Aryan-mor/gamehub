export declare function generateAndSendCard(cards: string[], style?: string, area?: string, debugTag?: string, format?: 'png' | 'webp', transparent?: boolean, asDocument?: boolean): Promise<string>;
export declare function regenerateCardImage(cards: string[], style?: string, area?: string, debugTag?: string, format?: 'png' | 'webp', transparent?: boolean, asDocument?: boolean): Promise<string>;
export declare function generateImageBufferOnly(cards: string[], style?: string, area?: string, debugTag?: string, format?: 'png' | 'webp', transparent?: boolean): Promise<Buffer>;
export declare function getCacheStats(): {
    totalEntries: number;
    expiredEntries: number;
};
export declare function clearCache(): void;
//# sourceMappingURL=generateAndSendCard.d.ts.map