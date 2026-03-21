module "vpc" {
  source = "../../modules/vpc"

  environment        = var.environment
  vpc_cidr           = "10.0.0.0/16"
  public_subnets     = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnets    = ["10.0.10.0/24", "10.0.20.0/24"]
  availability_zones = ["${var.aws_region}a", "${var.aws_region}b"]
}

module "database" {
  source = "../../modules/database"

  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.private_subnet_ids
  db_name            = "cleansweep_prod"
  instance_class     = "db.t4g.micro"
  
  # The password should be passed securely via AWS Secrets Manager in a real scenario
  db_password        = var.db_password 
}

module "ecs_cluster" {
  source = "../../modules/compute"

  environment          = var.environment
  vpc_id               = module.vpc.vpc_id
  public_subnet_ids    = module.vpc.public_subnet_ids
  private_subnet_ids   = module.vpc.private_subnet_ids
  db_endpoint          = module.database.endpoint
}
