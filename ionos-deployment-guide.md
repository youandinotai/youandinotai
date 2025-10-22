# IONOS Deployment Guide for uandinotai.com

## Account Details
- **Email:** joshlcoleman@gmail.com
- **Password:** !!11trasH

## IONOS VPS Setup

### 1. Create VPS Instance
1. Login to IONOS Cloud Console
2. Create new Cloud Server:
   - **Name:** uandinotai-dating-app
   - **OS:** Ubuntu 22.04 LTS
   - **CPU:** 2 vCPU
   - **RAM:** 4 GB
   - **Storage:** 20 GB SSD
   - **Location:** US East or Europe (choose based on your users)

### 2. Initial Server Configuration
```bash
# Connect to VPS
ssh root@YOUR_VPS_IP

# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs

# Install PostgreSQL
apt install postgresql postgresql-contrib -y

# Start PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE dating_app;
CREATE USER joshlcoleman WITH PASSWORD '!!11trasH';
GRANT ALL PRIVILEGES ON DATABASE dating_app TO joshlcoleman;
\q
EOF

# Install Nginx
apt install nginx -y
systemctl start nginx
systemctl enable nginx
```

### 3. Deploy Application
```bash
# Create application directory
mkdir -p /var/www/dating-app
cd /var/www/dating-app

# Clone repository (you'll need to push your code to a Git repo first)
git clone https://github.com/your-username/dating-app.git .

# Create production environment file
cat > .env << 'EOF'
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://joshlcoleman:!!11trasH@localhost:5432/dating_app
STRIPE_SECRET_KEY=sk_live_your_stripe_key_here
VITE_STRIPE_PUBLIC_KEY=pk_live_your_stripe_public_key_here
SESSION_SECRET=uandinotai-super-secret-session-key-2025-production
REPLIT_DOMAINS=uandinotai.com
EOF

# Install dependencies and build
npm install
npm run build

# Create systemd service
cat > /etc/systemd/system/dating-app.service << 'EOF'
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
EOF

# Start the service
systemctl daemon-reload
systemctl enable dating-app
systemctl start dating-app
```

### 4. Configure Nginx
```bash
# Create Nginx configuration
cat > /etc/nginx/sites-available/dating-app << 'EOF'
server {
    listen 80;
    server_name uandinotai.com www.uandinotai.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable the site
ln -s /etc/nginx/sites-available/dating-app /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

### 5. DNS Configuration in IONOS
1. Login to IONOS control panel
2. Go to "Domains & SSL" → "uandinotai.com"
3. Click "DNS" settings
4. Add these records:
   ```
   Type: A     Name: @       Value: YOUR_VPS_IP
   Type: A     Name: www     Value: YOUR_VPS_IP
   Type: CNAME Name: api     Value: uandinotai.com
   ```

### 6. SSL Certificate Setup
```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get SSL certificate
certbot --nginx -d uandinotai.com -d www.uandinotai.com \
  --email joshlcoleman@gmail.com \
  --agree-tos \
  --non-interactive

# Test auto-renewal
certbot renew --dry-run
```

### 7. Firewall Configuration
```bash
# Configure UFW firewall
ufw enable
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw status
```

### 8. Database Migration
```bash
# Run database migrations
cd /var/www/dating-app
npm run db:push
```

## IONOS Management

### Monitoring Your VPS
1. Login to IONOS Cloud Console
2. Go to "Infrastructure" → "Servers"
3. Click your server to view:
   - CPU usage
   - Memory usage
   - Network traffic
   - Storage usage

### Backup Configuration
1. In IONOS console, go to "Infrastructure" → "Backup"
2. Enable automatic backups for your VPS
3. Set backup schedule (daily recommended)

### Scaling Options
- **Vertical Scaling:** Increase CPU/RAM in IONOS console
- **Horizontal Scaling:** Add load balancer and multiple VPS instances

## Maintenance Commands

### Check Application Status
```bash
# Check if app is running
systemctl status dating-app

# View application logs
journalctl -u dating-app -f

# Check Nginx status
systemctl status nginx

# Check database status
systemctl status postgresql
```

### Update Application
```bash
cd /var/www/dating-app
git pull origin main
npm install
npm run build
systemctl restart dating-app
```

### Database Backup
```bash
# Create backup
pg_dump -U joshlcoleman -h localhost dating_app > backup_$(date +%Y%m%d).sql

# Restore from backup
psql -U joshlcoleman -h localhost dating_app < backup_file.sql
```

## Cost Optimization

### IONOS VPS Pricing
- **Basic VPS:** ~€4/month (1 vCPU, 1GB RAM)
- **Recommended VPS:** ~€8/month (2 vCPU, 4GB RAM)
- **Domain:** Included if purchased through IONOS
- **SSL Certificate:** Free with Let's Encrypt

### Monitoring Costs
1. Check IONOS billing dashboard monthly
2. Monitor bandwidth usage
3. Optimize images and static assets
4. Enable Nginx gzip compression

## Support & Troubleshooting

### IONOS Support
- **Phone:** Available through IONOS account
- **Email:** Support tickets through control panel
- **Knowledge Base:** help.ionos.com

### Common Issues
1. **502 Bad Gateway:** Check if app service is running
2. **SSL Certificate Errors:** Verify domain DNS is pointing to VPS
3. **Database Connection:** Check PostgreSQL status and credentials
4. **High CPU Usage:** Monitor with `htop` and optimize queries

### Health Check
Test your deployment:
```bash
curl https://u-and-i-not-a-i.online/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-07-28T...",
  "uptime": 1234.56,
  "version": "1.0.0"
}
```