# WARNING: as yet untested

# Docs and guides
# Create a single load balancer for all the cloud-run/cloud-functions/app-engine instances
# https://cloud.google.com/blog/topics/developers-practitioners/new-terraform-module-serverless-load-balancing


variable "project_id" {
  type = string
}

variable "region" {
  type = string
  default = "us-central1"
}

variable "fqdn" {
  type = string
}

variable "google_cloud_run_service_api-public" {

}

// Cloud Functions Example
resource "google_compute_region_network_endpoint_group" "default" {
  project           = var.project_id
  name                  = "neg_api-public"
  network_endpoint_type = "SERVERLESS"
  region                = var.region
  cloud_run {
    service = google_cloud_run_service.cloudrun_neg.name
    url_mask = "${var.fqdn}"
  }

}

module "lb-http" {
  source            = "GoogleCloudPlatform/lb-http/google//modules/serverless_negs"
  version           = "~> 4.4"

  project           = var.project_id
  name              = "my-lb"

  ssl                             = true
  managed_ssl_certificate_domains = [var.fqdn]
  https_redirect                  = true
  backends = {
    default = {
      description                     = null
      enable_cdn                      = false
      custom_request_headers          = null
      security_policy                 = null


      log_config = {
        enable = true
        sample_rate = 1.0
      }

      groups = [
        {
          # Your serverless service should have a NEG created that's referenced here.
          group = google_compute_region_network_endpoint_group.default.id
        }
      ]

      iap_config = {
        enable               = false
        oauth2_client_id     = null
        oauth2_client_secret = null
      }
    }
  }
}
