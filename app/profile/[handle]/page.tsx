"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ethers } from "ethers";
import { BookOpen, DollarSign, Users, Clock, CheckCircle2, ExternalLink, ArrowLeft, Globe, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useWallet } from "../../../lib/web3Context";
import { fetchArticlesByAuthor, READLEARC_ADDRESS, READLEARC_ABI, ARC_EXPLORER } from "../../../lib/web3";
import Navbar from "../../../components/ui/Navbar";

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #6d28d9, #059669)",
  "linear-gradient(135deg, #0284c7, #7c3aed)",
  "linear-gradient(135deg, #d97706, #dc2626)",
  "linear-gradient(135deg, #059669, #0284c7)",
  "linear-gradient(135deg, #7c3aed, #ec4899)",
  "linear-gradient(135deg, #ea580c, #eab308)",
];

function loadProfile(address: string) {
  try {
    const raw = localStorage.getItem(`rl-profile-${address.toLowerCase()}`);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export default function ProfilePage() {
  const params  = useParams();
  const rawHandle = (params.handle as string) || "";
  // Support both full address and any lookup; treat as address
  const profileAddress = rawHandle.startsWith("0x") ? rawHandle : rawHandle;

  const { address: myAddress, isConnected, provider } = useWallet();
  const isOwn = isConnected && myAddress.toLowerCase() === profileAddress.toLowerCase();

  const [articles,     setArticles]     = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [totalEarned,  setTotalEarned]  = useState(0);
  const [totalReads,   setTotalReads]   = useState(0);
  const [isVerified,   setIsVerified]   = useState(false);
  const [profile,      setProfile]      = useState<any>({});

  useEffect(() => {
    if (!profileAddress) return;
    // Load localStorage profile
    setProfile(loadProfile(profileAddress));

    async function load() {
      setLoading(true);
      try {
        let prov: ethers.Provider;
        if (provider) {
          prov = provider;
        } else {
          prov = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.arc.io/testnet");
        }

        const arts = await fetchArticlesByAuthor(profileAddress, prov);
        setArticles(arts);

        const reads  = arts.reduce((s, a) => s + parseInt(a.reads  || "0"), 0);
        const earned = arts.reduce((s, a) => s + parseInt(a.reads || "0") * parseFloat(a.price || "0") * 0.85, 0);
        setTotalReads(reads);
        setTotalEarned(earned);

        // Check verified writer status
        if (READLEARC_ADDRESS) {
          const c = new ethers.Contract(READLEARC_ADDRESS, READLEARC_ABI, prov);
          const verified = await c.verifiedWriters(profileAddress);
          setIsVerified(verified);
        }
      } catch (err) {
        console.error("Profile load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [profileAddress, provider]);

  const displayName = profile.displayName || (profileAddress ? profileAddress.slice(0,8) + "…" + profileAddress.slice(-4) : "Unknown");
  const avatarGrad  = AVATAR_GRADIENTS[profile.avatarIdx ?? 0];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "80px 16px 60px" }}>

        {/* Back */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} style={{ marginBottom: 24 }}>
          <Link href="/explore" className="btn btn-ghost btn-sm"><ArrowLeft size={14} /> Explore</Link>
        </motion.div>

        {/* Profile header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: "clamp(20px,4vw,32px)", marginBottom: 20 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "flex-start" }}>

            {/* Avatar */}
            <div style={{ width: 72, height: 72, borderRadius: 18, background: avatarGrad, flexShrink: 0, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }} />

            {/* Info */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: "clamp(18px,4vw,26px)", fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em" }}>
                  {displayName}
                </h1>
                {isVerified && (
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "var(--accent)", background: "rgba(5,150,105,0.08)", border: "1px solid rgba(5,150,105,0.2)", borderRadius: "var(--radius-full)", padding: "2px 8px" }}>
                    <CheckCircle2 size={11} /> Verified Writer
                  </span>
                )}
              </div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "var(--text-4)", marginBottom: 10 }}>
                {profileAddress}
              </div>
              {profile.bio && (
                <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.65, marginBottom: 10 }}>{profile.bio}</p>
              )}
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--brand)", textDecoration: "none", fontWeight: 600 }}>
                    <Globe size={12} /> Website
                  </a>
                )}
                {profile.twitter && (
                  <a href={`https://twitter.com/${profile.twitter.replace("@","")}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--brand)", textDecoration: "none", fontWeight: 600 }}>
                    <ExternalLink size={12} /> {profile.twitter}
                  </a>
                )}
                <a href={`${ARC_EXPLORER}/address/${profileAddress}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text-4)", textDecoration: "none", fontWeight: 500 }}>
                  <ExternalLink size={11} /> View on-chain
                </a>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {[
                { label: "Articles", value: articles.length.toString(), color: "var(--brand)" },
                { label: "Total Reads", value: totalReads.toLocaleString(), color: "#0284c7" },
                { label: "USDC Earned", value: `$${totalEarned.toFixed(2)}`, color: "#059669" },
              ].map(s => (
                <div key={s.label} style={{ textAlign: "center", minWidth: 60 }}>
                  <div style={{ fontFamily: "Outfit, sans-serif", fontSize: "clamp(18px,3vw,24px)", fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: "var(--text-4)", fontWeight: 600, marginTop: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {isOwn && (
            <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--border)", display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/account" className="btn btn-ghost btn-sm">Edit Profile</Link>
              <Link href="/dashboard" className="btn btn-ghost btn-sm">Creator Studio</Link>
              <Link href="/write" className="btn btn-primary btn-sm" style={{ fontWeight: 700 }}>+ New Article</Link>
            </div>
          )}
        </motion.div>

        {/* KPI strip */}
        {!loading && articles.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 24 }}
          >
            {[
              { label: "Published", value: articles.length, icon: BookOpen,    color: "var(--brand)", bg: "var(--brand-muted)" },
              { label: "Reads",     value: totalReads,     icon: Users,       color: "#0284c7",    bg: "rgba(2,132,199,0.08)" },
              { label: "Earned",    value: `$${totalEarned.toFixed(2)}`, icon: DollarSign, color: "#059669", bg: "rgba(5,150,105,0.08)" },
              { label: "Avg Price", value: articles.length ? `$${(articles.reduce((s,a)=>s+parseFloat(a.price||"0"),0)/articles.length).toFixed(3)}` : "$0", icon: Zap, color: "#d97706", bg: "rgba(217,119,6,0.08)" },
            ].map(k => (
              <div key={k.label} className="card" style={{ padding: "16px" }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: k.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                  <k.icon size={14} style={{ color: k.color }} />
                </div>
                <div style={{ fontFamily: "Outfit, sans-serif", fontSize: 20, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</div>
                <div style={{ fontSize: 11, color: "var(--text-4)", fontWeight: 600, marginTop: 3 }}>{k.label}</div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Articles */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: 17, fontWeight: 800, color: "var(--text)", marginBottom: 14 }}>
            Published Articles
          </h2>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 14 }} />)}
            </div>
          ) : articles.length === 0 ? (
            <div className="card" style={{ padding: "48px 24px", textAlign: "center" }}>
              <BookOpen size={36} style={{ color: "var(--text-4)", marginBottom: 12 }} />
              <p style={{ color: "var(--text-3)", fontSize: 15, fontWeight: 600 }}>No articles published yet</p>
              {isOwn && (
                <Link href="/write" className="btn btn-primary btn-sm" style={{ marginTop: 16 }}>Write Your First Article</Link>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {articles.map((a, i) => (
                <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}>
                  <Link href={`/article/${a.id}`} style={{ textDecoration: "none", display: "block" }}>
                    <div className="card" style={{ padding: "18px 20px", display: "flex", alignItems: "flex-start", gap: 14 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                          <span className="badge badge-brand" style={{ textTransform: "capitalize", fontSize: 10 }}>{a.category}</span>
                          <span className="price-tag">${a.price} USDC</span>
                        </div>
                        <h3 style={{ fontFamily: "Outfit, sans-serif", fontSize: 15, fontWeight: 700, color: "var(--text)", lineHeight: 1.35, marginBottom: 6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any, overflow: "hidden" }}>
                          {a.title}
                        </h3>
                        <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--text-4)", fontWeight: 500 }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Clock size={10} /> {a.readTime}m</span>
                          <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Users size={10} /> {parseInt(a.reads).toLocaleString()} reads</span>
                          <span style={{ display: "flex", alignItems: "center", gap: 3 }}><DollarSign size={10} style={{ color: "#059669" }} /> ${(parseInt(a.reads) * parseFloat(a.price) * 0.85).toFixed(2)} earned</span>
                        </div>
                      </div>
                      <ExternalLink size={14} style={{ color: "var(--text-4)", flexShrink: 0, marginTop: 2 }} />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
