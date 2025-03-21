# Among Us IRL Deployment Guide

This guide outlines the steps to deploy the Among Us IRL application using Docker in both development and production environments.

## Prerequisites

- Docker and Docker Compose installed
- Git repository access
- Basic knowledge of terminal/command line

## Deployment Steps

### 1. Clone the Repository (If Not Already Done)

```bash
git clone https://github.com/your-username/among-us-irl.git
cd among-us-irl
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory by copying the example:

```bash
cp .env.example .env
```

Then edit the `.env` file to set the appropriate values for your environment:
- Set secure database credentials
- Configure a strong JWT secret
- Set up Home Assistant integration (if needed)
- Update the API URL based on your deployment domain

### 3. Local Development Deployment

For local development and testing:

```bash
# Build and start containers in development mode
docker-compose up -d

# View logs
docker-compose logs -f

# Shut down when done
docker-compose down
```

This will start:
- MongoDB database on port 27017
- Backend server on port 4000
- Admin console web app on port 3001
- Player console web app on port 3002

### 4. Production Deployment

For production deployment, use the production configuration:

```bash
# Create a production .env file
cp .env.example .env.production

# Edit .env.production with production values
# - Set NODE_ENV=production
# - Configure real domain names
# - Set strong passwords and secrets

# Deploy with production configuration
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

#### Production Configuration

Create a `docker-compose.prod.yml` file for production overrides:

```yaml
version: '3.8'

services:
  mongo:
    restart: always
    volumes:
      - mongodb_data:/data/db

  server:
    restart: always
    env_file: .env.production
    environment:
      - NODE_ENV=production
    # Use a production-ready process manager
    command: ["npm", "run", "start:prod"]

  admin-console:
    restart: always
    env_file: .env.production
    build:
      args:
        - REACT_APP_API_URL=https://api.your-domain.com
        - REACT_APP_ENV=production
    # Optional: use a CDN or cloud storage for static assets

  player-console:
    restart: always
    env_file: .env.production
    build:
      args:
        - REACT_APP_API_URL=https://api.your-domain.com
        - REACT_APP_ENV=production
```

### 5. Server Configuration (Production)

For production deployment, you'll want to:

1. Set up a proper domain name
2. Configure SSL/TLS certificates (using Let's Encrypt)
3. Use a reverse proxy (Nginx or Traefik) to handle:
   - SSL termination
   - Path routing
   - Load balancing (if deploying multiple instances)

Example nginx configuration:

```nginx
# /etc/nginx/sites-available/among-us-irl

server {
    listen 80;
    server_name amongusirl.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name amongusirl.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/amongusirl.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/amongusirl.yourdomain.com/privkey.pem;

    # API Server
    location /api/ {
        proxy_pass http://localhost:4000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.IO connections
    location /socket.io/ {
        proxy_pass http://localhost:4000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Admin Console
    location /admin/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Player Console (default)
    location / {
        proxy_pass http://localhost:3002/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 6. Database Backups

Set up regular backups for your MongoDB database:

```bash
# Create a backup script
mkdir -p /opt/among-us-irl/backups

cat > /opt/among-us-irl/backup.sh << 'EOL'
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/opt/among-us-irl/backups"
MONGO_CONTAINER="among-us-irl-mongo"
BACKUP_FILE="$BACKUP_DIR/mongodb_$TIMESTAMP.gz"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create MongoDB dump and compress it
docker exec $MONGO_CONTAINER sh -c 'mongodump --authenticationDatabase admin -u $MONGO_INITDB_ROOT_USERNAME -p $MONGO_INITDB_ROOT_PASSWORD --archive' | gzip > $BACKUP_FILE

# Remove backups older than 7 days
find $BACKUP_DIR -type f -name "mongodb_*.gz" -mtime +7 -delete
EOL

chmod +x /opt/among-us-irl/backup.sh

# Add to crontab to run daily
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/among-us-irl/backup.sh") | crontab -
```

### 7. Monitoring and Logging

For production environments, consider adding:

1. Prometheus for metrics collection
2. Grafana for visualization
3. ELK stack (Elasticsearch, Logstash, Kibana) for log management
4. Uptime monitoring service (e.g., UptimeRobot, Pingdom)

Add monitoring to docker-compose by adding services:

```yaml
# Additional monitoring services for docker-compose.prod.yml
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    networks:
      - among-us-network

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    networks:
      - among-us-network
```

### 8. Scaling Considerations

As your Among Us IRL application grows:

1. Consider separating the database to a managed MongoDB service
2. Implement container orchestration with Kubernetes for easier scaling
3. Set up a proper CI/CD pipeline for automated deployments
4. Implement load balancing for high availability

## Troubleshooting

### Container Issues

```bash
# Check container status
docker-compose ps

# View container logs
docker-compose logs -f [service_name]

# Restart a specific service
docker-compose restart [service_name]

# Rebuild containers if needed
docker-compose up -d --build
```

### Database Connection Issues

```bash
# Connect to MongoDB container
docker exec -it among-us-irl-mongo bash

# From inside container, test MongoDB connection
mongo -u $MONGO_INITDB_ROOT_USERNAME -p $MONGO_INITDB_ROOT_PASSWORD --authenticationDatabase admin
```

### API Connection Issues

1. Check that the `REACT_APP_API_URL` environment variable is set correctly
2. Verify the server is running: `curl http://localhost:4000/api/health`
3. Check server logs: `docker-compose logs -f server`

## Testing Deployment

1. Visit the admin console: http://localhost:3001 or https://amongusirl.yourdomain.com/admin/
2. Login with your admin credentials
3. Create a test game
4. Access the player console on a mobile device: http://localhost:3002 or https://amongusirl.yourdomain.com/
5. Join the test game and verify functionality
