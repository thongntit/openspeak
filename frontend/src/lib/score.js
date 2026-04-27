export function bandClass(score) {
  if (score == null) return 'idle';
  if (score >= 80) return 'good';
  if (score >= 60) return 'mid';
  return 'bad';
}

export function bandLabel(score) {
  if (score == null) return 'Tap to start';
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Great';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Almost';
  return 'Try again';
}

export function bandColor(score) {
  const band = bandClass(score);
  if (band === 'good') return '#078838';
  if (band === 'mid') return '#b45309';
  if (band === 'bad') return '#be123c';
  return '#cbd5e1';
}
