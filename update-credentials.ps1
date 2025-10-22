# U&I Not AI Dating App - Credential Update & Restart Script
# Automatically updates .env file with Stripe credentials and restarts Docker services

param(
    [string]$StripeSecretKey = "$env:STRIPE_SECRET_KEY",
    [string]$StripePublishableKey = "",
    [string]$StripeWebhookSecret = "",
    [string]$DatabasePassword = "",
    [string]$RedisPassword = "",
    [string]$SessionSecret = "",
    [string]$DeployPath = "C:\UandINotAI"
)

Write-Host "🔧 Updating U&I Not AI Dating App credentials..." -ForegroundColor Green

# Check if deployment directory exists
if (!(Test-Path $DeployPath)) {
    Write-Host "❌ Deployment directory not found: $DeployPath" -ForegroundColor Red
    Write-Host "Please run the main deployment script first." -ForegroundColor Yellow
    exit 1
}

Set-Location $DeployPath

# Check if .env file exists
if (!(Test-Path ".env")) {
    Write-Host "❌ .env file not found in $DeployPath" -ForegroundColor Red
    exit 1
}

# Generate secure passwords if not provided
if (!$DatabasePassword) {
    $DatabasePassword = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 16 | ForEach-Object {[char]$_}) + "Db2024!"
}

if (!$RedisPassword) {
    $RedisPassword = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 16 | ForEach-Object {[char]$_}) + "Redis2024!"
}

if (!$SessionSecret) {
    $SessionSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
}

Write-Host "📝 Updating environment configuration..." -ForegroundColor Yellow

# Read current .env file
$envContent = Get-Content ".env" -Raw

# Update credentials in .env content
$updates = @{
    "POSTGRES_PASSWORD=CHANGE_THIS_SECURE_PASSWORD_123!" = "POSTGRES_PASSWORD=$DatabasePassword"
    "REDIS_PASSWORD=CHANGE_THIS_REDIS_PASSWORD_456!" = "REDIS_PASSWORD=$RedisPassword"
    "SESSION_SECRET=CHANGE_THIS_SESSION_SECRET_MINIMUM_32_CHARACTERS_789!" = "SESSION_SECRET=$SessionSecret"
}

# Add Stripe credentials if provided
if ($StripeSecretKey) {
    $updates["STRIPE_SECRET_KEY=sk_live_YOUR_STRIPE_SECRET_KEY_HERE"] = "STRIPE_SECRET_KEY=$StripeSecretKey"
    Write-Host "✅ Updated Stripe Secret Key" -ForegroundColor Green
}

if ($StripePublishableKey) {
    $updates["STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_STRIPE_PUBLISHABLE_KEY_HERE"] = "STRIPE_PUBLISHABLE_KEY=$StripePublishableKey"
    Write-Host "✅ Updated Stripe Publishable Key" -ForegroundColor Green
}

if ($StripeWebhookSecret) {
    $updates["STRIPE_WEBHOOK_SECRET=whsec_YOUR_STRIPE_WEBHOOK_SECRET_HERE"] = "STRIPE_WEBHOOK_SECRET=$StripeWebhookSecret"
    Write-Host "✅ Updated Stripe Webhook Secret" -ForegroundColor Green
}

# Apply all updates
foreach ($update in $updates.GetEnumerator()) {
    $envContent = $envContent -replace [regex]::Escape($update.Key), $update.Value
}

# Write updated content back to .env file
$envContent | Out-File -FilePath ".env" -Encoding UTF8 -NoNewline

Write-Host "✅ Environment configuration updated" -ForegroundColor Green

# Create backup of current deployment
Write-Host "💾 Creating backup before restart..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
if (!(Test-Path "backups")) {
    New-Item -ItemType Directory -Path "backups" -Force
}

# Backup current .env
Copy-Item ".env" "backups/.env.backup.$timestamp"

# Stop current Docker services
Write-Host "🛑 Stopping current services..." -ForegroundColor Yellow
docker-compose down

# Pull latest images if needed
Write-Host "📥 Pulling latest Docker images..." -ForegroundColor Yellow
docker-compose pull

# Rebuild application with new credentials
Write-Host "🔨 Rebuilding application with new credentials..." -ForegroundColor Yellow
docker-compose build --no-cache

# Start services with new configuration
Write-Host "🚀 Starting services with updated configuration..." -ForegroundColor Yellow
docker-compose up -d

# Wait for services to initialize
Write-Host "⏳ Waiting for services to initialize..." -ForegroundColor Yellow
Start-Sleep 45

# Health check
Write-Host "🔍 Performing health checks..." -ForegroundColor Yellow

# Check if containers are running
$containers = docker-compose ps --services
$healthyServices = 0
$totalServices = 0

foreach ($service in $containers) {
    $totalServices++
    $status = docker-compose ps $service --format "{{.State}}"
    if ($status -eq "running") {
        Write-Host "✅ $service is running" -ForegroundColor Green
        $healthyServices++
    } else {
        Write-Host "❌ $service is not running (Status: $status)" -ForegroundColor Red
    }
}

# Test application endpoint
Start-Sleep 15
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Application health check passed" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Application health check failed - service may still be starting" -ForegroundColor Yellow
}

# Show database connection test
Write-Host "🗄️ Testing database connection..." -ForegroundColor Yellow
try {
    $dbTest = docker-compose exec -T postgres pg_isready -U uandinotai -d uandinotai_dating
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database connection successful" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Database connection test failed" -ForegroundColor Yellow
}

# Show Redis connection test
Write-Host "📦 Testing Redis connection..." -ForegroundColor Yellow
try {
    $redisTest = docker-compose exec -T redis redis-cli -a $RedisPassword ping
    if ($redisTest -eq "PONG") {
        Write-Host "✅ Redis connection successful" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Redis connection test failed" -ForegroundColor Yellow
}

# Display final status
Write-Host ""
Write-Host "🎯 Deployment Status Summary:" -ForegroundColor Cyan
Write-Host "Services: $healthyServices/$totalServices running" -ForegroundColor White
Write-Host ""
Write-Host "✅ Updated Credentials:" -ForegroundColor Green
Write-Host "  Database Password: ✓ Generated secure password" -ForegroundColor White
Write-Host "  Redis Password: ✓ Generated secure password" -ForegroundColor White
Write-Host "  Session Secret: ✓ Generated 64-character secret" -ForegroundColor White
if ($StripeSecretKey) { Write-Host "  Stripe Secret Key: ✓ Updated from environment" -ForegroundColor White }
if ($StripePublishableKey) { Write-Host "  Stripe Publishable Key: ✓ Updated" -ForegroundColor White }
if ($StripeWebhookSecret) { Write-Host "  Stripe Webhook Secret: ✓ Updated" -ForegroundColor White }

Write-Host ""
Write-Host "🌐 Access Points:" -ForegroundColor Cyan
Write-Host "Main App: http://localhost:5000" -ForegroundColor White
Write-Host "Admin Dashboard: http://localhost:5000/admin" -ForegroundColor White
Write-Host "Database: localhost:5432" -ForegroundColor White
Write-Host "Redis: localhost:6379" -ForegroundColor White

Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Test the application at http://localhost:5000" -ForegroundColor White
Write-Host "2. Verify admin access with uandinotai@gmail.com" -ForegroundColor White
Write-Host "3. Test photo uploads and location search" -ForegroundColor White
Write-Host "4. Configure domain and SSL for production" -ForegroundColor White

# Show recent logs
Write-Host ""
Write-Host "📋 Recent Application Logs:" -ForegroundColor Yellow
docker-compose logs --tail=10 uandinotai-app

Write-Host ""
Write-Host "✅ U&I Not AI Dating App successfully updated and restarted!" -ForegroundColor Green
Write-Host "💾 Backup saved to: backups/.env.backup.$timestamp" -ForegroundColor Cyan

# Keep window open for review
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")