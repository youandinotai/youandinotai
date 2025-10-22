# U&I Not AI Dating App - Self-Hosting Deployment Guide

## Quick Start

Your complete self-hosting infrastructure is ready! This includes Docker configuration for full control over your dating app.

### What's Included

**✅ Complete Dating App Features:**
- Location-based search with distance controls (5-100 miles)
- Photo upload system with local file storage  
- Premium subscriptions ($9.99/week) via Stripe integration
- Admin controls for uandinotai@gmail.com with special privileges
- Unlimited messaging for matched users
- Content moderation and blurring for free users
- Swipe-based matching system

**✅ Docker Infrastructure:**
- Multi-container setup with PostgreSQL, Redis, Nginx
- Automatic health checks and restart policies
- Volume persistence for data and uploads
- Security headers and rate limiting
- Production-ready configuration

## Deployment Options

### Option 1: Direct Docker Deployment

```bash
# 1. Copy all files to your server
# 2. Set environment variables
export POSTGRES_PASSWORD="your_secure_password"
export REDIS_PASSWORD="your_redis_password"
export SESSION_SECRET="your_32_character_session_secret"
export STRIPE_SECRET_KEY="sk_live_your_stripe_key"

# 3. Deploy
docker-compose up -d

# 4. Check status
docker-compose ps
```

### Option 2: Windows PowerShell (Automated)

Use the provided `deploy-windows.ps1` script for one-click Windows deployment:

```powershell
# Run as Administrator
.\deploy-windows.ps1
```

### Option 3: Production Server Setup

1. **Server Requirements:**
   - Ubuntu 20.04+ or CentOS 8+
   - Docker and Docker Compose installed
   - 2GB+ RAM, 20GB+ storage
   - Port 80/443 open for web traffic

2. **Domain Setup:**
   - Point your domain to server IP
   - Update `nginx.conf` with your domain
   - Set up SSL certificates (Let's Encrypt recommended)

3. **Environment Configuration:**
   ```bash
   # Create production environment file
   cp .env.example .env.production
   
   # Edit with your credentials
   nano .env.production
   
   # Deploy with production config
   docker-compose --env-file .env.production up -d
   ```

## Service Architecture

- **uandinotai-app**: Main Node.js application (Port 5000)
- **postgres**: PostgreSQL database (Port 5432)
- **redis**: Redis cache for sessions (Port 6379)
- **nginx**: Reverse proxy and load balancer (Ports 80/443)

## Management Commands

```bash
# View logs
docker-compose logs -f uandinotai-app

# Restart specific service
docker-compose restart uandinotai-app

# Update application
docker-compose pull
docker-compose up -d --force-recreate

# Database backup
docker-compose exec postgres pg_dump -U uandinotai uandinotai_dating > backup.sql

# Scale application (multiple instances)
docker-compose up -d --scale uandinotai-app=3
```

## Monitoring and Maintenance

### Health Checks
- Application: `http://your-domain/api/health`
- Database: `docker-compose exec postgres pg_isready`
- Redis: `docker-compose exec redis redis-cli ping`

### Log Management
```bash
# View application logs
docker-compose logs uandinotai-app

# View nginx access logs
docker-compose logs nginx

# View all service logs
docker-compose logs
```

### Backup Strategy
```bash
# Create automated backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T postgres pg_dump -U uandinotai uandinotai_dating | gzip > backups/db_backup_$DATE.sql.gz
find backups/ -name "*.sql.gz" -mtime +30 -delete
EOF

chmod +x backup.sh

# Run daily via crontab
echo "0 2 * * * /path/to/backup.sh" | crontab -
```

## Security Considerations

1. **Change Default Passwords:**
   - Database password
   - Redis password
   - Session secret (32+ characters)

2. **Firewall Configuration:**
   ```bash
   # Allow only necessary ports
   ufw allow 22    # SSH
   ufw allow 80    # HTTP
   ufw allow 443   # HTTPS
   ufw enable
   ```

3. **SSL Certificate Setup:**
   ```bash
   # Using Let's Encrypt
   certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

## Troubleshooting

### Common Issues

**Container won't start:**
```bash
# Check logs
docker-compose logs [service_name]

# Rebuild container
docker-compose build --no-cache [service_name]
```

**Database connection issues:**
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Test database connection
docker-compose exec postgres psql -U uandinotai -d uandinotai_dating
```

**File upload issues:**
```bash
# Check upload directory permissions
ls -la uploads/

# Fix permissions
chmod 755 uploads/
```

## Performance Optimization

### Resource Limits
Add to docker-compose.yml:
```yaml
services:
  uandinotai-app:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
```

### Nginx Caching
```nginx
# Add to nginx.conf
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## Support and Updates

- **Application logs**: Available in `logs/` directory
- **Database backups**: Stored in `backups/` directory
- **Configuration**: Modify `docker-compose.yml` and restart
- **Updates**: Pull latest images and recreate containers

Your U&I Not AI dating app is now ready for self-hosted deployment with complete infrastructure control!