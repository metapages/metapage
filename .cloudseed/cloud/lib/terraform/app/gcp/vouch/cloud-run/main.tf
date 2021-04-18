# terraform gcp cloud run service. it's nice.
# https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/cloud_run_service

variable "project_id" {
  type = string
}

variable "image" {
  type = string
}

variable "region" {
  type = string
  default = "us-central1"
}

variable "fqdn" {
  type = string
}

variable "oauth_client_id" {
  type = string
}

variable "oauth_client_secret" {
  type = string
}

locals {
  version = element(split(":", var.image), length(split(":", var.image)) - 1)
  name = "vouch-${local.version}"
}


output "status" {
  value = google_cloud_run_domain_mapping.default.status
}

# Return service URL
output "url" {
  value = google_cloud_run_service.default.status[0].url
}

resource "google_cloud_run_domain_mapping" "default" {
  project  = var.project_id
  location = var.region
  name     = "oauth.${var.fqdn}"

  metadata {
    namespace = var.project_id
    annotations = {
      "run.googleapis.com/launch-stage" = "BETA"
    }
  }

  spec {
    # force_override = true
    route_name = google_cloud_run_service.default.name
  }

  lifecycle {
    ignore_changes = [
      # Ignore changes to status, since slow domain mappings may change status after apply
      metadata,
    ]
  }
}

resource "random_password" "password" {
  length = 44
  special = true
  override_special = "_%@"
}

# Deploy image to Cloud Run
# https://cloud.google.com/run/docs/reference/container-contract
resource "google_cloud_run_service" "default" {
  project = var.project_id
  name     = "vouch"
  location = var.region

  template {
    metadata {
      name = local.name
    }
    spec {
      containers {
        image = var.image
        env {
          name = "VOUCH_PORT"
          value = "9090"
        }
        env {
          name = "VOUCH_JWT_SECRET"
          value = random_password.password.result
        }
        env {
          name = "VOUCH_ALLOWALLUSERS"
          value = "true"
        }
        env {
          name = "VOUCH_JWT_MAXAGE"
          value = "2"
        }
        env {
          name = "VOUCH_COOKIE_NAME"
          value = "${var.fqdn}_OAuthCookie"
        }
        env {
          name = "VOUCH_COOKIE_DOMAIN"
          value = var.fqdn
        }
        env {
          name = "VOUCH_COOKIE_SECURE"
          value = "true"
        }
        env {
          name = "VOUCH_COOKIE_MAXAGE"
          value = "0"
        }
        env {
          name = "VOUCH_HEADERS_CLAIMS"
          value = "email, picture"
        }
        env {
          name = "OAUTH_PROVIDER"
          value = "google"
        }
        env {
          name = "OAUTH_CLIENT_ID"
          value = var.oauth_client_id
        }
        env {
          name = "OAUTH_CLIENT_SECRET"
          value = var.oauth_client_secret
        }
        env {
          name = "OAUTH_CALLBACK_URL"
          value = "https://oauth.${var.fqdn}/auth"
        }
        env {
          name = "VOUCH_POST_LOGOUT_REDIRECT_URIS"
          value = "https://${var.fqdn},https://${var.fqdn}/login"
        }
        ports {
          container_port = 9090
        }
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  lifecycle {
    ignore_changes = [
      # Ignore changes to status, since slow domain mappings may change status after apply
      status,
    ]
  }
}

# Create public access
data "google_iam_policy" "noauth" {
  binding {
    role = "roles/run.invoker"
    members = [
      "allUsers",
    ]
  }
}

# Enable public access on Cloud Run service
resource "google_cloud_run_service_iam_policy" "noauth" {
  location    = google_cloud_run_service.default.location
  project     = google_cloud_run_service.default.project
  service     = google_cloud_run_service.default.name
  policy_data = data.google_iam_policy.noauth.policy_data
}
