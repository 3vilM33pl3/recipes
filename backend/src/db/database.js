import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import config from '../config.js';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let pool = null;

export async function getDb() {
  if (!pool) {
    pool = new Pool({
      connectionString: config.databaseUrl,
    });

    // Initialize schema
    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(schema);
  }
  return pool;
}

// Recipe operations
export async function createRecipe(recipe) {
  const db = await getDb();
  const result = await db.query(
    `INSERT INTO recipes (id, slug, title, description, servings, prep_time, cook_time, difficulty, ingredients, instructions, nutrition, notes, extracted_raw, original_image, thumbnail_image, qr_code_image)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
     RETURNING *`,
    [
      recipe.id,
      recipe.slug,
      recipe.title,
      recipe.description || null,
      recipe.servings || null,
      recipe.prepTime || null,
      recipe.cookTime || null,
      recipe.difficulty || null,
      JSON.stringify(recipe.ingredients || []),
      JSON.stringify(recipe.instructions || []),
      recipe.nutrition || null,
      recipe.notes || null,
      recipe.extractedRaw || null,
      recipe.originalImage,
      recipe.thumbnailImage || null,
      recipe.qrCodeImage || null,
    ]
  );
  return result;
}

export async function updateRecipeQr(id, qrCodeImage) {
  const db = await getDb();
  const result = await db.query(
    'UPDATE recipes SET qr_code_image = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [qrCodeImage, id]
  );
  return result;
}

export async function updateRecipe(slug, recipe) {
  const db = await getDb();
  const result = await db.query(
    `UPDATE recipes
     SET title = $1,
         description = $2,
         servings = $3,
         prep_time = $4,
         cook_time = $5,
         difficulty = $6,
         ingredients = $7,
         instructions = $8,
         nutrition = $9,
         notes = $10,
         updated_at = CURRENT_TIMESTAMP
     WHERE slug = $11
     RETURNING *`,
    [
      recipe.title,
      recipe.description,
      recipe.servings,
      recipe.prepTime,
      recipe.cookTime,
      recipe.difficulty,
      JSON.stringify(recipe.ingredients || []),
      JSON.stringify(recipe.instructions || []),
      recipe.nutrition,
      recipe.notes,
      slug,
    ]
  );

  if (result.rows.length === 0) return null;
  return mapRowToRecipe(result.rows[0]);
}

export async function getRecipeBySlug(slug) {
  const db = await getDb();
  const result = await db.query('SELECT * FROM recipes WHERE slug = $1', [slug]);
  if (result.rows.length === 0) return null;
  return mapRowToRecipe(result.rows[0]);
}

export async function getRecipeById(id) {
  const db = await getDb();
  const result = await db.query('SELECT * FROM recipes WHERE id = $1', [id]);
  if (result.rows.length === 0) return null;
  return mapRowToRecipe(result.rows[0]);
}

export async function getRecipes(page = 1, limit = 20) {
  const db = await getDb();
  const offset = (page - 1) * limit;

  const countResult = await db.query('SELECT COUNT(*) as total FROM recipes');
  const total = parseInt(countResult.rows[0].total, 10);

  const result = await db.query(
    'SELECT * FROM recipes ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  );

  return {
    recipes: result.rows.map(mapRowToRecipe),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function deleteRecipe(slug) {
  const db = await getDb();
  const result = await db.query('DELETE FROM recipes WHERE slug = $1', [slug]);
  return result;
}

function mapRowToRecipe(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    servings: row.servings,
    prepTime: row.prep_time,
    cookTime: row.cook_time,
    difficulty: row.difficulty,
    ingredients: typeof row.ingredients === 'string' ? JSON.parse(row.ingredients) : (row.ingredients || []),
    instructions: typeof row.instructions === 'string' ? JSON.parse(row.instructions) : (row.instructions || []),
    nutrition: row.nutrition,
    notes: row.notes,
    extractedRaw: row.extracted_raw,
    originalImage: row.original_image,
    thumbnailImage: row.thumbnail_image,
    qrCodeImage: row.qr_code_image,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
