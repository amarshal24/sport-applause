import { test } from 'node:test';
import assert from 'node:assert/strict';
import { founderBenefits, settledCheckout, creatorNet } from '../../supabase/functions/_shared/commerceRules';
test('selected founders receive free PRO FX and elite skins',()=>assert.deepEqual(founderBenefits(true),{proFx:true,skinTier:'elite'}));
test('unselected applicants receive neither paid benefit',()=>assert.deepEqual(founderBenefits(false),{proFx:false,skinTier:'free'}));
test('unpaid checkout never confirms premium access',()=>{assert.equal(settledCheckout('unpaid'),false);assert.equal(settledCheckout(null),false);assert.equal(settledCheckout('paid'),true);});
test('creator net subtracts proportional refunds without counting platform fees as creator earnings',()=>{assert.equal(creatorNet(1000,150,500),425);assert.equal(creatorNet(1000,150,1000),0);});