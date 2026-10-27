import { test } from 'node:test';
import assert from 'node:assert/strict';
import { podcastLiveAllowed, podcastReturnAllowed, invoiceSubscription } from '../../supabase/functions/_shared/podcastCheckoutRules';
test('approved live memberships and episodes can sell',()=>{assert.equal(podcastLiveAllowed('membership','true'),true);assert.equal(podcastLiveAllowed('unlock','true'),true);});
test('tips and missing approval remain blocked live',()=>{assert.equal(podcastLiveAllowed('tip','true'),false);assert.equal(podcastLiveAllowed('unlock',undefined),false);});
test('podcast thank-you must stay on caller origin',()=>{assert.equal(podcastReturnAllowed('https://usports.lovable.app/podcasts/thank-you','https://usports.lovable.app'),true);assert.equal(podcastReturnAllowed('https://evil.example/podcasts/thank-you','https://usports.lovable.app'),false);});
test('renewals resolve current and legacy subscription fields',()=>{assert.equal(invoiceSubscription({parent:{subscription_details:{subscription:'sub_new'}}}),'sub_new');assert.equal(invoiceSubscription({subscription:'sub_old'}),'sub_old');});