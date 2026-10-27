import { z } from 'zod';
const searchSchema = z.string().trim().max(200);
export function searchPattern(raw: string) {
  const value = searchSchema.parse(raw).replace(/[\\%_*]/g, char => '\\' + char);
  return '%' + value + '%';
}
// PostgREST quoted filter values preserve commas/parentheses as data, not operators.
export function searchOr(columns: string[], raw: string) {
  const quoted = JSON.stringify(searchPattern(raw));
  return columns.map(column => {
    if (!/^[a-z_]+(?:\.[a-z_]+)?$/.test(column)) throw new Error('Invalid search column');
    return `${column}.ilike.${quoted}`;
  }).join(',');
}