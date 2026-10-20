# Live payment audit — 2026-10-20

## Verdict
Live payments are not ready for end-to-end real-money testing. No payment approval flags, creator settings, balances, uploads, entitlements, or payment records were changed; no charges, refunds, or transfers were made.

## Stripe status (fresh provider read)
- Account claim: complete.
- Business/live onboarding: complete.
- Install Lovable app on LIVE Stripe account: action required.
- Live key provisioning: not started; automated after app installation.
- Readiness check: not started.
- The local preview has test configuration; no production payment token file is present locally. This is not proof of hosted production configuration.

## Checks performed
Authenticated as the requesting owner, opened Games, Podcasts, podcast monetization/earnings, admin payouts, and Animation Center. Pages loaded without JavaScript page errors. Admin payouts displayed no payouts. Creator-game store had no games, so no real listing purchase could be exercised. Both paid game-pass buttons were unavailable. Existing payment-focused tests: **19 passed, 0 failed** across approval, packages, commission, listings, delivery, and reviews.

Safe deployed endpoint probes specified live environment but deliberately non-purchasable inputs, so none could create an order or payment if a gate changed. These prove refusal paths, not successful paid flows:

| Section | Observed result | Still unverified |
| --- | --- | --- |
| PRO FX Pack / membership and all Skin Packs | Shared checkout returned HTTP 403, launch approval required | Individual live prices/catalog, real payment, settlement, fulfillment, renewal/refund |
| Podcast tips | HTTP 403, public paid features not open | Charge, settlement, accurate creator earnings and refund |
| Premium episode unlock | HTTP 403, public paid features not open | Paid access after live settlement, live refund revocation |
| Podcast memberships | HTTP 403, public paid features not open | Subscription, renewal, cancellation and access lifecycle |
| Creator game purchases | HTTP 400, restricted test purchases only | Participating protected host, live settlement/refund/dispute/reconciliation |
| All-Star / MVP gaming passes | Both unavailable in UI; package restriction tests passed | Missing paid game libraries and separate pass entitlements |
| Creator payouts | Owner admin page loaded; no payout records | Actual manual transfer and receipt; scheduler only simulates podcast test payouts |
| Billing portal | Authenticated, environment-filtered endpoint inspected, not invoked | Real live subscription/customer and portal operations |
| Marketplace | Contact/in-person commerce, no integrated checkout identified | Not a Stripe payment section |
| Apple/Google digital billing | No implementation identified | Native store billing integration and real device/store testing |

Aggregate reads showed zero creator-game orders, no FX purchases or payouts, and one test-environment subscription; no live records in those inspected tables. Existing podcast settings were read through the UI only and never saved.

## Additional code-audit blockers (not fixed in this testing request)
1. `usePremium` does not filter subscriptions by PRO FX price. An unrelated active subscription can grant FX access; newest unrelated rows can also mask a valid FX subscription. Skin one-time purchase mapping remains separate.
2. Generic checkout trusts submitted user ID/email instead of deriving the buyer from authentication; it lacks an explicit eligible-product allowlist. Resolve before public launch.
3. Several generic and podcast webhook database writes ignore returned errors, potentially acknowledging events before purchases/earnings persist. Retry/error handling requires validation.
4. Podcast return-page success copy uses URL parameters without confirming settlement; it can report an unlock/membership/tip before verified completion. This does not itself grant protected media access.
5. Local payment configuration does not explicitly disable gateway JWT verification for generic checkout, podcast checkout, or portal. Authenticated refusal probes succeeded, but public preflight/deployment settings need checking before rollout.
6. Portal return destinations need trusted-origin validation; lifecycle testing with a live subscription remains blocked.
7. Generic one-time FX/skin refunds are not handled by the reviewed charge-refund path; paid entitlement revocation needs implementation/testing.
8. Payout scheduler is test-only simulation, not Stripe transfers. Admin marking paid records an outside transfer; it does not send money.

## Next steps
Install the Lovable app on the LIVE Stripe account from Lovable's Payments tab, wait for automatic live provisioning, then run readiness. Fix the listed launch blockers and rerun isolated test-environment purchase/settlement/refund workflows. Actual live-charge testing needs separate, explicit approval of the item, amount, buyer, and refund plan; this audit does not enable public sales. Native billing and external game-host delivery require their own checks.