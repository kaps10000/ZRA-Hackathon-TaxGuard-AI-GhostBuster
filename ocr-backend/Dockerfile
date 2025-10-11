# =====================================================
# ZRA TaxGuard OCR Backend - Dockerfile
# =====================================================
# Node.js backend service with PostgreSQL and OCR integration
# =====================================================

FROM node:18-alpine as base

# Install system dependencies for image processing
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev

WORKDIR /app

# =====================================================
# Dependencies Stage
# =====================================================
FROM base as dependencies

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# =====================================================
# Development Stage
# =====================================================
FROM base as development

# Copy package files
COPY package*.json ./

# Install all dependencies including dev
RUN npm install

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p uploads logs

# Expose port
EXPOSE 5000

# Development command with hot reload
CMD ["npm", "run", "dev"]

# =====================================================
# Production Stage
# =====================================================
FROM base as production

# Copy dependencies from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy package files
COPY package*.json ./

# Copy application code
COPY server.js ./
COPY routes/ ./routes/
COPY services/ ./services/
COPY middleware/ ./middleware/
COPY models/ ./models/
COPY utils/ ./utils/
COPY config/ ./config/
COPY database/ ./database/

# Create necessary directories
RUN mkdir -p uploads logs temp

# Create non-root user for security
RUN addgroup -g 1000 ocruser && \
    adduser -D -u 1000 -G ocruser ocruser && \
    chown -R ocruser:ocruser /app

# Switch to non-root user
USER ocruser

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Production command
CMD ["node", "server.js"]
