import { IsString, IsNotEmpty, MinLength, Matches, IsEnum, IsOptional } from 'class-validator';

export class CreateCloudAccountDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Account name must be at least 3 characters long' })
  accountName: string;

  @IsEnum(['AWS'], { message: 'Provider must be AWS' })
  provider: string;

  @IsOptional()
  @IsString()
  @Matches(/^AKIA[A-Z0-9]{16}$/, {
    message: 'Access key must be in valid AWS format (AKIA followed by 16 characters)',
  })
  accessKey?: string;

  @IsOptional()
  @IsString()
  @MinLength(40, { message: 'Secret key must be at least 40 characters long' })
  secretKey?: string;

  @IsOptional()
  @IsString()
  @Matches(/^arn:aws:iam::\d{12}:role\/[\w+=,.@-]+$/, {
    message: 'Role ARN must be a valid AWS IAM Role ARN',
  })
  roleArn?: string;

  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'External ID must be at least 10 characters long' })
  externalId?: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(us|eu|ap|sa|ca|me|af)-(north|south|east|west|central|northeast|southeast|southwest)-[1-3]$/, {
    message: 'Region must be a valid AWS region (e.g., us-east-1)',
  })
  region: string;
}
