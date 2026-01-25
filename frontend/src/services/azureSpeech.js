import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';

class AzureSpeechService {
  constructor() {
    this.speechConfig = null;
    this.audioConfig = null;
    this.recognizer = null;
  }

  initialize(apiKey, region) {
    try {
      this.speechConfig = SpeechSDK.SpeechConfig.fromSubscription(apiKey, region);
      this.speechConfig.speechRecognitionLanguage = 'en-US';
      this.audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
      return true;
    } catch (error) {
      console.error('Azure Speech initialization error:', error);
      throw error;
    }
  }

  async assessPronunciation(text, onResult, onError) {
    if (!this.speechConfig) {
      throw new Error('Speech SDK not initialized');
    }

    this.recognizer = new SpeechSDK.SpeechRecognizer(
      this.speechConfig,
      this.audioConfig
    );
    
    const grammar = SpeechSDK.PhraseListGrammar.from([text]);
    this.recognizer.grammar = grammar;
    
    this.recognizer.recognizing = (s, e) => {
      console.log('Recognizing:', e.result.text);
    };

    this.recognizer.recognized = (s, e) => {
      const result = e.result;
      console.log('Result JSON:', result.json);
      onResult(result);
    };

    this.recognizer.canceled = (s, e) => {
      console.error('Recognition canceled:', e.errorDetails);
      onError(e.errorDetails);
    };

    try {
      await this.recognizer.startContinuousRecognitionAsync();
    } catch (error) {
      console.error('Start recognition error:', error);
      onError(error.message);
    }
  }

  stopRecognition() {
    if (this.recognizer) {
      return this.recognizer.stopContinuousRecognitionAsync();
    }
  }

  close() {
    if (this.recognizer) {
      this.recognizer.close();
    }
    if (this.audioConfig) {
      this.audioConfig.close();
    }
    if (this.speechConfig) {
      this.speechConfig.close();
    }
  }
}

export default new AzureSpeechService();
