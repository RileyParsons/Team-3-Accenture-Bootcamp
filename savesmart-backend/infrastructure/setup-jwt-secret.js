/**
 * JWT Secret Setup Script
 *
 * This script generates and stores a JWT secret in AWS Systems Manager Parameter Store:
 * - Generates a random 256-bit secret (base64 encoded)
 * - Stores the secret as a SecureString parameter
 * - Parameter name: /savesmart/jwt-secret
 *
 * Usage:
 *   node setup-jwt-secret.js
 *
 * Requirements:
 *   - AWS credentials configured (via AWS CLI or environment variables)
 *   - Appropriate IAM permissions for SSM Parameter Store (ssm:PutParameter, ssm:GetParameter)
 */

import { SSMClient, PutParameterCommand, GetParameterCommand } from "@aws-sdk/client-ssm";
import { randomBytes } from "crypto";

const client = new SSMClient({ region: "ap-southeast-2" });
const PARAMETER_NAME = "/savesmart/jwt-secret";

/**
 * Generate a random 256-bit secret
 */
function generateSecret() {
  // Generate 32 bytes (256 bits) of random data
  const secret = randomBytes(32);
  // Encode as base64 for storage
  return secret.toString("base64");
}

/**
 * Store the secret in Parameter Store
 */
async function storeSecret(secret) {
  console.log(`\n🔐 Storing JWT secret in Parameter Store...`);
  console.log(`   Parameter: ${PARAMETER_NAME}`);

  try {
    // First, try to create the parameter with tags
    try {
      const command = new PutParameterCommand({
        Name: PARAMETER_NAME,
        Value: secret,
        Type: "SecureString",
        Description: "JWT signing secret for SaveSmart authentication",
        Tags: [
          { Key: "Project", Value: "SaveSmart" },
          { Key: "Environment", Value: "Production" },
          { Key: "Feature", Value: "Authentication" }
        ]
      });

      await client.send(command);
      console.log(`✅ JWT secret stored successfully (new parameter created)`);

    } catch (error) {
      // If parameter already exists, update it without tags
      if (error.name === "ParameterAlreadyExists") {
        console.log(`   Parameter already exists, updating...`);
        const updateCommand = new PutParameterCommand({
          Name: PARAMETER_NAME,
          Value: secret,
          Type: "SecureString",
          Description: "JWT signing secret for SaveSmart authentication",
          Overwrite: true
        });

        await client.send(updateCommand);
        console.log(`✅ JWT secret updated successfully`);
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error(`❌ Error storing secret:`, error.message);
    throw error;
  }
}

/**
 * Verify the secret was stored correctly
 */
async function verifySecret() {
  console.log(`\n🔍 Verifying secret storage...`);

  try {
    const command = new GetParameterCommand({
      Name: PARAMETER_NAME,
      WithDecryption: true
    });

    const response = await client.send(command);

    if (response.Parameter && response.Parameter.Value) {
      console.log(`✅ Secret verified successfully`);
      console.log(`   Parameter Name: ${response.Parameter.Name}`);
      console.log(`   Parameter Type: ${response.Parameter.Type}`);
      console.log(`   Secret Length: ${response.Parameter.Value.length} characters`);
      console.log(`   Last Modified: ${response.Parameter.LastModifiedDate}`);

      // Verify it's a valid base64 string
      const buffer = Buffer.from(response.Parameter.Value, "base64");
      console.log(`   Decoded Length: ${buffer.length} bytes (${buffer.length * 8} bits)`);

      if (buffer.length === 32) {
        console.log(`✅ Secret is correctly formatted (256-bit)`);
      } else {
        console.warn(`⚠️  Warning: Secret is ${buffer.length * 8} bits, expected 256 bits`);
      }
    } else {
      throw new Error("Secret not found after storage");
    }

  } catch (error) {
    console.error(`❌ Error verifying secret:`, error.message);
    throw error;
  }
}

/**
 * Display usage information
 */
function displayUsageInfo() {
  console.log("\n📝 Usage Information:");
  console.log("\nTo use this secret in your Lambda functions:");
  console.log("\n1. Add environment variable to Lambda:");
  console.log(`   JWT_SECRET_PARAM=${PARAMETER_NAME}`);
  console.log("\n2. Grant Lambda IAM permissions:");
  console.log("   - ssm:GetParameter");
  console.log(`   - Resource: arn:aws:ssm:ap-southeast-2:*:parameter${PARAMETER_NAME}`);
  console.log("\n3. Retrieve in Lambda code:");
  console.log("   ```javascript");
  console.log("   import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';");
  console.log("   const ssm = new SSMClient({ region: 'ap-southeast-2' });");
  console.log("   const response = await ssm.send(new GetParameterCommand({");
  console.log(`     Name: '${PARAMETER_NAME}',`);
  console.log("     WithDecryption: true");
  console.log("   }));");
  console.log("   const secret = response.Parameter.Value;");
  console.log("   ```");
}

/**
 * Main execution
 */
async function main() {
  console.log("🚀 SaveSmart JWT Secret Setup");
  console.log("=============================");

  try {
    // Generate secret
    console.log("\n🎲 Generating random 256-bit secret...");
    const secret = generateSecret();
    console.log(`✅ Secret generated (${secret.length} characters, base64 encoded)`);

    // Store secret
    await storeSecret(secret);

    // Verify storage
    await verifySecret();

    // Display usage info
    displayUsageInfo();

    console.log("\n✅ JWT secret setup completed successfully!");
    console.log("\n⚠️  IMPORTANT: Keep this secret secure!");
    console.log("   - Never commit it to version control");
    console.log("   - Never log it in application code");
    console.log("   - Rotate it periodically for security");

  } catch (error) {
    console.error("\n❌ Setup failed:", error.message);
    process.exit(1);
  }
}

// Run the setup
main();
