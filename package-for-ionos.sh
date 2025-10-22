#!/bin/bash
# Package application for IONOS VPS deployment

echo "🚀 Preparing U&I Dating App for IONOS deployment..."

# Create deployment package
mkdir -p ionos-deployment
cd ionos-deployment

# Copy necessary files
echo "📦 Copying application files..."
cp -r ../dist ./
cp ../package.json ./
cp ../package-lock.json ./
cp ../.npmrc ./

# Create production package.json with only production dependencies
echo "📝 Creating production package.json..."
cat > package.json << 'EOF'
{
  "name": "u-and-i-dating-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node dist/index.js",
    "db:push": "drizzle-kit push"
  },
  "dependencies": {
    "@neondatabase/serverless": "^0.10.4",
    "connect-pg-simple": "^10.0.0",
    "drizzle-orm": "^0.39.1",
    "drizzle-kit": "^0.31.4",
    "express": "^4.21.2",
    "express-session": "^1.18.1",
    "passport": "^0.7.0",
    "passport-local": "^1.0.0",
    "stripe": "^18.3.0",
    "ws": "^8.18.0",
    "zod": "^3.24.2",
    "openid-client": "^6.6.2",
    "node-cron": "^4.2.1",
    "memoizee": "^0.4.17"
  }
}
EOF

# Create environment template
echo "🔧 Creating environment template..."
cat > .env.template << 'EOF'
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/dating_app
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key_here
VITE_STRIPE_PUBLIC_KEY=pk_live_your_stripe_public_key_here
SESSION_SECRET=u-and-i-not-ai-super-secret-session-key-2025-production
REPLIT_DOMAINS=u-and-i-not-a-i.online
EOF

# Create deployment script
echo "📋 Creating deployment script..."
cat > deploy.sh << 'EOF'
#!/bin/bash
echo "🚀 Deploying U&I Dating App to IONOS VPS..."

# Update system
sudo apt update

# Install Node.js if not installed
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Create application directory
sudo mkdir -p /var/www/dating-app
sudo chown $USER:$USER /var/www/dating-app

# Copy files
echo "📁 Copying application files..."
cp -r ./* /var/www/dating-app/
cd /var/www/dating-app

# Install production dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Set up environment
if [ ! -f .env ]; then
    echo "⚙️ Setting up environment file..."
    cp .env.template .env
    echo "❗ Please edit .env file with your actual credentials"
fi

# Create systemd service
echo "🔧 Creating systemd service..."
sudo tee /etc/systemd/system/dating-app.service > /dev/null << 'SERVICE_EOF'
[Unit]
Description=U&I Dating App
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/dating-app
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
SERVICE_EOF

# Set permissions
sudo chown -R www-data:www-data /var/www/dating-app

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable dating-app
sudo systemctl start dating-app

echo "✅ Deployment complete!"
echo "🔍 Check status: sudo systemctl status dating-app"
echo "📋 View logs: sudo journalctl -u dating-app -f"
echo "🌐 Test health: curl http://localhost:5000/api/health"
EOF

chmod +x deploy.sh

# Create archive
echo "📦 Creating deployment archive..."
tar -czf ../u-and-i-dating-app-ionos.tar.gz .
cd ..

echo "✅ Deployment package created: u-and-i-dating-app-ionos.tar.gz"
echo ""
echo "📋 Next steps:"
echo "1. Upload u-and-i-dating-app-ionos.tar.gz to your IONOS VPS"
echo "2. Extract: tar -xzf u-and-i-dating-app-ionos.tar.gz"
echo "3. Run: cd ionos-deployment && ./deploy.sh"
echo "4. Configure Nginx and SSL as per ionos-deployment-guide.md"
echo ""
echo "🔑 Don't forget to:"
echo "- Set up PostgreSQL database"
echo "- Update .env with real Stripe keys"
echo "- Configure DNS in IONOS control panel"