output "backend_url" {
  description = "URL for the backend API"
  value       = "http://localhost:${var.backend_port}"
}

output "frontend_url" {
  description = "URL for the frontend app"
  value       = "http://localhost:${var.frontend_port}"
}

output "network_name" {
  description = "Docker network name"
  value       = docker_network.app_network.name
}
