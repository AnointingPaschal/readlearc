"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { User, Save, CheckCircle2, Wallet, PenLine, Globe, AtSign, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { useWallet } from "../../lib/web3Context";
import Navbar from "../../components/ui/Navbar";

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

function saveProfile(address: string, data: any) {
  localStorage.setItem(`rl-profile-${address.toLowerCase()}`, JSON.stringify(data));
}

function ConnectGate() {
  const { connect, isConnecting } = useWallet();
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 64px)", padding: 20 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ maxWidth: 420, width: "100%", padding: "48px 32px", textAlign: "center" }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--brand-muted)", border: "2px solid var(--border-brand)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
            <User size={26} style={{ color: "var(--brand)" }} />
          </div>
          <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: 22, fontWeight: 900, color: "var(--text)", marginBottom: 10 }}>Connect to edit your profile</h1>
          <p style={{ color: "var(--text-3)", fontSize: 14, lineHeight: 1.65, marginBottom: 24 }}>Your wallet address is your identity on Readlearc. Connect to set your display name, bio, and links.</p>
          <button onClick={connect} disabled={isConnecting} className="btn btn-primary btn-lg" style={{ width: "100%", justifyContent: "center" }}>
            {isConnecting ? "Connecting…" : <><Wallet size={16} /> Connect Wallet</>}
          </button>
        </motion.div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  const { address, shortAddress, isConnected, usdcBalance } = useWallet();

  const [displayName, setDisplayName] = useState("");
  const [bio,         setBio]         = useState("");
  const [website,     setWebsite]     = useState("");
  const [twitter,     setTwitter]     = useState("");
  const [avatarIdx,   setAvatarIdx]   = useState(0);
  const [saved,       setSaved]       = useState(false);
  const [dirty,       setDirty]       = useState(false);

  // Load saved profile
  useEffect(() => {
    if (!address) return;
    const p = loadProfile(address);
    setDisplayName(p.displayName || "");
    setBio(p.bio || "");
    setWebsite(p.website || "");
    setTwitter(p.twitter || "");
    setAvatarIdx(p.avatarIdx ?? 0);
  }, [address]);

  function handleChange(setter: (v: string) => void) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setter(e.target.value);
      setDirty(true);
    };
  }

  function handleSave() {
    if (!address) return;
    saveProfile(address, { displayName, bio, website, twitter, avatarIdx });
    setSaved(true);
    setDirty(false);
    setTimeout(() => setSaved(false), 3000);
  }

  if (!isConnected) return <ConnectGate />;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "80px 16px 60px" }}>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: "clamp(22px, 4vw, 30px)", fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 4 }}>
            Account Settings
          </h1>
          <p style={{ color: "var(--text-4)", fontSize: 13 }}>
            Your profile is public on Readlearc. Identity anchored to <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{shortAddress}</span>
          </p>
        </motion.div>

        {/* Wallet info strip */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card-flat" style={{ padding: "14px 18px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: AVATAR_GRADIENTS[avatarIdx], flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{displayName || "Unnamed Writer"}</div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "var(--text-4)" }}>{address.slice(0,14)}…{address.slice(-6)}</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 18, fontWeight: 900, fontFamily: "Outfit, sans-serif", color: "var(--accent)" }}>${usdcBalance} <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-4)" }}>USDC</span></div>
            <Link href="/wallet" style={{ fontSize: 11, color: "var(--brand)", fontWeight: 600, textDecoration: "none" }}>Manage wallet →</Link>
          </div>
        </motion.div>

        {/* Avatar picker */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="card" style={{ padding: "22px 20px", marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 14 }}>Avatar</h2>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {AVATAR_GRADIENTS.map((grad, i) => (
              <button key={i} onClick={() => { setAvatarIdx(i); setDirty(true); }} style={{
                width: 48, height: 48, borderRadius: "50%", background: grad,
                border: avatarIdx === i ? "3px solid var(--brand)" : "3px solid transparent",
                cursor: "pointer", outline: avatarIdx === i ? "2px solid var(--brand-muted)" : "none",
                outlineOffset: 2,
                transition: "all 0.15s",
              }} />
            ))}
          </div>
          <p style={{ fontSize: 11, color: "var(--text-4)", marginTop: 10 }}>Profile photo NFTs coming soon — choose a gradient for now.</p>
        </motion.div>

        {/* Display name */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card" style={{ padding: "22px 20px", marginBottom: 16 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 8 }}>
            Display Name
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--bg-alt)", border: "1.5px solid var(--border)", borderRadius: "var(--radius)", padding: "10px 14px" }}>
            <AtSign size={15} style={{ color: "var(--text-4)", flexShrink: 0 }} />
            <input
              type="text"
              placeholder="e.g. Alex Chen"
              value={displayName}
              onChange={handleChange(setDisplayName)}
              maxLength={60}
              style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 15, color: "var(--text)", fontFamily: "Inter, sans-serif" }}
            />
            <span style={{ fontSize: 10, color: "var(--text-4)", fontFamily: "JetBrains Mono, monospace" }}>{displayName.length}/60</span>
          </div>
        </motion.div>

        {/* Bio */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="card" style={{ padding: "22px 20px", marginBottom: 16 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 8 }}>
            Bio
          </label>
          <textarea
            placeholder="Tell readers who you are and what you write about…"
            value={bio}
            onChange={handleChange(setBio)}
            maxLength={300}
            rows={4}
            style={{ width: "100%", background: "var(--bg-alt)", border: "1.5px solid var(--border)", borderRadius: "var(--radius)", padding: "12px 14px", outline: "none", color: "var(--text)", fontSize: 14, lineHeight: 1.65, resize: "vertical", fontFamily: "Inter, sans-serif" }}
          />
          <div style={{ textAlign: "right", fontSize: 10, color: "var(--text-4)", fontFamily: "JetBrains Mono, monospace", marginTop: 4 }}>{bio.length}/300</div>
        </motion.div>

        {/* Links */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="card" style={{ padding: "22px 20px", marginBottom: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 14 }}>Links</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { icon: Globe,   label: "Website",  value: website, setter: setWebsite, placeholder: "https://yoursite.com" },
              { icon: ExternalLink, label: "Twitter",  value: twitter, setter: setTwitter, placeholder: "@yourhandle" },
            ].map(({ icon: Icon, label, value, setter, placeholder }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--bg-alt)", border: "1.5px solid var(--border)", borderRadius: "var(--radius)", padding: "10px 14px" }}>
                <Icon size={15} style={{ color: "var(--text-4)", flexShrink: 0 }} />
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-4)", width: 52, flexShrink: 0 }}>{label}</div>
                <input
                  type="text"
                  placeholder={placeholder}
                  value={value}
                  onChange={handleChange(setter)}
                  style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 14, color: "var(--text)", fontFamily: "Inter, sans-serif" }}
                />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Save button */}
        <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "flex-end", flexWrap: "wrap" }}>
          <Link href={`/profile/${address}`} style={{ fontSize: 14, color: "var(--brand)", fontWeight: 600, textDecoration: "none" }}>
            View public profile →
          </Link>
          <button onClick={handleSave} disabled={!dirty && !saved} className="btn btn-primary" style={{ fontWeight: 700, minWidth: 140 }}>
            {saved
              ? <><CheckCircle2 size={15} /> Saved!</>
              : <><Save size={14} /> Save Changes</>
            }
          </button>
        </div>

        {/* Profile data note */}
        <div style={{ marginTop: 32, padding: "14px 16px", background: "var(--bg-alt)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 12, color: "var(--text-4)", lineHeight: 1.65 }}>
          <strong style={{ color: "var(--text-3)" }}>Privacy note:</strong> Display name, bio, and links are stored in your browser (localStorage), linked to your wallet address. Your on-chain identity — articles published, reads, earnings — is permanent and public on Arc blockchain. On-chain profile contracts coming in v2.
        </div>
      </div>
    </div>
  );
}
