# U⚡️Sportz production launch preparation

## Readiness findings

The initial report is available as **usportz-production-readiness-2026-10-27.md**. Existing tests passed (64 total), Stripe setup readiness is complete, and authenticated admin pages load. No payments, publishing, DNS changes or creator-data edits occurred.

The app is **not yet certified for unrestricted public launch or native stores**. A fresh browser test found Games accessible while signed out. Both custom domains still point to Wix. Email delivery, backup/restore, real-money lifecycle, comprehensive youth safety and native builds remain unverified. A deep security scan is running.

## Preserve existing approvals and product behavior

- Keep previously approved web FX/skin and podcast membership/premium episode sales enabled, as reaffirmed by you.
- Keep live tips, public paid games and paid gaming passes restricted.
- Preserve existing features, design, user data and creator balances.
- Continue with your chosen native iOS/Android approach using existing Capacitor preparation; do not rebuild the app or submit binaries without approval.

## First implementation stage

1. **Close signed-out app access:** one shared sign-in gate for every app-only page, preserving public marketing, application, updates, auth, legal and unsubscribe pages; retain the intended destination after login. Check all sibling app pages and signed-in navigation.
2. **Safe reversible fixes:** reproduce and harden search special-character/race/error cases; escape notification-email content and reject unsafe links; make game selection keyboard accessible. Keep restricted admin test refunds scoped as designed.
3. **Protected launch dashboard:** add an admin-only readiness view with working features, blockers, payments, security, web/iOS/Android, Founding 100 and an approval checklist. Clearly distinguish tested, previously tested, source-reviewed, pending and blocked evidence. Link existing Revenue, Payouts and Founding 100 pages. No “publish,” paid activation or submission action will run automatically.
4. **Verification:** add focused tests for access rules and input safety, run relevant existing suites, and exercise authenticated/signed-out desktop and phone-sized flows. Update the report with actual outcomes, not assumptions.

## Next stages and external blockers

- Review the deep scan when its results arrive; fix actionable issues separately from intentional dismissed rules.
- Specify and implement account deletion/export and age-appropriate safeguards after legal/operational requirements are established.
- Verify test-mode commerce lifecycle before requesting separate permission for any real charge or payout test.
- Complete verified email delivery, consent-aware marketing and welcome/beta invitation workflows.
- Correct Wix DNS using the exact records in the report only when you deliberately approve the traffic move; verify HTTPS and callbacks.
- Prepare native purchase restrictions/store billing, then local native projects, signing, real-device checks, icons/splash/screenshots and store disclosures. Store accounts, tools, physical devices and legal/business inputs are external requirements.

## Technical details

- Use a nested authenticated route boundary to prevent app-page mounting before session hydration; backend RLS remains authoritative.
- Keep launch evidence in a small versioned readiness module shared with the admin page; UI access uses the existing authenticated admin RPC, not local-storage role flags. No database changes are required for the first-stage dashboard.
- Use existing semantic tokens, components and lazy-page conventions; record new structural rules in AGENTS.md.
- No release, DNS, secret, migration, purchase or store-submission side effects are part of the first implementation stage.

## Approval boundary

Approving this plan authorizes the first implementation stage and safe test-only verification—not publishing, additional live products, real charges, destructive changes or native submission.