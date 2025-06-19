# Terraform validation and lifecycle rules

# Validation rules for critical variables
variable "validation_rules" {
  description = "Validation rules for deployment"
  type = object({
    require_api_token    = bool
    require_account_id   = bool
    require_github_owner = bool
  })
  default = {
    require_api_token    = true
    require_account_id   = true
    require_github_owner = true
  }
}

# Validate Cloudflare API token format
locals {
  api_token_valid = can(regex("^[A-Za-z0-9_-]{40}$", var.cloudflare_api_token))
  account_id_valid = can(regex("^[a-f0-9]{32}$", var.cloudflare_account_id))
  
  # Validation messages
  validation_errors = compact([
    var.cloudflare_api_token == "" ? "cloudflare_api_token is required" : null,
    var.cloudflare_account_id == "" ? "cloudflare_account_id is required" : null,
    var.github_owner == "" ? "github_owner is required" : null,
    !local.api_token_valid && var.cloudflare_api_token != "" ? "cloudflare_api_token format is invalid" : null,
    !local.account_id_valid && var.cloudflare_account_id != "" ? "cloudflare_account_id format is invalid" : null,
    var.custom_domain != "" && var.zone_id == "" ? "zone_id is required when using custom_domain" : null
  ])
  
  # OAuth provider validation
  oauth_providers_configured = compact([
    var.google_client_id != "" && var.google_client_secret != "" ? "google" : null,
    var.github_client_id != "" && var.github_client_secret != "" ? "github" : null,
    var.apple_client_id != "" && var.apple_client_secret != "" ? "apple" : null,
    var.azure_ad_client_id != "" && var.azure_ad_client_secret != "" ? "azure_ad" : null
  ])
  
  # Deployment readiness checks
  deployment_ready = length(local.validation_errors) == 0 && length(local.oauth_providers_configured) > 0
}

# Create a null resource for validation that runs during plan
resource "null_resource" "validation" {
  count = 0  # Temporarily disabled
  
  triggers = {
    validation_errors = join("\n", local.validation_errors)
  }
  
  lifecycle {
    precondition {
      condition     = length(local.validation_errors) == 0
      error_message = "Validation failed:\n${join("\n", local.validation_errors)}"
    }
  }
}

# Validation output for debugging
output "validation_status" {
  description = "Validation status and configuration summary"
  sensitive   = true
  value = {
    validation_passed = length(local.validation_errors) == 0
    validation_errors = local.validation_errors
    oauth_providers_configured = local.oauth_providers_configured
    deployment_ready = local.deployment_ready
    nextauth_secret_auto_generated = var.nextauth_secret == ""
  }
}

# Pre-deployment checks
check "required_variables" {
  assert {
    condition     = var.cloudflare_api_token != ""
    error_message = "Cloudflare API token is required. Set cloudflare_api_token in terraform.tfvars"
  }
  
  assert {
    condition     = var.cloudflare_account_id != ""
    error_message = "Cloudflare account ID is required. Set cloudflare_account_id in terraform.tfvars"
  }
  
  assert {
    condition     = var.github_owner != ""
    error_message = "GitHub owner is required. Set github_owner in terraform.tfvars"
  }
}

check "oauth_configuration" {
  assert {
    condition     = length(local.oauth_providers_configured) > 0
    error_message = "At least one OAuth provider must be configured with both client_id and client_secret"
  }
}

check "custom_domain_configuration" {
  assert {
    condition     = var.custom_domain == "" || var.zone_id != ""
    error_message = "zone_id is required when using a custom domain"
  }
}
