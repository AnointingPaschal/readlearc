/**
 * TipModal — send a USDC tip to a creator via Payments.tip (on-chain)
 */
import { useState } from "react";
import { X, DollarSign, Heart, Loader2, CheckCircle2, ExternalLink } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { txUrl } from "@/lib/config";
import { explainError } from "@/lib/chain";
import { sendTip as payTip } from "@/lib/onchain/money";

const PRESETS = ["0.01", "0.05", "0.10", "0.50", "1.00"];

interface Props {
  creatorAddress: string;
  creatorName?:   string;
  contentId?:     string;   // bytes32 or a string we'll hash
  contentType?:   "article" | "video";
  onClose:        () => void;
}

export default function TipModal({ creatorAddress, creatorName, contentId, contentType, onClose }: Props) {
  const { signer, isAuth, requireAuth } = useAuth();
  const [amount,  setAmount]  = useState("0.10");
  const [custom,  setCustom]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [txHash,  setTxHash]  = useState("");
  const [error,   setError]   = useState("");

  async function sendTip() {
    if (!isAuth) { requireAuth(); return; }
    if (!signer) return;
    const amtNum = parseFloat(amount);
    if (!amtNum || amtNum <= 0) { setError("Enter a valid amount"); return; }

    setLoading(true);
    setError("");

    try {
      const cid = contentId && /^\d+$/.test(contentId) ? Number(contentId) : 0;
      const r = await payTip(signer, creatorAddress, amount, cid);
      setTxHash(r.txHash);
    } catch (e) {
      setError(explainError(e, "Tip failed"));
    } finally {
      setLoading(false);
    }
  }

  const name = creatorName || `${creatorAddress.slice(0,6)}…${creatorAddress.slice(-4)}`;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,.55)", backdropFilter:"blur(4px)" }}>
      <div style={{ width:"100%", maxWidth:400, background:"var(--bg-card)", borderRadius:"var(--r-xl)", boxShadow:"var(--shadow-lg)", border:"1.5px solid var(--border)", overflow:"hidden" }}>

        {/* Header */}
        <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <Heart size={18} style={{ color:"var(--brand)" }} />
            <span style={{ fontFamily:"Outfit,sans-serif", fontWeight:800, fontSize:16, color:"var(--text)" }}>Tip {name}</span>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-4)", padding:4, borderRadius:"var(--r-xs)" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding:"20px" }}>
          {!txHash ? (
            <>
              {/* Preset amounts */}
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
                {PRESETS.map(p => (
                  <button
                    key={p}
                    onClick={() => { setAmount(p); setCustom(false); }}
                    style={{
                      padding:"6px 14px", borderRadius:"var(--r-f)", border:"1.5px solid",
                      borderColor: amount===p && !custom ? "var(--brand)" : "var(--border)",
                      background: amount===p && !custom ? "var(--brand-muted)" : "var(--bg-alt)",
                      color: amount===p && !custom ? "var(--brand)" : "var(--text-3)",
                      fontWeight:700, fontSize:13, cursor:"pointer",
                    }}
                  >
                    ${p}
                  </button>
                ))}
                <button
                  onClick={() => setCustom(true)}
                  style={{
                    padding:"6px 14px", borderRadius:"var(--r-f)", border:"1.5px solid",
                    borderColor: custom ? "var(--brand)" : "var(--border)",
                    background: custom ? "var(--brand-muted)" : "var(--bg-alt)",
                    color: custom ? "var(--brand)" : "var(--text-3)",
                    fontWeight:700, fontSize:13, cursor:"pointer",
                  }}
                >
                  Custom
                </button>
              </div>

              {/* Custom input */}
              {custom && (
                <div style={{ position:"relative", marginBottom:14 }}>
                  <DollarSign size={14} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"var(--text-4)" }} />
                  <input
                    type="number"
                    min="0.01" step="0.01"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    style={{ width:"100%", paddingLeft:32, paddingRight:12, paddingTop:8, paddingBottom:8, background:"var(--bg-alt)", border:"1.5px solid var(--border)", borderRadius:"var(--r)", color:"var(--text)", fontSize:14, boxSizing:"border-box" }}
                    placeholder="0.00"
                    autoFocus
                  />
                </div>
              )}

              {error && (
                <p style={{ fontSize:12, color:"#ef4444", marginBottom:10 }}>{error}</p>
              )}

              <button
                onClick={sendTip}
                disabled={loading}
                className="btn btn-primary"
                style={{ width:"100%", justifyContent:"center", height:42, fontWeight:700 }}
              >
                {loading ? <Loader2 size={16} style={{ animation:"spin 1s linear infinite" }} /> : <Heart size={15} />}
                {loading ? "Sending…" : `Tip $${amount} USDC`}
              </button>

              <p style={{ fontSize:11, color:"var(--text-4)", textAlign:"center", marginTop:10 }}>
                On Arc Mainnet · instant settlement · 2% platform fee
              </p>
            </>
          ) : (
            <div style={{ textAlign:"center", padding:"12px 0" }}>
              <CheckCircle2 size={40} style={{ color:"var(--accent)", margin:"0 auto 12px" }} />
              <h3 style={{ fontFamily:"Outfit,sans-serif", fontWeight:800, fontSize:18, color:"var(--text)", marginBottom:6 }}>Tip sent!</h3>
              <p style={{ fontSize:13, color:"var(--text-3)", marginBottom:16 }}>
                ${amount} USDC delivered to {name} on Arc Mainnet.
              </p>
              <a href={txUrl(txHash)} target="_blank" rel="noreferrer"
                style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:12, color:"var(--brand)", textDecoration:"none" }}>
                View transaction <ExternalLink size={12} />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
