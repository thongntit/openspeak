# Learn English Pronunciation App - MVP Specification

## Goal
Verify browser-based phoneme recognition works. Minimal UI, maximum simplicity.

## MVP Scope (Do This First)

### UI
- Single HTML file
- One button: "Record" / "Stop"
- Status text: "Loading model..." / "Ready" / "Recording..."
- Output area: Display recognized phonemes

### Tech Stack
- **Model**: Xenova/wav2vec2-lv60 (via Transformers.js)
- **Runtime**: Transformers.js (runs in browser via WASM)
- **Audio**: MediaRecorder API

### Flow
1. Page loads → Transformers.js loads model (~100MB download)
2. Status shows "Loading model..." then "Ready"
3. Click "Record" → capture 2-3 seconds of audio
4. Click "Stop" → process audio through model
5. Display raw phoneme output (e.g., "θ ɔː θ")

### Expected Output Example
```
Recognized: θ ɔː t
```

---

## Post-MVP (Skip For Now)
- Pronunciation comparison logic
- Target word matching
- Colored feedback (green/red)
- Error handling (mic permissions)
