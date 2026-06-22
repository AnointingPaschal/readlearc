"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Navbar from "../../../components/ui/Navbar";
import WordEditor from "../../../components/ui/WordEditor";
import { useAuth } from "../../../lib/auth";
import {
  FACULTIES, ALL_COURSES, RESEARCH_TYPES, ACADEMIC_LEVELS,
  RESEARCH_SECTION_TYPES,
} from "../../../lib/categories";
import {
  Plus, Save, CheckCircle2, Trash2, Edit3, ChevronDown, ChevronUp,
  BookOpen, Clock, Send, AlertCircle, PenLine, List, FlaskConical,
  GraduationCap, Tag, Layers, ChevronRight,
} from "lucide-react";
import { FacultyIcon } from "../../../components/ui/FacultyIcon";

interface Section {
  id: string; type: string; title: string;
  content: string; createdAt: string; updatedAt: string;
}

export default function ResearchPage() {
  const { address, isAuth, requireAuth } = useAuth();

  // Paper identity
  const [draftId,       setDraftId]       = useState<string | null>(null);
  const [paperTitle,    setPaperTitle]    = useState("");
  const [keywords,      setKeywords]      = useState("");
  const [facultyId,     setFacultyId]     = useState("");
  const [courseId,      setCourseId]      = useState("");
  const [topic,         setTopic]         = useState("");
  const [researchType,  setResearchType]  = useState("");
  const [academicLevel, setAcademicLevel] = useState("");
  const [authorNote,    setAuthorNote]    = useState("");

  // Editor
  const [sections,    setSections]    = useState<Section[]>([]);
  const [activeType,  setActiveType]  = useState("Abstract");
  const [customTitle, setCustomTitle] = useState("");
  const [editorHtml,  setEditorHtml]  = useState("");
  const [editingId,   setEditingId]   = useState<string | null>(null);
  const [editHtml,    setEditHtml]    = useState("");
  const [expanded,    setExpanded]    = useState<string | null>(null);

  // UI state
  const [saving,      setSaving]      = useState(false);
  const [autoSaved,   setAutoSaved]   = useState<Date | null>(null);
  const [publishing,  setPublishing]  = useState(false);
  const [published,   setPublished]   = useState(false);
  const [error,       setError]       = useState("");
  const [mobileTab,   setMobileTab]   = useState<"write" | "sections" | "meta">("meta");

  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derived
  const faculty = useMemo(() => FACULTIES.find(f => f.id === facultyId), [facultyId]);
  const courses = faculty ? faculty.courses : [];
  const course  = useMemo(() => courses.find(c => c.id === courseId), [courses, courseId]);
  const topics  = course ? course.topics : [];

  useEffect(() => { setCourseId(""); setTopic(""); }, [facultyId]);
  useEffect(() => { setTopic(""); }, [courseId]);

  // Load draft
  useEffect(() => {
    if (!address) return;
    fetch(`/api/drafts?author=${address.toLowerCase()}`).then(r => r.json()).then(d => {
      const ex = Array.isArray(d) ? d[0] : null;
      if (ex) {
        setDraftId(String(ex.id));
        setPaperTitle(ex.title || "");
        setKeywords((ex.keywords || []).join(", "));
        setSections(ex.sections || []);
        if (ex.facultyId) setFacultyId(ex.facultyId);
        if (ex.courseId) setCourseId(ex.courseId);
        if (ex.topic) setTopic(ex.topic);
        if (ex.researchType) setResearchType(ex.researchType);
        if (ex.academicLevel) setAcademicLevel(ex.academicLevel);
      }
    });
  }, [address]);

  // Auto-save triggers
  useEffect(() => {
    if (!editorHtml.includes(".") || !address) return;
    if (autoTimer.current) clearTimeout(autoTimer.current);
    autoTimer.current = setTimeout(() => saveDraft(true), 1500);
    return () => { if (autoTimer.current) clearTimeout(autoTimer.current); };
  }, [editorHtml]);

  useEffect(() => {
    if (!sections.length || !address) return;
    if (autoTimer.current) clearTimeout(autoTimer.current);
    autoTimer.current = setTimeout(() => saveDraft(true), 2000);
  }, [sections, paperTitle, keywords, facultyId, courseId, topic, researchType, academicLevel]);

  const saveDraft = useCallback(async (silent = false) => {
    if (!address) return;
    if (!silent) setSaving(true);
    const body = {
      authorAddress: address.toLowerCase(),
      title: paperTitle, sections,
      refs: [],
      keywords: keywords.split(",").map(k => k.trim()).filter(Boolean),
      facultyId, courseId, topic, researchType, academicLevel,
      status: "draft",
    };
    const url    = draftId ? `/api/drafts/${draftId}` : "/api/drafts";
    const method = draftId ? "PUT" : "POST";
    const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json();
    if (!draftId && d.id) setDraftId(String(d.id));
    setAutoSaved(new Date());
    if (!silent) setSaving(false);
  }, [address, paperTitle, sections, keywords, draftId, facultyId, courseId, topic, researchType, academicLevel]);

  function addSection() {
    const text = editorHtml.replace(/<[^>]+>/g, "").trim();
    if (!text) { setError("Write some content before adding the section."); return; }
    setError("");
    const title = activeType === "Custom" ? (customTitle || "Custom Section") : activeType;
    const newSec: Section = {
      id: Date.now().toString(), type: activeType, title,
      content: editorHtml, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    setSections(prev => {
      const exists = prev.find(s => s.type === activeType && activeType !== "Custom");
      if (exists) return prev.map(s => s.id === exists.id ? { ...newSec, id: exists.id } : s);
      return [...prev, newSec];
    });
    setEditorHtml("");
    const idx = RESEARCH_SECTION_TYPES.indexOf(activeType);
    if (idx >= 0 && idx < RESEARCH_SECTION_TYPES.length - 2) setActiveType(RESEARCH_SECTION_TYPES[idx + 1]);
    setMobileTab("sections");
  }

  function startEdit(s: Section) { setEditingId(s.id); setEditHtml(s.content); setExpanded(s.id); }
  function saveEdit(id: string) {
    setSections(prev => prev.map(s => s.id === id ? { ...s, content: editHtml, updatedAt: new Date().toISOString() } : s));
    setEditingId(null); setEditHtml("");
  }
  function delSection(id: string) { if (!confirm("Remove this section?")) return; setSections(prev => prev.filter(s => s.id !== id)); }

  async function publish() {
    if (!address || !sections.length) return;
    setPublishing(true); setError("");
    const fullContent  = sections.map(s => `<h2>${s.title}</h2>\n${s.content}`).join("\n\n");
    const abstract     = sections.find(s => s.type === "Abstract");
    const blurb        = abstract ? abstract.content.replace(/<[^>]+>/g, "").slice(0, 240) : "";
    const categoryLabel = course?.label || "Research";
    const r = await fetch("/api/articles", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: paperTitle || "Untitled Research",
        blurb, content: fullContent,
        category: categoryLabel,
        topic: topic || undefined,
        researchType: researchType || undefined,
        academicLevel: academicLevel || undefined,
        authorAddress: address.toLowerCase(),
        isResearch: true, status: "pending",
      }),
    });
    const d = await r.json();
    if (r.ok && d.id) setPublished(true);
    else setError(d.error || "Publish failed");
    setPublishing(false);
  }

  const alreadyAdded = sections.find(s => s.type === activeType && activeType !== "Custom");
  const completeness = Math.round((sections.length / 8) * 100);
  const coreCount = ["Abstract","Introduction","Methodology","Results","Discussion","Conclusion"].filter(
    t => sections.find(s => s.type === t)
  ).length;

  if (!isAuth) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "calc(var(--header-h) + 60px) 20px", textAlign: "center" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--brand-muted)", border: "2px solid var(--brand-border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <FlaskConical size={32} style={{ color: "var(--brand)" }} />
        </div>
        <h2 style={{ fontFamily: "Outfit,sans-serif", fontSize: 22, fontWeight: 900, color: "var(--text)", marginBottom: 8 }}>Research Writing Studio</h2>
        <p style={{ fontSize: 14, color: "var(--text-3)", marginBottom: 24, lineHeight: 1.7 }}>
          A structured environment for writing and publishing academic research across all university disciplines.
        </p>
        <button onClick={() => requireAuth()} className="btn btn-primary btn-lg" style={{ width: "100%", justifyContent: "center" }}>Sign In to Write Research</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />

      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "calc(var(--header-h) + 10px) 12px 80px" }}>

        {/* ── Top bar ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10, gap: 10, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
              <FlaskConical size={16} style={{ color: "var(--brand)" }} />
              <h1 style={{ fontFamily: "Outfit,sans-serif", fontSize: "clamp(15px,3.5vw,20px)", fontWeight: 900, color: "var(--text)", letterSpacing: "-.02em", margin: 0 }}>
                Research Writing Studio
              </h1>
            </div>
            <p style={{ fontSize: 10, color: "var(--text-4)", display: "flex", alignItems: "center", gap: 4 }}>
              <Clock size={9} />
              {autoSaved ? `Auto-saved ${autoSaved.toLocaleTimeString()}` : "Auto-saves as you write"}
              {sections.length > 0 && (
                <>
                  <span style={{ color: "var(--border)" }}>·</span>
                  <span style={{ color: coreCount >= 4 ? "var(--accent)" : "var(--text-4)" }}>
                    {coreCount}/6 core sections
                  </span>
                </>
              )}
            </p>
          </div>
          <div style={{ display: "flex", gap: 7, flexShrink: 0 }}>
            <button onClick={() => saveDraft(false)} disabled={saving} className="btn btn-secondary btn-sm">
              {saving ? "Saving…" : <><Save size={11} />Save</>}
            </button>
            {sections.length > 0 && !published && (
              <button onClick={publish} disabled={publishing} className="btn btn-primary btn-sm">
                {publishing ? "Publishing…" : <><Send size={11} />Submit</>}
              </button>
            )}
          </div>
        </div>

        {published && (
          <div style={{ padding: "11px 14px", background: "rgba(5,150,105,.07)", border: "1px solid rgba(5,150,105,.2)", borderRadius: "var(--r-md)", marginBottom: 10, display: "flex", gap: 8, alignItems: "center", fontSize: 13, fontWeight: 600, color: "var(--accent)" }}>
            <CheckCircle2 size={15} />Submitted for review! Appears on site once approved.
          </div>
        )}
        {error && (
          <div style={{ padding: "10px 14px", background: "rgba(220,38,38,.06)", border: "1px solid rgba(220,38,38,.2)", borderRadius: "var(--r-md)", marginBottom: 10, fontSize: 13, color: "#dc2626", display: "flex", gap: 7 }}>
            <AlertCircle size={13} style={{ flexShrink: 0, marginTop: 1 }} />{error}
          </div>
        )}

        {/* ── Mobile tabs ── */}
        <div className="mobile-only" style={{ display: "flex", borderRadius: "var(--r)", overflow: "hidden", border: "1.5px solid var(--border)", marginBottom: 10 }}>
          {(["meta", "write", "sections"] as const).map(t => (
            <button key={t} onClick={() => setMobileTab(t)} style={{
              flex: 1, padding: "8px 4px", border: "none", cursor: "pointer",
              fontFamily: "Outfit,sans-serif", fontSize: 11, fontWeight: 700, transition: "all .15s",
              background: mobileTab === t ? "var(--brand)" : "var(--bg-alt)",
              color: mobileTab === t ? "white" : "var(--text-4)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
            }}>
              {t === "meta" ? <><Layers size={11} />Info</> : t === "write" ? <><PenLine size={11} />Write</> : <><List size={11} />Sections ({sections.length})</>}
            </button>
          ))}
        </div>

        {/* ── 3-column layout ── */}
        <div className="research-layout">

          {/* ── COL 1: Paper metadata ── */}
          <div className={`research-meta-col${mobileTab === "meta" ? "" : " mobile-hidden"}`}>

            {/* Paper title & keywords */}
            <div className="card" style={{ padding: "14px", marginBottom: 8 }}>
              <label style={lbl}>Paper Title</label>
              <input
                value={paperTitle} onChange={e => setPaperTitle(e.target.value)}
                placeholder="Research paper title…"
                style={{ width: "100%", border: "none", borderBottom: "1.5px solid var(--border)", outline: "none", background: "transparent", fontFamily: "Outfit,sans-serif", fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 12, paddingBottom: 8, boxSizing: "border-box" }}
              />
              <label style={lbl}>Keywords</label>
              <input
                value={keywords} onChange={e => setKeywords(e.target.value)}
                placeholder="machine learning, neural networks, NLP…"
                style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: 11, color: "var(--text-3)", boxSizing: "border-box" }}
              />
            </div>

            {/* Field of study */}
            <div className="card" style={{ padding: "14px", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 10 }}>
                <BookOpen size={12} style={{ color: "var(--brand)" }} />
                <span style={{ fontFamily: "Outfit,sans-serif", fontSize: 11, fontWeight: 800, color: "var(--text)", textTransform: "uppercase", letterSpacing: ".07em" }}>Field of Study</span>
              </div>

              <label style={lbl}>Faculty / Discipline</label>
              <div style={sw}>
                <select value={facultyId} onChange={e => setFacultyId(e.target.value)} style={ss}>
                  <option value="">— Select faculty —</option>
                  {FACULTIES.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                </select>
                <ChevronDown size={11} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)", pointerEvents: "none" }} />
              </div>

              {facultyId && (
                <>
                  <label style={{ ...lbl, marginTop: 8 }}>Course / Subject</label>
                  <div style={sw}>
                    <select value={courseId} onChange={e => setCourseId(e.target.value)} style={ss}>
                      <option value="">— Select course —</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                    <ChevronDown size={11} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)", pointerEvents: "none" }} />
                  </div>
                </>
              )}

              {courseId && topics.length > 0 && (
                <>
                  <label style={{ ...lbl, marginTop: 8 }}>Specific Topic</label>
                  <div style={sw}>
                    <select value={topic} onChange={e => setTopic(e.target.value)} style={ss}>
                      <option value="">— Select topic —</option>
                      {topics.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <ChevronDown size={11} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)", pointerEvents: "none" }} />
                  </div>
                </>
              )}

              {courseId && (
                <div style={{ marginTop: 8, padding: "6px 9px", background: "var(--brand-muted)", borderRadius: "var(--r)", border: "1px solid var(--brand-border)", display: "flex", alignItems: "center", gap: 5 }}>
                  {faculty && <FacultyIcon name={faculty.icon} size={13} style={{ color: faculty.color, flexShrink: 0 }} />}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--brand)" }}>{course?.label}</div>
                    {topic && <div style={{ fontSize: 10, color: "var(--text-4)" }}>{topic}</div>}
                  </div>
                </div>
              )}
            </div>

            {/* Research type & level */}
            <div className="card" style={{ padding: "14px", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 10 }}>
                <Tag size={12} style={{ color: "var(--brand)" }} />
                <span style={{ fontFamily: "Outfit,sans-serif", fontSize: 11, fontWeight: 800, color: "var(--text)", textTransform: "uppercase", letterSpacing: ".07em" }}>Research Details</span>
              </div>

              <label style={lbl}>Research Type</label>
              <div style={sw}>
                <select value={researchType} onChange={e => setResearchType(e.target.value)} style={ss}>
                  <option value="">— Select type —</option>
                  {RESEARCH_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <ChevronDown size={11} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)", pointerEvents: "none" }} />
              </div>

              <label style={{ ...lbl, marginTop: 8 }}>Academic Level</label>
              <div style={sw}>
                <select value={academicLevel} onChange={e => setAcademicLevel(e.target.value)} style={ss}>
                  <option value="">— Select level —</option>
                  {ACADEMIC_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <ChevronDown size={11} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)", pointerEvents: "none" }} />
              </div>
            </div>

            {/* Author note */}
            <div className="card" style={{ padding: "14px" }}>
              <label style={lbl}>Author Note / Abstract Teaser</label>
              <textarea
                value={authorNote} onChange={e => setAuthorNote(e.target.value)}
                placeholder="Brief note about this paper shown to potential readers…" rows={3}
                style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: 12, color: "var(--text-3)", resize: "none", lineHeight: 1.65, boxSizing: "border-box" }}
              />
            </div>

            {/* Completeness bar */}
            {sections.length > 0 && (
              <div className="card" style={{ padding: "12px 14px", marginTop: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)" }}>Paper completeness</span>
                  <span style={{ fontSize: 11, fontWeight: 900, color: "var(--brand)", fontFamily: "Outfit,sans-serif" }}>{Math.min(completeness, 100)}%</span>
                </div>
                <div style={{ height: 5, background: "var(--bg-alt)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(completeness, 100)}%`, background: "var(--brand)", borderRadius: 99, transition: "width .4s" }} />
                </div>
                <p style={{ fontSize: 9, color: "var(--text-4)", marginTop: 5 }}>
                  Based on typical research paper structure (8 sections = 100%)
                </p>
              </div>
            )}
          </div>

          {/* ── COL 2: Write editor ── */}
          <div className={`research-write-col${mobileTab === "write" ? "" : " mobile-hidden"}`}>

            {/* Section picker */}
            <div className="card" style={{ padding: "12px 14px", marginBottom: 8 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: alreadyAdded ? 8 : 0 }}>
                <div style={sw}>
                  <select value={activeType} onChange={e => setActiveType(e.target.value)} style={{ ...ss, fontWeight: 700, minWidth: 180 }}>
                    {RESEARCH_SECTION_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                  <ChevronDown size={11} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)", pointerEvents: "none" }} />
                </div>
                {activeType === "Custom" && (
                  <input value={customTitle} onChange={e => setCustomTitle(e.target.value)} placeholder="Section name…"
                    style={{ flex: 1, minWidth: 120, padding: "7px 10px", background: "var(--bg-alt)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", fontSize: 12, color: "var(--text)", outline: "none" }} />
                )}
                <button onClick={addSection} className="btn btn-primary btn-sm" style={{ flexShrink: 0, gap: 5 }}>
                  <Plus size={13} />{alreadyAdded ? "Update" : "Add Section"}
                </button>
              </div>
              {alreadyAdded && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "var(--accent)", fontWeight: 600 }}>
                  <CheckCircle2 size={9} />Already added — clicking Update will replace the existing content.
                </div>
              )}
            </div>

            {/* Section type hint */}
            <div style={{ marginBottom: 8, padding: "8px 12px", background: "var(--bg-alt)", borderRadius: "var(--r)", border: "1px solid var(--border)" }}>
              <p style={{ fontSize: 11, color: "var(--text-4)", margin: 0 }}>{sectionHint(activeType)}</p>
            </div>

            {/* Word editor */}
            <WordEditor
              value={editorHtml}
              onChange={setEditorHtml}
              placeholder={`Write your ${activeType === "Custom" ? customTitle || "section" : activeType} here…`}
            />
          </div>

          {/* ── COL 3: Sections list ── */}
          <div className={`research-sections-col${mobileTab === "sections" ? "" : " mobile-hidden"}`}>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <h3 style={{ fontFamily: "Outfit,sans-serif", fontSize: 12, fontWeight: 800, color: "var(--text)", margin: 0, textTransform: "uppercase", letterSpacing: ".06em" }}>
                Sections ({sections.length})
              </h3>
              {sections.length > 0 && (
                <span style={{ fontSize: 9, color: "var(--accent)", fontWeight: 600 }}>
                  <CheckCircle2 size={9} style={{ display: "inline", marginRight: 3 }} />Saved
                </span>
              )}
            </div>

            {!sections.length ? (
              <div style={{ padding: "32px 16px", textAlign: "center", background: "var(--bg-card)", border: "1.5px dashed var(--border)", borderRadius: "var(--r-lg)" }}>
                <FlaskConical size={30} style={{ color: "var(--text-4)", marginBottom: 10 }} />
                <p style={{ fontSize: 12, color: "var(--text-4)", lineHeight: 1.7, margin: 0 }}>
                  No sections yet.<br />Start with the <strong>Abstract</strong> on the Write tab.
                </p>
              </div>
            ) : (
              sections.map((s, i) => (
                <div key={s.id} className="card" style={{ overflow: "hidden", padding: 0, marginBottom: 7 }}>
                  <div style={{ padding: "8px 10px", background: "var(--bg-alt)", display: "flex", alignItems: "center", gap: 7, borderBottom: expanded === s.id ? "1px solid var(--border)" : "none" }}>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--brand-muted)", border: "1px solid var(--brand-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontFamily: "Outfit,sans-serif", fontSize: 8, fontWeight: 700, color: "var(--brand)" }}>{i + 1}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "Outfit,sans-serif", fontSize: 11, fontWeight: 700, color: "var(--brand)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.title}</div>
                      <div style={{ fontSize: 9, color: "var(--text-4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.content.replace(/<[^>]+>/g, "").slice(0, 50)}…
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 1, flexShrink: 0 }}>
                      <button onClick={() => startEdit(s)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--brand)", padding: 3 }}><Edit3 size={11} /></button>
                      <button onClick={() => delSection(s.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", padding: 3 }}><Trash2 size={11} /></button>
                      <button onClick={() => setExpanded(expanded === s.id ? null : s.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-4)", padding: 3 }}>
                        {expanded === s.id ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                      </button>
                    </div>
                  </div>
                  {expanded === s.id && (
                    <div style={{ padding: "10px 12px" }}>
                      {editingId === s.id ? (
                        <>
                          <WordEditor value={editHtml} onChange={setEditHtml} placeholder="Edit…" />
                          <div style={{ display: "flex", gap: 6, marginTop: 8, justifyContent: "flex-end" }}>
                            <button onClick={() => saveEdit(s.id)} className="btn btn-primary btn-xs"><CheckCircle2 size={10} />Save</button>
                            <button onClick={() => setEditingId(null)} className="btn btn-ghost btn-xs">Cancel</button>
                          </div>
                        </>
                      ) : (
                        <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.75 }} dangerouslySetInnerHTML={{ __html: s.content }} />
                      )}
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Outline */}
            {sections.length > 0 && (
              <div className="card" style={{ padding: "12px", marginTop: 4 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 7, fontFamily: "Outfit,sans-serif" }}>Paper Outline</div>
                {sections.map((s, i) => (
                  <button key={s.id} onClick={() => { setActiveType(s.type); setEditorHtml(s.content); setMobileTab("write"); }}
                    style={{ width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: "4px 0", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 9, color: "var(--text-4)", width: 14, flexShrink: 0 }}>{i + 1}.</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--brand)" }}>{s.title}</span>
                    <ChevronRight size={9} style={{ marginLeft: "auto", color: "var(--text-4)" }} />
                  </button>
                ))}
              </div>
            )}

            {/* Missing sections hint */}
            {sections.length > 0 && sections.length < 10 && (
              <div style={{ marginTop: 8 }}>
                <p style={{ fontSize: 10, color: "var(--text-4)", marginBottom: 6 }}>Suggested next:</p>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {RESEARCH_SECTION_TYPES
                    .filter(t => t !== "Custom" && !sections.find(s => s.type === t))
                    .slice(0, 5)
                    .map(t => (
                      <button key={t} onClick={() => { setActiveType(t); setMobileTab("write"); }}
                        style={{ padding: "3px 9px", fontSize: 10, fontWeight: 600, color: "var(--brand)", background: "var(--brand-muted)", border: "1px solid var(--brand-border)", borderRadius: "var(--r-f)", cursor: "pointer" }}>
                        + {t}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .research-layout {
          display: grid;
          grid-template-columns: 220px 1fr 240px;
          gap: 12px;
          align-items: start;
        }
        .research-meta-col, .research-write-col, .research-sections-col { min-width: 0; }
        .mobile-only { display: none; }
        @media (max-width: 900px) {
          .research-layout { display: block; }
          .mobile-only { display: flex !important; }
          .mobile-hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function sectionHint(type: string): string {
  const hints: Record<string, string> = {
    "Abstract": "Summarise the entire paper in 150–300 words: problem, method, key findings, and significance.",
    "Introduction": "State the research problem, context, gaps in existing knowledge, and the paper's purpose.",
    "Background": "Provide context, definitions, and background knowledge needed to understand the study.",
    "Literature Review": "Critically evaluate existing research relevant to your topic, identifying themes and gaps.",
    "Theoretical Framework": "Explain the theoretical lens or conceptual model guiding your research.",
    "Research Questions & Hypotheses": "State the specific research questions or hypotheses this study addresses.",
    "Methodology": "Describe your research design, participants, instruments, data collection, and analysis approach.",
    "Data Collection": "Detail how data was gathered — surveys, interviews, experiments, observations, etc.",
    "Results": "Present findings objectively, supported by data, tables, or figures without interpretation.",
    "Analysis": "Interpret your data, identify patterns, and link findings to your research questions.",
    "Discussion": "Discuss the implications of your results in the context of existing literature.",
    "Implications": "Explain the practical, theoretical, or policy implications of your findings.",
    "Limitations": "Acknowledge constraints, biases, or boundaries of your study honestly.",
    "Recommendations": "Suggest actions for practitioners, policymakers, or future researchers.",
    "Conclusion": "Summarise key findings, restate significance, and suggest future research directions.",
    "Ethical Considerations": "Describe ethical approvals, consent procedures, confidentiality, and data protection.",
    "Acknowledgements": "Thank contributors, funding bodies, and supervisors.",
    "References": "List all cited sources in your chosen citation style (APA, MLA, Harvard, etc.).",
    "Appendix": "Include supplementary materials, raw data, instruments, or additional figures.",
    "Glossary": "Define technical terms and abbreviations used in the paper.",
    "Custom": "Write your own custom section.",
  };
  return hints[type] || `Write your ${type} section here.`;
}

const lbl: React.CSSProperties = {
  display: "block", fontSize: 10, fontWeight: 700,
  color: "var(--text-4)", textTransform: "uppercase",
  letterSpacing: ".07em", marginBottom: 4, fontFamily: "Outfit,sans-serif",
};
const sw: React.CSSProperties = { position: "relative", display: "block" };
const ss: React.CSSProperties = {
  width: "100%", padding: "7px 26px 7px 9px",
  background: "var(--bg-alt)", border: "1.5px solid var(--border)",
  borderRadius: "var(--r)", fontSize: 12, fontWeight: 600,
  color: "var(--text)", outline: "none", cursor: "pointer",
  appearance: "none", boxSizing: "border-box",
};
