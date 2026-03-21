terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  # Best Practice: Store state remotely in S3 and lock with DynamoDB
  backend "s3" {
    bucket         = "cleansweep-terraform-state-prod"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
  
  # Automatically tag all resources created by this provider
  default_tags {
    tags = {
      Project     = "CleanSweep"
      Environment = "Production"
      ManagedBy   = "Terraform"
    }
  }
}
