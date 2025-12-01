import { describe, it, expect } from 'vitest';
import { MPCSigner } from '../implementations/mpc';
import {
  FireblocksProvider,
  GenericMPCProvider,
  IMPCProvider,
} from '../implementations/mpc/providers';
import { SignRequest, SignerType, ChainType } from '../../types';

describe('MPCSigner', () => {
  it('should create a MPCSigner instance with Fireblocks provider instance', () => {
    const provider = new FireblocksProvider({
      apiKey: 'api-key-123',
      secretKey: 'api-secret-456',
      vaultAccountId: 'vault-789',
    });
    const signer = new MPCSigner({ provider });
    expect(signer).toBeInstanceOf(MPCSigner);
    expect(signer.getSignerType()).toBe(SignerType.MPC);
  });

  it('should create a MPCSigner instance with Fireblocks config', () => {
    const signer = new MPCSigner({
      provider: {
        type: 'fireblocks',
        config: {
          apiKey: 'key-123',
          secretKey: 'secret-456',
          vaultAccountId: 'vault-789',
        },
      },
    });
    expect(signer).toBeInstanceOf(MPCSigner);
    expect(signer.getSignerType()).toBe(SignerType.MPC);
  });

  it('should create a MPCSigner instance with generic provider', () => {
    const provider = new GenericMPCProvider('threshold-labs');
    const signer = new MPCSigner({ provider });
    expect(signer).toBeInstanceOf(MPCSigner);
    expect(signer.getSignerType()).toBe(SignerType.MPC);
  });

  it('should create a MPCSigner instance with generic provider config', () => {
    const signer = new MPCSigner({
      provider: {
        type: 'threshold-labs',
        config: { endpoint: 'https://example.com' },
      },
    });
    expect(signer).toBeInstanceOf(MPCSigner);
    expect(signer.getSignerType()).toBe(SignerType.MPC);
  });

  it('should throw error when provider is missing', () => {
    expect(() => {
      new MPCSigner({ provider: null as unknown as IMPCProvider });
    }).toThrow('MPC provider is required');
  });

  it.skip('should sign a message hash with Fireblocks provider', async () => {
    const provider = new FireblocksProvider({
      apiKey: 'api-key-123',
      secretKey: 'secret-key-456',
      vaultAccountId: 'vault-789',
    });
    const signer = new MPCSigner({ provider });
    const request: SignRequest = {
      transaction: '0xijkl9012',
      chainType: ChainType.BTC,
    };

    const response = await signer.sign(request);

    expect(response).toHaveProperty('signature');
    expect(response).toHaveProperty('signerType');
    expect(response.signerType).toBe(SignerType.MPC);
    expect(response.signature).toContain('fireblocks_mpc_signature');
  });

  it.skip('should sign a message hash with Fireblocks config', async () => {
    const signer = new MPCSigner({
      provider: {
        type: 'fireblocks',
        config: {
          apiKey: 'key-123',
          secretKey: 'secret-456',
          vaultAccountId: 'vault-789',
        },
      },
    });
    const request: SignRequest = {
      transaction: '0xijkl9012',
      chainType: ChainType.BTC,
    };

    const response = await signer.sign(request);

    expect(response).toHaveProperty('signature');
    expect(response.signerType).toBe(SignerType.MPC);
    expect(response.signature).toContain('fireblocks_mpc_signature');
  });

  it('should sign a message hash with generic provider', async () => {
    const provider = new GenericMPCProvider('threshold-labs');
    const signer = new MPCSigner({ provider });
    const request: SignRequest = {
      transaction: '0xmnop3456',
      chainType: 'ETH',
    };

    const response = await signer.sign(request);

    expect(response).toHaveProperty('signature');
    expect(response.signerType).toBe(SignerType.MPC);
    expect(response.signature).toContain('mpc_signature');
    expect(response.signature).toContain('threshold-labs');
  });

  it('should sign a message hash with generic provider config', async () => {
    const signer = new MPCSigner({
      provider: {
        type: 'other-mpc',
        config: { endpoint: 'https://example.com' },
      },
    });
    const request: SignRequest = {
      transaction: '0xmnop3456',
      chainType: 'ETH',
    };

    const response = await signer.sign(request);

    expect(response).toHaveProperty('signature');
    expect(response.signerType).toBe(SignerType.MPC);
    expect(response.signature).toContain('mpc_signature');
    expect(response.signature).toContain('other-mpc');
  });
});
