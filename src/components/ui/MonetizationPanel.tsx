/**
 * MonetizationPanel — creator-facing view of the on-chain monetization rules.
 * Shows whether the wallet can charge for content, progress toward the automatic requirements,
 * the manual-approval application, and the subscription plan prices.
 */
import { useState } from "react";
import { BadgeDollarSign, CheckCircle2, Circle, Clock, ShieldX, Loader2, Send } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useMonetization } from "@/lib/useMonetization";
import { applyForMonetization, savePlan, MON_REASON } from "@/lib/onchain/money";
import { withActivity } from "@/lib/activity";
import { explainError } from "@/lib/chain";

const Row = ({ ok, label, value }: { ok: boolean; label: string; value: string }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: ok ? "var(--accent)" : "var(--text-3)" }}>
    {ok ? <CheckCircle2 size={14} /> : <Circle size={14} />}
    <span style={{ flex: 1 }}>{label}</span>
    <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 11 }}>{value}</span>
  </div>
);

export default function MonetizationPanel({ compact = false }: { compact?: boolean }) {
  const { address, signer, requireAuth } = useAuth();
  const { state, loading, reload } = useMonetization(address);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [monthly, setMonthly] = useState("");
  const [yearly, setYearly] = useState("");
  const [planOn, setPlanOn] = useState(true);

  if (loading && !state) return <div className="card skeleton" style={{ height: 120 }} />;
  if (!state) return null;
  const { rules, progress: p } = state;
  const status = state.status; // 0 none 1 pending 2 approved 3 rejected 4 blocked

  async function apply() {
    if (!signer) { requireAuth(); return; }
    setBusy(true); setErr("");
    try { await withActivity("Applying for monetization", () => applyForMonetization(signer, note)); await reload(); }
    catch (e) { setErr(explainError(e, "Could not submit application")); }
    setBusy(false);
  }
  async function savePlanPrices() {
    if (!signer) return;
    setBusy(true); setErr("");
    try { await withActivity("Saving subscription plan", () => savePlan(signer, monthly || state!.plan.monthly, yearly || state!.plan.yearly, planOn)); await reload(); }
    catch (e) { setErr(explainError(e, "Could not save plan")); }
    setBusy(false);
  }

  const badge = state.monetized
    ? { c: "#059669", t: "Monetization active", i: <CheckCircle2 size={13} /> }
    : status === 4 ? { c: "#dc2626", t: "Monetization blocked", i: <ShieldX size={13} /> }
    : status === 1 ? { c: "#d97706", t: "Application pending review", i: <Clock size={13} /> }
    : { c: "#6b7280", t: "Not monetized yet", i: <BadgeDollarSign size={13} /> };

  return (
    <div className="card" style={{ padding: compact ? 14 : 18, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <BadgeDollarSign size={16} style={{ color: "var(--brand)" }} />
        <span style={{ fontFamily: "Outfit,sans-serif", fontWeight: 800, fontSize: 15, color: "var(--text)" }}>Monetization</span>
        <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: badge.c, background: `${badge.c}14`, border: `1px solid ${badge.c}33`, padding: "3px 10px", borderRadius: 99 }}>
          {badge.i}{badge.t}
        </span>
      </div>

      {state.monetized ? (
        <p style={{ fontSize: 12, color: "var(--text-3)", margin: 0 }}>
          You can charge for articles and videos, offer a subscription and receive tips — <b>{MON_REASON[state.reason]}</b>.
        </p>
      ) : status === 4 ? (
        <p style={{ fontSize: 12, color: "var(--text-3)", margin: 0 }}>An admin has disabled paid content for this wallet. Your content stays free to read.</p>
      ) : rules.all ? null : (
        <>
          <p style={{ fontSize: 12, color: "var(--text-3)", margin: 0 }}>
            Paid content is enabled per creator. {rules.auto ? "You qualify automatically when you meet all of these:" : "Apply and an admin will review your account."}
          </p>
          {rules.auto && (
            <div style={{ display: "flex", flexDirection: "column", gap: 7, padding: "10px 12px", background: "var(--bg-alt)", borderRadius: "var(--r)" }}>
              <Row ok={p.followersOk} label="Followers" value={`${p.followers} / ${rules.minFollowers}`} />
              <Row ok={p.postsOk} label="Published articles/videos" value={`${p.posts} / ${rules.minPosts}`} />
              <Row ok={p.ageOk} label="Account age (days)" value={`${p.ageDays} / ${rules.minAccountDays}`} />
            </div>
          )}
          {status === 1 ? (
            <p style={{ fontSize: 12, color: "#d97706", margin: 0 }}>Your application is with the admins.{status === 1 && rules.auto ? " You’ll also be enabled automatically once you hit the requirements." : ""}</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {status === 3 && <p style={{ fontSize: 12, color: "#dc2626", margin: 0 }}>Your last application was declined. You can apply again.</p>}
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={280} placeholder="Tell the admins about your content (optional)"
                style={{ width: "100%", background: "var(--bg-alt)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", padding: "8px 10px", fontSize: 12, color: "var(--text)", fontFamily: "inherit", resize: "none", outline: "none" }} />
              <button className="btn btn-primary btn-sm" onClick={apply} disabled={busy} style={{ alignSelf: "flex-start" }}>
                {busy ? <Loader2 size={13} className="spin" /> : <Send size={13} />} Apply for monetization
              </button>
            </div>
          )}
        </>
      )}

      {state.monetized && !compact && (
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--text-4)", marginBottom: 8 }}>Subscription plan</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            {[{ l: "Monthly (USDC)", v: monthly, s: setMonthly, ph: state.plan.monthly }, { l: "Yearly (USDC)", v: yearly, s: setYearly, ph: state.plan.yearly }].map((f) => (
              <label key={f.l} style={{ fontSize: 11, color: "var(--text-4)", display: "flex", flexDirection: "column", gap: 4 }}>
                {f.l}
                <input type="number" min="0" step="0.01" value={f.v} placeholder={f.ph} onChange={(e) => f.s(e.target.value)}
                  style={{ background: "var(--bg-alt)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", padding: "7px 10px", fontSize: 13, fontWeight: 700, color: "var(--text)", outline: "none" }} />
              </label>
            ))}
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-3)", marginBottom: 8 }}>
            <input type="checkbox" checked={planOn} onChange={(e) => setPlanOn(e.target.checked)} /> Accept subscriptions
          </label>
          <button className="btn btn-secondary btn-sm" onClick={savePlanPrices} disabled={busy}>{busy ? <Loader2 size={13} className="spin" /> : null} Save plan on-chain</button>
        </div>
      )}
      {err && <p style={{ fontSize: 12, color: "#dc2626", margin: 0 }}>{err}</p>}
    </div>
  );
}
