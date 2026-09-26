import dotenv from 'dotenv';
import path from 'path';

// Check both local server/.env and root .env
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://stocksense:stocksense_password@localhost:5432/stocksense_db?schema=public',
  jwtSecret: process.env.JWT_SECRET || 'super-secret-jwt-key-stocksense-dev-12345',
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'StockSense <noreply@stocksense.local>'
  }
};
