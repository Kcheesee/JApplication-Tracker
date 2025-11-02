# Deployment Guide

This guide covers multiple deployment options from free to production-grade.

## Table of Contents

1. [Free Options (Best for MVP)](#free-options)
   - [Railway](#1-railway-easiest-recommended)
   - [Render](#2-render)
   - [Fly.io](#3-flyio)
2. [Cloud Platforms (Production)](#cloud-platforms)
   - [DigitalOcean App Platform](#digitalocean-app-platform)
   - [AWS (Advanced)](#aws-advanced)
   - [Google Cloud Run](#google-cloud-run)
3. [Self-Hosted](#self-hosted)
4. [Environment Variables](#environment-variables)

---

## Free Options

### 1. Railway (Easiest, Recommended ⭐)

**Pros**: Free $5/month credit, automatic HTTPS, easy GitHub integration
**Cons**: Credit runs out, need credit card for verification

#### Steps:

1. **Sign up at [Railway.app](https://railway.app)**
   - Use GitHub to sign up
   - Add credit card (required but won't be charged on free tier)

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Select your `job-application-tracker` repository

3. **Add Services**

   **PostgreSQL Database:**
   - Click "+ New"
   - Select "Database" → "PostgreSQL"
   - Railway will auto-provision

   **Redis:**
   - Click "+ New"
   - Select "Database" → "Redis"

   **Backend:**
   - Click "+ New"
   - Select "GitHub Repo" → your repository
   - Root directory: `/backend`
   - Build command: `pip install -r requirements.txt`
   - Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

   **Frontend:**
   - Click "+ New"
   - Select "GitHub Repo" → your repository
   - Root directory: `/frontend`
   - Build command: `npm install && npm run build`
   - Start command: `npm run preview -- --host 0.0.0.0 --port $PORT`

4. **Set Environment Variables**

   **Backend service:**
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   REDIS_URL=${{Redis.REDIS_URL}}
   FRONTEND_URL=https://your-frontend.railway.app
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   SECRET_KEY=your-secret-key-here-generate-random-string
   ```

   **Frontend service:**
   ```
   VITE_API_URL=https://your-backend.railway.app
   ```

5. **Generate Domain**
   - Go to each service → Settings → Generate Domain
   - Copy the URLs and update the environment variables above

6. **Deploy**
   - Railway auto-deploys on every git push!
   - Visit your frontend URL

**Estimated Cost**: $0 (with free credits) → $5-10/month after

---

### 2. Render

**Pros**: Generous free tier, automatic HTTPS
**Cons**: Free tier spins down after inactivity (slower first load)

#### Steps:

1. **Sign up at [Render.com](https://render.com)**

2. **Create PostgreSQL Database**
   - New → PostgreSQL
   - Name: `job-tracker-db`
   - Free tier
   - Copy the "Internal Database URL"

3. **Create Redis Instance**
   - New → Redis
   - Name: `job-tracker-redis`
   - Free tier
   - Copy the "Internal Redis URL"

4. **Deploy Backend**
   - New → Web Service
   - Connect your GitHub repository
   - Name: `job-tracker-backend`
   - Root Directory: `backend`
   - Runtime: Python 3
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Add environment variables (see below)
   - Free tier

5. **Deploy Frontend**
   - New → Web Service
   - Same repository
   - Name: `job-tracker-frontend`
   - Root Directory: `frontend`
   - Runtime: Node
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run preview -- --host 0.0.0.0 --port $PORT`
   - Add environment variable:
     - `VITE_API_URL`: https://job-tracker-backend.onrender.com
   - Free tier

**Estimated Cost**: $0 (free tier forever, with spin-down)

---

### 3. Fly.io

**Pros**: Generous free tier, fast edge network
**Cons**: Requires CLI, slightly more complex

#### Steps:

1. **Install Fly CLI**
   ```bash
   # macOS
   brew install flyctl

   # Or use curl
   curl -L https://fly.io/install.sh | sh
   ```

2. **Sign up and authenticate**
   ```bash
   flyctl auth signup  # or flyctl auth login
   ```

3. **Create PostgreSQL**
   ```bash
   flyctl postgres create --name job-tracker-db --region sjc
   ```

4. **Deploy Backend**
   ```bash
   cd backend
   flyctl launch --name job-tracker-backend
   # Follow prompts, select region close to you
   # Set secrets:
   flyctl secrets set DATABASE_URL=postgres://...
   flyctl secrets set GOOGLE_CLIENT_ID=your-id
   flyctl secrets set GOOGLE_CLIENT_SECRET=your-secret
   flyctl deploy
   ```

5. **Deploy Frontend**
   ```bash
   cd ../frontend
   flyctl launch --name job-tracker-frontend
   flyctl secrets set VITE_API_URL=https://job-tracker-backend.fly.dev
   flyctl deploy
   ```

**Estimated Cost**: $0 (free tier) → $5-10/month

---

## Cloud Platforms (Production)

### DigitalOcean App Platform

**Best for**: Production apps with predictable scaling
**Cost**: $12/month minimum

#### Steps:

1. **Create DigitalOcean Account**
   - Sign up at [DigitalOcean.com](https://digitalocean.com)
   - $200 free credit for 60 days with signup

2. **Create App**
   - Apps → Create App
   - Choose GitHub repository
   - Select branch: `main`

3. **Configure Components**

   **Database:**
   - Add Resource → Database → PostgreSQL
   - Choose plan: $15/month (or $7/month dev)

   **Backend:**
   - Detected automatically or add manually
   - Type: Web Service
   - Source Directory: `/backend`
   - Build Command: `pip install -r requirements.txt`
   - Run Command: `uvicorn app.main:app --host 0.0.0.0 --port 8080`
   - HTTP Port: 8080
   - Plan: Basic ($5/month)

   **Frontend:**
   - Type: Static Site
   - Source Directory: `/frontend`
   - Build Command: `npm install && npm run build`
   - Output Directory: `dist`
   - Plan: Free

4. **Environment Variables** (in App Platform dashboard)

5. **Deploy**
   - Click "Create Resources"
   - DigitalOcean builds and deploys

**Total Cost**: ~$22/month (production-ready)

---

### AWS (Advanced)

**Best for**: Enterprise scale, AWS experience required
**Cost**: Variable, can be optimized

#### Architecture:

- **ECS (Elastic Container Service)** - Docker containers
- **RDS PostgreSQL** - Managed database
- **ElastiCache Redis** - Managed Redis
- **CloudFront + S3** - Frontend hosting
- **Application Load Balancer** - Traffic routing

#### Quick Start:

```bash
# Use AWS Copilot CLI for easy deployment
brew install aws/tap/copilot-cli

# Initialize
copilot init --app job-tracker

# Deploy
copilot deploy
```

**Estimated Cost**: $30-100/month depending on traffic

---

### Google Cloud Run

**Best for**: Serverless, pay-per-use
**Cost**: Free tier → $5-20/month

#### Steps:

1. **Install Google Cloud SDK**
   ```bash
   brew install --cask google-cloud-sdk
   gcloud init
   ```

2. **Build and Push Docker Images**
   ```bash
   cd backend
   gcloud builds submit --tag gcr.io/YOUR_PROJECT/job-tracker-backend

   cd ../frontend
   gcloud builds submit --tag gcr.io/YOUR_PROJECT/job-tracker-frontend
   ```

3. **Deploy to Cloud Run**
   ```bash
   # Backend
   gcloud run deploy job-tracker-backend \
     --image gcr.io/YOUR_PROJECT/job-tracker-backend \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated

   # Frontend
   gcloud run deploy job-tracker-frontend \
     --image gcr.io/YOUR_PROJECT/job-tracker-frontend \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

4. **Create Cloud SQL PostgreSQL**
   ```bash
   gcloud sql instances create job-tracker-db \
     --database-version=POSTGRES_15 \
     --tier=db-f1-micro \
     --region=us-central1
   ```

**Estimated Cost**: Free tier → $10-30/month

---

## Self-Hosted

### VPS (DigitalOcean, Linode, Vultr)

**Best for**: Full control, tech-savvy users
**Cost**: $6-12/month

#### Steps:

1. **Create Droplet/VPS**
   - Ubuntu 22.04 LTS
   - 2GB RAM minimum
   - $12/month recommended

2. **SSH into server**
   ```bash
   ssh root@your-server-ip
   ```

3. **Install Docker**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   ```

4. **Clone Repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/job-application-tracker.git
   cd job-application-tracker
   ```

5. **Create Production docker-compose**
   ```bash
   cp docker-compose.yml docker-compose.prod.yml
   # Edit docker-compose.prod.yml (see below)
   ```

6. **Set Environment Variables**
   ```bash
   nano .env
   # Add all environment variables
   ```

7. **Deploy**
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```

8. **Set up Nginx Reverse Proxy**
   ```bash
   apt install nginx certbot python3-certbot-nginx

   # Configure Nginx (see nginx.conf below)
   nano /etc/nginx/sites-available/job-tracker

   # Enable SSL with Let's Encrypt
   certbot --nginx -d yourdomain.com
   ```

9. **Point Domain**
   - Add A record: yourdomain.com → your-server-ip
   - Wait for DNS propagation (5-30 minutes)

---

## Configuration Files

### docker-compose.prod.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: always
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      REDIS_URL: redis://default:${REDIS_PASSWORD}@redis:6379
      FRONTEND_URL: ${FRONTEND_URL}
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET}
      SECRET_KEY: ${SECRET_KEY}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    ports:
      - "8000:8000"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
      args:
        VITE_API_URL: ${VITE_API_URL}
    restart: always
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
    }
}
```

### Frontend Production Dockerfile

```dockerfile
# frontend/Dockerfile.prod
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## Environment Variables

### Required Variables

```bash
# Database
POSTGRES_DB=jobtracker
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-secure-password-here

# Redis
REDIS_PASSWORD=your-redis-password-here

# Backend
DATABASE_URL=postgresql://postgres:password@postgres:5432/jobtracker
REDIS_URL=redis://default:password@redis:6379
FRONTEND_URL=https://yourdomain.com
SECRET_KEY=generate-random-string-here-use-openssl-rand-hex-32
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret

# Frontend
VITE_API_URL=https://yourdomain.com/api
```

### Generate Secure Secrets

```bash
# Generate SECRET_KEY
openssl rand -hex 32

# Generate passwords
openssl rand -base64 32
```

---

## Recommendations

### For Getting Started (MVP):
**→ Railway** - Easiest, fastest, free credits

### For Low-Cost Production:
**→ Render** - Reliable, $0 with spin-down or $7/month always-on

### For Serious Production:
**→ DigitalOcean App Platform** - $22/month, reliable, scalable

### For Enterprise:
**→ AWS ECS** - Most scalable, requires DevOps knowledge

### For Full Control:
**→ Self-Hosted VPS** - $12/month, complete control

---

## Next Steps After Deployment

1. **Update OAuth Redirect URIs**
   - Google Cloud Console → Credentials
   - Add your production URL to authorized redirect URIs

2. **Set Up Monitoring**
   - Use platform-provided monitoring
   - Or integrate Sentry for error tracking

3. **Configure Backups**
   - Most platforms have automatic database backups
   - Set up daily backups for peace of mind

4. **Add Custom Domain** (optional)
   - Purchase domain from Namecheap, Google Domains
   - Point DNS to your deployment
   - Most platforms handle SSL automatically

5. **Test Everything**
   - Create test job applications
   - Test Gmail sync
   - Test browser extension (update URLs)
   - Test all features

---

**Questions? Check the [CONTRIBUTING.md](CONTRIBUTING.md:1) or open an issue on GitHub!**
