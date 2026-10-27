import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GAME_PASS_PRICES, gamePassTier, liveGameReady } from '../../supabase/functions/_shared/gameReadiness';
test('gaming pass preparation preserves approved monthly prices', () => {
  assert.equal(GAME_PASS_PRICES.gaming_all_star_monthly, 399);
  assert.equal(GAME_PASS_PRICES.gaming_mvp_monthly, 799);
});
test('game entitlements require own prices environment readiness and valid status', () => {
  assert.equal(gamePassTier('gaming_all_star_monthly','active',null,'sandbox','sandbox',true),'all_star');
  assert.equal(gamePassTier('gaming_mvp_monthly','active',null,'live','live',true),'mvp');
  for (const price of ['fx_pro_monthly','skin_elite_onetime','podcast_membership']) assert.equal(gamePassTier(price,'active',null,'live','live',true),'free');
  assert.equal(gamePassTier('gaming_mvp_monthly','active',null,'live','live',false),'free');
  assert.equal(gamePassTier('gaming_mvp_monthly','active',null,'sandbox','live',true),'free');
  assert.equal(gamePassTier('gaming_mvp_monthly','unpaid',null,'live','live',true),'free');
  assert.equal(gamePassTier('gaming_mvp_monthly','canceled','2026-01-01','live','live',true,Date.parse('2026-10-27')),'free');
});
test('game live approval alone cannot bypass host and payout safeguards', () => {
  const checks={approval:true,host:true,settlement:true,refunds:true,disputes:true,payouts:true,fees:true,native:false,nativeBilling:false};
  assert.equal(liveGameReady(checks),true);
  for(const key of ['host','settlement','refunds','disputes','payouts','fees'] as const) assert.equal(liveGameReady({...checks,[key]:false}),false);
  assert.equal(liveGameReady({...checks,native:true}),false);
});