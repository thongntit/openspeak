const AZURE_BASE = 'https://{region}.stt.speech.microsoft.com/speech/recognition/interactive/cognitiveservices/v1?format=detailed';

export interface AzureAssessmentResult {
  score: number;
  feedback?: {
    accuracyScore?: number;
    fluencyScore?: number;
    completenessScore?: number;
    pronunciationScore?: number;
  };
  words?: Array<{ word: string; score?: number }>;
}

export async function assessPronunciation(
  audioBuffer: ArrayBuffer,
  word: string,
  region: string,
  subscriptionKey: string,
): Promise<AzureAssessmentResult> {
  const url = AZURE_BASE.replace('{region}', region);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': subscriptionKey,
      'Content-Type': 'audio/webm; codecs=opus',
    },
    body: audioBuffer,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error');
    throw new AzureError(`Azure error: ${res.status} ${text}`);
  }

  const json = await res.json() as AzureResult;

  // Azure returns a RecognitionResult with an AccuracyScore etc. in the Nenm value
  const nBest = json?.NBest?.[0];
  return {
    score: nBest?.PronunciationScore ?? 0,
    feedback: {
      accuracyScore: nBest?.Words
        ? average(nBest.Words.map((w: AzureWord) => w.PronunciationScore ?? 0))
        : nBest?.AccuracyScore,
      fluencyScore: nBest?.FluencyScore,
      completenessScore: nBest?.CompletenessScore,
      pronunciationScore: nBest?.PronunciationScore,
    },
    words: nBest?.Words?.map((w: AzureWord) => ({
      word: w.Word,
      score: w.PronunciationScore,
    })),
  };
}

function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export class AzureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AzureError';
  }
}

// Azure response shape (partial — only fields we care about)
interface AzureResult {
  NBest?: Array<{
    PronunciationScore?: number;
    AccuracyScore?: number;
    FluencyScore?: number;
    CompletenessScore?: number;
    Words?: AzureWord[];
  }>;
}

interface AzureWord {
  Word: string;
  PronunciationScore?: number;
}
