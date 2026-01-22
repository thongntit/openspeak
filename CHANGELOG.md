# Changelog

All notable changes to this project documented in this file.

## [0.1.0] - 2026-01-22

### 🎉 Initial MVP Release

**Summary:** Working pronunciation assessment app with phoneme-level feedback, prosody analysis, and real-time scoring.

### ✨ Features Added

#### Core Pronunciation Features
- **Real-time pronunciation assessment** using Azure Speech Services
- **Overall pronunciation score (0-100)** with instant feedback
- **Phoneme-level analysis** showing which sounds need improvement
- **Color-coded feedback** (green = correct, red = needs work)
- **IPA phonetic symbols** instead of ARPABET codes
- **Adjustable strictness** with 4 grading levels (60%, 80%, 90%, 95%)

#### Prosody Assessment (Stress/Intonation)
- **Prosody score (0-100)** evaluating naturalness of speech
- **Stress detection** via overall prosody scoring
- **Intonation feedback** with monotone detection
- **Break detection** identifying unexpected/missing pauses
- **Real-time feedback** on prosody issues

#### Syllable & Phoneme Display
- **Syllable breakdown** showing each syllable with accuracy score
- **Phoneme display** with IPA symbols (ɑ, æ, ʃ, θ, etc.)
- **Individual phoneme scores** for targeted practice
- **Grapheme mapping** (written letters → spoken sounds)

#### User Interface
- **Clean, minimal design** with clear score display
- **Responsive layout** works on desktop/tablet
- **Status messages** showing recognition results
- **Feedback messages** explaining what to improve
- **Strictness selector** for personalized difficulty

#### Technical Implementation
- **Client-side only** (no backend required)
- **Azure Speech SDK v1.40+** for browser
- **Single HTML file** (~500 lines total)
- **Local server setup** for microphone access
- **Pronunciation config** with prosody enabled

### 🔧 Configuration Details

**Azure Settings:**
- Language: `en-US` (required for prosody)
- Region: `southeastasia` (configurable)
- Grading: HundredMark (0-100 scale)
- Granularity: Phoneme-level
- Prosody: Enabled
- Miscue detection: Enabled

**Default Values:**
- Test word: "pronunciation" (5 syllables)
- Strictness: 80% threshold
- Region: southeastasia

### 📝 Documentation Added

**Files Created:**
1. **README.md** - Complete user guide
   - Quick start instructions
   - Feature overview
   - Pricing analysis
   - Technical architecture
   - Troubleshooting guide
   - API optimization roadmap

2. **TECHNICAL_NOTES.md** - Development details
   - Key discoveries during build
   - API response structures
   - Architecture decisions
   - Cost analysis breakdown
   - Issues encountered & solutions
   - Future optimization plans

3. **CHANGELOG.md** - This file

**README Sections:**
- Features overview
- Quick start guide (3 steps)
- Pricing breakdown (realistic usage)
- SaaS economics analysis
- Technical architecture diagram
- Sample API output
- Future optimizations
- Troubleshooting FAQ
- Resource links

### 🐛 Issues Fixed During Development

1. **enableProsodyAssessment TypeError**
   - Changed from method call `()` to property `= true`

2. **Phoneme scores showing NaN**
   - Fixed property path: `phoneme.PronunciationAssessment.AccuracyScore`

3. **ARPABET codes instead of IPA**
   - Added conversion mapping table (35+ phonemes)

4. **Console logging for debugging**
   - Added detailed prosody/syllable inspection
   - Later cleaned up for production

5. **Python command not found**
   - Updated docs to use `python3` command

6. **SDK version compatibility**
   - Upgraded to v1.40+ CDN URL for prosody support

### 💰 Cost Analysis Completed

**API Pricing Research:**
- Real-time API: $1.30/hour (current)
- REST Short Audio: $0.66-1.30/hour (optimization target)
- Fast Transcription: $0.36/hour (needs testing)
- Batch Transcription: $0.18/hour (requires backend)

**Realistic Usage Cost:**
- 30 min/day app usage = 4 min API usage
- Monthly cost: $2.60 (or $0 with free tier)
- Free tier: 5 hours = 75 days of practice

**SaaS Economics:**
- Target subscription: $3/month
- Current margin: 13% (too tight)
- Recommended: Switch to REST API + quotas
- Alternative: Charge $8-10/month

### 🚀 Optimization Opportunities Identified

**Phase 1 - Usage Limits (Quick Win):**
- Add daily quota (15 recordings/day)
- Track usage in localStorage
- Reduce cost to $0.50/month

**Phase 2 - REST API Migration:**
- Switch from SDK to REST endpoint
- 50% cost reduction potential
- Keep all features (phoneme + prosody)

**Phase 3 - Backend + Batch API:**
- Build Node.js/Python backend
- 86% cost reduction
- Adds server hosting cost

### 📚 Resources Referenced

**Official Documentation:**
- Azure Speech Service pronunciation assessment
- Speech SDK JavaScript API reference
- REST API for short audio
- Batch transcription guide
- Fast transcription docs

**Community Resources:**
- Microsoft Q&A on pronunciation pricing
- Fast transcription pronunciation support thread
- Stack Overflow for debugging

**Pricing Sources:**
- Azure pricing calculator
- Speech services pricing page
- Community cost analysis

### 🎯 Design Decisions

**Why Client-Side Only:**
- Zero infrastructure cost
- Instant deployment
- Simple architecture
- MVP speed priority

**Why Azure vs Alternatives:**
- Best phoneme-level feedback
- Only service with prosody scoring
- Generous free tier (5 hours)
- Well-documented API

**Why en-US Only:**
- Prosody assessment limited to en-US
- Can expand to 32+ languages (without prosody)
- Future: Add language selector

**Why IPA Symbols:**
- More educational than ARPABET
- Standard in linguistics
- Better learning experience

### 🔬 Testing Completed

**Manual Testing:**
- Recorded word: "pronunciation"
- Verified phoneme scores display correctly
- Confirmed prosody feedback shows
- Tested strictness adjustments
- Checked IPA symbol conversion
- Validated console debugging output

**Browser Compatibility:**
- Chrome/Edge: ✅ Tested
- Firefox: ⚠️ Assumed working
- Safari: ⚠️ Needs testing

### 🏗️ Known Limitations

1. **No per-syllable stress info**
   - Azure doesn't provide which syllable should be stressed
   - Only overall prosody score available

2. **API key in browser**
   - Security risk for production
   - Need backend proxy for real deployment

3. **No offline mode**
   - Requires internet + Azure API
   - Could add Whisper fallback

4. **en-US only**
   - Prosody limited to English (US)
   - Other languages: phonemes only

5. **No usage tracking**
   - Can't limit API usage
   - Easy to exceed free tier

6. **No progress tracking**
   - Can't see improvement over time
   - Future: Add localStorage history

### 📊 Statistics

**Lines of Code:**
- HTML/CSS/JS: ~500 lines (single file)
- README: ~300 lines
- Technical Notes: ~400 lines

**Development Time:**
- Initial implementation: ~2 hours
- Debugging & fixes: ~1 hour
- Pricing research: ~30 min
- Documentation: ~30 min
- **Total: ~4 hours**

**API Calls During Development:**
- Testing: ~20 recordings
- Total audio: ~40 seconds
- Cost: ~$0.014 (well within free tier)

### 🎉 Success Metrics

- ✅ Working pronunciation assessment
- ✅ Phoneme-level feedback displaying correctly
- ✅ Prosody scores showing
- ✅ IPA symbols converted
- ✅ Adjustable strictness working
- ✅ Under $3/month with optimizations
- ✅ Complete documentation
- ✅ 4-hour MVP delivery

---

## [Unreleased] - Future Versions

### Planned for v0.2.0
- [ ] REST API migration (cost optimization)
- [ ] Usage tracking in localStorage
- [ ] Daily recording quota (15/day limit)
- [ ] Quota display in UI
- [ ] Warning when approaching free tier limit

### Planned for v0.3.0
- [ ] Word lists and lesson plans
- [ ] Progress tracking over time
- [ ] Export/import practice history
- [ ] Spaced repetition scheduling
- [ ] Achievement system

### Planned for v1.0.0
- [ ] Backend server (Node.js/Python)
- [ ] Batch API integration
- [ ] User authentication
- [ ] Multi-language support
- [ ] Offline mode with Whisper
- [ ] Mobile app (React Native)

---

**Legend:**
- ✨ New feature
- 🐛 Bug fix
- 🔧 Configuration change
- 📝 Documentation
- 🚀 Performance improvement
- 💰 Cost optimization
