import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SpeechService {
  constructor(private readonly config: ConfigService) {}

  async getToken(): Promise<{ token: string; region: string }> {
    const key = this.config.getOrThrow<string>('AZURE_SPEECH_KEY');
    const region = this.config.getOrThrow<string>('AZURE_SPEECH_REGION');

    const res = await fetch(
      `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
      { method: 'POST', headers: { 'Ocp-Apim-Subscription-Key': key } },
    );

    if (!res.ok) {
      throw new InternalServerErrorException(
        'Failed to obtain Azure speech token',
      );
    }

    return { token: await res.text(), region };
  }
}
