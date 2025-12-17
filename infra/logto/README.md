# Logto on DigitalOcean Droplet

This guide sets up Logto on a $6/month DigitalOcean Droplet with Docker.

## Prerequisites

- DigitalOcean account
- Domain pointing to `auth.staysafeos.com`

## Step 1: Create Droplet

1. Go to [DigitalOcean](https://cloud.digitalocean.com)
2. Create → Droplets
3. Choose:
   - **Region:** San Francisco (closest to Oregon/Render)
   - **Image:** Docker on Ubuntu (from Marketplace)
   - **Size:** Basic → Regular → $6/mo (1GB RAM, 1 vCPU)
   - **Authentication:** SSH Key (recommended) or Password
   - **Hostname:** `logto-staysafeos`
4. Create Droplet
5. Note the IP address

## Step 2: Point DNS

Add an A record in your DNS provider:

```
auth.staysafeos.com  A  <DROPLET_IP>
```

## Step 3: SSH into Droplet

```bash
ssh root@<DROPLET_IP>
```

## Step 4: Create Docker Compose File

```bash
mkdir -p /opt/logto && cd /opt/logto
nano docker-compose.yml
```

Paste this content:

```yaml
version: "3.9"

services:
  logto-db:
    image: postgres:15-alpine
    container_name: logto-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: logto
      POSTGRES_PASSWORD: <GENERATE_STRONG_PASSWORD>
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
      DB_URL: postgres://logto:<SAME_PASSWORD>@logto-db:5432/logto
      ENDPOINT: https://auth.staysafeos.com
      ADMIN_ENDPOINT: https://auth.staysafeos.com
    ports:
      - "3001:3001" # Core
      - "3002:3002" # Admin
    entrypoint:
      [
        "sh",
        "-c",
        "npm run cli db seed -- --swe && npm run cli db alteration deploy && npm start",
      ]

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
```

**Important:** Replace `<GENERATE_STRONG_PASSWORD>` with a secure password (use `openssl rand -base64 32`).

## Step 5: Create Caddyfile

```bash
nano Caddyfile
```

cat > Caddyfile << 'EOF'
auth.staysafeos.com {
reverse_proxy logto:3001
}

admin-auth.staysafeos.com {
reverse_proxy logto:3002
}
EOF

Paste:

```
auth.staysafeos.com {
    # Main app (sign-in experience)
    reverse_proxy /api/* logto:3001
    reverse_proxy /.well-known/* logto:3001
    reverse_proxy /oidc/* logto:3001
    reverse_proxy /consent/* logto:3001
    reverse_proxy /sign-in/* logto:3001
    reverse_proxy /sign-out/* logto:3001
    reverse_proxy /register/* logto:3001
    reverse_proxy /callback/* logto:3001
    reverse_proxy /interaction/* logto:3001

    # Admin console
    reverse_proxy /console/* logto:3002

    # Default to core app
    reverse_proxy * logto:3001
}
```

## Step 6: Start Services

```bash
docker compose up -d
```

Check logs:

```bash
docker compose logs -f logto
```

## Step 7: Access Admin Console

Go to: `https://auth.staysafeos.com/console`

1. Create your admin account
2. Create applications:
   - **StaySafeOS Home** (Traditional Web)
     - Redirect URI: `https://home.staysafeos.com/callback`
     - Post sign-out: `https://home.staysafeos.com`
   - **StaySafeOS App** (Traditional Web)
     - Redirect URI: `https://app.staysafeos.com/callback`
     - Post sign-out: `https://app.staysafeos.com`
3. Create API Resource:
   - Name: `StaySafeOS API`
   - Identifier: `https://api.staysafeos.com`
4. Enable Organizations (for multi-tenancy)

## Step 8: Update Render Environment Variables

In Render dashboard, set for **staysafeos-home** and **staysafeos-app**:

- `LOGTO_ENDPOINT`: `https://auth.staysafeos.com`
- `LOGTO_APP_ID`: (from Logto Console)
- `LOGTO_APP_SECRET`: (from Logto Console)
- `LOGTO_API_RESOURCE`: `https://api.staysafeos.com`

For **staysafeos-api**:

- `LOGTO_ENDPOINT`: `https://auth.staysafeos.com`
- `LOGTO_AUDIENCE`: `https://api.staysafeos.com`

## Maintenance

### View Logs

```bash
docker compose logs -f
```

### Update Logto

```bash
docker compose pull logto
docker compose up -d
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
docker compose ps
```

### Restart services

```bash
docker compose restart
```

### View specific service logs

```bash
docker compose logs -f logto
docker compose logs -f caddy
docker compose logs -f logto-db
```

### SSL Certificate Issues

Caddy handles SSL automatically. If issues occur:

```bash
docker compose restart caddy
```

## Cost

- **Droplet:** $6/month
- **Total:** $6/month (vs $72+/month for Logto Cloud with Organizations)
