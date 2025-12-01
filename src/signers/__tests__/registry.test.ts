import { describe, it, expect, beforeEach } from 'vitest';
import { SignerRegistry } from '../utils/registry';
import { SignerFactory } from '../utils/factory';
import { SignerType, ChainType } from '../../types';
import { SignRequest } from '../../types';

describe('SignerRegistry', () => {
  let registry: SignerRegistry;

  beforeEach(() => {
    registry = new SignerRegistry();
  });

  it('should register a signer', () => {
    const signer = SignerFactory.create({
      type: SignerType.DIRECT_KEY,
      config: {
        privateKey:
          '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      },
    });

    registry.register('btc-signer', signer);
    const retrieved = registry.get('btc-signer');

    expect(retrieved).toBe(signer);
  });

  it('should throw error when registering duplicate id', () => {
    const signer = SignerFactory.create({
      type: SignerType.DIRECT_KEY,
      config: {
        privateKey:
          '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      },
    });

    registry.register('btc-signer', signer);

    expect(() => {
      registry.register('btc-signer', signer);
    }).toThrow('Signer with id "btc-signer" already exists');
  });

  it('should remove a signer', () => {
    const signer = SignerFactory.create({
      type: SignerType.DIRECT_KEY,
      config: {
        privateKey:
          '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      },
    });

    registry.register('btc-signer', signer);
    const removed = registry.remove('btc-signer');

    expect(removed).toBe(true);
    expect(registry.get('btc-signer')).toBeUndefined();
  });

  it('should list all registered signers', () => {
    registry.register(
      'btc-direct',
      SignerFactory.create({
        type: SignerType.DIRECT_KEY,
        config: {
          privateKey:
            '0x1111111111111111111111111111111111111111111111111111111111111111',
        },
      })
    );

    registry.register(
      'btc-hsm',
      SignerFactory.create({
        type: SignerType.HSM,
        config: {
          keyId: 'arn:aws:kms:us-east-1:123456789012:key/btc-key-001',
          region: 'us-east-1',
        },
      })
    );

    const list = registry.list();

    expect(list).toHaveLength(2);
    expect(list.find((s) => s.id === 'btc-direct')).toBeDefined();
    expect(list.find((s) => s.id === 'btc-hsm')).toBeDefined();
  });

  it('should find signers by type', () => {
    registry.register(
      'btc-direct',
      SignerFactory.create({
        type: SignerType.DIRECT_KEY,
        config: {
          privateKey:
            '0x1111111111111111111111111111111111111111111111111111111111111111',
        },
      })
    );

    registry.register(
      'btc-hsm-1',
      SignerFactory.create({
        type: SignerType.HSM,
        config: {
          keyId: 'arn:aws:kms:us-east-1:123456789012:key/btc-key-001',
          region: 'us-east-1',
        },
      })
    );

    registry.register(
      'btc-hsm-2',
      SignerFactory.create({
        type: SignerType.HSM,
        config: {
          keyId: 'arn:aws:kms:us-east-1:123456789012:key/btc-key-002',
          region: 'us-east-1',
        },
      })
    );

    const hsmSigners = registry.findByType(SignerType.HSM);

    expect(hsmSigners).toHaveLength(2);
    hsmSigners.forEach((signer) => {
      expect(signer.getSignerType()).toBe(SignerType.HSM);
    });
  });

  it.skip('should use registered signer to sign', async () => {
    const signer = SignerFactory.create({
      type: SignerType.DIRECT_KEY,
      config: {
        privateKey:
          '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      },
    });

    registry.register('btc-signer', signer);

    const request: SignRequest = {
      transaction:
        '0xabcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234',
      chainType: ChainType.BTC,
    };

    const registeredSigner = registry.get('btc-signer');
    expect(registeredSigner).toBeDefined();

    if (registeredSigner) {
      const response = await registeredSigner.sign(request);
      expect(response).toHaveProperty('signature');
      expect(response.signerType).toBe(SignerType.DIRECT_KEY);
    }
  });
});
