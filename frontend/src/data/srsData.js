export const CARD_TYPE = {
  vocab: { label: 'Vocabulary', color: '#137fec', icon: 'lang' },
  grammar: { label: 'Grammar', color: '#7c3aed', icon: 'book' },
  tip: { label: 'Tips & Tricks', color: '#ea580c', icon: 'bulb' },
};

export const DECKS = [
  { id: 'd1', type: 'vocab', name: 'Common Words A1', total: 120, due: 8, learning: 14, mastered: 62, accent: '#137fec' },
  { id: 'd2', type: 'vocab', name: 'Business English', total: 84, due: 12, learning: 24, mastered: 18, accent: '#0a5fb5' },
  { id: 'd3', type: 'vocab', name: 'Phrasal Verbs', total: 56, due: 6, learning: 12, mastered: 8, accent: '#137fec' },
  { id: 'd4', type: 'grammar', name: 'Verb Tenses', total: 42, due: 5, learning: 9, mastered: 14, accent: '#7c3aed' },
  { id: 'd5', type: 'grammar', name: 'Articles (a/an/the)', total: 18, due: 3, learning: 4, mastered: 11, accent: '#6d28d9' },
  { id: 'd6', type: 'grammar', name: 'Prepositions', total: 30, due: 2, learning: 6, mastered: 4, accent: '#7c3aed' },
  { id: 'd7', type: 'tip', name: 'Confusing Pairs', total: 24, due: 4, learning: 5, mastered: 9, accent: '#ea580c' },
  { id: 'd8', type: 'tip', name: 'Writing Quick Wins', total: 16, due: 0, learning: 2, mastered: 6, accent: '#c2410c' },
];

export const CARDS = [
  { id: 'c1', deckId: 'd1', type: 'vocab',
    front: 'ephemeral', pos: 'adjective', ipa: '/ɪˈfɛm.ər.əl/',
    back: 'Lasting for a very short time.',
    example: 'The beauty of cherry blossoms is ephemeral — gone in a week.',
    stage: 'review' },
  { id: 'c2', deckId: 'd1', type: 'vocab',
    front: 'mitigate', pos: 'verb', ipa: '/ˈmɪt.ɪ.ɡeɪt/',
    back: 'To make something bad less severe.',
    example: 'They planted trees to mitigate the flood risk.',
    stage: 'review' },
  { id: 'c3', deckId: 'd2', type: 'vocab',
    front: 'leverage', pos: 'verb', ipa: '/ˈlev.ər.ɪdʒ/',
    back: 'To use something to maximum advantage.',
    example: 'We can leverage our user data to improve retention.',
    stage: 'learning' },
  { id: 'c4', deckId: 'd3', type: 'vocab',
    front: 'put off', pos: 'phrasal verb',
    back: 'To postpone or delay something.',
    example: "Let's put off the meeting until Friday.",
    stage: 'review' },
  { id: 'c5', deckId: 'd4', type: 'grammar',
    front: 'Choose the correct form:\nShe ___ to Paris last summer.',
    options: ['go', 'went', 'gone', 'goes'], answer: 'went',
    back: 'Past simple — completed action with a clear past time marker ("last summer").',
    example: '✓ She went to Paris last summer.\n✗ She has gone to Paris last summer.',
    stage: 'review' },
  { id: 'c6', deckId: 'd4', type: 'grammar',
    front: 'I ___ (live) here for 5 years.',
    options: ['live', 'lived', 'have lived', 'am living'], answer: 'have lived',
    back: 'Present perfect — an action that started in the past and continues now. Use for duration with "for/since".',
    example: '✓ I have lived here for 5 years (and still do).',
    stage: 'learning' },
  { id: 'c7', deckId: 'd5', type: 'grammar',
    front: 'Pick the article:\nShe is ___ honest person.',
    options: ['a', 'an', 'the', '—'], answer: 'an',
    back: 'Use "an" before a vowel SOUND, not just a vowel letter. "Honest" starts with a silent H, so the sound is /ɒ/.',
    example: '✓ an honest person · an hour · a university (sounds like "yoo")',
    stage: 'review' },
  { id: 'c8', deckId: 'd7', type: 'tip',
    front: 'Which one is correct?',
    options: ['affect', 'effect', 'both can be used'], answer: 'both can be used',
    back: '"Affect" is usually a verb (to influence). "Effect" is usually a noun (the result).',
    example: 'Coffee affects my sleep. → The effect of coffee on my sleep is bad.',
    stage: 'review' },
  { id: 'c9', deckId: 'd7', type: 'tip',
    front: '"Less" or "fewer"?',
    options: ['less people', 'fewer people'], answer: 'fewer people',
    back: 'Use "fewer" for things you can count (people, books). Use "less" for things you can\'t (water, time).',
    example: '✓ fewer people, less water · ✗ less people',
    stage: 'review' },
  { id: 'c10', deckId: 'd8', type: 'tip',
    front: 'Cut filler words. Pick the cleaner version:',
    options: ['I personally think it\'s good.', 'I think it\'s good.'],
    answer: 'I think it\'s good.',
    back: '"Personally" adds nothing — "I think" is already personal. Cut redundant words for clearer writing.',
    example: '✗ In my opinion, I think → ✓ I think',
    stage: 'learning' },
];

export const SRS_BUTTONS = [
  { id: 'again', label: 'Again', interval: '<1m', color: '#be123c', ease: 0 },
  { id: 'hard',  label: 'Hard',  interval: '6m',  color: '#b45309', ease: 1 },
  { id: 'good',  label: 'Good',  interval: '1d',  color: '#078838', ease: 2 },
  { id: 'easy',  label: 'Easy',  interval: '4d',  color: '#137fec', ease: 3 },
];

export function totalDue() {
  return DECKS.reduce((a, d) => a + d.due, 0);
}

export function totalNew() {
  return DECKS.reduce((a, d) => a + d.learning, 0);
}

export function dueByType() {
  const out = { vocab: 0, grammar: 0, tip: 0 };
  DECKS.forEach((d) => { out[d.type] += d.due; });
  return out;
}

export function getDueCards() {
  const order = ['vocab', 'grammar', 'tip'];
  const byDeck = {};
  DECKS.forEach((d) => {
    byDeck[d.id] = CARDS.filter((c) => c.deckId === d.id).slice(0, d.due || 1);
  });
  const queue = [];
  let added = true;
  while (added) {
    added = false;
    for (const t of order) {
      for (const d of DECKS.filter((d) => d.type === t)) {
        const next = byDeck[d.id]?.shift();
        if (next) { queue.push(next); added = true; }
      }
    }
  }
  return queue;
}
