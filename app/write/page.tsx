"use client";
import { useState } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { Zap, Bold, Italic, List, Heading2, Quote, Code, Eye, Send, DollarSign, Tag, Clock, Image, AlertCircle } from "lucide-react";
import { getProvider, READLEARC_ADDRESS, READLEARC_ABI } from "../../lib/web3";

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
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState<"idle" | "wallet" | "tx" | "mining" | "done">("idle");

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
    setError("");

    try {
      if (!READLEARC_ADDRESS) {
        throw new Error("Contract address not configured in .env.local");
      }

      setStep("wallet");
      const provider = await getProvider();
      const signer = await provider.getSigner();
      
      const contract = new ethers.Contract(READLEARC_ADDRESS, READLEARC_ABI, signer);

      setStep("tx");
      // Convert price to USDC base units (assuming 6 decimals)
      const priceInUSDC = ethers.parseUnits(price.toString(), 6);

      const tx = await contract.publishArticle(
        title,
        blurb,
        body, // 100% on-chain content
        priceInUSDC,
        category,
        readTime
      );

      setStep("mining");
      setTxHash(tx.hash);
      await tx.wait(); // Wait for 1 confirmation

      setStep("done");
      setPublished(true);
    } catch (err: any) {
      console.error(err);
      setError(err.reason || err.message || "An unknown error occurred during transaction");
    } finally {
      setPublishing(false);
    }
  }

  const STEP_LABELS = {
    idle: "",
    wallet: "Awaiting wallet approval...",
    tx: "Sign transaction in wallet...",
    mining: "Confirming on-chain (sub-second!)...",
    done: "Published! ✓",
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-arc-500 to-usdc-500 flex items-center justify-center shadow-lg shadow-arc-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-black text-2xl tracking-tight">Readlearc</span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPreview(!preview)}
              className="flex items-center gap-2 px-6 py-2.5 glass border border-white/10 rounded-full text-sm font-bold text-gray-400 hover:text-white transition-all hover:bg-white/5"
            >
              <Eye className="w-4 h-4" /> {preview ? "Edit" : "Preview"}
            </button>
            <button
              onClick={handlePublish}
              disabled={publishing || published || !title || !blurb || !body || !category}
              className="flex items-center gap-2 px-6 py-2.5 bg-arc-600 hover:bg-arc-500 disabled:bg-arc-800 disabled:text-gray-500 rounded-full text-sm font-bold transition-all shadow-xl hover:shadow-arc-500/40"
            >
              <Send className="w-4 h-4" />
              {publishing ? STEP_LABELS[step] : published ? "Published! ✓" : "Publish Article"}
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 pt-32 pb-20">
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {published ? (
          <div className="text-center py-24 glass rounded-[3rem] border-white/5">
            <div className="w-24 h-24 rounded-full bg-usdc-500/10 flex items-center justify-center mx-auto mb-8 shadow-inner border border-usdc-500/20">
              <Zap className="w-10 h-10 text-usdc-400" />
            </div>
            <h2 className="font-heading text-5xl font-black mb-4 tracking-tight">Article Published! 🎉</h2>
            <p className="text-gray-400 mb-2 text-lg">Your article is fully stored and live on the Arc blockchain.</p>
            <p className="text-xs text-gray-600 font-mono mb-10 bg-black/50 inline-block px-4 py-2 rounded-full border border-white/5">
              Tx: {txHash.slice(0, 10)}...{txHash.slice(-8)}
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/explore" className="px-8 py-4 bg-arc-600 hover:bg-arc-500 rounded-full font-bold transition-all shadow-lg hover:-translate-y-0.5">
                Go to Explore
              </Link>
              <Link href="/dashboard" className="px-8 py-4 glass border border-white/10 rounded-full font-bold hover:bg-white/5 text-gray-300 transition-all hover:-translate-y-0.5">
                Go to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Main editor */}
            <div className="lg:col-span-2 space-y-8">
              {/* Publish progress */}
              {publishing && (
                <div className="glass-arc rounded-2xl p-5 flex items-center gap-4 border border-arc-500/30 shadow-lg">
                  <div className="w-5 h-5 border-2 border-arc-400/30 border-t-arc-400 rounded-full animate-spin" />
                  <span className="text-sm font-medium text-arc-300">{STEP_LABELS[step]}</span>
                </div>
              )}

              {/* Title */}
              <input
                type="text"
                placeholder="Article title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent text-5xl font-heading font-black text-white placeholder:text-gray-800 focus:outline-none leading-tight tracking-tight"
              />

              {/* Preview blurb */}
              <div className="glass rounded-3xl p-6 border-white/5 bg-white/2">
                <label className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-3 block">Preview Blurb (Stored Publicly)</label>
                <textarea
                  placeholder="Write a teaser that makes readers want to pay to read more..."
                  value={blurb}
                  onChange={(e) => setBlurb(e.target.value)}
                  maxLength={300}
                  rows={3}
                  className="w-full bg-transparent text-gray-300 placeholder:text-gray-700 focus:outline-none text-lg resize-none font-light leading-relaxed"
                />
                <div className="text-right text-xs font-mono text-gray-600 mt-2">{blurb.length}/300</div>
              </div>

              {/* Editor toolbar */}
              {!preview && (
                <div className="glass rounded-3xl border border-white/5 overflow-hidden">
                  <div className="flex flex-wrap items-center gap-1 px-4 py-3 bg-white/5 border-b border-white/5">
                    {[
                      { icon: Bold, label: "Bold" },
                      { icon: Italic, label: "Italic" },
                      { icon: Heading2, label: "H2" },
                      { icon: List, label: "List" },
                      { icon: Quote, label: "Quote" },
                      { icon: Code, label: "Code" },
                    ].map(({ icon: Icon, label }) => (
                      <button
                        key={label}
                        title={label}
                        className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                      >
                        <Icon className="w-4 h-4" />
                      </button>
                    ))}
                    <div className="ml-auto flex items-center gap-3 text-xs font-medium text-gray-500 bg-black/30 px-3 py-1.5 rounded-full border border-white/5">
                      <Clock className="w-3.5 h-3.5" /> {readTime} min read · {wordCount} words
                    </div>
                  </div>
                  <textarea
                    placeholder="Write your full article here. It will be stored entirely on-chain..."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={20}
                    className="w-full bg-transparent p-8 text-gray-300 placeholder:text-gray-800 focus:outline-none text-lg leading-loose resize-none font-light"
                  />
                </div>
              )}

              {preview && (
                <div className="glass rounded-3xl border border-white/5 p-10 bg-white/2">
                  <h1 className="font-heading text-4xl font-black mb-6 tracking-tight">{title || "Your title here"}</h1>
                  <p className="text-gray-300 text-xl leading-relaxed mb-8 border-l-4 border-arc-500 pl-6 font-light">{blurb || "Your preview blurb..."}</p>
                  <div className="h-px bg-white/10 mb-8" />
                  <div className="text-gray-400 text-lg leading-loose whitespace-pre-wrap font-light">{body || "Your article body..."}</div>
                </div>
              )}
            </div>

            {/* Sidebar settings */}
            <div className="space-y-6">
              {/* Price */}
              <div className="glass rounded-3xl p-6 border-white/5">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="w-5 h-5 text-usdc-400" />
                  <h3 className="font-bold text-sm text-gray-300">Article Price</h3>
                </div>
                <div className="flex items-center gap-2 mb-4 bg-black/30 p-4 rounded-2xl border border-white/5">
                  <span className="text-gray-500 font-bold">$</span>
                  <input
                    type="number"
                    min={0.01}
                    max={1.0}
                    step={0.01}
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value))}
                    className="flex-1 bg-transparent text-3xl font-black text-usdc-400 focus:outline-none"
                  />
                  <span className="text-gray-500 font-bold text-sm">USDC</span>
                </div>
                <input
                  type="range"
                  min={0.01}
                  max={1.0}
                  step={0.01}
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value))}
                  className="w-full accent-usdc-500 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs font-medium text-gray-600 mt-2 mb-6">
                  <span>$0.01</span><span>$1.00</span>
                </div>
                <div className="pt-4 border-t border-white/5 text-sm font-medium text-gray-500">
                  You earn: <span className="text-usdc-400 font-bold">${(price * 0.85).toFixed(3)} USDC</span> per read
                </div>
              </div>

              {/* Category */}
              <div className="glass rounded-3xl p-6 border-white/5">
                <h3 className="font-bold text-sm mb-4 text-gray-300">Category</h3>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        category === cat
                          ? "bg-arc-600 text-white shadow-lg shadow-arc-500/20"
                          : "bg-black/30 border border-white/5 text-gray-500 hover:border-arc-500/30 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Checklist */}
              <div className="glass rounded-3xl p-6 border-white/5">
                <h3 className="font-bold text-sm mb-4 text-gray-300">Publish Checklist</h3>
                <div className="space-y-3">
                  {[
                    { label: "Title", done: title.length > 0 },
                    { label: "Preview blurb", done: blurb.length > 0 },
                    { label: "Article body", done: body.length > 50 },
                    { label: "Category selected", done: category.length > 0 },
                    { label: "Price set", done: price > 0 },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3 text-sm font-medium">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs border ${item.done ? "bg-usdc-500/10 border-usdc-500/30 text-usdc-400" : "bg-black/50 border-white/5 text-gray-700"}`}>
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
