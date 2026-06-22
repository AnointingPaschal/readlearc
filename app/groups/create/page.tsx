"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/ui/Navbar";
import { useAuth } from "../../../lib/auth";
import { Users, Lock, Globe, ArrowLeft, Upload, X, Plus, Tag } from "lucide-react";
import Link from "next/link";

const CATEGORIES = ["Science","Technology","Medicine","Business","Humanities","Law","Education","Arts","Engineering","Environment","Research","General"];

export default function CreateGroupPage() {
  const router = useRouter();
  const { address, isAuth, requireAuth } = useAuth();
  const [name,     setName]     = useState("");
  const [desc,     setDesc]     = useState("");
  const [type,     setType]     = useState<"public"|"private">("public");
  const [category, setCategory] = useState("General");
  const [rules,    setRules]    = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags,     setTags]     = useState<string[]>([]);
  const [banner,   setBanner]   = useState("");
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  function addTag() {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g,"-");
    if (t && !tags.includes(t) && tags.length < 8) { setTags(p=>[...p,t]); setTagInput(""); }
  }
  function uploadBanner(file?:File) {
    if (!file||!file.type.startsWith("image/")) return;
    const canvas=document.createElement("canvas"), img=new window.Image(), r=new FileReader();
    r.onload=ev=>{img.onload=()=>{const M=1200;let{width:w,height:h}=img;if(w>M){h=Math.round(h*M/w);w=M;}canvas.width=w;canvas.height=h;canvas.getContext("2d")!.drawImage(img,0,0,w,h);setBanner(canvas.toDataURL("image/jpeg",.8));};img.src=ev.target?.result as string;};
    r.readAsDataURL(file);
  }
  async function submit() {
    if (!isAuth){requireAuth();return;}
    if (!name.trim()){setError("Group name is required.");return;}
    setSaving(true); setError("");
    const r=await fetch("/api/groups",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,description:desc,type,category,rules,tags,bannerImage:banner||null,ownerAddress:address})});
    const d=await r.json();
    if (r.ok) router.push(`/groups/${d.id}`);
    else {setError(d.error||"Failed");setSaving(false);}
  }

  return (
    <div style={{minHeight:"100vh",background:"var(--bg)"}}>
      <Navbar/>
      <div style={{maxWidth:640,margin:"0 auto",padding:"calc(var(--header-h) + 20px) 14px calc(var(--bottom-nav-h,0px) + 40px)"}}>
        <Link href="/contribute" style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:12,color:"var(--text-4)",textDecoration:"none",marginBottom:20}}><ArrowLeft size={13}/>Back to Groups</Link>
        <h1 style={{fontFamily:"Outfit,sans-serif",fontSize:"clamp(20px,4vw,26px)",fontWeight:900,color:"var(--text)",letterSpacing:"-.02em",marginBottom:4}}>Create Group</h1>
        <p style={{fontSize:13,color:"var(--text-4)",marginBottom:24}}>Build a community around a topic or team.</p>
        {error&&<div style={{padding:"10px 14px",background:"rgba(220,38,38,.06)",border:"1px solid rgba(220,38,38,.2)",borderRadius:"var(--r-md)",marginBottom:16,fontSize:13,color:"#dc2626"}}>{error}</div>}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>

          {/* Type */}
          <div className="card" style={{padding:16}}>
            <label style={lbl}>Group Type</label>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:8}}>
              {([{v:"public",icon:Globe,title:"Public",sub:"Anyone can find and join"},{v:"private",icon:Lock,title:"Private",sub:"Invite only — hidden from search"}] as const).map(o=>(
                <button key={o.v} onClick={()=>setType(o.v)} style={{padding:14,borderRadius:"var(--r-lg)",cursor:"pointer",textAlign:"left",border:`2px solid ${type===o.v?"var(--brand)":"var(--border)"}`,background:type===o.v?"var(--brand-muted)":"var(--bg-alt)",transition:"all .15s"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}><o.icon size={16} style={{color:type===o.v?"var(--brand)":"var(--text-4)"}}/><span style={{fontFamily:"Outfit,sans-serif",fontSize:13,fontWeight:800,color:type===o.v?"var(--brand)":"var(--text)"}}>{o.title}</span></div>
                  <p style={{fontSize:11,color:"var(--text-4)",lineHeight:1.4,margin:0}}>{o.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="card" style={{padding:16,display:"flex",flexDirection:"column",gap:12}}>
            <div><label style={lbl}>Group Name *</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Machine Learning Researchers" style={{...inp,marginTop:6}} maxLength={60}/></div>
            <div><label style={lbl}>Description</label><textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="What is this group about?" rows={3} style={{...inp,resize:"none",lineHeight:1.6,marginTop:6}}/></div>
            <div><label style={lbl}>Category</label><select value={category} onChange={e=>setCategory(e.target.value)} style={{...inp,cursor:"pointer",marginTop:6}}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></div>
          </div>

          {/* Banner */}
          <div className="card" style={{padding:16}}>
            <label style={lbl}>Banner Image</label>
            {banner?(
              <div style={{position:"relative",marginTop:8}}>
                <img src={banner} alt="" style={{width:"100%",height:90,objectFit:"cover",borderRadius:"var(--r)",border:"1.5px solid var(--border)"}}/>
                <button onClick={()=>setBanner("")} style={{position:"absolute",top:6,right:6,width:22,height:22,borderRadius:"50%",background:"rgba(0,0,0,.65)",border:"none",cursor:"pointer",color:"white",display:"flex",alignItems:"center",justifyContent:"center"}}><X size={11}/></button>
              </div>
            ):(
              <label style={{display:"block",marginTop:8,border:"2px dashed var(--border)",borderRadius:"var(--r)",padding:20,textAlign:"center",cursor:"pointer",background:"var(--bg-alt)"}}>
                <Upload size={18} style={{color:"var(--text-4)",marginBottom:5}}/>
                <p style={{fontSize:11,fontWeight:600,color:"var(--text-3)",margin:0}}>Drop or click to upload</p>
                <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>uploadBanner(e.target.files?.[0])}/>
              </label>
            )}
          </div>

          {/* Tags */}
          <div className="card" style={{padding:16}}>
            <label style={lbl}>Tags <span style={{fontWeight:400,color:"var(--text-4)"}}>(up to 8)</span></label>
            <div style={{display:"flex",gap:6,marginTop:8}}>
              <input value={tagInput} onChange={e=>setTagInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"||e.key===","){e.preventDefault();addTag();}}} placeholder="Add tag + Enter" style={{...inp,flex:1}} maxLength={24}/>
              <button onClick={addTag} className="btn btn-secondary btn-sm"><Plus size={12}/></button>
            </div>
            {tags.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:8}}>{tags.map(t=><span key={t} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,padding:"3px 9px",borderRadius:99,background:"var(--brand-muted)",color:"var(--brand)",border:"1px solid var(--brand-border)"}}><Tag size={9}/>{t}<button onClick={()=>setTags(p=>p.filter(x=>x!==t))} style={{background:"none",border:"none",cursor:"pointer",color:"var(--brand)",padding:0,display:"flex"}}><X size={9}/></button></span>)}</div>}
          </div>

          {/* Rules */}
          <div className="card" style={{padding:16}}>
            <label style={lbl}>Group Rules <span style={{fontWeight:400,color:"var(--text-4)"}}>(optional)</span></label>
            <textarea value={rules} onChange={e=>setRules(e.target.value)} placeholder={"1. Be respectful\n2. Stay on topic\n3. No spam"} rows={4} style={{...inp,resize:"none",lineHeight:1.7,marginTop:6}}/>
          </div>

          <button onClick={submit} disabled={saving} className="btn btn-primary" style={{justifyContent:"center",height:46,fontSize:14,fontWeight:800}}>
            {saving?"Creating…":<><Users size={15}/>Create {type==="private"?"Private":"Public"} Group</>}
          </button>
        </div>
      </div>
    </div>
  );
}
const lbl:React.CSSProperties={display:"block",fontSize:10,fontWeight:700,color:"var(--text-4)",textTransform:"uppercase",letterSpacing:".07em",fontFamily:"Outfit,sans-serif"};
const inp:React.CSSProperties={width:"100%",padding:"9px 11px",background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",fontSize:13,color:"var(--text)",outline:"none",boxSizing:"border-box"};
