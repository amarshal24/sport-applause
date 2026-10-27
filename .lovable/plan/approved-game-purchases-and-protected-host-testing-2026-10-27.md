# Approved game purchases and protected-host testing

## What will stay protected
- Prepare individual approved creator games and the All-Star/MVP passes, as requested.
- Do not sell unfinished pass libraries. Keep real game checkout closed until delivery, reconciliation, refund/dispute and payout readiness checks pass.
- No real test charge, real creator payout, publishing or native submission is included. Existing FX/skin and podcast web sales remain unchanged.
- Preserve signed-in sharing of highlights and marketplace photos; personal and paid media retain their separate protections.

## Build
1. Add an admin game-testing dashboard linked from Launch readiness and Games. Show each game’s delivery review, test sale readiness, verified tests, payout state and live blockers. Statuses must distinguish provider setup, local tests, hosted tests and actual external-host verification.
2. Add a protected reference test host using a Cloud function, not a browser-exposed host key or a persistent sandbox server. Use isolated test fixtures and sandbox-only sessions; refuse unpaid visitors, replayed/expired tokens, incorrect keys, disputes/refunds and stale delivery revisions. The test host must protect gameplay and assets on every request; preview authorization is never purchase proof.
3. Add an admin-controlled sandbox test lifecycle: temporary game submission/review, checkout, settlement confirmation, repeat reconciliation, partial/full refund, dispute and payout-allocation checks. Preserve all existing creator records and remove isolated fixtures after testing. Never fabricate a settled purchase to claim a Stripe test succeeded.
4. Prepare price-specific gaming-pass entitlements and readiness gates separately from FX, skins and podcast memberships. All-Star stays $3.99/month and MVP $7.99/month; both stay unavailable until promised libraries and billing safeguards are verified. Check existing product identifiers before creating any catalog entries.
5. Add readiness checks for eventual individual live game sales. A reference host passing tests does not certify arbitrary external creator hosts. Require each participating production host to demonstrate protected access, current revision, refund/dispute revocation and actual payout reconciliation before activation.

## Verification
- Run focused rule tests and existing game/commerce suites.
- Exercise admin and signed-out views, protected-host denial paths and sandbox checkout through the UI; read settlement/earnings back afterward.
- Assert a $4.99 sale uses the 15% commission ($0.75) and $4.24 creator net before processing/compliance allocation.
- Test atomic single-allocation, refund/dispute payout holds and source separation from podcast payouts. Payout records are not evidence money was sent.
- Update the launch dashboard and report with actual results and remaining blockers.

## Technical details
- Keep private host keys server-side, hashed at rest; host sessions are short-lived, revision-bound and rechecked on every protected request. Test-host endpoints must be explicitly sandbox-only and cannot approve live delivery automatically.
- Extend existing shared game reconciliation rather than duplicating fulfillment logic. Database changes are additive with explicit grants, RLS and authenticated admin authorization.
- Use the existing Stripe gateway and embedded checkout. Native digital game purchases remain blocked until compliant Apple/Google billing is verified.
- The reported storage rule intentionally supports member-shared media, not personal/paid files. Preserve that behavior and document the security exception rather than falsely claim an owner-only repair.

## Outside requirements
A participating production game host, final processing/compliance fee allocation, real external payout verification, native billing and separately authorized real-charge testing remain prerequisites. This plan does not promise immediate real-money activation or automated creator bank transfers.