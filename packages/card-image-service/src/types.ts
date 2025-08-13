export interface CardImageRequest {
  cards: string[];
  style?: string;
  area?: string;
  debugTag?: string;
}

export interface CardImageResponse {
  messageId: string;
  fileId?: string;
  success: boolean;
  error?: string;
}

export interface CachedImageData {
  messageId: string;
  fileId?: string;
  timestamp: number;
  requestHash: string;
}

export interface ImageGenerationOptions {
  style: string;
  area: string;
  cards: string[];
  debugTag?: string;
}

export interface CardImageConfig {
  botToken: string;
  targetChannelId: string;
  logLevel: string;
} 