import { test } from 'node:test';
import assert from 'node:assert/strict';
import { identitySports, matchesIdentitySport } from './profileIdentitySport';

test('profile identity defaults to all of the member sports, not a role', () => {
  const selection = identitySports('mine', ['basketball', 'soccer']);
  assert.deepEqual(selection, ['basketball', 'soccer']);
  assert.equal(matchesIdentitySport(['soccer'], selection), true);
  assert.equal(matchesIdentitySport(['football'], selection), false);
});
test('choosing another interested sport overrides profile sports', () => {
  const selection = identitySports('football', ['basketball']);
  assert.deepEqual(selection, ['football']);
  assert.equal(matchesIdentitySport(['basketball'], selection), false);
  assert.equal(matchesIdentitySport(['football'], selection), true);
});
test('all sports and profiles without sports do not lock discovery empty', () => {
  assert.deepEqual(identitySports('mine', null), []);
  assert.equal(matchesIdentitySport(null, identitySports('all', ['soccer'])), true);
});