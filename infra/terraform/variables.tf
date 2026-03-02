variable "docker_host" {
  description = "Docker daemon socket"
  type        = string
  default     = "npipe:////.//pipe//docker_engine"   # Windows default
}

variable "backend_port" {
  description = "External port for the backend API"
  type        = number
  default     = 3001
}

variable "frontend_port" {
  description = "External port for the frontend"
  type        = number
  default     = 5173
}

variable "environment" {
  description = "Deployment environment (dev, staging, production)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production."
  }
}
