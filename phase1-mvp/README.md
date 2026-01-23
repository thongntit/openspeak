# Phase 1 MVP - Local AI Conversation

## Status: ⚠️ Proof of Concept (Limited Quality)

This was an initial exploration of running local LLMs in the browser for English conversation practice.

## What Works ✅

- Speech-to-Text: Xenova/whisper-tiny.en (41 MB) - Works well
- Text-to-Speech: Native browser API (0 MB) - Works well
- Chrome AI: Gemini Nano detection and usage - Works well (Chrome 138+ only)

## What Doesn't Work Well ❌

- LLM: Xenova/distilgpt2 produces poor quality conversation responses
- Hallucinates frequently
- Not instruction-tuned for conversation
- Too basic for language learning

## Current Implementation

```
STT: Xenova/whisper-tiny.en    → 41 MB
LLM: Xenova/distilgpt2         → 80 MB
TTS: Web Speech API            → 0 MB
────────────────────────────────────────
Total:                           121 MB
```

## Files

| File | Purpose |
|------|---------|
| `conversation.html` | Main conversation interface |
| `home.html` | Landing page with feature selection |
| `test-llm.html` | Test page for different LLM options |
| `manifest.json` | PWA manifest |
| `sw.js` | Service worker for offline support |

## Research Documentation

- `ACTUAL_ISSUE.md` - Root cause analysis (ONNX file naming issues)
- `RESEARCH_FINDINGS.md` - Complete research on browser LLMs
- `MODEL_COMPARISON.md` - Comparison of different model options
- `LIGHTWEIGHT_SETUP.md` - Lightweight configuration details
- `CONVERSATION_README.md` - Technical documentation

## Problem Summary

### Why DistilGPT2 Fails

1. **Not instruction-tuned** - Trained for text completion, not conversation
2. **Hallucinates** - Generates random text from training data
3. **No chat format** - Doesn't understand conversation structure
4. **Too small** - 82M parameters is insufficient for quality responses

### Why Other Models Didn't Work

| Model | Issue |
|-------|-------|
| SmolLM2-135M-Instruct | Wrong ONNX file naming for Transformers.js |
| Gemma 3-270M | Not supported in Transformers.js yet |
| Qwen2.5-0.5B | ONNX files not in expected format |

## What Would Work Better

### Option 1: WebLLM Framework
```javascript
import * as webllm from "@mlc-ai/web-llm";
const engine = await webllm.CreateMLCEngine(
  "SmolLM2-135M-Instruct-q0f32-MLC"
);
```
- ✅ Proper model support
- ✅ Better optimization
- ❌ Larger download (719 MB)

### Option 2: Chrome AI Only
- ✅ Best quality (Gemini Nano)
- ✅ Smallest download (162 MB)
- ❌ Chrome 138+ only
- ❌ Desktop only

### Option 3: Hybrid Approach
- Chrome users → Gemini Nano
- Other browsers → Show message to use Chrome
- Simplest implementation

## Recommendation for Next Phase

**Phase 2 should:**
1. Focus on Chrome AI (Gemini Nano) - best quality/experience
2. Add graceful degradation for other browsers
3. Consider server-side LLM fallback if needed
4. Or invest in WebLLM implementation (719 MB download)

**Don't waste time on Transformers.js LLMs** - model compatibility issues persist.

## Test It Anyway

```bash
python3 -m http.server 8000
```

Visit: http://localhost:8000/phase1-mvp/conversation.html

**Experience:** STT and TTS work great, but expect poor LLM responses.

## Learnings

1. ✅ Transformers.js is great for STT (Whisper) and TTS
2. ❌ Transformers.js text-generation has model compatibility issues
3. ✅ Chrome Built-in AI is the best browser LLM option currently
4. ✅ Web Speech API is sufficient for TTS (don't need SpeechT5)
5. ⚠️ Local LLMs in browser still maturing

## Next Steps

Choose one path:
- **A** Chrome AI only (simplest, best UX)
- **B** WebLLM with SmolLM2 (cross-browser, larger download)
- **C** Hybrid with server fallback (most complex, most reliable)
