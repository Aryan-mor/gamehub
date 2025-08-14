import { Bot } from 'grammy';
import { CardImageConfig } from './types';
export declare class TelegramService {
    private bot;
    private config;
    constructor(config: CardImageConfig);
    sendImage(imageBuffer: Buffer, caption?: string, asDocument?: boolean, format?: 'png' | 'webp' | 'jpeg'): Promise<{
        messageId: string;
        fileId?: string;
    }>;
    sendDocument(imageBuffer: Buffer, caption?: string, fileName?: string, format?: 'png' | 'webp' | 'jpeg'): Promise<{
        messageId: string;
        fileId?: string;
    }>;
    getMessage(messageId: string): Promise<{
        messageId: string;
        fileId?: string;
    } | null>;
    deleteMessage(messageId: string): Promise<boolean>;
    getBot(): Bot;
}
//# sourceMappingURL=telegram.d.ts.map