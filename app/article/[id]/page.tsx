"use client";
import { useState } from "react";
import Link from "next/link";
import { Lock, Unlock, Zap, Clock, Users, ArrowLeft, Heart, Share2, ChevronRight, CheckCircle, Coins } from "lucide-react";

const MOCK_ARTICLE = {
  id: "1",
  title: "The Future of Decentralized Content Monetization",
  blurb: "How Arc blockchain and USDC nanopayments are rewriting the economics of online publishing — giving writers 85¢ of every dollar. This is the most important shift in creator monetization since the invention of advertising.",
  price: 0.02,
  readTime: 5,
  author: { handle: "vitalik_reads", name: "Alex Chen", bio: "Blockchain researcher & writer. Building the future of decentralized media.", articles: 14, readers: 3240 },
  category: "Web3",
  reads: 1240,
  earned: 24.8,
  publishedAt: "June 15, 2026",
  fullContent: `
The internet promised to democratize publishing. Instead, it created a system where platforms extract 70–90% of creator revenue through advertising.

**The Problem with Ads**

When you read an article on a traditional blog, the economic relationship is inverted. You, the reader, are not the customer — you are the product. Your attention is sold to advertisers. The writer earns pennies per thousand pageviews, and platforms take the lion's share.

This model creates misaligned incentives everywhere:
- Writers optimize for clicks, not quality
- Platforms optimize for engagement, not truth  
- Readers get manipulated, not informed

**Enter Arc and USDC Nanopayments**

Arc is Circle's purpose-built Layer 1 blockchain — EVM-compatible, USDC-native, with sub-second deterministic finality. A transaction on Arc confirms in under a second and costs $0.001 in USDC gas.

This makes something previously impossible, suddenly trivial: paying $0.02 to read one article.

**The Math That Changes Everything**

Consider a writer who publishes one quality article per week and attracts 1,000 readers at $0.02 each:

- Weekly earnings: $20 USDC
- Monthly earnings: $80 USDC  
- At 85% split: writer keeps $68/month

Compare that to traditional blogging where 1,000 pageviews might generate $2–5 in ad revenue.

**Proof of Readership**

Every paid read creates an on-chain record. Your wallet address is linked to every article you've ever read. This creates something entirely new: verifiable intellectual engagement.

Finish reading this article, and a free proof-of-readership NFT is minted to your wallet on Arc. Your reading history becomes a portable credential.

**What This Means for Writers**

Writers on Readlearc know exactly who has read their work — not anonymized ad impressions, but real wallet addresses with on-chain histories. They can:

1. Build subscription-style relationships with repeat readers
2. Use reading history as social proof for grants and fellowships
3. Create token-gated communities for their most engaged readers
4. Earn 85% of every USDC payment, instantly, with no middleman

**The Future Is Pay-Per-Read**

As Arc approaches mainnet in Summer 2026, the infrastructure for a genuinely writer-owned internet is coming online. Readlearc is built for this moment.

Every article you pay to read is a vote for a better internet.
  `,
};

export default function ArticlePage({ params }: { params: { id: string } }) {
  const [isPaid, setIsPaid] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [tipSent, setTipSent] = useState(false);

  const article = MOCK_ARTICLE;

  async function handlePay() {
    setIsPaying(true);
    // Simulate Circle nanopayment
    await new Promise((r) => setTimeout(r, 2200));
    setIsPaying(false);
    setPaymentDone(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsPaid(true);
    setPaymentDone(false);
  }

  async function handleTip() {
    setTipSent(true);
    await new Promise((r) => setTimeout(r, 1500));
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/explore" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Explore
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-arc-500 to-usdc-500 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-heading font-bold">Readlearc</span>
          </Link>
          <div className="flex items-center gap-3">
            <button className="p-2 glass rounded-lg hover:border-white/20 transition-colors">
              <Share2 className="w-4 h-4 text-gray-400" />
            </button>
            <Link href="/wallet" className="px-4 py-2 text-sm font-semibold bg-arc-600 hover:bg-arc-500 rounded-lg transition-all">
              Wallet
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 pt-28 pb-20">
        {/* Category + meta */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-xs font-semibold text-arc-400 bg-arc-500/10 px-3 py-1 rounded-full border border-arc-500/20">
            {article.category}
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-500"><Clock className="w-3 h-3" /> {article.readTime} min read</span>
          <span className="flex items-center gap-1 text-xs text-gray-500"><Users className="w-3 h-3" /> {article.reads.toLocaleString()} reads</span>
        </div>

        {/* Title */}
        <h1 className="font-heading text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
          {article.title}
        </h1>

        {/* Author */}
        <div className="flex items-center gap-4 mb-8 p-4 glass rounded-xl border border-white/5">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-arc-500 to-usdc-500 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">{article.author.name}</span>
              <CheckCircle className="w-4 h-4 text-usdc-400" />
            </div>
            <span className="text-sm text-gray-500">@{article.author.handle} · {article.publishedAt}</span>
          </div>
          <Link href={`/profile/${article.author.handle}`} className="text-xs text-arc-400 hover:text-arc-300 transition-colors">
            View Profile
          </Link>
        </div>

        {/* Preview blurb — always visible */}
        <p className="text-lg text-gray-300 leading-relaxed mb-8 font-medium">{article.blurb}</p>

        {!isPaid ? (
          <>
            {/* Locked content preview */}
            <div className="relative mb-8">
              <div className="paywall-blur text-gray-400 leading-relaxed text-base select-none pointer-events-none">
                <p>The internet promised to democratize publishing. Instead, it created a system where platforms extract 70–90% of creator revenue through advertising.</p>
                <p className="mt-4">When you read an article on a traditional blog, the economic relationship is inverted. You, the reader, are not the customer — you are the product. Your attention is sold to advertisers.</p>
                <p className="mt-4">This makes something previously impossible, suddenly trivial: paying $0.02 to read one article...</p>
              </div>
              {/* Gradient fade */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0f]/60 to-[#0a0a0f]" />
            </div>

            {/* Paywall CTA */}
            <div className="glass-arc rounded-2xl p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-arc-600/20 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-6 h-6 text-arc-400" />
              </div>
              <h3 className="font-heading text-2xl font-bold mb-2">Unlock Full Article</h3>
              <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
                Pay once in USDC and own permanent on-chain access. Your payment goes directly to the writer.
              </p>

              <div className="flex items-center justify-center gap-6 mb-6 text-sm text-gray-500">
                <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-arc-400" /> Sub-second settlement</span>
                <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-usdc-400" /> 85% to writer</span>
                <span className="flex items-center gap-1"><Coins className="w-3 h-3 text-blue-400" /> Proof-of-read NFT</span>
              </div>

              <button
                onClick={handlePay}
                disabled={isPaying || paymentDone}
                className="w-full max-w-xs mx-auto flex items-center justify-center gap-3 px-8 py-4 bg-arc-600 hover:bg-arc-500 disabled:bg-arc-800 rounded-xl font-bold text-lg transition-all hover:shadow-arc"
              >
                {paymentDone ? (
                  <><CheckCircle className="w-5 h-5 text-usdc-400" /> Payment Confirmed!</>
                ) : isPaying ? (
                  <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing on Arc...</>
                ) : (
                  <><Unlock className="w-5 h-5" /> Pay ${article.price} USDC to Read</>
                )}
              </button>

              <p className="mt-4 text-xs text-gray-600">
                Powered by Circle Nanopayments on Arc · Gas ≈ $0.001 USDC
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Full unlocked content */}
            <div className="prose prose-invert max-w-none mb-10">
              <div
                className="text-gray-300 leading-relaxed text-base space-y-4"
                dangerouslySetInnerHTML={{
                  __html: article.fullContent
                    .trim()
                    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                    .split("\n\n")
                    .map((p) => p.startsWith("-") ? `<ul>${p.split("\n").map(l => `<li>${l.replace("- ","")}</li>`).join("")}</ul>` : `<p>${p}</p>`)
                    .join("")
                }}
              />
            </div>

            {/* On-chain access badge */}
            <div className="glass-arc rounded-xl p-4 flex items-center gap-3 mb-8">
              <CheckCircle className="w-5 h-5 text-usdc-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-white">Access granted on-chain</p>
                <p className="text-xs text-gray-500">tx: 0x7f3c...d291 · Arc Testnet · 0.8s confirmation</p>
              </div>
              <a href="https://explorer.arc.io/testnet" target="_blank" rel="noopener noreferrer" className="ml-auto text-xs text-arc-400 hover:text-arc-300 flex items-center gap-1">
                View <ChevronRight className="w-3 h-3" />
              </a>
            </div>

            {/* Tip section */}
            <div className="glass rounded-2xl p-6 text-center">
              <h3 className="font-heading text-xl font-bold mb-2">Loved this article?</h3>
              <p className="text-gray-500 text-sm mb-4">100% of tips go directly to {article.author.name}</p>
              <div className="flex items-center justify-center gap-3">
                {[0.01, 0.05, 0.10].map((amount) => (
                  <button
                    key={amount}
                    onClick={handleTip}
                    className="px-4 py-2 glass border border-white/10 rounded-lg hover:border-usdc-500/50 hover:text-usdc-400 text-sm font-semibold transition-all"
                  >
                    ${amount}
                  </button>
                ))}
                <button
                  onClick={handleTip}
                  disabled={tipSent}
                  className="px-6 py-2 bg-usdc-600 hover:bg-usdc-500 disabled:bg-usdc-800 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
                >
                  <Heart className={`w-4 h-4 ${tipSent ? "fill-current" : ""}`} />
                  {tipSent ? "Sent! 🎉" : "Tip Writer"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
