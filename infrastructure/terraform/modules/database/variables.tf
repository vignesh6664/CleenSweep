variable "environment" {}
variable "vpc_id" {}
variable "subnet_ids" { type = list(string) }
variable "db_name" {}
variable "instance_class" {}
variable "db_password" {}
