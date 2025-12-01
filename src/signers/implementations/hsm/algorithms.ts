import { ChainType, SignRequest } from '../../../types';
import { KMSClient, SignCommand } from '@aws-sdk/client-kms';
import * as bitcoin from 'bitcoinjs-lib';
import { Transaction } from 'ethers';

export type KMSSigningAlgorithm =
  | 'ECDSA_SHA_256'
  | 'ECDSA_SHA_384'
  | 'ECDSA_SHA_512'
  | 'RSASSA_PSS_SHA_256'
  | 'RSASSA_PSS_SHA_384'
  | 'RSASSA_PSS_SHA_512'
  | 'RSASSA_PKCS1_V1_5_SHA_256'
  | 'RSASSA_PKCS1_V1_5_SHA_384'
  | 'RSASSA_PKCS1_V1_5_SHA_512';

export const ChainSigningAlgorithm: Record<string, KMSSigningAlgorithm> = {
  [ChainType.BTC]: 'ECDSA_SHA_256',
  [ChainType.ETH]: 'ECDSA_SHA_256',
  // @TODO: Add support for other chains
} as const;

export function getSigningAlgorithm(chainType: string): KMSSigningAlgorithm {
  const algorithm = ChainSigningAlgorithm[chainType];
  if (!algorithm) {
    throw new Error(`Unsupported chain type for HSM: ${chainType}`);
  }
  return algorithm;
}

export async function signTransactionWithHSM(
  request: SignRequest,
  kmsClient: KMSClient,
  keyId: string
): Promise<string> {
  if (request.chainType === ChainType.BTC) {
    return signBTCTransactionWithHSM(request, kmsClient, keyId);
  } else if (request.chainType === ChainType.ETH) {
    return signETHTransactionWithHSM(request, kmsClient, keyId);
  }
  throw new Error(`Unsupported chain type for HSM: ${request.chainType}`);
}

async function signBTCTransactionWithHSM(
  request: SignRequest,
  kmsClient: KMSClient,
  keyId: string
): Promise<string> {
  const psbtHex = request.transaction.startsWith('0x')
    ? request.transaction.slice(2)
    : request.transaction;

  let psbt: bitcoin.Psbt;
  try {
    psbt = bitcoin.Psbt.fromHex(psbtHex);
  } catch (error) {
    throw new Error(
      `Invalid PSBT format: ${error instanceof Error ? error.message : String(error)}. Expected PSBT format, not raw transaction.`
    );
  }

  if (psbt.inputCount === 0) {
    throw new Error('PSBT has no inputs to sign');
  }

  const signingAlgorithm = getSigningAlgorithm(ChainType.BTC);
  const firstInput = psbt.data.inputs[0];
  const publicKey =
    firstInput.bip32Derivation?.[0]?.pubkey ||
    firstInput.tapInternalKey ||
    Buffer.alloc(33);

  const hsmSigner = createHSMSigner(
    kmsClient,
    keyId,
    signingAlgorithm,
    publicKey
  );

  await psbt.signAllInputsAsync(hsmSigner);
  psbt.finalizeAllInputs();

  return psbt.extractTransaction().toHex();
}

function createHSMSigner(
  kmsClient: KMSClient,
  keyId: string,
  signingAlgorithm: KMSSigningAlgorithm,
  publicKey: Buffer
): {
  publicKey: Buffer;
  sign: (hash: Buffer) => Promise<Buffer>;
  signSchnorr: (hash: Buffer) => Promise<Buffer>;
} {
  const signHash = async (hash: Buffer): Promise<Buffer> => {
    const command = new SignCommand({
      KeyId: keyId,
      Message: new Uint8Array(hash),
      MessageType: 'DIGEST',
      SigningAlgorithm: signingAlgorithm,
    });

    const response = await kmsClient.send(command);
    if (!response.Signature) {
      throw new Error('AWS CloudHSM returned empty signature');
    }

    return Buffer.from(response.Signature);
  };

  return {
    publicKey,
    sign: async (hash: Buffer): Promise<Buffer> => {
      const signature = await signHash(hash);
      return bitcoin.script.signature.encode(signature, 0x01);
    },
    signSchnorr: signHash,
  };
}

async function signETHTransactionWithHSM(
  request: SignRequest,
  kmsClient: KMSClient,
  keyId: string
): Promise<string> {
  const transactionHex = request.transaction.startsWith('0x')
    ? request.transaction.slice(2)
    : request.transaction;

  const tx = Transaction.from(`0x${transactionHex}`);

  if (tx.signature) {
    throw new Error('Transaction is already signed');
  }

  const hash = Buffer.from(tx.unsignedHash.slice(2), 'hex');
  const signingAlgorithm = getSigningAlgorithm(ChainType.ETH);

  const command = new SignCommand({
    KeyId: keyId,
    Message: new Uint8Array(hash),
    MessageType: 'DIGEST',
    SigningAlgorithm: signingAlgorithm,
  });

  const response = await kmsClient.send(command);
  if (!response.Signature) {
    throw new Error('AWS CloudHSM returned empty signature');
  }

  const signature = Buffer.from(response.Signature);
  const r = `0x${signature.slice(0, 32).toString('hex')}`;
  const s = `0x${signature.slice(32, 64).toString('hex')}`;
  const v = signature.length > 64 ? signature[64] : 27;

  const signedTx = Transaction.from({
    ...tx,
    signature: { r, s, v },
  });

  return signedTx.serialized.slice(2);
}
