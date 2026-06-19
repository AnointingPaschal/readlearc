
"use client";
import { useState, useEffect } from "react";
import { UserPlus, UserCheck, UserMinus } from "lucide-react";
import { useWallet } from "../../lib/wallet";

interface Props { targetAddress: string; }

export default function FollowButton({ targetAddress }: Props) {
  const { address, isConnected } = useWallet();
  const [following,  setFollowing]  = useState(false);
  const [followers,  setFollowers]  = useState(0);
  const [hovering,   setHovering]   = useState(false);
  const [loading,    setLoading]    = useState(false);

  const isSelf = address && targetAddress && address.toLowerCase()===targetAddress.toLowerCase();

  useEffect(() => {
    if (!address || !targetAddress || isSelf) return;
    fetch(`/api/social/follow?address=${address.toLowerCase()}&action=following`)
      .then(r=>r.json()).then((list:string[])=>setFollowing(list.includes(targetAddress.toLowerCase())));
    fetch(`/api/social/follow?address=${targetAddress.toLowerCase()}&action=followers`)
      .then(r=>r.json()).then((list:string[])=>setFollowers(list.length));
  }, [address, targetAddress]);

  async function toggle() {
    if (!isConnected || !address || loading || isSelf) return;
    setLoading(true);
    const res  = await fetch("/api/social/follow", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ follower:address.toLowerCase(), target:targetAddress.toLowerCase() }),
    });
    const data = await res.json();
    setFollowing(data.following);
    setFollowers(data.followers);
    setLoading(false);
  }

  if (isSelf) return null;
  if (!isConnected) return null;

  return (
    <button onClick={toggle} disabled={loading}
      onMouseEnter={()=>setHovering(true)} onMouseLeave={()=>setHovering(false)}
      style={{ display:"flex", alignItems:"center", gap:7, padding:"8px 18px", borderRadius:"var(--rfull)", fontWeight:700, fontSize:13, cursor:"pointer", transition:"all .18s", border:"1.5px solid",
        background:following?(hovering?"rgba(220,38,38,.06)":"var(--bg-card)"):"var(--brand)",
        borderColor:following?(hovering?"rgba(220,38,38,.3)":"var(--border-mid)"):"transparent",
        color:following?(hovering?"#dc2626":"var(--text)"):"white" }}>
      {loading ? <div style={{ width:13,height:13,border:"2px solid currentColor",borderTopColor:"transparent",borderRadius:"50%"}} className="spin"/>
        : following ? (hovering ? <><UserMinus size={13}/>Unfollow</> : <><UserCheck size={13}/>Following</>)
        : <><UserPlus size={13}/>Follow</>}
      {followers > 0 && <span style={{ fontSize:10, fontWeight:600, opacity:.65 }}>{followers}</span>}
    </button>
  );
}
