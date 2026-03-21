variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (e.g., dev, prod)"
  type        = string
  default     = "prod"
}

variable "db_password" {
  description = "Password for the RDS database"
  type        = string
  sensitive   = true # Ensures the value is redacted in terraform CLI output
}
