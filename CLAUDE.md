# CLAUDE.md - Recipes App

> Context file for Claude Code CLI sessions

## Project Overview

Web app to convert recipe photos into structured, shareable pages with QR codes.

**URL:** https://recipes.metatao.net
**Stack:** Node.js, Express, React, SQLite, OpenAI GPT-5.2
**Auth:** None (public)

## Tech Stack

- **Backend:** Node.js + Express (ES modules)
- **Frontend:** React + Vite + Tailwind CSS
- **OCR:** OpenAI GPT-5.2 Vision API
- **Database:** SQLite (better-sqlite3)
- **Images:** Sharp (resize/convert) + libheif-tools for HEIC
- **QR Codes:** qrcode npm package
- **Deploy:** Docker + Kubernetes + Nginx

## Directory Structure

```
applications/recipes/
├── backend/
│   ├── src/
│   │   ├── index.js          # Express entry
│   │   ├── config.js         # Env config
│   │   ├── db/               # SQLite setup
│   │   ├── routes/           # API routes
│   │   ├── services/         # Vision, QR, document
│   │   └── middleware/       # Multer upload
├── frontend/
│   └── src/
│       ├── pages/            # Home, Recipe
│       └── components/       # UploadForm, RecipeView, etc.
├── data/                     # uploads/, thumbnails/, qrcodes/, db.sqlite
└── Dockerfile
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/recipes` | Upload image/document, process, return recipe |
| GET | `/api/recipes` | List recipes (paginated) |
| GET | `/api/recipes/:slug` | Get single recipe |
| DELETE | `/api/recipes/:slug` | Delete recipe |
| GET | `/api/recipes/:slug/qr` | Get QR code PNG |

## Database Schema

```sql
CREATE TABLE recipes (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT,
    description TEXT,
    servings TEXT,
    prep_time TEXT,
    cook_time TEXT,
    difficulty TEXT,
    ingredients TEXT,      -- JSON array
    instructions TEXT,     -- JSON array
    nutrition TEXT,
    notes TEXT,
    extracted_raw TEXT,
    original_image TEXT,
    thumbnail_image TEXT,
    qr_code_image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Key Dependencies

**Backend:** express, multer, sharp, openai, mammoth, better-sqlite3, qrcode, nanoid, slugify
**Frontend:** react, react-router-dom, axios, tailwindcss

## Processing Flow

1. Upload image or Word document (Multer)
2. Validate & resize images (Sharp), HEIC conversion (heif-convert)
3. Store original + thumbnail (images only)
4. Extract recipe via OpenAI Vision API or text extraction (mammoth for .docx)
5. Parse JSON response into structured recipe
6. Save to SQLite
7. Generate QR code (async)
8. Return recipe object

## Environment Variables

```
NODE_ENV=production
PORT=3000
BASE_URL=https://recipes.metatao.net
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5.2
```

## Commands

```bash
# Backend dev
cd backend && npm run dev

# Frontend dev
cd frontend && npm run dev

# Docker build & push
docker buildx build --platform linux/arm64 -t ghcr.io/3vilm33pl3/recipes-app:latest --push .
```

## Supported Formats

- **Images:** JPEG, PNG, WebP, HEIC/HEIF
- **Documents:** Word (.doc, .docx)

## Notes

- Use ES modules (`"type": "module"`)
- HEIC conversion uses libheif-tools (heif-convert CLI)
- All files stored in `/app/data/` (mounted as hostPath volume)
- Slugs derived from recipe title + nanoid suffix
- No authentication - all recipes public
- iOS PWA support with mobile-friendly UI
