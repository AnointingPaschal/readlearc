import Link from "next/link";
import { BookOpen, Zap, Shield, TrendingUp, Users, DollarSign, ChevronRight, Star, Clock, Coins } from "lucide-react";

const SAMPLE_ARTICLES = [
  {
    id: "1",
    title: "The Future of Decentralized Content Monetization",
    blurb: "How Arc blockchain and USDC nanopayments are rewriting the economics of online publishing — giving writers 85¢ of every dollar.",
    price: 0.02,
    readTime: 5,
    author: { handle: "vitalik_reads", name: "Alex Chen" },
    category: "Web3",
    reads: 1240,
  },
  {
    id: "2",
    title: "Building AI Agents with Circle's Developer Stack",
    blurb: "A deep dive into Circle Agent Wallets and how autonomous payment agents are transforming DeFi user experience at scale.",
    price: 0.05,
    readTime: 8,
    author: { handle: "circledev", name: "Maria Santos" },
    category: "Development",
    reads: 897,
  },
  {
    id: "3",
    title: "Why Sub-Second Finality Changes Everything",
    blurb: "When transactions confirm in under a second, the entire mental model for micropayments collapses into something elegant and inevitable.",
    price: 0.01,
    readTime: 3,
    author: { handle: "arcbuilder", name: "James Wu" },
    category: "Blockchain",
    reads: 2103,
  },
  {
    id: "4",
    title: "The Writer's Guide to On-Chain Earnings",
    blurb: "From your first article to your first $100 USDC withdrawal — everything you need to know about earning on Readlearc.",
    price: 0.03,
    readTime: 6,
    author: { handle: "cryptowriter", name: "Priya Patel" },
    category: "Guide",
    reads: 543,
  },
  {
    id: "5",
    title: "Quadratic Pricing: The Math Behind Viral Articles",
    blurb: "Our pricing algorithm rewards widely-read articles with lower per-read costs, maximizing both writer income and reader reach.",
    price: 0.04,
    readTime: 7,
    author: { handle: "mathcrypto", name: "David Kim" },
    category: "Economics",
    reads: 678,
  },
  {
    id: "6",
    title: "USDC vs Traditional Ad Revenue: A 90-Day Study",
    blurb: "We analyzed 200 creators who switched from ad-based platforms to Readlearc. The results will surprise you.",
    price: 0.02,
    readTime: 4,
    author: { handle: "datawriter", name: "Emma Thompson" },
    category: "Research",
    reads: 1456,
  },
];

const STATS = [
  { label: "Articles Published", value: "12,847", icon: BookOpen },
  { label: "USDC Paid to Writers", value: "$48,291", icon: DollarSign },
  { label: "Active Readers", value: "9,340", icon: Users },
  { label: "Avg. Settlement Time", value: "0.8s", icon: Zap },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Writer Publishes",
    desc: "Write your article, set a USDC price ($0.01–$1.00), and publish. Content is encrypted and stored on IPFS. Metadata goes on-chain.",
    icon: BookOpen,
    color: "from-purple-600 to-purple-800",
  },
  {
    step: "02",
    title: "Reader Discovers",
    desc: "Browse the feed, see the preview blurb and price. Click 'Pay to Read' — your Circle wallet handles the nanopayment in under a second.",
    icon: Coins,
    color: "from-emerald-600 to-emerald-800",
  },
  {
    step: "03",
    title: "Instant Settlement",
    desc: "USDC is split atomically on-chain: 85% to writer, 10% to platform, 5% to referrer. No escrow. No delay. Confirmed in < 1 second on Arc.",
    icon: Zap,
    color: "from-blue-600 to-blue-800",
  },
  {
    step: "04",
    title: "Content Unlocks",
    desc: "Payment verified on-chain, decryption key released from ArticleVault, full article renders in your browser. Proof-of-read NFT minted.",
    icon: Shield,
    color: "from-rose-600 to-rose-800",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-arc-500 to-usdc-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-bold text-xl">Readlearc</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <Link href="/explore" className="hover:text-white transition-colors">Explore</Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">Writers</Link>
            <span className="arc-badge text-arc-400">Arc Testnet</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/write" className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors">
              Write
            </Link>
            <Link
              href="/wallet"
              className="px-4 py-2 text-sm font-semibold bg-arc-600 hover:bg-arc-500 rounded-lg transition-all hover:shadow-arc"
            >
              Connect Wallet
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden grid-overlay">
        {/* Background blobs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-arc-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-80 h-80 bg-usdc-500/15 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 arc-badge mb-6 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-usdc-400 animate-pulse" />
            <span>Built on Arc · Circle USDC · Sub-second settlement</span>
          </div>

          <h1 className="font-heading text-6xl md:text-8xl font-black mb-6 leading-tight animate-slide-up">
            Pay per word.
            <br />
            <span className="gradient-text">Own every read.</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in">
            The first pay-per-read platform where writers earn instantly in USDC and readers own proof of every article they've read — all settled on-chain in under a second.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-slide-up">
            <Link
              href="/explore"
              className="px-8 py-4 bg-arc-600 hover:bg-arc-500 rounded-xl font-semibold text-lg transition-all hover:shadow-arc hover:-translate-y-0.5 flex items-center gap-2"
            >
              Start Reading <ChevronRight className="w-5 h-5" />
            </Link>
            <Link
              href="/write"
              className="px-8 py-4 glass border border-white/10 rounded-xl font-semibold text-lg hover:border-arc-500/50 transition-all flex items-center gap-2 text-gray-300"
            >
              Start Writing <TrendingUp className="w-5 h-5" />
            </Link>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {STATS.map((stat) => (
              <div key={stat.label} className="glass rounded-xl p-4 text-center hover:border-arc-500/30 transition-colors">
                <stat.icon className="w-5 h-5 text-arc-400 mx-auto mb-2" />
                <div className="text-2xl font-heading font-bold text-white">{stat.value}</div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Articles */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="font-heading text-3xl font-bold">Trending Articles</h2>
              <p className="text-gray-500 mt-1">Pay in USDC. Read instantly. Own the proof on-chain.</p>
            </div>
            <Link href="/explore" className="text-arc-400 hover:text-arc-300 flex items-center gap-1 text-sm font-medium">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SAMPLE_ARTICLES.map((article) => (
              <Link
                key={article.id}
                href={`/article/${article.id}`}
                className="glass rounded-2xl p-5 hover:border-arc-500/30 transition-all hover:-translate-y-1 hover:shadow-card group"
              >
                {/* Category + price */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-arc-400 bg-arc-500/10 px-3 py-1 rounded-full border border-arc-500/20">
                    {article.category}
                  </span>
                  <span className="price-badge">${article.price} USDC</span>
                </div>

                {/* Title */}
                <h3 className="font-heading text-lg font-semibold text-white mb-2 group-hover:text-arc-300 transition-colors leading-snug">
                  {article.title}
                </h3>

                {/* Blurb */}
                <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-2">{article.blurb}</p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-arc-500 to-usdc-500" />
                    <span className="text-sm text-gray-400">@{article.author.handle}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {article.readTime}m
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {article.reads.toLocaleString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-heading text-4xl font-bold mb-4">How Readlearc Works</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Built on Arc — Circle&apos;s USDC-native L1. Payments settle in under a second. Content is owned forever.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="glass rounded-2xl p-6 hover:border-arc-500/20 transition-all">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-arc-400 font-mono text-xs font-bold mb-2">{item.step}</div>
                <h3 className="font-heading text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Payment split visualization */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="glass-arc rounded-3xl p-10 text-center">
            <div className="inline-flex items-center gap-2 arc-badge mb-6">
              <Zap className="w-3 h-3" /> On-chain payment splitting
            </div>
            <h2 className="font-heading text-4xl font-bold mb-4">Writers keep 85%</h2>
            <p className="text-gray-400 mb-10">Every read triggers an atomic on-chain split. No middleman. No delay.</p>

            <div className="flex items-center justify-center gap-4 mb-8 flex-wrap">
              <div className="text-center">
                <div className="text-5xl font-black text-usdc-400 mb-1">85%</div>
                <div className="text-sm text-gray-500">Writer</div>
              </div>
              <div className="text-gray-700 text-3xl font-thin">+</div>
              <div className="text-center">
                <div className="text-5xl font-black text-arc-400 mb-1">10%</div>
                <div className="text-sm text-gray-500">Platform</div>
              </div>
              <div className="text-gray-700 text-3xl font-thin">+</div>
              <div className="text-center">
                <div className="text-5xl font-black text-blue-400 mb-1">5%</div>
                <div className="text-sm text-gray-500">Referrer</div>
              </div>
            </div>

            <div className="h-3 rounded-full overflow-hidden flex bg-gray-900">
              <div className="bg-usdc-500" style={{ width: "85%" }} />
              <div className="bg-arc-500" style={{ width: "10%" }} />
              <div className="bg-blue-500" style={{ width: "5%" }} />
            </div>

            <p className="mt-6 text-xs text-gray-600">
              Verified writers earn 90%. Executed atomically via PaymentSplitter.sol on Arc.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-5xl font-black mb-6">
            Start earning in <span className="gradient-text">USDC</span> today
          </h2>
          <p className="text-gray-400 text-xl mb-10 max-w-xl mx-auto">
            Join thousands of writers monetizing their work with nanopayments. No ads. No subscriptions. Just pay-per-read.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/write"
              className="px-10 py-4 bg-arc-600 hover:bg-arc-500 rounded-xl font-bold text-lg transition-all hover:shadow-arc hover:-translate-y-0.5"
            >
              Publish Your First Article
            </Link>
            <Link
              href="/explore"
              className="px-10 py-4 glass border border-white/10 rounded-xl font-semibold text-lg hover:border-arc-500/30 text-gray-300 transition-all"
            >
              Explore Articles
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-arc-500 to-usdc-500 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-heading font-bold">Readlearc</span>
              <span className="text-gray-600 text-sm ml-2">Pay per word. Own every read.</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/explore" className="hover:text-white transition-colors">Explore</Link>
              <Link href="/write" className="hover:text-white transition-colors">Write</Link>
              <Link href="/admin" className="hover:text-white transition-colors">Admin</Link>
              <a href="https://explorer.arc.io/testnet" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Arc Explorer</a>
            </div>
            <div className="text-xs text-gray-600">
              Built on Arc · Powered by Circle · © 2026 Readlearc
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
