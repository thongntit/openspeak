# Lightweight AI Conversation Setup

## Overview

A minimal, fast-loading AI conversation system optimized for quick deployment and low resource usage.

## Model Stack

| Component | Model | Size | Provider | Notes |
|-----------|-------|------|----------|-------|
| STT | Whisper-tiny.en | 41 MB | Transformers.js | Fast, accurate |
| LLM | SmolLM-135M-Instruct | ~270 MB | Transformers.js | Tiny but capable |
| TTS | Web Speech API | 0 MB | Browser built-in | Native quality |

**Total Download: ~311 MB** (vs 1.96 GB with Phi-3.5)

## Performance

### Loading Time (100 Mbps)
- Whisper Tiny: 10-20 seconds
- SmolLM-135M: 30-60 seconds
- Native TTS: Instant
- **Total first load: 40-80 seconds** ✨

### Inference Time (Desktop)
- STT: ~1-2 seconds
- LLM: ~2-4 seconds
- TTS: ~0.5-1 second
- **Total round trip: 3.5-7 seconds**

### Memory Usage
- Peak: ~600 MB - 1 GB
- Idle: ~300 MB - 500 MB

## Model Details

### SmolLM-135M-Instruct

**About:**
- 135 million parameters
- Trained by Hugging Face
- Optimized for instruction following
- Uses ChatML format

**Strengths:**
- Very fast inference
- Low memory footprint
- Good for simple conversations
- Perfect for learning scenarios

**Limitations:**
- Less sophisticated than larger models
- May occasionally give simpler responses
- Limited knowledge compared to larger LLMs

**Prompt Format:**
```
<|im_start|>system
You are a helpful assistant.<|im_end|>
<|im_start|>user
Hello!<|im_end|>
<|im_start|>assistant
```

### Web Speech API (TTS)

**About:**
- Built into all modern browsers
- Uses OS-level speech synthesis
- No model download required

**Strengths:**
- Zero download size
- Instant availability
- Natural-sounding voices
- Multiple voice options

**Limitations:**
- Voice quality varies by OS/browser
- Limited voice customization
- Requires internet on some platforms (first time)

**Best Voices:**
- Windows: Microsoft voices
- macOS: Samantha, Alex
- Chrome: Google voices (if available)

## Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | Best performance |
| Edge | ✅ Full | Excellent voices on Windows |
| Firefox | ✅ Full | Good support |
| Safari | ✅ Full | Great voices on macOS |
| Mobile | ⚠️ Limited | Slow but functional |

## Comparison with Previous Setups

### Option 1: Lightweight (Current)
- Download: 311 MB
- Load time: 40-80 seconds
- Memory: 600 MB - 1 GB
- Quality: Good for basic conversations
- **Best for: Quick setup, mobile, learning**

### Option 2: High Quality (Phi-3.5)
- Download: 1.96 GB
- Load time: 2-4 minutes
- Memory: 2-3 GB
- Quality: Excellent conversations
- **Best for: Desktop, advanced users**

### Option 3: Premium (Gemini Nano on Chrome)
- Download: 162 MB (Whisper + native TTS only)
- Load time: 10-30 seconds
- Memory: 800 MB - 1.2 GB
- Quality: Excellent (best LLM)
- **Best for: Chrome 138+ users**

## When to Use This Setup

**Choose lightweight setup if:**
- ✅ You want fast loading (under 1 minute)
- ✅ Limited bandwidth or data caps
- ✅ Testing or development
- ✅ Basic conversation practice
- ✅ Mobile devices
- ✅ Limited RAM (< 4 GB)

**Choose larger model if:**
- ❌ You need sophisticated responses
- ❌ Complex conversations required
- ❌ Desktop with good hardware
- ❌ Advanced language learning

## Tips for Best Experience

### Optimize SmolLM Responses

**System prompt tuning:**
```javascript
// Keep it simple and direct
"You are a friendly English teacher. Use 1-2 sentences."

// Too complex will confuse small model
"You are an advanced pedagogical expert..." ❌
```

**Generation parameters:**
```javascript
{
  max_new_tokens: 60,      // Keep responses short
  temperature: 0.7,        // Not too creative
  top_p: 0.9,             // Good balance
  repetition_penalty: 1.1 // Avoid repetition
}
```

### Improve TTS Quality

**Voice selection:**
```javascript
// Prefer Google or Microsoft voices
const voices = speechSynthesis.getVoices();
const goodVoice = voices.find(v =>
  v.name.includes('Google') ||
  v.name.includes('Microsoft')
);
```

**Speech parameters:**
```javascript
utterance.rate = 0.9;   // Slower for learners
utterance.pitch = 1.0;  // Natural pitch
```

## Advanced: Swap to Larger Model

To upgrade to Phi-3.5-mini later:

```javascript
// Replace SmolLM with Phi-3.5
import * as webllm from "https://esm.run/@mlc-ai/web-llm";

llmEngine = new webllm.MLCEngine();
await llmEngine.reload("Phi-3.5-mini-instruct-q4f16_1-MLC");
```

## Troubleshooting

### "Model loading very slow"
- Check internet speed
- Try different time of day
- Consider mobile hotspot if on slow WiFi

### "SmolLM responses are weird"
- Keep prompts simple and direct
- Reduce max_new_tokens to 40-60
- Increase temperature slightly (0.8-0.9)

### "No TTS voice available"
- Wait for page to fully load
- Check browser audio permissions
- Try refreshing page
- Some browsers need first user interaction

### "Out of memory"
- Close other tabs
- Restart browser
- Use smaller batch size
- Consider switching to Chrome's Gemini Nano

## Resources

- [SmolLM Collection](https://huggingface.co/collections/HuggingFaceTB/local-smollms)
- [SmolLM-135M Model](https://huggingface.co/HuggingFaceTB/SmolLM-135M-Instruct)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Transformers.js](https://huggingface.co/docs/transformers.js)

## License

MIT License - Models are Apache 2.0
