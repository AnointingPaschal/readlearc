// Fixed-IP relay for Readlearc payouts. Run on any server with a static public IP, put HTTPS in front of it, whitelist this server's IP
// in the Flutterwave / Paystack dashboard, and enter its URL + token in Admin → Finance → Banking.
// Only forwards to the payout providers' API hosts, and only with the correct token. No dependencies (Node 18+).
//   RELAY_TOKEN=<long random string> node server.mjs        (PORT defaults to 8787)
import http from "node:http";

const TOKEN = process.env.RELAY_TOKEN || "";
const PORT = Number(process.env.PORT || 8787);
const ALLOW = (process.env.RELAY_ALLOW || "api.flutterwave.com,api.paystack.co").split(",").map((h) => h.trim()).filter(Boolean);
if (TOKEN.length < 24) { console.error("Set RELAY_TOKEN to a random string of at least 24 characters."); process.exit(1); }

const ok = (a, b) => { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; };
let myIp = ""; const findIp = async () => { try { myIp = (await (await fetch("https://api.ipify.org?format=json")).json()).ip; } catch { /* retry later */ } };
void findIp();

http.createServer(async (req, res) => {
  const send = (code, obj) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(obj)); };
  if (!ok(String(req.headers["x-relay-token"] || ""), TOKEN)) return send(401, { error: "unauthorized" });
  if (req.url === "/ip") { if (!myIp) await findIp(); return send(200, { ip: myIp }); }
  if (req.url !== "/f") return send(404, { error: "not found" });
  let target; try { target = new URL(String(req.headers["x-relay-target"] || "")); } catch { return send(400, { error: "bad target" }); }
  const local = process.env.RELAY_ALLOW_HTTP === "1";                 // tests only
  if (!ALLOW.includes(target.hostname) || (target.protocol !== "https:" && !local)) return send(403, { error: "target not allowed" });
  const chunks = []; for await (const c of req) chunks.push(c);
  const headers = {}; for (const h of ["authorization", "content-type", "accept"]) if (req.headers[h]) headers[h] = String(req.headers[h]);
  try {
    const r = await fetch(target, { method: req.method, headers, body: ["GET", "HEAD"].includes(req.method) ? undefined : Buffer.concat(chunks) });
    res.writeHead(r.status, { "content-type": r.headers.get("content-type") || "application/json" });
    res.end(Buffer.from(await r.arrayBuffer()));
  } catch (e) { send(502, { error: "upstream unreachable", detail: String(e.message || e) }); }
}).listen(PORT, () => console.log(`relay listening on :${PORT}, forwarding to ${ALLOW.join(", ")}`));
