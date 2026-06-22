"use client";
import { useState, useEffect, useMemo } from "react";
import Navbar from "../../components/ui/Navbar";
import RichEditor from "../../components/ui/RichEditor";
import { useAuth } from "../../lib/auth";
import { FACULTIES, ALL_COURSES, ARTICLE_TYPES } from "../../lib/categories";
import {
  Send, Save, CheckCircle2, PenLine, FlaskConical,
  AlertCircle, ChevronDown, BookOpen, Tag, DollarSign,
} from "lucide-react";
import Link from "next/link";

export default function WritePage() {
  const { address, isAuth, requireAuth } = useAuth();

  const [title,        setTitle]        = useState("");
  const [blurb,        setBlurb]        = useState("");
  const [content,      setContent]      = useState("");
  const [facultyId,    setFacultyId]    = useState("");
  const [courseId,     setCourseId]     = useState("");
  const [topic,        setTopic]        = useState("");
  const [articleType,  setArticleType]  = useState("Analysis");
  const [price,        setPrice]        = useState("0.020");
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [error,        setError]        = useState("");

  const faculty  = useMemo(() => FACULTIES.find(f => f.id === facultyId), [facultyId]);
  const courses  = faculty ? faculty.courses : [];
  const course   = useMemo(() => courses.find(c => c.id === courseId), [courses, courseId]);
  const topics   = course ? course.topics : [];

  // Reset downstream on change
  useEffect(() => { setCourseId(""); setTopic(""); }, [facultyId]);
  useEffect(() => { setTopic(""); }, [courseId]);

  const categoryLabel = course?.label || "General";

  if (!isAuth) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "calc(var(--header-h) + 60px) 16px", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--brand-muted)", border: "2px solid var(--brand-border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <PenLine size={28} style={{ color: "var(--brand)" }} />
        </div>
        <h2 style={{ fontFamily: "Outfit,sans-serif", fontSize: 22, fontWeight: 900, color: "var(--text)", marginBottom: 8, letterSpacing: "-.02em" }}>Write on Readlearc</h2>
        <p style={{ fontSize: 14, color: "var(--text-3)", marginBottom: 24, lineHeight: 1.6 }}>Sign in to publish articles, share academic insights, and earn USDC from every reader.</p>
        <button onClick={() => requireAuth()} className="btn btn-primary btn-lg" style={{ width: "100%", justifyContent: "center" }}>Sign In to Write</button>
        <div style={{ marginTop: 16, padding: "12px 16px", background: "var(--bg-alt)", borderRadius: "var(--r-md)", border: "1px solid var(--border)" }}>
          <p style={{ fontSize: 12, color: "var(--text-4)", margin: 0 }}>Writing a research paper?</p>
          <Link href="/write/research" style={{ fontSize: 13, fontWeight: 700, color: "var(--brand)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5, marginTop: 4 }}>
            <FlaskConical size={13} /> Open Research Studio →
          </Link>
        </div>
      </div>
    </div>
  );

  async function submit() {
    if (!title.trim()) { setError("Add a title."); return; }
    const text = content.replace(/<[^>]+>/g, "").trim();
    if (text.length < 50) { setError("Content is too short — write at least a few sentences."); return; }
    setSaving(true); setError("");
    const r = await fetch("/api/articles", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title, blurb, content,
        category: categoryLabel,
        topic: topic || undefined,
        articleType,
        price,
        authorAddress: address.toLowerCase(),
        status: "pending",
      }),
    });
    const d = await r.json();
    if (!r.ok) { setError(d.error || "Submit failed"); setSaving(false); return; }
    setSaved(true); setSaving(false);
    setTitle(""); setBlurb(""); setContent("");
    setFacultyId(""); setCourseId(""); setTopic("");
    setArticleType("Analysis"); setPrice("0.020");
  }

  const earn = (parseFloat(price || "0") * 0.85).toFixed(4);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <div style={{ maxWidth: 940, margin: "0 auto", padding: "calc(var(--header-h) + 16px) 14px 80px" }}>

        {/* ── Page header ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, gap: 10, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontFamily: "Outfit,sans-serif", fontSize: "clamp(18px,4vw,24px)", fontWeight: 900, color: "var(--text)", letterSpacing: "-.02em", margin: 0 }}>Write Article</h1>
            <p style={{ fontSize: 12, color: "var(--text-4)", marginTop: 3 }}>You earn 85% of every USDC payment — no lock-in.</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/write/research" className="btn btn-secondary btn-sm">
              <FlaskConical size={12} /> Research Studio
            </Link>
            <button onClick={submit} disabled={saving || saved} className="btn btn-primary btn-sm">
              {saved ? <><CheckCircle2 size={12} />Submitted!</> : saving ? "Submitting…" : <><Send size={12} />Submit for Review</>}
            </button>
          </div>
        </div>

        {/* Banners */}
        {saved && (
          <div style={{ padding: "12px 16px", background: "rgba(5,150,105,.07)", border: "1px solid rgba(5,150,105,.2)", borderRadius: "var(--r-md)", marginBottom: 14, display: "flex", gap: 8, alignItems: "center" }}>
            <CheckCircle2 size={16} style={{ color: "var(--accent)" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)" }}>Submitted! Admin will review and approve your article.</span>
          </div>
        )}
        {error && (
          <div style={{ padding: "10px 14px", background: "rgba(220,38,38,.06)", border: "1px solid rgba(220,38,38,.2)", borderRadius: "var(--r-md)", marginBottom: 12, fontSize: 13, color: "#dc2626", display: "flex", gap: 7 }}>
            <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />{error}
          </div>
        )}

        {/* ── Main layout ── */}
        <div className="write-layout">

          {/* ── LEFT: Title + Content ── */}
          <div className="write-main">
            <div className="card" style={{ padding: "18px", marginBottom: 12 }}>
              <input
                value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Article title…"
                style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontFamily: "Outfit,sans-serif", fontSize: "clamp(17px,3.5vw,22px)", fontWeight: 900, color: "var(--text)", marginBottom: 10, boxSizing: "border-box" }}
              />
              <textarea
                value={blurb} onChange={e => setBlurb(e.target.value)}
                placeholder="Short summary or hook — shown on the article card preview…" rows={2}
                style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: 13, color: "var(--text-3)", resize: "none", lineHeight: 1.65, boxSizing: "border-box" }}
              />
            </div>

            <RichEditor
              value={content} onChange={setContent}
              placeholder="Start writing your article… Use the toolbar for formatting, images, code blocks and more."
              minHeight={480}
            />

            <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
              <button onClick={submit} disabled={saving || saved} className="btn btn-primary" style={{ gap: 7, fontWeight: 700 }}>
                {saved ? <><CheckCircle2 size={14} />Submitted!</> : saving ? "Submitting…" : <><Send size={14} />Submit for Review</>}
              </button>
            </div>
          </div>

          {/* ── RIGHT: Metadata sidebar ── */}
          <div className="write-sidebar">

            {/* Category */}
            <div className="card" style={{ padding: "14px", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                <BookOpen size={13} style={{ color: "var(--brand)" }} />
                <span style={{ fontFamily: "Outfit,sans-serif", fontSize: 12, fontWeight: 800, color: "var(--text)", textTransform: "uppercase", letterSpacing: ".06em" }}>Field of Study</span>
              </div>

              {/* Faculty */}
              <label style={labelStyle}>Faculty / Discipline</label>
              <div style={selectWrap}>
                <select value={facultyId} onChange={e => setFacultyId(e.target.value)} style={selectStyle}>
                  <option value="">— Select faculty —</option>
                  {FACULTIES.map(f => (
                    <option key={f.id} value={f.id}>{f.icon} {f.label}</option>
                  ))}
                </select>
                <ChevronDown size={12} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)", pointerEvents: "none" }} />
              </div>

              {/* Course */}
              {facultyId && (
                <>
                  <label style={{ ...labelStyle, marginTop: 10 }}>Course / Subject</label>
                  <div style={selectWrap}>
                    <select value={courseId} onChange={e => setCourseId(e.target.value)} style={selectStyle}>
                      <option value="">— Select course —</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={12} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)", pointerEvents: "none" }} />
                  </div>
                </>
              )}

              {/* Topic */}
              {courseId && topics.length > 0 && (
                <>
                  <label style={{ ...labelStyle, marginTop: 10 }}>Topic / Specialisation</label>
                  <div style={selectWrap}>
                    <select value={topic} onChange={e => setTopic(e.target.value)} style={selectStyle}>
                      <option value="">— Select topic —</option>
                      {topics.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <ChevronDown size={12} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)", pointerEvents: "none" }} />
                  </div>
                </>
              )}

              {/* Selected pill */}
              {courseId && (
                <div style={{ marginTop: 10, padding: "6px 10px", background: "var(--brand-muted)", border: "1px solid var(--brand-border)", borderRadius: "var(--r)", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 14 }}>{faculty?.icon}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--brand)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{course?.label}</div>
                    {topic && <div style={{ fontSize: 10, color: "var(--text-4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{topic}</div>}
                  </div>
                </div>
              )}
            </div>

            {/* Article type */}
            <div className="card" style={{ padding: "14px", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <Tag size={13} style={{ color: "var(--brand)" }} />
                <span style={{ fontFamily: "Outfit,sans-serif", fontSize: 12, fontWeight: 800, color: "var(--text)", textTransform: "uppercase", letterSpacing: ".06em" }}>Article Type</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {ARTICLE_TYPES.map(t => (
                  <button key={t} onClick={() => setArticleType(t)} style={{
                    padding: "4px 10px", fontSize: 11, fontWeight: 600, borderRadius: "var(--r-f)", cursor: "pointer", border: "1.5px solid",
                    background: articleType === t ? "var(--brand)" : "transparent",
                    color: articleType === t ? "white" : "var(--text-3)",
                    borderColor: articleType === t ? "var(--brand)" : "var(--border)",
                    transition: "all .15s",
                  }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div className="card" style={{ padding: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <DollarSign size={13} style={{ color: "var(--accent)" }} />
                <span style={{ fontFamily: "Outfit,sans-serif", fontSize: 12, fontWeight: 800, color: "var(--text)", textTransform: "uppercase", letterSpacing: ".06em" }}>Pricing</span>
              </div>
              <label style={labelStyle}>Price per read (USDC)</label>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--bg-alt)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", padding: "7px 10px", marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: "var(--text-4)", fontWeight: 700 }}>$</span>
                <input
                  type="number" step="0.001" min="0.001" max="100"
                  value={price} onChange={e => setPrice(e.target.value)}
                  style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 16, fontWeight: 800, color: "var(--accent)", fontFamily: "Outfit,sans-serif" }}
                />
                <span style={{ fontSize: 11, color: "var(--text-4)" }}>USDC</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", background: "rgba(5,150,105,.06)", border: "1px solid rgba(5,150,105,.15)", borderRadius: "var(--r)" }}>
                <span style={{ fontSize: 11, color: "var(--text-4)" }}>You earn (85%)</span>
                <span style={{ fontFamily: "Outfit,sans-serif", fontSize: 15, fontWeight: 900, color: "var(--accent)" }}>${earn}</span>
              </div>
              <p style={{ fontSize: 10, color: "var(--text-4)", marginTop: 8, lineHeight: 1.5 }}>
                Platform fee: 15% · Paid on-chain per read · No minimum payout.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .write-layout {
          display: grid;
          grid-template-columns: 1fr 240px;
          gap: 14px;
          align-items: start;
        }
        .write-main  { min-width: 0; }
        .write-sidebar { min-width: 0; }
        @media (max-width: 768px) {
          .write-layout { grid-template-columns: 1fr; }
          .write-sidebar { order: -1; }
        }
      `}</style>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 10, fontWeight: 700,
  color: "var(--text-4)", textTransform: "uppercase",
  letterSpacing: ".07em", marginBottom: 5, fontFamily: "Outfit,sans-serif",
};
const selectWrap: React.CSSProperties = {
  position: "relative", display: "block",
};
const selectStyle: React.CSSProperties = {
  width: "100%", padding: "7px 28px 7px 9px",
  background: "var(--bg-alt)", border: "1.5px solid var(--border)",
  borderRadius: "var(--r)", fontSize: 12, fontWeight: 600,
  color: "var(--text)", outline: "none", cursor: "pointer",
  appearance: "none", boxSizing: "border-box",
};
