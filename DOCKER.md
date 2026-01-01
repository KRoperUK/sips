# Docker Deployment Guide

This guide explains how to run the Drinking Games app using Docker.

## Prerequisites

- Docker installed on your system
- Docker Compose installed
- Google OAuth credentials (see below)

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd sips
   ```

2. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```

3. **Configure your `.env.local` file**
   - Add your Google OAuth credentials
   - Generate a NextAuth secret: `openssl rand -base64 32`
   - Update `NEXTAUTH_URL` if deploying to production

4. **Build and run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

5. **Access the app**
   - Open your browser to `http://localhost:3000`

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure OAuth consent screen
6. Add authorized origins:
   - `http://localhost:3000` (for local development)
   - `https://yourdomain.com` (for production)
7. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://yourdomain.com/api/auth/callback/google`
8. Copy the Client ID and Client Secret to your `.env.local`

## Docker Commands

### Start the application
```bash
docker-compose up -d
```

### Stop the application
```bash
docker-compose down
```

### View logs
```bash
docker-compose logs -f
```

### Rebuild after code changes
```bash
docker-compose up -d --build
```

### Access container shell
```bash
docker exec -it drinking-games-app sh
```

## Data Persistence

User data, game history, and party information are stored in the `./data` directory, which is mounted as a volume. This ensures data persists across container restarts.

### Backup your data
```bash
tar -czf data-backup-$(date +%Y%m%d).tar.gz data/
```

### Restore from backup
```bash
tar -xzf data-backup-YYYYMMDD.tar.gz
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | Yes |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | Yes |
| `NEXTAUTH_URL` | Full URL of your application | Yes |
| `NEXTAUTH_SECRET` | Random secret for NextAuth | Yes |

## Production Deployment

For production deployment:

1. **Update environment variables**
   - Set `NEXTAUTH_URL` to your production domain
   - Use production Google OAuth credentials

2. **Use a reverse proxy (recommended)**
   ```yaml
   # Add to docker-compose.yml
   nginx:
     image: nginx:alpine
     ports:
       - "80:80"
       - "443:443"
     volumes:
       - ./nginx.conf:/etc/nginx/nginx.conf
       - ./certs:/etc/nginx/certs
     depends_on:
       - app
   ```

3. **Enable HTTPS**
   - Use Let's Encrypt for SSL certificates
   - Update OAuth redirect URIs to use HTTPS

## Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs app

# Verify environment variables
docker-compose config
```

### Data directory permissions
```bash
# Fix permissions
sudo chown -R 1001:1001 ./data
```

### Port already in use
```bash
# Change port in docker-compose.yml
ports:
  - "3001:3000"  # Use 3001 instead of 3000
```

### Clear all data and restart
```bash
docker-compose down -v
rm -rf data/
docker-compose up -d
```

## Health Check

The container includes a health check that pings the app every 30 seconds. Check status with:

```bash
docker ps
# Look for "healthy" status
```

## Support

For issues or questions, please open an issue on GitHub.
