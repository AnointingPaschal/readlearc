"use client";
import { useRef, useEffect, useCallback, useState } from "react";
import {
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter,
  AlignRight, AlignJustify, List, ListOrdered, Link2, Image, Quote,
  Code, Undo2, Redo2, Type, Minus,
} from "lucide-react";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

const FONTS = ["Default","Outfit","Georgia","Times New Roman","Arial","Helvetica","Courier New","Verdana"];
const SIZES = ["12","14","16","18","20","24","28","32","36"];
const HEADINGS = [
  { label:"Paragraph", tag:"p"  },
  { label:"Heading 1", tag:"h1" },
  { label:"Heading 2", tag:"h2" },
  { label:"Heading 3", tag:"h3" },
];

function Btn({ onClick, active=false, title, children }: { onClick:()=>void; active?:boolean; title:string; children:React.ReactNode }) {
  return (
    <button type="button" title={title} onClick={onClick}
      style={{ width:28, height:26, borderRadius:4, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
        background: active ? "var(--brand-muted)" : "transparent",
        color: active ? "var(--brand)" : "var(--text-3)" }}
      onMouseEnter={e=>(e.currentTarget.style.background="var(--bg)")}
      onMouseLeave={e=>(e.currentTarget.style.background=active?"var(--brand-muted)":"transparent")}>
      {children}
    </button>
  );
}

function Divider() {
  return <div style={{ width:1, height:18, background:"var(--border)", margin:"0 2px", flexShrink:0 }}/>;
}

export default function RichEditor({ value, onChange, placeholder="Start writing…", minHeight=320 }: Props) {
  const editorRef  = useRef<HTMLDivElement>(null);
  const [mounted,  setMounted]  = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [showImg,  setShowImg]  = useState(false);
  const [linkUrl,  setLinkUrl]  = useState("https://");
  const [imgUrl,   setImgUrl]   = useState("https://");
  const savedRange = useRef<Range|null>(null);

  useEffect(() => {
    if (!mounted && editorRef.current) {
      editorRef.current.innerHTML = value || "";
      setMounted(true);
    }
  }, []);

  const exec = useCallback((cmd: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  }, [onChange]);

  const saveRange = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount) savedRange.current = sel.getRangeAt(0).cloneRange();
  };

  const restoreRange = () => {
    const sel = window.getSelection();
    if (sel && savedRange.current) { sel.removeAllRanges(); sel.addRange(savedRange.current); }
  };

  function insertLink() {
    restoreRange();
    if (linkUrl && linkUrl !== "https://") {
      exec("createLink", linkUrl);
    }
    setShowLink(false); setLinkUrl("https://");
  }

  function insertImage() {
    restoreRange();
    if (imgUrl && imgUrl !== "https://") {
      exec("insertHTML", `<img src="${imgUrl}" alt="image" style="max-width:100%;border-radius:8px;margin:8px 0;" />`);
    }
    setShowImg(false); setImgUrl("https://");
  }

  function insertHr() { exec("insertHTML", "<hr style='border:none;border-top:2px solid var(--border);margin:20px 0;'/>"); }

  const toolbarStyle: React.CSSProperties = {
    display:"flex", alignItems:"center", gap:2, padding:"6px 10px",
    background:"var(--bg-alt)", borderBottom:"1px solid var(--border)",
    flexWrap:"wrap", rowGap:4,
  };

  return (
    <div style={{ border:"1.5px solid var(--border)", borderRadius:"var(--r-lg)", overflow:"hidden", background:"var(--bg-card)" }}>

      {/* Toolbar */}
      <div style={toolbarStyle}>
        {/* Format block */}
        <select onChange={e=>exec("formatBlock",e.target.value)} defaultValue="p"
          style={{ height:26, padding:"0 6px", background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:4, fontSize:11, color:"var(--text-2)", cursor:"pointer", fontFamily:"inherit" }}>
          {HEADINGS.map(h=><option key={h.tag} value={h.tag}>{h.label}</option>)}
        </select>

        {/* Font */}
        <select onChange={e=>exec("fontName",e.target.value==="Default"?"":e.target.value)}
          style={{ height:26, padding:"0 6px", background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:4, fontSize:11, color:"var(--text-2)", cursor:"pointer" }}>
          {FONTS.map(f=><option key={f}>{f}</option>)}
        </select>

        {/* Size */}
        <select onChange={e=>exec("fontSize",e.target.value)}
          style={{ height:26, padding:"0 4px", background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:4, fontSize:11, color:"var(--text-2)", cursor:"pointer", width:52 }}>
          {["1","2","3","4","5","6","7"].map((s,i)=><option key={s} value={s}>{SIZES[i]}</option>)}
        </select>

        <Divider/>

        <Btn onClick={()=>exec("bold")} title="Bold"><Bold size={13}/></Btn>
        <Btn onClick={()=>exec("italic")} title="Italic"><Italic size={13}/></Btn>
        <Btn onClick={()=>exec("underline")} title="Underline"><Underline size={13}/></Btn>
        <Btn onClick={()=>exec("strikeThrough")} title="Strikethrough"><Strikethrough size={13}/></Btn>

        <Divider/>

        {/* Text color */}
        <label title="Text color" style={{ display:"flex", alignItems:"center", cursor:"pointer", position:"relative", width:26, height:26, borderRadius:4 }}>
          <Type size={13} style={{ color:"var(--text-3)", position:"absolute", left:7, pointerEvents:"none" }}/>
          <input type="color" defaultValue="#000000" onChange={e=>exec("foreColor",e.target.value)}
            style={{ opacity:0, width:26, height:26, cursor:"pointer", border:"none" }}/>
        </label>

        {/* Highlight */}
        <label title="Highlight" style={{ display:"flex", alignItems:"center", cursor:"pointer", position:"relative", width:26, height:26, borderRadius:4, background:"rgba(250,204,21,.3)" }}>
          <span style={{ fontSize:11, fontWeight:700, color:"#92400e", position:"absolute", left:8, pointerEvents:"none" }}>A</span>
          <input type="color" defaultValue="#fde68a" onChange={e=>exec("hiliteColor",e.target.value)}
            style={{ opacity:0, width:26, height:26, cursor:"pointer", border:"none" }}/>
        </label>

        <Divider/>

        <Btn onClick={()=>exec("justifyLeft")}   title="Align Left"><AlignLeft size={13}/></Btn>
        <Btn onClick={()=>exec("justifyCenter")} title="Center"><AlignCenter size={13}/></Btn>
        <Btn onClick={()=>exec("justifyRight")}  title="Align Right"><AlignRight size={13}/></Btn>
        <Btn onClick={()=>exec("justifyFull")}   title="Justify"><AlignJustify size={13}/></Btn>

        <Divider/>

        <Btn onClick={()=>exec("insertUnorderedList")} title="Bullet list"><List size={13}/></Btn>
        <Btn onClick={()=>exec("insertOrderedList")}   title="Numbered list"><ListOrdered size={13}/></Btn>
        <Btn onClick={()=>exec("formatBlock","blockquote")} title="Blockquote"><Quote size={13}/></Btn>
        <Btn onClick={()=>exec("formatBlock","pre")} title="Code block"><Code size={13}/></Btn>
        <Btn onClick={insertHr} title="Divider"><Minus size={13}/></Btn>

        <Divider/>

        <Btn onClick={()=>{saveRange();setShowLink(v=>!v);setShowImg(false);}} title="Insert link"><Link2 size={13}/></Btn>
        <Btn onClick={()=>{saveRange();setShowImg(v=>!v);setShowLink(false);}} title="Insert image"><Image size={13}/></Btn>

        <Divider/>

        <Btn onClick={()=>exec("undo")} title="Undo"><Undo2 size={13}/></Btn>
        <Btn onClick={()=>exec("redo")} title="Redo"><Redo2 size={13}/></Btn>
      </div>

      {/* Link input */}
      {showLink && (
        <div style={{ padding:"8px 12px", background:"var(--bg-alt)", borderBottom:"1px solid var(--border)", display:"flex", gap:8 }}>
          <input value={linkUrl} onChange={e=>setLinkUrl(e.target.value)} placeholder="https://..." onKeyDown={e=>e.key==="Enter"&&insertLink()}
            style={{ flex:1, padding:"5px 10px", border:"1.5px solid var(--brand-border)", borderRadius:"var(--r)", fontSize:12, background:"var(--bg-card)", color:"var(--text)", outline:"none" }} autoFocus/>
          <button onClick={insertLink} className="btn btn-primary btn-xs">Insert</button>
          <button onClick={()=>setShowLink(false)} className="btn btn-ghost btn-xs"><X size={12}/></button>
        </div>
      )}

      {/* Image input */}
      {showImg && (
        <div style={{ padding:"8px 12px", background:"var(--bg-alt)", borderBottom:"1px solid var(--border)", display:"flex", gap:8, flexWrap:"wrap" }}>
          <input value={imgUrl} onChange={e=>setImgUrl(e.target.value)} placeholder="Image URL…" onKeyDown={e=>e.key==="Enter"&&insertImage()}
            style={{ flex:1, minWidth:200, padding:"5px 10px", border:"1.5px solid var(--brand-border)", borderRadius:"var(--r)", fontSize:12, background:"var(--bg-card)", color:"var(--text)", outline:"none" }} autoFocus/>
          <button onClick={insertImage} className="btn btn-primary btn-xs">Insert</button>
          <button onClick={()=>setShowImg(false)} className="btn btn-ghost btn-xs">✕</button>
        </div>
      )}

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={()=>{ if(editorRef.current) onChange(editorRef.current.innerHTML); }}
        data-placeholder={placeholder}
        style={{
          minHeight, padding:"20px 24px", outline:"none",
          fontSize:16, lineHeight:1.8, color:"var(--text)",
          fontFamily:"Georgia,serif",
        }}
      />

      <style>{`
        [contenteditable]:empty:before { content:attr(data-placeholder); color:var(--text-4); pointer-events:none; }
        [contenteditable] h1{font-size:2em;font-weight:900;margin:0.5em 0;font-family:Outfit,sans-serif}
        [contenteditable] h2{font-size:1.5em;font-weight:800;margin:0.5em 0;font-family:Outfit,sans-serif}
        [contenteditable] h3{font-size:1.25em;font-weight:700;margin:0.5em 0;font-family:Outfit,sans-serif}
        [contenteditable] blockquote{border-left:3px solid var(--brand);padding-left:14px;margin:12px 0;font-style:italic;color:var(--text-3)}
        [contenteditable] pre{background:var(--bg-alt);border:1px solid var(--border);border-radius:8px;padding:12px;font-family:JetBrains Mono,monospace;font-size:13px;overflow-x:auto}
        [contenteditable] a{color:var(--brand);text-decoration:underline}
        [contenteditable] hr{border:none;border-top:2px solid var(--border);margin:20px 0}
        [contenteditable] ul,[contenteditable] ol{padding-left:24px}
        [contenteditable] li{margin:4px 0}
        [contenteditable] img{max-width:100%;border-radius:8px;margin:8px 0}
      `}</style>
    </div>
  );
}

// Need X import
function X({size}:{size:number}) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6 6 18M6 6l12 12"/></svg>; }
