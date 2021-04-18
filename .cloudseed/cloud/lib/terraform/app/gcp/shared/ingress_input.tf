variable "ingress" {
  type        = string
  description = "How do incoming public requests get routed to services. One of [load-balancer|domain-mapping]"

  validation {
    condition     = var.ingress == "load-balancer" || var.ingress == "domain-mapping"
    error_message = "Is \"ingress\" one of [load-balancer|domain-mapping]?"
  }
}
