
"use client";
import { useState, useEffect } from "react";
import { MessageCircle, Reply, Trash2, Edit3, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { useWallet } from "../../lib/wallet";
import type { Comment } from "../../lib/store";

interface Props { articleId: string; }

function timeAgo(ts: number) {
  const d = (Date.now()-ts)/1000;
  if (d<60) return "just now";
  if (d<3600) return `${Math.floor(d/60)}m ago`;
  if (d<86400) return `${Math.floor(d/3600)}h ago`;
  return `${Math.floor(d/86400)}d ago`;
}

function CommentItem({ c, address, articleId, onDelete, onEdit, depth=0 }: { c:Comment; address:string; articleId:string; onDelete:(id:string)=>void; onEdit:(id:string,text:string)=>void; depth?:number; }) {
  const [replying, setReplying] = useState(false);
  const [replyText,setReplyText]= useState("");
  const [editing,  setEditing]  = useState(false);
  const [editText, setEditText] = useState(c.text);
  const [showReplies,setShowReplies]=useState(true);
  const isOwn = address && c.authorAddress.toLowerCase()===address.toLowerCase();

  async function submitReply() {
    if (!replyText.trim()||!address) return;
    const profile = JSON.parse(localStorage.getItem(`rl-profile-${address.toLowerCase()}`)||"{}");
    await fetch(`/api/social/comments/${articleId}`, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ authorAddress:address, authorName:profile.displayName, text:replyText.trim(), parentId:c.id }),
    });
    setReplyText(""); setReplying(false);
    window.dispatchEvent(new Event("reload-comments"));
  }

  return (
    <div style={{ marginLeft:depth>0?20:0, borderLeft:depth>0?"2px solid var(--border)":"none", paddingLeft:depth>0?16:0 }}>
      <div style={{ padding:"12px 0", display:"flex", gap:10 }}>
        <div style={{ width:32, height:32, borderRadius:"50%", background:`linear-gradient(135deg,hsl(${(c.authorAddress.charCodeAt(2)*7)%360},60%,55%),hsl(${(c.authorAddress.charCodeAt(4)*11)%360},50%,45%))`, flexShrink:0, marginTop:2 }}/>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
            <span style={{ fontSize:12, fontWeight:700, color:"var(--text)" }}>{c.authorName || `${c.authorAddress.slice(0,8)}…`}</span>
            <span style={{ fontSize:10, color:"var(--text-4)" }}>{timeAgo(c.timestamp)}</span>
            {c.edited && <span style={{ fontSize:9, color:"var(--text-4)", fontStyle:"italic" }}>edited</span>}
          </div>
          {editing ? (
            <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
              <textarea value={editText} onChange={e=>setEditText(e.target.value)} rows={2} style={{ width:"100%", background:"var(--bg-alt)", border:"1.5px solid var(--border)", borderRadius:"var(--r2)", padding:"8px 10px", outline:"none", fontSize:13, color:"var(--text)", fontFamily:"inherit", resize:"vertical" }}/>
              <div style={{ display:"flex", gap:6 }}>
                <button onClick={() => { onEdit(c.id,editText); setEditing(false); }} className="btn btn-primary btn-xs"><Check size={11}/>Save</button>
                <button onClick={() => setEditing(false)} className="btn btn-ghost btn-xs"><X size={11}/>Cancel</button>
              </div>
            </div>
          ) : <p style={{ fontSize:13, color:"var(--text-2)", lineHeight:1.6, margin:0, wordBreak:"break-word" }}>{c.text}</p>}
          <div style={{ display:"flex", gap:10, marginTop:7, alignItems:"center" }}>
            {address && <button onClick={() => setReplying(v=>!v)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:11, color:"var(--text-4)", fontWeight:600, display:"flex", alignItems:"center", gap:3 }}><Reply size={11}/>Reply</button>}
            {isOwn && <><button onClick={() => setEditing(true)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:11, color:"var(--text-4)", fontWeight:600, display:"flex", alignItems:"center", gap:3 }}><Edit3 size={11}/>Edit</button><button onClick={() => onDelete(c.id)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:11, color:"#dc2626", fontWeight:600, display:"flex", alignItems:"center", gap:3 }}><Trash2 size={11}/>Delete</button></>}
          </div>
          {replying && (
            <div style={{ marginTop:10, display:"flex", flexDirection:"column", gap:6 }}>
              <textarea placeholder="Write a reply…" value={replyText} onChange={e=>setReplyText(e.target.value)} rows={2}
                style={{ width:"100%", background:"var(--bg-alt)", border:"1.5px solid var(--border)", borderRadius:"var(--r2)", padding:"8px 10px", outline:"none", fontSize:13, color:"var(--text)", fontFamily:"inherit", resize:"none" }}/>
              <div style={{ display:"flex", gap:6 }}>
                <button onClick={submitReply} className="btn btn-primary btn-xs">Post Reply</button>
                <button onClick={() => { setReplying(false); setReplyText(""); }} className="btn btn-ghost btn-xs">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Comments({ articleId }: Props) {
  const { address, isConnected } = useWallet();
  const [comments,  setComments]  = useState<Comment[]>([]);
  const [text,      setText]      = useState("");
  const [submitting,setSubmitting]= useState(false);

  async function load() {
    const res = await fetch(`/api/social/comments/${articleId}`);
    setComments(await res.json());
  }

  useEffect(() => {
    load();
    const h = () => load();
    window.addEventListener("reload-comments", h);
    return () => window.removeEventListener("reload-comments", h);
  }, [articleId]);

  async function submit() {
    if (!text.trim() || !address || submitting) return;
    setSubmitting(true);
    const profile = JSON.parse(localStorage.getItem(`rl-profile-${address.toLowerCase()}`)||"{}");
    await fetch(`/api/social/comments/${articleId}`, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ authorAddress:address, authorName:profile.displayName, text:text.trim() }),
    });
    setText(""); setSubmitting(false); load();
  }

  async function handleDelete(commentId: string) {
    await fetch(`/api/social/comments/${articleId}?commentId=${commentId}`, { method:"DELETE" });
    load();
  }

  async function handleEdit(commentId: string, newText: string) {
    await fetch(`/api/social/comments/${articleId}`, {
      method:"PATCH", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ commentId, text: newText }),
    });
    load();
  }

  const topLevel = comments.filter(c => !c.parentId);
  const replies  = comments.filter(c => c.parentId);
  const getReplies = (id: string) => replies.filter(r => r.parentId === id);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <MessageCircle size={17} style={{ color:"var(--brand)" }}/>
        <h3 style={{ fontFamily:"Outfit,sans-serif", fontSize:16, fontWeight:700, color:"var(--text)" }}>{comments.length} Comment{comments.length!==1?"s":""}</h3>
      </div>

      {isConnected ? (
        <div style={{ display:"flex", gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:"50%", background:`linear-gradient(135deg,var(--brand),var(--accent))`, flexShrink:0 }}/>
          <div style={{ flex:1 }}>
            <textarea placeholder="Share your thoughts…" value={text} onChange={e=>setText(e.target.value)} rows={3}
              style={{ width:"100%", background:"var(--bg-alt)", border:"1.5px solid var(--border)", borderRadius:"var(--r)", padding:"10px 13px", outline:"none", fontSize:13, color:"var(--text)", fontFamily:"inherit", resize:"vertical", marginBottom:8 }}
              onFocus={e=>(e.target as any).style.borderColor="var(--brand)"}
              onBlur={e=>(e.target as any).style.borderColor="var(--border)"}
            />
            <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
              <button onClick={submit} disabled={!text.trim()||submitting} className="btn btn-primary btn-sm" style={{ fontWeight:700 }}>
                {submitting?"Posting…":"Post Comment"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding:"14px 18px", background:"var(--bg-alt)", border:"1px solid var(--border)", borderRadius:"var(--r)", fontSize:13, color:"var(--text-3)", textAlign:"center" }}>
          Connect your wallet to leave a comment
        </div>
      )}

      {topLevel.length === 0 && <div style={{ textAlign:"center", padding:"24px 0", color:"var(--text-4)", fontSize:13 }}>No comments yet — be the first!</div>}

      <div style={{ display:"flex", flexDirection:"column" }}>
        {topLevel.map((c,i) => (
          <div key={c.id} style={{ borderTop:i>0?"1px solid var(--border)":"none" }}>
            <CommentItem c={c} address={address} articleId={articleId} onDelete={handleDelete} onEdit={handleEdit}/>
            {getReplies(c.id).map(r => (
              <CommentItem key={r.id} c={r} address={address} articleId={articleId} onDelete={handleDelete} onEdit={handleEdit} depth={1}/>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
