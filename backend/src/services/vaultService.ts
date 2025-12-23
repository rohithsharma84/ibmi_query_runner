import Vault from 'node-vault';
import * as dotenv from 'dotenv';
import { logger } from '@/utils/logger';

dotenv.config();

let vaultClient: Vault.client | null = null;

const getVaultClient = (): Vault.client => {
  if (!vaultClient) {
    const vaultAddr = process.env.VAULT_ADDR || 'http://localhost:8200';
    const vaultToken = process.env.VAULT_TOKEN;

    if (!vaultToken) {
      throw new Error('VAULT_TOKEN environment variable is not set');
    }

    vaultClient = new Vault({
      endpoint: vaultAddr,
      token: vaultToken,
      namespace: process.env.VAULT_NAMESPACE || undefined,
    });
  }

  return vaultClient;
};

export const initializeVault = async (): Promise<void> => {
  try {
    const vault = getVaultClient();
    const mountPath = process.env.VAULT_MOUNT_PATH || 'secret';

    // Check if secret mount exists
    try {
      const mounts = await vault.mounts();
      const mountKey = `${mountPath}/`;

      if (!mounts.data.secret_mounts[mountKey]) {
        logger.info(`Creating secret mount at ${mountPath}`);
        await vault.mount({
          mount_point: mountPath,
          type: 'kv',
          options: {
            version: 2,
          },
        });
      } else {
        logger.info(`Secret mount ${mountPath} already exists`);
      }
    } catch (error: any) {
      if (error.response?.status === 400) {
        logger.info(`Mount path ${mountPath} already configured`);
      } else {
        throw error;
      }
    }

    logger.info('Vault initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Vault', error);
    throw error;
  }
};

export const storeCredential = async (
  credentialId: string,
  credential: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    secure: boolean;
    libraryList?: string;
    defaultSchema?: string;
  }
): Promise<void> => {
  try {
    const vault = getVaultClient();
    const mountPath = process.env.VAULT_MOUNT_PATH || 'secret';
    const secretPath = `${mountPath}/data/ibmi/${credentialId}`;

    await vault.write(secretPath, {
      data: credential,
    });

    logger.info(`Credential stored: ${credentialId}`);
  } catch (error) {
    logger.error(`Failed to store credential ${credentialId}`, error);
    throw error;
  }
};

export const retrieveCredential = async (
  credentialId: string
): Promise<{
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  secure: boolean;
  libraryList?: string;
  defaultSchema?: string;
}> => {
  try {
    const vault = getVaultClient();
    const mountPath = process.env.VAULT_MOUNT_PATH || 'secret';
    const secretPath = `${mountPath}/data/ibmi/${credentialId}`;

    const response = await vault.read(secretPath);
    return response.data.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      logger.warn(`Credential not found: ${credentialId}`);
      throw new Error(`Credential not found: ${credentialId}`);
    }
    logger.error(`Failed to retrieve credential ${credentialId}`, error);
    throw error;
  }
};

export const deleteCredential = async (credentialId: string): Promise<void> => {
  try {
    const vault = getVaultClient();
    const mountPath = process.env.VAULT_MOUNT_PATH || 'secret';
    const secretPath = `${mountPath}/metadata/ibmi/${credentialId}`;

    // KVv2 requires deleting metadata to completely remove a secret
    await vault.delete(secretPath);

    logger.info(`Credential deleted: ${credentialId}`);
  } catch (error) {
    logger.error(`Failed to delete credential ${credentialId}`, error);
    throw error;
  }
};

export const updateCredentialPassword = async (
  credentialId: string,
  newPassword: string
): Promise<void> => {
  try {
    const vault = getVaultClient();
    const credential = await retrieveCredential(credentialId);
    credential.password = newPassword;
    await storeCredential(credentialId, credential);
    logger.info(`Credential password updated: ${credentialId}`);
  } catch (error) {
    logger.error(`Failed to update credential password ${credentialId}`, error);
    throw error;
  }
};
