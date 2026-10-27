import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isPublicPath, safeNextPath, signInDestination } from './appAccess';
test('signed-out access is limited to public marketing/auth/legal pages', () => {
  for (const path of ['/', '/welcome', '/founding100', '/updates', '/thank-you', '/auth', '/terms', '/privacy', '/unsubscribe']) assert.equal(isPublicPath(path), true);
  for (const path of ['/games', '/podcasts', '/editor', '/search', '/admin/launch', '/athlete/123', '/live', '/index']) assert.equal(isPublicPath(path), false);
});
test('sign-in preserves an internal intended destination and rejects external returns', () => {
  assert.equal(signInDestination('/podcasts?id=123'), '/auth?next=%2Fpodcasts%3Fid%3D123');
  for (const value of ['//evil.example', '/\\evil.example', 'https://evil.example', '/auth', '/\n/evil']) assert.equal(safeNextPath(value), '/');
});