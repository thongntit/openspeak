# The Actual Issue: ONNX File Naming Convention

## Root Cause

Transformers.js text-generation pipeline expects specific ONNX file names:
- `decoder_model_merged_quantized.onnx`
- `decoder_model.onnx`
- `model.onnx` (fallback)

## What Doesn't Work

### ❌ SmolLM2-135M-Instruct
**Problem:** Wrong file naming convention

**Has:**
- `model.onnx`
- `model_q4.onnx`
- `model_fp16.onnx`
- etc.

**Needs:**
- `decoder_model_merged_quantized.onnx` ← MISSING!

**Error:**
```
Could not locate file:
"https://huggingface.co/HuggingFaceTB/SmolLM2-135M-Instruct/resolve/main/onnx/decoder_model_merged_quantized.onnx"
```

## What Works

### ✅ Xenova/distilgpt2
**Has the correct naming:**

```
onnx/
├── decoder_model_merged_quantized.onnx  ← ✓ FOUND!
├── decoder_model_merged.onnx
├── decoder_model.onnx
├── decoder_model_quantized.onnx
├── model.onnx
└── ... (many variants)
```

### ✅ Xenova/gpt2
**Also has correct naming:**

```
onnx/
├── decoder_model_merged_quantized.onnx  ← ✓ FOUND!
├── decoder_model_merged.onnx
├── decoder_model.onnx
└── ...
```

## Why Only Xenova Models Work

**Xenova** is the official namespace for Transformers.js ONNX models:
- Models are converted with correct naming
- Tested and verified to work
- Includes all necessary decoder variants
- Updated for Transformers.js v3

**Other namespaces** (HuggingFaceTB, etc.):
- May have ONNX files but wrong structure
- Not specifically converted for Transformers.js
- Missing decoder_model variants

## Solution

### Use Xenova Models Only

**Working text-generation models:**
1. ✅ **Xenova/distilgpt2** (80 MB) - Recommended for lightweight
2. ✅ **Xenova/gpt2** (128 MB) - Better quality
3. ✅ **Xenova/llama2.c-stories15M** (15 MB) - Smallest but basic
4. ✅ **Xenova/llama2.c-stories42M** (42 MB) - Small but better

**Source:** https://huggingface.co/Xenova

## Current Implementation

```javascript
// ✅ WORKS
llmPipeline = await pipeline('text-generation', 'Xenova/distilgpt2');

// ❌ DOESN'T WORK (wrong ONNX structure)
llmPipeline = await pipeline('text-generation', 'HuggingFaceTB/SmolLM2-135M-Instruct');
```

## Final Configuration

```
STT: Xenova/whisper-tiny.en    → 41 MB
LLM: Xenova/distilgpt2         → 80 MB
TTS: Web Speech API            → 0 MB
────────────────────────────────────────
Total:                           121 MB ✨
```

## Quality Trade-offs

### DistilGPT2 Characteristics:
- ✅ Fast inference (~1-2 seconds)
- ✅ Small size (80 MB)
- ✅ Actually works!
- ⚠️ Not instruction-tuned (less conversational)
- ⚠️ Simpler responses
- ⚠️ May ramble or go off-topic

### Workarounds:
1. Use clear prompts: "Teacher: [response]"
2. Limit tokens: `max_new_tokens: 60`
3. Extract first sentence only
4. Provide context in prompt

## If You Need Better Quality

### Option 1: Use WebLLM (Different Framework)
```javascript
import * as webllm from "@mlc-ai/web-llm";

const engine = await webllm.CreateMLCEngine(
  "SmolLM2-135M-Instruct-q0f32-MLC"  // ✅ Works with WebLLM
);
```

**Size:** 719 MB
**Quality:** Better (instruction-tuned)
**Framework:** WebLLM instead of Transformers.js

### Option 2: Wait for Xenova Conversion
Check if Xenova has converted instruction-tuned models:
- https://huggingface.co/Xenova

### Option 3: Use Larger Xenova Model
```javascript
llmPipeline = await pipeline('text-generation', 'Xenova/gpt2');
// 128 MB, better quality than distilgpt2
```

## Testing

**Test page:** `test-llm.html`

Test all options:
1. DistilGPT2 (Transformers.js) - 80 MB ✅
2. SmolLM2 (Transformers.js) - ❌ Will fail
3. SmolLM2 (WebLLM) - 719 MB ✅

## Recommendation

For this MVP:

**✅ Use Xenova/distilgpt2**
- Lightweight (80 MB)
- Actually works
- Fast loading (10-20 seconds)
- Good enough for basic conversation practice

**Total app size: 121 MB** (41 MB Whisper + 80 MB DistilGPT2)

This is the most reliable lightweight option that will actually run.

## Key Lesson

**When using Transformers.js:**
- ✅ Always use `Xenova/*` models
- ❌ Don't assume other ONNX models will work
- ✅ Check the model's `onnx/` folder structure first
- ❌ Popularity ≠ Compatibility with Transformers.js

## Sources

- [Xenova Models on HuggingFace](https://huggingface.co/Xenova)
- [Xenova/distilgpt2 ONNX Files](https://huggingface.co/Xenova/distilgpt2/tree/main/onnx)
- [Xenova/gpt2 ONNX Files](https://huggingface.co/Xenova/gpt2/tree/main/onnx)
- [SmolLM2 ONNX Files (incompatible)](https://huggingface.co/HuggingFaceTB/SmolLM2-135M-Instruct/tree/main/onnx)
