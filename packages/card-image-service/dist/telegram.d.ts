import { Bot } from 'grammy';
import { CardImageConfig } from './types';
export declare class TelegramService {
    private bot;
    private config;
    constructor(config: CardImageConfig);
    sendImage(imageBuffer: Buffer, caption?: string): Promise<{
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