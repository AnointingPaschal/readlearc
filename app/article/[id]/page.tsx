"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ethers } from "ethers";
import { Lock, Unlock, Zap, Clock, Users, ArrowLeft, Heart, Share2, ChevronRight, CheckCircle, Coins, AlertCircle } from "lucide-react";
import { getProvider, READLEARC_ADDRESS, READLEARC_ABI, USDC_ADDRESS, USDC_ABI } from "../../../lib/web3";
import { motion } from "framer-motion";

export default function ArticlePage() {
  const params = useParams();
  const articleId = params.id as string;

  const [article, setArticle] = useState<any>(null);
  const [fullContent, setFullContent] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [step, setStep] = useState("");
  const [txHash, setTxHash] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        if (!READLEARC_ADDRESS) return;
        
        let provider;
        let userAddress = "";
        if (typeof window !== "undefined" && (window as any).ethereum) {
          provider = new ethers.BrowserProvider((window as any).ethereum);
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) userAddress = accounts[0].address;
        } else {
          provider = new ethers.JsonRpcProvider("https://rpc.sepolia.org");
        }

        const contract = new ethers.Contract(READLEARC_ADDRESS, READLEARC_ABI, provider);
        
        // Get metadata
        const meta = await contract.getArticleMetadata(articleId);
        setArticle({
          id: meta.id.toString(),
          title: meta.title,
          blurb: meta.blurb,
          price: ethers.formatUnits(meta.price, 6),
          category: meta.category,
          readTime: meta.readTime.toString(),
          timestamp: meta.timestamp.toString(),
          reads: meta.reads.toString(),
          author: { handle: meta.author.substring(0, 8) + "...", name: "Writer", address: meta.author },
          publishedAt: new Date(Number(meta.timestamp) * 1000).toLocaleDateString(),
        });

        // Check if paid
        if (userAddress) {
          const paid = await contract.hasReadReceipt(userAddress, articleId);
          setIsPaid(paid);
          if (paid) {
            const full = await contract.getFullArticle(articleId);
            setFullContent(full.content);
          }
        }
      } catch (err) {
        console.error("Error loading article:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [articleId]);

  async function handlePay() {
    setIsPaying(true);
    setError("");
    
    try {
      const provider = await getProvider();
      const signer = await provider.getSigner();
      
      const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
      const contract = new ethers.Contract(READLEARC_ADDRESS, READLEARC_ABI, signer);

      const priceInUnits = ethers.parseUnits(article.price.toString(), 6);

      // Check allowance
      setStep("Checking USDC approval...");
      const allowance = await usdc.allowance(signer.address, READLEARC_ADDRESS);
      
      if (allowance < priceInUnits) {
        setStep("Approving USDC...");
        const approveTx = await usdc.approve(READLEARC_ADDRESS, priceInUnits);
        await approveTx.wait();
      }

      setStep("Signing payment transaction...");
      const tx = await contract.payToRead(articleId, ethers.ZeroAddress);
      
      setStep("Confirming on Arc network...");
      setTxHash(tx.hash);
      await tx.wait();

      setPaymentDone(true);
      
      // Fetch full content
      const full = await contract.getFullArticle(articleId);
      setFullContent(full.content);
      setIsPaid(true);

    } catch (err: any) {
      console.error(err);
      setError(err.reason || err.message || "Transaction failed");
    } finally {
      setIsPaying(false);
      setStep("");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-2 border-arc-500/30 border-t-arc-500 rounded-full animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Fetching on-chain data...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center">
        <p className="text-white text-xl">Article not found.</p>
        <Link href="/explore" className="text-arc-400 mt-4 hover:underline">Go back to Explore</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] selection:bg-arc-500/30">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/explore" className="flex items-center gap-2 text-gray-400 hover:text-white font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" /> Explore
          </Link>
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-arc-500 to-usdc-500 flex items-center justify-center shadow-lg">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-bold text-xl tracking-tight hidden sm:block">Readlearc</span>
          </Link>
          <div className="flex items-center gap-4">
            <button className="w-10 h-10 glass rounded-full flex items-center justify-center hover:bg-white/10 transition-all">
              <Share2 className="w-4 h-4 text-gray-400" />
            </button>
            <Link href="/wallet" className="px-6 py-2.5 text-sm font-bold bg-white text-black hover:bg-gray-200 rounded-full transition-all shadow-xl hover:scale-105">
              Wallet
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 pt-36 pb-32">
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* Category + meta */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center flex-wrap gap-4 mb-8">
          <span className="text-xs font-bold text-arc-400 bg-arc-500/10 px-4 py-1.5 rounded-full border border-arc-500/20 uppercase tracking-widest shadow-inner">
            {article.category}
          </span>
          <span className="flex items-center gap-1.5 text-sm font-medium text-gray-500 bg-white/5 px-3 py-1.5 rounded-full"><Clock className="w-4 h-4" /> {article.readTime} min read</span>
          <span className="flex items-center gap-1.5 text-sm font-medium text-gray-500 bg-white/5 px-3 py-1.5 rounded-full"><Users className="w-4 h-4" /> {article.reads} reads</span>
        </motion.div>

        {/* Title */}
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="font-heading text-5xl md:text-6xl font-black text-white mb-8 leading-[1.1] tracking-tight">
          {article.title}
        </motion.h1>

        {/* Author */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex items-center justify-between mb-12 p-6 glass rounded-[2rem] border border-white/5 bg-white/2">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-arc-500 to-usdc-500 shadow-inner flex-shrink-0" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-white text-lg">{article.author.name}</span>
                <CheckCircle className="w-5 h-5 text-usdc-400" />
              </div>
              <span className="text-sm font-medium text-gray-500">@{article.author.handle} · {article.publishedAt}</span>
            </div>
          </div>
          <Link href={`/explore`} className="hidden sm:block text-sm font-bold text-arc-400 hover:text-arc-300 transition-colors bg-arc-500/10 px-5 py-2 rounded-full">
            Follow
          </Link>
        </motion.div>

        {/* Preview blurb — always visible */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-2xl text-gray-300 leading-relaxed mb-12 font-light border-l-4 border-arc-500 pl-6">
          {article.blurb}
        </motion.p>

        {!isPaid ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            {/* Locked content preview */}
            <div className="relative mb-12 overflow-hidden rounded-3xl">
              <div className="paywall-blur text-gray-500 leading-loose text-lg select-none pointer-events-none p-8 border border-white/5 bg-white/2">
                <p>The internet promised to democratize publishing. Instead, it created a system where platforms extract 70–90% of creator revenue through advertising.</p>
                <p className="mt-6">When you read an article on a traditional blog, the economic relationship is inverted. You, the reader, are not the customer — you are the product. Your attention is sold to advertisers.</p>
                <p className="mt-6">This makes something previously impossible, suddenly trivial: paying $0.02 to read one article...</p>
              </div>
              {/* Gradient fade */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0f]/80 to-[#0a0a0f] flex items-end justify-center pb-12">
                <div className="w-16 h-16 rounded-full bg-arc-600/20 flex items-center justify-center backdrop-blur-md border border-arc-500/30">
                  <Lock className="w-8 h-8 text-arc-400" />
                </div>
              </div>
            </div>

            {/* Paywall CTA */}
            <div className="glass-arc rounded-[3rem] p-10 md:p-14 text-center border-arc-500/30 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-arc-500/10 to-transparent pointer-events-none" />
              
              <h3 className="font-heading text-4xl font-black mb-4 relative z-10 tracking-tight">Unlock Full Article</h3>
              <p className="text-gray-400 text-lg mb-10 max-w-md mx-auto font-light leading-relaxed relative z-10">
                Pay once in USDC and own permanent on-chain access. Your payment goes directly to the writer instantly.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 mb-10 text-sm font-bold text-gray-400 relative z-10">
                <span className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full border border-white/5"><Zap className="w-4 h-4 text-arc-400" /> Sub-second</span>
                <span className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full border border-white/5"><CheckCircle className="w-4 h-4 text-usdc-400" /> 85% to writer</span>
                <span className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full border border-white/5"><Coins className="w-4 h-4 text-blue-400" /> On-chain proof</span>
              </div>

              <button
                onClick={handlePay}
                disabled={isPaying || paymentDone}
                className="w-full max-w-sm mx-auto flex items-center justify-center gap-3 px-8 py-5 bg-white text-black hover:bg-gray-200 disabled:bg-gray-800 disabled:text-gray-500 rounded-full font-black text-xl transition-all shadow-xl hover:scale-105 active:scale-95 relative z-10"
              >
                {paymentDone ? (
                  <><CheckCircle className="w-6 h-6 text-usdc-500" /> Confirmed!</>
                ) : isPaying ? (
                  <><div className="w-6 h-6 border-4 border-gray-300 border-t-black rounded-full animate-spin" /> {step || "Processing..."}</>
                ) : (
                  <><Unlock className="w-6 h-6" /> Pay ${article.price} USDC</>
                )}
              </button>

              {txHash && (
                <p className="mt-6 text-xs font-mono text-gray-500 relative z-10">
                  Tx: {txHash.slice(0,10)}...{txHash.slice(-8)}
                </p>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
            {/* On-chain access badge */}
            <div className="bg-usdc-500/10 border border-usdc-500/30 rounded-2xl p-5 flex items-center gap-4 mb-12 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-full bg-usdc-500/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-usdc-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-white mb-1">Access granted on-chain</p>
                <p className="text-xs font-mono text-gray-500">Verified Read Receipt on Arc Testnet</p>
              </div>
            </div>

            {/* Full unlocked content */}
            <div className="prose prose-invert prose-lg max-w-none mb-16">
              <div
                className="text-gray-300 leading-loose font-light space-y-6"
                dangerouslySetInnerHTML={{
                  __html: fullContent
                    .trim()
                    .replace(/\*\*(.*?)\*\*/g, "<strong class='text-white font-bold'>$1</strong>")
                    .split("\n\n")
                    .map((p) => p.startsWith("-") ? `<ul class="list-disc pl-6 space-y-2"><li>${p.split("\n").join("</li><li>").replace(/- /g,"")}</li></ul>` : `<p>${p}</p>`)
                    .join("")
                }}
              />
            </div>

            {/* Tip section */}
            <div className="glass rounded-[3rem] p-12 text-center border-white/5 bg-white/2">
              <h3 className="font-heading text-3xl font-black mb-3">Loved this article?</h3>
              <p className="text-gray-400 text-lg mb-8 font-light">100% of tips go directly to {article.author.name}</p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                {[0.50, 1.00, 5.00].map((amount) => (
                  <button
                    key={amount}
                    className="px-6 py-3 glass border border-white/10 rounded-full hover:bg-white/10 hover:text-white text-gray-300 font-bold transition-all shadow-sm"
                  >
                    ${amount.toFixed(2)}
                  </button>
                ))}
                <button
                  className="px-8 py-3 bg-usdc-600 hover:bg-usdc-500 rounded-full text-white font-black flex items-center gap-2 transition-all shadow-lg hover:-translate-y-1"
                >
                  <Heart className="w-5 h-5" /> Tip Writer
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
