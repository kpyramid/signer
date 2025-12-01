import { ISigner } from '../core/base';
import {
  DirectKeySigner,
  DirectKeyConfig,
} from '../implementations/direct-key';
import { HSMSigner, HSMConfig } from '../implementations/hsm';
import { MPCSigner, MPCConfig } from '../implementations/mpc';
import { SignerType } from '../../types';

export type SignerConfig =
  | { type: SignerType.DIRECT_KEY; config: DirectKeyConfig }
  | { type: SignerType.HSM; config: HSMConfig }
  | { type: SignerType.MPC; config: MPCConfig };

export class SignerFactory {
  static create(config: SignerConfig): ISigner {
    switch (config.type) {
      case SignerType.DIRECT_KEY:
        return new DirectKeySigner(config.config);
      case SignerType.HSM:
        return new HSMSigner(config.config);
      case SignerType.MPC:
        return new MPCSigner(config.config);
      default: {
        const _exhaustive: never = config;
        throw new Error(
          `Unsupported signer type: ${(_exhaustive as SignerConfig).type}`
        );
      }
    }
  }
}
