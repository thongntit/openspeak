# English Pronunciation Practice App

A browser-based pronunciation assessment tool powered by Azure Speech Services with phoneme-level feedback, prosody analysis, and real-time scoring.

## ✨ Features

### Core Features
- ✅ **Pronunciation Scoring (0-100)** - Instant accuracy feedback
- ✅ **Prosody Assessment** - Evaluates stress, intonation, and rhythm
- ✅ **Phoneme-Level Analysis** - See which sounds need improvement
- ✅ **Syllable Breakdown** - Practice word stress patterns
- ✅ **IPA Symbols** - Real phonetic notation (ɑ, æ, ʃ, etc.)
- ✅ **Adjustable Strictness** - Set grading threshold (60-95%)
- ✅ **Real-time Feedback** - Immediate results after recording
- ✅ **No Backend Required** - Pure client-side JavaScript
- ✅ **Privacy-Focused** - Audio processed via Azure API only

### Advanced Feedback
- **Break Detection** - Identifies unexpected/missing pauses
- **Monotone Detection** - Alerts if speech lacks intonation variety
- **Word & Syllable Scores** - Granular accuracy breakdown
- **Color-Coded Display** - Green (correct) / Red (needs work)

## 🚀 Quick Start

### 1. Get Azure Speech Service Key (Free Tier)

1. Visit [Azure Portal](https://portal.azure.com/)
2. Create account → **"Create a resource"** → Search **"Speech Service"**
3. Select **Free (F0)** tier:
   - 5 hours/month free
   - No credit card for first month
4. Go to **"Keys and Endpoint"**
5. Copy **Key 1** and **Region** (e.g., `southeastasia`)

### 2. Run the App Locally

```bash
# Option 1: Python
python3 -m http.server 8000

# Option 2: Node.js
npx serve .

# Option 3: PHP
php -S localhost:8000
```

Open browser: **http://localhost:8000**

> **Why local server?** Browser requires HTTPS or localhost for microphone access.

### 3. Start Practicing

1. **Enter Azure credentials** (Key + Region)
2. **Type a word** (default: "pronunciation")
3. **Click Record** → Speak clearly → Auto-stops
4. **Review results**:
   - Overall pronunciation score
   - Prosody score (stress/rhythm)
   - Phoneme-by-phoneme breakdown
   - Feedback on specific issues

## 💰 Pricing Analysis

### Azure Speech Service Costs

| API Type | Price/Hour | Use Case | Current Implementation |
|----------|------------|----------|------------------------|
| **Real-time (SDK)** | $1.30/hr | Live transcription | ✅ **Currently Using** |
| REST Short Audio | $0.66-1.30/hr | <30s clips | ⚡ Recommended Switch |
| Fast Transcription | $0.36/hr | Sync batch | Pronunciation unclear |
| Batch Transcription | $0.18/hr | Async batch | Pronunciation included |

**Breakdown:**
- Base transcription: $1/hour
- Pronunciation Assessment add-on: $0.30/hour
- **Total (current):** $1.30/hour

### Realistic Usage Cost

**Assumptions:**
- 30 min app usage per day
- Practice ~30 words with 4 retries each
- Each recording: 2 seconds average
- Actual API time: 30 words × 4 × 2s = **4 minutes/day**

**Monthly Cost:**
```
4 min/day × 30 days = 120 min = 2 hours/month
2 hours × $1.30/hour = $2.60/month
```

**With Free Tier:**
- First 5 hours/month: FREE
- Covers 75 days of practice (2.5 months)
- **Cost: $0** for normal usage ✅

### SaaS Economics (If Building a Product)

Target: $3/month subscription

| Scenario | API Cost | Margin | Viable? |
|----------|----------|--------|---------|
| Current (Real-time) | $2.60 | 13% | ⚠️ Tight |
| REST Short Audio | $1.30 | 57% | ✅ Good |
| Batch API | $0.36 | 88% | ✅ Excellent |

## 🏗️ Technical Architecture

### Current Implementation

```
┌──────────────────────────────────────────────────────────┐
│                       Browser                            │
│  ┌────────────────────────────────────────────────────┐  │
│  │  index.html (Single-Page App)                      │  │
│  │  ├─ Azure Speech SDK v1.40+ (CDN)                  │  │
│  │  ├─ Microphone capture (getUserMedia API)          │  │
│  │  └─ Real-time pronunciation assessment             │  │
│  └────────────────────────────────────────────────────┘  │
│                         │                                │
│                         │ Audio Stream                   │
│                         ▼                                │
└──────────────────────────────────────────────────────────┘
                          │
                          │ HTTPS (Speech SDK)
                          │
┌──────────────────────────────────────────────────────────┐
│              Azure Speech Service API                    │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Speech-to-Text Recognition                        │  │
│  │  ├─ Phoneme-level scoring                          │  │
│  │  ├─ Prosody assessment (stress/intonation)         │  │
│  │  ├─ Syllable breakdown                             │  │
│  │  └─ Break/monotone detection                       │  │
│  └────────────────────────────────────────────────────┘  │
│                         │                                │
│                         │ JSON Response                  │
│                         ▼                                │
└──────────────────────────────────────────────────────────┘
                          │
                          │
                          ▼
              Display Results in Browser
```

### Tech Stack

- **Frontend:** Vanilla JavaScript (no frameworks)
- **Speech SDK:** Azure Cognitive Services Speech SDK v1.40+
- **Language:** en-US (required for prosody assessment)
- **Audio Format:** PCM 16kHz (auto-converted by SDK)
- **API:** Real-time Speech Recognition with Pronunciation Assessment

### Key Configuration

```javascript
// Pronunciation Assessment Config
const config = new SpeechSDK.PronunciationAssessmentConfig(
    referenceText,
    SpeechSDK.PronunciationAssessmentGradingSystem.HundredMark,
    SpeechSDK.PronunciationAssessmentGranularity.Phoneme,
    true // enableMiscue
);

// Enable prosody (stress, intonation, rhythm)
config.enableProsodyAssessment = true;

// Language setting (required for prosody)
speechConfig.speechRecognitionLanguage = "en-US";
```

## 📊 Sample Output

### Console Output
```javascript
{
  "PronunciationAssessment": {
    "AccuracyScore": 96,
    "FluencyScore": 100,
    "CompletenessScore": 100,
    "PronScore": 97.6,
    "ProsodyScore": 93,
    "Feedback": {
      "Break": {
        "UnexpectedBreak": { "Confidence": 0.1 },
        "MissingBreak": { "Confidence": 0.05 }
      },
      "Intonation": {
        "Monotone": { "Confidence": 0.02 }
      }
    }
  },
  "Words": [{
    "Word": "pronunciation",
    "Syllables": [
      { "Grapheme": "pro", "AccuracyScore": 93 },
      { "Grapheme": "nun", "AccuracyScore": 95 },
      { "Grapheme": "ci", "AccuracyScore": 100 },
      { "Grapheme": "a", "AccuracyScore": 98 },
      { "Grapheme": "tion", "AccuracyScore": 96 }
    ],
    "Phonemes": [
      { "Phoneme": "p", "AccuracyScore": 95 },
      { "Phoneme": "r", "AccuracyScore": 88 },
      { "Phoneme": "ah", "AccuracyScore": 93 },
      // ... etc
    ]
  }]
}
```

### UI Display
```
┌─────────────────────────────────────────────┐
│  Pronunciation Score: 97                    │
│  Prosody Score: 93                          │
├─────────────────────────────────────────────┤
│  Syllables:                                 │
│  [pro] 93%  [nun] 95%  [ci] 100%  [a] 98%  │
│                                              │
│  Phonemes (IPA):                            │
│  [p] 95%  [ɹ] 88%  [ə] 93%  [n] 100% ...   │
│   ✓       ✓       ✓       ✓                │
├─────────────────────────────────────────────┤
│  ✓ Good stress and intonation!             │
└─────────────────────────────────────────────┘
```

## 🔧 Future Optimization Opportunities

### 1. Switch to REST API for Short Audio
**Goal:** Reduce API cost from $1.30/hr to $0.66/hr (50% savings)

**Changes Required:**
```javascript
// Current: SDK-based real-time
recognizer.recognizeOnceAsync(...)

// Target: REST API
fetch('https://{region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1', {
  method: 'POST',
  headers: {
    'Content-Type': 'audio/wav',
    'Ocp-Apim-Subscription-Key': apiKey,
    'Pronunciation-Assessment': base64EncodedParams
  },
  body: audioBlob
})
```

**Trade-offs:**
- ✅ 50% cost reduction
- ✅ Same features (phoneme + prosody)
- ⚠️ Need to handle audio encoding manually
- ⚠️ API key exposed in browser (use backend proxy for production)

### 2. Add Backend + Batch API
**Goal:** Reduce to $0.18/hr (86% savings)

**Architecture:**
```
Browser → Upload audio → Backend Server
                           ↓
                      Azure Batch API
                           ↓
                    Poll for results
                           ↓
                   Return to browser
```

**Trade-offs:**
- ✅ 86% cost reduction
- ✅ API key hidden in backend
- ❌ Adds server hosting cost ($5-10/month)
- ❌ Async delay (5-30 seconds)
- ❌ More complex architecture

### 3. Limit Usage with Quotas
**Goal:** Stay within free tier

**Implementation:**
- Track usage in localStorage
- Limit to 10 recordings/day (free tier = 5 hours/month)
- Upgrade prompt for heavy users

### 4. Hybrid Approach
- Use **Whisper API** ($0.006/min) for transcription
- Only call Azure for detailed phoneme scoring
- Cost: ~$0.50/month for 30 min daily

## 🐛 Troubleshooting

### Microphone Issues

**"Microphone not allowed"**
- Click lock icon in browser address bar → Allow microphone
- Must use HTTPS or localhost (HTTP on remote won't work)

**"No audio detected"**
- Check microphone is selected in browser settings
- Try speaking louder and closer to mic
- Test mic in system settings first

### API Issues

**"Invalid API key"**
- Verify Key and Region match in Azure Portal
- Check Speech Service resource is active (not deleted)
- Ensure no extra spaces in pasted key

**"Error 429: Too Many Requests"**
- Hit rate limit (20 requests/min for free tier)
- Wait 60 seconds and retry
- Consider upgrading to paid tier

**"Pronunciation score shows 0% / NaN"**
- Browser SDK version too old (need v1.34+)
- Check console for API response structure
- Verify `enableProsodyAssessment = true` is set

### Prosody Issues

**"Prosody score not showing"**
- Prosody requires `en-US` language (hardcoded in app)
- Azure region must support prosody (most do)
- SDK version must be 1.34.0 or higher

**"Always says 'monotone speech'"**
- Try varying pitch more while speaking
- Prosody assessment is strict by default
- Practice with exaggerated stress patterns

## 📚 Resources & Documentation

### Official Microsoft Docs
- [Azure Speech Service Overview](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/overview)
- [Pronunciation Assessment Guide](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-pronunciation-assessment)
- [Speech SDK for JavaScript](https://learn.microsoft.com/en-us/javascript/api/microsoft-cognitiveservices-speech-sdk/)
- [Pricing Calculator](https://azure.microsoft.com/en-us/pricing/calculator/)

### API References
- [REST API for Short Audio](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/rest-speech-to-text-short)
- [Batch Transcription API](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/batch-transcription)
- [Fast Transcription API](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/fast-transcription-create)

### Related Q&A
- [Pronunciation Assessment Pricing](https://learn.microsoft.com/en-us/answers/questions/5608069/pricing-and-usage-of-pronunciation-assessment-feat)
- [Fast Transcription with Pronunciation](https://learn.microsoft.com/en-us/answers/questions/5572914/can-i-use-the-azure-speech-to-text-fast-transcript)

### IPA Reference
- [Interactive IPA Chart](https://www.ipachart.com/)
- [English Phonemes Guide](https://www.internationalphoneticassociation.org/content/ipa-chart)

## 📝 License

MIT License - Free to use and modify

## 🤝 Contributing

This is an MVP built in one session. Contributions welcome for:
- [ ] Switch to REST API for cost optimization
- [ ] Add usage tracking/quotas
- [ ] Support more languages (beyond en-US)
- [ ] Offline mode with local Whisper
- [ ] Word lists and lesson plans
- [ ] Progress tracking over time

## 💡 Acknowledgments

Built with Azure Cognitive Services Speech SDK. Prosody assessment feature requires SDK v1.34.0+ and en-US locale.
