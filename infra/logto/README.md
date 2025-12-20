# Logto on DigitalOcean Droplet

This guide sets up Logto on a $6/month DigitalOcean Droplet with Docker.

## URLs

| Service | URL |
|---------|-----|
| Sign-in | `https://auth.staysafeos.com` |
| Admin Console | `https://admin-auth.staysafeos.com` |

## Prerequisites

- DigitalOcean account
- Domain with DNS access

## Step 1: Create Droplet

1. Go to [DigitalOcean](https://cloud.digitalocean.com)
2. Create → Droplets
3. Choose:
   - **Region:** San Francisco (closest to Oregon/Render)
   - **Image:** Docker on Ubuntu (from Marketplace)
   - **Size:** Basic → Regular → $6/mo (1GB RAM, 1 vCPU)
   - **Authentication:** SSH Key (recommended) or Password
   - **Hostname:** `staysafeos-auth`
4. Create Droplet
5. Note the IP address

## Step 2: Point DNS

Add A records in your DNS provider:

```
auth.staysafeos.com        A  <DROPLET_IP>
admin-auth.staysafeos.com  A  <DROPLET_IP>
```

## Step 3: SSH into Droplet

```bash
ssh root@<DROPLET_IP>
```

## Step 4: Setup Commands

Run these commands in order:

```bash
# Update system
apt update && apt upgrade -y

# Install curl (needed for health checks)
apt install -y curl

# Create directory
mkdir -p /opt/logto && cd /opt/logto

# Generate password (SAVE THIS!)
openssl rand -base64 32
```

Create docker-compose.yml (replace `YOUR_PASSWORD` with generated password):

```bash
cat > docker-compose.yml << 'EOF'
version: "3.9"

services:
  logto-db:
    image: postgres:15-alpine
    container_name: logto-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: logto
      POSTGRES_PASSWORD: YOUR_PASSWORD
      POSTGRES_DB: logto
    volumes:
      - logto-db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U logto"]
      interval: 10s
      timeout: 5s
      retries: 5

  logto:
    image: ghcr.io/logto-io/logto:latest
    container_name: logto
    restart: unless-stopped
    depends_on:
      logto-db:
        condition: service_healthy
    environment:
      TRUST_PROXY_HEADER: "1"
      DB_URL: postgres://logto:YOUR_PASSWORD@logto-db:5432/logto
      ENDPOINT: https://auth.staysafeos.com
      ADMIN_ENDPOINT: https://admin-auth.staysafeos.com
    ports:
      - "3001:3001"
      - "3002:3002"
    entrypoint: ["sh", "-c", "npm run cli db seed -- --swe && npm run cli db alteration deploy && npm start"]
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/.well-known/openid-configuration"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  caddy:
    image: caddy:2-alpine
    container_name: caddy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy-data:/data
      - caddy-config:/config
    depends_on:
      - logto

volumes:
  logto-db-data:
  caddy-data:
  caddy-config:
EOF
```

Replace the password (change `PASTE_PASSWORD_HERE`):

```bash
sed -i 's/YOUR_PASSWORD/PASTE_PASSWORD_HERE/g' docker-compose.yml
```

Create Caddyfile:

```bash
cat > Caddyfile << 'EOF'
auth.staysafeos.com {
    reverse_proxy logto:3001
}

admin-auth.staysafeos.com {
    reverse_proxy logto:3002
}
EOF
```

Start services:

```bash
docker-compose up -d
```

Watch logs (wait for "Core app is running"):

```bash
docker-compose logs -f logto
```

Press `Ctrl+C` to exit logs.

## Step 5: Verify

Check all services are running:

```bash
docker-compose ps
```

All 3 services should show "Up".

## Step 6: Access Admin Console

Go to: `https://admin-auth.staysafeos.com`

1. Create your admin account (first visit)
2. Create applications (see below)
3. Create API resource
4. Enable Organizations

## Step 7: Create Applications in Logto

### StaySafeOS Home

- **Type:** Traditional Web → Next.js (App Router)
- **Redirect URI:** `https://staysafeos.com/callback`
- **Post sign-out redirect:** `https://staysafeos.com`

### StaySafeOS App (Multi-tenant)

- **Type:** Traditional Web → Next.js (App Router)
- **Redirect URIs:**
  - `https://*.staysafeos.com/callback` (if wildcards supported)
  - Or add specific ones as needed
- **Post sign-out redirects:**
  - `https://*.staysafeos.com`

### API Resource

- **Name:** StaySafeOS API
- **Identifier:** `https://api.staysafeos.com`

### Organizations

Enable Organizations feature in sidebar for multi-tenancy.

## Step 8: Create Machine-to-Machine Application

For automatic redirect URI management when tenants are created or custom domains are verified:

1. In Logto Admin Console, go to **Applications**
2. Click **Create Application** → **Machine-to-Machine**
3. Name it: `StaySafeOS API M2M`
4. After creation, go to **Machine-to-machine roles**
5. Assign the **Logto Management API - All** role (or create a custom role with `all` scope on Management API)
6. Note the **App ID** and **App Secret**

Also note the **Application ID** of your "StaySafeOS App" application (the one users sign into).

## Step 9: Update Render Environment Variables

In Render dashboard, set for **staysafeos-home**:

- `LOGTO_ENDPOINT`: `https://auth.staysafeos.com`
- `LOGTO_APP_ID`: (from Home app in Logto)
- `LOGTO_APP_SECRET`: (from Home app in Logto)
- `LOGTO_API_RESOURCE`: `https://api.staysafeos.com`

For **staysafeos-app**:

- `LOGTO_ENDPOINT`: `https://auth.staysafeos.com`
- `LOGTO_APP_ID`: (from App app in Logto)
- `LOGTO_APP_SECRET`: (from App app in Logto)
- `LOGTO_API_RESOURCE`: `https://api.staysafeos.com`

For **staysafeos-api**:

- `LOGTO_ENDPOINT`: `https://auth.staysafeos.com`
- `LOGTO_AUDIENCE`: `https://api.staysafeos.com`
- `LOGTO_M2M_APP_ID`: (from M2M app created in Step 8)
- `LOGTO_M2M_APP_SECRET`: (from M2M app created in Step 8)
- `LOGTO_APP_APPLICATION_ID`: (Application ID of StaySafeOS App - the user-facing app)

The M2M credentials enable automatic redirect URI management:
- When a new tenant is created, the subdomain callback is automatically registered
- When a custom domain is verified, its callback is automatically registered
- When a custom domain is deleted, its callback is automatically removed

## Maintenance

### View Logs

```bash
docker-compose logs -f
```

### Update Logto

```bash
cd /opt/logto
docker-compose pull logto
docker-compose up -d
```

### Backup Database

```bash
docker exec logto-db pg_dump -U logto logto > backup-$(date +%Y%m%d).sql
```

### Restore Database

```bash
cat backup.sql | docker exec -i logto-db psql -U logto logto
```

## Troubleshooting

### Check if services are running

```bash
docker-compose ps
```

### Restart services

```bash
docker-compose restart
```

### View specific service logs

```bash
docker-compose logs -f logto
docker-compose logs -f caddy
docker-compose logs -f logto-db
```

### SSL Certificate Issues

Caddy handles SSL automatically. If issues occur:

```bash
docker-compose restart caddy
```

### Reset Logto (start fresh)

```bash
cd /opt/logto
docker-compose down -v
docker-compose up -d
```

## Cost

- **Droplet:** $6/month
- **Total:** $6/month (vs $72+/month for Logto Cloud with Organizations)
