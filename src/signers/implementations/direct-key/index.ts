import { BaseSigner } from '../../core/base';
import {
  SignRequest,
  SignResponse,
  SignerType,
  ChainType,
} from '../../../types';
import { signTransaction } from './algorithms';

export interface DirectKeyConfig {
  privateKey: string;
}

export class DirectKeySigner extends BaseSigner {
  private privateKey: string;

  constructor(config: DirectKeyConfig) {
    super(SignerType.DIRECT_KEY);
    this.privateKey = config.privateKey;
    if (!this.privateKey) {
      throw new Error('Private key is required for DirectKeySigner');
    }
  }

  async sign(request: SignRequest): Promise<SignResponse> {
    if (!this.validateRequest(request)) {
      throw new Error('Invalid sign request');
    }

    if (
      request.chainType !== ChainType.BTC &&
      request.chainType !== ChainType.ETH
    ) {
      throw new Error(
        `DirectKeySigner currently only supports BTC and ETH chains`
      );
    }

    const result = await signTransaction(
      request.transaction,
      this.privateKey,
      request.chainType as ChainType
    );

    return {
      signature: result.signature,
      signedTransaction: result.signedTransaction,
      signerType: this.getSignerType(),
    };
  }
}
