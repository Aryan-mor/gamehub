declare module '../../../../../../packages/card-image-service/src/index.js' {
  export function generateAndSendTemplateImage(
    templateId: string,
    cards: string[],
    style?: string,
    debugTag?: string,
    format?: 'png' | 'webp' | 'jpeg',
    transparent?: boolean,
    asDocument?: boolean
  ): Promise<string>;

  export function generateTemplateRequestHash(args: {
    templateId: string;
    cards: string[];
    style?: string;
    debugTag?: string;
    format?: 'png' | 'webp' | 'jpeg';
    transparent?: boolean;
  }): string;

  export class ImageCache {
    constructor();
    get(hash: string): { fileId?: string } | null;
  }

  export function generateTemplateBufferOnly(
    templateId: string,
    cards: string[],
    style?: string,
    debugTag?: string,
    format?: 'png' | 'webp' | 'jpeg',
    transparent?: boolean
  ): Promise<Buffer>;
}



