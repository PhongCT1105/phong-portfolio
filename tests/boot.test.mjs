import test from 'node:test';
import assert from 'node:assert/strict';
import { bootMode } from '../js/boot.js';

test('bootMode skips full animation for reduced motion', () => {
  assert.equal(bootMode(false, true), 'instant');
});

test('bootMode runs full boot once then fast boot in same session', () => {
  assert.equal(bootMode(false, false), 'full');
  assert.equal(bootMode(true, false), 'fast');
});
