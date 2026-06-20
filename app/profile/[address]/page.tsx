"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { BookOpen, Users, DollarSign, Clock, UserPlus, UserMinus, Zap } from "lucide-react";
import Navbar from "../../../components/ui/Navbar";
import SetupBanner from "../../../components/ui/SetupBanner";
import { useAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";

export default function ProfilePage() {
  const { address: profileAddr } = useParams<{ address: string }>();
  const { address, isAuth } = useAuth();
  const [articles,   setArticles]  = useState<any[]>([]);
  const [followers,  setFollowers] = useState(0);
  const [following,  setFollowing] = useState(false);
  const [loading,    setLoading]   = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: arts } = await supabase.from("articles")
        .select("id,title,blurb,category,price,read_time,reads,created_at,is_research")
        .ilike("author_address", profileAddr)
        .in("status", ["approved","featured"])
        .order("created_at", { ascending: false }).limit(20);
      setArticles(arts || []);

      const { data: fols } = await supabase.from("follows").select("id").ilike("following_address", profileAddr);
      setFollowers((fols||[]).length);

      if (address) {
        const { data: isF } = await supabase.from("follows").select("id")
          .ilike("follower_address", address).ilike("following_address", profileAddr).maybeSingle();
        setFollowing(!!isF);
      }
      setLoading(false);
    }
    load();
  }, [profileAddr, address]);

  async function toggleFollow() {
    if (!address) return;
    const res = await fetch("/api/social/follow", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ follower: address, target: profileAddr }),
    });
    const d = await res.json();
    setFollowing(d.following); setFollowers(d.followers);
  }

  const short = (a: string) => `${a.slice(0,6)}…${a.slice(-4)}`;
  const isOwn = address?.toLowerCase() === profileAddr?.toLowerCase();
  const totalReads = articles.reduce((s,a) => s+a.reads, 0);
  const totalEarned = articles.reduce((s,a) => s + a.reads*parseFloat(a.price)*0.85, 0);

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <SetupBanner/><Navbar/>
      <div style={{ maxWidth:860, margin:"0 auto", padding:"calc(var(--header-h) + 28px) 14px 60px" }}>

        <div className="card" style={{ padding:"clamp(24px,5vw,40px)", marginBottom:24 }}>
          <div style={{ display:"flex", alignItems:"flex-start", gap:18, flexWrap:"wrap" }}>
            <div style={{ width:64,height:64,borderRadius:"50%",background:`linear-gradient(135deg,hsl(${parseInt(profileAddr?.slice(2,4)||"0",16)*1.4}deg,65%,55%),hsl(${parseInt(profileAddr?.slice(4,6)||"0",16)*1.4}deg,55%,45%))`,flexShrink:0 }}/>
            <div style={{ flex:1, minWidth:180 }}>
              <h1 style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"clamp(14px,3vw,18px)", fontWeight:700, color:"var(--text)", marginBottom:6 }}>{short(profileAddr||"")}</h1>
              <p style={{ fontSize:11, color:"var(--text-4)", fontFamily:"JetBrains Mono,monospace", wordBreak:"break-all", marginBottom:12 }}>{profileAddr}</p>
              <div style={{ display:"flex", gap:18, flexWrap:"wrap" }}>
                {[
                  { v:articles.length.toString(),     l:"Articles"                         },
                  { v:followers.toString(),             l:"Followers"                        },
                  { v:totalReads.toLocaleString(),      l:"Total Reads"                      },
                  { v:`$${totalEarned.toFixed(2)}`,    l:"Est. Earned", c:"var(--accent)"   },
                ].map(s=>(
                  <div key={s.l}>
                    <div style={{ fontFamily:"Outfit,sans-serif", fontSize:20, fontWeight:900, color:s.c||"var(--text)", lineHeight:1 }}>{s.v}</div>
                    <div style={{ fontSize:10, color:"var(--text-4)", marginTop:3 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ flexShrink:0 }}>
              {isOwn
                ? <Link href="/creator" className="btn btn-secondary btn-sm">Creator Studio</Link>
                : isAuth
                  ? <button onClick={toggleFollow} className={`btn btn-sm ${following?"btn-secondary":"btn-primary"}`} style={{ fontWeight:700 }}>
                      {following?<><UserMinus size={13}/>Unfollow</>:<><UserPlus size={13}/>Follow</>}
                    </button>
                  : null
              }
            </div>
          </div>
        </div>

        <h2 style={{ fontFamily:"Outfit,sans-serif", fontSize:18, fontWeight:900, color:"var(--text)", marginBottom:14, letterSpacing:"-0.02em" }}>Published Articles</h2>

        {loading ? (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:12 }}>
            {[1,2,3].map(i=><div key={i} className="skeleton" style={{ height:180, borderRadius:"var(--r-lg)" }}/>)}
          </div>
        ) : articles.length===0 ? (
          <div className="card" style={{ padding:"40px 24px", textAlign:"center" }}>
            <BookOpen size={28} style={{ color:"var(--text-4)", marginBottom:10 }}/>
            <p style={{ fontSize:14, color:"var(--text-3)" }}>No published articles yet.</p>
            {isOwn && <Link href="/write" className="btn btn-primary btn-sm" style={{ marginTop:14 }}>Write First Article</Link>}
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:12 }}>
            {articles.map(a=>(
              <Link key={a.id} href={`/article/${a.id}`} style={{ textDecoration:"none" }}>
                <div className="card card-hover" style={{ padding:"18px 16px", height:"100%", display:"flex", flexDirection:"column", gap:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:6 }}>
                    <span className="badge badge-brand" style={{ textTransform:"capitalize" }}>{a.category}</span>
                    <span className="price-tag">${parseFloat(a.price).toFixed(3)}</span>
                  </div>
                  <h3 style={{ fontFamily:"Outfit,sans-serif", fontSize:14, fontWeight:700, color:"var(--text)", lineHeight:1.3, flex:1,
                    display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" as any, overflow:"hidden" }}>{a.title}</h3>
                  <p style={{ fontSize:11, color:"var(--text-3)", lineHeight:1.55,
                    display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" as any, overflow:"hidden" }}>{a.blurb}</p>
                  <div style={{ paddingTop:8, borderTop:"1px solid var(--border)", display:"flex", justifyContent:"space-between", fontSize:10, color:"var(--text-4)" }}>
                    <span style={{ display:"flex", alignItems:"center", gap:2 }}><Clock size={9}/>{a.read_time}m</span>
                    <span style={{ display:"flex", alignItems:"center", gap:2 }}><Users size={9}/>{a.reads}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
