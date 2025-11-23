# 🚀 Production Deployment Guide - Hotel PMS

## Overview
Complete guide for deploying Hotel PMS to production environment with high availability, security, and performance.

---

## 📋 Pre-Deployment Checklist

### 1. Environment Setup
- [ ] Production server provisioned (8+ CPU, 32+ GB RAM, 500+ GB SSD)
- [ ] Domain name configured
- [ ] SSL certificate obtained
- [ ] Firewall configured
- [ ] Backup solution in place

### 2. Database
- [ ] MongoDB replica set configured (3+ nodes)
- [ ] Database indexes created (`python3 db_optimization.py`)
- [ ] Backup strategy implemented
- [ ] Connection pool optimized

### 3. Redis
- [ ] Redis server installed and configured
- [ ] Redis persistence enabled (AOF + RDB)
- [ ] Redis password set
- [ ] Redis maxmemory policy configured

### 4. Application
- [ ] All environment variables set
- [ ] Dependencies installed
- [ ] Static files built
- [ ] Logs configured
- [ ] Monitoring enabled

---

## 🐳 Docker Deployment

### Dockerfile - Backend
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY backend/ .

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8001

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "4"]
```

### Dockerfile - Frontend
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY frontend/package.json frontend/yarn.lock ./
RUN yarn install --frozen-lockfile

# Build application
COPY frontend/ .
RUN yarn build

# Production image
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    environment:
      - MONGO_URL=mongodb://mongo1:27017,mongo2:27017,mongo3:27017/?replicaSet=rs0
      - REDIS_URL=redis://redis:6379/0
      - DB_NAME=hotel_pms_prod
    depends_on:
      - mongo1
      - redis
    ports:
      - "8001:8001"
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/api/monitoring/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    restart: always

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    restart: always

  mongo1:
    image: mongo:7
    command: mongod --replSet rs0 --bind_ip_all
    volumes:
      - mongo1_data:/data/db
    ports:
      - "27017:27017"
    restart: always

  mongo2:
    image: mongo:7
    command: mongod --replSet rs0 --bind_ip_all
    volumes:
      - mongo2_data:/data/db
    ports:
      - "27018:27017"
    restart: always

  mongo3:
    image: mongo:7
    command: mongod --replSet rs0 --bind_ip_all
    volumes:
      - mongo3_data:/data/db
    ports:
      - "27019:27017"
    restart: always

  celery_worker:
    build:
      context: .
      dockerfile: Dockerfile.backend
    command: celery -A celery_app worker --loglevel=info --concurrency=4
    environment:
      - MONGO_URL=mongodb://mongo1:27017,mongo2:27017,mongo3:27017/?replicaSet=rs0
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - redis
      - mongo1
    restart: always

  celery_beat:
    build:
      context: .
      dockerfile: Dockerfile.backend
    command: celery -A celery_app beat --loglevel=info
    environment:
      - MONGO_URL=mongodb://mongo1:27017,mongo2:27017,mongo3:27017/?replicaSet=rs0
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - redis
      - mongo1
    restart: always

  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - ./alert_rules.yml:/etc/prometheus/alert_rules.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    restart: always

  grafana:
    image: grafana/grafana:latest
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana_dashboard.json:/etc/grafana/provisioning/dashboards/hotel_pms.json
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    restart: always

volumes:
  mongo1_data:
  mongo2_data:
  mongo3_data:
  redis_data:
  prometheus_data:
  grafana_data:
```

---

## ☸️ Kubernetes Deployment

### Deployment YAML
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hotel-pms-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: hotel-pms-backend
  template:
    metadata:
      labels:
        app: hotel-pms-backend
    spec:
      containers:
      - name: backend
        image: hotel-pms-backend:latest
        ports:
        - containerPort: 8001
        env:
        - name: MONGO_URL
          valueFrom:
            secretKeyRef:
              name: hotel-pms-secrets
              key: mongo-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: hotel-pms-secrets
              key: redis-url
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /api/monitoring/health
            port: 8001
          initialDelaySeconds: 30
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /api/monitoring/health
            port: 8001
          initialDelaySeconds: 10
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: hotel-pms-backend-service
spec:
  selector:
    app: hotel-pms-backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8001
  type: LoadBalancer
```

---

## 🔒 Security Configuration

### 1. Environment Variables
```bash
# Production .env file
MONGO_URL="mongodb://user:password@mongo1:27017,mongo2:27017,mongo3:27017/hotel_pms?replicaSet=rs0&authSource=admin"
REDIS_URL="redis://:password@redis:6379/0"
DB_NAME="hotel_pms_prod"
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
CORS_ORIGINS="https://yourdomain.com"
```

### 2. Nginx SSL Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/ssl/certs/fullchain.pem;
    ssl_certificate_key /etc/ssl/private/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:8001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## 📊 Monitoring Setup

### 1. Install Node Exporter
```bash
wget https://github.com/prometheus/node_exporter/releases/download/v1.6.1/node_exporter-1.6.1.linux-amd64.tar.gz
tar xvfz node_exporter-1.6.1.linux-amd64.tar.gz
sudo mv node_exporter-1.6.1.linux-amd64/node_exporter /usr/local/bin/
sudo useradd -rs /bin/false node_exporter

# Create systemd service
sudo tee /etc/systemd/system/node_exporter.service << EOF
[Unit]
Description=Node Exporter
After=network.target

[Service]
User=node_exporter
Group=node_exporter
Type=simple
ExecStart=/usr/local/bin/node_exporter

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl start node_exporter
sudo systemctl enable node_exporter
```

### 2. Install Redis Exporter
```bash
docker run -d \
  --name redis_exporter \
  -p 9121:9121 \
  oliver006/redis_exporter \
  --redis.addr=redis://localhost:6379 \
  --redis.password=your_redis_password
```

### 3. Install MongoDB Exporter
```bash
docker run -d \
  --name mongodb_exporter \
  -p 9216:9216 \
  percona/mongodb_exporter:0.39 \
  --mongodb.uri=mongodb://localhost:27017
```

---

## 🔄 Backup Strategy

### MongoDB Backup
```bash
#!/bin/bash
# backup_mongodb.sh

BACKUP_DIR="/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup
mongodump --uri="mongodb://user:password@localhost:27017/hotel_pms" \
  --out="$BACKUP_DIR/backup_$DATE"

# Compress
tar -czf "$BACKUP_DIR/backup_$DATE.tar.gz" "$BACKUP_DIR/backup_$DATE"
rm -rf "$BACKUP_DIR/backup_$DATE"

# Keep only last 30 days
find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +30 -delete

# Upload to S3 (optional)
# aws s3 cp "$BACKUP_DIR/backup_$DATE.tar.gz" s3://your-bucket/mongodb-backups/
```

### Redis Backup
```bash
#!/bin/bash
# backup_redis.sh

BACKUP_DIR="/backups/redis"
DATE=$(date +%Y%m%d_%H%M%S)

# Copy RDB file
cp /var/lib/redis/dump.rdb "$BACKUP_DIR/dump_$DATE.rdb"

# Compress
gzip "$BACKUP_DIR/dump_$DATE.rdb"

# Keep only last 7 days
find "$BACKUP_DIR" -name "dump_*.rdb.gz" -mtime +7 -delete
```

### Automated Backup with Cron
```bash
# Add to crontab
0 2 * * * /path/to/backup_mongodb.sh
0 3 * * * /path/to/backup_redis.sh
```

---

## 🚀 Deployment Steps

### 1. Initial Setup
```bash
# Clone repository
git clone https://github.com/your-org/hotel-pms.git
cd hotel-pms

# Set environment variables
cp .env.example .env
# Edit .env with production values

# Build Docker images
docker-compose build
```

### 2. Database Initialization
```bash
# Start MongoDB
docker-compose up -d mongo1 mongo2 mongo3

# Initialize replica set
docker exec -it mongo1 mongosh --eval "rs.initiate({
  _id: 'rs0',
  members: [
    {_id: 0, host: 'mongo1:27017'},
    {_id: 1, host: 'mongo2:27017'},
    {_id: 2, host: 'mongo3:27017'}
  ]
})"

# Create indexes
docker-compose run --rm backend python db_optimization.py
```

### 3. Start Services
```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend
```

### 4. Verification
```bash
# Health check
curl https://yourdomain.com/api/monitoring/health

# Test endpoints
curl https://yourdomain.com/api/pms/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📈 Scaling

### Horizontal Scaling
```bash
# Scale backend instances
docker-compose up -d --scale backend=5

# Kubernetes auto-scaling
kubectl autoscale deployment hotel-pms-backend \
  --cpu-percent=70 \
  --min=3 \
  --max=10
```

### Database Scaling
```bash
# Add MongoDB shard
# Add read replicas
# Enable connection pooling
```

---

## 🔧 Troubleshooting

### Common Issues

**Issue**: High memory usage
```bash
# Check container memory
docker stats

# Increase memory limit
docker-compose up -d --scale backend=3 \
  --memory="4g"
```

**Issue**: Slow database queries
```bash
# Run query analyzer
docker-compose exec backend python query_analyzer.py

# Check indexes
docker-compose exec mongo1 mongosh
> use hotel_pms
> db.bookings.getIndexes()
```

**Issue**: Cache not working
```bash
# Check Redis
docker-compose exec redis redis-cli ping

# Check cache stats
curl http://localhost:8001/api/monitoring/health
```

---

## ✅ Post-Deployment Checklist

- [ ] All services running
- [ ] Health checks passing
- [ ] Monitoring dashboards accessible
- [ ] Backups working
- [ ] SSL certificate valid
- [ ] Rate limiting active
- [ ] Logs being collected
- [ ] Alerts configured
- [ ] Documentation updated
- [ ] Team trained

---

**Version**: 1.0.0  
**Last Updated**: 2025-01-20  
**Status**: Production Ready ✅
