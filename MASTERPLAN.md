# OpenSpeak Master Plan

## Vision
A mobile-first Progressive Web App for English pronunciation improvement through AI-powered speaking practice, without requiring backend infrastructure.

---

## Phase 1: AI Speaking Coach

### Concept
A conversational AI feature where users practice English by chatting with an AI. The AI responds naturally, corrects mistakes gently, and suggests improvements.

### Key Ideas
- User provides their own OpenAI API key (no hosting costs)
- Natural conversation flow with text and voice input
- AI adapts to user's level and interests
- Context-aware responses that encourage speaking practice

### User Flow
1. User enters settings and adds OpenAI API key
2. Opens AI Coach interface
3. Starts conversation via text or voice
4. AI responds with engaging, natural dialogue
5. User can practice specific phrases from the conversation

---

## Phase 2: Shadowing Mode

### Concept
Listen to native pronunciation, repeat immediately, and compare. Uses Azure Text-to-Speech to generate native audio on-demand.

### Key Ideas
- No video hosting - use Azure TTS for audio generation
- User's existing Azure Speech key covers the cost
- Curated phrase library for different contexts
- Side-by-side comparison of native vs user pronunciation

### User Flow
1. Select a phrase category (Greetings, Travel, Work, etc.)
2. Tap "Play Native" to hear Azure TTS pronunciation
3. Tap "Record" and repeat the phrase
4. See pronunciation score comparing to native
5. Practice until satisfied, then move to next phrase

---

## Phase 3: Minimal Pairs Training

### Concept
Focused practice on confusing sound pairs that are hard for non-native speakers to distinguish.

### Key Ideas
- Target sounds like: ship/sheep, think/sink, live/leave
- Pre-generated audio or Azure TTS on-demand
- Visual phonetic notation
- Track which specific sounds user struggles with

### User Flow
1. Select a minimal pair set (e.g., "i vs ee sounds")
2. See two words displayed with phonetic notation
3. Listen to audio A, record yourself repeating
4. Listen to audio B, record yourself repeating
5. Get scores for each, identify which needs more practice

---

## Phase 4: Integration & Experience

### Concept
Connect all features into a cohesive learning experience where each feature reinforces the others.

### Key Ideas
- AI Coach suggests shadowing phrases based on conversation topics
- Shadowing practice feeds into AI conversation context
- Minimal pairs auto-suggest based on pronunciation errors from other features
- Progress tracking across all modes
- Daily streaks and practice goals

---

## Future Ideas (Post-Core)

### Intonation & Rhythm
- Practice sentence stress and pitch patterns
- Visual pitch contour comparison
- Focus on sounding natural, not just correct

### Speech Pace Control
- Train to speak at natural speed (150-180 wpm)
- Identify if speaking too fast or too slow
- Pacing exercises with visual feedback

### Scenario-Based Practice
- Job interview simulations
- Restaurant ordering practice
- Presentation rehearsal
- Small talk and networking

### Audio Journaling
- Daily 2-minute speaking diary
- AI provides feedback on patterns over time
- Track improvement week by week

### Progress Analytics
- Visual breakdown of mastered vs struggling phonemes
- Before/after playback comparisons
- Personalized practice recommendations

### Content Expansion
- Idioms and expressions with proper stress
- Industry-specific vocabulary
- Tongue twisters for advanced practice

---

## Principles

1. **Zero Backend** - All features work client-side with user's API keys
2. **User-Paid APIs** - OpenAI and Azure costs covered by users
3. **Mobile-First** - All features optimized for phone use
4. **Offline-Capable** - Where possible, work without constant connection
5. **Privacy-First** - Minimal data collection, local storage preferred

---

## Success Metrics

- Users can hold 5+ minute conversations with AI Coach
- Shadowing mode has 50+ phrases across 5 categories
- Minimal pairs covers 20+ common confusing sound pairs
- 70%+ of users return for daily practice within first week

---

*Last Updated: January 30, 2026*
*Status: Planning Phase*
