#!/bin/bash

# U&I Not AI Dating App - Self-Hosting Deployment Script
# Complete Docker infrastructure deployment

set -e

echo "🚀 Deploying U&I Not AI Dating App with Docker Self-Hosting..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "✅ Docker installed. Please log out and back in, then run this script again."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Installing..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Create production environment file
echo "📝 Setting up environment configuration..."
if [ ! -f .env.production ]; then
    cat > .env.production << 'EOF'
# U&I Not AI Dating App - Production Environment

# Domain Configuration
DOMAIN=uandinotai.com
EMAIL_FROM=uandinotai@gmail.com

# Database Configuration
POSTGRES_DB=uandinotai_dating
POSTGRES_USER=uandinotai
POSTGRES_PASSWORD=your_secure_db_password_here_change_this

# Redis Configuration
REDIS_PASSWORD=your_secure_redis_password_here_change_this

# Session Configuration
SESSION_SECRET=your_very_secure_session_secret_minimum_32_characters_change_this

# Application Configuration
NODE_ENV=production
PORT=5000
REPL_ID=your_repl_id_here
ISSUER_URL=https://replit.com/oidc
REPLIT_DOMAINS=uandinotai.com

# Stripe Payment Configuration
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret_here

# AI Features (Optional)
OPENAI_API_KEY=sk-your_openai_api_key_here

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=uandinotai@gmail.com
SMTP_PASS=your_app_password_here

# File Upload Configuration
UPLOADS_DIR=/app/uploads
EOF

    echo "⚠️  Created .env.production file. PLEASE EDIT IT WITH YOUR ACTUAL VALUES!"
    echo "Edit the file: nano .env.production"
    read -p "Press Enter after you've updated .env.production with your values..."
fi

# Create necessary directories
echo "📁 Creating directory structure..."
mkdir -p nginx/conf.d nginx/ssl nginx/html backups backup-scripts uploads logs monitoring/grafana monitoring/prometheus

# Create Nginx configuration for production
echo "🌐 Setting up Nginx configuration..."
cat > nginx/conf.d/default.conf << 'EOF'
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;
limit_req_zone $binary_remote_addr zone=upload:10m rate=2r/s;

# Upstream application servers
upstream uandinotai_app {
    server uandinotai-app:5000 max_fails=3 fail_timeout=30s;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name _;
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Redirect all other HTTP to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# Main HTTPS server
server {
    listen 443 ssl http2;
    server_name uandinotai.com www.uandinotai.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/uandinotai.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/uandinotai.com/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.stripe.com;" always;
    
    # File upload size
    client_max_body_size 10M;
    
    # Main application
    location / {
        proxy_pass http://uandinotai_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
        
        # Enable compression
        gzip on;
        gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    }
    
    # API rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://uandinotai_app;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Login rate limiting
    location /api/login {
        limit_req zone=login burst=3 nodelay;
        proxy_pass http://uandinotai_app;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # File upload rate limiting
    location /api/profile/photos {
        limit_req zone=upload burst=5 nodelay;
        proxy_pass http://uandinotai_app;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_Set_header X-Forwarded-Proto $scheme;
    }
    
    # Health check (no rate limiting)
    location /api/health {
        proxy_pass http://uandinotai_app;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        access_log off;
    }
    
    # Static files with caching
    location /api/uploads/ {
        proxy_pass http://uandinotai_app;
        proxy_cache_valid 200 1h;
        expires 1h;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Create Redis configuration
echo "📦 Setting up Redis configuration..."
cat > redis.conf << 'EOF'
# Redis configuration for U&I Not AI Dating App
bind 0.0.0.0
port 6379
timeout 300
keepalive 60

# Memory management
maxmemory 512mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000
rdbcompression yes
rdbchecksum yes

# Append only file
appendonly yes
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb

# Security
requirepass REDIS_PASSWORD_PLACEHOLDER
EOF

# Create docker-compose production file
echo "🐳 Setting up Docker Compose configuration..."
cat > docker-compose.prod.yml << 'EOF'
version: '3.8'

services:
  # Main Application
  uandinotai-app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: uandinotai-dating-app
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=5000
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      - REPL_ID=${REPL_ID}
      - SESSION_SECRET=${SESSION_SECRET}
      - ISSUER_URL=${ISSUER_URL}
      - REPLIT_DOMAINS=${REPLIT_DOMAINS}
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - STRIPE_PUBLISHABLE_KEY=${STRIPE_PUBLISHABLE_KEY}
      - STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - EMAIL_FROM=${EMAIL_FROM}
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_PORT=${SMTP_PORT}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASS=${SMTP_PASS}
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
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  # PostgreSQL Database
  postgres:
    image: postgres:16-alpine
    container_name: uandinotai-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8"
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - uandinotai-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: uandinotai-redis
    restart: unless-stopped
    volumes:
      - redis-data:/data
      - ./redis.conf:/etc/redis/redis.conf
    networks:
      - uandinotai-network
    command: redis-server /etc/redis/redis.conf --requirepass ${REDIS_PASSWORD}
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
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
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./nginx/html:/var/www/html
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - nginx-logs:/var/log/nginx
    networks:
      - uandinotai-network
    depends_on:
      - uandinotai-app
    healthcheck:
      test: ["CMD", "nginx", "-t"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Database Backup Service
  backup:
    image: postgres:16-alpine
    container_name: uandinotai-backup
    restart: unless-stopped
    environment:
      PGPASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - ./backups:/backups
    networks:
      - uandinotai-network
    depends_on:
      postgres:
        condition: service_healthy
    command: >
      sh -c "
        echo 'Backup service started - waiting for database...'
        sleep 60
        while true; do
          echo 'Creating backup at $(date)'
          pg_dump -h postgres -U $${POSTGRES_USER} -d $${POSTGRES_DB} | gzip > /backups/backup_$$(date +%Y%m%d_%H%M%S).sql.gz
          echo 'Backup completed'
          find /backups -name '*.sql.gz' -mtime +30 -delete
          echo 'Old backups cleaned up'
          sleep 86400
        done
      "

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
EOF

# Create SSL setup script
echo "🔒 Creating SSL certificate setup..."
cat > setup-ssl.sh << 'EOF'
#!/bin/bash

# SSL Certificate Setup for U&I Not AI Dating App

set -e

# Load environment variables
if [ -f .env.production ]; then
    source .env.production
fi

DOMAIN=${DOMAIN:-uandinotai.com}
EMAIL=${EMAIL_FROM:-uandinotai@gmail.com}

echo "🔒 Setting up SSL certificates for ${DOMAIN}..."

# Create nginx HTML directory for Let's Encrypt challenges
mkdir -p nginx/html

# Start nginx temporarily for certificate verification
echo "🌐 Starting nginx temporarily..."
docker run --rm -d \
    --name temp-nginx \
    -p 80:80 \
    -v $(pwd)/nginx/html:/var/www/html \
    nginx:alpine

# Get certificates
echo "📜 Obtaining SSL certificates..."
docker run -it --rm \
    -v /etc/letsencrypt:/etc/letsencrypt \
    -v /var/lib/letsencrypt:/var/lib/letsencrypt \
    -v $(pwd)/nginx/html:/var/www/html \
    certbot/certbot certonly \
    --webroot \
    --webroot-path=/var/www/html \
    --email ${EMAIL} \
    --agree-tos \
    --no-eff-email \
    -d ${DOMAIN} \
    -d www.${DOMAIN}

# Stop temporary nginx
docker stop temp-nginx

echo "✅ SSL certificates obtained successfully!"
EOF

chmod +x setup-ssl.sh

# Create deployment script
echo "🚀 Creating deployment script..."
cat > deploy-production.sh << 'EOF'
#!/bin/bash

# U&I Not AI Dating App Production Deployment

set -e

echo "🚀 Deploying U&I Not AI Dating App to Production..."

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ .env.production file not found. Please create it first."
    exit 1
fi

# Load environment variables
source .env.production

# Validate required environment variables
REQUIRED_VARS=("POSTGRES_PASSWORD" "REDIS_PASSWORD" "SESSION_SECRET")
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ] || [[ "${!var}" == *"change_this"* ]]; then
        echo "❌ Required environment variable $var is not properly set in .env.production"
        exit 1
    fi
done

echo "✅ Environment validation passed"

# Update Redis config with actual password
sed "s/REDIS_PASSWORD_PLACEHOLDER/${REDIS_PASSWORD}/g" redis.conf > redis.conf.tmp
mv redis.conf.tmp redis.conf

# Build and start services
echo "🔨 Building application..."
docker-compose -f docker-compose.prod.yml --env-file .env.production build

echo "🚀 Starting services..."
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 60

# Run database migrations
echo "🗄️ Running database migrations..."
docker-compose -f docker-compose.prod.yml --env-file .env.production exec -T uandinotai-app npm run db:push || echo "Migrations may have already run"

# Check service health
echo "🔍 Checking service health..."
docker-compose -f docker-compose.prod.yml ps

echo "✅ Deployment completed successfully!"
echo "🌐 Your app should be available at: https://${DOMAIN}"
echo ""
echo "📋 Service status:"
docker-compose -f docker-compose.prod.yml --env-file .env.production logs --tail=20 uandinotai-app

# Show next steps
echo ""
echo "🎯 Next steps:"
echo "1. Verify your app is working at https://${DOMAIN}"
echo "2. Test photo uploads and location search"
echo "3. Configure monitoring (optional)"
echo "4. Set up regular backups verification"
EOF

chmod +x deploy-production.sh

# Create monitoring script
echo "📊 Creating monitoring setup..."
cat > setup-monitoring.sh << 'EOF'
#!/bin/bash

# Optional monitoring setup with Grafana and Prometheus

echo "📊 Setting up monitoring stack..."

# Create prometheus config
cat > monitoring/prometheus.yml << 'EOL'
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'uandinotai-app'
    static_configs:
      - targets: ['uandinotai-app:5000']
    metrics_path: '/api/metrics'
    scrape_interval: 30s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx:80']
EOL

# Add monitoring services to docker-compose
cat >> docker-compose.prod.yml << 'EOL'

  # Prometheus
  prometheus:
    image: prom/prometheus
    container_name: uandinotai-prometheus
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    networks:
      - uandinotai-network

  # Grafana
  grafana:
    image: grafana/grafana
    container_name: uandinotai-grafana
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD:-admin123}
    volumes:
      - grafana-data:/var/lib/grafana
    networks:
      - uandinotai-network

volumes:
  prometheus-data:
    driver: local
  grafana-data:
    driver: local
EOL

echo "✅ Monitoring setup complete. Access Grafana at http://your-domain:3000"
EOF

chmod +x setup-monitoring.sh

echo ""
echo "✅ Self-hosting deployment setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env.production with your actual values"
echo "2. Run: ./setup-ssl.sh (to get SSL certificates)"
echo "3. Run: ./deploy-production.sh (to deploy the app)"
echo "4. Optional: ./setup-monitoring.sh (for monitoring)"
echo ""
echo "📁 Files created:"
echo "  - .env.production (EDIT THIS FIRST!)"
echo "  - docker-compose.prod.yml"
echo "  - nginx/conf.d/default.conf"
echo "  - setup-ssl.sh"
echo "  - deploy-production.sh"
echo "  - setup-monitoring.sh"
echo ""
echo "🌐 Your self-hosted U&I Not AI dating app will be available at: https://uandinotai.com"
echo "📊 Features included: Location search, photo uploads, premium subscriptions, admin controls"