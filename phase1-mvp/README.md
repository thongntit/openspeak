# Phase 1 MVP - Local AI Conversation

## Status: ✅ Working with LaMini-590M

Local AI conversation for English learning using Transformers.js with a 590M parameter model.

## Current Implementation

```
STT: Xenova/whisper-tiny.en         → 41 MB
LLM: Xenova/LaMini-Cerebras-590M    → 448 MB (q4f16)
TTS: Web Speech API                 → 0 MB
────────────────────────────────────────────────
Total:                                 489 MB
```

## What Works ✅

- **Speech-to-Text**: Xenova/whisper-tiny.en (41 MB) - Excellent accuracy
- **Text-to-Speech**: Native browser API (0 MB) - Works well
- **LLM**: LaMini-590M (590M params) - Much better than DistilGPT2
- **Chrome AI**: Gemini Nano detection - Works as premium option (Chrome 138+)

## Model Comparison

| Model | Parameters | Download Size | Quality |
|-------|-----------|---------------|---------|
| DistilGPT2 | 82M | 84 MB | Poor ❌ |
| **LaMini-590M** | **590M** | **448 MB** | **Good ✅** |
| SmolLM2-135M | 135M | N/A (incompatible) | - |

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

### Why DistilGPT2 Failed

1. **Not instruction-tuned** - Trained for text completion, not conversation
2. **Hallucinates** - Generates random text from training data
3. **No chat format** - Doesn't understand conversation structure
4. **Too small** - 82M parameters is insufficient for quality responses

### Why LaMini-590M Works Better

1. **7x larger** - 590M parameters vs 82M
2. **Better trained** - Cerebras trained on quality instruction data
3. **Proper ONNX** - Has correct decoder_model_merged_quantized.onnx file
4. **More coherent** - Produces sensible, contextual responses

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

## Recommendation

**Current setup (LaMini-590M) is viable for English learning:**
- ✅ Good quality responses
- ✅ Reasonable download size (489 MB)
- ✅ Cross-browser compatible
- ✅ Works offline after download

**Future improvements:**
1. Add Chrome AI as premium option (already implemented!)
2. Consider WebLLM for even better models (SmolLM2)
3. Add conversation memory/context
4. Add pronunciation feedback integration

**Status: Ready for testing and user feedback!**

## Test It

```bash
python3 -m http.server 8000
```

Visit: http://localhost:8000/phase1-mvp/conversation.html

**Expected experience:**
- First load: 45-90 seconds (model download)
- STT: Excellent transcription
- LLM: Good conversational responses
- TTS: Clear native browser voices

## About LaMini-590M

**LaMini-Cerebras-590M** is a GPT-2 model with 590M parameters trained by Cerebras on instruction-following data.

**Specs:**
- Parameters: 590M (7x larger than DistilGPT2)
- Architecture: GPT-2 (Causal decoder-only)
- Training: Instruction-following dataset
- ONNX: Optimized for Transformers.js
- Quantization: q4f16 (4-bit weights, 16-bit activations)

## Learnings

1. ✅ Transformers.js is great for STT (Whisper) and TTS
2. ✅ **Xenova namespace models** are the key to success with Transformers.js
3. ✅ LaMini-590M provides good quality for browser-based conversations
4. ✅ Chrome Built-in AI is the best option when available
5. ✅ Web Speech API is sufficient for TTS (don't need SpeechT5)

## Next Steps

Choose one path:
- **A** Chrome AI only (simplest, best UX)
- **B** WebLLM with SmolLM2 (cross-browser, larger download)
- **C** Hybrid with server fallback (most complex, most reliable)
