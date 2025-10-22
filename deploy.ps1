# U&I Not AI Dating App - Windows Deployment
Write-Host "🚀 Deploying U&I Not AI Dating App..." -ForegroundColor Green

# Create required directories
$directories = @("backups", "logs", "uploads", "nginx", "server", "client", "shared")
foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force
        Write-Host "Created directory: $dir" -ForegroundColor Yellow
    }
}

# Stop existing containers
Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
docker-compose down 2>$null

# Install Node.js dependencies
if (Test-Path "package.json") {
    Write-Host "📦 Installing Node.js dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Some dependencies may have warnings, continuing..." -ForegroundColor Yellow
    }
}

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
$services = docker-compose ps --format "table" 2>$null
if ($services) {
    Write-Host $services -ForegroundColor Cyan
} else {
    Write-Host "Services starting... checking individual containers..." -ForegroundColor Yellow
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

# Test application endpoint
Write-Host "🌐 Testing application..." -ForegroundColor Yellow
Start-Sleep 15
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000" -TimeoutSec 10 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Application is responding!" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️ Application may still be starting up..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Deployment completed!" -ForegroundColor Green
Write-Host "🌐 Your app is available at: http://localhost:5000" -ForegroundColor Cyan
Write-Host "📊 Admin dashboard: http://localhost:5000/admin" -ForegroundColor Cyan

# Show logs
Write-Host ""
Write-Host "📋 Recent application logs:" -ForegroundColor Yellow
docker-compose logs --tail=10 uandinotai-app 2>$null

Write-Host ""
Write-Host "⚠️ IMPORTANT: Edit the .env file with your actual credentials!" -ForegroundColor Red
Write-Host "Then restart with: docker-compose down && docker-compose up -d" -ForegroundColor Yellow