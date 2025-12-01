import { describe, it, expect } from 'vitest';
import { SignerFactory, SignerRegistry } from '../index';
import { SignerType, SignRequest, ChainType } from '../../types';

describe('Integration Tests', () => {
  describe('Complete Signing Flow', () => {
    it.skip('should handle BTC transaction signing with different signers', async () => {
      const btcTransactionHash =
        '0xabcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234';

      // Test DirectKeySigner
      const directSigner = SignerFactory.create({
        type: SignerType.DIRECT_KEY,
        config: {
          privateKey:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        },
      });

      const directRequest: SignRequest = {
        transaction: btcTransactionHash,
        chainType: ChainType.BTC,
      };

      const directResponse = await directSigner.sign(directRequest);
      expect(directResponse.signerType).toBe(SignerType.DIRECT_KEY);
      expect(directResponse.signature).toBeDefined();

      // Test HSMSigner
      const hsmSigner = SignerFactory.create({
        type: SignerType.HSM,
        config: {
          keyId: 'arn:aws:kms:us-east-1:123456789012:key/btc-key-001',
          region: 'us-east-1',
        },
      });

      const hsmResponse = await hsmSigner.sign(directRequest);
      expect(hsmResponse.signerType).toBe(SignerType.HSM);
      expect(hsmResponse.signature).toBeDefined();

      // Test MPCSigner
      const mpcSigner = SignerFactory.create({
        type: SignerType.MPC,
        config: {
          provider: {
            type: 'fireblocks',
            config: {
              apiKey: 'test-api-key',
              secretKey: 'test-secret-key',
              vaultAccountId: 'vault-001',
            },
          },
        },
      });

      const mpcResponse = await mpcSigner.sign(directRequest);
      expect(mpcResponse.signerType).toBe(SignerType.MPC);
      expect(mpcResponse.signature).toBeDefined();
    });

    it.skip('should handle ETH transaction signing with registry', async () => {
      const registry = new SignerRegistry();
      const ethTransactionHash =
        '0xabcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234';

      // Register multiple signers for ETH
      registry.register(
        'eth-direct',
        SignerFactory.create({
          type: SignerType.DIRECT_KEY,
          config: {
            privateKey:
              '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
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

      registry.register(
        'eth-mpc',
        SignerFactory.create({
          type: SignerType.MPC,
          config: {
            provider: {
              type: 'fireblocks',
              config: {
                apiKey: 'test-api-key',
                secretKey: 'test-secret-key',
                vaultAccountId: 'vault-002',
              },
            },
          },
        })
      );

      const request: SignRequest = {
        transaction: ethTransactionHash,
        chainType: 'ETH',
      };

      const btcRequest: SignRequest = {
        transaction: ethTransactionHash,
        chainType: ChainType.BTC,
      };

      // Test all registered signers
      const directSigner = registry.get('eth-direct');
      const hsmSigner = registry.get('btc-hsm');
      const mpcSigner = registry.get('eth-mpc');

      expect(directSigner).toBeDefined();
      expect(hsmSigner).toBeDefined();
      expect(mpcSigner).toBeDefined();

      if (directSigner && hsmSigner && mpcSigner) {
        const [directRes, hsmRes, mpcRes] = await Promise.all([
          directSigner.sign(request),
          hsmSigner.sign(btcRequest),
          mpcSigner.sign(request),
        ]);

        expect(directRes.signature).toBeDefined();
        expect(hsmRes.signature).toBeDefined();
        expect(mpcRes.signature).toBeDefined();

        // All should sign the same hash but produce different signatures
        expect(directRes.signature).not.toBe(hsmRes.signature);
        expect(hsmRes.signature).not.toBe(mpcRes.signature);
      }
    });

    it.skip('should handle multiple chain types', async () => {
      const signer = SignerFactory.create({
        type: SignerType.DIRECT_KEY,
        config: {
          privateKey:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        },
      });

      const chains = [ChainType.BTC, ChainType.ETH];

      for (const chain of chains) {
        const request: SignRequest = {
          transaction:
            '0xabcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234',
          chainType: chain,
        };

        const response = await signer.sign(request);
        expect(response.signature).toBeDefined();
        expect(response.signerType).toBe(SignerType.DIRECT_KEY);
      }
    });

    it.skip('should handle signer registry with multiple signers', async () => {
      const registry = new SignerRegistry();

      // Register signers for different purposes
      registry.register(
        'hot-wallet-btc',
        SignerFactory.create({
          type: SignerType.DIRECT_KEY,
          config: {
            privateKey:
              '0x1111111111111111111111111111111111111111111111111111111111111111',
          },
        })
      );

      registry.register(
        'cold-wallet-btc',
        SignerFactory.create({
          type: SignerType.HSM,
          config: {
            keyId: 'arn:aws:kms:us-east-1:123456789012:key/cold-btc-key',
            region: 'us-east-1',
          },
        })
      );

      registry.register(
        'institutional-eth',
        SignerFactory.create({
          type: SignerType.MPC,
          config: {
            provider: {
              type: 'fireblocks',
              config: {
                apiKey: 'test-api-key',
                secretKey: 'test-secret-key',
                vaultAccountId: 'institutional-vault',
              },
            },
          },
        })
      );

      expect(registry.list()).toHaveLength(3);

      const hsmSigners = registry.findByType(SignerType.HSM);
      expect(hsmSigners).toHaveLength(1);

      const mpcSigners = registry.findByType(SignerType.MPC);
      expect(mpcSigners).toHaveLength(1);
    });
  });
});
