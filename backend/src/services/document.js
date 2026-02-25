import mammoth from 'mammoth';
import { readFile } from 'fs/promises';

export async function extractTextFromWord(filePath) {
  try {
    const buffer = await readFile(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return {
      text: result.value,
      success: true,
    };
  } catch (error) {
    console.error('Word extraction error:', error.message);
    return {
      text: '',
      success: false,
      error: error.message,
    };
  }
}

export function isWordDocument(filename) {
  return /\.(docx?|doc)$/i.test(filename);
}
