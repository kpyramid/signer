import { SignRequest } from '../../../types';
import { signTransactionWithFireblocks } from './algorithms';

export interface IMPCProvider {
  sign(request: SignRequest): Promise<string>;
  getName(): string;
}

export class FireblocksProvider implements IMPCProvider {
  private config: {
    apiKey: string;
    secretKey: string;
    vaultAccountId: string;
    basePath?: string;
  };

  constructor(config?: {
    apiKey?: string;
    secretKey?: string;
    vaultAccountId?: string;
    basePath?: string;
  }) {
    if (!config?.apiKey || !config?.secretKey || !config?.vaultAccountId) {
      throw new Error(
        'Fireblocks provider requires apiKey, secretKey, and vaultAccountId'
      );
    }

    this.config = {
      apiKey: config.apiKey,
      secretKey: config.secretKey,
      vaultAccountId: config.vaultAccountId,
      basePath: config.basePath,
    };
  }

  async sign(request: SignRequest): Promise<string> {
    return signTransactionWithFireblocks(request, this.config);
  }

  getName(): string {
    return 'fireblocks';
  }
}

export class GenericMPCProvider implements IMPCProvider {
  private name: string;
  private config?: Record<string, unknown>;

  constructor(name: string, config?: Record<string, unknown>) {
    this.name = name;
    this.config = config;
  }

  async sign(request: SignRequest): Promise<string> {
    // Simulated generic MPC SDK call
    // In production, this would integrate with actual MPC SDKs
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(
          `mpc_signature_${this.name}_${request.transaction.slice(0, 16)}`
        );
      }, 150);
    });
  }

  getName(): string {
    return this.name;
  }
}
