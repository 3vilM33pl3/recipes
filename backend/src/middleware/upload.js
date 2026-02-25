import multer from 'multer';
import { nanoid } from 'nanoid';
import { extname } from 'path';
import config from '../config.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (req, file, cb) => {
    const id = nanoid(10);
    const ext = extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${id}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  // Check MIME type
  if (config.allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed. Allowed types: ${config.allowedTypes.join(', ')}`), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.maxFileSize,
  },
});
