import { test } from 'node:test';
import assert from 'node:assert/strict';
import { csvCell } from './csvSafety';
test('applicant export neutralizes spreadsheet formulas', () => {
  for (const value of ['=HYPERLINK("https://example.com")', '+1', '-1', '@SUM(1)', '  =1', '\t=1']) assert.equal(csvCell(value).startsWith('"\''), true);
  assert.equal(csvCell('Athlete "A"'), '"Athlete ""A"""');
});