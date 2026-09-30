# Readlearc

Pay-per-read / pay-per-second publishing where **articles, videos, profiles, follows, communities, monetization rules and payments all live on-chain**.
Front end: Vite + React (SPA). Hosting: Cloudflare Pages (+ Pages Functions). Admin config: Cloudflare KV.

## Architecture

| Layer | What | Where |
|---|---|---|
| Web app | Vite + React 19 SPA, file-based routes in `src/pages` | `src/` |
| Edge API | Pages Functions: config, brand, admin settings, AI proxy, **content-key server**, stream vouchers | `functions/` |
| Config store | Workers KV binding `RL_KV` (contract addresses, brand, settings, AI keys, master secret) | Cloudflare |
| Contracts | `Roles`, `ContentStore`, `Social`, `Monetization`, `Payments`, `StreamPay`, `CreatorTip` | `contracts/` |

**Content on-chain.** Article bodies and video segments are written as `Chunk` event logs of `ContentStore`; metadata lives in contract storage.
Payloads are gzip'd and AES-GCM encrypted in the browser when paid. Keys are derived server-side (`HMAC(master, label)`) and released by
`/api/content/key` only after the server verifies on-chain: purchase / subscription / author / admin, or a valid StreamPay voucher for video seconds.
Video is transcoded in-browser (ffmpeg.wasm) to fMP4 HLS, each segment encrypted with its own key, and played with hls.js.

**Monetization (who may charge).** Configured in *Admin → Monetization*: enable for **all users**, **automatic** thresholds
(min followers / posts / account age), or **manual** approval (apply → approve / reject / block). Paid publish, pay, subscribe and tip all require `isMonetized`.
Default revenue split 85 / 10 / 5 (writer / referrer / platform; no referrer → writer gets 90%), editable in *Admin → Finance → Fees*.

**Social.** Follow/unfollow, profiles, comments, reactions and communities (groups, posts, members) are `Social` contract state.

## Deploy

1. **Contracts** (once per chain)
   ```bash
   cd contracts && npm i && npm run compile && npm test
   DEPLOYER_PRIVATE_KEY=0x… RPC_URL=https://rpc.mainnet.arc.io TREASURY_ADDRESS=0x… npm run deploy
   ```
   Addresses + start block are written to `contracts/deployments/<chainId>.json`. The deployer becomes the owner (super admin) of `Roles`.
2. **Cloudflare Pages** – connect the repo, build command `npm run build`, output directory `dist`.
3. **KV** – create a namespace, then Pages project → Settings → Functions → *KV namespace bindings*: variable **`RL_KV`**.
4. **Variables / secrets** (Pages → Settings → Variables)
   - `ADMIN_ADDRESSES` – comma-separated wallet(s) allowed to administer before on-chain roles exist (use the deployer).
   - `CONTENT_MASTER_SECRET` – long random string for content keys. **Keep it stable**: changing it makes existing paid content undecryptable.
5. Open `/admin` with the admin wallet → **Finance → Contracts**, paste the addresses (saved to KV), set the start block, brand and AI key.
   Optional build-time defaults: see `.env.example`.

## Local development

```bash
npm i
npm run dev          # Vite only (UI; /api needs Functions)
npm run dev:cf       # build + wrangler pages dev with a local KV (full stack)
npm run typecheck
cd contracts && npm test
```

## Caveats

- Everything on-chain is **publicly readable**; that is why paid content is encrypted and keys are gated by the key server.
- Storing video on-chain is gas-heavy; expect real cost per minute of video. Short clips recommended.
- Log scans start from the configured start block; at large scale add an indexer.
- Drafts are kept in the browser (localStorage) until published.
- Video key gating is position-based (preview window + paid seconds + 20 s look-ahead), so skipping far ahead requires paying for that time.
