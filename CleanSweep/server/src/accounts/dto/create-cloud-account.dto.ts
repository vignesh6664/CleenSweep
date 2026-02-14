import { IsString, IsNotEmpty, MinLength, Matches, IsEnum } from 'class-validator';

export class CreateCloudAccountDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Account name must be at least 3 characters long' })
  accountName: string;

  @IsEnum(['AWS'], { message: 'Provider must be AWS' })
  provider: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^AKIA[A-Z0-9]{16}$/, {
    message: 'Access key must be in valid AWS format (AKIA followed by 16 characters)',
  })
  accessKey: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(40, { message: 'Secret key must be at least 40 characters long' })
  secretKey: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(us|eu|ap|sa|ca|me|af)-(north|south|east|west|central|northeast|southeast|southwest)-[1-3]$/, {
    message: 'Region must be a valid AWS region (e.g., us-east-1)',
  })
  region: string;
}
