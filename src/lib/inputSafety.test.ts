import { test } from 'node:test';
import assert from 'node:assert/strict';
import { searchOr, searchPattern } from './searchSafety';
import { escapeEmailHtml, safeEmailLink } from '../../supabase/functions/_shared/emailSafety';
test('search punctuation stays inside quoted literal filters', () => {
  assert.equal(searchOr(['username', 'full_name'], 'a,b(c)"'), 'username.ilike."%a,b(c)\\\"%",full_name.ilike."%a,b(c)\\\"%"');
  assert.equal(searchPattern('%_*'), '%\\%\\_\\*%');
  assert.throws(() => searchOr(['bad,or'], 'name'));
  assert.throws(() => searchPattern('x'.repeat(201)));
});
test('notification HTML escapes user text and rejects unsafe links', () => {
  assert.equal(escapeEmailHtml('<img src="x" onerror=\'x\'>&'), '&lt;img src=&quot;x&quot; onerror=&#39;x&#39;&gt;&amp;');
  for (const value of ['javascript:alert(1)', 'data:text/html,x', 'http://example.com', 'https://user:pass@example.com']) assert.equal(safeEmailLink(value), undefined);
  assert.equal(safeEmailLink('https://usports.lovable.app/purchases?a=1&b=2'), 'https://usports.lovable.app/purchases?a=1&amp;b=2');
});