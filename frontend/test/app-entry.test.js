import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const appShell = readFileSync(new URL('../src/components/AppShell.jsx', import.meta.url), 'utf8');

test('root entry does not block routes behind a health loader', () => {
  assert.doesNotMatch(source, /AppLoader/);
});

test('installed iOS PWA extends the Gramio background behind a translucent status bar', () => {
  assert.match(html, /name="viewport" content="[^"]*viewport-fit=cover/);
  assert.match(
    html,
    /name="apple-mobile-web-app-status-bar-style" content="black-translucent"/,
  );
  assert.match(appShell, /pt-\[env\(safe-area-inset-top\)\]/);
  assert.match(appShell, /pb-\[env\(safe-area-inset-bottom\)\]/);
});
