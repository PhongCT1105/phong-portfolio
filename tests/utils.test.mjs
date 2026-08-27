import test from 'node:test';
import assert from 'node:assert/strict';
import { makeSessionId, isSafeExternalUrl, formatRelationshipLabel } from '../js/utils.js';

test('makeSessionId returns a stable-looking uppercase session token', () => {
  const value = makeSessionId(() => 0.123456789);
  assert.match(value, /^[A-Z0-9]{6}$/);
});

test('isSafeExternalUrl accepts https and mailto but rejects javascript and blanks', () => {
  assert.equal(isSafeExternalUrl('https://example.com'), true);
  assert.equal(isSafeExternalUrl('mailto:test@example.com'), true);
  assert.equal(isSafeExternalUrl('javascript:alert(1)'), false);
  assert.equal(isSafeExternalUrl(''), false);
});

test('formatRelationshipLabel normalizes whitespace and uppercase display labels', () => {
  assert.equal(formatRelationshipLabel('  Incoming   SWE  '), 'INCOMING SWE');
});
