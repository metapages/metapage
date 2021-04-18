##############################################################################################################
# ingress == "https-load-balancer": the lb directs traffic to the cloud-run resource
# https://cloud.google.com/blog/topics/developers-practitioners/new-terraform-module-serverless-load-balancing
##############################################################################################################

# resource "google_compute_region_network_endpoint_group" "default" {
#   count                 = var.ingress == "https-load-balancer" ? 1 : 0
#   project               = var.project_id
#   name                  = "cloudrun-neg"
#   network_endpoint_type = "SERVERLESS"
#   region                = var.region
#   cloud_run {
#     service = google_cloud_run_service.default.name
#   }
# }

##############################################################################################################
# ingress == "domain-map": map the domain DIRECTLY to the cloud-run resource
# Pros:
#   - 💰 reduces costs, no need for a load balancer
# Cons:
#   - slow to set up, DNS can take up to 48 hours
# Unclear which option is less complex
##############################################################################################################
# output "domain_mapping_status" {
#   value = var.ingress == "domain-mapping" ? "${google_cloud_run_domain_mapping.default[0].status}" : []
# }

# output "status" {
#   value = var.ingress == "domain-mapping" ? google_cloud_run_domain_mapping.default[0].status
# }

resource "google_cloud_run_domain_mapping" "default" {
  count    = var.ingress == "domain-mapping" ? 1 : 0
  project  = var.project_id
  location = var.region
  name     = var.fqdn

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
