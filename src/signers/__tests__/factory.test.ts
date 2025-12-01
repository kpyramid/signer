import { describe, it, expect } from 'vitest';
import { SignerFactory } from '../utils/factory';
import { SignerType } from '../../types';
import { DirectKeySigner } from '../implementations/direct-key';
import { HSMSigner } from '../implementations/hsm';
import { MPCSigner } from '../implementations/mpc';

describe('SignerFactory', () => {
  it('should create DirectKeySigner', () => {
    const signer = SignerFactory.create({
      type: SignerType.DIRECT_KEY,
      config: {
        privateKey:
          '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      },
    });

    expect(signer).toBeInstanceOf(DirectKeySigner);
    expect(signer.getSignerType()).toBe(SignerType.DIRECT_KEY);
  });

  it('should create HSMSigner', () => {
    const signer = SignerFactory.create({
      type: SignerType.HSM,
      config: {
        keyId:
          'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
        region: 'us-east-1',
      },
    });

    expect(signer).toBeInstanceOf(HSMSigner);
    expect(signer.getSignerType()).toBe(SignerType.HSM);
  });

  it('should create MPCSigner', () => {
    const signer = SignerFactory.create({
      type: SignerType.MPC,
      config: {
        provider: {
          type: 'fireblocks',
          config: {
            apiKey: 'test-api-key',
            secretKey: 'test-secret-key',
            vaultAccountId: 'vault-123',
          },
        },
      },
    });

    expect(signer).toBeInstanceOf(MPCSigner);
    expect(signer.getSignerType()).toBe(SignerType.MPC);
  });
});
