# Technical Notes - Development Session

**Date:** 2026-01-22
**Session Duration:** ~4 hours
**Outcome:** Working MVP with pronunciation + prosody assessment

---

## 🎯 Project Goals

Build a pronunciation practice app where users can:
1. Record themselves saying words
2. Get phoneme-level feedback
3. See stress/intonation analysis
4. Practice with adjustable difficulty

**Business Constraint:** Keep API costs low enough for $3/month SaaS pricing (~$0.50/month target cost).

---

## 🔍 Key Discoveries

### 1. Prosody Assessment Configuration

**Problem:** Initial implementation threw error:
```
TypeError: pronunciationConfig.enableProsodyAssessment is not a function
```

**Root Cause:** `enableProsodyAssessment` is a **property**, not a method.

**Solution:**
```javascript
// ❌ Wrong
pronunciationConfig.enableProsodyAssessment();

// ✅ Correct
pronunciationConfig.enableProsodyAssessment = true;
```

**Requirements:**
- SDK version 1.34.0+
- Language must be `en-US` (only locale supporting prosody)
- Region can be any (southeastasia works fine)

### 2. Phoneme Score Property Path

**Problem:** Phoneme scores showing as `NaN` / `0%`

**Root Cause:** Score nested in `PronunciationAssessment` object, not direct property.

**Solution:**
```javascript
// ❌ Wrong
const score = phoneme.AccuracyScore; // undefined

// ✅ Correct
const score = phoneme.PronunciationAssessment.AccuracyScore;
```

**API Response Structure:**
```json
{
  "Phoneme": "h",
  "PronunciationAssessment": {
    "AccuracyScore": 79
  },
  "Offset": 5500000,
  "Duration": 2300000
}
```

### 3. IPA vs ARPABET Phoneme Symbols

**Problem:** Azure returns ARPABET codes (`HH`, `EH`, `L`, `OW`), not IPA symbols.

**Solution:** Created mapping table:
```javascript
const ipaMap = {
  'hh': 'h', 'eh': 'ɛ', 'l': 'l', 'ow': 'oʊ',
  'aa': 'ɑ', 'ae': 'æ', 'ah': 'ʌ', 'ao': 'ɔ',
  'sh': 'ʃ', 'th': 'θ', 'dh': 'ð', 'zh': 'ʒ',
  'ng': 'ŋ', 'ch': 'tʃ', 'jh': 'dʒ',
  // ... etc
};

// Convert ARPABET to IPA
const phonemeText = phoneme.Phoneme.toLowerCase().replace(/[0-9]/g, '');
symbol.textContent = ipaMap[phonemeText] || phoneme.Phoneme;
```

### 4. Stress Information in API Response

**Finding:** Azure does NOT provide per-syllable stress accuracy scores.

**What Azure Provides:**
- `ProsodyScore` - Overall naturalness (0-100) including stress patterns
- `Syllable.AccuracyScore` - Pronunciation accuracy of each syllable
- `Feedback.Break` - Unexpected/missing pauses
- `Feedback.Intonation.Monotone` - Flat speech detection

**What Azure Does NOT Provide:**
- ❌ Which syllable should be stressed
- ❌ Whether user stressed correct syllable
- ❌ Stress pattern accuracy score

**Implication:** Can't give specific "you stressed wrong syllable" feedback, only general prosody score.

### 5. Syllable Data Structure

**Available Properties:**
```json
{
  "Syllable": "prax",          // ARPABET
  "Grapheme": "pro",           // Written form
  "PronunciationAssessment": {
    "AccuracyScore": 93
  },
  "Offset": 5300000,
  "Duration": 2800000
}
```

**Missing Properties:**
- `IsStressed` - Not present
- `Stressed` - Not present
- `StressLevel` - Not present

### 6. SDK Version and CDN

**Initial SDK URL:**
```html
<script src="https://aka.ms/csspeech/jsbrowserpackageraw"></script>
```

**Problem:** Older version without `enableProsodyAssessment` property.

**Solution:** Switched to versioned CDN:
```html
<script src="https://cdn.jsdelivr.net/npm/microsoft-cognitiveservices-speech-sdk@latest/distrib/browser/microsoft.cognitiveservices.speech.sdk.bundle.js"></script>
```

---

## 💰 Pricing Research Findings

### API Options Comparison

| API Type | Cost/Hour | Audio Limit | Latency | Pronunciation Support | Implementation |
|----------|-----------|-------------|---------|----------------------|----------------|
| **Real-time SDK** | $1.30 | Streaming | Instant | ✅ Full (phoneme+prosody) | ✅ Current |
| **REST Short Audio** | $0.66-1.30 | <30s | ~1s | ✅ Full | ⚠️ Needs refactor |
| **Fast Transcription** | $0.36 | <2hrs | Sync | ⚠️ Unclear | 🔍 Needs testing |
| **Batch Transcription** | $0.18 | Unlimited | 5-30min | ✅ Included (free!) | ❌ Requires backend |

### Cost Breakdown

**Current Implementation:**
- Base transcription: $1.00/hour
- Pronunciation assessment add-on: $0.30/hour
- **Total:** $1.30/hour

**Realistic Usage (30 min/day app usage):**
- Actual audio sent: 30 words × 4 tries × 2s = 240s = 4 min/day
- Monthly API usage: 4 min × 30 days = 120 min = 2 hours
- **Monthly cost:** 2 hrs × $1.30 = $2.60/month
- **With free tier:** First 5 hours free, covers 2.5 months

### SaaS Economics Analysis

**Target:** $3/month subscription
**Healthy margin:** 70-80% (API cost should be <$0.50)

| Scenario | API Cost | Gross Margin | Payment Fee | Net Margin | Viable? |
|----------|----------|--------------|-------------|------------|---------|
| Current (Real-time) | $2.60 | 13% | $0.38 | -25% | ❌ No |
| REST Short Audio | $1.30 | 57% | $0.38 | 44% | ⚠️ Tight |
| + Usage Limits (15 rec/day) | $0.50 | 83% | $0.38 | 71% | ✅ Yes |
| Batch API + Backend | $0.36 | 88% | $0.38 | 76% | ✅ Yes |
| Higher Price ($10/mo) | $2.60 | 74% | $0.59 | 68% | ✅ Yes |

**Conclusion:** For $3/month pricing, need to either:
1. Switch to REST API + limit usage to 15 recordings/day
2. Charge $8-10/month for unlimited
3. Add backend + use Batch API (adds server cost)

---

## 🏗️ Architecture Decisions

### Why Client-Side Only?

**Pros:**
- ✅ Zero server costs
- ✅ Instant deployment (static hosting)
- ✅ Simple architecture
- ✅ Privacy (audio processed by Azure only)

**Cons:**
- ❌ API key exposed in browser (security risk for production)
- ❌ Locked into real-time API pricing ($1.30/hr)
- ❌ Can't use cheaper batch API ($0.18/hr)
- ❌ No usage tracking/quotas

**Decision:** Keep client-side for MVP, add backend if monetizing.

### Why Azure vs Alternatives?

**Considered:**
- **OpenAI Whisper API:** $0.006/min ($0.36/hr) - No phoneme scores
- **Google Speech-to-Text:** $0.024/min ($1.44/hr) - More expensive
- **AssemblyAI:** ~$10/month similar features - Same price range
- **Local Whisper:** Free - No pronunciation scoring

**Decision:** Azure offers best phoneme-level + prosody feedback, worth the cost.

### Why en-US Language Only?

**Constraint:** Prosody assessment (stress, intonation) only available in `en-US` locale.

**Other Languages:**
- Phoneme scoring available in 32+ languages
- No prosody/stress analysis in other locales

**Decision:** Set `speechRecognitionLanguage = "en-US"` (can still use southeastasia region for server location).

---

## 🎨 UI/UX Decisions

### Strictness Controls

**Problem:** Azure's 80% threshold might be too lenient for serious practice.

**Solution:** Added dropdown with 4 levels:
- Lenient: 60% = pass
- Normal: 80% = pass (default)
- Strict: 90% = pass
- Very Strict: 95% = pass

**Implementation:**
```javascript
const threshold = parseInt(strictnessEl.value);
phonemeDiv.className = 'phoneme ' + (scoreValue >= threshold ? 'correct' : 'incorrect');
```

### Syllable Display

**Attempted:** Show stressed syllables in bold/highlighted.

**Reality:** Azure doesn't provide stress markers per syllable.

**Decision:** Show syllable scores, note that ProsodyScore covers overall stress accuracy.

### IPA Symbols

**Choice:** Convert ARPABET to IPA for linguistically accurate display.

**Alternative:** Could show ARPABET directly (simpler, but less educational).

**Decision:** Use IPA mapping for better learning experience.

---

## 🐛 Issues Encountered & Solutions

### 1. enableProsodyAssessment is not a function
**Solution:** Change to property assignment (`= true`)

### 2. Phoneme scores showing NaN
**Solution:** Access via `phoneme.PronunciationAssessment.AccuracyScore`

### 3. ARPABET codes instead of IPA
**Solution:** Create conversion mapping table

### 4. Python command not found
**Solution:** Use `python3` instead of `python`

### 5. Batch API pricing confusion
**Solution:** Deep research into official docs and Q&A forums

---

## 📊 Testing Results

### Sample Recording: "pronunciation"

**Input Audio:** ~2 seconds
**API Response Time:** ~1 second

**Scores:**
- Overall Pronunciation: 97/100
- Prosody: 93/100
- Syllables: [93, 95, 100, 98, 96]
- Phonemes: Average 94/100

**Feedback:**
- No unexpected breaks
- No missing pauses
- No monotone detected
- ✓ "Good stress and intonation!"

**Cost:** ~$0.0007 per recording (2s × $1.30/hr ÷ 3600s)

---

## 🚀 Future Optimization Roadmap

### Phase 1: Cost Optimization (Immediate)
- [ ] Add usage tracking in localStorage
- [ ] Implement daily quota (15 recordings/day)
- [ ] Show remaining quota to user
- [ ] Estimate: Reduce cost from $2.60 to $0.50/month

### Phase 2: API Migration (1-2 weeks)
- [ ] Refactor to REST API for short audio
- [ ] Add audio encoding (WAV/MP3)
- [ ] Handle Base64 encoding for pronunciation params
- [ ] Test pronunciation assessment still works
- [ ] Estimate: 50% cost reduction ($0.66/hr vs $1.30/hr)

### Phase 3: Backend Integration (1 month)
- [ ] Build Node.js/Python backend
- [ ] Implement Azure Batch API client
- [ ] Add job polling mechanism
- [ ] Secure API key in backend
- [ ] Estimate: 86% cost reduction ($0.18/hr) minus server cost

### Phase 4: Feature Enhancements
- [ ] Word lists and lessons
- [ ] Progress tracking over time
- [ ] Offline mode with Whisper fallback
- [ ] Support more languages (without prosody)
- [ ] Spaced repetition algorithm

---

## 📚 Lessons Learned

1. **Always check API response structure first** - Saved hours debugging phantom property paths
2. **Prosody != stress per syllable** - Azure gives overall score, not granular stress feedback
3. **Free tier is generous** - 5 hours = ~150 days of normal practice
4. **Property vs method matters** - JS doesn't throw clear errors for this
5. **Client-side = simple but expensive** - Backend unlocks 86% cost savings
6. **Documentation gaps exist** - Had to use Q&A forums for batch pronunciation support

---

## 🔗 References Used During Development

### Official Docs
- https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-pronunciation-assessment
- https://learn.microsoft.com/en-us/javascript/api/microsoft-cognitiveservices-speech-sdk/pronunciationassessmentconfig
- https://learn.microsoft.com/en-us/azure/ai-services/speech-service/rest-speech-to-text-short

### Community Q&A
- https://learn.microsoft.com/en-us/answers/questions/5608069/pricing-and-usage-of-pronunciation-assessment-feat
- https://learn.microsoft.com/en-us/answers/questions/5572914/can-i-use-the-azure-speech-to-text-fast-transcript

### Pricing
- https://azure.microsoft.com/en-us/pricing/details/cognitive-services/speech-services/

---

**End of Technical Notes**
