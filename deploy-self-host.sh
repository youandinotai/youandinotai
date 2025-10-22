#!/bin/bash

# U&I Not AI Dating App - Self-Hosting Deployment
echo "🚀 Deploying U&I Not AI Dating App with self-hosting infrastructure..."

# Ensure directories exist
mkdir -p backups uploads logs

# Set proper permissions
chmod 755 uploads logs backups

# Run database migrations
echo "🗄️ Running database migrations..."
npm run db:push

# Build the application
echo "🔨 Building application..."
npm run build

echo "✅ Self-hosting deployment ready!"
echo ""
echo "🎯 Features deployed:"
echo "✅ Location-based search with distance controls (5-100 miles)"
echo "✅ Photo upload system with local file storage"
echo "✅ Premium subscriptions ($9.99/week) via Stripe"
echo "✅ Admin controls for uandinotai@gmail.com"
echo "✅ Unlimited messaging for matched users"
echo "✅ Content moderation and blurring"
echo ""
echo "🐳 Docker infrastructure ready:"
echo "- docker-compose.yml (Multi-service setup)"
echo "- Dockerfile (Application container)"
echo "- nginx.conf (Reverse proxy with security)"
echo "- Backup directories created"
echo ""
echo "📋 To deploy with Docker:"
echo "1. Copy all files to your server"
echo "2. Set environment variables or edit docker-compose.yml"
echo "3. Run: docker-compose up -d"
echo ""
echo "🌐 Your self-hosted dating app will be available on port 5000"
echo "📊 Admin dashboard will be at /admin"