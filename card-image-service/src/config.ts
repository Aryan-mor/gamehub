import dotenv from 'dotenv';
import { CardImageConfig } from './types';
import { logger } from './logger';

// Load environment variables
dotenv.config();

export function loadConfig(): CardImageConfig {
  const botToken = process.env.BOT_TOKEN;
  const targetChannelId = process.env.TARGET_CHANNEL_ID;
  const logLevel = process.env.LOG_LEVEL || 'info';

  if (!botToken) {
    throw new Error('BOT_TOKEN environment variable is required');
  }

  if (!targetChannelId) {
    throw new Error('TARGET_CHANNEL_ID environment variable is required');
  }

  const config: CardImageConfig = {
    botToken,
    targetChannelId,
    logLevel,
  };

  logger.info('Configuration loaded successfully', { 
    targetChannelId, 
    logLevel,
    hasBotToken: !!botToken 
  });

  return config;
} 