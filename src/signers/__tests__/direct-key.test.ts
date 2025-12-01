import { describe, it, expect } from 'vitest';
import { DirectKeySigner } from '../implementations/direct-key';
import { SignRequest, SignerType, ChainType } from '../../types';

describe('DirectKeySigner', () => {
  const privateKey =
    '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

  it('should create a DirectKeySigner instance', () => {
    const signer = new DirectKeySigner({ privateKey });
    expect(signer).toBeInstanceOf(DirectKeySigner);
    expect(signer.getSignerType()).toBe(SignerType.DIRECT_KEY);
  });

  it('should throw error when private key is missing', () => {
    expect(() => {
      new DirectKeySigner({ privateKey: '' });
    }).toThrow('Private key is required for DirectKeySigner');
  });

  it.skip('should sign a BTC transaction', async () => {
    const signer = new DirectKeySigner({ privateKey });
    const bitcoin = await import('bitcoinjs-lib');
    const ecc = await import('tiny-secp256k1');

    const privateKeyHex = privateKey.startsWith('0x')
      ? privateKey.slice(2)
      : privateKey;
    const privateKeyBuffer = Buffer.from(privateKeyHex, 'hex');
    const publicKey = ecc.pointFromScalar(privateKeyBuffer, true);
    if (!publicKey) {
      throw new Error('Invalid private key');
    }
    const { address } = bitcoin.payments.p2pkh({
      pubkey: Buffer.from(publicKey),
      network: bitcoin.networks.testnet,
    });

    const psbt = new bitcoin.Psbt({ network: bitcoin.networks.testnet });
    const outputScript = Buffer.from(
      bitcoin.address.toOutputScript(address!, bitcoin.networks.testnet)
    );
    const txid = Buffer.alloc(32, 0);
    psbt.addInput({
      hash: txid.toString('hex'),
      index: 0,
      witnessUtxo: {
        script: outputScript,
        value: 1000000,
      },
    });
    psbt.addOutput({
      address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
      value: 500000,
    });

    const request: SignRequest = {
      transaction: psbt.toHex(),
      chainType: ChainType.BTC,
      options: { network: 'testnet' },
    };

    const response = await signer.sign(request);

    expect(response).toHaveProperty('signature');
    expect(response).toHaveProperty('signerType');
    expect(response.signerType).toBe(SignerType.DIRECT_KEY);
    expect(typeof response.signature).toBe('string');
    expect(response.signature.length).toBeGreaterThan(0);
  });

  it('should sign ETH transaction', async () => {
    const signer = new DirectKeySigner({ privateKey });
    const { Transaction } = await import('ethers');
    const unsignedTx = Transaction.from({
      to: '0x3535353535353535353535353535353535353535',
      value: '0x0de0b6b3a7640000',
      gasLimit: '0x5208',
      gasPrice: '0x2540be400',
      nonce: 0,
      chainId: 1,
    });
    const request: SignRequest = {
      transaction: unsignedTx.unsignedSerialized.slice(2),
      chainType: ChainType.ETH,
    };

    const response = await signer.sign(request);

    expect(response).toHaveProperty('signature');
    expect(response.signerType).toBe(SignerType.DIRECT_KEY);
    expect(response.signature.length).toBeGreaterThan(0);
  });

  it('should validate request correctly', () => {
    const signer = new DirectKeySigner({ privateKey });

    expect(
      signer.validateRequest({
        transaction: '70736274ff0100520200000001',
        chainType: ChainType.BTC,
      })
    ).toBe(true);
    expect(
      signer.validateRequest({ transaction: '', chainType: ChainType.BTC })
    ).toBe(false);
    expect(
      signer.validateRequest({
        transaction: '70736274ff0100520200000001',
        chainType: '',
      })
    ).toBe(false);
  });

  it('should throw error for invalid request', async () => {
    const signer = new DirectKeySigner({ privateKey });
    const invalidRequest = {
      transaction: '',
      chainType: ChainType.BTC,
    } as SignRequest;

    await expect(signer.sign(invalidRequest)).rejects.toThrow(
      'Invalid sign request'
    );
  });
});
