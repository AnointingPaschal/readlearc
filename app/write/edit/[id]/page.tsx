"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../../../components/ui/Navbar";
import WordEditor, { WordEditorHandle } from "../../../../components/ui/WordEditor";
import { useAuth } from "../../../../lib/auth";
import { FACULTIES, ALL_COURSES } from "../../../../lib/categories";
import { Save, CheckCircle2, AlertCircle, ArrowLeft, DollarSign, ChevronDown, BookOpen, Tag, Loader } from "lucide-react";
import Link from "next/link";

const ARTICLE_TYPES = ["Analysis","Opinion","Tutorial","Review","Case Study","News & Commentary","Interview","Explainer","Essay","Technical Report","Research Summary","Book Review"];

const lbl: React.CSSProperties = { display:"block",fontSize:10,fontWeight:700,color:"var(--text-4)",textTransform:"uppercase",letterSpacing:".07em",marginBottom:5,fontFamily:"Outfit,sans-serif" };
const sel: React.CSSProperties = { width:"100%",padding:"8px 28px 8px 10px",background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",fontSize:12,fontWeight:600,color:"var(--text)",outline:"none",cursor:"pointer",appearance:"none",boxSizing:"border-box" as const };

export default function EditArticlePage() {
  const { id }   = useParams<{ id:string }>();
  const router   = useRouter();
  const { address, isAuth } = useAuth();
  const editorRef = useRef<WordEditorHandle>(null);

  const [loading,   setLoading]   = useState(true);
  const [title,     setTitle]     = useState("");
  const [blurb,     setBlurb]     = useState("");
  const [content,   setContent]   = useState("");
  const [category,  setCategory]  = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [courseId,  setCourseId]  = useState("");
  const [topic,     setTopic]     = useState("");
  const [articleType,setType]     = useState("Analysis");
  const [isFree,    setIsFree]    = useState(false);
  const [price,     setPrice]     = useState("0.020");
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [error,     setError]     = useState("");
  const [notAuth,   setNotAuth]   = useState(false);

  const faculty = FACULTIES.find(f=>f.id===facultyId);
  const courses = faculty?.courses || [];
  const course  = courses.find(c=>c.id===courseId);
  const topics  = course?.topics || [];
  const earn    = isFree ? "0.0000" : (parseFloat(price||"0")*0.85).toFixed(4);

  useEffect(()=>{
    if (!id) return;
    fetch(`/api/articles/${id}?admin=1`).then(r=>r.json()).then(d=>{
      if (d.error) { setError("Article not found"); setLoading(false); return; }
      if (d.authorAddress?.toLowerCase() !== address?.toLowerCase()) { setNotAuth(true); setLoading(false); return; }
      setTitle(d.title||"");
      setBlurb(d.blurb||"");
      setContent(d.content||"");
      const p = parseFloat(d.price||"0");
      setIsFree(p===0); setPrice(p>0?String(p):"0.020");
      const mc = ALL_COURSES.find(c=>c.label===d.category);
      if (mc){ setFacultyId(mc.facultyId); setCourseId(mc.id); }
      setCategory(d.category||"");
      setLoading(false);
    }).catch(()=>{ setError("Failed to load"); setLoading(false); });
  },[id,address]);

  async function save() {
    if (!title.trim()){ setError("Title is required"); return; }
    setSaving(true); setError("");
    const r = await fetch(`/api/articles/${id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({
      title, blurb, content: editorRef.current?.getContent() || content,
      price: isFree?"0":price, category: course?.label||category, topic,
    })});
    const d = await r.json();
    if (!r.ok){ setError(d.error||"Save failed"); setSaving(false); return; }
    setSaved(true); setSaving(false);
    setTimeout(()=>router.push(`/article/${id}`),1200);
  }

  if (loading) return (
    <div style={{minHeight:"100vh",background:"var(--bg)"}}>
      <Navbar/>
      <div style={{maxWidth:900,margin:"0 auto",padding:"calc(var(--header-h)+40px) 14px",display:"flex",flexDirection:"column",gap:14}}>
        {[80,40,400].map((h,i)=><div key={i} className="skeleton" style={{height:h,borderRadius:"var(--r-lg)"}}/>)}
      </div>
    </div>
  );

  if (notAuth) return (
    <div style={{minHeight:"100vh",background:"var(--bg)"}}>
      <Navbar/>
      <div style={{maxWidth:500,margin:"0 auto",padding:"calc(var(--header-h)+60px) 14px",textAlign:"center"}}>
        <AlertCircle size={40} style={{color:"#dc2626",marginBottom:14}}/>
        <h2 style={{fontFamily:"Outfit,sans-serif",fontSize:20,fontWeight:900,color:"var(--text)",marginBottom:8}}>Not your article</h2>
        <Link href={`/article/${id}`} className="btn btn-secondary" style={{gap:5}}><ArrowLeft size={13}/>Back</Link>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"var(--bg)"}}>
      <Navbar/>
      <div style={{maxWidth:1100,margin:"0 auto",padding:"calc(var(--header-h)+14px) 12px calc(var(--bottom-nav-h,0px)+40px)"}}>

        {/* Top bar */}
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,flexWrap:"wrap"}}>
          <Link href={`/article/${id}`} style={{display:"flex",alignItems:"center",gap:4,fontSize:12,color:"var(--text-4)",textDecoration:"none"}}>
            <ArrowLeft size={12}/>Back
          </Link>
          <h1 style={{fontFamily:"Outfit,sans-serif",fontSize:16,fontWeight:900,color:"var(--text)",flex:1}}>Edit Article</h1>
          <button onClick={save} disabled={saving||saved} className="btn btn-primary btn-sm" style={{gap:5}}>
            {saved?<><CheckCircle2 size={12}/>Saved!</>:saving?<><Loader size={12} style={{animation:"spin .7s linear infinite"}}/>Saving…</>:<><Save size={12}/>Save Changes</>}
          </button>
        </div>

        {saved&&<div style={{padding:"9px 14px",background:"rgba(5,150,105,.07)",border:"1px solid rgba(5,150,105,.2)",borderRadius:"var(--r-md)",marginBottom:12,fontSize:13,color:"var(--accent)",display:"flex",gap:7}}><CheckCircle2 size={14}/>Saved! Redirecting…</div>}
        {error&&<div style={{padding:"9px 14px",background:"rgba(220,38,38,.06)",border:"1px solid rgba(220,38,38,.2)",borderRadius:"var(--r-md)",marginBottom:12,fontSize:13,color:"#dc2626",display:"flex",gap:7}}><AlertCircle size={12}/>{error}</div>}

        {/* 3-col layout matching research studio */}
        <div style={{display:"grid",gridTemplateColumns:"220px 1fr 220px",gap:12,alignItems:"start"}}>

          {/* Left sidebar */}
          <div style={{display:"flex",flexDirection:"column",gap:10}}>

            {/* Title + Blurb */}
            <div className="card" style={{padding:14}}>
              <label style={lbl}>Title</label>
              <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Article title…"
                style={{width:"100%",padding:"8px 10px",background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",fontSize:13,fontWeight:700,color:"var(--text)",outline:"none",marginBottom:10,boxSizing:"border-box" as const}}/>
              <label style={lbl}>Summary / Hook</label>
              <textarea value={blurb} onChange={e=>setBlurb(e.target.value)} rows={3} placeholder="Short blurb…"
                style={{width:"100%",padding:"8px 10px",background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",fontSize:12,color:"var(--text)",outline:"none",resize:"none",boxSizing:"border-box" as const}}/>
            </div>

            {/* Category */}
            <div className="card" style={{padding:14}}>
              <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:10}}>
                <BookOpen size={12} style={{color:"var(--brand)"}}/>
                <span style={lbl}>Field of Study</span>
              </div>
              <div style={{position:"relative",marginBottom:8}}>
                <select value={facultyId} onChange={e=>{setFacultyId(e.target.value);setCourseId("");setTopic("");}} style={sel}>
                  <option value="">— Select faculty —</option>
                  {FACULTIES.map(f=><option key={f.id} value={f.id}>{f.label}</option>)}
                </select>
                <ChevronDown size={11} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",color:"var(--text-4)",pointerEvents:"none"}}/>
              </div>
              {facultyId&&(
                <div style={{position:"relative",marginBottom:8}}>
                  <select value={courseId} onChange={e=>{setCourseId(e.target.value);setTopic("");}} style={sel}>
                    <option value="">— Select course —</option>
                    {courses.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                  <ChevronDown size={11} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",color:"var(--text-4)",pointerEvents:"none"}}/>
                </div>
              )}
              {courseId&&topics.length>0&&(
                <div style={{position:"relative"}}>
                  <select value={topic} onChange={e=>setTopic(e.target.value)} style={sel}>
                    <option value="">— Select topic —</option>
                    {topics.map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                  <ChevronDown size={11} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",color:"var(--text-4)",pointerEvents:"none"}}/>
                </div>
              )}
              {!facultyId&&category&&<div style={{fontSize:11,color:"var(--text-4)",marginTop:4}}>Current: <strong style={{color:"var(--text)"}}>{category}</strong></div>}
            </div>

            {/* Article Type */}
            <div className="card" style={{padding:14}}>
              <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:10}}>
                <Tag size={12} style={{color:"var(--brand)"}}/>
                <span style={lbl}>Article Type</span>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                {ARTICLE_TYPES.map(t=>(
                  <button key={t} onClick={()=>setType(t)}
                    style={{padding:"4px 9px",fontSize:10,fontWeight:600,borderRadius:"var(--r-f)",cursor:"pointer",border:"1.5px solid",background:articleType===t?"var(--brand)":"transparent",color:articleType===t?"white":"var(--text-3)",borderColor:articleType===t?"var(--brand)":"var(--border)",transition:"all .12s"}}>{t}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Editor — centre */}
          <div>
            <WordEditor ref={editorRef} value={content} onChange={setContent} placeholder="Start writing your article…"/>
          </div>

          {/* Right sidebar */}
          <div style={{display:"flex",flexDirection:"column",gap:10}}>

            {/* Pricing */}
            <div className="card" style={{padding:14}}>
              <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:12}}>
                <DollarSign size={12} style={{color:"var(--accent)"}}/>
                <span style={lbl}>Pricing</span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:10}}>
                <button onClick={()=>setIsFree(true)} style={{padding:"10px 6px",borderRadius:"var(--r)",border:`2px solid ${isFree?"var(--accent)":"var(--border)"}`,background:isFree?"rgba(5,150,105,.1)":"transparent",cursor:"pointer"}}>
                  <div style={{fontFamily:"Outfit,sans-serif",fontSize:13,fontWeight:800,color:isFree?"var(--accent)":"var(--text)"}}>Free</div>
                  <div style={{fontSize:9,color:"var(--text-4)",marginTop:2}}>Open to all</div>
                </button>
                <button onClick={()=>setIsFree(false)} style={{padding:"10px 6px",borderRadius:"var(--r)",border:`2px solid ${!isFree?"var(--brand)":"var(--border)"}`,background:!isFree?"var(--brand-muted)":"transparent",cursor:"pointer"}}>
                  <div style={{fontFamily:"Outfit,sans-serif",fontSize:13,fontWeight:800,color:!isFree?"var(--brand)":"var(--text)"}}>Paid</div>
                  <div style={{fontSize:9,color:"var(--text-4)",marginTop:2}}>Earn USDC</div>
                </button>
              </div>
              {!isFree&&(
                <>
                  <div style={{display:"flex",alignItems:"center",gap:6,background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",padding:"7px 10px",marginBottom:8}}>
                    <span style={{fontSize:13,color:"var(--text-4)",fontWeight:700}}>$</span>
                    <input type="number" step="0.001" min="0.001" max="100" value={price} onChange={e=>setPrice(e.target.value)}
                      style={{flex:1,border:"none",outline:"none",background:"transparent",fontSize:16,fontWeight:800,color:"var(--accent)",fontFamily:"Outfit,sans-serif"}}/>
                    <span style={{fontSize:11,color:"var(--text-4)"}}>USDC</span>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",padding:"7px 10px",background:"rgba(5,150,105,.06)",border:"1px solid rgba(5,150,105,.15)",borderRadius:"var(--r)"}}>
                    <span style={{fontSize:11,color:"var(--text-4)"}}>You earn (85%)</span>
                    <span style={{fontFamily:"Outfit,sans-serif",fontSize:14,fontWeight:900,color:"var(--accent)"}}>${earn}</span>
                  </div>
                </>
              )}
            </div>

            {/* Save button */}
            <button onClick={save} disabled={saving||saved} className="btn btn-primary" style={{width:"100%",justifyContent:"center",gap:6}}>
              {saved?<><CheckCircle2 size={14}/>Saved!</>:saving?<><Loader size={14} style={{animation:"spin .7s linear infinite"}}/>Saving…</>:<><Save size={14}/>Save Changes</>}
            </button>
          </div>
        </div>

        {/* Mobile: stack sidebar below */}
        <style>{`
          @media (max-width: 768px) {
            .edit-layout { grid-template-columns: 1fr !important; }
          }
          @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        `}</style>
      </div>
    </div>
  );
}
