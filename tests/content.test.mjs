import test from 'node:test';
import assert from 'node:assert/strict';
import { SITE_CONTENT } from '../js/content.js';
import { isSafeExternalUrl } from '../js/utils.js';

test('affiliations all include exact relationship and an asset or icon', () => {
  assert.ok(SITE_CONTENT.affiliations.length >= 9);
  for (const item of SITE_CONTENT.affiliations) {
    assert.ok(item.name);
    assert.ok(item.relationship);
    assert.ok(item.asset || item.icon);
  }
});

test('projects never expose unsafe links', () => {
  for (const project of SITE_CONTENT.projects) {
    for (const link of project.links) {
      assert.equal(isSafeExternalUrl(link.url), true);
    }
  }
});

test('hero includes the five high-signal identity facts', () => {
  assert.ok(SITE_CONTENT.hero.identity.length >= 5);
  const joined = SITE_CONTENT.hero.identity.join(' | ').toLowerCase();
  for (const term of ['nvidia', 'zolli', '10×', 'ieee', 'wpi']) {
    assert.ok(joined.includes(term));
  }
});
