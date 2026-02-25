import QRCode from 'qrcode';
import sharp from 'sharp';
import { join } from 'path';
import config from '../config.js';
import { updateRecipeQr } from '../db/database.js';

export async function generateQRCode(recipeId, slug, title = 'Recipe') {
  const url = `${config.baseUrl}/r/${slug}`;
  const filename = `${recipeId}_qr.png`;
  const filepath = join(config.qrcodeDir, filename);

  try {
    // Generate QR code as buffer
    const qrBuffer = await QRCode.toBuffer(url, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });

    // Truncate title if too long
    const maxTitleLength = 35;
    const displayTitle = title.length > maxTitleLength
      ? title.substring(0, maxTitleLength - 3) + '...'
      : title;

    // Create SVG text overlay
    const textHeight = 40;
    const svgText = `
      <svg width="300" height="${textHeight}">
        <rect width="300" height="${textHeight}" fill="white"/>
        <text
          x="150"
          y="28"
          font-family="DejaVu Sans, sans-serif"
          font-size="16"
          font-weight="bold"
          fill="black"
          text-anchor="middle"
        >${escapeXml(displayTitle)}</text>
      </svg>
    `;

    // Combine QR code with title
    await sharp(qrBuffer)
      .extend({
        bottom: textHeight,
        background: { r: 255, g: 255, b: 255 }
      })
      .composite([{
        input: Buffer.from(svgText),
        top: 300,
        left: 0
      }])
      .png()
      .toFile(filepath);

    // Update database with QR code path
    await updateRecipeQr(recipeId, filename);

    return {
      filename,
      success: true,
    };
  } catch (error) {
    console.error('QR generation error:', error.message);
    return {
      filename: null,
      success: false,
      error: error.message,
    };
  }
}

// Escape XML special characters for SVG
function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
