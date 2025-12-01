import { ISigner } from '../core/base';
import { SignerType } from '../../types';

export class SignerRegistry {
  private signers: Map<string, ISigner> = new Map();

  register(id: string, signer: ISigner): void {
    if (this.signers.has(id)) {
      throw new Error(`Signer with id "${id}" already exists`);
    }
    this.signers.set(id, signer);
  }

  get(id: string): ISigner | undefined {
    return this.signers.get(id);
  }

  remove(id: string): boolean {
    return this.signers.delete(id);
  }

  list(): Array<{ id: string; type: string }> {
    return Array.from(this.signers.entries()).map(([id, signer]) => ({
      id,
      type: signer.getSignerType(),
    }));
  }

  findByType(type: SignerType): ISigner[] {
    return Array.from(this.signers.values()).filter(
      (signer) => signer.getSignerType() === type
    );
  }
}
