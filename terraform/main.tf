terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
    time = {
      source  = "hashicorp/time"
      version = "~> 0.9"
    }
  }
  required_version = ">= 1.0"
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# Generate a random secret for NextAuth if not provided
resource "random_password" "nextauth_secret" {
  count   = var.nextauth_secret == "" ? 1 : 0
  length  = 32
  special = true
}

# Local values for computed configurations
locals {
  nextauth_secret = var.nextauth_secret != "" ? var.nextauth_secret : random_password.nextauth_secret[0].result
  production_url  = var.custom_domain != "" ? "https://${var.custom_domain}" : "https://${var.project_name}.pages.dev"
  preview_url     = "https://${var.project_name}.pages.dev"
  
  # Environment variables for all environments
  base_env_vars = {
    NODE_ENV        = "production"
    NEXTAUTH_SECRET = local.nextauth_secret
  }
  
  # Secrets for OAuth providers
  oauth_secrets = {
    GOOGLE_CLIENT_ID       = var.google_client_id
    GOOGLE_CLIENT_SECRET   = var.google_client_secret
    GITHUB_CLIENT_ID       = var.github_client_id
    GITHUB_CLIENT_SECRET   = var.github_client_secret
    APPLE_CLIENT_ID        = var.apple_client_id
    APPLE_CLIENT_SECRET    = var.apple_client_secret
    AZURE_AD_CLIENT_ID     = var.azure_ad_client_id
    AZURE_AD_CLIENT_SECRET = var.azure_ad_client_secret
    AZURE_AD_TENANT_ID     = var.azure_ad_tenant_id
  }
}

# Cloudflare Pages project
resource "cloudflare_pages_project" "jot" {
  account_id        = var.cloudflare_account_id
  name              = var.project_name
  production_branch = "main"

  build_config {
    build_command       = "npm run build"
    destination_dir     = ".next"
    root_dir           = ""
    web_analytics_tag  = var.web_analytics_tag
    web_analytics_token = var.web_analytics_token
  }

  # NOTE: Source configuration commented out - add GitHub integration manually via dashboard
  # source {
  #   type = "github"
  #   config {
  #     owner                         = var.github_owner
  #     repo_name                    = var.github_repo
  #     production_branch            = "main"
  #     pr_comments_enabled          = true
  #     deployments_enabled          = true
  #     production_deployment_enabled = true
  #     preview_deployment_setting   = "custom"
  #     preview_branch_includes      = ["*"]
  #     preview_branch_excludes      = ["main"]
  #   }
  # }

  deployment_configs {
    preview {
      environment_variables = merge(local.base_env_vars, {
        NEXTAUTH_URL = local.preview_url
      })
      
      secrets = local.oauth_secrets
    }

    production {
      environment_variables = merge(local.base_env_vars, {
        NEXTAUTH_URL = local.production_url
      })
      
      secrets = local.oauth_secrets
    }
  }
}

# Custom domain (optional)
resource "cloudflare_pages_domain" "jot_domain" {
  count      = var.custom_domain != "" ? 1 : 0
  account_id = var.cloudflare_account_id
  project_name = cloudflare_pages_project.jot.name
  domain     = var.custom_domain
}

# DNS record for custom domain (if using a domain managed by Cloudflare)
resource "cloudflare_record" "jot_cname" {
  count   = var.custom_domain != "" && var.zone_id != "" ? 1 : 0
  zone_id = var.zone_id
  name    = var.custom_domain
  content = "${var.project_name}.pages.dev"
  type    = "CNAME"
  proxied = true
}

# Wait for the Pages project to be ready before setting up domain
resource "time_sleep" "wait_for_pages" {
  depends_on = [cloudflare_pages_project.jot]
  create_duration = "30s"
}

# Page rules for better performance and security
resource "cloudflare_page_rule" "jot_security" {
  count    = var.zone_id != "" ? 1 : 0
  zone_id  = var.zone_id
  target   = "${var.custom_domain != "" ? var.custom_domain : "${var.project_name}.pages.dev"}/*"
  priority = 1

  actions {
    security_level = "medium"
    ssl           = "strict"
    always_use_https = true
  }

  depends_on = [time_sleep.wait_for_pages]
}

# Bot protection using modern ruleset (replaces deprecated filter/firewall_rule)
resource "cloudflare_ruleset" "jot_bot_protection" {
  count   = var.zone_id != "" && var.enable_bot_protection ? 1 : 0
  zone_id = var.zone_id
  name    = "Jot Bot Protection"
  description = "Block known bad bots from Jot app"
  kind    = "zone"
  phase   = "http_request_firewall_custom"

  rules {
    action = "block"
    description = "Block bad bots"
    expression = "(cf.client.bot and not cf.verified_bot)"
    enabled = true
  }
}
