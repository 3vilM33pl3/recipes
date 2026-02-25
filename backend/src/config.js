import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',

  // Paths
  uploadDir: process.env.UPLOAD_DIR || join(__dirname, '../../data/uploads'),
  thumbnailDir: process.env.THUMBNAIL_DIR || join(__dirname, '../../data/thumbnails'),
  qrcodeDir: process.env.QRCODE_DIR || join(__dirname, '../../data/qrcodes'),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost/recipes',

  // Limits
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 20 * 1024 * 1024, // 20MB
  allowedTypes: (process.env.ALLOWED_TYPES || 'image/jpeg,image/png,image/webp,image/heic,image/heif,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword').split(','),

  // OpenAI
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiModel: process.env.OPENAI_MODEL || 'gpt-5.2',
};
