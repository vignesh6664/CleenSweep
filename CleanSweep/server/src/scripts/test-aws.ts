import { EC2Client, DescribeRegionsCommand } from '@aws-sdk/client-ec2';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testAWSConnectivity() {
  try {
    console.log('🔍 Testing AWS Connectivity...\n');

    // Create EC2 client with credentials from environment
    const client = new EC2Client({
      region: 'us-east-1', // Default region for API calls
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY || '',
        secretAccessKey: process.env.AWS_SECRET_KEY || '',
      },
    });

    console.log('📡 Fetching available AWS regions...\n');

    // Execute DescribeRegions command
    const command = new DescribeRegionsCommand({});
    const response = await client.send(command);

    // Print results
    if (response.Regions && response.Regions.length > 0) {
      console.log(`✅ Successfully connected to AWS!`);
      console.log(`📍 Found ${response.Regions.length} regions:\n`);

      response.Regions.forEach((region, index) => {
        console.log(
          `${index + 1}. ${region.RegionName} - ${region.Endpoint || 'N/A'}`,
        );
      });
    } else {
      console.log('⚠️  No regions found.');
    }
  } catch (error) {
    console.error('❌ Error connecting to AWS:');
    console.error(error);
    process.exit(1);
  }
}

testAWSConnectivity();
