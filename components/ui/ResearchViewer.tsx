"use client";
import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { ChevronLeft, ChevronRight, FileText, Printer } from "lucide-react";
import { toHtml } from "../../lib/markdown";

// A4 at 96dpi
const A4_W  = 794;
const A4_H  = 1123;
const MG    = 72;        // page margin px
const PG_H  = A4_H - MG * 2;  // usable content height per page

interface Props {
  content: string;
  title:   string;
  locked?: boolean;       // show only abstract + blur
  onUnlock?: () => void;  // called when user clicks pay
  payButton?: React.ReactNode;
}

function usePageCount(ref: React.RefObject<HTMLDivElement | null>, deps: any[]) {
  const [count, setCount] = useState(1);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const h = ref.current.scrollHeight;
    setCount(Math.max(1, Math.ceil(h / PG_H)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return count;
}

interface SectionProps {
  html:     string;
  isFirst:  boolean;
  title:    string;
  pageOffset: number; // global page number offset for display
}

function SectionPages({ html, isFirst, title, pageOffset }: SectionProps) {
  const measureRef = useRef<HTMLDivElement>(null);
  const scrollRef  = useRef<HTMLDivElement>(null);
  const [subPage, setSubPage] = useState(0);
  const [pages,   setPages]   = useState(1);

  useLayoutEffect(() => {
    if (!measureRef.current) return;
    const extraH = isFirst ? 90 : 0; // title + hr
    const h = measureRef.current.scrollHeight + extraH;
    setPages(Math.max(1, Math.ceil(h / PG_H)));
  }, [html, isFirst]);

  // Scroll page container programmatically — overflow:hidden but scrollTop still works
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = subPage * PG_H;
  }, [subPage]);

  function goPage(p: number) { setSubPage(Math.max(0, Math.min(pages - 1, p))); }

  return (
    <div>
      {/* A4 page — fixed height, overflow hidden, scrolls via scrollTop */}
      <div
        ref={scrollRef}
        style={{
          background: "white",
          maxWidth: A4_W,
          width: "100%",
          height: A4_H,
          overflow: "hidden",
          margin: "0 auto",
          boxShadow: "0 3px 14px rgba(0,0,0,.28), 0 0 0 1px rgba(0,0,0,.08)",
          borderRadius: 2,
          boxSizing: "border-box" as const,
          position: "relative",
        }}
      >
        <div style={{ padding: MG }}>
          {/* Title block — only first section */}
          {isFirst && (
            <>
              <div style={{ fontFamily:'"Times New Roman",Times,serif', fontSize: "clamp(13px,2vw,16pt)", fontWeight: 700, textAlign: "center", lineHeight: 1.3, marginBottom: 6, color: "#000" }}>{title}</div>
              <div style={{ borderTop: "1px solid #888", margin: "8px 0 16px" }}/>
            </>
          )}
          {/* Content */}
          <div className="rbd" dangerouslySetInnerHTML={{ __html: html }}/>
          {/* Page number watermark at bottom */}
          <div style={{ marginTop: 40, textAlign: "center" }}>
            <span style={{ fontFamily:'"Times New Roman",Times,serif', fontSize: 9, color: "#bbb" }}>
              {pageOffset + subPage + 1}
            </span>
          </div>
        </div>
      </div>

      {/* Sub-page navigation (when section spans multiple A4 pages) */}
      {pages > 1 && (
        <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:10, marginTop:10 }}>
          <button onClick={()=>goPage(subPage-1)} disabled={subPage===0}
            style={{ display:"flex",alignItems:"center",gap:3,padding:"5px 12px",border:"1px solid #dadce0",borderRadius:5,background:"white",cursor:subPage===0?"not-allowed":"pointer",fontSize:11,color:"#3c4043",opacity:subPage===0?.3:1 }}>
            <ChevronLeft size={11}/>Prev page
          </button>
          <span style={{ fontSize:11, color:"#5f6368" }}>{subPage+1} / {pages}</span>
          <button onClick={()=>goPage(subPage+1)} disabled={subPage===pages-1}
            style={{ display:"flex",alignItems:"center",gap:3,padding:"5px 12px",border:"1px solid #dadce0",borderRadius:5,background:"white",cursor:subPage===pages-1?"not-allowed":"pointer",fontSize:11,color:"#3c4043",opacity:subPage===pages-1?.3:1 }}>
            Next page<ChevronRight size={11}/>
          </button>
        </div>
      )}

      {/* Hidden measurer — same width as content area, off-screen */}
      <div aria-hidden="true" style={{ position:"fixed", top:-9999, left:-9999, width: A4_W - MG*2, visibility:"hidden", fontFamily:'"Times New Roman",Times,serif', fontSize:"12pt", lineHeight:1.6 }}>
        <div ref={measureRef} className="rbd" dangerouslySetInnerHTML={{ __html: html }}/>
      </div>
    </div>
  );
}

export default function ResearchViewer({ content, title, locked, payButton }: Props) {
  const html = toHtml(content);

  // Split into sections at <h2>
  const rawParts = html.split(/(?=<h2[\s>])/i);
  const sections: { heading: string; html: string }[] = [];
  for (const part of rawParts) {
    if (!part.trim()) continue;
    const m = part.match(/^<h2[^>]*>([\s\S]*?)<\/h2>/i);
    if (m) sections.push({ heading: m[1].replace(/<[^>]+>/g,"").trim(), html: part });
    else if (!sections.length) sections.push({ heading:"", html: part });
  }

  // Find abstract section
  const abstractIdx = sections.findIndex(s => /abstract/i.test(s.heading));
  const abstractSec = abstractIdx >= 0 ? sections[abstractIdx] : sections[0];
  const afterAbstract = sections.filter((_, i) => i !== abstractIdx && i !== 0);

  const [section, setSection] = useState(0);

  // Cumulative page offsets for page numbering
  const [sectionPages, setSectionPages] = useState<number[]>(sections.map(()=>1));
  const pageOffset = sectionPages.slice(0, section).reduce((a,b)=>a+b, 0);

  function handlePageCount(idx: number, count: number) {
    setSectionPages(prev => { const n=[...prev]; n[idx]=count; return n; });
  }

  function print() {
    const win = window.open("","_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>${title}</title><style>
@page{size:A4 portrait;margin:2.54cm}
body{font-family:"Times New Roman",Times,serif;font-size:12pt;line-height:1.6;color:#000;margin:0}
h1{font-size:18pt;font-weight:bold;text-align:center;margin:0 0 6pt}
h2{font-size:14pt;font-weight:bold;margin:14pt 0 3pt;border-bottom:1px solid #555;padding-bottom:2pt;page-break-after:avoid}
h3{font-size:12pt;font-weight:bold;font-style:italic;margin:10pt 0 3pt}
h4{font-size:11pt;font-weight:bold;margin:8pt 0 3pt}
p{margin:0 0 7pt;text-align:justify;orphans:3;widows:3}
strong{font-weight:bold}em{font-style:italic}
table{border-collapse:collapse;width:100%;margin:8pt 0;font-size:10pt}
td,th{border:1pt solid #999;padding:3pt 7pt}
th{background:#f0f0f0;font-weight:bold;text-align:center}
blockquote{border-left:3pt solid #666;padding-left:10pt;margin:7pt 0;font-style:italic;color:#444}
img{max-width:100%;display:block;margin:8pt auto;page-break-inside:avoid}
ul,ol{padding-left:18pt;margin:4pt 0}
li{margin:2pt 0}
a{color:#1a0dab}
hr{border:none;border-top:1pt solid #ccc;margin:10pt 0}
</style></head><body><h1>${title}</h1><hr/>${html}</body></html>`);
    win.document.close();
    setTimeout(()=>win.print(), 400);
  }

  // ── LOCKED: show abstract + blur rest ───────────────────────────
  if (locked) {
    const nextSec = afterAbstract[0] || sections[1];
    return (
      <div>
        {/* Toolbar */}
        <div style={{ display:"flex",alignItems:"center",gap:7,padding:"8px 12px",background:"#f1f3f4",borderRadius:"var(--r-lg)",marginBottom:12 }}>
          <FileText size={12} style={{ color:"#5f6368" }}/>
          <span style={{ fontSize:11,fontWeight:600,color:"#5f6368" }}>Research Paper · Preview</span>
        </div>

        {/* Abstract A4 page */}
        <div style={{ background:"#d0d0d0",padding:"clamp(8px,2vw,14px) clamp(6px,1.5vw,8px)",borderRadius:"var(--r-lg)" }}>
          <div style={{ background:"white",maxWidth:A4_W,width:"100%",height:A4_H,overflow:"hidden",margin:"0 auto",boxShadow:"0 3px 14px rgba(0,0,0,.28)",borderRadius:2,boxSizing:"border-box" as const,position:"relative" }}>
            <div style={{ padding: MG }}>
              <div style={{ fontFamily:'"Times New Roman",Times,serif',fontSize:"clamp(13px,2vw,16pt)",fontWeight:700,textAlign:"center",lineHeight:1.3,marginBottom:6,color:"#000" }}>{title}</div>
              <div style={{ borderTop:"1px solid #888",margin:"8px 0 16px" }}/>
              {/* Abstract content — fully visible */}
              <div className="rbd" dangerouslySetInnerHTML={{ __html: abstractSec.html }}/>
              {/* Next section — blurred */}
              {nextSec && (
                <div style={{ filter:"blur(3.5px)", userSelect:"none", pointerEvents:"none", marginTop:14 }}>
                  <div className="rbd" dangerouslySetInnerHTML={{ __html: nextSec.html.slice(0,1200) }}/>
                </div>
              )}
            </div>
            {/* Fade overlay */}
            <div style={{ position:"absolute",bottom:0,left:0,right:0,height:320,background:"linear-gradient(transparent,rgba(255,255,255,.7) 40%,white 75%)",pointerEvents:"none" }}/>
            {/* CTA inside page */}
            {payButton && (
              <div style={{ position:"absolute",bottom:80,left:0,right:0,display:"flex",justifyContent:"center",zIndex:5 }}>
                {payButton}
              </div>
            )}
            {/* Page number */}
            <div style={{ position:"absolute",bottom:MG/2,left:0,right:0,textAlign:"center" }}>
              <span style={{ fontFamily:'"Times New Roman",Times,serif',fontSize:9,color:"#ccc" }}>1</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── UNLOCKED: section-by-section with fixed A4 pagination ───────
  const totalSections = sections.length;
  const totalPages    = sectionPages.reduce((a,b)=>a+b, 0);

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",background:"#f1f3f4",borderRadius:"var(--r-lg)",marginBottom:12,flexWrap:"wrap",gap:8 }}>
        <div style={{ display:"flex",alignItems:"center",gap:7 }}>
          <FileText size={12} style={{ color:"#5f6368" }}/>
          <span style={{ fontSize:11,fontWeight:600,color:"#5f6368" }}>
            Section {section+1}/{totalSections} · ~{totalPages} page{totalPages!==1?"s":""}
          </span>
        </div>
        <div style={{ display:"flex",gap:6 }}>
          <button onClick={()=>{ setSection(s=>Math.max(0,s-1)); }} disabled={section===0}
            style={{ display:"flex",alignItems:"center",gap:3,padding:"4px 9px",border:"1px solid #dadce0",borderRadius:5,background:"white",cursor:section===0?"not-allowed":"pointer",fontSize:11,color:"#3c4043",opacity:section===0?.4:1 }}>
            <ChevronLeft size={11}/>Prev
          </button>
          <button onClick={()=>{ setSection(s=>Math.min(totalSections-1,s+1)); }} disabled={section===totalSections-1}
            style={{ display:"flex",alignItems:"center",gap:3,padding:"4px 9px",border:"1px solid #dadce0",borderRadius:5,background:"white",cursor:section===totalSections-1?"not-allowed":"pointer",fontSize:11,color:"#3c4043",opacity:section===totalSections-1?.4:1 }}>
            Next<ChevronRight size={11}/>
          </button>
          <button onClick={print}
            style={{ display:"flex",alignItems:"center",gap:4,padding:"4px 11px",border:"1px solid #dadce0",borderRadius:5,background:"white",cursor:"pointer",fontSize:11,fontWeight:600,color:"#3c4043" }}>
            <Printer size={11}/>Print
          </button>
        </div>
      </div>

      {/* Section TOC pills */}
      <div style={{ display:"flex",gap:5,flexWrap:"wrap",marginBottom:12 }}>
        {sections.map((s,i)=>s.heading&&(
          <button key={i} onClick={()=>setSection(i)}
            style={{ padding:"3px 9px",borderRadius:"var(--r-f)",border:`1.5px solid ${i===section?"var(--brand)":"var(--border)"}`,background:i===section?"var(--brand-muted)":"transparent",fontSize:10,fontWeight:i===section?700:400,color:i===section?"var(--brand)":"var(--text-4)",cursor:"pointer",transition:"all .1s" }}>
            {s.heading}
          </button>
        ))}
      </div>

      {/* A4 canvas background */}
      <div style={{ background:"#d0d0d0",padding:"clamp(8px,2vw,14px) clamp(6px,1.5vw,8px)",borderRadius:"var(--r-lg)" }}>
        <SectionPages
          key={section}
          html={sections[section].html}
          isFirst={section===0}
          title={title}
          pageOffset={pageOffset}
        />
      </div>

      {/* Section nav at bottom */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:14,padding:"0 4px" }}>
        <button onClick={()=>setSection(s=>Math.max(0,s-1))} disabled={section===0}
          style={{ display:"flex",alignItems:"center",gap:4,padding:"6px 14px",border:"1.5px solid var(--border)",borderRadius:"var(--r)",background:"var(--bg-card)",cursor:section===0?"not-allowed":"pointer",fontSize:12,fontWeight:600,color:"var(--text-3)",opacity:section===0?.4:1 }}>
          <ChevronLeft size={12}/>Previous Section
        </button>
        <span style={{ fontSize:11,color:"var(--text-4)" }}>{section===0?"":sections[section].heading||`Section ${section+1}`}</span>
        <button onClick={()=>setSection(s=>Math.min(totalSections-1,s+1))} disabled={section===totalSections-1}
          style={{ display:"flex",alignItems:"center",gap:4,padding:"6px 14px",border:"1.5px solid var(--border)",borderRadius:"var(--r)",background:"var(--bg-card)",cursor:section===totalSections-1?"not-allowed":"pointer",fontSize:12,fontWeight:600,color:"var(--text-3)",opacity:section===totalSections-1?.4:1 }}>
          Next Section<ChevronRight size={12}/>
        </button>
      </div>
    </div>
  );
}
