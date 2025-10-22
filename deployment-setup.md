# Secure Deployment Setup for uandinotai.com

## IONOS Account Configuration
**Email:** joshlcoleman@gmail.com  
**Account Password:** !!11trasH

## Quick IONOS VPS Setup

### 1. Create VPS Instance
1. Login to IONOS Cloud Console with your credentials
2. Create new VPS with these specs:
   - **OS:** Ubuntu 22.04 LTS
   - **CPU:** 2 vCores minimum
   - **RAM:** 4GB minimum
   - **Storage:** 20GB SSD
   - **Location:** Choose closest to your users

### 2. Initial Server Setup
```bash
# Connect to your VPS
ssh root@your-vps-ip

# Update system
apt update && apt upgrade -y

# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Create deployment directory
mkdir /opt/dating-app
cd /opt/dating-app
```

### 3. Deploy Your Application
```bash
# Clone your repository (replace with your actual repo)
git clone https://github.com/your-username/dating-app.git .

# Create environment file
cat > .env << 'EOF'
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://joshlcoleman:!!11trasH@db:5432/dating_app
STRIPE_SECRET_KEY=sk_live_your_stripe_key_here
VITE_STRIPE_PUBLIC_KEY=pk_live_your_stripe_public_key_here
SESSION_SECRET=uandinotai-super-secret-session-key-2025-production
REPLIT_DOMAINS=uandinotai.com
DB_USER=joshlcoleman
DB_PASSWORD=!!11trasH
DB_NAME=dating_app
EOF

# Start the application
docker-compose up -d

# Check if everything is running
docker-compose ps
curl http://localhost:5000/api/health
```

### 4. DNS Configuration in IONOS
1. Go to IONOS Domain Management
2. Select u-and-i-not-a-i.online
3. Add these DNS records:
   ```
   Type: A    Name: @     Value: YOUR_VPS_IP_ADDRESS
   Type: A    Name: www   Value: YOUR_VPS_IP_ADDRESS
   ```

### 5. SSL Certificate Setup
```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get SSL certificate
certbot --nginx -d u-and-i-not-a-i.online -d www.u-and-i-not-a-i.online \
  --email joshlcoleman@gmail.com \
  --agree-tos \
  --non-interactive
```

### 6. Configure Firewall
```bash
# Enable UFW firewall
ufw enable

# Allow necessary ports
ufw allow 22   # SSH
ufw allow 80   # HTTP
ufw allow 443  # HTTPS

# Check firewall status
ufw status
```

## Alternative: IONOS Managed WordPress Hosting

If you prefer managed hosting instead of VPS:

### 1. Setup Steps
1. Login to IONOS control panel
2. Create new "Web Hosting" package
3. Enable Node.js support in hosting settings
4. Upload your built application files via FTP

### 2. Database Setup
1. Create MySQL/PostgreSQL database in IONOS panel
2. Note connection details for your app
3. Update DATABASE_URL in your environment

### 3. Domain Configuration
1. Point uandinotai.com to your hosting package
2. Enable SSL certificate in IONOS panel
3. Configure redirects from www to non-www

## Security Checklist

- [ ] Strong passwords set for all accounts
- [ ] SSH keys configured (disable password auth)
- [ ] Firewall properly configured
- [ ] SSL certificates installed and auto-renewing
- [ ] Database access restricted to application only
- [ ] Environment variables secured
- [ ] Regular backups configured
- [ ] Monitoring and alerting set up

## Monitoring & Maintenance

### Health Checks
```bash
# Check application health
curl https://uandinotai.com/api/health

# Check Docker containers
docker-compose ps

# View application logs
docker-compose logs app

# Monitor resource usage
htop
df -h
```

### Backup Script
```bash
#!/bin/bash
# backup-script.sh
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p /opt/backups

# Backup database
docker-compose exec db pg_dump -U joshlcoleman dating_app > /opt/backups/db_$DATE.sql

# Backup application files
tar -czf /opt/backups/app_$DATE.tar.gz /opt/dating-app

# Keep only last 7 days of backups
find /opt/backups -name "*.sql" -mtime +7 -delete
find /opt/backups -name "*.tar.gz" -mtime +7 -delete
```

### Auto-deployment Script
```bash
#!/bin/bash
# deploy.sh
cd /opt/dating-app

# Pull latest changes
git pull origin main

# Rebuild and restart containers
docker-compose down
docker-compose up -d --build

# Wait for health check
sleep 10
curl -f https://u-and-i-not-a-i.online/api/health || exit 1

echo "Deployment successful!"
```

## Troubleshooting

### Common Issues
1. **Domain not resolving:** Check DNS propagation (24-48 hours)
2. **SSL errors:** Verify domain points to server before certbot
3. **Database connection:** Check credentials and PostgreSQL status
4. **Application errors:** Check logs with `docker-compose logs app`

### Support Contacts
- **IONOS Support:** Available through your account dashboard
- **Domain Issues:** Check DNS propagation at whatsmydns.net
- **SSL Issues:** Let's Encrypt community forum

Remember to replace placeholder Stripe keys with your actual live keys before going to production!