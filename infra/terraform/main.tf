terraform {
  required_version = ">= 1.5"

  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
    }
  }

  # Remote backend (uncomment for team use)
  # backend "s3" {
  #   bucket = "life-gamified-tfstate"
  #   key    = "terraform.tfstate"
  #   region = "us-east-1"
  # }
}

provider "docker" {
  host = var.docker_host
}

# ── Networks ─────────────────────────────────────────────
resource "docker_network" "app_network" {
  name = "life-gamified-network"
}

# ── Backend Container ────────────────────────────────────
resource "docker_image" "backend" {
  name = "life-gamified-backend:latest"
  build {
    context    = "${path.module}/../../backend"
    dockerfile = "Dockerfile"
  }
}

resource "docker_container" "backend" {
  name  = "life-gamified-backend"
  image = docker_image.backend.image_id

  ports {
    internal = 3001
    external = var.backend_port
  }

  env = [
    "NODE_ENV=production",
    "PORT=3001",
    "DB_PATH=/data/life-gamified.db",
  ]

  volumes {
    volume_name    = docker_volume.db_data.name
    container_path = "/data"
  }

  networks_advanced {
    name = docker_network.app_network.name
  }

  restart = "unless-stopped"

  healthcheck {
    test     = ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
    interval = "30s"
    timeout  = "10s"
    retries  = 3
  }
}

# ── Frontend Container ───────────────────────────────────
resource "docker_image" "frontend" {
  name = "life-gamified-frontend:latest"
  build {
    context    = "${path.module}/../../frontend"
    dockerfile = "Dockerfile"
  }
}

resource "docker_container" "frontend" {
  name  = "life-gamified-frontend"
  image = docker_image.frontend.image_id

  ports {
    internal = 80
    external = var.frontend_port
  }

  networks_advanced {
    name = docker_network.app_network.name
  }

  restart    = "unless-stopped"
  depends_on = [docker_container.backend]
}

# ── Volumes ──────────────────────────────────────────────
resource "docker_volume" "db_data" {
  name = "life-gamified-db-data"
}
