import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

// In-memory cache for JWT secret to reuse across Lambda invocations
let cachedJWTSecret: string | null = null;

/**
 * Retrieves the JWT secret from AWS Systems Manager Parameter Store.
 * Caches the secret in memory for Lambda execution context reuse.
 *
 * @param parameterName - The name of the SSM parameter (default: /savesmart/jwt-secret)
 * @returns The JWT secret string
 * @throws Error if the parameter cannot be retrieved
 */
export async function getJWTSecret(parameterName: string = '/savesmart/jwt-secret'): Promise<string> {
  // Return cached value if available
  if (cachedJWTSecret) {
    return cachedJWTSecret;
  }

  try {
    const client = new SSMClient({ region: process.env.AWS_REGION || 'ap-southeast-2' });

    const command = new GetParameterCommand({
      Name: parameterName,
      WithDecryption: true, // Decrypt SecureString parameters
    });

    const response = await client.send(command);

    if (!response.Parameter?.Value) {
      throw new Error(`SSM parameter ${parameterName} has no value`);
    }

    // Cache the secret for future invocations
    cachedJWTSecret = response.Parameter.Value;

    return cachedJWTSecret;
  } catch (error) {
    // Handle SSM errors gracefully
    if (error instanceof Error) {
      throw new Error(`Failed to retrieve JWT secret from SSM: ${error.message}`);
    }
    throw new Error('Failed to retrieve JWT secret from SSM: Unknown error');
  }
}

/**
 * Clears the cached JWT secret. Useful for testing.
 */
export function clearJWTSecretCache(): void {
  cachedJWTSecret = null;
}
