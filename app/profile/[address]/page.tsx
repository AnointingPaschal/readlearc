"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../lib/auth";
import Navbar from "../../../components/ui/Navbar";
import { BookOpen, Users, Zap, Globe, Edit2, Check, X, Save, ExternalLink, Flame, MessageCircle, Clock, Shield, AtSign } from "lucide-react";
import { supabase } from "../../../lib/supabase";

const EXPLORER = "https://testnet.arcscan.app";

type Tab = "posts"|"followers"|"following"|"about";

interface Profile {
  wallet_address:string; username?:string; display_name?:string;
  bio?:string; website?:string; twitter?:string; avatar_color?:string;
  articleCount?:number; followerCount?:number; followingCount?:number;
  savedToChain?:boolean; chainSignature?:string;
}

export default function ProfilePage() {
  const { address: profileAddr } = useParams<{ address:string }>();
  const { isAuth, address, signer, requireAuth } = useAuth();

  const [profile,     setProfile]     = useState<Profile|null>(null);
  const [articles,    setArticles]    = useState<any[]>([]);
  const [followers,   setFollowers]   = useState<any[]>([]);
  const [following,   setFollowing]   = useState<any[]>([]);
  const [tab,         setTab]         = useState<Tab>("posts");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCt,  setFollowerCt]  = useState(0);
  const [editing,     setEditing]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [savingChain, setSavingChain] = useState(false);
  const [editForm,    setEditForm]    = useState<Partial<Profile>>({});
  const [loading,     setLoading]     = useState(true);

  const isOwn  = address?.toLowerCase() === profileAddr?.toLowerCase();
  const avatarColor = profile?.avatar_color || `hsl(${parseInt(profileAddr?.slice(2,4)||"0",16)*1.4}deg,65%,55%)`;

  async function load() {
    setLoading(true);
    const [prof, arts, fols] = await Promise.all([
      fetch(`/api/profiles/${profileAddr}`).then(r=>r.json()).catch(()=>null),
      supabase.from("articles").select("id,title,blurb,category,price,reads,created_at,is_research,read_time").ilike("author_address",profileAddr).in("status",["approved","featured"]).order("created_at",{ascending:false}).limit(20).then(r=>r.data||[]),
      supabase.from("follows").select("id").ilike("following_address",profileAddr).then(r=>(r.data||[]).length),
    ]);
    setProfile({ wallet_address:profileAddr, ...prof });
    setArticles(arts);
    setFollowerCt(fols);
    setEditForm({ username:prof?.username||"", display_name:prof?.display_name||"", bio:prof?.bio||"", website:prof?.website||"", twitter:prof?.twitter||"" });
    if (address) {
      const { data:isF } = await supabase.from("follows").select("id").ilike("follower_address",address).ilike("following_address",profileAddr).maybeSingle();
      setIsFollowing(!!isF);
    }
    setLoading(false);
  }

  async function loadFollowers() {
    const [fols, foing] = await Promise.all([
      supabase.from("follows").select("follower_address, profiles!follows_follower_address_fkey(username,display_name,avatar_color)").ilike("following_address",profileAddr).then(r=>r.data||[]),
      supabase.from("follows").select("following_address, profiles!follows_following_address_fkey(username,display_name,avatar_color)").ilike("follower_address",profileAddr).then(r=>r.data||[]),
    ]);
    setFollowers(fols); setFollowing(foing);
  }

  useEffect(()=>{ load(); },[profileAddr, address]);
  useEffect(()=>{ if(tab==="followers"||tab==="following") loadFollowers(); },[tab]);

  async function toggleFollow() {
    if (!isAuth) { requireAuth(); return; }
    const r = await fetch("/api/social/follow",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({follower:address,target:profileAddr}) });
    const d = await r.json();
    setIsFollowing(d.following); setFollowerCt(d.followers);
  }

  async function saveProfile() {
    setSaving(true);
    await fetch("/api/profiles",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({walletAddress:profileAddr,...editForm}) });
    setProfile(prev=> prev ? {...prev,...editForm} : null);
    setEditing(false); setSaving(false);
  }

  async function saveToChain() {
    if (!signer) { requireAuth(); return; }
    setSavingChain(true);
    try {
      const msg = `Readlearc Profile\nAddress: ${profileAddr}\nUsername: ${editForm.username||""}\nTimestamp: ${Date.now()}`;
      const sig = await signer.signMessage(msg);
      // Save signature to DB (proves they own this wallet)
      await fetch("/api/profiles",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({walletAddress:profileAddr,...editForm,chainSignature:sig,savedToChain:true}) });
      setProfile(prev=> prev ? {...prev,...editForm,savedToChain:true,chainSignature:sig} : null);
      setEditing(false);
    } catch(e:any) { console.error(e); }
    setSavingChain(false);
  }

  const short = (a:string) => `${a.slice(0,8)}…${a.slice(-4)}`;
  const totalReads = articles.reduce((s,a)=>s+a.reads,0);

  function UserCard({ addr, prof }: { addr:string; prof?:any }) {
    return (
      <Link href={`/profile/${addr}`} style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 16px",textDecoration:"none",borderBottom:"1px solid var(--border)",transition:"background .12s" }}
        onMouseEnter={e=>(e.currentTarget as any).style.background="var(--bg-alt)"}
        onMouseLeave={e=>(e.currentTarget as any).style.background=""}>
        <div style={{ width:44,height:44,borderRadius:"50%",background:`linear-gradient(135deg,hsl(${parseInt(addr.slice(2,4)||"0",16)*1.4}deg,65%,55%),hsl(${parseInt(addr.slice(4,6)||"0",16)*1.4}deg,55%,45%))`,flexShrink:0 }}/>
        <div>
          <div style={{ fontSize:14,fontWeight:700,color:"var(--text)" }}>{prof?.display_name||prof?.username||short(addr)}</div>
          {prof?.username && <div style={{ fontSize:11,color:"var(--text-4)" }}>@{prof.username}</div>}
          <div style={{ fontFamily:"JetBrains Mono,monospace",fontSize:10,color:"var(--text-4)" }}>{short(addr)}</div>
        </div>
      </Link>
    );
  }

  if (loading) return (
    <div style={{ minHeight:"100vh",background:"var(--bg)" }}><Navbar/>
      <div style={{ maxWidth:720,margin:"0 auto",padding:"calc(var(--header-h) + 20px) 16px" }}>
        <div className="skeleton" style={{ height:180,borderRadius:"var(--r-lg)",marginBottom:16 }}/>
        <div className="skeleton" style={{ height:60,borderRadius:"var(--r)" }}/>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh",background:"var(--bg)" }}>
      <Navbar/>
      <div style={{ maxWidth:720,margin:"0 auto",padding:"calc(var(--header-h) + 20px) 16px 60px" }}>

        {/* Profile card */}
        <div className="card" style={{ overflow:"hidden",marginBottom:16,padding:0 }}>
          {/* Cover */}
          <div style={{ height:120,background:`linear-gradient(135deg,${avatarColor},hsl(${parseInt(profileAddr?.slice(4,6)||"0",16)*1.4}deg,55%,45%))` }}/>
          {/* Avatar + actions */}
          <div style={{ padding:"0 20px 20px",position:"relative" }}>
            <div style={{ display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:10 }}>
              <div style={{ width:72,height:72,borderRadius:"50%",background:`linear-gradient(135deg,${avatarColor},hsl(${parseInt(profileAddr?.slice(4,6)||"0",16)*1.4}deg,55%,45%))`,border:"3px solid var(--bg-card)",marginTop:-36,flexShrink:0 }}/>
              <div style={{ display:"flex",gap:8,marginTop:8 }}>
                {isOwn ? (
                  editing ? (
                    <>
                      <button onClick={saveToChain} disabled={savingChain} className="btn btn-primary btn-sm" style={{ gap:5 }}>
                        {savingChain?<><div style={{ width:11,height:11,border:"1.5px solid rgba(255,255,255,.3)",borderTopColor:"white",borderRadius:"50%"}} className="spin"/>Signing…</>:<><Shield size={11}/>Save to Blockchain</>}
                      </button>
                      <button onClick={saveProfile} disabled={saving} className="btn btn-secondary btn-sm">
                        <Save size={11}/>{saving?"Saving…":"Save"}
                      </button>
                      <button onClick={()=>setEditing(false)} className="btn btn-ghost btn-sm"><X size={11}/></button>
                    </>
                  ) : (
                    !profile?.savedToChain && (
                      <button onClick={()=>setEditing(true)} className="btn btn-secondary btn-sm"><Edit2 size={11}/>Edit Profile</button>
                    )
                  )
                ) : (
                  <button onClick={toggleFollow} className={`btn btn-sm ${isFollowing?"btn-secondary":"btn-primary"}`} style={{ fontWeight:700 }}>
                    {isFollowing?"Unfollow":"Follow"}
                  </button>
                )}
              </div>
            </div>

            {/* Name + username */}
            {editing ? (
              <div style={{ display:"flex",flexDirection:"column",gap:8,marginBottom:14 }}>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
                  <div><label style={{ fontSize:10,fontWeight:700,color:"var(--text-4)",display:"block",marginBottom:3 }}>Display Name</label>
                    <input value={editForm.display_name||""} onChange={e=>setEditForm(f=>({...f,display_name:e.target.value}))} className="input" placeholder="Your name"/></div>
                  <div><label style={{ fontSize:10,fontWeight:700,color:"var(--text-4)",display:"block",marginBottom:3 }}>Username</label>
                    <input value={editForm.username||""} onChange={e=>setEditForm(f=>({...f,username:e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,"")}))} className="input" placeholder="username"/></div>
                </div>
                <div><label style={{ fontSize:10,fontWeight:700,color:"var(--text-4)",display:"block",marginBottom:3 }}>Bio</label>
                  <textarea value={editForm.bio||""} onChange={e=>setEditForm(f=>({...f,bio:e.target.value}))} rows={2} maxLength={160} className="input" style={{ height:"auto",resize:"none" }} placeholder="Tell readers about yourself…"/></div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
                  <div><label style={{ fontSize:10,fontWeight:700,color:"var(--text-4)",display:"block",marginBottom:3 }}>Website</label>
                    <input value={editForm.website||""} onChange={e=>setEditForm(f=>({...f,website:e.target.value}))} className="input" placeholder="https://…"/></div>
                  <div><label style={{ fontSize:10,fontWeight:700,color:"var(--text-4)",display:"block",marginBottom:3 }}>Twitter/X</label>
                    <input value={editForm.twitter||""} onChange={e=>setEditForm(f=>({...f,twitter:e.target.value.replace("@","")}))} className="input" placeholder="@handle"/></div>
                </div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom:6 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
                    <span style={{ fontFamily:"Outfit,sans-serif",fontSize:20,fontWeight:900,color:"var(--text)" }}>
                      {profile?.display_name || profile?.username || short(profileAddr||"")}
                    </span>
                    {profile?.savedToChain && (
                      <span style={{ display:"flex",alignItems:"center",gap:3,fontSize:10,fontWeight:700,color:"var(--brand)",background:"var(--brand-muted)",padding:"2px 7px",borderRadius:"var(--r-f)",border:"1px solid var(--brand-border)" }}>
                        <Shield size={9}/>On-chain
                      </span>
                    )}
                  </div>
                  {profile?.username && <div style={{ fontSize:12,color:"var(--text-4)",marginTop:1 }}>@{profile.username}</div>}
                  <div style={{ fontFamily:"JetBrains Mono,monospace",fontSize:10,color:"var(--text-4)",marginTop:2 }}>
                    <a href={`${EXPLORER}/address/${profileAddr}`} target="_blank" rel="noopener noreferrer" style={{ color:"var(--brand)",textDecoration:"none",display:"inline-flex",alignItems:"center",gap:3 }}>
                      {profileAddr} <ExternalLink size={9}/>
                    </a>
                  </div>
                </div>
                {profile?.bio && <p style={{ fontSize:13,color:"var(--text-2)",lineHeight:1.65,marginBottom:8 }}>{profile.bio}</p>}
                <div style={{ display:"flex",gap:12,flexWrap:"wrap" }}>
                  {profile?.website && <a href={profile.website} target="_blank" rel="noopener noreferrer" style={{ display:"flex",alignItems:"center",gap:4,fontSize:12,color:"var(--brand)",textDecoration:"none" }}><Globe size={12}/>{profile.website.replace(/^https?:\/\//,"")}</a>}
                  {profile?.twitter && <a href={`https://x.com/${profile.twitter}`} target="_blank" rel="noopener noreferrer" style={{ display:"flex",alignItems:"center",gap:4,fontSize:12,color:"var(--brand)",textDecoration:"none" }}><AtSign size={12}/>{profile.twitter}</a>}
                </div>
              </>
            )}

            {/* Stats */}
            <div style={{ display:"flex",gap:20,marginTop:14,flexWrap:"wrap" }}>
              {[
                { v:articles.length,              l:"Articles"  },
                { v:followerCt,                   l:"Followers" },
                { v:profile?.followingCount||0,   l:"Following" },
                { v:totalReads,                   l:"Reads"     },
              ].map(s=>(
                <div key={s.l} style={{ cursor:"pointer" }} onClick={()=>setTab(s.l==="Followers"?"followers":s.l==="Following"?"following":"posts")}>
                  <span style={{ fontFamily:"Outfit,sans-serif",fontSize:18,fontWeight:900,color:"var(--text)" }}>{s.v.toLocaleString()}</span>
                  {" "}<span style={{ fontSize:12,color:"var(--text-4)" }}>{s.l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex",borderBottom:"1px solid var(--border)",marginBottom:16,background:"var(--bg-card)",borderRadius:"var(--r-lg) var(--r-lg) 0 0",overflow:"hidden" }}>
          {(["posts","followers","following","about"] as Tab[]).map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{ flex:1,padding:"13px 8px",border:"none",background:"transparent",cursor:"pointer",fontFamily:"Outfit,sans-serif",fontSize:13,fontWeight:700,color:tab===t?"var(--brand)":"var(--text-4)",borderBottom:`2px solid ${tab===t?"var(--brand)":"transparent"}`,transition:"all .15s",textTransform:"capitalize" }}>
              {t==="posts"?`Posts (${articles.length})`:t==="followers"?`Followers (${followerCt})`:t.charAt(0).toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>

        {/* Posts tab */}
        {tab==="posts" && (
          articles.length===0 ? (
            <div className="card" style={{ padding:"40px",textAlign:"center" }}>
              <BookOpen size={28} style={{ color:"var(--text-4)",marginBottom:10 }}/>
              <p style={{ fontSize:14,color:"var(--text-3)" }}>No published articles yet.</p>
            </div>
          ) : (
            <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
              {articles.map(a=>(
                <Link key={a.id} href={`/article/${a.id}`} style={{ textDecoration:"none" }}>
                  <div className="card card-hover" style={{ padding:"16px" }}>
                    <div style={{ display:"flex",gap:8,marginBottom:8,flexWrap:"wrap",alignItems:"center" }}>
                      <span className="badge badge-brand">{a.category}</span>
                      {a.is_research&&<span className="badge badge-blue">Research</span>}
                      <span className="price-tag">${parseFloat(a.price).toFixed(3)}</span>
                    </div>
                    <h3 style={{ fontFamily:"Outfit,sans-serif",fontSize:15,fontWeight:800,color:"var(--text)",marginBottom:6,lineHeight:1.3 }}>{a.title}</h3>
                    <p style={{ fontSize:12,color:"var(--text-3)",lineHeight:1.6,marginBottom:10,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" as any,overflow:"hidden" }}>{a.blurb}</p>
                    <div style={{ display:"flex",gap:12,fontSize:11,color:"var(--text-4)" }}>
                      <span style={{ display:"flex",alignItems:"center",gap:3 }}><Clock size={10}/>{a.read_time}m</span>
                      <span style={{ display:"flex",alignItems:"center",gap:3 }}><Zap size={10}/>{a.reads} reads</span>
                      <span style={{ color:"var(--text-4)" }}>{new Date(a.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )
        )}

        {/* Followers tab */}
        {tab==="followers" && (
          <div className="card" style={{ overflow:"hidden",padding:0 }}>
            {!followers.length ? <div style={{ padding:"36px",textAlign:"center",color:"var(--text-4)",fontSize:13 }}>No followers yet.</div> :
             followers.map((f:any)=><UserCard key={f.follower_address} addr={f.follower_address} prof={f.profiles}/>)}
          </div>
        )}

        {/* Following tab */}
        {tab==="following" && (
          <div className="card" style={{ overflow:"hidden",padding:0 }}>
            {!following.length ? <div style={{ padding:"36px",textAlign:"center",color:"var(--text-4)",fontSize:13 }}>Not following anyone yet.</div> :
             following.map((f:any)=><UserCard key={f.following_address} addr={f.following_address} prof={f.profiles}/>)}
          </div>
        )}

        {/* About tab */}
        {tab==="about" && (
          <div className="card" style={{ padding:"20px",display:"flex",flexDirection:"column",gap:12 }}>
            {[
              { l:"Wallet Address", v:profileAddr, mono:true },
              { l:"Username",   v:profile?.username ? "@"+profile.username : "—", mono:false },
              { l:"Display Name", v:profile?.display_name || "—", mono:false },
              { l:"Bio",          v:profile?.bio || "—", mono:false },
              { l:"Website",  v:profile?.website || "—", mono:false },
              { l:"Twitter",  v:profile?.twitter ? "@"+profile.twitter : "—", mono:false },
              { l:"Profile Status", v:profile?.savedToChain ? "✓ Verified on blockchain" : "Not verified", mono:false },
            ].map(row=>(
              <div key={row.l} style={{ display:"flex",gap:16,borderBottom:"1px solid var(--border)",paddingBottom:10 }}>
                <span style={{ fontSize:11,fontWeight:700,color:"var(--text-4)",textTransform:"uppercase",letterSpacing:".07em",width:130,flexShrink:0,fontFamily:"Outfit,sans-serif",paddingTop:2 }}>{row.l}</span>
                <span style={{ fontSize:13,color:"var(--text)",fontFamily:row.mono?"JetBrains Mono,monospace":"inherit",wordBreak:"break-all" }}>{row.v}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
