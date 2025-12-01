# 通用数字资产签名库

一个用于签名数字资产交易的协议库。支持多种签名机制，包括直接私钥签名、HSM（AWS KMS）和 MPC（Fireblocks）。

**注意**：当前版本主要完成了架构设计和通用化实现，尚未进行可用性集成测试，需要后续完善。

## 安装

```bash
npm install
```

## 使用

### 基本示例

```typescript
import { SignerFactory, SignerType, ChainType, SignRequest } from './src';

const signer = SignerFactory.create({
  type: SignerType.DIRECT_KEY,
  config: {
    privateKey: '0x1234567890abcdef...',
  },
});

const request: SignRequest = {
  transaction: '0x...', // BTC PSBT 或 ETH 交易 hex
  chainType: ChainType.BTC,
};

const response = await signer.sign(request);
console.log(response.signedTransaction);
```

### DirectKey 签名器

适用于开发和测试。直接使用本地私钥。

```typescript
const signer = SignerFactory.create({
  type: SignerType.DIRECT_KEY,
  config: {
    privateKey: '0x...',
  },
});
```

### HSM 签名器

使用 AWS KMS 进行签名。私钥存储在 HSM 硬件中。

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

### MPC 签名器（Fireblocks）

使用 Fireblocks MPC 网络。无需硬件。

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

### 使用注册表

使用注册表管理多个签名器：

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

## 支持的链

### 当前支持

- [x] **BTC**: 仅支持 PSBT 格式
- [x] **ETH**: 标准交易格式

### 计划支持

- [ ] **TRON (TRX)**
- [ ] **Solana (SOL)**
- [ ] **BNB Chain (BNB)**
- [ ] **Polygon (MATIC)**
- [ ] **Avalanche (AVAX)**
- [ ] **Cardano (ADA)**
- [ ] **Polkadot (DOT)**

架构设计支持扩展，后续可以任意扩展新的链支持。

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

## 开发

```bash
npm install
npm run build
npm run test
```
