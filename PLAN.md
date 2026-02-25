# Braai Recipe App - Complete Project Plan

> A web application that converts photos of recipes into structured, shareable web pages with QR codes.
> 
> **Production URL:** https://braai.metatao.net
> **Deployment:** Docker container

---

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Directory Structure](#directory-structure)
5. [Data Model](#data-model)
6. [API Endpoints](#api-endpoints)
7. [Processing Pipeline](#processing-pipeline)
8. [Dependencies](#dependencies)
9. [Docker Configuration](#docker-configuration)
10. [Google Cloud Vision Setup](#google-cloud-vision-setup)
11. [Environment Variables](#environment-variables)
12. [User Flow](#user-flow)
13. [Mobile Considerations](#mobile-considerations)
14. [Security Considerations](#security-considerations)
15. [Implementation Phases](#implementation-phases)

---

## Overview

### Core Features

- Upload a photo of a recipe (from file or camera on mobile)
- Extract text using Google Cloud Vision OCR
- Parse and structure the recipe (title, ingredients, instructions)
- Display recipe on a clean, responsive web page
- Show original image at bottom for reference
- Generate QR code linking to the recipe page
- Works on desktop and mobile browsers

### Key Decisions

- **Backend:** Node.js + Express (not Python)
- **OCR:** Google Cloud Vision API (not Tesseract)
- **Authentication:** None (public recipes)
- **Database:** SQLite (simple, no separate container)

---

## Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | React + Tailwind CSS | Responsive, mobile-first, PWA capable |
| **Backend** | Node.js + Express | JavaScript throughout, good async handling |
| **OCR Engine** | Google Cloud Vision API | Superior accuracy, handles handwriting, structured output |
| **Database** | SQLite (better-sqlite3) | Simple, no separate container needed |
| **QR Generation** | `qrcode` npm package | Lightweight, customizable |
| **Image Processing** | Sharp | Fast resizing, format conversion |
| **Container** | Docker + Docker Compose | Single command deployment |
| **Reverse Proxy** | Nginx | SSL, caching, static file serving |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser/Mobile)                   │
│                    React SPA + PWA (works offline)               │
└─────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Nginx Reverse Proxy                      │
│              (SSL termination, static files, /api proxy)         │
└─────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Node.js + Express Server                      │
├─────────────────────────────────────────────────────────────────┤
│  • Multer (image upload handling)                                │
│  • @google-cloud/vision (OCR processing)                        │
│  • Sharp (image resizing/optimization)                          │
│  • qrcode (QR generation)                                        │
│  • better-sqlite3 (database)                                     │
└─────────────────────────────────────────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                              ▼
┌──────────────────────────┐       ┌──────────────────────────────┐
│     SQLite Database      │       │        File Storage          │
│      (db.sqlite)         │       │     (./data volume)          │
│                          │       │                              │
│  • Recipe metadata       │       │  • Original images           │
│  • Extracted text        │       │  • Generated QR codes        │
│  • Timestamps            │       │  • Thumbnails                │
└──────────────────────────┘       └──────────────────────────────┘
```

---

## Directory Structure

```
braai-recipe-app/
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── .env                          # Local env (gitignored)
├── CLAUDE.md                     # Context for Claude Code
├── README.md
├── nginx/
│   └── nginx.conf
├── backend/
│   ├── package.json
│   ├── src/
│   │   ├── index.js              # Express app entry
│   │   ├── config.js             # Environment config
│   │   ├── db/
│   │   │   ├── schema.sql        # Database schema
│   │   │   └── database.js       # DB connection & queries
│   │   ├── routes/
│   │   │   └── recipes.js        # API routes
│   │   ├── services/
│   │   │   ├── vision.js         # Google Vision OCR
│   │   │   ├── parser.js         # Text structuring
│   │   │   └── qrGenerator.js    # QR code generation
│   │   ├── middleware/
│   │   │   └── upload.js         # Multer config
│   │   └── utils/
│   │       └── slugify.js        # URL slug generation
│   └── credentials/
│       └── .gitkeep              # Google service account JSON goes here
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── api/
│   │   │   └── recipes.js        # API client
│   │   ├── components/
│   │   │   ├── UploadForm.jsx
│   │   │   ├── RecipeCard.jsx
│   │   │   ├── RecipeView.jsx
│   │   │   ├── QRDisplay.jsx
│   │   │   └── LoadingSpinner.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   └── Recipe.jsx
│   │   └── styles/
│   │       └── index.css         # Tailwind imports
│   └── public/
│       ├── manifest.json         # PWA manifest
│       └── icons/                # App icons
└── data/
    ├── uploads/                  # Original images
    ├── qrcodes/                  # Generated QR codes
    ├── thumbnails/               # Resized previews
    └── db.sqlite                 # Database file
```

---

## Data Model

### SQLite Schema

```sql
-- schema.sql
CREATE TABLE IF NOT EXISTS recipes (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT,
    description TEXT,
    ingredients TEXT,           -- JSON array
    instructions TEXT,          -- JSON array
    extracted_raw TEXT,         -- Raw OCR output
    original_image TEXT,        -- Filename in uploads/
    thumbnail_image TEXT,       -- Filename in thumbnails/
    qr_code_image TEXT,         -- Filename in qrcodes/
    ocr_confidence REAL,        -- Vision API confidence score
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recipes_slug ON recipes(slug);
CREATE INDEX idx_recipes_created ON recipes(created_at DESC);
```

### Recipe Object (JavaScript)

```javascript
{
  id: "abc123xyz",
  slug: "braai-lamb-chops-abc123",
  title: "Braai Lamb Chops",
  description: "Traditional South African grilled lamb",
  ingredients: [
    "8 lamb chops",
    "2 tbsp olive oil",
    "Fresh rosemary",
    "Salt and pepper"
  ],
  instructions: [
    "Marinate chops for 2 hours",
    "Prepare coals to medium heat",
    "Grill 4-5 minutes per side"
  ],
  extractedRaw: "Full OCR text...",
  originalImage: "abc123xyz.jpg",
  thumbnailImage: "abc123xyz_thumb.jpg",
  qrCodeImage: "abc123xyz_qr.png",
  ocrConfidence: 0.94,
  createdAt: "2024-01-15T10:30:00Z",
  updatedAt: "2024-01-15T10:30:00Z"
}
```

---

## API Endpoints

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| `POST` | `/api/recipes` | Upload & process recipe image | `multipart/form-data` with `image` field | Recipe object |
| `GET` | `/api/recipes` | List all recipes | Query: `?page=1&limit=20` | Paginated recipe list |
| `GET` | `/api/recipes/:slug` | Get single recipe | - | Recipe object |
| `DELETE` | `/api/recipes/:slug` | Delete a recipe | - | `{ success: true }` |
| `GET` | `/api/recipes/:slug/qr` | Get QR code image | - | PNG image |
| `GET` | `/uploads/:filename` | Serve original image | - | Image file |
| `GET` | `/thumbnails/:filename` | Serve thumbnail | - | Image file |
| `GET` | `/r/:slug` | Recipe page (SPA) | - | HTML (React app) |

### Example Responses

#### POST /api/recipes
```json
{
  "success": true,
  "recipe": {
    "id": "abc123xyz",
    "slug": "braai-lamb-chops-abc123",
    "title": "Braai Lamb Chops",
    "url": "https://braai.metatao.net/r/braai-lamb-chops-abc123",
    "qrUrl": "https://braai.metatao.net/api/recipes/braai-lamb-chops-abc123/qr"
  }
}
```

#### GET /api/recipes
```json
{
  "recipes": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

## Processing Pipeline

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   1. Upload  │────▶│  2. Validate │────▶│  3. Process  │
│   (Multer)   │     │   (Sharp)    │     │   Image      │
└──────────────┘     └──────────────┘     └──────────────┘
                                                 │
      ┌──────────────────────────────────────────┤
      │                                          │
      ▼                                          ▼
┌──────────────┐                          ┌──────────────┐
│  4. Store    │                          │  5. Google   │
│  Original +  │                          │  Vision API  │
│  Thumbnail   │                          │  OCR Call    │
└──────────────┘                          └──────────────┘
                                                 │
                                                 ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  8. Return   │◀────│  7. Save to  │◀────│  6. Parse &  │
│  Response    │     │   Database   │     │  Structure   │
└──────────────┘     └──────────────┘     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  9. Generate │
                     │   QR Code    │
                     │  (async)     │
                     └──────────────┘
```

### Step-by-Step Details

1. **Upload (Multer)**
   - Accept `multipart/form-data` with `image` field
   - Limit: 10MB max file size
   - Accept: jpg, jpeg, png, webp, heic

2. **Validate (Sharp)**
   - Verify image can be processed
   - Check dimensions (reject if < 200px)
   - Detect format

3. **Process Image**
   - Resize if > 2000px on longest side
   - Convert HEIC to JPEG
   - Generate thumbnail (400px wide)

4. **Store Files**
   - Save original to `data/uploads/{id}.{ext}`
   - Save thumbnail to `data/thumbnails/{id}_thumb.jpg`

5. **Google Vision OCR**
   - Call `documentTextDetection` API
   - Receive structured text with confidence scores
   - Handle API errors gracefully

6. **Parse & Structure**
   - Extract title (first line or largest text)
   - Identify ingredients section
   - Identify instructions section
   - Fall back to raw text if parsing fails

7. **Save to Database**
   - Generate unique ID (nanoid)
   - Generate URL slug from title
   - Insert recipe record

8. **Return Response**
   - Return recipe object with URLs
   - Include processing metadata

9. **Generate QR Code (async)**
   - Create QR code pointing to recipe URL
   - Save to `data/qrcodes/{id}_qr.png`
   - Update database with QR path

---

## Dependencies

### Backend (package.json)

```json
{
  "name": "braai-recipe-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "init-db": "node src/db/init.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "multer": "^1.4.5-lts.1",
    "sharp": "^0.33.2",
    "@google-cloud/vision": "^4.0.2",
    "better-sqlite3": "^9.4.1",
    "qrcode": "^1.5.3",
    "nanoid": "^5.0.4",
    "slugify": "^1.6.6",
    "dotenv": "^16.4.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.3"
  }
}
```

### Frontend (package.json)

```json
{
  "name": "braai-recipe-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0",
    "axios": "^1.6.7"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "vite": "^5.1.0"
  }
}
```

---

## Docker Configuration

### Dockerfile

```dockerfile
# Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Production image
FROM node:20-alpine
WORKDIR /app

# Install dependencies for sharp
RUN apk add --no-cache vips-dev

COPY backend/package*.json ./
RUN npm ci --only=production

COPY backend/src ./src
COPY --from=frontend-build /app/frontend/dist ./public

# Create data directories
RUN mkdir -p /app/data/uploads /app/data/qrcodes /app/data/thumbnails

EXPOSE 3000
CMD ["node", "src/index.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    container_name: braai-app
    environment:
      - NODE_ENV=production
      - PORT=3000
      - BASE_URL=https://braai.metatao.net
      - GOOGLE_APPLICATION_CREDENTIALS=/app/credentials/google-vision.json
    volumes:
      - ./data:/app/data
      - ./backend/credentials:/app/credentials:ro
    expose:
      - "3000"
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: braai-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - app
    restart: unless-stopped
```

### nginx.conf

```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=upload:10m rate=10r/m;

    server {
        listen 80;
        server_name braai.metatao.net;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name braai.metatao.net;

        ssl_certificate /etc/letsencrypt/live/braai.metatao.net/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/braai.metatao.net/privkey.pem;

        # SSL settings
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_prefer_server_ciphers on;

        # Upload size limit
        client_max_body_size 10M;

        # API proxy
        location /api {
            proxy_pass http://app:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_cache_bypass $http_upgrade;

            # Rate limit uploads
            location /api/recipes {
                limit_req zone=upload burst=5 nodelay;
                proxy_pass http://app:3000;
            }
        }

        # Static files (uploads, thumbnails, qrcodes)
        location /uploads {
            proxy_pass http://app:3000;
            proxy_cache_valid 200 1d;
        }

        location /thumbnails {
            proxy_pass http://app:3000;
            proxy_cache_valid 200 1d;
        }

        # Frontend (SPA)
        location / {
            proxy_pass http://app:3000;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
        }
    }
}
```

---

## Google Cloud Vision Setup

### Step-by-Step

1. **Create a Google Cloud Project**
   ```
   - Go to https://console.cloud.google.com
   - Create new project: "braai-recipe-app"
   - Note the project ID
   ```

2. **Enable the Vision API**
   ```
   - Go to APIs & Services → Library
   - Search "Cloud Vision API"
   - Click Enable
   ```

3. **Create Service Account**
   ```
   - Go to APIs & Services → Credentials
   - Click "Create Credentials" → "Service Account"
   - Name: "braai-vision-reader"
   - Role: "Cloud Vision API User"
   - Click "Create and Continue"
   - Skip optional steps, click "Done"
   ```

4. **Create JSON Key**
   ```
   - Click on the service account you created
   - Go to "Keys" tab
   - Click "Add Key" → "Create new key"
   - Select JSON format
   - Download the file
   ```

5. **Configure in App**
   ```bash
   # Place the downloaded JSON file at:
   backend/credentials/google-vision.json
   
   # Add to .gitignore:
   backend/credentials/*.json
   ```

### Pricing

| Feature | Free Tier | After Free Tier |
|---------|-----------|-----------------|
| TEXT_DETECTION | 1,000 units/month | $1.50 per 1,000 |
| DOCUMENT_TEXT_DETECTION | 1,000 units/month | $1.50 per 1,000 |

For a personal recipe app, you'll likely stay within the free tier.

### Vision API Usage Example

```javascript
// services/vision.js
import vision from '@google-cloud/vision';

const client = new vision.ImageAnnotatorClient();

export async function extractText(imagePath) {
  const [result] = await client.documentTextDetection(imagePath);
  
  const fullText = result.fullTextAnnotation?.text || '';
  const blocks = result.fullTextAnnotation?.pages?.[0]?.blocks || [];
  const confidence = result.fullTextAnnotation?.pages?.[0]?.confidence;
  
  return {
    rawText: fullText,
    blocks: blocks,
    confidence: confidence
  };
}
```

---

## Environment Variables

### .env.example

```env
# Server
NODE_ENV=development
PORT=3000
BASE_URL=https://braai.metatao.net

# Google Cloud Vision
GOOGLE_APPLICATION_CREDENTIALS=./credentials/google-vision.json

# File storage paths
UPLOAD_DIR=./data/uploads
THUMBNAIL_DIR=./data/thumbnails
QRCODE_DIR=./data/qrcodes
DB_PATH=./data/db.sqlite

# Limits
MAX_FILE_SIZE=10485760
ALLOWED_TYPES=image/jpeg,image/png,image/webp,image/heic

# Rate limiting (requests per minute)
RATE_LIMIT_UPLOAD=10
```

---

## User Flow

### Home Page

```
┌─────────────────────────────────────────────────────────────────┐
│  🔥 Braai Recipes                                    [About]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │     📷  Upload a recipe photo                             │  │
│  │                                                           │  │
│  │     Drag & drop an image here, or                        │  │
│  │                                                           │  │
│  │     [Choose File]    [📸 Take Photo]                     │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  Recent Recipes                                                  │
│                                                                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐              │
│  │  Thumb  │ │  Thumb  │ │  Thumb  │ │  Thumb  │              │
│  │         │ │         │ │         │ │         │              │
│  │ Lamb    │ │ Boere-  │ │ Pap &   │ │ Chakal- │              │
│  │ Chops   │ │ wors    │ │ Sous    │ │ aka     │              │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Processing State

```
┌─────────────────────────────────────────────────────────────────┐
│  🔥 Braai Recipes                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                    Processing your recipe...                     │
│                                                                  │
│              ┌─────────────────────────────────┐                │
│              │                                 │                │
│              │      [Image Preview]            │                │
│              │                                 │                │
│              └─────────────────────────────────┘                │
│                                                                  │
│              ████████████░░░░░░░░  60%                          │
│                                                                  │
│              Extracting text from image...                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Recipe Page

```
┌─────────────────────────────────────────────────────────────────┐
│  🔥 Braai Recipes                              [← Back] [Share] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │  🍖 Braai Lamb Chops                          ┌───────┐  │  │
│  │                                                │ QR    │  │  │
│  │  Traditional South African grilled lamb       │ Code  │  │  │
│  │                                                └───────┘  │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │                                                           │  │
│  │  INGREDIENTS                                              │  │
│  │                                                           │  │
│  │  • 8 lamb chops                                           │  │
│  │  • 2 tbsp olive oil                                       │  │
│  │  • Fresh rosemary, chopped                                │  │
│  │  • 3 cloves garlic, minced                                │  │
│  │  • Salt and black pepper to taste                         │  │
│  │                                                           │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │                                                           │  │
│  │  INSTRUCTIONS                                             │  │
│  │                                                           │  │
│  │  1. Mix olive oil, rosemary, and garlic in a bowl        │  │
│  │                                                           │  │
│  │  2. Rub mixture over lamb chops and season with          │  │
│  │     salt and pepper                                       │  │
│  │                                                           │  │
│  │  3. Marinate for at least 2 hours (overnight is best)    │  │
│  │                                                           │  │
│  │  4. Prepare braai coals to medium-high heat              │  │
│  │                                                           │  │
│  │  5. Grill chops 4-5 minutes per side for medium-rare     │  │
│  │                                                           │  │
│  │  6. Rest for 5 minutes before serving                    │  │
│  │                                                           │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │                                                           │  │
│  │  ORIGINAL IMAGE                                           │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │                                                     │ │  │
│  │  │                                                     │ │  │
│  │  │              [Original Recipe Photo]                │ │  │
│  │  │                                                     │ │  │
│  │  │                                                     │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  [Copy Link]  [Download QR]  [Delete Recipe]                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Mobile Considerations

| Feature | Implementation |
|---------|----------------|
| **Camera Access** | `<input type="file" accept="image/*" capture="environment">` |
| **Responsive Layout** | Tailwind breakpoints (`sm:`, `md:`, `lg:`) |
| **Touch Gestures** | Pinch-to-zoom on recipe image |
| **Offline Support** | Service Worker caches viewed recipes |
| **Install Prompt** | PWA manifest with app icons |
| **Performance** | Lazy load images, compress uploads client-side |
| **Touch Targets** | Minimum 44x44px for buttons |

### PWA Manifest

```json
{
  "name": "Braai Recipes",
  "short_name": "Braai",
  "description": "Convert recipe photos to shareable web pages",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#f97316",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## Security Considerations

1. **File Upload Validation**
   - Verify MIME types server-side (don't trust client)
   - Check magic bytes of file
   - Limit file size (10MB)
   - Rename files to random IDs

2. **Rate Limiting**
   - 10 uploads per hour per IP
   - Use nginx `limit_req` module

3. **Input Sanitization**
   - Escape all user content before display
   - Sanitize slugs (alphanumeric + hyphens only)

4. **HTTPS Only**
   - Redirect all HTTP to HTTPS
   - Use HSTS header

5. **CORS**
   - Restrict to braai.metatao.net origin in production

6. **No Authentication**
   - All recipes are public
   - Consider adding simple admin password for deletion

---

## Implementation Phases

### Phase 1: Core MVP (Week 1-2)

- [ ] **Project Setup**
  - [ ] Initialize git repository
  - [ ] Create directory structure
  - [ ] Set up backend with Express
  - [ ] Set up frontend with Vite + React

- [ ] **Backend Core**
  - [ ] Configure Express server
  - [ ] Set up Multer for file uploads
  - [ ] Integrate Sharp for image processing
  - [ ] Set up SQLite database
  - [ ] Create database schema

- [ ] **Google Vision Integration**
  - [ ] Set up Google Cloud project
  - [ ] Enable Vision API
  - [ ] Create service account
  - [ ] Implement OCR service

- [ ] **Basic Features**
  - [ ] Upload endpoint
  - [ ] OCR processing
  - [ ] Save to database
  - [ ] QR code generation
  - [ ] Basic HTML recipe page

### Phase 2: React Frontend (Week 3)

- [ ] **Frontend Setup**
  - [ ] Configure Tailwind CSS
  - [ ] Set up React Router
  - [ ] Create API client

- [ ] **Components**
  - [ ] UploadForm with drag-drop
  - [ ] Camera capture button (mobile)
  - [ ] RecipeCard for grid view
  - [ ] RecipeView for full page
  - [ ] QRDisplay component
  - [ ] LoadingSpinner

- [ ] **Pages**
  - [ ] Home page with upload + recipe grid
  - [ ] Recipe detail page
  - [ ] Processing/loading state

### Phase 3: Text Parsing (Week 4)

- [ ] **Parsing Logic**
  - [ ] Title extraction (first line / largest text)
  - [ ] Ingredients section detection
  - [ ] Instructions section detection
  - [ ] Numbered list handling
  - [ ] Bullet point handling

- [ ] **Fallbacks**
  - [ ] Raw text display if parsing fails
  - [ ] Manual title editing (optional)

- [ ] **Testing**
  - [ ] Test with various recipe formats
  - [ ] Test with handwritten recipes
  - [ ] Test with printed recipes

### Phase 4: Polish & Deploy (Week 5)

- [ ] **PWA Setup**
  - [ ] Create manifest.json
  - [ ] Add service worker
  - [ ] Create app icons
  - [ ] Test install prompt

- [ ] **Docker**
  - [ ] Write Dockerfile
  - [ ] Write docker-compose.yml
  - [ ] Test local build
  - [ ] Test container networking

- [ ] **Deployment**
  - [ ] Set up server at braai.metatao.net
  - [ ] Configure SSL with Let's Encrypt
  - [ ] Set up nginx reverse proxy
  - [ ] Deploy containers
  - [ ] Test production

- [ ] **Final Polish**
  - [ ] Error handling improvements
  - [ ] Loading state refinements
  - [ ] Mobile testing
  - [ ] Performance optimization

---

## Quick Start Commands

```bash
# Clone and setup
git clone <repo>
cd braai-recipe-app

# Backend development
cd backend
npm install
cp .env.example .env
# Add your Google Vision credentials
npm run dev

# Frontend development (separate terminal)
cd frontend
npm install
npm run dev

# Docker production build
docker-compose build
docker-compose up -d

# View logs
docker-compose logs -f app
```

---

## Useful Resources

- [Google Cloud Vision API Docs](https://cloud.google.com/vision/docs)
- [Express.js Documentation](https://expressjs.com/)
- [Multer Documentation](https://github.com/expressjs/multer)
- [Sharp Documentation](https://sharp.pixelplumbing.com/)
- [React Router Documentation](https://reactrouter.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [QRCode npm package](https://www.npmjs.com/package/qrcode)
- [better-sqlite3 Documentation](https://github.com/WiseLibs/better-sqlite3)

---

## Notes for Claude Code

When implementing this project:

1. Start with Phase 1 - get the backend working first
2. Use ES modules (`"type": "module"` in package.json)
3. Keep the Vision API credentials secure (never commit them)
4. Test OCR with a simple image before building the full pipeline
5. The slug should be URL-safe and derived from the recipe title
6. QR code generation can be async (don't block the upload response)
7. Always validate file types server-side, not just client-side
