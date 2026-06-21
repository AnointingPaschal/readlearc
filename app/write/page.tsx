"use client";
import { useState, useEffect } from "react";
import Navbar from "../../components/ui/Navbar";
import RichEditor from "../../components/ui/RichEditor";
import { useAuth } from "../../lib/auth";
import { Send, Save, CheckCircle2, PenLine, FlaskConical, AlertCircle } from "lucide-react";
import Link from "next/link";

const CATEGORIES = ["Technology","Science","Finance","Health","Education","Business","Culture","Politics","Environment","Research","Other"];

export default function WritePage() {
  const { address, isAuth, requireAuth } = useAuth();
  const [title,    setTitle]    = useState("");
  const [blurb,    setBlurb]    = useState("");
  const [content,  setContent]  = useState("");
  const [category, setCategory] = useState("Technology");
  const [price,    setPrice]    = useState("0.020");
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState("");

  if (!isAuth) return (
    <div style={{minHeight:"100vh",background:"var(--bg)"}}>
      <Navbar/>
      <div style={{maxWidth:600,margin:"0 auto",padding:"calc(var(--header-h) + 60px) 16px",textAlign:"center"}}>
        <PenLine size={40} style={{color:"var(--text-4)",marginBottom:14}}/>
        <h2 style={{fontFamily:"Outfit,sans-serif",fontSize:20,fontWeight:800,color:"var(--text)",marginBottom:8}}>Write on Readlearc</h2>
        <p style={{fontSize:14,color:"var(--text-3)",marginBottom:20}}>Sign in to start writing and earn USDC from every reader.</p>
        <button onClick={()=>requireAuth()} className="btn btn-primary btn-lg">Sign In to Write</button>
        <div style={{marginTop:20}}>
          <Link href="/write/research" style={{fontSize:13,color:"var(--brand)",textDecoration:"none",display:"inline-flex",alignItems:"center",gap:5}}>
            <FlaskConical size={13}/>Research paper? Use the Research Studio →
          </Link>
        </div>
      </div>
    </div>
  );

  async function submit() {
    if (!title.trim())   { setError("Add a title."); return; }
    const text = content.replace(/<[^>]+>/g,"").trim();
    if (text.length < 50){ setError("Content is too short — write at least a few sentences."); return; }
    setSaving(true); setError("");
    const r = await fetch("/api/articles",{
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({title,blurb,content,category,price,authorAddress:address.toLowerCase(),status:"pending"}),
    });
    const d = await r.json();
    if (!r.ok) { setError(d.error||"Submit failed"); setSaving(false); return; }
    setSaved(true); setSaving(false);
    setTitle(""); setBlurb(""); setContent(""); setCategory("Technology"); setPrice("0.020");
  }

  return (
    <div style={{minHeight:"100vh",background:"var(--bg)"}}>
      <Navbar/>
      <div style={{maxWidth:860,margin:"0 auto",padding:"calc(var(--header-h) + 20px) 16px 60px"}}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:10}}>
          <div>
            <h1 style={{fontFamily:"Outfit,sans-serif",fontSize:22,fontWeight:900,color:"var(--text)",letterSpacing:"-.02em"}}>Write Article</h1>
            <p style={{fontSize:12,color:"var(--text-4)",marginTop:2}}>Your article earns 85% of every USDC payment.</p>
          </div>
          <div style={{display:"flex",gap:8}}>
            <Link href="/write/research" className="btn btn-secondary btn-sm">
              <FlaskConical size={12}/>Research Studio
            </Link>
            <button onClick={submit} disabled={saving||saved} className="btn btn-primary btn-sm">
              {saved?<><CheckCircle2 size={12}/>Submitted!</>:saving?"Submitting…":<><Send size={12}/>Submit for Review</>}
            </button>
          </div>
        </div>

        {saved&&(
          <div style={{padding:"12px 16px",background:"rgba(5,150,105,.07)",border:"1px solid rgba(5,150,105,.2)",borderRadius:"var(--r-md)",marginBottom:14,display:"flex",gap:8,alignItems:"center"}}>
            <CheckCircle2 size={16} style={{color:"var(--accent)"}}/>
            <span style={{fontSize:13,fontWeight:600,color:"var(--accent)"}}>Submitted! Admin will review and approve your article.</span>
          </div>
        )}
        {error&&<div style={{padding:"10px 14px",background:"rgba(220,38,38,.06)",border:"1px solid rgba(220,38,38,.2)",borderRadius:"var(--r-md)",marginBottom:12,fontSize:13,color:"#dc2626",display:"flex",gap:7}}><AlertCircle size={14} style={{flexShrink:0,marginTop:1}}/>{error}</div>}

        {/* Meta */}
        <div className="card" style={{padding:"16px",marginBottom:14}}>
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Article title…"
            style={{width:"100%",border:"none",outline:"none",background:"transparent",fontFamily:"Outfit,sans-serif",fontSize:22,fontWeight:900,color:"var(--text)",marginBottom:12,boxSizing:"border-box"}}/>
          <textarea value={blurb} onChange={e=>setBlurb(e.target.value)} placeholder="Short summary / hook (shown on article preview)…" rows={2}
            style={{width:"100%",border:"none",outline:"none",background:"transparent",fontSize:14,color:"var(--text-3)",resize:"none",lineHeight:1.6,marginBottom:12,boxSizing:"border-box"}}/>
          <div style={{display:"flex",gap:10,flexWrap:"wrap",borderTop:"1px solid var(--border)",paddingTop:12}}>
            <div>
              <label style={{fontSize:10,fontWeight:700,color:"var(--text-4)",textTransform:"uppercase",display:"block",marginBottom:4,fontFamily:"Outfit,sans-serif"}}>Category</label>
              <select value={category} onChange={e=>setCategory(e.target.value)} style={{padding:"6px 10px",background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",fontSize:12,color:"var(--text)",outline:"none"}}>
                {CATEGORIES.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:10,fontWeight:700,color:"var(--text-4)",textTransform:"uppercase",display:"block",marginBottom:4,fontFamily:"Outfit,sans-serif"}}>Price (USDC)</label>
              <div style={{display:"flex",alignItems:"center",gap:4,background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",padding:"5px 10px"}}>
                <span style={{fontSize:12,color:"var(--text-4)",fontWeight:700}}>$</span>
                <input type="number" step="0.001" min="0.001" max="10" value={price} onChange={e=>setPrice(e.target.value)}
                  style={{width:70,border:"none",outline:"none",background:"transparent",fontSize:14,fontWeight:700,color:"var(--accent)",fontFamily:"Outfit,sans-serif"}}/>
                <span style={{fontSize:11,color:"var(--text-4)"}}>USDC</span>
              </div>
            </div>
            <div style={{marginLeft:"auto",display:"flex",alignItems:"flex-end",gap:6,paddingBottom:2}}>
              <span style={{fontSize:11,color:"var(--text-4)"}}>You earn</span>
              <span style={{fontFamily:"Outfit,sans-serif",fontSize:16,fontWeight:800,color:"var(--accent)"}}>${(parseFloat(price||"0")*0.85).toFixed(4)}</span>
              <span style={{fontSize:11,color:"var(--text-4)"}}>per read</span>
            </div>
          </div>
        </div>

        {/* Rich editor */}
        <RichEditor value={content} onChange={setContent} placeholder="Start writing your article… Use the toolbar above for formatting, images, links and more." minHeight={420}/>

        <div style={{marginTop:14,display:"flex",justifyContent:"flex-end"}}>
          <button onClick={submit} disabled={saving||saved} className="btn btn-primary" style={{gap:7,fontWeight:700}}>
            {saved?<><CheckCircle2 size={14}/>Submitted!</>:saving?"Submitting…":<><Send size={14}/>Submit for Review</>}
          </button>
        </div>
      </div>
    </div>
  );
}
