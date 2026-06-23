"use client";
import { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import {
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter,
  AlignRight, AlignJustify, List, ListOrdered, Link2, Image as ImageIcon,
  Quote, Undo2, Redo2, Table, Superscript, Subscript,
  IndentIncrease, IndentDecrease, Type, Printer, ChevronDown, X,
} from "lucide-react";

export interface WordEditorHandle {
  applyFormat: (spec: FormatSpec) => void;
  getContent: () => string;
  setContent: (html: string) => void;
}

export interface FormatSpec {
  fontFamily?: string;
  fontSize?: number;
  lineSpacing?: string;
  margin?: string;
}

interface Props { value: string; onChange: (html: string) => void; placeholder?: string; }

const FONTS = ["Times New Roman","Arial","Calibri","Georgia","Helvetica","Courier New","Verdana","Garamond","Palatino Linotype","Trebuchet MS"];
const FONT_SIZES = [8,9,10,11,12,14,16,18,20,24,28,32,36,48,72];
const LINE_SPACINGS = [
  {l:"Single",v:"1"},{l:"1.15",v:"1.15"},{l:"1.5",v:"1.5"},
  {l:"Double",v:"2"},{l:"2.5",v:"2.5"},{l:"Triple",v:"3"},
];
const MARGINS = [
  {l:"Compact",v:"20px"},{l:'Narrow (0.5")',v:"48px"},
  {l:'Normal (1")',v:"96px"},{l:'Wide (2")',v:"192px"},
  {l:'3mm',v:"11px"},{l:'5mm',v:"19px"},{l:'10mm',v:"38px"},
  {l:'15mm',v:"57px"},{l:'20mm',v:"76px"},{l:'25mm',v:"96px"},
];
const HEADINGS = [
  {l:"Normal",t:"p"},{l:"Heading 1",t:"h1"},{l:"Heading 2",t:"h2"},
  {l:"Heading 3",t:"h3"},{l:"Heading 4",t:"h4"},
];

function pd(e: React.MouseEvent) { e.preventDefault(); }

function Btn({ onCmd, title, active, children }: { onCmd:()=>void; title:string; active?:boolean; children:React.ReactNode }) {
  return (
    <button type="button" title={title}
      onMouseDown={e=>{e.preventDefault();onCmd();}}
      style={{ minWidth:26,height:26,borderRadius:4,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",background:active?"rgba(79,70,229,.12)":"transparent",color:active?"#4f46e5":"#374151",padding:"0 4px",flexShrink:0 }}
      onMouseEnter={e=>{if(!active)e.currentTarget.style.background="rgba(0,0,0,.07)";}}
      onMouseLeave={e=>{if(!active)e.currentTarget.style.background="transparent";}}
    >{children}</button>
  );
}
function Sep() { return <div style={{width:1,height:16,background:"#e5e7eb",margin:"0 3px",flexShrink:0}}/>; }

function ToolDropdown({ label, width, items, onSelect }: {
  label:string; width:number;
  items:{label:string;value:string;style?:React.CSSProperties}[];
  onSelect:(v:string)=>void;
}) {
  const [open,setOpen]=useState(false);
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(!open) return;
    function close(e:MouseEvent){if(ref.current&&!ref.current.contains(e.target as Node))setOpen(false);}
    document.addEventListener("mousedown",close);
    return()=>document.removeEventListener("mousedown",close);
  },[open]);
  return (
    <div ref={ref} style={{position:"relative",flexShrink:0}} onMouseDown={pd}>
      <div onMouseDown={e=>{e.preventDefault();setOpen(o=>!o);}}
        style={{display:"flex",alignItems:"center",gap:3,height:26,padding:"0 6px 0 7px",background:"white",border:"1px solid #e5e7eb",borderRadius:4,fontSize:11,color:"#374151",cursor:"pointer",userSelect:"none",minWidth:width,maxWidth:width}}>
        <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{label}</span>
        <ChevronDown size={10} style={{flexShrink:0,color:"#9ca3af"}}/>
      </div>
      {open&&(
        <div style={{position:"absolute",top:"calc(100% + 2px)",left:0,zIndex:9999,background:"white",border:"1px solid #e5e7eb",borderRadius:6,boxShadow:"0 6px 20px rgba(0,0,0,.12)",minWidth:width+20,maxHeight:220,overflowY:"auto",padding:"3px 0"}}>
          {items.map(item=>(
            <div key={item.value} onMouseDown={e=>{e.preventDefault();onSelect(item.value);setOpen(false);}}
              style={{padding:"6px 12px",fontSize:12,cursor:"pointer",color:"#374151",lineHeight:1.4,...item.style}}
              onMouseEnter={e=>(e.currentTarget.style.background="#f3f4f6")}
              onMouseLeave={e=>(e.currentTarget.style.background="transparent")}
            >{item.label}</div>
          ))}
        </div>
      )}
    </div>
  );
}

const WordEditor = forwardRef<WordEditorHandle, Props>(function WordEditor({ value, onChange, placeholder="Start writing…" }, ref) {
  const editorRef   = useRef<HTMLDivElement>(null);
  const [mounted,   setMounted]   = useState(false);
  const [margin,    setMargin]    = useState("20px");
  const [spacing,   setSpacing]   = useState("1.5");
  const [heading,   setHeading]   = useState("Normal");
  const [fontName,  setFontName]  = useState("Times New Roman");
  const [fontSize,  setFontSize]  = useState(12);
  const [showLink,  setShowLink]  = useState(false);
  const [showImg,   setShowImg]   = useState(false);
  const [showTbl,   setShowTbl]   = useState(false);
  const [linkUrl,   setLinkUrl]   = useState("https://");
  const [imgUrl,    setImgUrl]    = useState("https://");
  const [tR,setTR]=useState(3); const [tC,setTC]=useState(3);
  const savedRange = useRef<Range|null>(null);

  useEffect(()=>{
    if(!mounted&&editorRef.current){editorRef.current.innerHTML=value||"";setMounted(true);}
  },[]);

  const exec = useCallback((cmd:string,val?:string)=>{
    const el=editorRef.current; if(!el) return; el.focus();
    const sel=window.getSelection();
    if((!sel||sel.rangeCount===0)&&savedRange.current){sel?.removeAllRanges();sel?.addRange(savedRange.current);}
    document.execCommand(cmd,false,val); emit();
  },[]);

  function emit(){if(editorRef.current)onChange(editorRef.current.innerHTML);}
  function saveRange(){const sel=window.getSelection();if(sel&&sel.rangeCount>0)savedRange.current=sel.getRangeAt(0).cloneRange();}
  function restoreRange(){const sel=window.getSelection();if(sel&&savedRange.current){sel.removeAllRanges();sel.addRange(savedRange.current);}}

  function applyFont(name:string){
    setFontName(name); editorRef.current?.focus(); restoreRange();
    document.execCommand("styleWithCSS",false,"true");
    document.execCommand("fontName",false,name); emit();
  }

  function applySize(pt:number){
    setFontSize(pt); const el=editorRef.current; if(!el) return;
    el.focus(); restoreRange();
    const sel=window.getSelection();
    if(!sel||sel.rangeCount===0||sel.isCollapsed){el.style.fontSize=pt+"pt";return;}
    document.execCommand("styleWithCSS",false,"true");
    document.execCommand("fontSize",false,"7");
    el.querySelectorAll('font[size="7"]').forEach(f=>{
      const span=document.createElement("span");
      span.style.fontSize=pt+"pt"; span.style.fontFamily=fontName;
      span.innerHTML=(f as HTMLElement).innerHTML; f.replaceWith(span);
    }); emit();
  }

  function applySpacingVal(v:string){
    setSpacing(v); const el=editorRef.current; if(!el) return;
    el.style.lineHeight=v;
    el.querySelectorAll<HTMLElement>("p,h1,h2,h3,h4,li,div,blockquote").forEach(b=>b.style.lineHeight=v);
    emit();
  }

  // Expose methods via ref for AI formatting
  useImperativeHandle(ref, ()=>({
    applyFormat(spec: FormatSpec) {
      if(spec.fontFamily) applyFont(spec.fontFamily);
      if(spec.fontSize)   applySize(spec.fontSize);
      if(spec.lineSpacing) applySpacingVal(spec.lineSpacing);
      if(spec.margin)     setMargin(spec.margin);
    },
    getContent(){ return editorRef.current?.innerHTML || ""; },
    setContent(html:string){ if(editorRef.current){editorRef.current.innerHTML=html;emit();} },
  }));

  function insertLink(){restoreRange();if(linkUrl!=="https://")exec("createLink",linkUrl);setShowLink(false);setLinkUrl("https://");}
  function insertImg(){
    restoreRange();
    if(imgUrl!=="https://")exec("insertHTML",`<img src="${imgUrl}" alt="figure" style="max-width:100%;height:auto;margin:12px auto;display:block;border-radius:4px;"/>`);
    setShowImg(false);setImgUrl("https://");
  }
  function insertTbl(){
    const row="<tr>"+`<td style='border:1px solid #d1d5db;padding:6px 10px;min-width:60px'>&nbsp;</td>`.repeat(tC)+"</tr>";
    restoreRange(); exec("insertHTML",`<table style="border-collapse:collapse;width:100%;margin:12px 0">${row.repeat(tR)}</table><p><br></p>`);
    setShowTbl(false);
  }
  function doPrint(){
    const w=window.open("","_blank"); if(!w) return;
    w.document.write(`<html><head><style>body{font-family:${fontName},serif;font-size:${fontSize}pt;margin:${margin};line-height:${spacing}}h1{font-size:2em}h2{font-size:1.5em}h3{font-size:1.25em}table{border-collapse:collapse;width:100%}td{border:1px solid #ccc;padding:6px}img{max-width:100%}@media print{body{margin:1in}}</style></head><body>${editorRef.current?.innerHTML||""}</body></html>`);
    w.document.close(); w.print();
  }

  const applyHeading=(tag:string,label:string)=>{setHeading(label);editorRef.current?.focus();restoreRange();document.execCommand("formatBlock",false,tag==="p"?"<p>":`<${tag}>`);emit();};

  return (
    <div style={{border:"1.5px solid var(--border)",borderRadius:"var(--r-lg)",overflow:"hidden",background:"#fff"}}>
      <div style={{background:"#f3f4f6",borderBottom:"1px solid #e5e7eb"}} onMouseDown={pd}>
        <div style={{display:"flex",alignItems:"center",padding:"3px 6px",gap:2,flexWrap:"wrap",rowGap:2}}>
          <Btn onCmd={()=>exec("undo")} title="Undo"><Undo2 size={12}/></Btn>
          <Btn onCmd={()=>exec("redo")} title="Redo"><Redo2 size={12}/></Btn><Sep/>
          <ToolDropdown label={heading} width={88} items={HEADINGS.map(h=>({label:h.l,value:h.t,style:h.t!=="p"?{fontWeight:700,fontSize:h.t==="h1"?16:h.t==="h2"?14:h.t==="h3"?13:12}:{}}))} onSelect={v=>applyHeading(v,HEADINGS.find(h=>h.t===v)?.l||"Normal")}/>
          <ToolDropdown label={fontName} width={120} items={FONTS.map(f=>({label:f,value:f,style:{fontFamily:f}}))} onSelect={applyFont}/>
          <ToolDropdown label={`${fontSize}pt`} width={58} items={FONT_SIZES.map(s=>({label:`${s}pt`,value:String(s)}))} onSelect={v=>applySize(Number(v))}/><Sep/>
          <Btn onCmd={()=>exec("bold")} title="Bold"><Bold size={12}/></Btn>
          <Btn onCmd={()=>exec("italic")} title="Italic"><Italic size={12}/></Btn>
          <Btn onCmd={()=>exec("underline")} title="Underline"><Underline size={12}/></Btn>
          <Btn onCmd={()=>exec("strikeThrough")} title="Strikethrough"><Strikethrough size={12}/></Btn>
          <Btn onCmd={()=>exec("superscript")} title="Superscript"><Superscript size={12}/></Btn>
          <Btn onCmd={()=>exec("subscript")} title="Subscript"><Subscript size={12}/></Btn><Sep/>
          <label title="Font Color" onMouseDown={pd} style={{width:26,height:26,borderRadius:4,cursor:"pointer",position:"relative",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <Type size={12} style={{color:"#374151",position:"absolute",pointerEvents:"none"}}/>
            <input type="color" defaultValue="#000000" onMouseDown={saveRange} onChange={e=>{restoreRange();exec("foreColor",e.target.value);}} style={{opacity:0,width:"100%",height:"100%",cursor:"pointer",border:"none",position:"absolute"}}/>
          </label>
          <label title="Highlight" onMouseDown={pd} style={{width:26,height:26,borderRadius:4,cursor:"pointer",position:"relative",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,background:"rgba(253,230,138,.6)"}}>
            <span style={{fontSize:8,fontWeight:900,color:"#78350f",position:"absolute",pointerEvents:"none"}}>HL</span>
            <input type="color" defaultValue="#fde68a" onMouseDown={saveRange} onChange={e=>{restoreRange();exec("hiliteColor",e.target.value);}} style={{opacity:0,width:"100%",height:"100%",cursor:"pointer",border:"none",position:"absolute"}}/>
          </label><Sep/>
          <Btn onCmd={()=>exec("justifyLeft")} title="Left"><AlignLeft size={12}/></Btn>
          <Btn onCmd={()=>exec("justifyCenter")} title="Center"><AlignCenter size={12}/></Btn>
          <Btn onCmd={()=>exec("justifyRight")} title="Right"><AlignRight size={12}/></Btn>
          <Btn onCmd={()=>exec("justifyFull")} title="Justify"><AlignJustify size={12}/></Btn><Sep/>
          <Btn onCmd={()=>exec("insertUnorderedList")} title="Bullets"><List size={12}/></Btn>
          <Btn onCmd={()=>exec("insertOrderedList")} title="Numbered"><ListOrdered size={12}/></Btn>
          <Btn onCmd={()=>exec("indent")} title="Indent"><IndentIncrease size={12}/></Btn>
          <Btn onCmd={()=>exec("outdent")} title="Outdent"><IndentDecrease size={12}/></Btn>
          <Btn onCmd={()=>exec("formatBlock","<blockquote>")} title="Quote"><Quote size={12}/></Btn><Sep/>
          <Btn onCmd={()=>{saveRange();setShowLink(v=>!v);setShowImg(false);setShowTbl(false);}} title="Link"><Link2 size={12}/></Btn>
          <Btn onCmd={()=>{saveRange();setShowImg(v=>!v);setShowLink(false);setShowTbl(false);}} title="Image"><ImageIcon size={12}/></Btn>
          <Btn onCmd={()=>{saveRange();setShowTbl(v=>!v);setShowLink(false);setShowImg(false);}} title="Table"><Table size={12}/></Btn><Sep/>
          <ToolDropdown label={LINE_SPACINGS.find(l=>l.v===spacing)?.l||spacing} width={72} items={LINE_SPACINGS.map(l=>({label:l.l,value:l.v}))} onSelect={applySpacingVal}/>
          <ToolDropdown label={MARGINS.find(m=>m.v===margin)?.l||"Compact"} width={96} items={MARGINS.map(m=>({label:m.l,value:m.v}))} onSelect={v=>setMargin(v)}/><Sep/>
          <Btn onCmd={doPrint} title="Print"><Printer size={12}/></Btn>
        </div>
      </div>

      {showLink&&(
        <div style={{padding:"6px 10px",background:"#f9fafb",borderBottom:"1px solid #e5e7eb",display:"flex",gap:6,flexWrap:"wrap"}}>
          <input value={linkUrl} onChange={e=>setLinkUrl(e.target.value)} onKeyDown={e=>e.key==="Enter"&&insertLink()} placeholder="https://…" autoFocus style={{flex:1,minWidth:160,padding:"4px 8px",border:"1px solid #d1d5db",borderRadius:4,fontSize:12,outline:"none"}}/>
          <button onClick={insertLink} style={{padding:"4px 10px",background:"#4f46e5",color:"white",border:"none",borderRadius:4,cursor:"pointer",fontSize:11,fontWeight:600}}>Insert</button>
          <button onClick={()=>setShowLink(false)} style={{padding:"4px 8px",border:"1px solid #e5e7eb",borderRadius:4,cursor:"pointer",fontSize:11,background:"transparent"}}><X size={11}/></button>
        </div>
      )}
      {showImg&&(
        <div style={{padding:"6px 10px",background:"#f9fafb",borderBottom:"1px solid #e5e7eb",display:"flex",gap:6,flexWrap:"wrap"}}>
          <input value={imgUrl} onChange={e=>setImgUrl(e.target.value)} onKeyDown={e=>e.key==="Enter"&&insertImg()} placeholder="Image URL…" autoFocus style={{flex:1,minWidth:120,padding:"4px 8px",border:"1px solid #d1d5db",borderRadius:4,fontSize:12,outline:"none"}}/>
          <label style={{display:"flex",alignItems:"center",gap:4,padding:"4px 9px",background:"#f3f4f6",border:"1px solid #e5e7eb",borderRadius:4,cursor:"pointer",fontSize:11}}>
            Upload
            <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(!f) return;const r=new FileReader();r.onload=ev=>setImgUrl(ev.target?.result as string);r.readAsDataURL(f);}}/>
          </label>
          <button onClick={insertImg} style={{padding:"4px 10px",background:"#4f46e5",color:"white",border:"none",borderRadius:4,cursor:"pointer",fontSize:11,fontWeight:600}}>Insert</button>
          <button onClick={()=>setShowImg(false)} style={{padding:"4px 8px",border:"1px solid #e5e7eb",borderRadius:4,cursor:"pointer",fontSize:11,background:"transparent"}}><X size={11}/></button>
        </div>
      )}
      {showTbl&&(
        <div style={{padding:"6px 10px",background:"#f9fafb",borderBottom:"1px solid #e5e7eb",display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <span style={{fontSize:11,color:"#6b7280"}}>Rows:</span>
          <input type="number" min={1} max={20} value={tR} onChange={e=>setTR(parseInt(e.target.value)||2)} style={{width:44,padding:"3px 6px",border:"1px solid #d1d5db",borderRadius:4,fontSize:12,outline:"none"}}/>
          <span style={{fontSize:11,color:"#6b7280"}}>Cols:</span>
          <input type="number" min={1} max={10} value={tC} onChange={e=>setTC(parseInt(e.target.value)||2)} style={{width:44,padding:"3px 6px",border:"1px solid #d1d5db",borderRadius:4,fontSize:12,outline:"none"}}/>
          <button onClick={insertTbl} style={{padding:"4px 10px",background:"#4f46e5",color:"white",border:"none",borderRadius:4,cursor:"pointer",fontSize:11,fontWeight:600}}>Insert Table</button>
          <button onClick={()=>setShowTbl(false)} style={{padding:"4px 8px",border:"1px solid #e5e7eb",borderRadius:4,cursor:"pointer",fontSize:11,background:"transparent"}}><X size={11}/></button>
        </div>
      )}

      <div style={{background:"#e5e7eb",padding:"clamp(8px,3vw,20px) 0",minHeight:340,overflowY:"auto",overflowX:"hidden"}}>
        <div style={{background:"white",maxWidth:816,width:"100%",margin:"0 auto",minHeight:400,boxShadow:"0 2px 16px rgba(0,0,0,.15)",padding:margin,boxSizing:"border-box"}}>
          <div ref={editorRef} contentEditable suppressContentEditableWarning
            onInput={emit} onKeyUp={emit} onMouseUp={saveRange} onKeyDown={()=>{saveRange();}}
            data-placeholder={placeholder}
            style={{outline:"none",fontSize:fontSize+"pt",lineHeight:spacing,color:"#000",fontFamily:fontName+",serif",minHeight:360,wordBreak:"break-word"}}
          />
        </div>
      </div>
      <style>{`[contenteditable][data-placeholder]:empty:before{content:attr(data-placeholder);color:#9ca3af;pointer-events:none}[contenteditable] h1{font-size:2em;font-weight:bold;margin:.4em 0}[contenteditable] h2{font-size:1.5em;font-weight:bold;margin:.4em 0}[contenteditable] h3{font-size:1.25em;font-weight:bold;margin:.4em 0}[contenteditable] h4{font-size:1.1em;font-weight:bold;margin:.4em 0}[contenteditable] blockquote{border-left:3px solid #6b7280;padding-left:14px;margin:10px 0;color:#4b5563;font-style:italic}[contenteditable] table{border-collapse:collapse;width:100%;margin:10px 0}[contenteditable] td,[contenteditable] th{border:1px solid #d1d5db;padding:5px 8px;min-width:40px}[contenteditable] ul,[contenteditable] ol{padding-left:24px}[contenteditable] li{margin:2px 0}[contenteditable] a{color:#2563eb;text-decoration:underline}[contenteditable] img{max-width:100%;height:auto;display:block;margin:10px auto}`}</style>
    </div>
  );
});

export default WordEditor;
