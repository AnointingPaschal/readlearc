import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "../../../lib/supabase";

const AUTHOR_1 = "0xcca907ae079db7638a4d2d3e82defaea5fbdf383";
const AUTHOR_2 = "0x4df868336e6d27e9dbbbda536607fcac578d88d7";
const AUTHOR_3 = "0x9b2e4563fa78236e9f89342a1a5b08a5de72d591";
const READER_1 = "0x7ab3ce109c56e1ab1be4dfec2ec5aae4de39ab7c";

const ARTICLES = [
  {
    title: "The State of Crypto in 2026: Maturity, AI, and Institutional Takeover",
    blurb: "If you're still looking at cryptocurrency through the lens of memecoins and overnight hype cycles, you're missing the real story. As we move through 2026, the digital asset market has fundamentally shifted into a maturing financial infrastructure.",
    content: `If you're still looking at cryptocurrency through the lens of memecoins and overnight hype cycles, you're missing the real story. The market has fundamentally shifted.\n\n## 1. The Bitcoin and Ethereum Divergence\n\nBitcoin has solidified its role as a macroeconomic asset — digital gold for institutional hedging. Ethereum trades more like a high-growth tech stock, correlating heavily with the Nasdaq.\n\nBitcoin ETFs have fundamentally altered capital flows into the space, anchoring BTC stability while ETH faces macro headwinds.\n\n## 2. AI Agents Become Active Participants\n\nAI agents can't open bank accounts — but they can hold crypto wallets. This drives massive demand for programmable micro-transactions: AI systems autonomously paying for compute, APIs, and data using stablecoins like USDC.\n\n## 3. Real-World Asset Tokenization\n\nBillions in US Treasury bills, government bonds, and corporate credit now trade on-chain. RWA tokenization bridges TradFi and DeFi, enabling 24/7 atomic settlement and using traditional assets as collateral in decentralized protocols.\n\n## 4. Stablecoins Are the Killer App\n\nStablecoins have cemented themselves as the primary utility layer. Major banks including JP Morgan and Citi are building tokenized deposit networks. Stablecoins now compete directly with SWIFT for cross-border payments.\n\n## The Bottom Line\n\nCrypto in 2026 is less about speculative moonshots and more about structural integration into global finance. The infrastructure is real, the institutions are here, and the technology is delivering.`,
    price: 0.02, category: "Web3", read_time: 8,
    is_research: false, author_address: AUTHOR_1, status: "featured", featured: true, reads: 142,
  },
  {
    title: "Building on Arc: A Developer's First Look at Circle's L1",
    blurb: "Arc is Circle's purpose-built Layer 1 blockchain for stablecoin finance. I spent two weeks building on testnet — here's what every developer needs to know before they start.",
    content: `Arc is not another Ethereum clone. Circle built it from the ground up for one job: making USDC the best payment network on earth.\n\n## What Makes Arc Different\n\n**USDC as native gas.** No more managing ETH just to pay fees. Every transaction cost is in USDC — predictable, dollar-denominated, zero volatility.\n\n**Sub-second finality.** Arc's consensus engine finalizes blocks in under one second, deterministically. Payment experiences can feel truly instant.\n\n**EVM compatibility.** Your Solidity contracts deploy without modification. Hardhat, Foundry, ethers.js — all just work.\n\n## Testnet Setup\n\n- Chain ID: 5042002\n- RPC: https://rpc.testnet.arc.network\n- Explorer: https://testnet.arcscan.app\n- USDC: 0x3600000000000000000000000000000000000000\n\n## Developer Experience\n\nThe DX is smooth. Gas costs are trivially small, the JSON-RPC is standard, and the only meaningful difference from Ethereum is what you *don't* have to worry about: gas token management and probabilistic finality.\n\n## Should You Build on Arc?\n\nIf your application is payment-centric, needs predictable fees, or targets institutional users — yes. Arc is purpose-built for exactly this.`,
    price: 0.015, category: "Development", read_time: 6,
    is_research: false, author_address: AUTHOR_1, status: "approved", featured: false, reads: 89,
  },
  {
    title: "AI Agent Wallets: Why USDC Is the Native Currency of Autonomous Systems",
    blurb: "As AI agents begin managing real economic activity, the question of what currency they use is no longer theoretical. Here's why USDC on Arc is the obvious answer.",
    content: `As AI agents manage real economic activity — paying for compute, APIs, data, and services — the question of what currency they use becomes architectural.\n\n## The Problem with Existing Solutions\n\n**Fiat is inaccessible.** Autonomous software cannot open a bank account, submit KYC documents, or call customer service.\n\n**Volatile crypto is impractical.** If an AI holds ETH to pay for API calls, the value might drop 30% overnight. Budget management becomes impossible.\n\n**Centralized APIs have limits.** Stripe and PayPal are built for human-speed transactions. AI agents making thousands of micropayments per hour quickly exhaust rate limits.\n\n## Why USDC on Arc Solves All Three\n\n**Accessibility.** Any software can generate a wallet address. No KYC. No bank approval. An AI agent can be deployed with a funded wallet in seconds.\n\n**Price stability.** $100 USDC is worth $100 next week. Budgets become predictable.\n\n**Speed and throughput.** Arc settles in under one second. An AI can make hundreds of payments per minute with fees denominated in dollars.\n\n## What This Enables\n\nAI agents with payment capability can rent compute by the millisecond, purchase data on demand, pay contributors in real-time, and participate in information markets autonomously.\n\nReadlearc itself demonstrates this: AI agents could purchase research articles and pay writers directly with no human intermediary required.`,
    price: 0.025, category: "AI", read_time: 7,
    is_research: false, author_address: AUTHOR_3, status: "featured", featured: true, reads: 318,
  },
  {
    title: "DeFi in 2026: What Survived the Regulatory Winter",
    blurb: "Three years ago, regulators worldwide declared war on DeFi. Today, a leaner, more compliant ecosystem has emerged — and it's stronger for it.",
    content: `Three years ago, the headlines were apocalyptic. Regulatory enforcement threatened to shut down the entire DeFi sector.\n\nToday, a leaner, more compliant ecosystem has emerged.\n\n## What Got Wiped Out\n\nAnonymous yield farms paying 10,000% APY — gone. Algorithmic stablecoins with no collateral — gone. Pseudonymous teams with no legal entity — largely gone from the mainstream.\n\nGood riddance. The protocols that collapsed deserved to collapse.\n\n## What Survived\n\n**Collateralized lending.** Aave and Compound survived because their risk models work. Lock up more than you borrow. When prices fall, you get liquidated. No magic.\n\n**DEX infrastructure.** Uniswap v4 and Curve process hundreds of billions monthly. Too useful to kill, too decentralized to regulate effectively.\n\n**Stablecoins.** The Clarity for Payment Stablecoins Act gave USDC and USDT legal frameworks. Adoption is accelerating.\n\n**RWA protocols.** Treasury tokenization, corporate bond markets, and trade finance are moving on-chain with institutional-grade compliance.\n\n## The New Landscape\n\nDeFi 2026 is less anarchic, more institutionally focused, significantly more compliant. It's also more likely to be here in another five years.\n\nFor builders: focus on compliant infrastructure and genuine utility rather than yield engineering.`,
    price: 0.018, category: "DeFi", read_time: 6,
    is_research: false, author_address: AUTHOR_2, status: "approved", featured: false, reads: 203,
  },
  {
    title: "On-Chain Content Monetization: A Framework for Pay-Per-Read Protocols",
    blurb: "Traditional paywalls extract 30–70% from creators. Blockchain pay-per-read systems promise a better model — but the design space is more nuanced than it appears.",
    content: `## Abstract\n\nTraditional content monetization platforms extract 30–70% of creator revenue. Blockchain pay-per-read protocols offer atomic payment splits, cryptographic ownership proof, and enforced fee structures. This paper analyzes the design space and proposes an evaluation framework.\n\n## Introduction\n\nThe creator economy represents approximately $250 billion annually. Despite this scale, individual creators capture a shrinking percentage of the value they generate. Pay-per-read systems — where readers make direct micropayments — represent an alternative alignment model.\n\n## Methodology\n\nWe analyze three dimensions:\n1. **Payment architecture** — custodial vs. non-custodial, atomic vs. sequential splits\n2. **Access control** — on-chain receipts vs. server-side verification\n3. **Economic model** — fee splits, referral mechanics, creator incentives\n\n## Results\n\nProtocols with atomic on-chain payment splits achieve 15–23% higher creator retention compared to platforms with manual payout cycles. Elimination of payout minimums — enabled by gas-free USDC transfers — particularly benefits emerging creators.\n\nOn-chain read receipts create verifiable intellectual property ownership — a primitive enabling future composability with reputation systems and lending protocols.\n\n## Conclusion\n\nOn-chain pay-per-read protocols represent a structurally superior model for content monetization. The economic alignment between creators and platforms, enforced at the protocol level, eliminates the adversarial dynamic of advertising-based models.`,
    price: 0.05, category: "Research", read_time: 12,
    is_research: true, author_address: AUTHOR_2, status: "featured", featured: true, reads: 67,
  },
  {
    title: "Smart Contract Security in 2026: What Five Years of Exploits Taught Us",
    blurb: "Over $10 billion lost to smart contract exploits. The patterns are depressingly repetitive. Here's what every post-mortem has in common — and how to not be next.",
    content: `Over $10 billion lost to smart contract exploits in five years. The patterns are depressingly repetitive.\n\n## The Recurring Mistakes\n\n**Reentrancy still kills projects.** The DAO hack was 2016. It's 2026. Projects are still getting drained by reentrancy. Fix: checks-effects-interactions pattern. Always update state before making external calls.\n\n**Oracle manipulation is underappreciated.** If your protocol uses price feeds for liquidation thresholds, attackers will manipulate them. Use time-weighted average prices or manipulation-resistant oracles.\n\n**Access control is not optional.** How many exploits involved an unprotected admin function? Too many. Every state-changing function needs explicit authorization.\n\n## What's Getting Better\n\nAudit quality has improved. Trail of Bits, OpenZeppelin, and Spearbit have developed systematic approaches that catch entire vulnerability classes.\n\nFormal verification is becoming accessible. Certora and Halmos let developers mathematically prove properties about their contracts.\n\nImmutable, minimal contracts are winning. The most exploited contracts are the most complex ones.\n\n## For Arc Developers\n\nSame security practices apply on Arc's EVM. Use OpenZeppelin's battle-tested implementations. Use custom errors instead of require strings. Get an audit before mainnet.\n\nThe sub-second finality doesn't eliminate flash loan attack vectors — model your adversaries carefully regardless of chain speed.`,
    price: 0.022, category: "Development", read_time: 9,
    is_research: false, author_address: AUTHOR_2, status: "approved", featured: false, reads: 178,
  },
  {
    title: "The Economics of Writing Online in 2026",
    blurb: "Substack takes 10%. Medium pays fractions of cents. Publishers take 85% of book revenue. The math has never worked for writers — until now.",
    content: `Substack takes 10%. Medium pays fractions of cents per read. Traditional publishers take 85% of book revenue for the privilege of "distribution."\n\nThe economics of writing have never worked for writers.\n\n## The Platform Extraction Problem\n\nEvery content platform follows the same arc:\n1. Attract creators with favorable terms\n2. Build audience around their content  \n3. Extract increasing rent once creators are dependent\n\nYouTube started at 55% revenue share and has clawed back through policy changes and algorithmic suppression.\n\n## What On-Chain Publishing Changes\n\nWhen payment happens on blockchain, the split is encoded in code — not in a terms-of-service document that can change next quarter.\n\nOn Readlearc, every payment is governed by the protocol. The 85% writer share is the share. Always. The platform cannot change it without deploying a new contract, publicly visible on-chain.\n\n## The Math, Finally\n\n10 articles at $0.02 each, 1,000 total reads:\n- Gross: $20\n- Your share: $17 (85%)\n- No payout minimums. No monthly cycles. Instant settlement.\n\n## The Trade-off\n\nPlatforms do provide discovery and distribution. Readlearc is a better monetization layer for writers who already have or are building an audience.\n\n85% of something beats 30% of something slightly larger for most independent writers.`,
    price: 0.01, category: "Economics", read_time: 5,
    is_research: false, author_address: READER_1, status: "approved", featured: false, reads: 94,
  },
  {
    title: "Understanding Circle's Arc: Why a Payment Company Built a Blockchain",
    blurb: "Circle didn't build Arc to be in the blockchain business. They built it because existing blockchains couldn't deliver what stablecoin finance actually needs.",
    content: `Circle didn't build Arc because they wanted to be in the blockchain business. They built it because existing blockchains couldn't deliver what stablecoin finance actually needs.\n\n## The Problem with General-Purpose Chains\n\nEthereum and its competitors are built around a native gas token. Users must hold two assets to do anything — ETH for gas, USDC to actually transact.\n\nFor consumer applications: massive UX friction. For institutional users: accounting complexity. A company paying invoices in USDC shouldn't need to manage an ETH treasury.\n\n## Arc's Answer: USDC as Gas\n\nArc makes USDC the gas token. Full stop. If you have USDC, you can transact.\n\nImplications:\n- Businesses operate entirely in a stable, known currency\n- AI agents need only one asset in their wallets\n- Cross-border payments work without volatile token exposure\n- Fee costs are dollar-denominated and predictable\n\n## The Malachite Consensus Engine\n\nArc delivers deterministic, sub-second finality. When a transaction confirms on Arc, it's final. No probabilistic settlement. No reorganization risk.\n\nFor payments: the difference between "probably got paid" and "definitely got paid." Banks understand this distinction — it's why traditional ACH settlement takes two days.\n\n## For Developers\n\nBuilding on Arc is deliberately familiar. EVM compatibility. Standard JSON-RPC. Your existing Solidity toolchain.\n\nThe only difference is what you *don't* worry about: gas token management, fee spikes, and probabilistic finality.`,
    price: 0.012, category: "Blockchain", read_time: 6,
    is_research: false, author_address: AUTHOR_1, status: "approved", featured: false, reads: 156,
  },
  {
    title: "Getting Started with Readlearc: A Writer's Complete Guide",
    blurb: "Everything you need to publish your first article on Readlearc — from setting up your wallet to pricing your content and building a reader base.",
    content: `Welcome to Readlearc. This guide covers everything you need to publish and start earning USDC.\n\n## What You Need\n\n**MetaMask wallet.** Download from metamask.io. Save your seed phrase — this is your identity on Readlearc.\n\n**Arc Testnet.** Connect your wallet on Readlearc and click "Add Arc Testnet" when prompted. We'll configure it automatically.\n\n**Test USDC.** Get test USDC from the Circle faucet at faucet.circle.com. Select Arc Testnet, enter your address.\n\n## Writing Your First Article\n\n1. Connect your wallet via the top-right button\n2. Click **Write** in the navigation\n3. Choose Article or Research Paper format\n4. Write your title and blurb — the blurb is what readers see before paying, so make it compelling\n5. Write your full article (first 50% shown free, rest requires payment)\n6. Set your price — we recommend $0.02 for new writers to maximize early reads\n7. Select a category and verify the checklist\n8. Click **Publish** — your article saves to the database as pending review\n\n## After Publishing\n\nAn admin reviews and approves your article. Once approved, it appears on the homepage and explore page. Review typically takes under 24 hours.\n\n## Pricing Strategy\n\nLower prices drive more reads. Start at $0.01–$0.05 while building an audience. You keep 85% of every payment — instant, no minimums.\n\n## Track Your Earnings\n\nCreator Studio shows all your articles, read counts, and estimated earnings. You can send your USDC earnings directly from there.`,
    price: 0.005, category: "Guide", read_time: 6,
    is_research: false, author_address: AUTHOR_1, status: "approved", featured: false, reads: 0,
  },
  {
    title: "NFTs Are Not Dead: They Just Grew Up",
    blurb: "The JPEG boom is over. The speculation frenzy is gone. What remained is something more durable — and more useful — than anyone expected.",
    content: `The JPEG boom is over. The speculation frenzy is gone. What remained is something more durable and more interesting than anyone expected.\n\nNFTs, stripped of mania, are a primitive: a way to represent unique ownership of a digital object on a blockchain. That primitive is genuinely useful. We just needed to find the right use cases.\n\n## What Died\n\nProfile pictures as status symbols. 10,000-item generative collections with no utility. Celebrity cash grabs. Metaverse land speculation.\n\nAll gone. Good riddance.\n\n## What Survived and Thrived\n\n**Event tickets.** NFC-enabled NFT tickets have eliminated fraud and scalping at major venues. Cleaner than any Web2 alternative.\n\n**Music rights.** Fractional ownership of royalties via NFTs is a growing market. Fans invest early; artists get funding without labels.\n\n**Read receipts.** Proof you read an article, completed a course, or earned a certification — verifiable on-chain. This is exactly what Readlearc implements.\n\n**In-game items.** True ownership of game assets with open market trading has changed player economics.\n\n## The Pattern\n\nEvery surviving NFT use case solves a real problem that Web2 couldn't solve cleanly. The technology is infrastructure, not the product.\n\nThe projects that failed treated the NFT as the product. The projects that succeeded used it as a mechanism for solving pre-existing problems.`,
    price: 0.008, category: "Web3", read_time: 5,
    is_research: false, author_address: READER_1, status: "approved", featured: false, reads: 71,
  },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("key") !== "readlearc-seed") {
    return NextResponse.json({ error: "Add ?key=readlearc-seed to the URL" }, { status: 401 });
  }

  // Clear existing data first
  await supabase.from("reactions").delete().neq("id", 0);
  await supabase.from("comments").delete().neq("id", 0);
  await supabase.from("read_receipts").delete().neq("id", 0);
  await supabase.from("follows").delete().neq("id", 0);
  await supabase.from("articles").delete().neq("id", 0);

  // Insert articles
  const { data: arts, error: artErr } = await supabase
    .from("articles")
    .insert(ARTICLES)
    .select("id, title, status");

  if (artErr) return NextResponse.json({ error: artErr.message }, { status: 500 });

  const ids = (arts || []).map(a => a.id);
  const [id1, id2, id3, id4, id5] = ids;

  // Read receipts
  const receipts = [
    { article_id: id1, reader_address: AUTHOR_2.toLowerCase(), tx_hash: `0x${"a".repeat(64)}`, amount_paid: 0.02 },
    { article_id: id1, reader_address: AUTHOR_3.toLowerCase(), tx_hash: `0x${"b".repeat(64)}`, amount_paid: 0.02 },
    { article_id: id1, reader_address: READER_1.toLowerCase(), tx_hash: `0x${"c".repeat(64)}`, amount_paid: 0.02 },
    { article_id: id2, reader_address: AUTHOR_2.toLowerCase(), tx_hash: `0x${"d".repeat(64)}`, amount_paid: 0.015 },
    { article_id: id3, reader_address: AUTHOR_1.toLowerCase(), tx_hash: `0x${"e".repeat(64)}`, amount_paid: 0.025 },
    { article_id: id5, reader_address: AUTHOR_1.toLowerCase(), tx_hash: `0x${"f".repeat(64)}`, amount_paid: 0.05 },
  ].filter(r => r.article_id);
  if (receipts.length) await supabase.from("read_receipts").insert(receipts);

  // Comments
  const comments = [
    { article_id: id1, author_address: AUTHOR_2.toLowerCase(), author_name: "CryptoResearcher", content: "Most balanced 2026 market take I've read. The BTC/ETH divergence point is what most people are missing." },
    { article_id: id1, author_address: AUTHOR_3.toLowerCase(), author_name: "DeFiBuilder",      content: "The AI agents section is underappreciated. We're already seeing agent-to-agent payments on Arc. USDC as machine money is inevitable." },
    { article_id: id3, author_address: AUTHOR_1.toLowerCase(), author_name: "Anointing",        content: "Excellent research. The 15–23% creator retention differential is striking. Would love to see the methodology expanded." },
    { article_id: id5, author_address: AUTHOR_1.toLowerCase(), author_name: "Anointing",        content: "We built Readlearc partly with this in mind — articles as data products that agents can purchase autonomously." },
  ].filter(c => c.article_id);
  if (comments.length) await supabase.from("comments").insert(comments);

  // Reactions
  const reactions = [
    { article_id: id1, address: AUTHOR_2.toLowerCase(), reaction_key: "gem"   },
    { article_id: id1, address: AUTHOR_3.toLowerCase(), reaction_key: "flame" },
    { article_id: id1, address: READER_1.toLowerCase(), reaction_key: "zap"   },
    { article_id: id3, address: AUTHOR_1.toLowerCase(), reaction_key: "gem"   },
    { article_id: id5, address: AUTHOR_1.toLowerCase(), reaction_key: "gem"   },
    { article_id: id5, address: READER_1.toLowerCase(), reaction_key: "zap"   },
  ].filter(r => r.article_id);
  if (reactions.length) await supabase.from("reactions").insert(reactions);

  // Follows
  await supabase.from("follows").insert([
    { follower_address: AUTHOR_2.toLowerCase(), following_address: AUTHOR_1.toLowerCase() },
    { follower_address: AUTHOR_3.toLowerCase(), following_address: AUTHOR_1.toLowerCase() },
    { follower_address: READER_1.toLowerCase(), following_address: AUTHOR_1.toLowerCase() },
  ]);

  return NextResponse.json({
    ok: true,
    message: "Database seeded!",
    inserted: { articles: arts?.length, receipts: receipts.length, comments: comments.length, reactions: reactions.length },
    articles: arts?.map(a => ({ id: a.id, title: a.title.slice(0, 40), status: a.status })),
  });
}
