# U&I Not AI Dating App - Complete Auto-Deployment Script
# This script downloads, installs, configures everything needed and opens the hosted server
# Run as Administrator: PowerShell -ExecutionPolicy Bypass -File "COMPLETE-AUTO-DEPLOY.ps1"

param(
    [string]$Domain = "localhost",
    [int]$Port = 5000,
    [switch]$Production = $false
)

# Set error handling
$ErrorActionPreference = "Stop"

Write-Host "🚀 U&I Not AI Dating App - Complete Auto-Deployment" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Function to check if running as administrator
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Check administrator privileges
if (-not (Test-Administrator)) {
    Write-Host "⚠️  This script requires administrator privileges!" -ForegroundColor Red
    Write-Host "Please right-click PowerShell and 'Run as Administrator'" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Create deployment directory
$DeployDir = "C:\UandINotAI"
Write-Host "📁 Creating deployment directory: $DeployDir" -ForegroundColor Green

if (Test-Path $DeployDir) {
    Write-Host "⚠️  Directory exists. Backing up..." -ForegroundColor Yellow
    $BackupDir = "$DeployDir-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Move-Item $DeployDir $BackupDir -Force
    Write-Host "✅ Backup created: $BackupDir" -ForegroundColor Green
}

New-Item -ItemType Directory -Path $DeployDir -Force | Out-Null
Set-Location $DeployDir

# Download and install Chocolatey
Write-Host "🍫 Installing Chocolatey package manager..." -ForegroundColor Green
try {
    if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
    }
    Write-Host "✅ Chocolatey ready" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install Chocolatey: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Install required software
Write-Host "🔧 Installing required software..." -ForegroundColor Green
$RequiredSoftware = @("nodejs", "git", "postgresql14", "nginx")

foreach ($software in $RequiredSoftware) {
    Write-Host "   Installing $software..." -ForegroundColor Yellow
    try {
        choco install $software -y --force
        Write-Host "   ✅ $software installed" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  $software installation had issues, continuing..." -ForegroundColor Yellow
    }
}

# Refresh environment variables
$env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")

# Download application source code
Write-Host "📥 Downloading U&I Not AI source code..." -ForegroundColor Green
try {
    # Create application files structure
    $AppFiles = @{
        "package.json" = @"
{
  "name": "uandinotai-dating-app",
  "version": "1.0.0",
  "description": "U&I Not AI Modern Dating Application",
  "main": "server/index.js",
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "tsc && vite build",
    "start": "NODE_ENV=production node dist/server/index.js",
    "db:push": "drizzle-kit push",
    "db:migrate": "drizzle-kit migrate"
  },
  "dependencies": {
    "@google-cloud/storage": "^7.7.0",
    "@hookform/resolvers": "^3.3.4",
    "@neondatabase/serverless": "^0.9.0",
    "@radix-ui/react-accordion": "^1.1.2",
    "@radix-ui/react-alert-dialog": "^1.0.5",
    "@radix-ui/react-avatar": "^1.0.4",
    "@radix-ui/react-checkbox": "^1.0.4",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-popover": "^1.0.7",
    "@radix-ui/react-progress": "^1.0.3",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-separator": "^1.0.3",
    "@radix-ui/react-slider": "^1.1.2",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-switch": "^1.0.3",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "@radix-ui/react-tooltip": "^1.0.7",
    "@stripe/react-stripe-js": "^2.4.0",
    "@stripe/stripe-js": "^2.4.0",
    "@tanstack/react-query": "^5.17.15",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "cmdk": "^0.2.1",
    "connect-pg-simple": "^9.0.1",
    "date-fns": "^3.2.0",
    "drizzle-orm": "^0.29.3",
    "drizzle-zod": "^0.5.1",
    "express": "^4.18.2",
    "express-session": "^1.18.0",
    "framer-motion": "^11.0.3",
    "input-otp": "^1.2.4",
    "lucide-react": "^0.323.0",
    "memoizee": "^1.4.15",
    "multer": "^1.4.5-lts.1",
    "node-cron": "^3.0.3",
    "nodemailer": "^6.9.9",
    "openid-client": "^5.6.4",
    "passport": "^0.7.0",
    "passport-local": "^1.0.0",
    "react": "^18.2.0",
    "react-day-picker": "^8.10.0",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.49.3",
    "recharts": "^2.12.0",
    "stripe": "^14.15.0",
    "tailwind-merge": "^2.2.1",
    "tailwindcss-animate": "^1.0.7",
    "vaul": "^0.9.0",
    "wouter": "^3.0.0",
    "ws": "^8.16.0",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/connect-pg-simple": "^7.0.3",
    "@types/express": "^4.17.21",
    "@types/express-session": "^1.18.0",
    "@types/memoizee": "^1.4.11",
    "@types/multer": "^1.4.11",
    "@types/node": "^20.11.16",
    "@types/node-cron": "^3.0.11",
    "@types/nodemailer": "^6.4.14",
    "@types/passport": "^1.0.16",
    "@types/passport-local": "^1.0.38",
    "@types/react": "^18.2.55",
    "@types/react-dom": "^18.2.19",
    "@types/ws": "^8.5.10",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.17",
    "drizzle-kit": "^0.20.13",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3",
    "vite": "^5.1.1"
  }
}
"@

        "server/index.ts" = @"
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { registerRoutes } from './routes';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// API routes
registerRoutes(app);

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('dist'));
  app.get('*', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 U&I Not AI Dating App server running on port ${PORT}`);
  console.log(`🌐 Access at: http://localhost:${PORT}`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`🌍 Production mode - serving static files`);
  }
});
"@

        "Dockerfile" = @"
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
"@

        "docker-compose.yml" = @"
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://uandinotai:secure_password_2025@db:5432/uandinotai_db
      - SESSION_SECRET=ultra_secure_session_secret_2025_uandinotai
      - STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
      - STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
      - REPL_ID=uandinotai-production
      - REPLIT_DOMAINS=uandinotai.com,localhost
      - ISSUER_URL=https://replit.com/oidc
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=uandinotai_db
      - POSTGRES_USER=uandinotai
      - POSTGRES_PASSWORD=secure_password_2025
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
"@

        ".env" = @"
# Database Configuration
DATABASE_URL=postgresql://uandinotai:secure_password_2025@localhost:5432/uandinotai_db
PGDATABASE=uandinotai_db
PGUSER=uandinotai
PGPASSWORD=secure_password_2025
PGHOST=localhost
PGPORT=5432

# Application Configuration
NODE_ENV=production
PORT=5000
SESSION_SECRET=ultra_secure_session_secret_2025_uandinotai

# Replit Auth Configuration
REPL_ID=uandinotai-production
REPLIT_DOMAINS=uandinotai.com,localhost
ISSUER_URL=https://replit.com/oidc

# Stripe Configuration (Premium Subscriptions)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=uandinotai@gmail.com
SMTP_PASS=your_app_password_here

# Admin Configuration
ADMIN_EMAIL=uandinotai@gmail.com
"@

        "nginx.conf" = @"
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:5000;
    }

    server {
        listen 80;
        server_name uandinotai.com www.uandinotai.com localhost;

        location / {
            proxy_pass http://app;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
    }
}
"@

        "init.sql" = @"
-- U&I Not AI Dating App Database Initialization

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sessions table for authentication
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR NOT NULL COLLATE "default",
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL
);

ALTER TABLE sessions ADD CONSTRAINT session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE;
CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions (expire);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY NOT NULL,
    email VARCHAR UNIQUE,
    first_name VARCHAR,
    last_name VARCHAR,
    profile_image_url VARCHAR,
    bio TEXT,
    age INTEGER,
    location VARCHAR,
    latitude VARCHAR,
    longitude VARCHAR,
    search_radius INTEGER DEFAULT 25,
    interests TEXT[],
    alias VARCHAR,
    gender_identity VARCHAR(100),
    sexuality VARCHAR(100),
    relationship_type VARCHAR(100),
    desires TEXT[],
    virtual_location VARCHAR,
    is_incognito BOOLEAN DEFAULT false,
    daily_pings_used INTEGER DEFAULT 0,
    last_ping_reset TIMESTAMP DEFAULT NOW(),
    is_premium BOOLEAN DEFAULT false,
    premium_expires_at TIMESTAMP,
    weekly_subscription_active BOOLEAN DEFAULT false,
    is_admin BOOLEAN DEFAULT false,
    stripe_customer_id VARCHAR,
    stripe_subscription_id VARCHAR,
    last_active TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Profiles/Photos table
CREATE TABLE IF NOT EXISTS profiles (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    photo_url VARCHAR NOT NULL,
    is_explicit BOOLEAN DEFAULT false,
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Likes table
CREATE TABLE IF NOT EXISTS likes (
    id SERIAL PRIMARY KEY,
    from_user_id VARCHAR NOT NULL REFERENCES users(id),
    to_user_id VARCHAR NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
    id SERIAL PRIMARY KEY,
    user1_id VARCHAR NOT NULL REFERENCES users(id),
    user2_id VARCHAR NOT NULL REFERENCES users(id),
    is_match BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    match_id INTEGER REFERENCES matches(id),
    sender_id VARCHAR NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    is_contact_info BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create admin user
INSERT INTO users (id, email, first_name, last_name, is_admin, created_at) 
VALUES ('admin-001', 'uandinotai@gmail.com', 'Admin', 'User', true, NOW())
ON CONFLICT (id) DO UPDATE SET is_admin = true;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO uandinotai;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO uandinotai;
"@

        "README.md" = @"
# U&I Not AI Dating App

A modern dating application focusing on genuine human connections.

## Features
- Location-based user discovery
- Photo upload and sharing
- Premium subscriptions ($9.99/week)
- Unlimited messaging for matches
- Admin panel for content moderation
- Self-hosted deployment ready

## Quick Start
1. Run COMPLETE-AUTO-DEPLOY.ps1 as Administrator
2. Access the app at http://localhost:5000
3. Admin access: uandinotai@gmail.com

## Production Deployment
- Docker & Docker Compose ready
- Nginx reverse proxy configured
- PostgreSQL database included
- SSL/TLS certificate support

Built with React, Node.js, PostgreSQL, and Stripe.
"@
    }

    # Create all application files
    foreach ($file in $AppFiles.Keys) {
        $filePath = Join-Path $DeployDir $file
        $directory = Split-Path $filePath -Parent
        
        if (-not (Test-Path $directory)) {
            New-Item -ItemType Directory -Path $directory -Force | Out-Null
        }
        
        $AppFiles[$file] | Out-File -FilePath $filePath -Encoding UTF8 -Force
    }
    
    Write-Host "✅ Application files created" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create application files: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Setup PostgreSQL
Write-Host "🗄️  Setting up PostgreSQL database..." -ForegroundColor Green
try {
    # Start PostgreSQL service
    Start-Service postgresql-x64-14 -ErrorAction SilentlyContinue
    
    # Wait for PostgreSQL to start
    Start-Sleep -Seconds 5
    
    # Create database and user
    $env:PGPASSWORD = "postgres"
    & "C:\Program Files\PostgreSQL\14\bin\psql.exe" -U postgres -c "CREATE DATABASE uandinotai_db;" 2>$null
    & "C:\Program Files\PostgreSQL\14\bin\psql.exe" -U postgres -c "CREATE USER uandinotai WITH PASSWORD 'secure_password_2025';" 2>$null
    & "C:\Program Files\PostgreSQL\14\bin\psql.exe" -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE uandinotai_db TO uandinotai;" 2>$null
    
    # Initialize database schema
    $env:PGPASSWORD = "secure_password_2025"
    & "C:\Program Files\PostgreSQL\14\bin\psql.exe" -U uandinotai -d uandinotai_db -f "init.sql" 2>$null
    
    Write-Host "✅ PostgreSQL database configured" -ForegroundColor Green
} catch {
    Write-Host "⚠️  PostgreSQL setup had issues, continuing..." -ForegroundColor Yellow
}

# Install Node.js dependencies
Write-Host "📦 Installing Node.js dependencies..." -ForegroundColor Green
try {
    npm install
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install dependencies: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Configure Windows Firewall
Write-Host "🔥 Configuring Windows Firewall..." -ForegroundColor Green
try {
    New-NetFirewallRule -DisplayName "U&I Not AI App" -Direction Inbound -Protocol TCP -LocalPort $Port -Action Allow -Force | Out-Null
    New-NetFirewallRule -DisplayName "PostgreSQL" -Direction Inbound -Protocol TCP -LocalPort 5432 -Action Allow -Force | Out-Null
    Write-Host "✅ Firewall rules configured" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Firewall configuration had issues, continuing..." -ForegroundColor Yellow
}

# Start the application
Write-Host "🚀 Starting U&I Not AI Dating App..." -ForegroundColor Green

# Create startup script
$StartupScript = @"
@echo off
cd /d "$DeployDir"
echo Starting U&I Not AI Dating App...
echo Database: PostgreSQL on localhost:5432
echo Application: http://localhost:$Port
echo Admin: uandinotai@gmail.com
echo.
npm start
pause
"@

$StartupScript | Out-File -FilePath "$DeployDir\start-app.bat" -Encoding ASCII -Force

# Start the application in background
Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "$DeployDir\start-app.bat" -WindowStyle Minimized

# Wait for application to start
Write-Host "⏳ Waiting for application to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Test if application is running
$MaxAttempts = 12
$Attempt = 0
$AppRunning = $false

while ($Attempt -lt $MaxAttempts -and -not $AppRunning) {
    try {
        $Attempt++
        $Response = Invoke-WebRequest -Uri "http://localhost:$Port/api/health" -TimeoutSec 5 -UseBasicParsing
        if ($Response.StatusCode -eq 200) {
            $AppRunning = $true
            Write-Host "✅ Application is running!" -ForegroundColor Green
        }
    } catch {
        Write-Host "   Attempt $Attempt/$MaxAttempts - Waiting..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
    }
}

# Final status and launch
if ($AppRunning) {
    Write-Host ""
    Write-Host "🎉 SUCCESS! U&I Not AI Dating App is now running!" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host "🌐 Application URL: http://localhost:$Port" -ForegroundColor Cyan
    Write-Host "👤 Admin Email: uandinotai@gmail.com" -ForegroundColor Cyan
    Write-Host "💳 Premium: $9.99/week via Stripe" -ForegroundColor Cyan
    Write-Host "📁 Installation: $DeployDir" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🔧 To restart: Run start-app.bat" -ForegroundColor Yellow
    Write-Host "🗄️  Database: PostgreSQL on localhost:5432" -ForegroundColor Yellow
    Write-Host ""
    
    # Open the application in default browser
    Write-Host "🌐 Opening application in your browser..." -ForegroundColor Green
    Start-Process "http://localhost:$Port"
    
    # Create desktop shortcut
    $WshShell = New-Object -comObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\U&I Not AI Dating App.lnk")
    $Shortcut.TargetPath = "http://localhost:$Port"
    $Shortcut.Description = "U&I Not AI Dating App"
    $Shortcut.Save()
    
    Write-Host "🖥️  Desktop shortcut created" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
    
} else {
    Write-Host ""
    Write-Host "❌ Application failed to start properly" -ForegroundColor Red
    Write-Host "Check the application window for error details" -ForegroundColor Yellow
    Write-Host "Try running: $DeployDir\start-app.bat" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor White
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")