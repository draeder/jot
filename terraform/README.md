# Jot Cloudflare Pages Deployment

This Terraform configuration deploys your Jot application to Cloudflare Pages with full authentication integration and security features.

## Features

- 🚀 **Automated Deployment**: Complete Cloudflare Pages setup via Terraform
- 🔐 **Multi-Provider Auth**: Google, GitHub, Apple, and Azure AD OAuth integration
- 🛡️ **Security Features**: Bot protection, WAF rules, and SSL enforcement
- 🌐 **Custom Domains**: Automatic DNS configuration for custom domains
- 📊 **Analytics**: Cloudflare Web Analytics integration
- 🔄 **Auto-Generated Secrets**: NextAuth secrets generated automatically if not provided

## Prerequisites

1. **Terraform**: Install Terraform CLI
   ```bash
   # macOS
   brew install terraform
   
   # Other platforms: https://www.terraform.io/downloads
   ```

2. **Cloudflare Account**: You need:
   - Cloudflare account with Pages access
   - API token with appropriate permissions
   - Account ID from your Cloudflare dashboard

3. **OAuth Applications**: Set up OAuth apps for your chosen providers:
   - Google: [Google Cloud Console](https://console.cloud.google.com/)
   - GitHub: [GitHub Developer Settings](https://github.com/settings/developers)
   - Apple: [Apple Developer Portal](https://developer.apple.com/)
   - Azure: [Azure App Registrations](https://portal.azure.com/)

## Quick Start

1. **Copy the example configuration**:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

2. **Edit `terraform.tfvars`** with your values:
   ```hcl
   # Required
   cloudflare_api_token    = "your-cloudflare-api-token"
   cloudflare_account_id   = "your-account-id"
   github_owner           = "your-github-username"
   
   # OAuth providers (add only what you need)
   google_client_id       = "your-google-client-id"
   google_client_secret   = "your-google-client-secret"
   # ... other providers
   ```

3. **Deploy**:
   ```bash
   terraform init
   terraform plan
   terraform apply
   ```

4. **Get deployment info**:
   ```bash
   terraform output
   ```

## Configuration

### Required Variables

| Variable | Description |
|----------|-------------|
| `cloudflare_api_token` | Cloudflare API token with Pages permissions |
| `cloudflare_account_id` | Your Cloudflare account ID |
| `github_owner` | GitHub repository owner |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `project_name` | `"jot"` | Cloudflare Pages project name |
| `github_repo` | `"jot"` | GitHub repository name |
| `custom_domain` | `""` | Custom domain for your app |
| `nextauth_secret` | `""` | NextAuth secret (auto-generated if empty) |
| `enable_bot_protection` | `true` | Enable firewall bot protection |

### OAuth Provider Variables

All OAuth provider variables are optional. Configure only the providers you want to use:

```hcl
# Google OAuth
google_client_id     = "your-google-client-id"
google_client_secret = "your-google-client-secret"

# GitHub OAuth  
github_client_id     = "your-github-client-id"
github_client_secret = "your-github-client-secret"

# Apple OAuth
apple_client_id      = "your-apple-client-id"
apple_client_secret  = "your-apple-client-secret"

# Azure AD OAuth
azure_ad_client_id     = "your-azure-client-id"
azure_ad_client_secret = "your-azure-client-secret"
azure_ad_tenant_id     = "your-tenant-id"  # defaults to "common"
```

## Custom Domain Setup

To use a custom domain:

1. **Add domain to your configuration**:
   ```hcl
   custom_domain = "your-domain.com"
   zone_id      = "your-cloudflare-zone-id"  # if domain is on Cloudflare
   ```

2. **Apply the configuration**:
   ```bash
   terraform apply
   ```

3. **Update DNS** (if domain is not on Cloudflare):
   - Create a CNAME record pointing to `your-project.pages.dev`

## OAuth Setup

After deployment, you'll get redirect URLs in the Terraform output. Configure these in your OAuth applications:

### Google Cloud Console
1. Go to APIs & Services > Credentials
2. Edit your OAuth 2.0 client
3. Add authorized redirect URIs:
   - `https://your-domain.com/api/auth/callback/google`
   - `https://your-project.pages.dev/api/auth/callback/google`

### GitHub Developer Settings
1. Go to Settings > Developer settings > OAuth Apps
2. Edit your OAuth app
3. Set Authorization callback URL:
   - `https://your-domain.com/api/auth/callback/github`

### Apple Developer Portal
1. Go to Certificates, Identifiers & Profiles
2. Edit your App ID configuration
3. Add return URLs in Sign In with Apple configuration

### Azure App Registrations
1. Go to Azure Portal > App registrations
2. Edit your app registration
3. Add redirect URIs in Authentication settings

## Security Features

The Terraform configuration includes:

- **SSL/TLS**: Strict SSL enforcement
- **Bot Protection**: Automatic bad bot blocking
- **HTTPS Redirect**: Always use HTTPS
- **Browser Integrity**: Check browser integrity
- **Rate Limiting**: Configurable rate limiting (optional)

## Commands

```bash
# Initialize Terraform
terraform init

# Check what will be changed
terraform plan

# Apply changes
terraform apply

# Show current state
terraform show

# Show outputs
terraform output

# Destroy infrastructure (careful!)
terraform destroy
```
