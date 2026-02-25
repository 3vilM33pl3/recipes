import { Router } from 'express';
import { join } from 'path';
import { unlink } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import sharp from 'sharp';
import { nanoid } from 'nanoid';
import { upload } from '../middleware/upload.js';
import { createRecipe, getRecipes, getRecipeBySlug, deleteRecipe } from '../db/database.js';
import { extractRecipe, extractRecipeFromText } from '../services/vision.js';
import { extractTextFromWord, isWordDocument } from '../services/document.js';
import { generateQRCode } from '../services/qrGenerator.js';
import { createSlug } from '../utils/slugify.js';
import config from '../config.js';

const execAsync = promisify(exec);

// Convert HEIC to JPEG using heif-convert CLI tool
async function convertHeicToJpeg(inputPath, outputPath) {
  await execAsync(`heif-convert -q 90 "${inputPath}" "${outputPath}"`);
  return outputPath;
}

const router = Router();

// POST /api/recipes - Upload and process recipe file (image or document)
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    let originalPath = req.file.path;
    const id = req.file.filename.split('.')[0];
    const isWord = isWordDocument(req.file.filename);
    const isHeic = /\.(heic|heif)$/i.test(req.file.filename);

    let result;
    let thumbnailFilename = null;

    if (isWord) {
      // Handle Word document
      const docResult = await extractTextFromWord(originalPath);
      if (!docResult.success) {
        console.error('Word extraction failed:', docResult.error);
        return res.status(500).json({ success: false, error: 'Failed to read Word document' });
      }
      result = await extractRecipeFromText(docResult.text);
    } else {
      // Handle image
      let processPath = originalPath;
      if (isHeic) {
        const convertedPath = join(config.uploadDir, `${id}_converted.jpg`);
        try {
          await convertHeicToJpeg(originalPath, convertedPath);
          processPath = convertedPath;
        } catch (convErr) {
          console.warn('HEIC conversion failed, trying Sharp directly:', convErr.message);
        }
      }

      // Create thumbnail for images
      thumbnailFilename = `${id}_thumb.jpg`;
      const thumbnailPath = join(config.thumbnailDir, thumbnailFilename);
      await sharp(processPath)
        .resize(400, null, { withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);

      result = await extractRecipe(processPath);
    }

    if (!result.success) {
      console.error('Recipe extraction failed:', result.error);
      return res.status(500).json({ success: false, error: 'Failed to extract recipe' });
    }

    const extracted = result.recipe;

    // Create slug from title
    const slug = createSlug(extracted.title || 'Untitled Recipe');

    // Create recipe record
    const recipe = {
      id,
      slug,
      title: extracted.title || 'Untitled Recipe',
      description: extracted.description || null,
      servings: extracted.servings || null,
      prepTime: extracted.prepTime || null,
      cookTime: extracted.cookTime || null,
      difficulty: extracted.difficulty || null,
      ingredients: extracted.ingredients || [],
      instructions: extracted.instructions || [],
      nutrition: extracted.nutrition || null,
      notes: extracted.notes || null,
      extractedRaw: result.rawText,
      originalImage: req.file.filename,
      thumbnailImage: thumbnailFilename,
      qrCodeImage: null,
    };

    await createRecipe(recipe);

    // Generate QR code asynchronously
    generateQRCode(id, slug, extracted.title || 'Recipe').catch(err => {
      console.error('QR generation failed:', err);
    });

    res.json({
      success: true,
      recipe: {
        id,
        slug,
        title: extracted.title,
        url: `${config.baseUrl}/r/${slug}`,
        qrUrl: `${config.baseUrl}/api/recipes/${slug}/qr`,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: 'Failed to process recipe' });
  }
});

// GET /api/recipes - List all recipes
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);

    const result = await getRecipes(page, limit);
    res.json(result);
  } catch (error) {
    console.error('List error:', error);
    res.status(500).json({ success: false, error: 'Failed to list recipes' });
  }
});

// GET /api/recipes/:slug - Get single recipe
router.get('/:slug', async (req, res) => {
  try {
    const recipe = await getRecipeBySlug(req.params.slug);
    if (!recipe) {
      return res.status(404).json({ success: false, error: 'Recipe not found' });
    }
    res.json({ success: true, recipe });
  } catch (error) {
    console.error('Get error:', error);
    res.status(500).json({ success: false, error: 'Failed to get recipe' });
  }
});

// DELETE /api/recipes/:slug - Delete a recipe
router.delete('/:slug', async (req, res) => {
  try {
    const recipe = await getRecipeBySlug(req.params.slug);
    if (!recipe) {
      return res.status(404).json({ success: false, error: 'Recipe not found' });
    }

    // Delete files
    const filesToDelete = [
      recipe.originalImage && join(config.uploadDir, recipe.originalImage),
      recipe.thumbnailImage && join(config.thumbnailDir, recipe.thumbnailImage),
      recipe.qrCodeImage && join(config.qrcodeDir, recipe.qrCodeImage),
    ].filter(Boolean);

    for (const file of filesToDelete) {
      try {
        await unlink(file);
      } catch (e) {
        // Ignore file not found errors
      }
    }

    await deleteRecipe(req.params.slug);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete recipe' });
  }
});

// GET /api/recipes/:slug/qr - Get QR code image
router.get('/:slug/qr', async (req, res) => {
  try {
    const recipe = await getRecipeBySlug(req.params.slug);
    if (!recipe) {
      return res.status(404).json({ success: false, error: 'Recipe not found' });
    }

    if (!recipe.qrCodeImage) {
      return res.status(404).json({ success: false, error: 'QR code not yet generated' });
    }

    const qrPath = join(config.qrcodeDir, recipe.qrCodeImage);
    res.sendFile(qrPath);
  } catch (error) {
    console.error('QR error:', error);
    res.status(500).json({ success: false, error: 'Failed to get QR code' });
  }
});

export default router;
