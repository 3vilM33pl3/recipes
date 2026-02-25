# Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Production image
FROM node:20-alpine
WORKDIR /app

# Install dependencies for sharp (image processing)
# libheif-tools provides heif-convert for reliable HEIC->JPEG conversion
# fontconfig and ttf-dejavu for QR code text rendering
RUN apk add --no-cache \
    vips-dev \
    libheif-tools \
    python3 \
    make \
    g++ \
    fontconfig \
    ttf-dejavu

# Copy backend package files and install (sharp will link against vips)
COPY backend/package*.json ./
RUN npm install --only=production

# Copy backend source
COPY backend/src ./src

# Copy built frontend
COPY --from=frontend-build /app/frontend/dist ./public

# Create data directories
RUN mkdir -p /app/data/uploads /app/data/qrcodes /app/data/thumbnails

# Environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "src/index.js"]
