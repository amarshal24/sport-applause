# Protected creator game hosts

Public and live sales remain closed. Checkout is restricted to admin buyers and explicitly enabled test games. Test purchases do not represent real money.

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