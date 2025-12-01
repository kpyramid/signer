import { BaseSigner } from '../../core/base';
import { SignRequest, SignResponse, SignerType } from '../../../types';
import { KMSClient } from '@aws-sdk/client-kms';
import { signTransactionWithHSM } from './algorithms';

export interface HSMConfig {
  keyId: string;
  region: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
  };
}

export class HSMSigner extends BaseSigner {
  private kmsClient: KMSClient;
  private keyId: string;

  constructor(config: HSMConfig) {
    super(SignerType.HSM);

    if (!config.keyId || !config.region) {
      throw new Error('HSM keyId and region are required');
    }

    this.keyId = config.keyId;

    const clientConfig: {
      region: string;
      credentials?: {
        accessKeyId: string;
        secretAccessKey: string;
        sessionToken?: string;
      };
    } = {
      region: config.region,
    };

    if (config.credentials) {
      clientConfig.credentials = {
        accessKeyId: config.credentials.accessKeyId,
        secretAccessKey: config.credentials.secretAccessKey,
        sessionToken: config.credentials.sessionToken,
      };
    }

    this.kmsClient = new KMSClient(clientConfig);
  }

  async sign(request: SignRequest): Promise<SignResponse> {
    if (!this.validateRequest(request)) {
      throw new Error('Invalid sign request');
    }

    const signature = await signTransactionWithHSM(
      request,
      this.kmsClient,
      this.keyId
    );
    return {
      signature,
      signedTransaction: signature,
      signerType: this.getSignerType(),
    };
  }
}
