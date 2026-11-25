import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appendUnique, belongsToThread, rowToThreadMessage, type ChatRow } from './chatMessages';

const ME = 'user-me';
const PARTNER = 'user-partner';
const row = (over: Partial<ChatRow> = {}): ChatRow => ({
  id: 'm1', sender_id: ME, recipient_id: PARTNER, content: 'hi', image_url: null,
  read: false, read_at: null, delivered_at: null, created_at: '2026-11-25T10:00:00.000Z', ...over,
});

test('rowToThreadMessage marks ownership from the sender and defaults missing receipts', () => {
  const mine = rowToThreadMessage(row(), ME);
  assert.equal(mine.isMine, true);
  assert.equal(mine.imageUrl, null);
  assert.equal(mine.deliveredAt, null);
  const theirs = rowToThreadMessage(row({ sender_id: PARTNER, recipient_id: ME }), ME, 'now');
  assert.equal(theirs.isMine, false);
  assert.equal(theirs.deliveredAt, 'now');
});

test('the first message in an empty thread appears immediately from the insert response', () => {
  const next = appendUnique([], rowToThreadMessage(row(), ME));
  assert.equal(next.length, 1);
  assert.equal(next[0].content, 'hi');
});

test('the realtime echo of an already-shown message does not duplicate it', () => {
  const sent = rowToThreadMessage(row(), ME);
  const once = appendUnique([], sent);
  const twice = appendUnique(once, rowToThreadMessage(row(), ME));
  assert.equal(twice.length, 1);
  assert.equal(twice, once, 'unchanged echo returns the same array (no re-render)');
});

test('a later receipt update for a known message updates it in place', () => {
  const once = appendUnique([], rowToThreadMessage(row(), ME));
  const read = appendUnique(once, rowToThreadMessage(row({ read: true, read_at: 'r', delivered_at: 'd' }), ME));
  assert.equal(read.length, 1);
  assert.equal(read[0].read, true);
  assert.equal(read[0].deliveredAt, 'd');
  assert.equal(read[0].isMine, true);
});

test('messages that arrive out of order are kept chronological', () => {
  const later = rowToThreadMessage(row({ id: 'm2', created_at: '2026-11-25T10:00:05.000Z' }), ME);
  const earlier = rowToThreadMessage(row({ id: 'm1' }), ME);
  const list = appendUnique(appendUnique([], later), earlier);
  assert.deepEqual(list.map((m) => m.id), ['m1', 'm2']);
});

test('merging a catch-up fetch keeps a message that arrived while the fetch was in flight', () => {
  const live = rowToThreadMessage(row({ id: 'live', created_at: '2026-11-25T10:00:09.000Z' }), ME);
  const fetched = [rowToThreadMessage(row({ id: 'old' }), ME)];
  const merged = fetched.reduce(appendUnique, [live]);
  assert.deepEqual(merged.map((m) => m.id), ['old', 'live']);
});

test('belongsToThread only matches the open conversation, in both directions', () => {
  assert.equal(belongsToThread(row(), ME, PARTNER), true);
  assert.equal(belongsToThread(row({ sender_id: PARTNER, recipient_id: ME }), ME, PARTNER), true);
  assert.equal(belongsToThread(row({ recipient_id: 'someone-else' }), ME, PARTNER), false);
  assert.equal(belongsToThread(row(), ME, undefined), false, 'no open thread means nothing matches');
});
