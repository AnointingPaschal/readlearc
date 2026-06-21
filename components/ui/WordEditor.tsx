"use client";
import { useRef, useEffect, useState, useCallback } from "react";
import {
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Link2, Image, Quote, Undo2, Redo2, Table,
  Superscript, Subscript, IndentIncrease, IndentDecrease, Type, Printer,
} from "lucide-react";

interface Props { value: string; onChange: (html: string) => void; placeholder?: string; }

const FONTS = ["Times New Roman","Arial","Calibri","Georgia","Helvetica","Courier New","Verdana","Garamond","Palatino","Trebuchet MS"];
const FONT_SIZES = [8,9,10,11,12,14,16,18,20,24,28,32,36,48,72];
const LINE_SPACINGS = [
  {l:"Single",v:"1"},{l:"1.15",v:"1.15"},{l:"1.5",v:"1.5"},
  {l:"Double",v:"2"},{l:"2.5",v:"2.5"},{l:"Triple",v:"3"},
];
const MARGINS = [
  {l:"Compact",v:"20px"},{l:'Normal (1")',v:"96px"},
  {l:'Narrow (0.5")',v:"48px"},{l:'Wide (2")',v:"192px"},
];
const HEADINGS = [
  {l:"Normal",t:"p"},{l:"Heading 1",t:"h1"},{l:"Heading 2",t:"h2"},
  {l:"Heading 3",t:"h3"},{l:"Heading 4",t:"h4"},
];
const SIZES_MAP = ["1","2","3","3","4","5","5","5","6","6","6","7","7","7","7"];

function Btn({onClick,title,children}:{onClick:()=>void;title:string;children:React.ReactNode}) {
  return (
    <button type="button" title={title} onClick={onClick}
      style={{minWidth:26,height:24,borderRadius:3,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",background:"transparent",color:"#374151",padding:"0 4px",flexShrink:0}}
      onMouseEnter={e=>(e.currentTarget.style.background="rgba(0,0,0,.07)")}
      onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
      {children}
    </button>
  );
}
function Sep() { return <div style={{width:1,height:16,background:"#e5e7eb",margin:"0 2px",flexShrink:0}}/>; }

export default function WordEditor({value,onChange,placeholder="Start writing…"}:Props) {
  const editorRef  = useRef<HTMLDivElement>(null);
  const [mounted,  setMounted]  = useState(false);
  const [margin,   setMargin]   = useState("20px");
  const [spacing,  setSpacing]  = useState("1.5");
  const [showLink, setShowLink] = useState(false);
  const [showImg,  setShowImg]  = useState(false);
  const [showTbl,  setShowTbl]  = useState(false);
  const [linkUrl,  setLinkUrl]  = useState("https://");
  const [imgUrl,   setImgUrl]   = useState("https://");
  const [tR,setTR]=useState(3); const [tC,setTC]=useState(3);
  const savedRange = useRef<Range|null>(null);

  useEffect(()=>{ if(!mounted&&editorRef.current){editorRef.current.innerHTML=value||"";setMounted(true);} },[]);

  const exec=useCallback((cmd:string,val?:string)=>{
    editorRef.current?.focus(); document.execCommand(cmd,false,val); emit();
  },[]);
  function emit(){if(editorRef.current)onChange(editorRef.current.innerHTML);}
  function saveR(){const s=window.getSelection();if(s&&s.rangeCount)savedRange.current=s.getRangeAt(0).cloneRange();}
  function restR(){const s=window.getSelection();if(s&&savedRange.current){s.removeAllRanges();s.addRange(savedRange.current);}}

  function insertLink(){restR();if(linkUrl!=="https://")exec("createLink",linkUrl);setShowLink(false);setLinkUrl("https://");}
  function insertImg(){restR();if(imgUrl!=="https://")exec("insertHTML",`<img src="${imgUrl}" alt="figure" style="max-width:100%;height:auto;margin:12px auto;display:block;border-radius:4px;"/>`);setShowImg(false);setImgUrl("https://");}
  function insertTbl(){const row="<tr>"+"<td style='border:1px solid #d1d5db;padding:6px 10px;min-width:60px'>&nbsp;</td>".repeat(tC)+"</tr>";restR();exec("insertHTML",`<table style="border-collapse:collapse;width:100%;margin:12px 0">${row.repeat(tR)}</table><p><br></p>`);setShowTbl(false);}

  const sel = (v:string)=>({height:24,padding:"0 4px",background:"white",border:"1px solid #e5e7eb",borderRadius:3,fontSize:11,color:"#374151",cursor:"pointer",maxWidth:"100%",flexShrink:1} as React.CSSProperties);

  return (
    <div style={{border:"1.5px solid var(--border)",borderRadius:"var(--r-lg)",overflow:"hidden",background:"#fff"}}>

      {/* Wrapping toolbar */}
      <div style={{background:"#f3f4f6",borderBottom:"1px solid #e5e7eb"}}>
        <div style={{display:"flex",alignItems:"center",padding:"3px 6px",gap:1,flexWrap:"wrap",rowGap:2}}>

          <Btn onClick={()=>exec("undo")} title="Undo"><Undo2 size={12}/></Btn>
          <Btn onClick={()=>exec("redo")} title="Redo"><Redo2 size={12}/></Btn>
          <Sep/>

          <select onChange={e=>exec("formatBlock",e.target.value)} defaultValue="p" style={{...sel(""),minWidth:80}}>
            {HEADINGS.map(h=><option key={h.l} value={h.t}>{h.l}</option>)}
          </select>
          <select onChange={e=>exec("fontName",e.target.value)} style={{...sel(""),minWidth:110}}>
            {FONTS.map(f=><option key={f} value={f}>{f}</option>)}
          </select>
          <select onChange={e=>exec("fontSize",e.target.value)} defaultValue="3" style={{...sel(""),minWidth:56}}>
            {FONT_SIZES.map((s,i)=><option key={s} value={SIZES_MAP[i]||"3"}>{s}pt</option>)}
          </select>
          <Sep/>

          <Btn onClick={()=>exec("bold")} title="Bold"><Bold size={12}/></Btn>
          <Btn onClick={()=>exec("italic")} title="Italic"><Italic size={12}/></Btn>
          <Btn onClick={()=>exec("underline")} title="Underline"><Underline size={12}/></Btn>
          <Btn onClick={()=>exec("strikeThrough")} title="Strikethrough"><Strikethrough size={12}/></Btn>
          <Btn onClick={()=>exec("superscript")} title="Superscript"><Superscript size={12}/></Btn>
          <Btn onClick={()=>exec("subscript")} title="Subscript"><Subscript size={12}/></Btn>
          <Sep/>

          {/* Text colour */}
          <label title="Font Color" style={{width:26,height:24,borderRadius:3,cursor:"pointer",position:"relative",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <Type size={12} style={{color:"#374151",position:"absolute",pointerEvents:"none"}}/>
            <input type="color" defaultValue="#000000" onChange={e=>exec("foreColor",e.target.value)} style={{opacity:0,width:"100%",height:"100%",cursor:"pointer",border:"none",position:"absolute"}}/>
          </label>
          <label title="Highlight" style={{width:26,height:24,borderRadius:3,cursor:"pointer",position:"relative",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,background:"rgba(253,230,138,.5)"}}>
            <span style={{fontSize:9,fontWeight:900,color:"#78350f",position:"absolute",pointerEvents:"none"}}>HL</span>
            <input type="color" defaultValue="#fde68a" onChange={e=>exec("hiliteColor",e.target.value)} style={{opacity:0,width:"100%",height:"100%",cursor:"pointer",border:"none",position:"absolute"}}/>
          </label>
          <Sep/>

          <Btn onClick={()=>exec("justifyLeft")} title="Left"><AlignLeft size={12}/></Btn>
          <Btn onClick={()=>exec("justifyCenter")} title="Center"><AlignCenter size={12}/></Btn>
          <Btn onClick={()=>exec("justifyRight")} title="Right"><AlignRight size={12}/></Btn>
          <Btn onClick={()=>exec("justifyFull")} title="Justify"><AlignJustify size={12}/></Btn>
          <Sep/>

          <Btn onClick={()=>exec("insertUnorderedList")} title="Bullets"><List size={12}/></Btn>
          <Btn onClick={()=>exec("insertOrderedList")} title="Numbered"><ListOrdered size={12}/></Btn>
          <Btn onClick={()=>exec("indent")} title="Indent"><IndentIncrease size={12}/></Btn>
          <Btn onClick={()=>exec("outdent")} title="Outdent"><IndentDecrease size={12}/></Btn>
          <Btn onClick={()=>exec("formatBlock","blockquote")} title="Blockquote"><Quote size={12}/></Btn>
          <Sep/>

          <Btn onClick={()=>{saveR();setShowLink(v=>!v);setShowImg(false);setShowTbl(false);}} title="Link"><Link2 size={12}/></Btn>
          <Btn onClick={()=>{saveR();setShowImg(v=>!v);setShowLink(false);setShowTbl(false);}} title="Image"><Image size={12}/></Btn>
          <Btn onClick={()=>{saveR();setShowTbl(v=>!v);setShowLink(false);setShowImg(false);}} title="Table"><Table size={12}/></Btn>
          <Sep/>

          <select value={spacing} onChange={e=>{setSpacing(e.target.value);if(editorRef.current){editorRef.current.style.lineHeight=e.target.value;emit();}}} style={{...sel(""),minWidth:70}}>
            {LINE_SPACINGS.map(l=><option key={l.v} value={l.v}>{l.l}</option>)}
          </select>
          <select value={margin} onChange={e=>setMargin(e.target.value)} style={{...sel(""),minWidth:90}}>
            {MARGINS.map(m=><option key={m.v} value={m.v}>{m.l}</option>)}
          </select>
          <Sep/>
          <Btn onClick={()=>{const w=window.open("","_blank");if(!w)return;w.document.write(`<html><head><style>body{font-family:Times New Roman,serif;font-size:12pt;margin:${margin};line-height:${spacing}}h1{font-size:2em}h2{font-size:1.5em}h3{font-size:1.25em}table{border-collapse:collapse;width:100%}td{border:1px solid #ccc;padding:6px}img{max-width:100%}@media print{body{margin:1in}}</style></head><body>${editorRef.current?.innerHTML||""}</body></html>`);w.document.close();w.print();}} title="Print"><Printer size={12}/></Btn>
        </div>
      </div>

      {/* Inline inputs */}
      {showLink&&<div style={{padding:"6px 10px",background:"#f9fafb",borderBottom:"1px solid #e5e7eb",display:"flex",gap:6,flexWrap:"wrap"}}>
        <input value={linkUrl} onChange={e=>setLinkUrl(e.target.value)} onKeyDown={e=>e.key==="Enter"&&insertLink()} placeholder="https://…" autoFocus style={{flex:1,minWidth:160,padding:"4px 8px",border:"1px solid #d1d5db",borderRadius:4,fontSize:12,outline:"none"}}/>
        <button onClick={insertLink} style={{padding:"4px 10px",background:"var(--brand)",color:"white",border:"none",borderRadius:4,cursor:"pointer",fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>Insert Link</button>
        <button onClick={()=>setShowLink(false)} style={{padding:"4px 8px",border:"1px solid #e5e7eb",borderRadius:4,cursor:"pointer",fontSize:11,background:"transparent"}}>✕</button>
      </div>}

      {showImg&&<div style={{padding:"6px 10px",background:"#f9fafb",borderBottom:"1px solid #e5e7eb",display:"flex",gap:6,flexWrap:"wrap"}}>
        <input value={imgUrl} onChange={e=>setImgUrl(e.target.value)} onKeyDown={e=>e.key==="Enter"&&insertImg()} placeholder="Image URL…" autoFocus style={{flex:1,minWidth:160,padding:"4px 8px",border:"1px solid #d1d5db",borderRadius:4,fontSize:12,outline:"none"}}/>
        <label style={{display:"flex",alignItems:"center",gap:4,padding:"4px 9px",background:"#f3f4f6",border:"1px solid #e5e7eb",borderRadius:4,cursor:"pointer",fontSize:11,whiteSpace:"nowrap"}}>
          📎 Upload
          <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>setImgUrl(ev.target?.result as string);r.readAsDataURL(f);}}/>
        </label>
        <button onClick={insertImg} style={{padding:"4px 10px",background:"var(--brand)",color:"white",border:"none",borderRadius:4,cursor:"pointer",fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>Insert</button>
        <button onClick={()=>setShowImg(false)} style={{padding:"4px 8px",border:"1px solid #e5e7eb",borderRadius:4,cursor:"pointer",fontSize:11,background:"transparent"}}>✕</button>
      </div>}

      {showTbl&&<div style={{padding:"6px 10px",background:"#f9fafb",borderBottom:"1px solid #e5e7eb",display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:11,color:"#6b7280",whiteSpace:"nowrap"}}>Rows:</span>
        <input type="number" min={1} max={20} value={tR} onChange={e=>setTR(parseInt(e.target.value)||2)} style={{width:44,padding:"3px 6px",border:"1px solid #d1d5db",borderRadius:4,fontSize:12,outline:"none"}}/>
        <span style={{fontSize:11,color:"#6b7280",whiteSpace:"nowrap"}}>Cols:</span>
        <input type="number" min={1} max={10} value={tC} onChange={e=>setTC(parseInt(e.target.value)||2)} style={{width:44,padding:"3px 6px",border:"1px solid #d1d5db",borderRadius:4,fontSize:12,outline:"none"}}/>
        <button onClick={insertTbl} style={{padding:"4px 10px",background:"var(--brand)",color:"white",border:"none",borderRadius:4,cursor:"pointer",fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>Insert Table</button>
        <button onClick={()=>setShowTbl(false)} style={{padding:"4px 8px",border:"1px solid #e5e7eb",borderRadius:4,cursor:"pointer",fontSize:11,background:"transparent"}}>✕</button>
      </div>}

      {/* Page canvas */}
      <div style={{background:"#e5e7eb",padding:"clamp(8px,3vw,20px) 0",minHeight:340,overflowY:"auto",overflowX:"hidden"}}>
        <div style={{background:"white",maxWidth:816,width:"100%",margin:"0 auto",minHeight:400,boxShadow:"0 2px 16px rgba(0,0,0,.15)",padding:margin,boxSizing:"border-box"}}>
          <div ref={editorRef} contentEditable suppressContentEditableWarning onInput={emit}
            data-placeholder={placeholder}
            style={{outline:"none",fontSize:"12pt",lineHeight:spacing,color:"#000",fontFamily:"Times New Roman,serif",minHeight:360,wordBreak:"break-word"}}/>
        </div>
      </div>

      <style>{`
        [contenteditable][data-placeholder]:empty:before{content:attr(data-placeholder);color:#9ca3af;pointer-events:none}
        [contenteditable] h1{font-size:2em;font-weight:bold;margin:.4em 0}
        [contenteditable] h2{font-size:1.5em;font-weight:bold;margin:.4em 0}
        [contenteditable] h3{font-size:1.25em;font-weight:bold;margin:.4em 0}
        [contenteditable] h4{font-size:1.1em;font-weight:bold;margin:.4em 0}
        [contenteditable] blockquote{border-left:3px solid #6b7280;padding-left:14px;margin:10px 0;color:#4b5563;font-style:italic}
        [contenteditable] table{border-collapse:collapse;width:100%;margin:10px 0}
        [contenteditable] td,[contenteditable] th{border:1px solid #d1d5db;padding:5px 8px;min-width:40px}
        [contenteditable] ul,[contenteditable] ol{padding-left:24px}
        [contenteditable] li{margin:2px 0}
        [contenteditable] a{color:#2563eb;text-decoration:underline}
        [contenteditable] img{max-width:100%;height:auto;display:block;margin:10px auto}
      `}</style>
    </div>
  );
}
