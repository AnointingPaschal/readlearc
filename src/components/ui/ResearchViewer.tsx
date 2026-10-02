import { FileText } from "lucide-react";
import { toHtml } from "@/lib/markdown";
import PaperReader, { type PaperMeta } from "./PaperReader";

// A4 at 96dpi — used by the locked preview page
const A4_W = 794;
const A4_H = 1123;
const MG   = 96;

interface Props {
  content: string;
  title:   string;
  locked?: boolean;       // show only abstract + blur
  onUnlock?: () => void;
  payButton?: React.ReactNode;
  meta?: PaperMeta;       // author / date / url for citations (unlocked reader)
}

export default function ResearchViewer({ content, title, locked, payButton, meta }: Props) {
  if (!locked) return <PaperReader content={content} title={title} articleId={meta?.articleId || title} author={meta?.author || ""} date={meta?.date} url={meta?.url} />;
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
  return null;
}
