import { cfg } from "@/lib/config";
import { useState, useEffect, useCallback } from "react";
import { Link } from "@/lib/nav";
import { Send, Download, RefreshCw, Settings, ChevronDown, Plus, Copy, Check, X, ExternalLink, ArrowUpRight, ArrowDownLeft, Repeat, Clock, Wallet, Zap, Landmark, Banknote, Search, FileDown, BookUser, Trash2 } from "lucide-react";
import QRCode from "qrcode";
import { loadWallets, getActiveIndex, setActiveIndex, getUsdcBalance, sendUsdc, StoredWallet, USDC_ADDR, ARC_CHAIN_ID } from "@/lib/internal-wallet";
import { useAuth } from "@/lib/auth";
import { ethers } from "ethers";
import { loadBankConfig, fmtNgn, fmtUsd, ago, loadContacts, saveContacts, type BankConfig, type Contact } from "@/lib/bank";
import { useBank } from "@/components/wallet/useBank";
import BankTab from "@/components/wallet/BankTab";
import CashOutModal from "@/components/wallet/CashOutModal";
import AddMoneyModal from "@/components/wallet/AddMoneyModal";
import UnlockPrompt from "@/components/wallet/UnlockPrompt";
import { Sheet } from "@/components/wallet/Sheet";

type Tab   = "assets"|"history"|"bank"|"swap";
type Modal = null|"send"|"receive"|"wallets"|"cashout"|"addmoney"|"unlock"|"contacts";
type Filter = "all"|"sent"|"received"|"bank";

const EXPLORER = cfg.explorerUrl;

export default function WalletApp() {
  const { isAuth, requireAuth, signer: authSigner } = useAuth();
  const [wallets,   setWallets]  = useState<StoredWallet[]>([]);
  const [activeIdx, setIdx]      = useState(0);
  const [balance,   setBalance]  = useState("0.0000");
  const [tab,       setTab]      = useState<Tab>("assets");
  const [modal,     setModal]    = useState<Modal>(null);
  const [busy,      setBusy]     = useState(false);
  const [qr,        setQr]       = useState("");
  const [copied,    setCopied]   = useState(false);
  const [hidebal,   setHideBal]  = useState(false);
  const [history,   setHistory]  = useState<any[]>([]);
  const [loadHist,  setLoadHist] = useState(false);
  // Send form
  const [sendTo,    setSendTo]   = useState("");
  const [sendAmt,   setSendAmt]  = useState("");
  const [sendPw,    setSendPw]   = useState("");
  const [sending,   setSending]  = useState(false);
  const [sendHash,  setSendHash] = useState("");
  const [sendErr,   setSendErr]  = useState("");
  // Swap
  const [swapFrom,  setSwapFrom] = useState("USDC");
  const [swapTo,    setSwapTo]   = useState("ARC");
  const [swapAmt,   setSwapAmt]  = useState("");

  const active = wallets[activeIdx] || null;

  // ── banking ──
  const [bcfg, setBcfg] = useState<BankConfig | null>(null);
  const [unlocked, setUnlocked] = useState<ethers.Wallet | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [contactName, setContactName] = useState("");
  useEffect(() => { loadBankConfig().then(setBcfg); setContacts(loadContacts()); }, []);
  // API calls are signed by the wallet. Use the signed-in session wallet when it is the one on screen, otherwise one unlocked by password.
  const signer: ethers.Wallet | null = active
    ? (authSigner && authSigner.address.toLowerCase() === active.address.toLowerCase() ? authSigner : unlocked && unlocked.address.toLowerCase() === active.address.toLowerCase() ? unlocked : null)
    : null;
  const bank = useBank(signer, bcfg);
  const bankOn = !!bcfg && (bcfg.ngnConfigured || bcfg.circle);

  const loadBal = useCallback(async (addr: string) => {
    const b = await getUsdcBalance(addr);
    setBalance(b);
  }, []);

  useEffect(() => {
    const ws  = loadWallets();
    const idx = getActiveIndex();
    setWallets(ws);
    const i = Math.min(idx, Math.max(0, ws.length - 1));
    setIdx(i);
    if (ws[i]) loadBal(ws[i].address);
  }, [loadBal]);

  useEffect(() => {
    if (!active) return;
    QRCode.toDataURL(active.address, { width:200, margin:2 }).then(setQr).catch(()=>{});
  }, [active?.address]);

  async function loadHistory() {
    if (!active) return;
    setLoadHist(true);
    try {
      const res = await fetch(`${EXPLORER}/api/v2/addresses/${active.address}/token-transfers?token=${USDC_ADDR}&limit=20`);
      if (res.ok) {
        const d = await res.json();
        setHistory(d.items || []);
      }
    } catch { setHistory([]); }
    setLoadHist(false);
  }

  useEffect(() => {
    if (tab === "history") loadHistory();
  }, [tab, active?.address]);

  // Activity = on-chain USDC transfers + Naira cash-outs + bank deposits/withdrawals, newest first.
  type Row = { key:string; kind:"sent"|"received"|"bank"; title:string; sub:string; amount:string; neg:boolean; ts:number; href?:string; status?:string };
  const rows: Row[] = [
    ...history.map((tx:any):Row => {
      const out = tx.from?.hash?.toLowerCase() === active?.address?.toLowerCase();
      const other = out ? tx.to?.hash : tx.from?.hash;
      const amt = tx.total?.value ? (parseInt(tx.total.value)/1e6).toFixed(4) : "?";
      const name = contacts.find(c=>c.address.toLowerCase()===String(other).toLowerCase())?.name;
      return { key:"c"+tx.transaction_hash+tx.log_index, kind:out?"sent":"received", title:out?"Sent":"Received", sub:(out?"To ":"From ")+(name||(other?other.slice(0,8)+"…"+other.slice(-4):"Unknown")), amount:`${out?"-":"+"}${amt} USDC`, neg:out, ts:Date.parse(tx.timestamp)||0, href:`${EXPLORER}/tx/${tx.transaction_hash}` };
    }),
    ...bank.cashouts.map((c):Row => ({ key:"n"+c.id, kind:"bank", title:"Cash out to "+c.bankName, sub:fmtNgn(c.ngn)+" · ••"+c.last4, amount:"-"+c.amountUsd.toFixed(2)+" USDC", neg:true, ts:c.createdAt, status:c.status, href:`${EXPLORER}/tx/${c.txHash}` })),
    ...bank.deposits.map((d):Row => ({ key:"d"+d.id, kind:"bank", title:"Bank deposit", sub:(d.source?.type||"wire").toUpperCase(), amount:d.amount?`+${d.amount.amount} ${d.amount.currency}`:"Pending", neg:false, ts:Date.parse(d.createDate)||0, status:d.status })),
    ...bank.withdrawals.map((w):Row => ({ key:"w"+w.id, kind:"bank", title:"Bank withdrawal", sub:w.destination?.name||"Bank", amount:`-${w.amount.amount} ${w.amount.currency}`, neg:true, ts:Date.parse(w.createDate)||0, status:w.status })),
  ].sort((a,b)=>b.ts-a.ts);
  const shown = rows.filter(r=>filter==="all"||r.kind===filter).filter(r=>!q||(r.title+r.sub+r.amount).toLowerCase().includes(q.toLowerCase()));

  function exportCsv() {
    const esc=(v:string)=>`"${v.replace(/"/g,'""')}"`;
    const csv=["Date,Type,Details,Amount,Status",...shown.map(r=>[new Date(r.ts).toISOString(),r.title,r.sub,r.amount,r.status||"confirmed"].map(esc).join(","))].join("\n");
    const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"})); a.download=`readlearc-activity-${Date.now()}.csv`; a.click();
  }
  function addContact() {
    if (!ethers.isAddress(sendTo) || !contactName.trim()) return;
    const next=[{name:contactName.trim(),address:ethers.getAddress(sendTo)},...contacts.filter(c=>c.address.toLowerCase()!==sendTo.toLowerCase())];
    setContacts(next); saveContacts(next); setContactName("");
  }
  function removeContact(a:string){ const next=contacts.filter(c=>c.address!==a); setContacts(next); saveContacts(next); }
  const usdVal = parseFloat(balance)||0;
  const sendWarn = sendTo && !ethers.isAddress(sendTo) ? "That isn't a valid address" : sendAmt && parseFloat(sendAmt)>usdVal ? "Amount is more than your balance" : sendTo.toLowerCase()===active?.address.toLowerCase() ? "That's your own address" : "";

  async function doSend() {
    if (!active || !sendTo || !sendAmt || !sendPw) return;
    setSending(true); setSendErr(""); setSendHash("");
    try {
      if (!ethers.isAddress(sendTo)) throw new Error("Invalid address");
      const { hash } = await sendUsdc(active.encryptedKey, sendPw, sendTo, sendAmt);
      setSendHash(hash);
      setSendTo(""); setSendAmt(""); setSendPw("");
      loadBal(active.address);
    } catch(e:any) {
      const msg = e.message||"";
      setSendErr(msg.includes("decrypt")||msg.includes("password")?"Wrong password":msg.slice(0,120));
    }
    setSending(false);
  }

  function switchWallet(i: number) {
    setIdx(i); setActiveIndex(i); setModal(null);
    if (wallets[i]) loadBal(wallets[i].address);
  }

  function copy() {
    if (!active) return;
    navigator.clipboard.writeText(active.address);
    setCopied(true); setTimeout(()=>setCopied(false), 2000);
  }

  if (!wallets.length) return (
    <div style={{ minHeight:"100vh",background:"var(--bg)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24 }}>
      <div style={{ textAlign:"center",maxWidth:360 }}>
        <div style={{ width:80,height:80,borderRadius:28,background:"linear-gradient(135deg,var(--brand),var(--accent))",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px" }}>
          <Wallet size={36} color="white"/>
        </div>
        <h1 style={{ fontFamily:"Outfit,sans-serif",fontSize:28,fontWeight:900,color:"var(--text)",marginBottom:8,letterSpacing:"-.02em" }}>Readlearc Wallet</h1>
        <p style={{ fontSize:14,color:"var(--text-4)",lineHeight:1.7,marginBottom:32 }}>Your self-custodial USDC wallet for Arc Testnet. Create a wallet or sign in first.</p>
        <button onClick={() => requireAuth()} className="btn btn-primary" style={{ height:52,justifyContent:"center",fontWeight:700,fontSize:15,width:"100%",marginBottom:10 }}>
          <Plus size={16}/>Create or Import Wallet
        </button>
        <Link href="/" className="btn btn-ghost" style={{ justifyContent:"center",width:"100%" }}>← Back to Readlearc</Link>
      </div>
    </div>
  );

  const short = active ? active.address.slice(0,6)+"…"+active.address.slice(-4) : "";

  return (
    <div style={{ minHeight:"100vh",background:"var(--bg)",maxWidth:480,margin:"0 auto",display:"flex",flexDirection:"column" }}>
      {/* Header gradient */}
      <div style={{ background:"linear-gradient(160deg,var(--brand),var(--brand-d))",padding:"52px 20px 28px",position:"relative" }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:22 }}>
          {/* Wallet switcher */}
          <button onClick={()=>setModal("wallets")} style={{ display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.25)",borderRadius:"var(--r-f)",padding:"6px 12px 6px 8px",cursor:"pointer" }}>
            <div style={{ width:24,height:24,borderRadius:"50%",background:"rgba(255,255,255,.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,color:"white" }}>{(active?.name||"W")[0]}</div>
            <span style={{ fontSize:13,fontWeight:700,color:"white",maxWidth:110,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{active?.name}</span>
            <ChevronDown size={13} style={{ color:"rgba(255,255,255,.7)" }}/>
          </button>
          <div style={{ display:"flex",gap:8 }}>
            <button onClick={()=>loadBal(active!.address)} style={{ width:34,height:34,borderRadius:"50%",background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.2)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"white" }}>
              <RefreshCw size={14} className={busy?"spin":""}/>
            </button>
            <Link href="/wallet-app/settings" style={{ width:34,height:34,borderRadius:"50%",background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center",color:"white",textDecoration:"none" }}>
              <Settings size={14}/>
            </Link>
          </div>
        </div>

        {/* Address chip */}
        <button onClick={copy} style={{ display:"flex",alignItems:"center",gap:6,background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.2)",borderRadius:"var(--r-f)",padding:"5px 12px",cursor:"pointer",marginBottom:18 }}>
          <span style={{ fontFamily:"JetBrains Mono,monospace",fontSize:12,color:"rgba(255,255,255,.85)" }}>{short}</span>
          {copied?<Check size={11} style={{ color:"#86efac" }}/>:<Copy size={11} style={{ color:"rgba(255,255,255,.55)" }}/>}
        </button>

        {/* Balance */}
        <button onClick={()=>setHideBal(v=>!v)} style={{ background:"none",border:"none",cursor:"pointer",textAlign:"left",padding:0,marginBottom:24 }}>
          <div style={{ fontSize:12,color:"rgba(255,255,255,.65)",marginBottom:3 }}>USDC Balance</div>
          <div style={{ fontFamily:"Outfit,sans-serif",fontSize:"clamp(36px,8vw,52px)",fontWeight:900,color:"white",letterSpacing:"-.03em",lineHeight:1 }}>
            {hidebal?"••••••":("$"+balance)}
          </div>
          <div style={{ fontSize:12,color:"rgba(255,255,255,.8)",marginTop:6,fontWeight:600 }}>{hidebal?"••••":(bcfg&&bcfg.rate>0?`≈ ${fmtNgn(usdVal*bcfg.rate)}`:"")}</div>
          <div style={{ fontSize:11,color:"rgba(255,255,255,.55)",marginTop:2 }}>{cfg.chainName}</div>
        </button>

        {/* Actions */}
        <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8 }}>
          {[
            { icon:Send,     label:"Send",     action:()=>setModal("send")    },
            { icon:Download, label:"Receive",  action:()=>setModal("receive") },
            { icon:Banknote, label:"Cash out", action:()=>{ if (bcfg?.ngn) { if (!signer) setModal("unlock"); else setModal("cashout"); } else setTab("bank"); } },
            { icon:Plus,     label:"Add money",action:()=>{ if (bcfg?.circle && !signer) setModal("unlock"); else setModal("addmoney"); } },
          ].map(btn=>(
            <button key={btn.label} onClick={btn.action} style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:7,padding:"12px 4px",background:"rgba(255,255,255,.15)",border:"1.5px solid rgba(255,255,255,.25)",borderRadius:"var(--r-lg)",cursor:"pointer",transition:"background .15s" }}
              onMouseEnter={e=>(e.currentTarget as any).style.background="rgba(255,255,255,.22)"}
              onMouseLeave={e=>(e.currentTarget as any).style.background="rgba(255,255,255,.15)"}>
              <div style={{ width:34,height:34,borderRadius:"50%",background:"rgba(255,255,255,.18)",display:"flex",alignItems:"center",justifyContent:"center" }}>
                <btn.icon size={16} color="white"/>
              </div>
              <span style={{ fontSize:11,fontWeight:700,color:"white",whiteSpace:"nowrap" }}>{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",borderBottom:"1px solid var(--border)",background:"var(--bg-card)" }}>
        {(["assets","history","bank","swap"] as Tab[]).map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{ padding:"12px 8px",border:"none",background:"transparent",cursor:"pointer",fontFamily:"Outfit,sans-serif",fontSize:13,fontWeight:700,color:tab===t?"var(--brand)":"var(--text-4)",borderBottom:`2px solid ${tab===t?"var(--brand)":"transparent"}`,transition:"all .15s",textTransform:"capitalize" }}>
            {t==="assets"?"Assets":t==="history"?"Activity":t==="bank"?"Bank":"Swap"}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex:1,padding:"16px" }}>

        {/* ASSETS */}
        {tab==="assets" && (
          <div>
            <div className="card" style={{ padding:"14px 16px",display:"flex",alignItems:"center",gap:14,marginBottom:12 }}>
              <div style={{ width:44,height:44,borderRadius:"50%",background:"#2775ca",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:18,fontWeight:900,color:"white" }}>$</div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"Outfit,sans-serif",fontSize:14,fontWeight:700,color:"var(--text)" }}>USD Coin</div>
                <div style={{ fontSize:11,color:"var(--text-4)",marginTop:1 }}>USDC · {cfg.chainName}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontFamily:"Outfit,sans-serif",fontSize:17,fontWeight:800,color:"var(--text)" }}>${hidebal?"••••":balance}</div>
                <div style={{ fontSize:11,color:"var(--text-4)",marginTop:1 }}>{bcfg&&bcfg.rate>0?`≈ ${fmtNgn(usdVal*bcfg.rate)}`:`≈ $${balance} USD`}</div>
              </div>
            </div>
            <div style={{ padding:"10px 12px",background:"var(--bg-alt)",border:"1px solid var(--border)",borderRadius:"var(--r-md)",fontSize:11,color:"var(--text-4)",marginBottom:14 }}>
              Get test USDC: <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer" style={{ color:"var(--brand)",fontWeight:600 }}>faucet.circle.com</a> → select Arc Testnet
            </div>
            {bankOn && (
              <button onClick={()=>setTab("bank")} className="card card-hover" style={{ width:"100%",padding:"14px 16px",display:"flex",alignItems:"center",gap:12,marginBottom:12,cursor:"pointer",textAlign:"left" }}>
                <div style={{ width:40,height:40,borderRadius:12,background:"linear-gradient(135deg,#059669,#2775ca)",display:"flex",alignItems:"center",justifyContent:"center" }}><Landmark size={18} color="white"/></div>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"Outfit,sans-serif",fontSize:14,fontWeight:700,color:"var(--text)" }}>Bank & Naira</div>
                  <div style={{ fontSize:11,color:"var(--text-4)" }}>{bcfg?.ngn?`Cash out to any Nigerian bank · $1 = ${fmtNgn(bcfg.rate)}`:"Link a bank, add money by wire, track payouts"}</div>
                </div>
                <ArrowUpRight size={14} style={{ color:"var(--text-4)" }}/>
              </button>
            )}
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
              <Link href="/" className="btn btn-ghost btn-sm" style={{ justifyContent:"center" }}>Readlearc Home</Link>
              <Link href="/explore" className="btn btn-primary btn-sm" style={{ justifyContent:"center" }}>Browse Articles</Link>
            </div>
          </div>
        )}

        {/* ACTIVITY */}
        {tab==="history" && (
          <div>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10 }}>
              <h3 style={{ fontFamily:"Outfit,sans-serif",fontSize:14,fontWeight:700,color:"var(--text)" }}>Activity</h3>
              <div style={{ display:"flex",gap:12 }}>
                <button onClick={exportCsv} disabled={!shown.length} style={{ display:"flex",alignItems:"center",gap:4,fontSize:11,color:"var(--brand)",background:"none",border:"none",cursor:"pointer",fontWeight:600,opacity:shown.length?1:.4 }}><FileDown size={11}/>CSV</button>
                <button onClick={()=>{loadHistory();bank.refresh();}} style={{ display:"flex",alignItems:"center",gap:4,fontSize:11,color:"var(--brand)",background:"none",border:"none",cursor:"pointer",fontWeight:600 }}>
                  <RefreshCw size={11} className={loadHist?"spin":""}/>Refresh
                </button>
              </div>
            </div>
            <div style={{ position:"relative",marginBottom:10 }}>
              <Search size={13} style={{ position:"absolute",left:12,top:12,color:"var(--text-4)" }}/>
              <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search activity" className="input" style={{ paddingLeft:34,height:38 }}/>
            </div>
            <div style={{ display:"flex",gap:6,marginBottom:12,overflowX:"auto" }}>
              {(["all","sent","received","bank"] as Filter[]).map(f=>(
                <button key={f} onClick={()=>setFilter(f)} style={{ padding:"5px 13px",borderRadius:99,border:"1px solid var(--border)",background:filter===f?"var(--brand)":"var(--bg-card)",color:filter===f?"white":"var(--text-3)",fontSize:11,fontWeight:700,cursor:"pointer",textTransform:"capitalize",whiteSpace:"nowrap" }}>{f}</button>
              ))}
            </div>
            {loadHist && !rows.length ? (
              [1,2,3].map(i=><div key={i} className="skeleton" style={{ height:64,borderRadius:"var(--r)",marginBottom:8 }}/>)
            ) : !shown.length ? (
              <div style={{ textAlign:"center",padding:"40px 16px" }}>
                <Clock size={32} style={{ color:"var(--text-4)",marginBottom:10 }}/>
                <p style={{ fontSize:13,color:"var(--text-3)",fontWeight:600,marginBottom:4 }}>{rows.length?"Nothing matches":"No activity yet"}</p>
                <p style={{ fontSize:11,color:"var(--text-4)" }}>Transfers, cash-outs and bank deposits will appear here.</p>
              </div>
            ) : (
              shown.map(r=>{
                const body=(
                  <>
                    <div style={{ width:36,height:36,borderRadius:"50%",background:r.kind==="bank"?"rgba(39,117,202,.12)":r.neg?"rgba(220,38,38,.1)":"rgba(5,150,105,.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                      {r.kind==="bank"?<Landmark size={15} style={{ color:"#2775ca" }}/>:r.neg?<ArrowUpRight size={16} style={{ color:"#dc2626" }}/>:<ArrowDownLeft size={16} style={{ color:"var(--accent)" }}/>}
                    </div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontFamily:"Outfit,sans-serif",fontSize:13,fontWeight:700,color:"var(--text)" }}>{r.title}</div>
                      <div style={{ fontSize:10,color:"var(--text-4)",marginTop:1,fontFamily:r.kind==="bank"?undefined:"JetBrains Mono,monospace" }}>{r.sub}{r.ts?` · ${ago(r.ts)}`:""}</div>
                    </div>
                    <div style={{ textAlign:"right",flexShrink:0 }}>
                      <div style={{ fontFamily:"Outfit,sans-serif",fontSize:13,fontWeight:800,color:r.neg?"#dc2626":"var(--accent)" }}>{r.amount}</div>
                      {r.status && <div style={{ fontSize:9,fontWeight:800,color:r.status==="success"||r.status==="complete"?"#059669":r.status==="failed"||r.status==="reversed"?"#dc2626":"#d97706",textTransform:"uppercase",marginTop:2 }}>{r.status}</div>}
                    </div>
                  </>
                );
                const st:React.CSSProperties={ display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:"var(--r-lg)",marginBottom:8,textDecoration:"none" };
                return r.href ? <a key={r.key} href={r.href} target="_blank" rel="noopener noreferrer" style={st}>{body}</a> : <div key={r.key} style={st}>{body}</div>;
              })
            )}
          </div>
        )}

        {/* BANK */}
        {tab==="bank" && bcfg && (
          <BankTab signer={signer} cfg={bcfg} bank={bank} onUnlock={()=>setModal("unlock")} onCashOut={()=>setModal("cashout")} onAddMoney={()=>setModal("addmoney")}/>
        )}

        {/* SWAP */}
        {tab==="swap" && (
          <div>
            <h3 style={{ fontFamily:"Outfit,sans-serif",fontSize:14,fontWeight:700,color:"var(--text)",marginBottom:14 }}>Swap Tokens</h3>
            <div className="card" style={{ padding:"16px",display:"flex",flexDirection:"column",gap:10,marginBottom:10 }}>
              <div>
                <label style={{ fontSize:10,fontWeight:700,color:"var(--text-4)",textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:6,fontFamily:"Outfit,sans-serif" }}>From</label>
                <div style={{ display:"flex",gap:8 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:4,background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",padding:"10px 12px",flex:1 }}>
                    <span style={{ fontWeight:700,color:"var(--text-4)" }}>$</span>
                    <input type="number" value={swapAmt} onChange={e=>setSwapAmt(e.target.value)} placeholder="0.00" style={{ flex:1,border:"none",outline:"none",background:"transparent",fontSize:18,fontWeight:700,color:"var(--text)",fontFamily:"Outfit,sans-serif" }}/>
                  </div>
                  <div style={{ display:"flex",alignItems:"center",gap:6,padding:"10px 14px",background:"#2775ca",borderRadius:"var(--r)",color:"white",fontWeight:700,fontSize:13,flexShrink:0 }}>
                    <span style={{ fontSize:16 }}>$</span>USDC
                  </div>
                </div>
                <div style={{ fontSize:11,color:"var(--text-4)",marginTop:4 }}>Balance: ${balance} USDC</div>
              </div>

              <div style={{ display:"flex",justifyContent:"center" }}>
                <button onClick={()=>{}} style={{ width:32,height:32,borderRadius:"50%",border:"1.5px solid var(--border)",background:"var(--bg-card)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--brand)" }}>
                  <Repeat size={14}/>
                </button>
              </div>

              <div>
                <label style={{ fontSize:10,fontWeight:700,color:"var(--text-4)",textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:6,fontFamily:"Outfit,sans-serif" }}>To (estimated)</label>
                <div style={{ display:"flex",gap:8 }}>
                  <div style={{ display:"flex",alignItems:"center",background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",padding:"10px 12px",flex:1 }}>
                    <span style={{ fontSize:16,fontWeight:700,color:"var(--text-4)",fontFamily:"Outfit,sans-serif" }}>≈ {swapAmt?(parseFloat(swapAmt)*0.998).toFixed(4):"0.0000"}</span>
                  </div>
                  <div style={{ display:"flex",alignItems:"center",gap:6,padding:"10px 14px",background:"var(--brand)",borderRadius:"var(--r)",color:"white",fontWeight:700,fontSize:13,flexShrink:0 }}>
                    <Zap size={14}/>ARC
                  </div>
                </div>
              </div>

              <div style={{ padding:"10px 12px",background:"var(--bg-alt)",borderRadius:"var(--r)",display:"flex",flexDirection:"column",gap:4 }}>
                {[["Rate","1 USDC ≈ 1.000 ARC"],["Fee","0.2%"],["Network",cfg.chainName]].map(([k,v])=>(
                  <div key={k} style={{ display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--text-4)" }}>
                    <span>{k}</span><span style={{ fontWeight:600,color:"var(--text-3)" }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding:"10px 14px",background:"rgba(217,119,6,.06)",border:"1px solid rgba(217,119,6,.2)",borderRadius:"var(--r-md)",fontSize:11,color:"#d97706",lineHeight:1.6,marginBottom:12 }}>
              ⚠️ Swap is coming soon on Arc Testnet. DEX liquidity pools are being deployed. Check back shortly.
            </div>

            <button disabled className="btn btn-primary" style={{ width:"100%",justifyContent:"center",height:48,fontWeight:700,opacity:.5 }}>
              <Repeat size={15}/>Swap (Coming Soon)
            </button>
          </div>
        )}
      </div>

      {/* ── Modals ── */}

      {/* Send */}
      {modal==="send" && (
        <div style={{ position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center" }} onClick={e=>{if(e.target===e.currentTarget){setModal(null);setSendErr("");setSendHash("");}}}>
          <div style={{ position:"absolute",inset:0,background:"rgba(0,0,0,.5)",backdropFilter:"blur(4px)" }}/>
          <div style={{ position:"relative",width:"100%",maxWidth:480,background:"var(--bg-card)",borderRadius:"var(--r-xl) var(--r-xl) 0 0",padding:"24px 20px 40px" }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20 }}>
              <h3 style={{ fontFamily:"Outfit,sans-serif",fontSize:18,fontWeight:900,color:"var(--text)" }}>Send USDC</h3>
              <button onClick={()=>{setModal(null);setSendHash("");setSendErr("");}} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--text-4)" }}><X size={18}/></button>
            </div>
            {sendHash ? (
              <div style={{ textAlign:"center",padding:"20px 0" }}>
                <div style={{ fontSize:48,marginBottom:12 }}>✓</div>
                <p style={{ fontFamily:"Outfit,sans-serif",fontSize:18,fontWeight:800,color:"var(--accent)",marginBottom:10 }}>Sent!</p>
                <a href={`${EXPLORER}/tx/${sendHash}`} target="_blank" rel="noopener noreferrer" style={{ fontFamily:"JetBrains Mono,monospace",fontSize:10,color:"var(--brand)",textDecoration:"none",display:"inline-flex",alignItems:"center",gap:3 }}>
                  View on Explorer <ExternalLink size={10}/>
                </a>
                <br/><button onClick={()=>{setSendHash("");setModal(null);}} className="btn btn-primary" style={{ marginTop:16,justifyContent:"center" }}>Done</button>
              </div>
            ) : (
              <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
                <div>
                  <label style={{ fontSize:10,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:5,fontFamily:"Outfit,sans-serif" }}>Recipient Address</label>
                  <div style={{ display:"flex",gap:8 }}>
                    <input value={sendTo} onChange={e=>setSendTo(e.target.value.trim())} className="input" placeholder="0x…" style={{ fontFamily:"JetBrains Mono,monospace",fontSize:13,flex:1 }}/>
                    <button onClick={()=>setModal("contacts")} title="Address book" style={{ width:44,borderRadius:"var(--r)",border:"1.5px solid var(--border)",background:"var(--bg-alt)",cursor:"pointer",color:"var(--brand)",display:"flex",alignItems:"center",justifyContent:"center" }}><BookUser size={16}/></button>
                  </div>
                  {contacts.length>0 && <div style={{ display:"flex",gap:6,marginTop:8,overflowX:"auto" }}>{contacts.slice(0,6).map(c=><button key={c.address} onClick={()=>setSendTo(c.address)} style={{ padding:"4px 11px",borderRadius:99,border:"1px solid var(--border)",background:sendTo.toLowerCase()===c.address.toLowerCase()?"var(--brand)":"var(--bg-card)",color:sendTo.toLowerCase()===c.address.toLowerCase()?"white":"var(--text-3)",fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap" }}>{c.name}</button>)}</div>}
                  {ethers.isAddress(sendTo) && !contacts.some(c=>c.address.toLowerCase()===sendTo.toLowerCase()) && (
                    <div style={{ display:"flex",gap:6,marginTop:8 }}>
                      <input value={contactName} onChange={e=>setContactName(e.target.value)} placeholder="Save to address book as…" className="input" style={{ height:34,fontSize:12 }}/>
                      <button onClick={addContact} disabled={!contactName.trim()} className="btn btn-secondary btn-sm">Save</button>
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ fontSize:10,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:5,fontFamily:"Outfit,sans-serif" }}>Amount</label>
                  <div style={{ display:"flex",gap:8 }}>
                    <div style={{ flex:1,display:"flex",alignItems:"center",gap:4,background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",padding:"10px 12px" }}>
                      <span style={{ fontWeight:700,color:"var(--text-4)" }}>$</span>
                      <input type="number" value={sendAmt} onChange={e=>setSendAmt(e.target.value)} step="0.01" style={{ flex:1,border:"none",outline:"none",background:"transparent",fontSize:18,fontWeight:700,color:"var(--text)",fontFamily:"Outfit,sans-serif" }} placeholder="0.00"/>
                      <span style={{ fontSize:11,fontWeight:600,color:"var(--text-4)" }}>USDC</span>
                    </div>
                    <button onClick={()=>setSendAmt(balance)} style={{ padding:"10px 12px",background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",fontSize:11,fontWeight:700,color:"var(--brand)",cursor:"pointer" }}>MAX</button>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize:10,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:5,fontFamily:"Outfit,sans-serif" }}>Wallet Password</label>
                  <input type="password" value={sendPw} onChange={e=>setSendPw(e.target.value)} className="input" placeholder="Enter password to sign transaction"/>
                </div>
                {(sendErr||sendWarn) && <div style={{ padding:"8px 12px",background:"rgba(220,38,38,.06)",border:"1px solid rgba(220,38,38,.18)",borderRadius:"var(--r)",fontSize:12,color:"#dc2626" }}>{sendErr||sendWarn}</div>}
                <button onClick={doSend} disabled={!sendTo||!sendAmt||!sendPw||sending||!!sendWarn} className="btn btn-primary" style={{ height:50,justifyContent:"center",fontWeight:700,fontSize:15 }}>
                  {sending?<><div style={{ width:15,height:15,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"white",borderRadius:"50%"}} className="spin"/>Signing…</>:<><Send size={15}/>Send USDC</>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Receive */}
      {modal==="receive" && (
        <div style={{ position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center" }} onClick={e=>{if(e.target===e.currentTarget)setModal(null);}}>
          <div style={{ position:"absolute",inset:0,background:"rgba(0,0,0,.5)",backdropFilter:"blur(4px)" }}/>
          <div style={{ position:"relative",width:"100%",maxWidth:480,background:"var(--bg-card)",borderRadius:"var(--r-xl) var(--r-xl) 0 0",padding:"24px 20px 40px",textAlign:"center" }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20 }}>
              <h3 style={{ fontFamily:"Outfit,sans-serif",fontSize:18,fontWeight:900,color:"var(--text)" }}>Receive USDC</h3>
              <button onClick={()=>setModal(null)} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--text-4)" }}><X size={18}/></button>
            </div>
            {qr && <img src={qr} alt="QR" style={{ width:180,height:180,border:"8px solid white",borderRadius:"var(--r-lg)",margin:"0 auto 16px",display:"block",boxShadow:"var(--shadow)" }}/>}
            <p style={{ fontSize:11,color:"var(--text-4)",marginBottom:8 }}>Scan or copy address below</p>
            <div style={{ display:"flex",alignItems:"center",gap:8,background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",padding:"10px 14px",marginBottom:10 }}>
              <span style={{ flex:1,fontFamily:"JetBrains Mono,monospace",fontSize:10,color:"var(--text)",wordBreak:"break-all",textAlign:"left" }}>{active?.address}</span>
              <button onClick={copy} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--brand)",display:"flex",flexShrink:0 }}>
                {copied?<Check size={15} style={{ color:"var(--accent)" }}/>:<Copy size={15}/>}
              </button>
            </div>
            <p style={{ fontSize:10,color:"var(--text-4)",lineHeight:1.65 }}>Only send USDC on Arc Testnet to this address.</p>
          </div>
        </div>
      )}

      {/* Wallet switcher */}
      {modal==="wallets" && (
        <div style={{ position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center" }} onClick={e=>{if(e.target===e.currentTarget)setModal(null);}}>
          <div style={{ position:"absolute",inset:0,background:"rgba(0,0,0,.5)",backdropFilter:"blur(4px)" }}/>
          <div style={{ position:"relative",width:"100%",maxWidth:480,background:"var(--bg-card)",borderRadius:"var(--r-xl) var(--r-xl) 0 0",padding:"20px 20px 36px" }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16 }}>
              <h3 style={{ fontFamily:"Outfit,sans-serif",fontSize:18,fontWeight:900,color:"var(--text)" }}>My Wallets</h3>
              <button onClick={()=>setModal(null)} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--text-4)" }}><X size={18}/></button>
            </div>
            {wallets.map((w,i)=>(
              <button key={i} onClick={()=>switchWallet(i)} style={{ width:"100%",display:"flex",alignItems:"center",gap:12,padding:"12px",borderRadius:"var(--r-lg)",border:`1.5px solid ${i===activeIdx?"var(--brand)":"var(--border)"}`,background:i===activeIdx?"var(--brand-muted)":"transparent",cursor:"pointer",marginBottom:8,textAlign:"left",transition:"all .15s" }}>
                <div style={{ width:40,height:40,borderRadius:"50%",background:`linear-gradient(135deg,hsl(${parseInt(w.address.slice(2,4)||"0",16)*1.4}deg,65%,55%),hsl(${parseInt(w.address.slice(4,6)||"0",16)*1.4}deg,55%,45%))`,flexShrink:0 }}/>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontFamily:"Outfit,sans-serif",fontSize:14,fontWeight:700,color:i===activeIdx?"var(--brand)":"var(--text)" }}>{w.name}</div>
                  <div style={{ fontFamily:"JetBrains Mono,monospace",fontSize:10,color:"var(--text-4)",marginTop:1 }}>{w.address.slice(0,10)}…{w.address.slice(-6)}</div>
                </div>
                {i===activeIdx && <div style={{ width:8,height:8,borderRadius:"50%",background:"var(--brand)",flexShrink:0 }}/>}
              </button>
            ))}
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8 }}>
              <Link href="/wallet-app/create" onClick={()=>setModal(null)} className="btn btn-secondary btn-sm" style={{ justifyContent:"center" }}><Plus size={13}/>New Wallet</Link>
              <Link href="/wallet-app/import" onClick={()=>setModal(null)} className="btn btn-ghost btn-sm" style={{ justifyContent:"center" }}>Import</Link>
            </div>
          </div>
        </div>
      )}
      {/* Cash out */}
      {modal==="cashout" && active && bcfg && (
        <CashOutModal wallet={active} balance={balance} cfg={bcfg} accounts={bank.ng}
          onClose={()=>setModal(null)} onDone={()=>{ loadBal(active.address); bank.refresh(); loadHistory(); }}
          onAddAccount={()=>{ setModal(null); setTab("bank"); }}/>
      )}

      {/* Add money */}
      {modal==="addmoney" && bcfg && (
        <AddMoneyModal signer={signer} wires={bank.wires} circleOn={bcfg.circle} onClose={()=>setModal(null)} onLink={()=>{ setModal(null); setTab("bank"); }}/>
      )}

      {/* Unlock for bank calls */}
      {modal==="unlock" && active && (
        <UnlockPrompt wallet={active} onClose={()=>setModal(null)} onUnlocked={(w)=>{ setUnlocked(w); setModal(null); if (!bcfg?.ngn) setTab("bank"); }}/>
      )}

      {/* Address book */}
      {modal==="contacts" && (
        <Sheet title="Address book" onClose={()=>setModal("send")}>
          {!contacts.length ? <p style={{ fontSize:13,color:"var(--text-4)",textAlign:"center",padding:"16px 0" }}>No saved contacts. Paste an address in Send and save it with a name.</p> :
            contacts.map(c=>(
              <div key={c.address} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 4px",borderBottom:"1px solid var(--border)" }}>
                <button onClick={()=>{ setSendTo(c.address); setModal("send"); }} style={{ flex:1,textAlign:"left",background:"none",border:"none",cursor:"pointer",minWidth:0 }}>
                  <div style={{ fontSize:14,fontWeight:700,color:"var(--text)" }}>{c.name}</div>
                  <div style={{ fontFamily:"JetBrains Mono,monospace",fontSize:10,color:"var(--text-4)" }}>{c.address.slice(0,12)}…{c.address.slice(-8)}</div>
                </button>
                <button onClick={()=>removeContact(c.address)} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--text-4)" }}><Trash2 size={14}/></button>
              </div>
            ))}
        </Sheet>
      )}
    </div>
  );
}
