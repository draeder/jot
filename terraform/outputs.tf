output "pages_project_name" {
  description = "The name of the Cloudflare Pages project"
  value       = cloudflare_pages_project.jot.name
}

output "pages_project_subdomain" {
  description = "The subdomain of the Cloudflare Pages project"
  value       = cloudflare_pages_project.jot.subdomain
}

output "pages_project_domains" {
  description = "The domains associated with the Cloudflare Pages project"
  value       = cloudflare_pages_project.jot.domains
}

output "production_url" {
  description = "The production URL of the application"
  value       = local.production_url
}

output "preview_url" {
  description = "The preview URL of the application"
  value       = local.preview_url
}

output "project_id" {
  description = "The ID of the Cloudflare Pages project"
  value       = cloudflare_pages_project.jot.id
}

output "custom_domain" {
  description = "Custom domain (if configured)"
  value       = var.custom_domain != "" ? var.custom_domain : null
}

output "nextauth_secret_generated" {
  description = "Whether NextAuth secret was auto-generated"
  value       = var.nextauth_secret == "" ? true : false
  sensitive   = true
}

output "oauth_redirect_urls" {
  description = "OAuth redirect URLs to configure in your OAuth applications"
  value = {
    production = "${local.production_url}/api/auth/callback"
    preview    = "${local.preview_url}/api/auth/callback"
  }
}

output "deployment_info" {
  description = "Deployment information and next steps"
  value = {
    status = "✅ Terraform deployment completed successfully!"
    next_steps = [
      "1. Update OAuth application redirect URIs with the URLs above",
      "2. Test authentication with your configured providers", 
      "3. Monitor deployment in Cloudflare Pages dashboard",
      "4. Set up custom domain DNS if using a custom domain"
    ]
    dashboard_url = "https://dash.cloudflare.com/pages/view/${cloudflare_pages_project.jot.name}"
  }
}
