# Paid creator game sales

## Goal
Let creators sell approved games, buyers retain their purchases, and creators track earnings—without opening public sales before payment, delivery, refund, and payout checks pass.

## What to build
1. **Protected game delivery**
   - Keep existing free games opening on their creators’ websites.
   - Require paid game hosts to validate short-lived, single-use launch authorization issued by U⚡️Sportz. A shared website link alone must not unlock a paid game.
   - Review both the listing and protected delivery before a paid game becomes sellable. Editing a game’s launch destination must require review again.
   - If a creator’s host cannot validate purchases, keep that game unavailable for sale.
2. **Checkout and purchased games**
   - Add embedded checkout for approved, delivery-ready games and a buyer’s purchased-games view.
   - Take prices and creator identity from the approved listing, and buyer identity from the signed-in account—not submitted payment details.
   - Snapshot the approved game and price at checkout; grant access only after verified payment settlement.
   - Start with restricted test-account purchases. Live purchases remain blocked.
3. **Sales, refunds, and reconciliation**
   - Record settled payments exactly once and preserve purchases after signing out and back in.
   - Track refunds and disputes, revoke fully refunded access, and reduce the creator’s payable balance correctly.
   - Add reconciliation checks between payment-provider records, recorded sales, and creator balances. Failed recording must retry rather than silently acknowledge success.
   - Do not invent a commission: confirm the game-sales fee and tax treatment before creating test charges.
4. **Creator payouts**
   - Include game earnings in payout accounting without mixing test and real balances or scheduling the same earnings twice.
   - Use the existing admin-recorded manual payout process, including payment reference, bank account ending, and creator receipt confirmation. Marking a payout paid does not send money.
   - Hold disputed or unreconciled sales out of payable earnings.
5. **End-to-end checks**
   - Test creator submission and admin review, unpaid launch denial, a settled test purchase, saved access after a new sign-in, full and partial refunds, duplicate notifications, and delayed/failed payment.
   - Test account isolation, owner/price spoofing, launch-token reuse, changed game destinations, and payout double counting using isolated test games and accounts.
   - Leave real creators’ games, settings, and balances untouched.

## Launch requirements
- Stripe account claim, business verification, live connection, and readiness check must finish. The current status is step 1 in progress, not step 5.
- A working external host must participate in protected purchase verification; the app cannot enforce a paywall on an arbitrary public website.
- Game-sales commission and seller tax eligibility must be confirmed before checkout testing.
- Reconciliation, refund/dispute handling, and actual manual payout controls must pass production checks before public paid sales open.
- Native Apple/Google releases need a separately verified digital-billing path. Website Stripe checkout must not silently become native in-app billing.

## Technical approach
- Preserve separate creator-game sales and entitlements; game purchases must not unlock gaming passes, PRO FX, podcast memberships, or skin packs.
- Keep private launch configuration and secrets out of browse responses. External games stay outside the application; host verification uses authenticated server-to-server requests.
- Use service-written immutable payment snapshots, environment-scoped access, idempotent event processing, and atomic payout allocation.
- Add focused automated tests alongside existing game tests and exercise the restricted test flow through the actual app before reporting it working.

## Delivery order
Protected host authorization and review first; restricted checkout and settlement second; refunds, reconciliation, and payout allocation third; production readiness last. Public paid sales stay disabled throughout preparation.