# Fixed-IP relay for payouts

Flutterwave (and optionally Paystack) only accept payout API calls from IP addresses you whitelist. Cloudflare Pages has no fixed IP,
so payout calls go through this tiny relay, which runs on a server with a **static public IP**.

1. Get any small server with a fixed IP (a $4–6/month VPS is plenty) and install Node 18+.
2. Copy `server.mjs` to it and run: `RELAY_TOKEN=<a long random string> node server.mjs` (keep it running with pm2 or systemd).
3. Put HTTPS in front, e.g. with Caddy: `caddy reverse-proxy --from relay.yourdomain.com --to localhost:8787`
   (point a DNS record for `relay.yourdomain.com` at the server first).
4. In Admin → Finance → Banking → *Fixed-IP relay*, enter `https://relay.yourdomain.com` and the same token, then Save.
   The page shows the relay's IP.
5. Whitelist that IP in the provider's dashboard (Flutterwave → Settings → API; Paystack → Settings → API Keys & Webhooks).

The relay only forwards to `api.flutterwave.com` and `api.paystack.co`, and only for callers with the token.
