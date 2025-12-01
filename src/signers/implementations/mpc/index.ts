import { BaseSigner } from '../../core/base';
import { SignRequest, SignResponse, SignerType } from '../../../types';
import {
  IMPCProvider,
  FireblocksProvider,
  GenericMPCProvider,
} from './providers';

export interface MPCConfig {
  provider:
    | IMPCProvider
    | { type: 'fireblocks' | string; config?: Record<string, unknown> };
}

export class MPCSigner extends BaseSigner {
  private provider: IMPCProvider;

  constructor(config: MPCConfig) {
    super(SignerType.MPC);

    if (!config.provider) {
      throw new Error('MPC provider is required');
    }

    if (this.isProviderInstance(config.provider)) {
      this.provider = config.provider;
    } else {
      this.provider = this.createProvider(config.provider);
    }
  }

  async sign(request: SignRequest): Promise<SignResponse> {
    if (!this.validateRequest(request)) {
      throw new Error('Invalid sign request');
    }

    const signedTransaction = await this.provider.sign(request);
    return {
      signature: signedTransaction,
      signedTransaction,
      signerType: this.getSignerType(),
    };
  }

  private isProviderInstance(
    provider: IMPCProvider | { type: string; config?: Record<string, unknown> }
  ): provider is IMPCProvider {
    return typeof (provider as IMPCProvider).sign === 'function';
  }

  private createProvider(providerConfig: {
    type: string;
    config?: Record<string, unknown>;
  }): IMPCProvider {
    if (providerConfig.type === 'fireblocks') {
      return new FireblocksProvider(providerConfig.config);
    }
    return new GenericMPCProvider(providerConfig.type, providerConfig.config);
  }
}
