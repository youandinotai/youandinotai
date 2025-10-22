# Complete Docker Self-Hosting Deployment Guide

This guide provides step-by-step instructions for deploying the U&I Not AI dating app using Docker infrastructure with all features enabled.

## ✅ Features Implemented

### Core Features
- Complete Docker infrastructure with PostgreSQL, Redis, Nginx
- Location-based search with customizable radius (5-100 miles)
- Photo upload system with local storage
- Premium subscriptions ($9.99/week) via Stripe
- Admin controls for uandinotai@gmail.com
- Automated backups and SSL certificates

### New Features Added
- **Location Search**: Users can search by city with distance controls
- **Photo Uploads**: Fixed multer-based photo upload system
- **Search Navigation**: Added search tab to bottom navigation
- **Docker Production**: Complete containerized deployment setup

## 🚀 Quick Deployment

### 1. Server Preparation
```bash
# On Ubuntu/CentOS server
sudo apt update && sudo apt upgrade -y
sudo apt install docker.io docker-compose git curl -y
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

### 2. Download and Setup
```bash
# Clone the repository
git clone https://git.replit.com/uandinotai/workspace.git
cd workspace

# Run automated setup
chmod +x self-hosting/scripts/docker-setup.sh
./self-hosting/scripts/docker-setup.sh
```

### 3. Configure Environment
Edit `.env` file with your values:
```bash
# Required Configuration
DOMAIN=uandinotai.com
POSTGRES_PASSWORD=secure_db_password_here
REDIS_PASSWORD=secure_redis_password_here
SESSION_SECRET=minimum_32_character_session_secret
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key

# Email Configuration
EMAIL_FROM=admin@uandinotai.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=admin@uandinotai.com
SMTP_PASS=your_app_password

# Optional AI Features
OPENAI_API_KEY=sk-your_openai_api_key
```

### 4. SSL and Deployment
```bash
# Get SSL certificates
./setup-ssl.sh

# Deploy application
./deploy.sh
```

## 📍 Location Search Feature

### How It Works
- Users can search for other users by city name
- Adjustable search radius from 5 to 100 miles
- Distance calculation using Haversine formula
- Current location detection support

### Database Schema
Added location fields to users table:
- `latitude`: User's latitude coordinate
- `longitude`: User's longitude coordinate  
- `searchRadius`: User's preferred search radius (default 25 miles)

### API Endpoints
- `GET /api/search/location?city=CityName&radius=25`: Search by city
- `GET /api/search/location?radius=50`: Search by current location

### Usage
1. Navigate to Search tab in app
2. Enter city name or use current location
3. Adjust search radius with slider
4. View results with distance information

## 📸 Photo Upload System

### Technical Implementation
- Local file storage using multer middleware
- Files stored in `./uploads` directory
- 10MB file size limit with image validation
- UUID-based filename generation
- Direct serving from `/api/uploads/:filename`

### Upload Process
1. User selects photo in profile editor
2. FormData sent to `/api/profile/photos` endpoint
3. Multer processes and stores file locally
4. Database stores file URL reference
5. Photos served directly from uploads directory

### File Management
```bash
# Check uploads directory
ls -la uploads/

# Clean old files (run periodically)
find uploads/ -type f -mtime +30 -delete
```

## 🐳 Docker Infrastructure

### Service Architecture
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    Nginx    │    │     App     │    │ PostgreSQL  │
│  (Port 80)  │───▶│ (Port 5000) │───▶│ (Port 5432) │
│ (Port 443)  │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Let's       │    │    Redis    │    │   Backup    │
│ Encrypt     │    │ (Port 6379) │    │   Service   │
└─────────────┘    └─────────────┘    └─────────────┘
```

### Container Management
```bash
# View running containers
docker-compose ps

# Check logs
docker-compose logs -f uandinotai-app

# Restart services
docker-compose restart

# Update application
git pull && docker-compose build && docker-compose up -d
```

### Production Monitoring
- Health checks on all services
- Automated daily database backups
- Log rotation and management
- Performance monitoring with optional Grafana/Prometheus

## 🔧 Management Commands

### Database Operations
```bash
# Access database
docker-compose exec postgres psql -U uandinotai -d uandinotai_dating

# Run migrations
docker-compose exec uandinotai-app npm run db:push

# Manual backup
docker-compose exec postgres pg_dump -U uandinotai uandinotai_dating > backup.sql
```

### Application Updates
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose build uandinotai-app
docker-compose up -d uandinotai-app

# Check status
docker-compose ps
```

### File System Management
```bash
# Check disk usage
du -sh uploads/
df -h

# Clean old backups
find backups/ -name "*.sql" -mtime +30 -delete

# Monitor logs
tail -f logs/app.log
```

## 🔒 Security Configuration

### Network Security
- UFW firewall with minimal open ports
- Fail2ban for intrusion prevention
- Rate limiting on API endpoints
- Secure headers in Nginx configuration

### Application Security
- Session-based authentication with Replit Auth
- CSRF protection enabled
- Input validation with Zod schemas
- File upload restrictions and validation

### SSL/TLS Security
- Automatic Let's Encrypt certificate renewal
- Strong SSL cipher configuration
- HTTP Strict Transport Security (HSTS)
- Secure cookie settings

## 📊 Performance Optimization

### Database Performance
```sql
-- Monitor slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC LIMIT 10;

-- Index optimization
CREATE INDEX CONCURRENTLY idx_users_location ON users(latitude, longitude);
CREATE INDEX CONCURRENTLY idx_likes_user_ids ON likes(from_user_id, to_user_id);
```

### Application Performance
- Redis caching for session storage
- Image optimization and compression
- Database connection pooling
- API response caching with appropriate headers

### Infrastructure Scaling
```bash
# Scale application instances
docker-compose up -d --scale uandinotai-app=3

# Load balancer configuration (update nginx.conf)
upstream app_servers {
    server uandinotai-app_1:5000;
    server uandinotai-app_2:5000;
    server uandinotai-app_3:5000;
}
```

## 🚨 Troubleshooting

### Common Issues

**Service startup failures:**
```bash
# Check service logs
docker-compose logs servicename

# Verify environment variables
docker-compose config

# Check disk space
df -h
```

**Database connection issues:**
```bash
# Test database connectivity
docker-compose exec uandinotai-app psql $DATABASE_URL -c "SELECT 1;"

# Check database status
docker-compose exec postgres pg_isready
```

**Photo upload issues:**
```bash
# Check uploads directory permissions
ls -la uploads/
chmod 755 uploads/

# Verify nginx file size limits
docker-compose exec nginx cat /etc/nginx/conf.d/default.conf | grep client_max_body_size
```

**SSL certificate issues:**
```bash
# Check certificate status
openssl x509 -in /etc/letsencrypt/live/yourdomain.com/fullchain.pem -text -noout

# Renew certificates manually
docker run --rm -v /etc/letsencrypt:/etc/letsencrypt certbot/certbot renew

# Restart nginx after renewal
docker-compose restart nginx
```

## 📈 Monitoring and Maintenance

### Daily Maintenance
- Check service health: `docker-compose ps`
- Monitor disk usage: `df -h`
- Review error logs: `docker-compose logs --tail=100 uandinotai-app`

### Weekly Maintenance
- Update system packages: `sudo apt update && sudo apt upgrade`
- Check backup integrity: `ls -la backups/`
- Review performance metrics
- Test SSL certificate renewal

### Monthly Maintenance
- Analyze database performance
- Clean old uploaded files
- Review security logs
- Update application dependencies

## 🔄 Backup and Recovery

### Automated Backups
- Daily PostgreSQL dumps to `./backups/`
- 30-day retention policy
- Compressed storage format
- Backup verification scripts

### Recovery Process
```bash
# Stop application
docker-compose down

# Restore database
docker-compose up -d postgres
docker-compose exec -T postgres psql -U uandinotai -d uandinotai_dating < backups/backup_YYYYMMDD_HHMMSS.sql

# Restore uploaded files
cp -r backup-uploads/* uploads/

# Start application
docker-compose up -d
```

## 📞 Support

For technical support:
1. Check this documentation first
2. Review service logs: `docker-compose logs`
3. Verify environment configuration
4. Test individual service health
5. Contact: uandinotai@gmail.com

## 🎯 Next Steps

After successful deployment:
1. Configure DNS for your domain
2. Set up monitoring dashboards
3. Configure backup storage (S3, etc.)
4. Set up alerting for critical issues
5. Plan scaling strategy for growth

Your U&I Not AI dating app is now fully deployed with Docker infrastructure!

**Access Points:**
- Application: `https://yourdomain.com`
- Admin Dashboard: `https://yourdomain.com/admin`
- Monitoring: `http://yourdomain.com:3000` (Grafana)
- Metrics: `http://yourdomain.com:9090` (Prometheus)

All features including location search, photo uploads, and premium subscriptions are now fully functional.