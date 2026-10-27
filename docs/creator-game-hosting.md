# Protected creator game hosts

Public and live sales remain closed. Checkout is restricted to admin buyers and explicitly enabled test games. Test purchases do not represent real money.

## Admin reference host (October 27, 2026)

Open **Launch readiness → Game purchase testing** at `/admin/game-testing`. The hosted reference endpoint protects sandbox gameplay and its asset response with a 10-minute random session, stored only as a hash. Browser sessions remain in component memory. Every request checks expiry, the current delivery revision, suspension and (outside reviewer previews) a settled, reconciled, non-refunded/non-disputed purchase. No external host key is exposed to the browser.

**Verified this turn:** admin fixture creation; six hosted checks (valid preview, replay refusal, missing/unpaid-session denial, expired token denial, incorrect external-host key denial and stale revision denial); protected preview gameplay/asset reads; shot state read-back; rejection of allocation without settled earnings; signed-out dashboard refusal; phone layout; temporary run/order/game/session cleanup, with zero remaining runs. Existing creator settings were not modified.

**Not completed this turn:** Stripe sandbox checkout opened and card fields could be filled, but submission did not complete. The final screenshot showed required billing street/city fields empty. Attempts stopped; no paid order or sale was fabricated. Successful settlement, provider partial/full refunds, disputed buyer access, payout allocation/double-allocation and refund/dispute holds remain unverified in the new harness. Dispute controls are explicitly ledger simulations, not actual provider disputes. No real money was charged or sent.

To finish the test in the preview: create the test game, run host checks, then choose **Test purchase $4.99**. Use Stripe’s test card `4242 4242 4242 4242`, a future expiry, any three-digit security code, and complete every required billing-address field; select USD for the fixed-currency order test. After the payment returns, confirm settlement in the testing page and check $0.75 commission/$4.24 net. Run partial/full refunds, purchased-host revocation and scoped allocation checks. Remove only the isolated test records afterward. Do not use a real card.

The test host is an explicitly isolated in-app test instrument, not the launcher for actual external creator games. It cannot certify arbitrary external hosts or activate live sales. All-Star/MVP price-specific entitlement rules are prepared, but no recurring checkout, pass ledger or promised-library readiness is claimed; packages remain unavailable. Catalog creation is deferred until an authoritative inventory can prevent duplicate permanent product IDs.

## Host integration

1. Create a host key from **My games → Protected delivery**. Store the key on the external game's server only. It is shown once; U⚡️Sportz stores only its SHA-256 hash.
2. Launch a protected preview from U⚡️Sportz. The destination receives `usportz_game` and `usportz_token` in its URL fragment. Read them in the host's browser, immediately clear the fragment with `history.replaceState`, and send them to the host's own server over HTTPS. Do not put tokens in logs, analytics, or localStorage.
3. The host server calls the project's deployed `verify-game-launch` function using POST, a JSON body `{ "gameId": "<game UUID>", "token": "<launch token>" }`, and header `X-Game-Host-Key: <private host key>`. Obtain the deployed endpoint from the project owner; never expose the host key in client-side code.
4. Grant a scoped, secure host session only after HTTP 200 with `authorized: true`, the expected game ID, and `environment: sandbox`. Store the returned user ID, revision, and preview flag server-side. **`preview: true` is owner/reviewer authorization, not proof of payment.** A restricted test buyer receives `preview: false` only after verified settlement. Never accept user IDs or preview flags supplied by the browser as session claims.
5. Check that host session on every protected asset and gameplay request by calling `check-game-host-access` server-side with the same private header and body `{ gameId, userId, revision, preview }` from the stored session. Deny on any error or `authorized: false`. Fully refunded purchases, disputes, suspensions, and changed delivery revisions revoke purchase access. A publicly accessible game page or downloadable asset is not purchase protection.
6. Verify an unpaid visitor cannot access gameplay, clear host sessions, and demonstrate protected preview delivery to a reviewer. Reviewers must test denial at the host, not assume token redemption proves host-side protection.

Tokens expire in 60 seconds and can be redeemed once. Redemption is atomic. Wrong host keys, expired tokens, reused tokens, changed destinations, or rotated keys must fail. Replacing a host key or changing the launch URL invalidates authorizations and delivery review. Each game has its own key. Rate-limit verification attempts on the host.

## Limits

- Existing free games continue to open externally without this protocol.
- Paid-game raw URL launching is disabled even for owners/reviewers; use protected test previews instead.
- Successful redemption proves the host can validate authorization, not that every host asset is protected. The reviewer must independently validate the entire host access boundary.
- Public purchases, live authorization, and automatic payouts remain disabled. Do not accept real money using this restricted test flow.
- Restricted game checkout snapshots a 15% platform commission; a $4.99 test sale records $0.75 commission and $4.24 creator net before processing/compliance charges. The US seller uses full tax handling for eligible digital games. Final processing/compliance fee allocation and product-specific tax classification require production review; the initial test browser game uses the downloaded video-game classification. Do not apply this classification blindly to every future game.
- Production still needs a participating external host, Stripe readiness, refund/dispute reconciliation, and tested real payout controls. Native app sales require compliant Apple/Google billing separately.