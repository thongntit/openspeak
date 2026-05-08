import { Controller, Get } from '@nestjs/common';
import { SpeechService } from './speech.service';

@Controller('speech')
export class SpeechController {
  constructor(private readonly speechService: SpeechService) {}

  @Get('token')
  getToken() {
    return this.speechService.getToken();
  }
}
