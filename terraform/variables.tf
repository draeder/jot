variable "cloudflare_api_token" {
  description = "Cloudflare API token with appropriate permissions"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare account ID"
  type        = string
}

variable "project_name" {
  description = "Name of the Cloudflare Pages project"
  type        = string
  default     = "jot"
}

variable "github_owner" {
  description = "GitHub repository owner"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
  default     = "jot"
}

variable "custom_domain" {
  description = "Custom domain for the application (optional)"
  type        = string
  default     = ""
}

variable "zone_id" {
  description = "Cloudflare zone ID (required if using custom domain)"
  type        = string
  default     = ""
}

variable "web_analytics_tag" {
  description = "Cloudflare Web Analytics tag"
  type        = string
  default     = ""
}

variable "web_analytics_token" {
  description = "Cloudflare Web Analytics token"
  type        = string
  default     = ""
}

# NextAuth configuration
variable "nextauth_secret" {
  description = "NextAuth secret for JWT signing (will be auto-generated if not provided)"
  type        = string
  sensitive   = true
  default     = ""
}

# OAuth provider credentials
variable "google_client_id" {
  description = "Google OAuth client ID"
  type        = string
  sensitive   = true
  default     = ""
}

variable "google_client_secret" {
  description = "Google OAuth client secret"
  type        = string
  sensitive   = true
  default     = ""
}

variable "github_client_id" {
  description = "GitHub OAuth client ID"
  type        = string
  sensitive   = true
  default     = ""
}

variable "github_client_secret" {
  description = "GitHub OAuth client secret"
  type        = string
  sensitive   = true
  default     = ""
}

variable "apple_client_id" {
  description = "Apple OAuth client ID"
  type        = string
  sensitive   = true
  default     = ""
}

variable "apple_client_secret" {
  description = "Apple OAuth client secret"
  type        = string
  sensitive   = true
  default     = ""
}

variable "azure_ad_client_id" {
  description = "Azure AD OAuth client ID"
  type        = string
  sensitive   = true
  default     = ""
}

variable "azure_ad_client_secret" {
  description = "Azure AD OAuth client secret"
  type        = string
  sensitive   = true
  default     = ""
}

variable "azure_ad_tenant_id" {
  description = "Azure AD tenant ID"
  type        = string
  sensitive   = true
  default     = "common"
}

# Security and performance settings
variable "enable_bot_protection" {
  description = "Enable bot protection firewall rules"
  type        = bool
  default     = true
}

variable "enable_rate_limiting" {
  description = "Enable rate limiting for API endpoints"
  type        = bool
  default     = true
}

variable "enable_waf" {
  description = "Enable Web Application Firewall rules"
  type        = bool
  default     = true
}
