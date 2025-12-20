# Custom Domains Setup

This guide explains how custom domains work for StaySafeOS tenants.

## Requirements

- Pro or Enterprise subscription tier
- Access to DNS management for the domain

## DNS Configuration

To use a custom domain (e.g., `rides.example.com`), add two DNS records:

### 1. CNAME Record

| Type  | Name                  | Value                  |
|-------|-----------------------|------------------------|
| CNAME | `rides.example.com`   | `proxy.staysafeos.com` |

Or for apex domains (e.g., `example.com`), use an ALIAS/ANAME record if your DNS provider supports it.

### 2. TXT Record (Verification)

| Type | Name                              | Value                                    |
|------|-----------------------------------|------------------------------------------|
| TXT  | `_staysafe-verify.rides.example.com` | `staysafe-verify-{your-token}` |

The verification token is provided in the StaySafeOS dashboard when you add a custom domain.

## Verification Process

1. Add the domain in the StaySafeOS dashboard (Home → Dashboard → Domains)
2. Note the verification token displayed
3. Add both DNS records at your DNS provider
4. Wait for DNS propagation (can take up to 48 hours, usually 5-30 minutes)
5. Click "Verify" in the dashboard

## Troubleshooting

### "DNS verification failed" Error

This means one or both DNS records aren't properly configured. Check:

1. **CNAME not found:**
   - Verify the CNAME record points to `proxy.staysafeos.com` (not `app.staysafeos.com`)
   - Check for typos in the domain name
   - Wait for DNS propagation

2. **TXT not found:**
   - Verify the TXT record name starts with `_staysafe-verify.`
   - Ensure the token matches exactly (no extra spaces)
   - Some DNS providers require escaping special characters

### Testing DNS Records

You can verify your DNS configuration using these commands:

```bash
# Check CNAME record
dig CNAME rides.example.com +short
# Should return: proxy.staysafeos.com.

# Check TXT record
dig TXT _staysafe-verify.rides.example.com +short
# Should return: "staysafe-verify-{your-token}"
```

Or use online tools like [DNS Checker](https://dnschecker.org/).

## How It Works

1. When a user visits `rides.example.com`:
   - DNS resolves to `proxy.staysafeos.com`
   - The proxy routes traffic to the App service
   - The App resolves the tenant from the custom domain

2. When a custom domain is verified:
   - The API automatically registers OAuth redirect URIs in Logto
   - The API automatically adds the domain to the Render App service
   - Users can sign in using the custom domain

3. When a custom domain is deleted:
   - OAuth redirect URIs are automatically removed from Logto
   - The domain is automatically removed from the Render App service

4. When a tenant is deleted:
   - All verified custom domains are removed from both Logto and Render

## SSL Certificates

SSL certificates are automatically provisioned by Render once the domain is added and DNS is properly configured.

## API Environment Variables

The following environment variables must be set on the API service for automatic domain management:

```
# Render API (for custom domain management)
RENDER_API_KEY=rnd_xxxxx           # From Render Dashboard → Account Settings → API Keys
RENDER_APP_SERVICE_ID=srv-xxxxx    # The App service ID (from service URL or API)

# Logto Management API (for OAuth redirect URIs)
LOGTO_M2M_APP_ID=xxxxx             # M2M application ID from Logto
LOGTO_M2M_APP_SECRET=xxxxx         # M2M application secret from Logto
LOGTO_APP_APPLICATION_ID=xxxxx     # StaySafeOS App application ID
```

See `infra/logto/README.md` for Logto M2M setup instructions.
