/**
 * SubscribeModal — monthly or yearly USDC subscription to a creator.
 * Calls Payments.subscribe on-chain; the contract records the expiry.
 */
import { useState } from "react";
import { X, Star, Loader2, CheckCircle2, ExternalLink } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { txUrl } from "@/lib/config";
import { explainError } from "@/lib/chain";
import { subscribeTo } from "@/lib/onchain/money";

interface Props {
  creatorAddress:  string;
  creatorName?:    string;
  monthlyPrice:    string;   // e.g. "5.00"
  yearlyPrice:     string;   // e.g. "50.00"
  onClose:         () => void;
  onSuccess?:      () => void;
}

export default function SubscribeModal({
  creatorAddress, creatorName, monthlyPrice, yearlyPrice, onClose, onSuccess,
}: Props) {
  const { signer, isAuth, requireAuth } = useAuth();
  const [plan,    setPlan]    = useState<"monthly"|"yearly">("monthly");
  const [loading, setLoading] = useState(false);
  const [txHash,  setTxHash]  = useState("");
  const [error,   setError]   = useState("");

  const price = plan === "yearly" ? yearlyPrice : monthlyPrice;
  const isFree = parseFloat(price) === 0;
  const name   = creatorName || `${creatorAddress.slice(0,6)}…${creatorAddress.slice(-4)}`;

  async function subscribe() {
    if (!isAuth) { requireAuth(); return; }
    if (!signer) return;

    setLoading(true);
    setError("");

    try {
      if (isFree) { setTxHash("free"); onSuccess?.(); return; }
      const r = await subscribeTo(signer, creatorAddress, plan === "yearly" ? 1 : 0);
      setTxHash(r.txHash);
      onSuccess?.();
    } catch (e) {
      setError(explainError(e, "Subscription failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,.55)", backdropFilter:"blur(4px)" }}>
      <div style={{ width:"100%", maxWidth:420, background:"var(--bg-card)", borderRadius:"var(--r-xl)", boxShadow:"var(--shadow-lg)", border:"1.5px solid var(--border)", overflow:"hidden" }}>

        {/* Header */}
        <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <Star size={18} style={{ color:"#ca8a04" }} />
            <span style={{ fontFamily:"Outfit,sans-serif", fontWeight:800, fontSize:16, color:"var(--text)" }}>Subscribe to {name}</span>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-4)", padding:4 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding:"20px" }}>
          {!txHash ? (
            <>
              {/* Plan selector */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:18 }}>
                {(["monthly","yearly"] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setPlan(p)}
                    style={{
                      padding:"14px 12px", borderRadius:"var(--r-md)", border:"2px solid",
                      borderColor: plan===p ? "var(--brand)" : "var(--border)",
                      background: plan===p ? "var(--brand-muted)" : "var(--bg-alt)",
                      cursor:"pointer", textAlign:"center" as const,
                    }}
                  >
                    <div style={{ fontFamily:"Outfit,sans-serif", fontWeight:800, fontSize:22, color:plan===p?"var(--brand)":"var(--text)", marginBottom:2 }}>
                      {parseFloat(p === "monthly" ? monthlyPrice : yearlyPrice) === 0 ? "Free" : `$${p === "monthly" ? monthlyPrice : yearlyPrice}`}
                    </div>
                    <div style={{ fontSize:12, color:"var(--text-3)", fontWeight:600 }}>
                      {p === "monthly" ? "per month" : "per year"}
                    </div>
                    {p === "yearly" && parseFloat(yearlyPrice) > 0 && parseFloat(monthlyPrice) > 0 && (
                      <div style={{ fontSize:10, color:"var(--accent)", marginTop:3, fontWeight:700 }}>
                        Save {Math.round(100 - (parseFloat(yearlyPrice) / (parseFloat(monthlyPrice) * 12)) * 100)}%
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div style={{ padding:"10px 14px", background:"var(--bg-alt)", borderRadius:"var(--r)", marginBottom:16, fontSize:12, color:"var(--text-3)" }}>
                Unlocks all creator articles for {plan === "yearly" ? "1 year" : "30 days"}. Paid in USDC straight to the creator on-chain — no middleman.
              </div>

              {error && <p style={{ fontSize:12, color:"#ef4444", marginBottom:10 }}>{error}</p>}

              <button
                onClick={subscribe}
                disabled={loading}
                className="btn btn-primary"
                style={{ width:"100%", justifyContent:"center", height:42, fontWeight:700 }}
              >
                {loading
                  ? <Loader2 size={16} style={{ animation:"spin 1s linear infinite" }} />
                  : <Star size={15} />}
                {loading
                  ? "Processing…"
                  : isFree
                  ? "Subscribe Free"
                  : `Subscribe for $${price} USDC`}
              </button>
            </>
          ) : (
            <div style={{ textAlign:"center", padding:"12px 0" }}>
              <CheckCircle2 size={40} style={{ color:"var(--accent)", margin:"0 auto 12px" }} />
              <h3 style={{ fontFamily:"Outfit,sans-serif", fontWeight:800, fontSize:18, color:"var(--text)", marginBottom:6 }}>Subscribed!</h3>
              <p style={{ fontSize:13, color:"var(--text-3)", marginBottom:16 }}>
                You now have {plan} access to all of {name}&apos;s content.
              </p>
              {txHash !== "free" && (
                <a href={txUrl(txHash)} target="_blank" rel="noreferrer"
                  style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:12, color:"var(--brand)", textDecoration:"none" }}>
                  View transaction <ExternalLink size={12} />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
