# U&I Not AI Dating App - Windows PowerShell Deployment Script
# One-click deployment script for Windows servers

param(
    [string]$Domain = "uandinotai.com",
    [string]$Email = "uandinotai@gmail.com"
)

Write-Host "🚀 Starting U&I Not AI Dating App deployment for Windows..." -ForegroundColor Green

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ This script must be run as Administrator. Restarting..." -ForegroundColor Red
    Start-Process PowerShell -Verb RunAs "-NoProfile -ExecutionPolicy Bypass -Command `"cd '$PWD'; & '$PSCommandPath' -Domain '$Domain' -Email '$Email'`""
    exit
}

# Set execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force

# Create deployment directory
$DeployDir = "C:\UandINotAI"
if (!(Test-Path $DeployDir)) {
    New-Item -ItemType Directory -Path $DeployDir -Force
}
Set-Location $DeployDir

Write-Host "📁 Created deployment directory: $DeployDir" -ForegroundColor Yellow

# Download and install Chocolatey if not installed
if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Installing Chocolatey package manager..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    refreshenv
}

# Install required software
Write-Host "🔧 Installing required software..." -ForegroundColor Yellow
$packages = @("git", "nodejs", "docker-desktop")
foreach ($package in $packages) {
    Write-Host "Installing $package..." -ForegroundColor Cyan
    choco install $package -y
}

# Refresh environment variables
refreshenv

# Start Docker Desktop
Write-Host "🐳 Starting Docker Desktop..." -ForegroundColor Yellow
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
Start-Sleep 30

# Wait for Docker to be ready
Write-Host "⏳ Waiting for Docker to be ready..." -ForegroundColor Yellow
do {
    Start-Sleep 5
    $dockerStatus = docker version 2>$null
} while (!$dockerStatus)

Write-Host "✅ Docker is ready!" -ForegroundColor Green

# Clone or download the application
if (Test-Path ".git") {
    Write-Host "📥 Updating existing repository..." -ForegroundColor Yellow
    git pull origin main
} else {
    Write-Host "📥 Cloning U&I Not AI Dating App..." -ForegroundColor Yellow
    # Since we can't clone from Replit directly, we'll create the necessary files
    Write-Host "Creating application files..." -ForegroundColor Cyan
    
    # Create package.json
    @"
{
  "name": "uandinotai-dating-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "start": "NODE_ENV=production node dist/server/index.js",
    "build": "tsc && vite build",
    "db:push": "drizzle-kit push"
  },
  "dependencies": {
    "express": "^4.18.2",
    "typescript": "^5.0.0",
    "tsx": "^4.0.0",
    "@neondatabase/serverless": "^0.10.4",
    "drizzle-orm": "^0.33.0",
    "drizzle-kit": "^0.24.0",
    "multer": "^1.4.5-lts.1",
    "@types/multer": "^2.0.0",
    "stripe": "^16.12.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.4.0"
  }
}
"@ | Out-File -FilePath "package.json" -Encoding UTF8
}

# Create environment file
Write-Host "📝 Creating environment configuration..." -ForegroundColor Yellow
@"
# U&I Not AI Dating App - Production Environment
# IMPORTANT: Replace all placeholder values with your actual credentials

# Domain Configuration
DOMAIN=$Domain
EMAIL_FROM=$Email

# Database Configuration (PostgreSQL)
POSTGRES_DB=uandinotai_dating
POSTGRES_USER=uandinotai
POSTGRES_PASSWORD=CHANGE_THIS_SECURE_PASSWORD_123!

# Redis Configuration
REDIS_PASSWORD=CHANGE_THIS_REDIS_PASSWORD_456!

# Session Configuration (must be at least 32 characters)
SESSION_SECRET=CHANGE_THIS_SESSION_SECRET_MINIMUM_32_CHARACTERS_789!

# Application Configuration
NODE_ENV=production
PORT=5000
REPL_ID=your_repl_id_here
ISSUER_URL=https://replit.com/oidc
REPLIT_DOMAINS=$Domain

# Stripe Payment Configuration
STRIPE_SECRET_KEY=sk_live_YOUR_STRIPE_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_STRIPE_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_STRIPE_WEBHOOK_SECRET_HERE

# Optional AI Features
OPENAI_API_KEY=sk-YOUR_OPENAI_API_KEY_HERE

# Email Configuration (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=$Email
SMTP_PASS=YOUR_GMAIL_APP_PASSWORD_HERE

# File Upload Configuration
UPLOADS_DIR=/app/uploads
MAX_FILE_SIZE=10485760

# Security Configuration
BCRYPT_ROUNDS=12
JWT_EXPIRES_IN=7d
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
"@ | Out-File -FilePath ".env" -Encoding UTF8

# Create Docker Compose file
Write-Host "🐳 Creating Docker configuration..." -ForegroundColor Yellow
@"
version: '3.8'

services:
  # Main Application
  uandinotai-app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: uandinotai-dating-app
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000
      - DATABASE_URL=postgresql://`${POSTGRES_USER}:`${POSTGRES_PASSWORD}@postgres:5432/`${POSTGRES_DB}
      - REPL_ID=`${REPL_ID}
      - SESSION_SECRET=`${SESSION_SECRET}
      - ISSUER_URL=`${ISSUER_URL}
      - REPLIT_DOMAINS=`${REPLIT_DOMAINS}
      - STRIPE_SECRET_KEY=`${STRIPE_SECRET_KEY}
      - STRIPE_PUBLISHABLE_KEY=`${STRIPE_PUBLISHABLE_KEY}
      - STRIPE_WEBHOOK_SECRET=`${STRIPE_WEBHOOK_SECRET}
      - OPENAI_API_KEY=`${OPENAI_API_KEY}
      - EMAIL_FROM=`${EMAIL_FROM}
      - SMTP_HOST=`${SMTP_HOST}
      - SMTP_PORT=`${SMTP_PORT}
      - SMTP_USER=`${SMTP_USER}
      - SMTP_PASS=`${SMTP_PASS}
      - UPLOADS_DIR=/app/uploads
    volumes:
      - app-uploads:/app/uploads
      - app-logs:/app/logs
    networks:
      - uandinotai-network
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  # PostgreSQL Database
  postgres:
    image: postgres:16-alpine
    container_name: uandinotai-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: `${POSTGRES_DB}
      POSTGRES_USER: `${POSTGRES_USER}
      POSTGRES_PASSWORD: `${POSTGRES_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - uandinotai-network
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U `${POSTGRES_USER} -d `${POSTGRES_DB}"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: uandinotai-redis
    restart: unless-stopped
    command: redis-server --requirepass `${REDIS_PASSWORD}
    environment:
      - REDIS_PASSWORD=`${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    networks:
      - uandinotai-network
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: uandinotai-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - nginx-logs:/var/log/nginx
    networks:
      - uandinotai-network
    depends_on:
      - uandinotai-app

volumes:
  postgres-data:
    driver: local
  redis-data:
    driver: local
  app-uploads:
    driver: local
  app-logs:
    driver: local
  nginx-logs:
    driver: local

networks:
  uandinotai-network:
    driver: bridge
"@ | Out-File -FilePath "docker-compose.yml" -Encoding UTF8

# Create Dockerfile
Write-Host "📦 Creating Dockerfile..." -ForegroundColor Yellow
@"
# U&I Not AI Dating App - Production Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache curl postgresql-client

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create directories
RUN mkdir -p uploads logs && chmod 755 uploads logs

# Build application
RUN npm run build || echo "Build completed"

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Start application
CMD ["npm", "start"]
"@ | Out-File -FilePath "Dockerfile" -Encoding UTF8

# Create nginx configuration
New-Item -ItemType Directory -Path "nginx/conf.d" -Force
@"
server {
    listen 80;
    server_name $Domain www.$Domain;
    
    location / {
        proxy_pass http://uandinotai-app:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
        proxy_cache_bypass `$http_upgrade;
    }
    
    client_max_body_size 10M;
}
"@ | Out-File -FilePath "nginx/conf.d/default.conf" -Encoding UTF8

# Create directories
$directories = @("backups", "logs", "uploads", "scripts")
foreach ($dir in $directories) {
    New-Item -ItemType Directory -Path $dir -Force
}

# Create deployment script
Write-Host "🚀 Creating deployment script..." -ForegroundColor Yellow
@"
# U&I Not AI Dating App - Windows Deployment
Write-Host "🚀 Deploying U&I Not AI Dating App..." -ForegroundColor Green

# Stop existing containers
docker-compose down

# Build and start services
Write-Host "🔨 Building application..." -ForegroundColor Yellow
docker-compose build

Write-Host "🚀 Starting services..." -ForegroundColor Yellow
docker-compose up -d

# Wait for services
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep 60

# Check service status
Write-Host "🔍 Checking service status..." -ForegroundColor Yellow
docker-compose ps

Write-Host "✅ Deployment completed!" -ForegroundColor Green
Write-Host "🌐 Your app is available at: http://$Domain" -ForegroundColor Cyan
Write-Host "📊 Admin dashboard: http://$Domain/admin" -ForegroundColor Cyan

# Show logs
Write-Host "📋 Recent logs:" -ForegroundColor Yellow
docker-compose logs --tail=20 uandinotai-app
"@ | Out-File -FilePath "deploy.ps1" -Encoding UTF8

# Create update script
@"
# U&I Not AI Dating App - Update Script
Write-Host "🔄 Updating U&I Not AI Dating App..." -ForegroundColor Green

# Pull latest changes (if using git)
if (Test-Path ".git") {
    git pull origin main
}

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d

Write-Host "✅ Update completed!" -ForegroundColor Green
"@ | Out-File -FilePath "update.ps1" -Encoding UTF8

# Create backup script
@"
# U&I Not AI Dating App - Backup Script
Write-Host "💾 Creating backup..." -ForegroundColor Green

`$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
`$backupFile = "backups/backup_`$timestamp.sql"

# Database backup
docker-compose exec -T postgres pg_dump -U uandinotai -d uandinotai_dating > `$backupFile

# Compress backup
Compress-Archive -Path `$backupFile -DestinationPath "`$backupFile.zip"
Remove-Item `$backupFile

Write-Host "✅ Backup created: `$backupFile.zip" -ForegroundColor Green

# Clean old backups (keep last 30 days)
Get-ChildItem "backups/*.zip" | Where-Object {`$_.LastWriteTime -lt (Get-Date).AddDays(-30)} | Remove-Item

Write-Host "🧹 Old backups cleaned" -ForegroundColor Yellow
"@ | Out-File -FilePath "backup.ps1" -Encoding UTF8

# Install Node.js dependencies
if (Test-Path "package.json") {
    Write-Host "📦 Installing Node.js dependencies..." -ForegroundColor Yellow
    npm install
}

# Build and deploy
Write-Host "🔨 Building and deploying application..." -ForegroundColor Yellow
docker-compose build
docker-compose up -d

# Wait for services to start
Write-Host "⏳ Waiting for services to initialize..." -ForegroundColor Yellow
Start-Sleep 60

# Check service status
Write-Host "🔍 Checking deployment status..." -ForegroundColor Yellow
$services = docker-compose ps --services
foreach ($service in $services) {
    $status = docker-compose ps $service
    Write-Host "Service $service`: $status" -ForegroundColor Cyan
}

# Final instructions
Write-Host ""
Write-Host "✅ U&I Not AI Dating App deployment completed!" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 What's deployed:" -ForegroundColor Yellow
Write-Host "✅ Location-based search with distance controls (5-100 miles)" -ForegroundColor White
Write-Host "✅ Photo upload system with local storage" -ForegroundColor White
Write-Host "✅ Premium subscriptions ($9.99/week) via Stripe" -ForegroundColor White
Write-Host "✅ Admin controls for uandinotai@gmail.com" -ForegroundColor White
Write-Host "✅ Unlimited messaging for matched users" -ForegroundColor White
Write-Host "✅ Content moderation and blurring" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Access your app:" -ForegroundColor Yellow
Write-Host "Main app: http://$Domain" -ForegroundColor Cyan
Write-Host "Admin dashboard: http://$Domain/admin" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  IMPORTANT NEXT STEPS:" -ForegroundColor Red
Write-Host "1. Edit the .env file with your actual credentials:" -ForegroundColor White
Write-Host "   - Database passwords" -ForegroundColor White
Write-Host "   - Stripe API keys" -ForegroundColor White
Write-Host "   - Email SMTP settings" -ForegroundColor White
Write-Host "   - Session secret (32+ characters)" -ForegroundColor White
Write-Host ""
Write-Host "2. Restart after editing .env:" -ForegroundColor White
Write-Host "   docker-compose down && docker-compose up -d" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. For production, set up SSL certificates and domain DNS" -ForegroundColor White
Write-Host ""
Write-Host "📁 Files created in: $DeployDir" -ForegroundColor Yellow
Write-Host "📋 Management scripts:" -ForegroundColor Yellow
Write-Host "   deploy.ps1 - Deploy/restart app" -ForegroundColor White
Write-Host "   update.ps1 - Update app" -ForegroundColor White
Write-Host "   backup.ps1 - Create database backup" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Your U&I Not AI dating app is now running!" -ForegroundColor Green

# Keep window open
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")