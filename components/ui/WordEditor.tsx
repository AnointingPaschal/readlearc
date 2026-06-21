"use client";
import { useRef, useEffect, useState, useCallback } from "react";
import {
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Link2, Image, Quote, Undo2, Redo2, Table, Superscript, Subscript,
  IndentIncrease, IndentDecrease, Type, Printer,
} from "lucide-react";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const FONTS = [
  "Times New Roman","Arial","Calibri","Georgia","Helvetica","Courier New",
  "Verdana","Garamond","Palatino","Trebuchet MS","Book Antiqua","Century",
];
const FONT_SIZES = [8,9,10,11,12,13,14,16,18,20,22,24,26,28,32,36,48,72];
const LINE_SPACINGS = [
  {label:"Single",    val:"1"},
  {label:"1.15",      val:"1.15"},
  {label:"1.5",       val:"1.5"},
  {label:"Double",    val:"2"},
  {label:"2.5",       val:"2.5"},
  {label:"Triple",    val:"3"},
];
const MARGINS = [
  {label:"Normal (1\")",  val:"96px"},
  {label:"Narrow (0.5\")",val:"48px"},
  {label:"Wide (2\")",    val:"192px"},
  {label:"Moderate",      val:"72px"},
];
const HEADINGS = [
  {label:"Normal",    tag:"p"},
  {label:"Heading 1", tag:"h1"},
  {label:"Heading 2", tag:"h2"},
  {label:"Heading 3", tag:"h3"},
  {label:"Heading 4", tag:"h4"},
  {label:"Title",     tag:"h1"},
  {label:"Subtitle",  tag:"h2"},
];

function Btn({onClick,title,active=false,children,disabled=false}:{onClick:()=>void;title:string;active?:boolean;children:React.ReactNode;disabled?:boolean}) {
  return (
    <button type="button" title={title} onClick={onClick} disabled={disabled}
      style={{width:26,height:24,borderRadius:3,border:"none",cursor:disabled?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",background:active?"rgba(109,40,217,.12)":"transparent",color:active?"var(--brand)":"var(--text-3)",opacity:disabled?.4:1}}
      onMouseEnter={e=>{if(!disabled)(e.currentTarget.style.background=active?"rgba(109,40,217,.2)":"rgba(0,0,0,.06)");}}
      onMouseLeave={e=>{(e.currentTarget.style.background=active?"rgba(109,40,217,.12)":"transparent");}}>
      {children}
    </button>
  );
}
function Sep() { return <div style={{width:1,height:16,background:"var(--border)",margin:"0 2px",flexShrink:0}}/>; }
function TGrp({children}:{children:React.ReactNode}) {
  return <div style={{display:"flex",alignItems:"center",gap:1,padding:"0 3px"}}>{children}</div>;
}

export default function WordEditor({value,onChange,placeholder="Start writing…"}:Props) {
  const editorRef  = useRef<HTMLDivElement>(null);
  const [mounted,  setMounted]   = useState(false);
  const [margin,   setMargin]    = useState("96px");
  const [lineSpace,setLineSpace] = useState("1.5");
  const [showLink, setShowLink]  = useState(false);
  const [showImg,  setShowImg]   = useState(false);
  const [showTable,setShowTable] = useState(false);
  const [linkUrl,  setLinkUrl]   = useState("https://");
  const [imgUrl,   setImgUrl]    = useState("https://");
  const [tRows,    setTRows]     = useState(3);
  const [tCols,    setTCols]     = useState(3);
  const savedRange = useRef<Range|null>(null);

  useEffect(()=>{
    if(!mounted&&editorRef.current){editorRef.current.innerHTML=value||"";setMounted(true);}
  },[]);

  const exec=useCallback((cmd:string,val?:string)=>{
    editorRef.current?.focus();
    document.execCommand(cmd,false,val);
    emit();
  },[]);

  function emit(){if(editorRef.current)onChange(editorRef.current.innerHTML);}
  function saveRange(){const s=window.getSelection();if(s&&s.rangeCount)savedRange.current=s.getRangeAt(0).cloneRange();}
  function restoreRange(){const s=window.getSelection();if(s&&savedRange.current){s.removeAllRanges();s.addRange(savedRange.current);}}

  function insertLink(){
    restoreRange();
    if(linkUrl&&linkUrl!=="https://")exec("createLink",linkUrl);
    setShowLink(false);setLinkUrl("https://");
  }

  function insertImage(){
    restoreRange();
    if(imgUrl&&imgUrl!=="https://")exec("insertHTML",`<img src="${imgUrl}" alt="figure" style="max-width:100%;height:auto;margin:12px auto;display:block;border-radius:4px;" />`);
    setShowImg(false);setImgUrl("https://");
  }

  function insertTable(){
    const row="<tr>"+"<td style='border:1px solid #ccc;padding:6px 10px;min-width:80px'>&nbsp;</td>".repeat(tCols)+"</tr>";
    const html=`<table style="border-collapse:collapse;width:100%;margin:12px 0">${row.repeat(tRows)}</table><p><br></p>`;
    restoreRange();exec("insertHTML",html);setShowTable(false);
  }

  function applyLineSpacing(val:string){
    setLineSpace(val);
    if(editorRef.current){editorRef.current.style.lineHeight=val;emit();}
  }

  function print(){
    const w=window.open("","_blank");
    if(!w)return;
    w.document.write(`<html><head><style>body{font-family:Times New Roman,serif;font-size:12pt;margin:${margin};line-height:${lineSpace};max-width:800px}h1{font-size:2em}h2{font-size:1.5em}h3{font-size:1.25em}table{border-collapse:collapse;width:100%}td{border:1px solid #ccc;padding:6px}img{max-width:100%}@media print{body{margin:1in}}</style></head><body>${editorRef.current?.innerHTML||""}</body></html>`);
    w.document.close();w.print();
  }

  const barBase:React.CSSProperties={display:"flex",alignItems:"center",padding:"4px 10px",background:"#f3f4f6",borderBottom:"1px solid #e5e7eb",flexWrap:"wrap",gap:2,rowGap:3};

  return (
    <div style={{border:"1.5px solid var(--border)",borderRadius:"var(--r-lg)",overflow:"hidden",background:"#fff",boxShadow:"var(--shadow)"}}>

      {/* Toolbar row 1 */}
      <div style={barBase}>
        <TGrp>
          <Btn onClick={()=>exec("undo")} title="Undo"><Undo2 size={12}/></Btn>
          <Btn onClick={()=>exec("redo")} title="Redo"><Redo2 size={12}/></Btn>
        </TGrp><Sep/>

        {/* Heading */}
        <select onChange={e=>exec("formatBlock",e.target.value)} defaultValue="p"
          style={{height:24,padding:"0 4px",background:"white",border:"1px solid #e5e7eb",borderRadius:3,fontSize:11,color:"#374151",cursor:"pointer",minWidth:80}}>
          {HEADINGS.map(h=><option key={h.label} value={h.tag}>{h.label}</option>)}
        </select><Sep/>

        {/* Font family */}
        <select onChange={e=>exec("fontName",e.target.value)}
          style={{height:24,padding:"0 4px",background:"white",border:"1px solid #e5e7eb",borderRadius:3,fontSize:11,color:"#374151",cursor:"pointer",minWidth:110}}>
          {FONTS.map(f=><option key={f} value={f}>{f}</option>)}
        </select>

        {/* Font size */}
        <select onChange={e=>exec("fontSize",e.target.value)} defaultValue="3"
          style={{height:24,padding:"0 4px",background:"white",border:"1px solid #e5e7eb",borderRadius:3,fontSize:11,color:"#374151",cursor:"pointer",width:50}}>
          {FONT_SIZES.map((s,i)=>{
            const cmd=i<8?String(Math.ceil((i+1)/1)):i<11?"5":i<13?"6":"7";
            return <option key={s} value={cmd}>{s}pt</option>;
          })}
        </select><Sep/>

        <TGrp>
          <Btn onClick={()=>exec("bold")} title="Bold (Ctrl+B)"><Bold size={12}/></Btn>
          <Btn onClick={()=>exec("italic")} title="Italic (Ctrl+I)"><Italic size={12}/></Btn>
          <Btn onClick={()=>exec("underline")} title="Underline (Ctrl+U)"><Underline size={12}/></Btn>
          <Btn onClick={()=>exec("strikeThrough")} title="Strikethrough"><Strikethrough size={12}/></Btn>
          <Btn onClick={()=>exec("superscript")} title="Superscript"><Superscript size={12}/></Btn>
          <Btn onClick={()=>exec("subscript")} title="Subscript"><Subscript size={12}/></Btn>
        </TGrp><Sep/>

        {/* Text color */}
        <label title="Font Color" style={{width:26,height:24,borderRadius:3,cursor:"pointer",position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <Type size={12} style={{color:"#374151",position:"absolute",pointerEvents:"none"}}/>
          <input type="color" defaultValue="#000000" onChange={e=>exec("foreColor",e.target.value)} style={{opacity:0,width:"100%",height:"100%",cursor:"pointer",border:"none",position:"absolute"}}/>
        </label>

        {/* Highlight */}
        <label title="Text Highlight" style={{width:26,height:24,borderRadius:3,cursor:"pointer",position:"relative",display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(253,230,138,.5)"}}>
          <span style={{fontSize:11,fontWeight:900,color:"#78350f",position:"absolute",pointerEvents:"none"}}>HL</span>
          <input type="color" defaultValue="#fde68a" onChange={e=>exec("hiliteColor",e.target.value)} style={{opacity:0,width:"100%",height:"100%",cursor:"pointer",border:"none",position:"absolute"}}/>
        </label><Sep/>

        <TGrp>
          <Btn onClick={()=>exec("justifyLeft")}   title="Align Left"><AlignLeft size={12}/></Btn>
          <Btn onClick={()=>exec("justifyCenter")} title="Center"><AlignCenter size={12}/></Btn>
          <Btn onClick={()=>exec("justifyRight")}  title="Align Right"><AlignRight size={12}/></Btn>
          <Btn onClick={()=>exec("justifyFull")}   title="Justify"><AlignJustify size={12}/></Btn>
        </TGrp><Sep/>

        <TGrp>
          <Btn onClick={()=>exec("insertUnorderedList")} title="Bullet List"><List size={12}/></Btn>
          <Btn onClick={()=>exec("insertOrderedList")}   title="Numbered List"><ListOrdered size={12}/></Btn>
          <Btn onClick={()=>exec("indent")}   title="Increase Indent"><IndentIncrease size={12}/></Btn>
          <Btn onClick={()=>exec("outdent")}  title="Decrease Indent"><IndentDecrease size={12}/></Btn>
        </TGrp><Sep/>

        <TGrp>
          <Btn onClick={()=>{saveRange();setShowLink(v=>!v);setShowImg(false);setShowTable(false);}} title="Insert Link"><Link2 size={12}/></Btn>
          <Btn onClick={()=>{saveRange();setShowImg(v=>!v);setShowLink(false);setShowTable(false);}} title="Insert Image"><Image size={12}/></Btn>
          <Btn onClick={()=>{saveRange();setShowTable(v=>!v);setShowLink(false);setShowImg(false);}} title="Insert Table"><Table size={12}/></Btn>
          <Btn onClick={()=>exec("formatBlock","blockquote")} title="Blockquote"><Quote size={12}/></Btn>
        </TGrp><Sep/>

        {/* Line spacing */}
        <select value={lineSpace} onChange={e=>applyLineSpacing(e.target.value)}
          style={{height:24,padding:"0 4px",background:"white",border:"1px solid #e5e7eb",borderRadius:3,fontSize:11,color:"#374151",cursor:"pointer"}}>
          {LINE_SPACINGS.map(l=><option key={l.val} value={l.val}>{l.label}</option>)}
        </select>

        {/* Margins */}
        <select value={margin} onChange={e=>setMargin(e.target.value)}
          style={{height:24,padding:"0 4px",background:"white",border:"1px solid #e5e7eb",borderRadius:3,fontSize:11,color:"#374151",cursor:"pointer"}}>
          {MARGINS.map(m=><option key={m.val} value={m.val}>{m.label}</option>)}
        </select><Sep/>

        <Btn onClick={print} title="Print / Export PDF"><Printer size={12}/></Btn>
      </div>

      {/* Inline inputs */}
      {showLink&&<div style={{padding:"7px 12px",background:"#f9fafb",borderBottom:"1px solid #e5e7eb",display:"flex",gap:6}}>
        <input value={linkUrl} onChange={e=>setLinkUrl(e.target.value)} onKeyDown={e=>e.key==="Enter"&&insertLink()} placeholder="https://…" autoFocus
          style={{flex:1,padding:"4px 9px",border:"1px solid #d1d5db",borderRadius:4,fontSize:12,outline:"none"}}/>
        <button onClick={insertLink} style={{padding:"4px 10px",background:"var(--brand)",color:"white",border:"none",borderRadius:4,cursor:"pointer",fontSize:11,fontWeight:600}}>Insert Link</button>
        <button onClick={()=>setShowLink(false)} style={{padding:"4px 8px",background:"transparent",border:"1px solid #e5e7eb",borderRadius:4,cursor:"pointer",fontSize:11}}>✕</button>
      </div>}

      {showImg&&<div style={{padding:"7px 12px",background:"#f9fafb",borderBottom:"1px solid #e5e7eb",display:"flex",gap:6,flexWrap:"wrap"}}>
        <input value={imgUrl} onChange={e=>setImgUrl(e.target.value)} onKeyDown={e=>e.key==="Enter"&&insertImage()} placeholder="Image URL…" autoFocus
          style={{flex:1,minWidth:200,padding:"4px 9px",border:"1px solid #d1d5db",borderRadius:4,fontSize:12,outline:"none"}}/>
        <label style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",background:"#f3f4f6",border:"1px solid #e5e7eb",borderRadius:4,cursor:"pointer",fontSize:11}}>
          Upload
          <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{
            const file=e.target.files?.[0];if(!file)return;
            const reader=new FileReader();reader.onload=ev=>setImgUrl(ev.target?.result as string);reader.readAsDataURL(file);
          }}/>
        </label>
        <button onClick={insertImage} style={{padding:"4px 10px",background:"var(--brand)",color:"white",border:"none",borderRadius:4,cursor:"pointer",fontSize:11,fontWeight:600}}>Insert</button>
        <button onClick={()=>setShowImg(false)} style={{padding:"4px 8px",background:"transparent",border:"1px solid #e5e7eb",borderRadius:4,cursor:"pointer",fontSize:11}}>✕</button>
      </div>}

      {showTable&&<div style={{padding:"7px 12px",background:"#f9fafb",borderBottom:"1px solid #e5e7eb",display:"flex",gap:10,alignItems:"center"}}>
        <span style={{fontSize:11,color:"#6b7280"}}>Rows:</span>
        <input type="number" min={1} max={20} value={tRows} onChange={e=>setTRows(parseInt(e.target.value)||2)} style={{width:48,padding:"3px 6px",border:"1px solid #d1d5db",borderRadius:4,fontSize:12,outline:"none"}}/>
        <span style={{fontSize:11,color:"#6b7280"}}>Columns:</span>
        <input type="number" min={1} max={10} value={tCols} onChange={e=>setTCols(parseInt(e.target.value)||2)} style={{width:48,padding:"3px 6px",border:"1px solid #d1d5db",borderRadius:4,fontSize:12,outline:"none"}}/>
        <button onClick={insertTable} style={{padding:"4px 10px",background:"var(--brand)",color:"white",border:"none",borderRadius:4,cursor:"pointer",fontSize:11,fontWeight:600}}>Insert Table</button>
        <button onClick={()=>setShowTable(false)} style={{padding:"4px 8px",background:"transparent",border:"1px solid #e5e7eb",borderRadius:4,cursor:"pointer",fontSize:11}}>✕</button>
      </div>}

      {/* Page */}
      <div style={{background:"#e5e7eb",padding:"20px 0",minHeight:500,overflowY:"auto"}}>
        <div style={{background:"white",maxWidth:816,margin:"0 auto",minHeight:1056,boxShadow:"0 2px 16px rgba(0,0,0,.18)",padding:margin,boxSizing:"border-box"}}>
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={emit}
            data-placeholder={placeholder}
            style={{outline:"none",fontSize:"12pt",lineHeight:lineSpace,color:"#000",fontFamily:"Times New Roman,serif",minHeight:900}}
          />
        </div>
      </div>

      <style>{`
        [contenteditable][data-placeholder]:empty:before{content:attr(data-placeholder);color:#9ca3af;pointer-events:none}
        [contenteditable] h1{font-size:2em;font-weight:bold;margin:.5em 0}
        [contenteditable] h2{font-size:1.5em;font-weight:bold;margin:.5em 0}
        [contenteditable] h3{font-size:1.25em;font-weight:bold;margin:.5em 0}
        [contenteditable] h4{font-size:1.1em;font-weight:bold;margin:.5em 0}
        [contenteditable] blockquote{border-left:3px solid #6b7280;padding-left:14px;margin:12px 0;color:#4b5563;font-style:italic}
        [contenteditable] table{border-collapse:collapse;width:100%;margin:12px 0}
        [contenteditable] td,[contenteditable] th{border:1px solid #d1d5db;padding:6px 10px;min-width:60px}
        [contenteditable] ul,[contenteditable] ol{padding-left:28px}
        [contenteditable] li{margin:3px 0}
        [contenteditable] a{color:#2563eb;text-decoration:underline}
        [contenteditable] img{max-width:100%;height:auto;display:block;margin:12px auto}
      `}</style>
    </div>
  );
}
