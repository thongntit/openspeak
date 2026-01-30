# Quick Testing Guide

## Prerequisites

You need an **Azure Speech Service API key** to test pronunciation features.

### Get Free Azure Speech Key (2 minutes)

1. Visit: https://portal.azure.com
2. Sign in (create free account if needed)
3. Click "+ Create a resource"
4. Search: "Speech Service"
5. Select: "Free (F0)" tier (5 hours/month free)
6. Fill in required fields, click "Review + Create"
7. Wait ~1-2 minutes for deployment
8. Go to the new resource → "Keys and Endpoint" (left sidebar)
9. Copy: **Key 1** and **Location/Region** (e.g., `eastus`)

## Testing the App

### 1. Start Development Server

```bash
cd frontend
bun run dev
```

Open: http://localhost:5173

### 2. Test Splash Screen
- ✅ Should see Pronounce splash immediately
- ✅ Logo with pulsing soundwave bars
- ✅ Bouncing dots animation
- ✅ "Perfecting your accent..." text
- ✅ Should fade to Home screen in ~3 seconds

### 3. Test Settings Page

1. Click ⚙️ button (top right) or "Go to Settings" banner
2. Enter your Azure API Key
3. Enter Region (e.g., `eastus` or `southeastasia`)
4. Click "Save Settings"
5. ✅ Should see "✓ Settings saved!" message
6. Refresh page → Settings should persist

**Test Cases:**
- [ ] Save with valid key → Success message
- [ ] Save without key → Validation works?
- [ ] Clear button → Removes values
- [ ] Refresh page → Values persist

### 4. Test Home Dashboard

After saving settings, Home should show:

**Visual Checks:**
- [ ] Setup warning disappears
- [ ] "Quick Start" card with large button
- [ ] "Try These Words" section with 3 words
- [ ] "Recent Activity" section with mock data
- [ ] Clicking word → Navigates to Practice with word pre-filled

**Navigation Tests:**
- [ ] Click "Start Pronunciation Practice" → Goes to `/practice`
- [ ] Click any word (e.g., "schedule") → Goes to `/practice` with word filled
- [ ] Click ⚙️ → Goes to `/settings`

### 5. Test Pronunciation Practice

**Setup Test:**
1. Navigate to `/practice`
2. Word field should be editable
3. Try without API key → Should show "Settings Required"
4. Enter valid API key in settings → Practice should work

**Recording Test:**
1. Enter a word (e.g., "hello")
2. Click 🎤 (record button)
3. Button should turn red and pulse "Recording... Speak clearly!"
4. Speak the word clearly
5. Recognition should auto-stop
6. Button shows spinner "Analyzing your pronunciation..."
7. Results appear in ~2-3 seconds

**Result Display Test:**
Check for all metrics:
- [ ] Overall score (large number, color-coded)
- [ ] Accuracy score (blue box)
- [ ] Prosody score (purple box)
- [ ] Word analysis section
- [ ] Phoneme breakdown with IPA symbols

**Scoring Colors:**
- Green (90-100): Excellent
- Yellow (70-89): Good
- Red (0-69): Needs work

**Phoneme Test:**
- [ ] Each phoneme has accuracy score
- [ ] Color-coded based on score
- [ ] IPA symbol displayed
- [ ] Multiple phonemes shown for words

**Error Handling:**
- [ ] Try recording → Stop immediately → No errors
- [ ] Disconnect microphone → Error message shown
- [ ] Invalid API key → Error message shown
- [ ] Browser denies mic permission → Error shown

**Actions:**
- [ ] "Try Again" → Clears results, ready to record
- [ ] "Done" → Goes back to Home

### 6. Test Audio Quality

**Test Words (Easy):**
- [ ] hello → Should score 90+
- [ ] world → Should score 90+

**Test Words (Medium):**
- [ ] pronunciation → Should score 80+
- [ ] schedule → Should score 70+

**Test Words (Hard):**
- [ ] entrepreneur → Might score lower, test phoneme feedback
- [ ] Worcestershire → Very hard word, test if it works

**Tips for Testing:**
- Speak clearly and at normal speed
- One attempt per word is enough (don't repeat)
- Try to vary pitch and stress (tests prosody)
- Wait for "Analyzing..." to finish before trying again

### 7. Test Mobile Responsiveness

Resize browser to test mobile view:
- [ ] 375px width (iPhone SE)
- [ ] 390px width (iPhone 12/13)
- [ ] 414px width (larger iPhones)
- [ ] 360px width (Android small)
- [ ] 412px width (Android large)

**Mobile Checks:**
- [ ] Record button is tap-friendly (44x44px)
- [ ] Text is readable at mobile scale
- [ ] No horizontal scrolling
- [ ] Buttons fit screen width
- [ ] Keyboard doesn't overlap inputs

### 8. Test Dark Mode

**System Dark Mode:**
1. Change OS/system to dark mode
2. Refresh page
3. [ ] Background is dark (#101922)
4. [ ] Text is light
5. [ ] Cards are readable

**Browser Dark Mode Toggle (if supported):**
- [ ] Toggle works in browser
- [ ] All colors invert correctly

### 9. Test PWA Features

**Install Test (Chrome on Android):**
1. Open http://localhost:5173 in Chrome mobile
2. [ ] Should see "Install App" in menu
3. Click install
4. [ ] App icon appears on home screen
5. Open from home screen
6. [ ] Works in standalone mode (no browser bar)

**Install Test (Safari on iOS):**
1. Open in Safari
2. Tap Share button
3. [ ] "Add to Home Screen" appears
4. Tap it
5. [ ] App icon appears
6. Open from home screen
7. [ ] Works as standalone app

**Offline Test:**
1. Load app once (cache builds)
2. Turn off internet
3. Refresh page
4. [ ] Should still load (app shell)
5. [ ] Audio won't work (expected, needs Azure API)

### 10. Test Error Scenarios

**Edge Cases:**
- [ ] Empty word → Button disabled?
- [ ] Very long phrase → Does it work?
- [ ] Special characters → Handles correctly?
- [ ] Rapid click record-again → No errors?

**API Errors:**
- [ ] Wrong API key → Shows error
- [ ] Invalid region → Shows error
- [ ] Network timeout → Shows error

## Troubleshooting

### "Microphone not allowed"
- Click lock icon in browser address bar
- Allow microphone access
- Must use HTTPS or localhost

### "Pronunciation score shows 0%"
- Verify API key is correct
- Check console for errors
- Make sure you're speaking clearly

### "Error: Failed to initialize"
- Check API key format (no extra spaces)
- Verify region is correct
- Try refreshing the page

### Build/Deploy Issues

```bash
# Fix build errors
bun run build

# Preview production build
bun run preview
```

## Test Results Template

Copy this to document your test results:

```
Test Date: _______________
Browser: _______________
Device: _______________

✅ Splash Screen
- Appears immediately: [ ] Yes [ ] No
- Fades correctly: [ ] Yes [ ] No

✅ Settings
- Save works: [ ] Yes [ ] No
- Persist across reload: [ ] Yes [ ] No

✅ Home Dashboard
- Shows without setup warning: [ ] Yes [ ] No
- Navigation works: [ ] Yes [ ] No
- Word links work: [ ] Yes [ ] No

✅ Pronunciation Practice
- Recording works: [ ] Yes [ ] No
- Scores display: [ ] Yes [ ] No
- Phoneme breakdown: [ ] Yes [ ] No
- Try Again works: [ ] Yes [ ] No

Test Word: ___________
Score: _____
Accuracy: _____
Prosody: _____

Issues Found:
- 
-

Overall Status: [ ] Passes All Tests [ ] Has Issues
```

## Success Criteria

App is fully functional when:
- ✅ Splash screen prevents blank page
- ✅ Settings save/load correctly
- ✅ Home dashboard navigates to all screens
- ✅ Recording works with Azure Speech API
- ✅ Pronunciation scores display correctly
- ✅ Phoneme breakdown shows IPA
- ✅ Error handling is user-friendly
- ✅ Mobile layout works correctly
- ✅ PWA features install properly

Good luck testing! 🚀
