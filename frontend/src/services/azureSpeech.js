import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';

class AzureSpeechService {
  constructor() {
    this.speechConfig = null;
    this.audioConfig = null;
    this.recognizer = null;
  }

  initializeWithToken(token, region) {
    this.speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(token, region);
    this.speechConfig.speechRecognitionLanguage = 'en-US';
    this.audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
  }

  async assessPronunciation(text, onResult, onError) {
    if (!this.speechConfig) {
      throw new Error('Speech SDK not initialized');
    }

    // Close any existing recognizer
    if (this.recognizer) {
      this.recognizer.close();
    }

    // Create pronunciation assessment config
    const pronunciationConfig = new SpeechSDK.PronunciationAssessmentConfig(
      text,
      SpeechSDK.PronunciationAssessmentGradingSystem.HundredMark,
      SpeechSDK.PronunciationAssessmentGranularity.Phoneme,
      true
    );

    this.recognizer = new SpeechSDK.SpeechRecognizer(
      this.speechConfig,
      this.audioConfig
    );

    // Apply pronunciation assessment config
    pronunciationConfig.applyTo(this.recognizer);

    this.recognizer.recognizing = (s, e) => {
      console.log('Recognizing:', e.result.text);
    };

    this.recognizer.recognized = (s, e) => {
      const result = e.result;
      console.log('Result JSON:', result.json);
      if (result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
        onResult(result);
      } else if (result.reason === SpeechSDK.ResultReason.NoMatch) {
        onError('No speech recognized');
      }
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
      return this.recognizer.stopContinuousRecognitionAsync(
        () => {
          console.log('Recognition stopped');
        },
        (err) => {
          console.error('Error stopping recognition:', err);
        }
      );
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
