# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "cleansweep-${var.environment}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# IAM Role for Task Execution (to pull from ECR and log to CloudWatch)
resource "aws_iam_role" "ecs_task_execution_role" {
  name = "cleansweep-${var.environment}-task-exec-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

# Policy Attachment for CloudWatch Logs and ECR Pulls
resource "aws_iam_role_policy_attachment" "ecs_task_execution_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}
