import { SignRequest, SignResponse } from '../../types';

export interface ISigner {
  sign(request: SignRequest): Promise<SignResponse>;
  getSignerType(): string;
  validateRequest(request: SignRequest): boolean;
}

export abstract class BaseSigner implements ISigner {
  protected signerType: string;

  constructor(signerType: string) {
    this.signerType = signerType;
  }

  abstract sign(request: SignRequest): Promise<SignResponse>;

  getSignerType(): string {
    return this.signerType;
  }

  validateRequest(request: SignRequest): boolean {
    if (!request.transaction || typeof request.transaction !== 'string') {
      return false;
    }
    if (!request.chainType || typeof request.chainType !== 'string') {
      return false;
    }
    return true;
  }
}
