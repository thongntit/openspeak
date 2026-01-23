# AI Conversation Feature - Technical Documentation

## Overview

A fully local, browser-based AI conversation system for English learning. Users can practice speaking English with an AI that listens, responds intelligently, and speaks back - all running locally with no server required.

## Architecture

### Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (PWA)                            │
│                                                             │
│  Speech-to-Text          LLM                Text-to-Speech │
│  ──────────────          ───                ────────────── │
│  Whisper Tiny           Gemini Nano*        SpeechT5 TTS   │
│  (41 MB)                OR                  (121 MB)       │
│                         Phi-3.5-mini                        │
│                         (1.8 GB)                            │
│                                                             │
│  * Chrome users get Gemini Nano (better quality)           │
│  * Other browsers use Phi-3.5-mini via WebLLM             │
└─────────────────────────────────────────────────────────────┘
```

### Model Breakdown

| Component | Model | Size | Provider | Purpose |
|-----------|-------|------|----------|---------|
| STT | Xenova/whisper-tiny.en | 41 MB | Transformers.js | English speech recognition |
| LLM (Chrome) | Gemini Nano | ~0 MB* | Chrome Built-in AI | Conversation generation |
| LLM (Others) | Phi-3.5-mini-instruct | 1.8 GB | WebLLM | Conversation fallback |
| TTS | Xenova/speecht5_tts | 121 MB | Transformers.js | Speech synthesis |

**Total Download:**
- Chrome users: **~162 MB** (Gemini Nano managed by Chrome)
- Other browsers: **~1.96 GB** (includes Phi-3.5-mini)

\* Gemini Nano is pre-installed by Chrome (~1.5-2.4 GB) but doesn't count toward user download

## Features

### Core Capabilities
- ✅ Speech-to-speech conversation (hold to talk)
- ✅ Fully local processing (works offline after initial load)
- ✅ Chrome Gemini Nano integration for better responses
- ✅ Cross-browser support with Gemma 3 270M fallback
- ✅ Progressive Web App (PWA) - installable
- ✅ Real-time status indicators
- ✅ Chat history with auto-scroll
- ✅ Clean, modern UI with animations

### User Flow

1. **Page Load** → Models download and initialize (~1-2 minutes first time)
2. **Ready State** → User holds microphone button to speak
3. **Recording** → User speaks English (auto-detects speech end)
4. **Processing** → STT transcribes → LLM generates response → TTS speaks
5. **Response** → User hears AI response through speakers

## Implementation Details

### Chrome AI Detection

```javascript
// Check if Chrome's Gemini Nano is available
if ('ai' in window && 'languageModel' in window.ai) {
  const capabilities = await window.ai.languageModel.capabilities();
  if (capabilities.available === 'readily') {
    chromeAI = await window.ai.languageModel.create({
      systemPrompt: 'You are a friendly English teacher...'
    });
    useGeminiNano = true;
  }
}
```

### Model Loading Strategy

Models are loaded sequentially with progress indicators:

1. Check for Chrome AI (instant)
2. Load Whisper Tiny (STT) - ~10-20 seconds
3. Load Phi-3.5-mini via WebLLM (if no Chrome AI) - ~90-180 seconds
4. Load SpeechT5 (TTS) - ~15-30 seconds

**Optimization**: Models are cached in browser IndexedDB after first download.

### Audio Processing Pipeline

```javascript
// 1. Record audio via MediaRecorder
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const mediaRecorder = new MediaRecorder(stream);

// 2. Convert to format Whisper expects
const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
const audioData = audioBuffer.getChannelData(0); // Float32Array

// 3. Transcribe with Whisper
const result = await sttPipeline(audioData);

// 4. Generate response
const response = await chromeAI.prompt(userMessage); // or llmPipeline

// 5. Synthesize speech
const ttsResult = await ttsPipeline(response, { speaker_embeddings });

// 6. Play audio
const source = audioContext.createBufferSource();
source.buffer = audioBuffer;
source.start(0);
```

## Browser Compatibility

| Browser | STT | LLM | TTS | Status |
|---------|-----|-----|-----|--------|
| Chrome 138+ (Desktop) | ✅ | ✅ Gemini Nano | ✅ | Full Support |
| Chrome 137- (Desktop) | ✅ | ✅ Phi-3.5-mini | ✅ | Full Support |
| Edge (Desktop) | ✅ | ✅ Phi-3.5-mini | ✅ | Full Support |
| Firefox | ✅ | ✅ Phi-3.5-mini | ✅ | Full Support |
| Safari | ⚠️ | ⚠️ No WebGPU | ⚠️ | Limited* |
| Mobile (All) | ✅ | ⚠️ Slow | ⚠️ Slow | Limited* |

\* Mobile support is technically possible but models are large and slow on mobile hardware

## Performance Metrics

### Model Loading Time (Desktop, 100 Mbps)
- Whisper Tiny: 10-20 seconds
- Phi-3.5-mini (WebLLM): 90-180 seconds
- SpeechT5: 15-30 seconds
- **Total first load: 2-4 minutes**
- **Subsequent loads: Instant (cached)**

### Inference Time (Desktop, Modern GPU)
- STT (3 seconds of audio): ~1-2 seconds
- LLM (Gemini Nano): ~0.5-1 second
- LLM (Phi-3.5-mini): ~1-3 seconds
- TTS (short response): ~1-2 seconds
- **Total round trip: 3-7 seconds**

### Memory Usage
- Chrome with Gemini Nano: ~800 MB - 1.2 GB
- Other browsers with Phi-3.5-mini: ~2 GB - 3 GB

## PWA Features

### Service Worker
- Caches HTML, CSS, JS for offline access
- Network-first strategy for model files
- Cache-first strategy for app assets

### Manifest
- Installable on desktop and mobile
- Custom icon and theme color
- Standalone display mode

### Installation
1. Visit the app in Chrome/Edge
2. Click install icon in address bar
3. App appears on desktop/home screen
4. Works offline after initial load

## Known Limitations

### Current Constraints
1. **First Load Time**: 1-2 minutes to download models
2. **Mobile Performance**: Slow inference on mobile devices
3. **Chrome AI Availability**: Requires Chrome 137+ and 22 GB free space
4. **Memory Usage**: 1-2 GB RAM required
5. **No Streaming**: LLM generates full response before speaking

### Future Improvements
- [ ] Streaming TTS (speak while generating)
- [ ] Smaller model variants for mobile
- [ ] Voice activity detection (auto-stop recording)
- [ ] Conversation context/memory
- [ ] Custom system prompts
- [ ] Multiple AI personalities
- [ ] Pronunciation feedback integration
- [ ] Save/export conversations

## Development Setup

### Local Testing

```bash
# Start local server (required for HTTPS/microphone access)
python3 -m http.server 8000

# Or use Node.js
npx serve .

# Visit
http://localhost:8000/conversation.html
```

### Requirements
- Modern browser with WebGPU support (Chrome 113+, Edge 113+)
- Microphone permission
- 2-4 GB free RAM
- ~500 MB storage for models

### Debugging

**Enable verbose logging:**
```javascript
// In conversation.html, add to console
env.loggingLevel = 'debug';
```

**Check model loading:**
```javascript
// Console will show:
// ✓ STT model loaded
// ✓ LLM model loaded
// ✓ TTS model loaded
```

**Test individual components:**
```javascript
// Test STT only
const result = await sttPipeline(audioData);
console.log(result.text);

// Test LLM only
const response = await chromeAI.prompt("Hello");
console.log(response);

// Test TTS only
await speakText("Hello world");
```

## Cost Analysis

### Comparison: Local vs Cloud

| Approach | Cost/Month | Latency | Privacy | Offline |
|----------|------------|---------|---------|---------|
| **Local AI** | $0 | 3-8s | ✅ Full | ✅ Yes |
| OpenAI API | $10-50 | 1-2s | ⚠️ Cloud | ❌ No |
| Azure Speech+AI | $5-20 | 2-4s | ⚠️ Cloud | ❌ No |

**Local AI Benefits:**
- Zero ongoing costs
- Complete privacy (no data leaves device)
- Works offline
- No API rate limits

**Local AI Trade-offs:**
- Longer initial load time
- Higher memory usage
- Slower inference than cloud
- Limited to device capabilities

## Security & Privacy

### Data Handling
- ✅ All audio processing happens locally
- ✅ No data sent to external servers
- ✅ No analytics or tracking
- ✅ Conversations not stored (unless user saves)
- ✅ Microphone access only when recording

### Chrome AI Considerations
- Gemini Nano runs on-device
- Chrome manages model updates
- No data sent to Google during inference
- Model is shared across origins but data is isolated

## Resources

### Model Sources
- [Xenova/whisper-tiny.en](https://huggingface.co/Xenova/whisper-tiny.en)
- [Phi-3.5-mini-instruct (via WebLLM)](https://github.com/mlc-ai/web-llm)
- [Xenova/speecht5_tts](https://huggingface.co/Xenova/speecht5_tts)

### Documentation
- [Transformers.js](https://huggingface.co/docs/transformers.js)
- [WebLLM](https://webllm.mlc.ai/)
- [Chrome Built-in AI](https://developer.chrome.com/docs/ai/built-in)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)

## License

MIT License - Free to use and modify
