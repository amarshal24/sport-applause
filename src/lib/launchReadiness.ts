export type EvidenceState = 'Verified' | 'Previously tested' | 'Source reviewed' | 'Unverified' | 'Blocked';
export const auditDate = 'October 27, 2026';
export const readinessAreas: { title: string; status: EvidenceState; evidence: string; next: string }[] = [
  { title: 'Working features', status: 'Previously tested', evidence: '69 local tests pass after fixes. Editors, tracking, public forms and game safeguards have earlier workflow evidence.', next: 'Repeat signup, upload, playback, social and moderation journeys with read-back; certify physical devices.' },
  { title: 'Bugs & blockers', status: 'Blocked', evidence: 'Shared sign-in gate verified across 33 app-only URLs. Search race/error states and punctuation handling verified; CSV and email safety tests pass.', next: 'Resolve remaining deep-scan authorization and game integrity findings; email helper hosting and fresh security verification remain pending.' },
  { title: 'Payment readiness', status: 'Unverified', evidence: 'Stripe setup readiness passed. Approved web FX/skin and podcast memberships/episodes remain enabled. Tips and paid games stay restricted.', next: 'Verify settlement, renewal, refund, dispute, receipts and external payout. Any real test charge requires separate approval.' },
  { title: 'Security readiness', status: 'Blocked', evidence: 'All 11 buckets private; inspected application tables have RLS. Deep review found friendship, public AI access, game integrity, portal-return and podcast-link risks.', next: 'Confirm hosted auth settings; reproduce and remediate actionable findings. A route gate is not backend authorization.' },
  { title: 'Web deployment', status: 'Blocked', evidence: 'An older published deployment exists. usportz.com and www still point to Wix; required TXT verification is missing.', next: 'Owner-approved DNS move, HTTPS/callback tests and separate approval to publish the audited revision.' },
  { title: 'iOS submission', status: 'Blocked', evidence: 'Capacitor configuration exists; no signed archive, TestFlight build or real iPhone certification verified.', next: 'Developer account, native billing, deletion flow, privacy/safety review, signing, assets and TestFlight testing.' },
  { title: 'Android submission', status: 'Blocked', evidence: 'No Android release bundle or Play testing-track submission verified.', next: 'Play account, billing, Data safety/deletion, signed AAB and required internal/closed tests.' },
  { title: 'Founding 100', status: 'Previously tested', evidence: 'Public/admin pages load. Earlier application, approval, counter, consent and founder-benefit revocation tests documented.', next: 'Verified sending domain, welcome/confirmation delivery, beta invitations and consent-aware newsletter integration.' },
];
export const approvalChecklist = [
  'Current security findings resolved and adversarial access checks passed',
  'Youth safety, privacy, terms, copyright and account deletion/export reviewed',
  'Signup/recovery, upload/playback, editors and physical devices verified',
  'Test payment lifecycle and entitlement revocation verified',
  'Separate real-charge and external payout test permission recorded',
  'Welcome, invitation and unsubscribe emails delivered successfully',
  'Backups, restore, monitoring and alerts verified',
  'Custom-domain HTTPS, auth and checkout callbacks verified',
  'Native billing, signed builds, store disclosures and testing completed',
  'Separate web publishing and native submission approval recorded',
];