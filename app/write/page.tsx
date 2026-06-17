"use client";
import { useState } from "react";
import Link from "next/link";
import { Zap, Bold, Italic, List, Heading2, Quote, Code, Eye, Send, DollarSign, Tag, Clock, Image } from "lucide-react";

const CATEGORIES = ["Web3", "Development", "Blockchain", "Economics", "Research", "Guide", "AI", "DeFi", "Culture", "Opinion"];

export default function WritePage() {
  const [title, setTitle] = useState("");
  const [blurb, setBlurb] = useState("");
  const [body, setBody] = useState("");
  const [price, setPrice] = useState(0.02);
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [preview, setPreview] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [step, setStep] = useState<"idle" | "encrypting" | "ipfs" | "chain" | "done">("idle");

  const wordCount = body.split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t) && tags.length < 5) {
      setTags([...tags, t]);
      setTagInput("");
    }
  }

  function removeTag(t: string) {
    setTags(tags.filter((x) => x !== t));
  }

  async function handlePublish() {
    if (!title || !blurb || !body || !category) return;
    setPublishing(true);
    setStep("encrypting");
    await new Promise((r) => setTimeout(r, 1200));
    setStep("ipfs");
    await new Promise((r) => setTimeout(r, 1500));
    setStep("chain");
    await new Promise((r) => setTimeout(r, 1800));
    setStep("done");
    setPublished(true);
    setPublishing(false);
  }

  const STEP_LABELS = {
    idle: "",
    encrypting: "Encrypting content with AES-256...",
    ipfs: "Uploading to IPFS/Arweave...",
    chain: "Registering on Arc blockchain...",
    done: "Published! ✓",
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-arc-500 to-usdc-500 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-heading font-bold">Readlearc</span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPreview(!preview)}
              className="flex items-center gap-2 px-4 py-2 glass border border-white/10 rounded-lg text-sm text-gray-400 hover:text-white transition-all"
            >
              <Eye className="w-4 h-4" /> {preview ? "Edit" : "Preview"}
            </button>
            <button
              onClick={handlePublish}
              disabled={publishing || published || !title || !blurb || !body || !category}
              className="flex items-center gap-2 px-5 py-2 bg-arc-600 hover:bg-arc-500 disabled:bg-arc-800 disabled:text-gray-500 rounded-lg text-sm font-semibold transition-all"
            >
              <Send className="w-4 h-4" />
              {publishing ? STEP_LABELS[step] : published ? "Published! ✓" : "Publish Article"}
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 pt-24 pb-20">
        {published ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-usdc-500/20 flex items-center justify-center mx-auto mb-6">
              <Zap className="w-10 h-10 text-usdc-400" />
            </div>
            <h2 className="font-heading text-4xl font-bold mb-4">Article Published! 🎉</h2>
            <p className="text-gray-400 mb-2">Your article is live on Arc blockchain.</p>
            <p className="text-xs text-gray-600 font-mono mb-8">articleId: 0x{Math.random().toString(16).slice(2, 18)} · Arc Testnet</p>
            <div className="flex gap-4 justify-center">
              <Link href="/article/1" className="px-6 py-3 bg-arc-600 hover:bg-arc-500 rounded-xl font-semibold transition-all">
                View Article
              </Link>
              <Link href="/dashboard" className="px-6 py-3 glass border border-white/10 rounded-xl font-semibold hover:border-arc-500/30 text-gray-300 transition-all">
                Go to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main editor */}
            <div className="lg:col-span-2 space-y-6">
              {/* Publish progress */}
              {publishing && (
                <div className="glass-arc rounded-xl p-4 flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-arc-400/30 border-t-arc-400 rounded-full animate-spin" />
                  <span className="text-sm text-arc-300">{STEP_LABELS[step]}</span>
                </div>
              )}

              {/* Title */}
              <input
                type="text"
                placeholder="Article title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent text-4xl font-heading font-bold text-white placeholder:text-gray-700 focus:outline-none leading-tight"
              />

              {/* Preview blurb */}
              <div>
                <label className="text-xs text-gray-600 uppercase tracking-wider font-semibold mb-2 block">Preview Blurb (always public)</label>
                <textarea
                  placeholder="Write a teaser that makes readers want to pay to read more..."
                  value={blurb}
                  onChange={(e) => setBlurb(e.target.value)}
                  maxLength={300}
                  rows={3}
                  className="w-full bg-transparent glass rounded-xl p-4 border border-white/10 text-gray-300 placeholder:text-gray-700 focus:outline-none focus:border-arc-500/50 text-base resize-none"
                />
                <div className="text-right text-xs text-gray-700">{blurb.length}/300</div>
              </div>

              {/* Editor toolbar */}
              {!preview && (
                <div className="glass rounded-xl border border-white/10">
                  <div className="flex items-center gap-1 px-3 py-2 border-b border-white/5">
                    {[
                      { icon: Bold, label: "Bold" },
                      { icon: Italic, label: "Italic" },
                      { icon: Heading2, label: "H2" },
                      { icon: List, label: "List" },
                      { icon: Quote, label: "Quote" },
                      { icon: Code, label: "Code" },
                      { icon: Image, label: "Image" },
                    ].map(({ icon: Icon, label }) => (
                      <button
                        key={label}
                        title={label}
                        className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all"
                      >
                        <Icon className="w-4 h-4" />
                      </button>
                    ))}
                    <div className="ml-auto flex items-center gap-2 text-xs text-gray-600">
                      <Clock className="w-3 h-3" /> {readTime} min read · {wordCount} words
                    </div>
                  </div>
                  <textarea
                    placeholder="Write your full article here. This content will be encrypted and locked behind payment..."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={20}
                    className="w-full bg-transparent p-6 text-gray-300 placeholder:text-gray-700 focus:outline-none text-base leading-relaxed resize-none"
                  />
                </div>
              )}

              {preview && (
                <div className="glass rounded-xl border border-white/10 p-8">
                  <h1 className="font-heading text-3xl font-bold mb-4">{title || "Your title here"}</h1>
                  <p className="text-gray-300 text-lg leading-relaxed mb-6 border-l-2 border-arc-500 pl-4">{blurb || "Your preview blurb..."}</p>
                  <div className="h-px bg-white/5 mb-6" />
                  <div className="text-gray-400 leading-relaxed whitespace-pre-wrap">{body || "Your article body..."}</div>
                </div>
              )}
            </div>

            {/* Sidebar settings */}
            <div className="space-y-4">
              {/* Price */}
              <div className="glass rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-4 h-4 text-usdc-400" />
                  <h3 className="font-semibold text-sm">Article Price</h3>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-gray-500">$</span>
                  <input
                    type="number"
                    min={0.01}
                    max={1.0}
                    step={0.01}
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value))}
                    className="flex-1 bg-transparent text-2xl font-bold text-usdc-400 focus:outline-none"
                  />
                  <span className="text-gray-500 text-sm">USDC</span>
                </div>
                <input
                  type="range"
                  min={0.01}
                  max={1.0}
                  step={0.01}
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value))}
                  className="w-full accent-arc-500"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>$0.01</span><span>$1.00</span>
                </div>
                <div className="mt-3 pt-3 border-t border-white/5 text-xs text-gray-600">
                  You earn: <span className="text-usdc-400 font-semibold">${(price * 0.85).toFixed(3)} USDC</span> per read (85%)
                </div>
              </div>

              {/* Category */}
              <div className="glass rounded-xl p-5">
                <h3 className="font-semibold text-sm mb-3">Category</h3>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        category === cat
                          ? "bg-arc-600 text-white"
                          : "glass border border-white/10 text-gray-500 hover:border-arc-500/30 hover:text-white"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div className="glass rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-4 h-4 text-gray-500" />
                  <h3 className="font-semibold text-sm">Tags ({tags.length}/5)</h3>
                </div>
                <div className="flex gap-2 mb-3 flex-wrap">
                  {tags.map((t) => (
                    <span
                      key={t}
                      onClick={() => removeTag(t)}
                      className="px-2 py-1 text-xs bg-arc-500/20 text-arc-300 rounded-full cursor-pointer hover:bg-red-500/20 hover:text-red-400 transition-colors"
                    >
                      #{t} ×
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addTag()}
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-700 focus:outline-none"
                  />
                  <button onClick={addTag} className="text-xs text-arc-400 hover:text-arc-300">Add</button>
                </div>
              </div>

              {/* Checklist */}
              <div className="glass rounded-xl p-5">
                <h3 className="font-semibold text-sm mb-3">Publish Checklist</h3>
                <div className="space-y-2">
                  {[
                    { label: "Title", done: title.length > 0 },
                    { label: "Preview blurb", done: blurb.length > 0 },
                    { label: "Article body", done: body.length > 100 },
                    { label: "Category selected", done: category.length > 0 },
                    { label: "Price set", done: price > 0 },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2 text-sm">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${item.done ? "bg-usdc-500/30 text-usdc-400" : "bg-gray-800 text-gray-700"}`}>
                        {item.done ? "✓" : "·"}
                      </div>
                      <span className={item.done ? "text-gray-300" : "text-gray-600"}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
