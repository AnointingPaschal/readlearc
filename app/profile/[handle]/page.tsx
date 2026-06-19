
"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, DollarSign, Users, Clock, ExternalLink, Globe, PenLine, RefreshCw, UserPlus, Heart } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "../../../components/ui/Navbar";
import SetupBanner from "../../../components/ui/SetupBanner";
import FollowButton from "../../../components/social/FollowButton";
import { useWallet } from "../../../lib/wallet";
import { fetchWriterStats, EXPLORER_URL, type Article } from "../../../lib/chain";

const GRADS = [
  "linear-gradient(135deg,#6d28d9,#059669)",
  "linear-gradient(135deg,#0284c7,#7c3aed)",
  "linear-gradient(135deg,#d97706,#dc2626)",
  "linear-gradient(135deg,#059669,#0284c7)",
  "linear-gradient(135deg,#7c3aed,#ec4899)",
  "linear-gradient(135deg,#ea580c,#eab308)",
];

function loadProfile(addr: string) {
  try { return JSON.parse(localStorage.getItem(`rl-profile-${addr.toLowerCase()}`)||"{}"); } catch { return {}; }
}

export default function ProfilePage() {
  const { handle }   = useParams<{ handle: string }>();
  const profileAddr  = handle;
  const { address, isConnected, provider } = useWallet();
  const isOwn        = isConnected && address && profileAddr && address.toLowerCase()===profileAddr.toLowerCase();
  const [articles,  setArticles]  = useState<Article[]>([]);
  const [earned,    setEarned]    = useState(0);
  const [reads,     setReads]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);
  const [profile,   setProfile]   = useState<any>({});
  const [followers, setFollowers] = useState<number>(0);
  const [following, setFollowing] = useState<number>(0);

  async function load() {
    if (!profileAddr) return;
    setRefreshing(true);
    setProfile(loadProfile(profileAddr));
    const [stats, followerList, followingList] = await Promise.all([
      fetchWriterStats(profileAddr, provider||undefined),
      fetch(`/api/social/follow?address=${profileAddr.toLowerCase()}&action=followers`).then(r=>r.json()).catch(()=>[]),
      fetch(`/api/social/follow?address=${profileAddr.toLowerCase()}&action=following`).then(r=>r.json()).catch(()=>[]),
    ]);
    setArticles(stats.articles);
    setEarned(stats.totalEarned);
    setReads(stats.totalReads);
    setFollowers((followerList as string[]).length);
    setFollowing((followingList as string[]).length);
    setLoading(false); setRefreshing(false);
  }

  useEffect(() => { load(); }, [profileAddr, provider]);

  const grad = GRADS[profile.avatarIdx??0];
  const name = profile.displayName || (profileAddr ? profileAddr.slice(0,8)+"…"+profileAddr.slice(-4) : "…");

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <SetupBanner/><Navbar/>
      <div style={{ maxWidth:780, margin:"0 auto", padding:"76px 16px 60px" }}>
        <motion.div initial={{ opacity:0,x:-8 }} animate={{ opacity:1,x:0 }} style={{ marginBottom:22 }}>
          <Link href="/explore" className="btn btn-ghost btn-sm"><ArrowLeft size={14}/>Explore</Link>
        </motion.div>

        {/* Profile header */}
        <motion.div initial={{ opacity:0,y:14 }} animate={{ opacity:1,y:0 }} className="card" style={{ padding:"clamp(18px,4vw,28px)", marginBottom:16 }}>
          <div style={{ display:"flex", flexWrap:"wrap", gap:18, alignItems:"flex-start" }}>
            <div style={{ width:72, height:72, borderRadius:18, background:grad, flexShrink:0, boxShadow:"var(--shadow)" }}/>
            <div style={{ flex:1, minWidth:180 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4, flexWrap:"wrap" }}>
                <h1 style={{ fontFamily:"Outfit,sans-serif", fontSize:"clamp(18px,4vw,24px)", fontWeight:900, color:"var(--text)", letterSpacing:"-0.02em" }}>{name}</h1>
              </div>
              <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:10, color:"var(--text-4)", marginBottom:8 }}>{profileAddr}</div>
              {profile.bio && <p style={{ fontSize:13, color:"var(--text-3)", lineHeight:1.65, marginBottom:8 }}>{profile.bio}</p>}
              <div style={{ display:"flex", gap:14, flexWrap:"wrap", fontSize:11, color:"var(--text-4)" }}>
                <span><strong style={{ color:"var(--text-2)" }}>{followers}</strong> followers</span>
                <span><strong style={{ color:"var(--text-2)" }}>{following}</strong> following</span>
                {profile.website && <a href={profile.website} target="_blank" rel="noopener noreferrer" style={{ display:"flex", alignItems:"center", gap:4, color:"var(--brand)", textDecoration:"none", fontWeight:600 }}><Globe size={11}/>Website</a>}
                <a href={`${EXPLORER_URL}/address/${profileAddr}`} target="_blank" rel="noopener noreferrer" style={{ display:"flex", alignItems:"center", gap:4, color:"var(--text-4)", textDecoration:"none" }}><ExternalLink size={10}/>On-chain</a>
              </div>
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:14, alignItems:"flex-start" }}>
              {loading ? [1,2,3].map(i=><div key={i} className="skeleton" style={{ width:60,height:44,borderRadius:8 }}/>) :
                [
                  { label:"Articles", value:articles.length.toString(), color:"var(--brand)" },
                  { label:"Reads",    value:reads.toLocaleString(),     color:"#0284c7"      },
                  { label:"Earned",   value:`$${earned.toFixed(2)}`,    color:"#059669"      },
                ].map(s=>(
                  <div key={s.label} style={{ textAlign:"center", minWidth:54 }}>
                    <div style={{ fontFamily:"Outfit,sans-serif", fontSize:"clamp(18px,3vw,22px)", fontWeight:900, color:s.color, lineHeight:1 }}>{s.value}</div>
                    <div style={{ fontSize:9, color:"var(--text-4)", fontWeight:700, marginTop:3, textTransform:"uppercase", letterSpacing:".05em" }}>{s.label}</div>
                  </div>
                ))
              }
            </div>
          </div>
          <div style={{ marginTop:16, paddingTop:14, borderTop:"1px solid var(--border)", display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
            {!isOwn && profileAddr && <FollowButton targetAddress={profileAddr}/>}
            {isOwn && <><Link href="/account" className="btn btn-ghost btn-sm">Edit Profile</Link><Link href="/write" className="btn btn-primary btn-sm" style={{ fontWeight:700 }}><PenLine size={12}/>New Article</Link></>}
            <button onClick={load} disabled={refreshing} style={{ width:32,height:32,borderRadius:"50%",border:"1.5px solid var(--border)",background:"var(--bg-alt)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text-3)",marginLeft:"auto" }}>
              <RefreshCw size={12} className={refreshing?"spin":""}/>
            </button>
          </div>
        </motion.div>

        {/* Articles */}
        <h2 style={{ fontFamily:"Outfit,sans-serif", fontSize:16, fontWeight:700, color:"var(--text)", marginBottom:12 }}>Published Articles</h2>
        {loading ? <div style={{ display:"flex", flexDirection:"column", gap:9 }}>{[1,2,3].map(i=><div key={i} className="skeleton" style={{ height:76,borderRadius:14 }}/>)}</div>
        : articles.length===0 ? (
          <div className="card" style={{ padding:"48px 24px", textAlign:"center" }}>
            <BookOpen size={32} style={{ color:"var(--text-4)", marginBottom:12 }}/>
            <p style={{ fontSize:14, fontWeight:600, color:"var(--text-3)" }}>No articles published yet</p>
            {isOwn && <Link href="/write" className="btn btn-primary btn-sm" style={{ marginTop:14 }}>Write First Article</Link>}
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
            {articles.map((a,i)=>(
              <motion.div key={a.id} initial={{ opacity:0,y:6 }} animate={{ opacity:1,y:0 }} transition={{ delay:.05*i }}>
                <Link href={`/article/${a.id}`} style={{ textDecoration:"none" }}>
                  <div className="card card-hover" style={{ padding:"16px 18px", display:"flex", alignItems:"flex-start", gap:12 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:5, flexWrap:"wrap" }}>
                        <span className="badge badge-brand" style={{ textTransform:"capitalize", fontSize:9 }}>{a.category}</span>
                        <span className="price-tag">${a.price} USDC</span>
                      </div>
                      <h3 style={{ fontFamily:"Outfit,sans-serif", fontSize:14, fontWeight:700, color:"var(--text)", lineHeight:1.35, marginBottom:5, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" as any, overflow:"hidden" }}>{a.title}</h3>
                      <div style={{ display:"flex", gap:10, fontSize:11, color:"var(--text-4)" }}>
                        <span style={{ display:"flex", alignItems:"center", gap:2 }}><Clock size={10}/>{a.readTime}m</span>
                        <span style={{ display:"flex", alignItems:"center", gap:2 }}><Users size={10}/>{a.reads}</span>
                        <span style={{ display:"flex", alignItems:"center", gap:2 }}><DollarSign size={10} style={{ color:"#059669" }}/>${(a.reads*parseFloat(a.price)*.85).toFixed(2)} earned</span>
                      </div>
                    </div>
                    <ExternalLink size={13} style={{ color:"var(--text-4)", flexShrink:0, marginTop:2 }}/>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
