"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, Clock, DollarSign, ExternalLink, Zap } from "lucide-react";
import Navbar from "../../components/ui/Navbar";
import SetupBanner from "../../components/ui/SetupBanner";
import ConnectGate from "../../components/ui/ConnectGate";
import { useAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { EXPLORER_URL } from "../../lib/chain";

export default function ReadingHistoryPage() {
  const { address, isAuth } = useAuth();
  const [history,  setHistory]  = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!address) { setLoading(false); return; }
    async function load() {
      setLoading(true);
      // Get all read receipts with article data
      const { data } = await supabase
        .from("read_receipts")
        .select("*, articles(id, title, blurb, category, price, read_time, author_address, is_research)")
        .ilike("reader_address", address)
        .order("created_at", { ascending: false })
        .limit(50);
      setHistory(data || []);
      setLoading(false);
    }
    load();
  }, [address]);

  if (!isAuth) return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <SetupBanner/><Navbar/>
      <ConnectGate title="Reading History" body="Connect your wallet to see all articles you've unlocked." icon={BookOpen}/>
    </div>
  );

  const totalSpent = history.reduce((s,r) => s + parseFloat(r.amount_paid||r.articles?.price||0), 0);

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <SetupBanner/><Navbar/>
      <div style={{ maxWidth:860, margin:"0 auto", padding:"calc(var(--header-h) + 28px) 14px 60px" }}>

        <div style={{ marginBottom:24 }}>
          <h1 style={{ fontFamily:"Outfit,sans-serif", fontSize:"clamp(22px,5vw,36px)", fontWeight:900, color:"var(--text)", letterSpacing:"-0.02em" }}>Reading History</h1>
          <p style={{ color:"var(--text-4)", fontSize:13, marginTop:4 }}>
            {history.length} article{history.length!==1?"s":""} unlocked · ${totalSpent.toFixed(4)} USDC spent
          </p>
        </div>

        {loading ? (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height:90, borderRadius:"var(--r-lg)" }}/>)}
          </div>
        ) : history.length === 0 ? (
          <div className="card" style={{ padding:"64px 24px", textAlign:"center" }}>
            <BookOpen size={36} style={{ color:"var(--text-4)", marginBottom:12 }}/>
            <p style={{ fontSize:15, fontWeight:600, color:"var(--text-3)", marginBottom:6 }}>No articles unlocked yet</p>
            <p style={{ fontSize:13, color:"var(--text-4)", marginBottom:20 }}>Pay to read an article and it'll appear here permanently.</p>
            <Link href="/explore" className="btn btn-primary btn-sm">Browse Articles</Link>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {history.map(r => {
              const a = r.articles;
              if (!a) return null;
              return (
                <Link key={r.id} href={`/article/${a.id}`} style={{ textDecoration:"none" }}>
                  <div className="card card-hover" style={{ padding:"16px 18px", display:"flex", gap:14, alignItems:"flex-start" }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", gap:6, marginBottom:7, flexWrap:"wrap", alignItems:"center" }}>
                        <span className="badge badge-brand" style={{ textTransform:"capitalize" }}>{a.category}</span>
                        {a.is_research && <span className="badge badge-blue">Research</span>}
                        <span style={{ display:"flex", alignItems:"center", gap:3, fontSize:10, color:"var(--text-4)" }}>
                          <Clock size={9}/>{a.read_time}m read
                        </span>
                      </div>
                      <h3 style={{ fontFamily:"Outfit,sans-serif", fontSize:14, fontWeight:700, color:"var(--text)", lineHeight:1.3, marginBottom:5,
                        display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" as any, overflow:"hidden" }}>{a.title}</h3>
                      <p style={{ fontSize:11, color:"var(--text-4)", lineHeight:1.5,
                        display:"-webkit-box", WebkitLineClamp:1, WebkitBoxOrient:"vertical" as any, overflow:"hidden" }}>{a.blurb}</p>
                    </div>
                    <div style={{ flexShrink:0, textAlign:"right" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:3, fontSize:12, fontWeight:700, color:"var(--accent)", marginBottom:5 }}>
                        <DollarSign size={11}/>{parseFloat(r.amount_paid || a.price).toFixed(4)}
                      </div>
                      <div style={{ fontSize:10, color:"var(--text-4)", marginBottom:5 }}>
                        {new Date(r.created_at).toLocaleDateString()}
                      </div>
                      {r.tx_hash && (
                        <a href={`${EXPLORER_URL}/tx/${r.tx_hash}`} target="_blank" rel="noopener noreferrer"
                          onClick={e=>e.stopPropagation()}
                          style={{ fontSize:9, color:"var(--brand)", textDecoration:"none", display:"flex", alignItems:"center", gap:2, justifyContent:"flex-end" }}>
                          Tx <ExternalLink size={8}/>
                        </a>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
