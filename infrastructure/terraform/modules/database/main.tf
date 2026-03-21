# Subnet group for RDS (placed in private subnets for security)
resource "aws_db_subnet_group" "main" {
  name       = "cleansweep-${var.environment}-db-subnet-group"
  subnet_ids = var.subnet_ids

  tags = { Name = "cleansweep-${var.environment}-db-subnet-group" }
}

# The actual RDS Instance
resource "aws_db_instance" "main" {
  identifier           = "cleansweep-${var.environment}-db"
  allocated_storage    = 20
  storage_type         = "gp2"
  engine               = "postgres"
  engine_version       = "15.3"
  instance_class       = var.instance_class
  db_name              = var.db_name
  username             = "cleansweep"
  password             = var.db_password
  parameter_group_name = "default.postgres15"
  
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.db.id]
  
  skip_final_snapshot = true # Don't do this in a high-compliance prod, but good for learning/cost
  publicly_accessible = false
}

# Security group that only allows traffic from the App service
resource "aws_security_group" "db" {
  name   = "cleansweep-${var.environment}-db-sg"
  vpc_id = var.vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"] # Only allow traffic from within the VPC
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
