"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../../../components/ui/Navbar";
import RichEditor from "../../../../components/ui/RichEditor";
import { useAuth } from "../../../../lib/auth";
import { FACULTIES, ALL_COURSES, ARTICLE_TYPES } from "../../../../lib/categories";
import { FacultyIcon } from "../../../../components/ui/FacultyIcon";
import { Save, CheckCircle2, AlertCircle, ArrowLeft, DollarSign, ChevronDown, BookOpen, Tag } from "lucide-react";
import Link from "next/link";

export default function EditArticlePage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const { address, isAuth } = useAuth();

  const [loading,   setLoading]   = useState(true);
  const [title,     setTitle]     = useState("");
  const [blurb,     setBlurb]     = useState("");
  const [content,   setContent]   = useState("");
  const [category,  setCategory]  = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [courseId,  setCourseId]  = useState("");
  const [topic,     setTopic]     = useState("");
  const [articleType,setArticleType]=useState("Analysis");
  const [isFree,    setIsFree]    = useState(false);
  const [price,     setPrice]     = useState("0.020");
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [error,     setError]     = useState("");
  const [notAuth,   setNotAuth]   = useState(false);

  const faculty = FACULTIES.find(f => f.id === facultyId);
  const courses = faculty ? faculty.courses : [];
  const course  = courses.find(c => c.id === courseId);
  const topics  = course ? course.topics : [];

  useEffect(() => {
    if (!id) return;
    fetch(`/api/articles/${id}?admin=1`).then(r => r.json()).then(d => {
      if (d.error) { setError("Article not found"); setLoading(false); return; }
      // Check ownership
      if (d.authorAddress?.toLowerCase() !== address?.toLowerCase()) { setNotAuth(true); setLoading(false); return; }
      setTitle(d.title || "");
      setBlurb(d.blurb || "");
      setContent(d.content || "");
      const p = parseFloat(d.price || "0");
      setIsFree(p === 0);
      setPrice(p > 0 ? String(p) : "0.020");
      // Try to match category to course
      const matchedCourse = ALL_COURSES.find(c => c.label === d.category);
      if (matchedCourse) {
        setFacultyId(matchedCourse.facultyId);
        setCourseId(matchedCourse.id);
      }
      setCategory(d.category || "");
      setLoading(false);
    }).catch(() => { setError("Failed to load article"); setLoading(false); });
  }, [id, address]);

  async function save() {
    if (!title.trim()) { setError("Title is required"); return; }
    setSaving(true); setError("");
    const r = await fetch(`/api/articles/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title, blurb, content,
        price: isFree ? "0" : price,
        category: course?.label || category,
        topic: topic || undefined,
      }),
    });
    const d = await r.json();
    if (!r.ok) { setError(d.error || "Save failed"); setSaving(false); return; }
    setSaved(true); setSaving(false);
    setTimeout(() => router.push(`/article/${id}`), 1200);
  }

  const earn = isFree ? "0.0000" : (parseFloat(price || "0") * 0.85).toFixed(4);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "calc(var(--header-h) + 40px) 16px" }}>
        {[80,40,320].map((h,i) => <div key={i} className="skeleton" style={{ height: h, marginBottom: 14, borderRadius: "var(--r-lg)" }} />)}
      </div>
    </div>
  );

  if (notAuth) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "calc(var(--header-h) + 60px) 16px", textAlign: "center" }}>
        <AlertCircle size={40} style={{ color: "#dc2626", marginBottom: 14 }} />
        <h2 style={{ fontFamily: "Outfit,sans-serif", fontSize: 20, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>Not your article</h2>
        <p style={{ fontSize: 13, color: "var(--text-4)", marginBottom: 20 }}>You can only edit articles you wrote.</p>
        <Link href={`/article/${id}`} className="btn btn-secondary" style={{ gap: 6 }}><ArrowLeft size={13} />Back to Article</Link>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <div style={{ maxWidth: 940, margin: "0 auto", padding: "calc(var(--header-h) + 16px) 14px 80px" }}>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <Link href={`/article/${id}`} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text-4)", textDecoration: "none" }}>
            <ArrowLeft size={13} />Back to article
          </Link>
          <div style={{ flex: 1 }} />
          <button onClick={save} disabled={saving || saved} className="btn btn-primary btn-sm">
            {saved ? <><CheckCircle2 size={12} />Saved!</> : saving ? "Saving…" : <><Save size={12} />Save Changes</>}
          </button>
        </div>

        <h1 style={{ fontFamily: "Outfit,sans-serif", fontSize: "clamp(18px,4vw,22px)", fontWeight: 900, color: "var(--text)", letterSpacing: "-.02em", marginBottom: 4 }}>Edit Article</h1>
        <p style={{ fontSize: 12, color: "var(--text-4)", marginBottom: 18 }}>Changes go live immediately after saving.</p>

        {saved && <div style={{ padding: "10px 14px", background: "rgba(5,150,105,.07)", border: "1px solid rgba(5,150,105,.2)", borderRadius: "var(--r-md)", marginBottom: 14, fontSize: 13, color: "var(--accent)", display: "flex", gap: 7 }}><CheckCircle2 size={14} />Saved! Redirecting…</div>}
        {error && <div style={{ padding: "10px 14px", background: "rgba(220,38,38,.06)", border: "1px solid rgba(220,38,38,.2)", borderRadius: "var(--r-md)", marginBottom: 14, fontSize: 13, color: "#dc2626", display: "flex", gap: 7 }}><AlertCircle size={13} />{error}</div>}

        <div className="write-layout">
          <div className="write-main">
            <div className="card" style={{ padding: "18px", marginBottom: 12 }}>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Article title…"
                style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontFamily: "Outfit,sans-serif", fontSize: "clamp(17px,3.5vw,22px)", fontWeight: 900, color: "var(--text)", marginBottom: 10, boxSizing: "border-box" as const }} />
              <textarea value={blurb} onChange={e => setBlurb(e.target.value)} placeholder="Short summary or hook…" rows={2}
                style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: 13, color: "var(--text-3)", resize: "none", lineHeight: 1.65, boxSizing: "border-box" as const }} />
            </div>
            <RichEditor value={content} onChange={setContent} placeholder="Article content…" minHeight={480} />
            <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
              <button onClick={save} disabled={saving || saved} className="btn btn-primary">
                {saved ? <><CheckCircle2 size={14} />Saved!</> : saving ? "Saving…" : <><Save size={14} />Save Changes</>}
              </button>
            </div>
          </div>

          <div className="write-sidebar">
            {/* Category */}
            <div className="card" style={{ padding: "14px", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                <BookOpen size={13} style={{ color: "var(--brand)" }} />
                <span style={{ fontFamily: "Outfit,sans-serif", fontSize: 12, fontWeight: 800, color: "var(--text)", textTransform: "uppercase", letterSpacing: ".06em" }}>Field of Study</span>
              </div>
              <label style={lbl}>Faculty</label>
              <div style={sw}>
                <select value={facultyId} onChange={e => { setFacultyId(e.target.value); setCourseId(""); setTopic(""); }} style={ss}>
                  <option value="">— Select faculty —</option>
                  {FACULTIES.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                </select>
                <ChevronDown size={12} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)", pointerEvents: "none" }} />
              </div>
              {facultyId && (
                <>
                  <label style={{ ...lbl, marginTop: 10 }}>Course</label>
                  <div style={sw}>
                    <select value={courseId} onChange={e => { setCourseId(e.target.value); setTopic(""); }} style={ss}>
                      <option value="">— Select course —</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                    <ChevronDown size={12} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)", pointerEvents: "none" }} />
                  </div>
                </>
              )}
              {courseId && topics.length > 0 && (
                <>
                  <label style={{ ...lbl, marginTop: 10 }}>Topic</label>
                  <div style={sw}>
                    <select value={topic} onChange={e => setTopic(e.target.value)} style={ss}>
                      <option value="">— Select topic —</option>
                      {topics.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <ChevronDown size={12} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)", pointerEvents: "none" }} />
                  </div>
                </>
              )}
              {!facultyId && category && (
                <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-4)" }}>Current: <strong style={{ color: "var(--text)" }}>{category}</strong></div>
              )}
            </div>

            {/* Article type */}
            <div className="card" style={{ padding: "14px", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <Tag size={13} style={{ color: "var(--brand)" }} />
                <span style={{ fontFamily: "Outfit,sans-serif", fontSize: 12, fontWeight: 800, color: "var(--text)", textTransform: "uppercase", letterSpacing: ".06em" }}>Type</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {ARTICLE_TYPES.map(t => (
                  <button key={t} onClick={() => setArticleType(t)} style={{ padding: "4px 10px", fontSize: 11, fontWeight: 600, borderRadius: "var(--r-f)", cursor: "pointer", border: "1.5px solid", background: articleType === t ? "var(--brand)" : "transparent", color: articleType === t ? "white" : "var(--text-3)", borderColor: articleType === t ? "var(--brand)" : "var(--border)", transition: "all .15s" }}>{t}</button>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div className="card" style={{ padding: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                <DollarSign size={13} style={{ color: "var(--accent)" }} />
                <span style={{ fontFamily: "Outfit,sans-serif", fontSize: 12, fontWeight: 800, color: "var(--text)", textTransform: "uppercase", letterSpacing: ".06em" }}>Pricing</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 12 }}>
                <button onClick={() => setIsFree(true)} style={{ padding: "10px 8px", borderRadius: "var(--r)", border: `2px solid ${isFree ? "var(--accent)" : "var(--border)"}`, background: isFree ? "rgba(5,150,105,.1)" : "transparent", cursor: "pointer", transition: "all .15s" }}>
                  <div style={{ fontFamily: "Outfit,sans-serif", fontSize: 13, fontWeight: 800, color: isFree ? "var(--accent)" : "var(--text)" }}>Free</div>
                  <div style={{ fontSize: 9, color: "var(--text-4)", marginTop: 2 }}>Open to all</div>
                </button>
                <button onClick={() => setIsFree(false)} style={{ padding: "10px 8px", borderRadius: "var(--r)", border: `2px solid ${!isFree ? "var(--brand)" : "var(--border)"}`, background: !isFree ? "var(--brand-muted)" : "transparent", cursor: "pointer", transition: "all .15s" }}>
                  <div style={{ fontFamily: "Outfit,sans-serif", fontSize: 13, fontWeight: 800, color: !isFree ? "var(--brand)" : "var(--text)" }}>Paid</div>
                  <div style={{ fontSize: 9, color: "var(--text-4)", marginTop: 2 }}>Earn USDC</div>
                </button>
              </div>
              {!isFree && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--bg-alt)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", padding: "7px 10px", marginBottom: 10 }}>
                    <span style={{ fontSize: 13, color: "var(--text-4)", fontWeight: 700 }}>$</span>
                    <input type="number" step="0.001" min="0.001" max="100" value={price} onChange={e => setPrice(e.target.value)}
                      style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 16, fontWeight: 800, color: "var(--accent)", fontFamily: "Outfit,sans-serif" }} />
                    <span style={{ fontSize: 11, color: "var(--text-4)" }}>USDC</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", background: "rgba(5,150,105,.06)", border: "1px solid rgba(5,150,105,.15)", borderRadius: "var(--r)" }}>
                    <span style={{ fontSize: 11, color: "var(--text-4)" }}>You earn (85%)</span>
                    <span style={{ fontFamily: "Outfit,sans-serif", fontSize: 15, fontWeight: 900, color: "var(--accent)" }}>${earn}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .write-layout { display: grid; grid-template-columns: 1fr 240px; gap: 14px; align-items: start; }
        .write-main { min-width: 0; }
        .write-sidebar { min-width: 0; }
        @media (max-width: 768px) { .write-layout { grid-template-columns: 1fr; } .write-sidebar { order: -1; } }
      `}</style>
    </div>
  );
}

const lbl: React.CSSProperties = { display:"block", fontSize:10, fontWeight:700, color:"var(--text-4)", textTransform:"uppercase", letterSpacing:".07em", marginBottom:5, fontFamily:"Outfit,sans-serif" };
const sw: React.CSSProperties = { position:"relative", display:"block" };
const ss: React.CSSProperties = { width:"100%", padding:"7px 28px 7px 9px", background:"var(--bg-alt)", border:"1.5px solid var(--border)", borderRadius:"var(--r)", fontSize:12, fontWeight:600, color:"var(--text)", outline:"none", cursor:"pointer", appearance:"none", boxSizing:"border-box" };
