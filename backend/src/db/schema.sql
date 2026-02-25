-- Recipes App Database Schema (PostgreSQL)

CREATE TABLE IF NOT EXISTS recipes (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT,
    description TEXT,
    servings TEXT,
    prep_time TEXT,
    cook_time TEXT,
    difficulty TEXT,
    ingredients JSONB,           -- JSON array
    instructions JSONB,          -- JSON array
    nutrition TEXT,
    notes TEXT,
    extracted_raw TEXT,         -- Raw AI output
    original_image TEXT,        -- Filename in uploads/
    thumbnail_image TEXT,       -- Filename in thumbnails/
    qr_code_image TEXT,         -- Filename in qrcodes/
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recipes_slug ON recipes(slug);
CREATE INDEX IF NOT EXISTS idx_recipes_created ON recipes(created_at DESC);
