import { describe, it, expect } from 'vitest';
import { HSMSigner } from '../implementations/hsm';
import { SignRequest, SignerType, ChainType } from '../../types';

describe('HSMSigner', () => {
  const hsmConfig = {
    keyId:
      'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
    region: 'us-east-1',
    credentials: {
      accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
      secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    },
  };

  it('should create a HSMSigner instance', () => {
    const signer = new HSMSigner(hsmConfig);
    expect(signer).toBeInstanceOf(HSMSigner);
    expect(signer.getSignerType()).toBe(SignerType.HSM);
  });

  it('should throw error when region is missing', () => {
    expect(() => {
      new HSMSigner({ region: '', keyId: 'key-123' });
    }).toThrow('HSM keyId and region are required');
  });

  it('should throw error when keyId is missing', () => {
    expect(() => {
      new HSMSigner({ region: 'us-east-1', keyId: '' });
    }).toThrow('HSM keyId and region are required');
  });

  it('should throw error when chainType is not supported', async () => {
    const signer = new HSMSigner(hsmConfig);
    const request: SignRequest = {
      transaction: '0xefgh5678',
      chainType: 'SOL',
    };

    await expect(signer.sign(request)).rejects.toThrow(
      'Unsupported chain type for HSM: SOL'
    );
  });

  it('should validate request correctly', () => {
    const signer = new HSMSigner(hsmConfig);

    expect(
      signer.validateRequest({ transaction: '0x123', chainType: ChainType.BTC })
    ).toBe(true);
    expect(
      signer.validateRequest({ transaction: '', chainType: ChainType.BTC })
    ).toBe(false);
  });
});
