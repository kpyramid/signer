# Universal Digital Asset Signer

A protocol library for signing digital asset transactions. Supports multiple signing mechanisms including direct private key signing, HSM (AWS KMS), and MPC (Fireblocks).

**Note**: The current version focuses on architectural design and generic implementation. Usability integration tests have not been performed yet and will be completed in future iterations.

## Installation

```bash
npm install
```

## Usage

### Basic Example

```typescript
import { SignerFactory, SignerType, ChainType, SignRequest } from './src';

const signer = SignerFactory.create({
  type: SignerType.DIRECT_KEY,
  config: {
    privateKey: '0x1234567890abcdef...',
  },
});

const request: SignRequest = {
  transaction: '0x...', // BTC PSBT or ETH transaction hex
  chainType: ChainType.BTC,
};

const response = await signer.sign(request);
console.log(response.signedTransaction);
```

### DirectKey Signer

For development and testing. Uses local private key directly.

```typescript
const signer = SignerFactory.create({
  type: SignerType.DIRECT_KEY,
  config: {
    privateKey: '0x...',
  },
});
```

### HSM Signer

Uses AWS KMS for signing. Private keys are stored in HSM hardware.

```typescript
const signer = SignerFactory.create({
  type: SignerType.HSM,
  config: {
    keyId: 'arn:aws:kms:us-east-1:123456789012:key/your-key-id',
    region: 'us-east-1',
    credentials: {
      accessKeyId: 'your-access-key',
      secretAccessKey: 'your-secret-key',
    },
  },
});
```

### MPC Signer (Fireblocks)

Uses Fireblocks MPC network. No hardware required.

```typescript
const signer = SignerFactory.create({
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
});
```

### Using Registry

Manage multiple signers with a registry:

```typescript
import { SignerRegistry, SignerFactory, SignerType } from './src';

const registry = new SignerRegistry();

registry.register('btc-signer', SignerFactory.create({
  type: SignerType.DIRECT_KEY,
  config: { privateKey: '0x...' },
}));

const signer = registry.get('btc-signer');
const response = await signer?.sign({
  transaction: '0x...',
  chainType: ChainType.BTC,
});
```

## Supported Chains

- BTC: PSBT format only
- ETH: Standard transaction format

## API

### SignRequest

```typescript
interface SignRequest {
  transaction: string;
  chainType: ChainType;
  options?: Record<string, unknown>;
}
```

### SignResponse

```typescript
interface SignResponse {
  signature: string;
  signedTransaction?: string;
  publicKey?: string;
  signerType: string;
}
```

## Development

```bash
npm install
npm run build
npm run test
```
