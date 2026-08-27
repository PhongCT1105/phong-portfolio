import test from 'node:test';
import assert from 'node:assert/strict';
import { linkDescriptor, affiliationMarkup } from '../js/render.js';

test('linkDescriptor disables missing URLs without fake hrefs', () => {
  assert.deepEqual(linkDescriptor('GitHub', '', 'github.svg'), { enabled:false, label:'GitHub', url:'', icon:'github.svg' });
});

test('linkDescriptor keeps safe real URLs enabled', () => {
  const item = linkDescriptor('LinkedIn', 'https://linkedin.com/in/test', 'linkedin.svg');
  assert.equal(item.enabled, true);
});

test('affiliationMarkup includes organization and relationship in alt text', () => {
  const html = affiliationMarkup({ name:'NVIDIA', relationship:'Incoming SWE', asset:'./nvidia.svg', icon:'', href:'' });
  assert.match(html, /alt="NVIDIA — Incoming SWE"/);
  assert.match(html, /INCOMING SWE/);
});
