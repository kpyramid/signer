import { ChainType, SignRequest } from '../../../types';
import {
  Fireblocks,
  BasePath,
  TransferPeerPathType,
  TransactionOperation,
} from '@fireblocks/ts-sdk';
import * as bitcoin from 'bitcoinjs-lib';
import { Transaction } from 'ethers';

export interface FireblocksConfig {
  apiKey: string;
  secretKey: string;
  vaultAccountId: string;
  basePath?: BasePath | string;
}

export async function signTransactionWithFireblocks(
  request: SignRequest,
  config: FireblocksConfig
): Promise<string> {
  if (request.chainType === ChainType.BTC) {
    return signBTCTransactionWithFireblocks(request, config);
  } else if (request.chainType === ChainType.ETH) {
    return signETHTransactionWithFireblocks(request, config);
  }
  throw new Error(
    `Unsupported chain type for Fireblocks: ${request.chainType}`
  );
}

async function signBTCTransactionWithFireblocks(
  request: SignRequest,
  config: FireblocksConfig
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

  if (psbt.txOutputs.length === 0) {
    throw new Error('PSBT has no outputs');
  }

  const fireblocks = new Fireblocks({
    apiKey: config.apiKey,
    secretKey: config.secretKey,
    basePath: config.basePath || BasePath.Sandbox,
  });

  const totalOutputAmount = psbt.txOutputs.reduce(
    (sum, output) => sum + output.value,
    0
  );

  const firstOutput = psbt.txOutputs[0];
  let destinationAddress = '';
  try {
    if (firstOutput.address) {
      destinationAddress = firstOutput.address;
    } else if (firstOutput.script) {
      const address = bitcoin.address.fromOutputScript(
        firstOutput.script,
        bitcoin.networks.testnet
      );
      destinationAddress = address;
    }
  } catch (error) {
    // If address extraction fails, use empty string (Fireblocks will handle it)
  }

  const isProduction =
    config.basePath &&
    config.basePath !== BasePath.Sandbox &&
    typeof config.basePath === 'string' &&
    config.basePath.includes('api.fireblocks.io');
  const assetId = isProduction ? 'BTC' : 'BTC_TEST';

  const transactionRequest = {
    assetId,
    source: {
      type: TransferPeerPathType.VaultAccount,
      id: String(config.vaultAccountId),
    },
    destination: {
      type: TransferPeerPathType.ExternalWallet,
      oneTimeAddress: {
        address: destinationAddress,
      },
    },
    amount: (totalOutputAmount / 100000000).toString(),
    operation: TransactionOperation.Raw,
    extraParameters: {
      rawMessageData: {
        messages: [
          {
            content: psbtHex,
          },
        ],
      },
    },
  };

  const result = await fireblocks.transactions.createTransaction({
    transactionRequest,
  });

  if (!result.data?.id) {
    throw new Error('Fireblocks transaction creation failed');
  }

  const signedTxHex = await waitForTransactionCompletion(
    fireblocks,
    result.data.id
  );

  return signedTxHex;
}

async function signETHTransactionWithFireblocks(
  request: SignRequest,
  config: FireblocksConfig
): Promise<string> {
  const transactionHex = request.transaction.startsWith('0x')
    ? request.transaction.slice(2)
    : request.transaction;

  const tx = Transaction.from(`0x${transactionHex}`);

  if (tx.signature) {
    throw new Error('Transaction is already signed');
  }

  const fireblocks = new Fireblocks({
    apiKey: config.apiKey,
    secretKey: config.secretKey,
    basePath: config.basePath || BasePath.Sandbox,
  });

  const isProduction =
    config.basePath &&
    config.basePath !== BasePath.Sandbox &&
    typeof config.basePath === 'string' &&
    config.basePath.includes('api.fireblocks.io');
  const assetId = isProduction ? 'ETH' : 'ETH_TEST5';

  const transactionRequest = {
    assetId,
    source: {
      type: TransferPeerPathType.VaultAccount,
      id: String(config.vaultAccountId),
    },
    destination: {
      type: TransferPeerPathType.ExternalWallet,
      oneTimeAddress: {
        address: tx.to || '',
      },
    },
    amount: tx.value.toString(),
    operation: TransactionOperation.Raw,
    extraParameters: {
      rawMessageData: {
        messages: [
          {
            content: transactionHex,
          },
        ],
      },
    },
  };

  const result = await fireblocks.transactions.createTransaction({
    transactionRequest,
  });

  if (!result.data?.id) {
    throw new Error('Fireblocks transaction creation failed');
  }

  const signedTxHex = await waitForTransactionCompletion(
    fireblocks,
    result.data.id
  );

  return signedTxHex;
}

async function waitForTransactionCompletion(
  fireblocks: Fireblocks,
  transactionId: string,
  maxRetries: number = 30,
  retryDelay: number = 1000
): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    const result = await fireblocks.transactions.getTransaction({
      txId: transactionId,
    });

    const transaction = result.data;
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    const status = transaction.status;
    if (status === 'COMPLETED' || status === 'COMPLETED_PENDING_SIGNATURE') {
      if (transaction.signedMessages && transaction.signedMessages.length > 0) {
        const signedMessage = transaction.signedMessages[0];
        if (signedMessage.content) {
          return signedMessage.content;
        }
      }
      throw new Error(
        'Transaction completed but no signed message content found. For RAW operations, Fireblocks should return signed PSBT/transaction in signedMessages.'
      );
    }

    if (
      status === 'FAILED' ||
      status === 'CANCELLED' ||
      status === 'REJECTED'
    ) {
      throw new Error(`Transaction ${status.toLowerCase()}`);
    }

    await new Promise((resolve) => setTimeout(resolve, retryDelay));
  }

  throw new Error('Transaction signing timeout');
}
