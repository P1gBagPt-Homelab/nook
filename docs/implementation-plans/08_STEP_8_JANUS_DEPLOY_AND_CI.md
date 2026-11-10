# 08. Step 8: Janus Deployment, Docker & CI/CD Pipeline

> **Goal**: Package Nook with production multi-stage Dockerfiles, satisfy all Project Janus operational requirements (5 Golden Endpoints, RFC 7807, GlitchTip Sentry), and automate deployment via the self-hosted runner to Coolify.  
> **Prerequisites**: Steps 1–7 completed.  

---

## 📋 Task 8.1: Fastify Production Dockerfile (`apps/api/Dockerfile`)

Create `apps/api/Dockerfile`:
```dockerfile
# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/api/package*.json ./apps/api/

RUN npm ci

COPY packages/shared/ ./packages/shared/
COPY apps/api/ ./apps/api/

RUN npm run build --workspace=@nook/api

# Stage 2: Production Runner (Lean Alpine, Non-Root)
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache curl

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/api/package*.json ./apps/api/

RUN npm ci --omit=dev

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Mandatory Janus Security: Run as non-root user
USER node

EXPOSE 8000
CMD ["node", "apps/api/dist/index.js"]
```

---

## 📋 Task 8.2: Vite PWA Production Dockerfile (`apps/web/Dockerfile`)

Create `apps/web/Dockerfile`:
```dockerfile
# Stage 1: Build Static Assets
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/web/package*.json ./apps/web/

RUN npm ci

COPY packages/shared/ ./packages/shared/
COPY apps/web/ ./apps/web/

RUN npm run build --workspace=@nook/web

# Stage 2: Ultra-Lean Nginx Alpine (<10MB RAM!)
FROM nginx:alpine AS runner

# Custom Nginx Config for PWA routing
COPY <<'EOF' /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip / Brotli compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml image/svg+xml;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API calls directly to Fastify backend on the 'coolify' network
    location /api/ {
        proxy_pass http://nook-api:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Proxy Scalar documentation
    location /docs {
        proxy_pass http://nook-api:8000/docs;
    }
}
EOF

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 📋 Task 8.3: GitHub Actions CI/CD (`.github/workflows/deploy.yml`)

Create `.github/workflows/deploy.yml`:
```yaml
name: Test and Deploy Nook to Janus

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    name: Lint, Test & Validate
    runs-on: self-hosted  # Janus self-hosted runner
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: "npm"

      - name: Install Dependencies
        run: npm ci

      - name: Run Unit & Integration Tests
        run: npm run test

      - name: Build & Run Docker Containers for Smoke Test
        run: |
          docker compose -f docker-compose.yml up -d --build
          timeout 30 sh -c 'until curl -sf http://localhost:8000/healthz; do sleep 1; done'

      - name: Lint OpenAPI Schema with Spectral
        run: |
          npm install -g @stoplight/spectral-cli
          curl -sf http://localhost:8000/openapi.json -o openapi.json
          spectral lint openapi.json

      - name: Run Bruno Smoke Tests
        run: |
          npm install -g @usebruno/cli
          bru run bruno --env Local --bail

      - name: Clean Up Test Containers
        if: always()
        run: docker compose down -v

  deploy:
    name: Trigger Coolify Deployment
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: self-hosted
    steps:
      - name: Trigger Coolify Webhook
        env:
          COOLIFY_HOST: ${{ secrets.COOLIFY_HOST }}
          COOLIFY_UUID: ${{ secrets.COOLIFY_UUID }}
          COOLIFY_TOKEN: ${{ secrets.COOLIFY_TOKEN }}
        run: |
          echo "🚀 Quality gates passed. Triggering deployment on Janus..."
          curl -s -f -X POST \
            -H "Authorization: Bearer ${COOLIFY_TOKEN}" \
            -H "Content-Type: application/json" \
            "${COOLIFY_HOST}/api/v1/deploy?uuid=${COOLIFY_UUID}&force=false"
```

---

## 📋 Task 8.4: Coolify Service Registration

1. In Coolify (`http://192.168.1.68:8000`), click **+ New Resource > Docker Compose > GitHub Repo**.
2. Set Domain: `https://nook.janus-lab.duckdns.org`.
3. In Coolify environment variables, configure:
   ```env
   DATABASE_URL=postgresql://nook_user:NookSecretPass2026@postgres:5432/nook_db
   REDIS_URL=redis://:SharedRedisPassword@redis:6379/3
   S3_ENDPOINT=http://minio:9000
   S3_PUBLIC_ENDPOINT=https://s3.janus-lab.duckdns.org
   S3_BUCKET=nook-media
   S3_ACCESS_KEY=YourMinioKey
   S3_SECRET_KEY=YourMinioSecret
   SENTRY_DSN=http://...nook@glitchtip-web:8000/1
   ```
4. Push to `main` to trigger the automated build and live deployment.

---

## ✅ Acceptance Criteria & Verification

1. Traefik automatically provisions SSL for `https://nook.janus-lab.duckdns.org`.
2. Inspect `GET https://nook.janus-lab.duckdns.org/readyz`: Returns `HTTP 200 OK` with database, redis, and storage dependencies connected.
3. Configure **Uptime Kuma** (`https://status.janus-lab.duckdns.org`) to ping `https://nook.janus-lab.duckdns.org/readyz` every 60 seconds.
4. Total RAM consumed on Janus server: **< 100 MB** for both API and Web containers combined!
