export const ChainType = {
  BTC: 'BTC',
  ETH: 'ETH',
  SOL: 'SOL',
  DOT: 'DOT',
} as const;

export type ChainType = (typeof ChainType)[keyof typeof ChainType];

export interface SignRequest {
  transaction: string;
  chainType: string;
  options?: Record<string, unknown>;
}

export interface SignResponse {
  signature: string;
  publicKey?: string;
  signerType: string;
  signedTransaction?: string;
}

export enum SignerType {
  DIRECT_KEY = 'direct_key',
  HSM = 'hsm',
  MPC = 'mpc',
}
