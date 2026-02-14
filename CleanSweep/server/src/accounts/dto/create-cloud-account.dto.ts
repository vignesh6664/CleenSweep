export class CreateCloudAccountDto {
  accountName: string;
  provider: 'AWS' | 'AZURE' | 'GCP';
  accessKey: string;
  secretKey: string;
  region: string;
}
