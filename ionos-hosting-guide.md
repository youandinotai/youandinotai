# IONOS Hosting Configuration Guide

## Domain & DNS Settings for u-and-i-not-a-i.online

### 1. DNS Configuration in IONOS
Update your DNS records to point to your hosting solution:

**Option A: Direct Server Hosting**
```
A Record: @ → Your server IP address
A Record: www → Your server IP address
CNAME: api → u-and-i-not-a-i.online
```

**Option B: Using IONOS Cloud/VPS**
```
A Record: @ → Your IONOS VPS IP
A Record: www → Your IONOS VPS IP
```

### 2. SSL Certificate Setup
**Free SSL via Let's Encrypt:**
```bash
# Install certbot on your IONOS server
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d u-and-i-not-a-i.online -d www.u-and-i-not-a-i.online
```

**Or use IONOS Managed SSL:**
- Enable SSL in IONOS control panel
- Upload your SSL certificates to nginx configuration

### 3. IONOS Hosting Options

#### Option 1: IONOS VPS/Cloud Server
**Recommended specs for your dating app:**
- CPU: 2 vCores minimum
- RAM: 4GB minimum 
- Storage: 20GB SSD
- Bandwidth: Unlimited

**Setup steps:**
1. Create IONOS VPS with Ubuntu 22.04
2. Install Docker and Docker Compose
3. Clone your repository
4. Run with Docker Compose

#### Option 2: IONOS Managed Hosting
- Enable Node.js support in control panel
- Upload your built application files
- Configure environment variables
- Set up database connection

### 4. Environment Variables for IONOS
Create `.env` file with your credentials:
```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/dating_app
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key_here
VITE_STRIPE_PUBLIC_KEY=pk_live_your_stripe_public_key_here
SESSION_SECRET=your_super_secret_session_key_here
REPLIT_DOMAINS=u-and-i-not-a-i.online

# Docker Database Configuration
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=dating_app
```

### 5. Database Options

#### PostgreSQL on IONOS
**Option A: IONOS Database Service**
- Use IONOS managed PostgreSQL
- Get connection string from IONOS panel
- Update DATABASE_URL in environment

**Option B: Self-hosted with Docker**
- Use the included docker-compose.yml
- Set up persistent volumes
- Configure backups

### 6. Performance Optimization
**Enable in IONOS:**
- CDN for static assets
- Gzip compression
- HTTP/2 support
- Image optimization

**Configure in your app:**
- Enable caching headers
- Optimize images before upload
- Use service worker for offline support

### 7. Monitoring Setup
**IONOS Monitoring:**
- Enable server monitoring
- Set up alerts for downtime
- Monitor resource usage

**Application Monitoring:**
- Use the included health check endpoint: `/api/health`
- Set up log aggregation
- Monitor database performance

### 8. Backup Strategy
**Database Backups:**
```bash
# Daily backup script
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

**File Backups:**
- Regular snapshots of VPS
- Git repository for code
- Environment variables backup

### 9. Security Checklist
- [ ] SSL certificate installed and working
- [ ] Firewall configured (ports 80, 443, 22 only)
- [ ] Strong passwords for all accounts
- [ ] Regular security updates
- [ ] Environment variables secured
- [ ] Database access restricted
- [ ] CORS configured properly
- [ ] Rate limiting enabled

### 10. Deployment Commands

**Initial deployment:**
```bash
# Clone repository
git clone your-repo-url
cd your-app

# Set up environment
cp .env.example .env
# Edit .env with your production values

# Deploy with Docker
docker-compose up -d

# Check health
curl https://u-and-i-not-a-i.online/api/health
```

**Updates:**
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

## Troubleshooting Common IONOS Issues

### Domain not resolving
- Check DNS propagation (can take 24-48 hours)
- Verify A records point to correct IP
- Clear DNS cache: `sudo systemctl flush-dns`

### SSL certificate issues
- Ensure domain points to server before running certbot
- Check firewall allows ports 80 and 443
- Verify nginx configuration syntax

### Database connection errors
- Check DATABASE_URL format
- Verify PostgreSQL is running
- Test connection from application server

### Performance issues
- Monitor CPU/RAM usage in IONOS panel
- Check database query performance
- Enable caching and CDN