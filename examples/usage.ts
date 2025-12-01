import {
  SignerFactory,
  SignerRegistry,
  DirectKeySigner,
  HSMSigner,
  MPCSigner,
  ChainType,
  SignerType,
  SignRequest,
} from '../src';

async function example1DirectKeySigner() {
  console.log('=== Example 1: DirectKeySigner ===');

  const signer = SignerFactory.create({
    type: SignerType.DIRECT_KEY,
    config: {
      privateKey:
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    },
  });

  const request: SignRequest = {
    transaction: '0x...', // BTC PSBT hex or ETH transaction hex
    chainType: ChainType.BTC,
  };

  const response = await signer.sign(request);
  console.log('Signed transaction:', response.signedTransaction);
  console.log('Signer type:', response.signerType);
}

async function example2HSMSigner() {
  console.log('=== Example 2: HSMSigner ===');

  const signer = SignerFactory.create({
    type: SignerType.HSM,
    config: {
      keyId: 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
      },
    },
  });

  const request: SignRequest = {
    transaction: '0x...', // BTC PSBT hex or ETH transaction hex
    chainType: ChainType.ETH,
  };

  const response = await signer.sign(request);
  console.log('Signed transaction:', response.signedTransaction);
}

async function example3MPCSignerWithFireblocks() {
  console.log('=== Example 3: MPCSigner with Fireblocks ===');

  const signer = SignerFactory.create({
    type: SignerType.MPC,
    config: {
      provider: {
        type: 'fireblocks',
        config: {
          apiKey: 'your-api-key',
          secretKey: 'your-secret-key',
          vaultAccountId: 'vault-123',
          basePath: 'https://api.fireblocks.io/v1', // or BasePath.Sandbox
        },
      },
    },
  });

  const request: SignRequest = {
    transaction: '0x...', // BTC PSBT hex or ETH transaction hex
    chainType: ChainType.BTC,
  };

  const response = await signer.sign(request);
  console.log('Signed transaction:', response.signedTransaction);
}

async function example4SignerRegistry() {
  console.log('=== Example 4: SignerRegistry ===');

  const registry = new SignerRegistry();

  registry.register(
    'btc-direct',
    SignerFactory.create({
      type: SignerType.DIRECT_KEY,
      config: {
        privateKey: '0x...',
      },
    })
  );

  registry.register(
    'eth-hsm',
    SignerFactory.create({
      type: SignerType.HSM,
      config: {
        keyId: 'arn:aws:kms:us-east-1:123456789012:key/eth-key',
        region: 'us-east-1',
      },
    })
  );

  registry.register(
    'btc-mpc',
    SignerFactory.create({
      type: SignerType.MPC,
      config: {
        provider: {
          type: 'fireblocks',
          config: {
            apiKey: 'your-api-key',
            secretKey: 'your-secret-key',
            vaultAccountId: 'vault-123',
          },
        },
      },
    })
  );

  console.log('Registered signers:', registry.list());

  const btcSigner = registry.get('btc-direct');
  if (btcSigner) {
    const request: SignRequest = {
      transaction: '0x...',
      chainType: ChainType.BTC,
    };
    const response = await btcSigner.sign(request);
    console.log('BTC signature:', response.signature);
  }

  const mpcSigners = registry.findByType(SignerType.MPC);
  console.log('MPC signers count:', mpcSigners.length);
}

async function example5DirectInstantiation() {
  console.log('=== Example 5: Direct Instantiation ===');

  const directSigner = new DirectKeySigner({
    privateKey: '0x...',
  });

  const hsmSigner = new HSMSigner({
    keyId: 'arn:aws:kms:us-east-1:123456789012:key/hsm-key',
    region: 'us-east-1',
  });

  const mpcSigner = new MPCSigner({
    provider: {
      type: 'fireblocks',
      config: {
        apiKey: 'your-api-key',
        secretKey: 'your-secret-key',
        vaultAccountId: 'vault-123',
      },
    },
  });

  const request: SignRequest = {
    transaction: '0x...',
    chainType: ChainType.ETH,
  };

  const response = await directSigner.sign(request);
  console.log('Direct signer response:', response);
}

async function example6BTCPSBT() {
  console.log('=== Example 6: BTC PSBT Signing ===');

  const signer = SignerFactory.create({
    type: SignerType.DIRECT_KEY,
    config: {
      privateKey: '0x...',
    },
  });

  const psbtHex = '70736274ff0100520200000001...'; // PSBT hex string

  const request: SignRequest = {
    transaction: psbtHex,
    chainType: ChainType.BTC,
  };

  const response = await signer.sign(request);
  console.log('Signed PSBT:', response.signedTransaction);
}

async function example7ETHTransaction() {
  console.log('=== Example 7: ETH Transaction Signing ===');

  const signer = SignerFactory.create({
    type: SignerType.DIRECT_KEY,
    config: {
      privateKey: '0x...',
    },
  });

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
  console.log('Signed ETH transaction:', response.signedTransaction);
}

async function runExamples() {
  try {
    await example1DirectKeySigner();
    await example2HSMSigner();
    await example3MPCSignerWithFireblocks();
    await example4SignerRegistry();
    await example5DirectInstantiation();
    await example6BTCPSBT();
    await example7ETHTransaction();
  } catch (error) {
    console.error('Error:', error);
  }
}

if (require.main === module) {
  runExamples();
}

