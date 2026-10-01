import { useState } from "react";
import { Lock } from "lucide-react";
import { getSigner, type StoredWallet } from "@/lib/internal-wallet";
import type { ethers } from "ethers";
import { ErrBox, Sheet, Spinner } from "./Sheet";

/** Banking calls are signed by the wallet (no cookies). If this wallet isn't the signed-in session, unlock it with its password. */
export default function UnlockPrompt({ wallet, onUnlocked, onClose }: { wallet: StoredWallet; onUnlocked: (s: ethers.Wallet) => void; onClose: () => void }) {
  const [pw, setPw] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true); setErr("");
    try { onUnlocked(await getSigner(wallet.encryptedKey, pw)); } catch { setErr("Wrong password"); }
    setBusy(false);
  }
  return (
    <Sheet title="Unlock wallet" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.6 }}>Enter the password for <b>{wallet.name}</b> to use bank features. It stays in memory only while this page is open.</p>
        <input type="password" className="input" value={pw} autoFocus onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && pw && go()} placeholder="Wallet password" />
        <ErrBox msg={err} />
        <button className="btn btn-primary" disabled={!pw || busy} onClick={go} style={{ height: 46, justifyContent: "center", fontWeight: 700 }}>{busy ? <Spinner /> : <><Lock size={14} />Unlock</>}</button>
      </div>
    </Sheet>
  );
}
