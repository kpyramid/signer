import { ChainType } from '../../../types';
import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { Transaction, Wallet } from 'ethers';

export interface SigningResult {
  signature: string;
  signedTransaction: string;
}

export async function signTransaction(
  transactionHex: string,
  privateKey: string,
  chainType: ChainType
): Promise<SigningResult> {
  if (chainType === ChainType.BTC) {
    return signBTCTransaction(transactionHex, privateKey);
  } else if (chainType === ChainType.ETH) {
    return signETHTransaction(transactionHex, privateKey);
  }

  throw new Error(`Unsupported chain type for DirectKeySigner: ${chainType}`);
}

// Currently, only PSBT signing is supported for BTC.
// Raw transaction signing is NOT supported at this time.
// Make sure the provided transactionHex is in PSBT format; otherwise, an error will be thrown.
// Support P2WPKH/P2PKH/P2WSH/P2PKH for BTC.
// Support ECDSA/Schnorr for BTC.
//
// @TODO: Add support for raw transaction signing.
// @TODO: Add support for multiple UTXO inputs signing.
function signBTCTransaction(
  transactionHex: string,
  privateKey: string
): SigningResult {
  const psbtHex = transactionHex.startsWith('0x')
    ? transactionHex.slice(2)
    : transactionHex;
  let psbt: bitcoin.Psbt;
  try {
    psbt = bitcoin.Psbt.fromHex(psbtHex);
  } catch (error) {
    throw new Error(
      `Invalid PSBT format: ${error instanceof Error ? error.message : String(error)}. Expected PSBT format, not raw transaction.`
    );
  }

  const pkHex = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
  const priv = Buffer.from(pkHex, 'hex');

  const pub = ecc.pointFromScalar(priv, true);
  if (!pub) {
    throw new Error('Invalid private key');
  }

  const signer = {
    publicKey: Buffer.from(pub),
    sign: (hash: Buffer): Buffer => {
      const sig = ecc.sign(hash, priv);
      const der = bitcoin.script.signature.encode(Buffer.from(sig), 0x01);
      return der;
    },
    signSchnorr: (hash: Buffer): Buffer => {
      return Buffer.from(ecc.signSchnorr(hash, priv));
    },
  };

  psbt.signAllInputs(signer);
  psbt.finalizeAllInputs();

  const signedTxHex = psbt.extractTransaction().toHex();

  return {
    signature: signedTxHex,
    signedTransaction: signedTxHex,
  };
}

async function signETHTransaction(
  transactionHex: string,
  privateKey: string
): Promise<SigningResult> {
  const pkHex = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
  const privateKeyHex = `0x${pkHex}`;
  const wallet = new Wallet(privateKeyHex);

  const txHex = transactionHex.startsWith('0x')
    ? transactionHex
    : `0x${transactionHex}`;

  let tx: Transaction;
  try {
    tx = Transaction.from(txHex);
    if (tx.signature) {
      throw new Error('Transaction is already signed');
    }
  } catch (error) {
    throw new Error(
      `Invalid transaction format: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  const signedTx = await wallet.signTransaction(tx);
  const signedTxHex = signedTx.slice(2);

  return {
    signature: signedTxHex,
    signedTransaction: signedTxHex,
  };
}
