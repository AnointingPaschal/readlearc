"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Zap, BookOpen, DollarSign, Users, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "../components/ui/Navbar";
import SetupBanner from "../components/ui/SetupBanner";
import { fetchArticles, IS_CONFIGURED, type Article } from "../lib/chain";

const fade  = { hidden:{opacity:0,y:20}, show:{opacity:1,y:0,transition:{duration:.5}} };
const stagger = { hidden:{}, show:{transition:{staggerChildren:.08}} };

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    fetchArticles(6).then(setArticles).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <SetupBanner />
      <Navbar />

      {/* Hero */}
      <section style={{ paddingTop:"clamp(100px,14vw,140px)", paddingBottom:"clamp(60px,8vw,100px)", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px)", backgroundSize:"60px 60px", opacity:.5, pointerEvents:"none" }} />
        <div style={{ position:"absolute", top:-120, left:"50%", transform:"translateX(-50%)", width:800, height:500, background:"radial-gradient(ellipse,rgba(109,40,217,.1) 0%,transparent 70%)", pointerEvents:"none" }} />

        <div style={{ maxWidth:960, margin:"0 auto", padding:"0 20px", textAlign:"center", position:"relative" }}>
          <motion.div initial="hidden" animate="show" variants={stagger}>
            <motion.div variants={fade}>
              <span className="badge badge-brand" style={{ marginBottom:20, display:"inline-flex" }}>
                <Zap size={10} strokeWidth={3}/> Built on Arc · Circle USDC · 100% On-Chain
              </span>
            </motion.div>

            <motion.h1 variants={fade} style={{ fontFamily:"Outfit,sans-serif", fontSize:"clamp(40px,7vw,84px)", fontWeight:900, lineHeight:1.05, letterSpacing:"-0.03em", color:"var(--text)", marginBottom:22 }}>
              Pay per word.<br /><span className="grad-text">Own every read.</span>
            </motion.h1>

            <motion.p variants={fade} style={{ fontSize:"clamp(15px,2vw,19px)", color:"var(--text-3)", maxWidth:520, margin:"0 auto 36px", lineHeight:1.7 }}>
              The first pay-per-read platform where writers earn instantly in USDC and readers own cryptographic proof of every article they unlock.
            </motion.p>

            <motion.div variants={fade} style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap", marginBottom:64 }}>
              <Link href="/explore" className="btn btn-primary btn-lg">Start Reading <ArrowRight size={17}/></Link>
              <Link href="/write"   className="btn btn-secondary btn-lg">Start Writing</Link>
            </motion.div>

            {/* Stats */}
            <motion.div variants={stagger} style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:14 }}>
              {[
                { icon:BookOpen,   label:"Articles",         value: IS_CONFIGURED ? "Live" : "—"  },
                { icon:DollarSign, label:"Writer Share",     value:"85%"  },
                { icon:Users,      label:"Readers",          value:"Open" },
                { icon:Zap,        label:"Settlement",       value:"<1s"  },
              ].map(s => (
                <motion.div key={s.label} variants={fade} className="card" style={{ padding:"20px 16px", textAlign:"center" }}>
                  <s.icon size={18} style={{ color:"var(--brand)", marginBottom:8 }} />
                  <div style={{ fontFamily:"Outfit,sans-serif", fontSize:26, fontWeight:900, color:"var(--text)", letterSpacing:"-0.02em" }}>{s.value}</div>
                  <div style={{ fontSize:12, color:"var(--text-4)", fontWeight:500, marginTop:4 }}>{s.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Latest articles */}
      <section style={{ padding:"80px 20px", background:"var(--bg-alt)" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:36, flexWrap:"wrap", gap:12 }}>
            <div>
              <h2 style={{ fontFamily:"Outfit,sans-serif", fontSize:"clamp(24px,4vw,36px)", fontWeight:900, color:"var(--text)", letterSpacing:"-0.02em" }}>Latest Articles</h2>
              <p style={{ color:"var(--text-3)", marginTop:4, fontSize:14 }}>Pay in USDC · Read instantly · Verified on-chain</p>
            </div>
            <Link href="/explore" className="btn btn-ghost btn-sm" style={{ color:"var(--brand)", fontWeight:700 }}>View all <ArrowRight size={13}/></Link>
          </div>

          {loading ? (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:16 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height:240, borderRadius:20 }} />)}
            </div>
          ) : articles.length === 0 ? (
            <div className="card" style={{ padding:"64px 24px", textAlign:"center" }}>
              <BookOpen size={36} style={{ color:"var(--text-4)", marginBottom:12 }} />
              <p style={{ fontSize:15, fontWeight:600, color:"var(--text-3)", marginBottom:6 }}>
                {IS_CONFIGURED ? "No articles published yet" : "Configure contract to see articles"}
              </p>
              <p style={{ fontSize:13, color:"var(--text-4)", marginBottom:20 }}>
                {IS_CONFIGURED ? "Be the first to publish!" : "Set your environment variables in Vercel."}
              </p>
              {IS_CONFIGURED && <Link href="/write" className="btn btn-primary btn-sm">Write First Article</Link>}
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:16 }}>
              {articles.map(a => (
                <Link key={a.id} href={`/article/${a.id}`} style={{ textDecoration:"none", display:"block" }}>
                  <div className="card card-hover" style={{ padding:"24px 20px", height:"100%", display:"flex", flexDirection:"column", gap:12 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span className="badge badge-brand" style={{ textTransform:"capitalize" }}>{a.category}</span>
                      <span className="price-tag">${a.price} USDC</span>
                    </div>
                    <h3 style={{ fontFamily:"Outfit,sans-serif", fontSize:17, fontWeight:700, color:"var(--text)", lineHeight:1.35, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" as any, overflow:"hidden" }}>{a.title}</h3>
                    <p style={{ color:"var(--text-3)", fontSize:13, lineHeight:1.6, flex:1, display:"-webkit-box", WebkitLineClamp:3, WebkitBoxOrient:"vertical" as any, overflow:"hidden" }}>{a.blurb}</p>
                    <div style={{ paddingTop:12, borderTop:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:12, color:"var(--text-4)" }}>
                      <Link href={`/profile/${a.authorAddress}`} onClick={e => e.stopPropagation()} style={{ color:"var(--brand)", textDecoration:"none", fontWeight:600, fontFamily:"JetBrains Mono,monospace", fontSize:11 }}>{a.authorShort}</Link>
                      <span>{a.readTime}m read · {a.reads} reads</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding:"80px 20px" }}>
        <div style={{ maxWidth:1000, margin:"0 auto" }}>
          <h2 style={{ fontFamily:"Outfit,sans-serif", fontSize:"clamp(24px,4vw,36px)", fontWeight:900, color:"var(--text)", letterSpacing:"-0.02em", textAlign:"center", marginBottom:48 }}>How it works</h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:16 }}>
            {[
              { step:"01", title:"Writer Publishes",  desc:"Write your article, set a USDC price, publish entirely on-chain.",                color:"#6d28d9", bg:"rgba(109,40,217,.08)" },
              { step:"02", title:"Reader Discovers",  desc:"Browse the feed, see the preview. Pay with your wallet — instant nanopayment.", color:"#059669", bg:"rgba(5,150,105,.08)"  },
              { step:"03", title:"Instant Settlement",desc:"USDC splits atomically: 85% writer · 10% platform · 5% referrer.",             color:"#0284c7", bg:"rgba(2,132,199,.08)"  },
              { step:"04", title:"Content Unlocks",   desc:"Payment verified on-chain. Full article renders. Proof-of-read recorded.",      color:"#d97706", bg:"rgba(217,119,6,.08)"  },
            ].map(s => (
              <div key={s.step} className="card" style={{ padding:"24px 20px" }}>
                <div style={{ width:44, height:44, borderRadius:12, background:s.bg, border:`1px solid ${s.color}22`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:14 }}>
                  <span style={{ fontFamily:"JetBrains Mono,monospace", fontSize:13, fontWeight:700, color:s.color }}>{s.step}</span>
                </div>
                <h3 style={{ fontFamily:"Outfit,sans-serif", fontSize:16, fontWeight:700, color:"var(--text)", marginBottom:8 }}>{s.title}</h3>
                <p style={{ fontSize:13, color:"var(--text-3)", lineHeight:1.65 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Revenue split */}
      <section style={{ padding:"80px 20px", background:"var(--bg-alt)" }}>
        <div style={{ maxWidth:700, margin:"0 auto", textAlign:"center" }}>
          <div className="card" style={{ padding:"clamp(32px,5vw,56px) clamp(20px,5vw,48px)" }}>
            <span className="badge badge-brand" style={{ marginBottom:20, display:"inline-flex" }}><Zap size={10} strokeWidth={3}/> Atomic On-Chain Splitting</span>
            <h2 style={{ fontFamily:"Outfit,sans-serif", fontSize:"clamp(32px,5vw,52px)", fontWeight:900, color:"var(--text)", letterSpacing:"-0.03em", marginBottom:10 }}>Writers keep <span className="grad-text">85%</span></h2>
            <p style={{ color:"var(--text-3)", fontSize:15, marginBottom:40 }}>Every read triggers a smart contract. No escrow, no middlemen, no minimums.</p>
            <div style={{ display:"flex", justifyContent:"center", gap:48, marginBottom:32, flexWrap:"wrap" }}>
              {[["85%","Writer","#059669"],["10%","Platform","#6d28d9"],["5%","Referrer","#0284c7"]].map(([pct,label,color]) => (
                <div key={label} style={{ textAlign:"center" }}>
                  <div style={{ fontFamily:"Outfit,sans-serif", fontSize:48, fontWeight:900, color, lineHeight:1, marginBottom:6 }}>{pct}</div>
                  <div style={{ fontSize:11, fontWeight:700, color:"var(--text-4)", textTransform:"uppercase", letterSpacing:".08em" }}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{ height:10, borderRadius:"var(--rfull)", overflow:"hidden", display:"flex" }}>
              <div style={{ width:"85%", background:"#059669" }} />
              <div style={{ width:"10%", background:"#6d28d9" }} />
              <div style={{ width:"5%",  background:"#0284c7" }} />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding:"96px 20px" }}>
        <div style={{ maxWidth:600, margin:"0 auto", textAlign:"center" }}>
          <h2 style={{ fontFamily:"Outfit,sans-serif", fontSize:"clamp(32px,6vw,60px)", fontWeight:900, color:"var(--text)", letterSpacing:"-0.03em", marginBottom:18 }}>Start earning in <span className="grad-text">USDC</span></h2>
          <p style={{ color:"var(--text-3)", fontSize:16, lineHeight:1.7, marginBottom:36 }}>Join the decentralized publishing revolution. No ads, no middlemen — just fair nanopayments settled in milliseconds.</p>
          <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
            <Link href="/write"   className="btn btn-primary btn-lg">Publish Article</Link>
            <Link href="/explore" className="btn btn-secondary btn-lg">Explore Network</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop:"1px solid var(--border)", padding:"32px 20px", background:"var(--bg-alt)" }}>
        <div style={{ maxWidth:1200, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:28, height:28, borderRadius:8, background:"linear-gradient(135deg,var(--brand),var(--accent))", display:"flex", alignItems:"center", justifyContent:"center" }}><Zap size={13} color="white" strokeWidth={2.5}/></div>
            <span style={{ fontFamily:"Outfit,sans-serif", fontWeight:800, fontSize:15, color:"var(--text)" }}>Readlearc</span>
          </div>
          <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
            {[{href:"/explore",label:"Explore"},{href:"/write",label:"Write"},{href:"/admin",label:"Admin"}].map(l => (
              <Link key={l.href} href={l.href} style={{ fontSize:13, color:"var(--text-4)", textDecoration:"none" }}>{l.label}</Link>
            ))}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"var(--text-4)" }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:"#059669", display:"inline-block" }} />
            Arc Testnet · All systems operational
          </div>
        </div>
      </footer>
    </div>
  );
}
