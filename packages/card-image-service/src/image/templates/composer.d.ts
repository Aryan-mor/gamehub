interface TemplateImageOptions {
    templateId: string;
    cards: string[];
    style?: string;
    debugTag?: string;
    format?: 'png' | 'webp' | 'jpeg';
    transparent?: boolean;
}
export declare function generateTemplateImageBuffer(options: TemplateImageOptions): Promise<Buffer>;
export declare function generateTemplateRequestHash(options: TemplateImageOptions): string;
export {};
//# sourceMappingURL=composer.d.ts.map