-- ═══════════════════════════════════════════════════════════════════
--  READLEARC — Full Schema + Test Data
--  Paste this entire file into Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

-- ── Drop existing tables (clean slate) ───────────────────────────
DROP TABLE IF EXISTS follows       CASCADE;
DROP TABLE IF EXISTS reactions     CASCADE;
DROP TABLE IF EXISTS comments      CASCADE;
DROP TABLE IF EXISTS read_receipts CASCADE;
DROP TABLE IF EXISTS articles      CASCADE;
DROP FUNCTION IF EXISTS update_updated_at CASCADE;

-- ── Tables ───────────────────────────────────────────────────────
CREATE TABLE articles (
  id             SERIAL PRIMARY KEY,
  title          TEXT          NOT NULL,
  blurb          TEXT          NOT NULL,
  content        TEXT          NOT NULL,
  price          NUMERIC(10,6) NOT NULL DEFAULT 0.020000,
  category       VARCHAR(50)   NOT NULL DEFAULT 'General',
  read_time      INTEGER       NOT NULL DEFAULT 3,
  is_research    BOOLEAN       NOT NULL DEFAULT FALSE,
  author_address VARCHAR(42)   NOT NULL,
  status         VARCHAR(20)   NOT NULL DEFAULT 'pending',
  featured       BOOLEAN       NOT NULL DEFAULT FALSE,
  reads          INTEGER       NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE read_receipts (
  id             SERIAL      PRIMARY KEY,
  article_id     INTEGER     NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  reader_address VARCHAR(42) NOT NULL,
  tx_hash        VARCHAR(66),
  amount_paid    NUMERIC(10,6),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(article_id, reader_address)
);

CREATE TABLE comments (
  id             SERIAL      PRIMARY KEY,
  article_id     INTEGER     NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  author_address VARCHAR(42) NOT NULL,
  author_name    VARCHAR(100),
  content        TEXT        NOT NULL,
  parent_id      INTEGER     REFERENCES comments(id) ON DELETE CASCADE,
  edited         BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reactions (
  id             SERIAL      PRIMARY KEY,
  article_id     INTEGER     NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  address        VARCHAR(42) NOT NULL,
  reaction_key   VARCHAR(20) NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(article_id, address)
);

CREATE TABLE follows (
  id                SERIAL      PRIMARY KEY,
  follower_address  VARCHAR(42) NOT NULL,
  following_address VARCHAR(42) NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(follower_address, following_address)
);

-- ── Auto-update trigger ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Disable Row Level Security ────────────────────────────────────
ALTER TABLE articles      DISABLE ROW LEVEL SECURITY;
ALTER TABLE read_receipts DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments      DISABLE ROW LEVEL SECURITY;
ALTER TABLE reactions     DISABLE ROW LEVEL SECURITY;
ALTER TABLE follows       DISABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════
--  TEST DATA
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO articles (title, blurb, content, price, category, read_time, is_research, author_address, status, featured, reads) VALUES

-- Article 1 — Featured, Approved
(
  'The State of Crypto in 2026: Maturity, AI, and Institutional Takeover',
  'If you''re still looking at cryptocurrency purely through the lens of memecoins and overnight hype cycles, you''re missing the real story. As we move through 2026, the digital asset market has fundamentally shifted into a maturing financial infrastructure.',
  E'If you''re still looking at cryptocurrency purely through the lens of memecoins and overnight hype cycles, you''re missing the real story. As we move through 2026, the digital asset market has fundamentally shifted. It''s no longer just an ideological playground — it''s a maturing financial infrastructure where macroeconomic forces, artificial intelligence, and traditional Wall Street institutions are pulling the strings.\n\nHere is a breakdown of the defining trends reshaping the crypto landscape in 2026.\n\n## 1. The Bitcoin and Ethereum Divergence\n\nThe relationship between the market''s top two assets has changed dramatically. In previous cycles, where Bitcoin went, Ethereum eagerly followed. In 2026, we are seeing a stark divergence.\n\nBitcoin has solidified its role as a macroeconomic asset — a digital gold that institutional investors use as a hedge against currency debasement. Ethereum, however, is increasingly trading like a high-growth technology stock. Because ETH has a much higher correlation to the Nasdaq, it has been hit harder by shifting interest rate expectations and macro uncertainties this year.\n\nMeanwhile, Bitcoin Exchange-Traded Funds (ETFs) have continued to anchor BTC''s stability, fundamentally altering how capital flows into the space.\n\n## 2. AI Agents Become Active Participants\n\nThe intersection of Artificial Intelligence and blockchain is arguably the most exciting development of the year. We are moving past the novelty of decentralized AI chatbots and entering an era of agentic crypto operations.\n\nAI agents are now actively managing portfolios, rebalancing assets in real-time, and executing complex DeFi strategies. Because AI agents are autonomous software, they can''t open traditional bank accounts — but they can use crypto wallets. This is driving massive demand for programmable micro-transactions, where AI systems autonomously pay for server space, API calls, and data using stablecoins.\n\n## 3. Real-World Asset (RWA) Tokenization\n\nBringing traditional assets onto the blockchain — known as RWA tokenization — has exploded. We aren''t just talking about tokenizing niche art anymore. We are seeing billions of dollars in U.S. Treasury bills, government bonds, and corporate credit being traded on-chain.\n\nThis provides a vital bridge between TradFi (Traditional Finance) and DeFi (Decentralized Finance). By tokenizing these assets, institutional investors gain the benefits of 24/7 atomic settlement and atomic composability.\n\n## 4. Stablecoins Are the "Killer App"\n\nIf there is one undisputed winner in the 2026 crypto ecosystem, it is the stablecoin. They have cemented themselves as the primary utility layer for the industry.\n\nMajor Wall Street banks — including consortiums featuring JP Morgan, Citi, and Bank of America — are aggressively developing shared tokenized deposit networks. Stablecoins are no longer just a safe haven for crypto traders during bear markets; they are actively competing with traditional international wire transfer networks like SWIFT for cross-border business payments.\n\n## The Bottom Line\n\nThe crypto market of 2026 is less about speculative moonshots and more about structural integration. The industry is building robust, scalable infrastructure that handles real-world economic activity. The guardrails are up, the institutions are here, and the technology is finally beginning to deliver on its early promises.',
  0.020000, 'Web3', 8, FALSE, '0xCca907AE079DB7638A4d2D3e82defaea5FBDF383', 'approved', TRUE, 142
),

-- Article 2 — Approved
(
  'Building on Arc: A Developer''s First Look at Circle''s L1 Blockchain',
  'Arc is Circle''s purpose-built Layer 1 blockchain for stablecoin finance. I spent two weeks building on the testnet — here''s what every developer needs to know before they start.',
  E'Arc is Circle''s purpose-built Layer 1 blockchain for stablecoin finance. After two weeks building on the testnet, here is what every developer needs to know.\n\n## What Makes Arc Different\n\nArc is not another Ethereum clone. Circle built it from the ground up with three core principles:\n\n**USDC as native gas.** No more estimating ETH costs. Every transaction fee is paid in USDC — predictable, dollar-denominated, no volatility. For enterprise builders this is a game-changer.\n\n**Sub-second finality.** Arc''s Malachite consensus engine finalizes blocks in under one second. Deterministically. This means you can build payment experiences that feel instant — no "waiting for confirmations."\n\n**EVM compatibility.** Your existing Solidity contracts deploy on Arc without modification. The tooling ecosystem — Hardhat, Foundry, ethers.js, viem — all just work.\n\n## Setting Up Your Dev Environment\n\nThe Arc testnet details you need:\n- **Chain ID:** 5042002\n- **RPC URL:** https://rpc.testnet.arc.network\n- **Explorer:** https://testnet.arcscan.app\n- **USDC Address:** 0x3600000000000000000000000000000000000000\n- **Faucet:** https://faucet.circle.com\n\nAdd it to MetaMask using wallet_addEthereumChain or just visit the Readlearc site — it adds Arc automatically when you connect.\n\n## Deploying Your First Contract\n\nThe developer experience is smooth. I deployed a simple payment splitter in about 20 minutes including the ABI setup. Gas costs are trivially small on testnet — I ran hundreds of test transactions without worrying about fees.\n\n## What''s Missing (For Now)\n\nArc testnet is early. Cross-chain bridges are limited, the ecosystem of deployed protocols is thin, and documentation for edge cases is sparse. Expect rough edges.\n\nBut the core infrastructure is solid. For payment-focused applications — exactly what we''re building at Readlearc — Arc is already production-ready.\n\n## Should You Build on Arc?\n\nIf your application is payment-centric, needs predictable fees, or targets institutional users, yes. Arc is the most sensible choice for stablecoin-native applications today.',
  0.015000, 'Development', 6, FALSE, '0xCca907AE079DB7638A4d2D3e82defaea5FBDF383', 'approved', FALSE, 89
),

-- Article 3 — Approved, Research
(
  'On-Chain Content Monetization: A Framework for Evaluating Pay-Per-Read Protocols',
  'Traditional content paywalls extract 30-70% from creators. Blockchain-based pay-per-read systems promise a better model — but the design space is more complex than it appears. This research paper analyzes the tradeoffs.',
  E'## Abstract\n\nTraditional content monetization platforms extract between 30% and 70% of creator revenue through advertising, subscription management, and payment processing fees. Blockchain-based pay-per-read protocols offer a fundamentally different model — one where payment splits are enforced at the protocol level, settlement is atomic, and creator ownership is cryptographically guaranteed. This paper analyzes the design space of on-chain content monetization systems, evaluates the economic tradeoffs, and proposes a framework for assessing protocol maturity.\n\n## Introduction\n\nThe creator economy represents approximately $250 billion in annual revenue as of 2026. Despite this scale, individual creators capture a shrinking percentage of the value they generate. Platforms built on advertising models have structural incentives to maximize engagement at the expense of quality.\n\nPay-per-read systems — where readers make direct micropayments to access content — represent an alternative alignment model. Early experiments with this approach (Substack, Mirror, etc.) demonstrated demand but remained dependent on traditional payment rails and centralized custody.\n\nThe emergence of stablecoin-native blockchains like Arc creates a new design space where the payment layer, content access control, and economic incentive structures can all be encoded at the protocol level.\n\n## Methodology\n\nWe analyze three dimensions of pay-per-read protocol design:\n\n1. **Payment architecture** — How are funds transferred? Custodial vs. non-custodial. Atomic vs. sequential splits.\n2. **Access control mechanisms** — How is read access granted? On-chain receipts vs. server-side verification.\n3. **Economic model** — Fee split ratios, referral mechanisms, creator incentive alignment.\n\nWe evaluate protocols across these dimensions using a combination of on-chain data analysis and user behavior modeling.\n\n## Results\n\nProtocols that implement atomic on-chain payment splits achieve 15-23% higher creator retention compared to platforms with manual payout cycles. The elimination of payout minimums — enabled by gas-free USDC transfers — is particularly impactful for emerging creators.\n\nOn-chain read receipts create a novel category of verifiable intellectual property ownership. Readers accumulate a portfolio of cryptographic proofs demonstrating their reading history — a primitive that enables future composability with reputation systems and lending protocols.\n\n## Discussion\n\nThe primary challenge facing pay-per-read protocols is the discovery problem. On-chain payment mechanics are solved. What remains unsolved is surfacing quality content to readers willing to pay for it.\n\nSecondary challenges include content permanence (what happens when the frontend is discontinued?), cross-chain payment fragmentation, and the user experience gap between Web2 paywalls and Web3 payment flows.\n\n## Conclusion\n\nOn-chain pay-per-read protocols represent a structurally superior model for content monetization. The economic alignment between creators and platforms, enforced at the protocol level, eliminates the adversarial dynamic that plagues advertising-based models. The primary remaining challenge is distribution — connecting quality content with readers willing to pay for it.',
  0.050000, 'Research', 14, TRUE, '0x4Df868336E6d27E9DBBBDa536607FCaC578D88d7', 'approved', TRUE, 67
),

-- Article 4 — Approved
(
  'DeFi in 2026: What Survived the Regulatory Winter',
  'Three years ago, regulators worldwide declared war on DeFi. Today, a leaner, more compliant ecosystem has emerged — and it''s stronger for it. Here''s what made it through.',
  E'Three years ago, the headlines were apocalyptic. Regulators worldwide declared war on decentralized finance. Enforcement actions, legislative bans, and executive orders threatened to shut down the entire sector.\n\nToday, a leaner, more compliant ecosystem has emerged — and it''s stronger for it.\n\n## What Got Wiped Out\n\nLet''s be honest about the casualties. Anonymous yield farms paying 10,000% APY are gone. Algorithmic stablecoins with no collateral backing are gone. Protocols with pseudonymous teams and no legal entity are largely gone from the mainstream.\n\nThis was not a bad outcome. The protocols that collapsed deserved to collapse. They were either fraud, unsustainable Ponzi mechanics, or both.\n\n## What Survived\n\n**Collateralized lending** — Protocols like Aave and Compound survived because they''re genuinely useful and their risk models work. You lock up more than you borrow. When prices fall, you get liquidated. No magic.\n\n**DEX infrastructure** — Uniswap v4, Curve, and their descendants continue processing hundreds of billions monthly. They''re too useful to kill and too decentralized to effectively regulate.\n\n**Stablecoins** — USDC, USDT, and their institutional cousins have become the primary beneficiaries of the regulatory clarity. The Clarity for Payment Stablecoins Act in the US gave them a legal framework. Adoption is accelerating.\n\n**RWA protocols** — The bridge between TradFi and DeFi is real and growing. Treasury tokenization, corporate bond markets, and trade finance are all moving on-chain with institutional-grade compliance.\n\n## The New Landscape\n\nThe DeFi of 2026 looks different from 2021. It''s less anarchic, more institutionally focused, and significantly more compliant. It''s also more likely to be here in another five years.\n\nFor builders, the opportunity is clear: build on compliant infrastructure, get comfortable with KYC/AML requirements for institutional users, and focus on genuine utility rather than yield engineering.',
  0.018000, 'DeFi', 7, FALSE, '0x9B2E4563Fa78236E9F89342A1A5B08a5dE72D591', 'approved', FALSE, 203
),

-- Article 5 — Approved
(
  'AI Agent Wallets: The Case for USDC as the Native Currency of Autonomous Systems',
  'As AI agents begin managing real economic activity, the question of what currency they use becomes critical. Here''s why USDC on Arc is the obvious answer.',
  E'As AI agents begin managing real economic activity — paying for compute, APIs, data, and services — the question of what currency they use is no longer theoretical. It''s an architectural decision being made right now.\n\nHere''s why USDC on Arc is the obvious answer.\n\n## The Problem with Existing Solutions\n\n**Fiat is inaccessible to agents.** Autonomous software cannot open a bank account. It cannot submit KYC documents. It cannot call customer service. Traditional payment rails are fundamentally built for humans.\n\n**ETH and volatile cryptocurrencies are impractical.** If an AI agent holds ETH to pay for API calls, the value of that ETH might drop 30% overnight. The agent''s purchasing power becomes unpredictable, making budget management impossible.\n\n**Centralized payment APIs have rate limits and failures.** Stripe and PayPal work for human-speed transactions. AI agents operating at machine speed — making thousands of micropayments per hour — quickly exhaust rate limits and encounter API failures.\n\n## Why USDC on Arc Solves All Three\n\n**Accessibility.** Any software can generate a wallet address. No KYC. No bank approval. No waiting period. An AI agent can be deployed with a funded wallet in seconds.\n\n**Price stability.** USDC is pegged to the US dollar. An agent''s budget is predictable. $100 USDC is worth $100 USDC next week.\n\n**Speed and throughput.** Arc processes transactions in under one second with deterministic finality. An AI agent can make hundreds of payments per minute without hitting rate limits. Gas fees paid in USDC eliminate the need to manage a separate gas token.\n\n## What This Enables\n\nThe implications are large. AI agents with autonomous payment capability can:\n\n- Rent compute resources on-demand, paying by the millisecond\n- Purchase data from providers at the moment it''s needed\n- Pay contributors in real-time rather than through monthly payroll cycles\n- Participate in prediction markets and information markets autonomously\n\nReadlearc itself is an example: AI agents could purchase research articles, extract insights, and pay writers directly — with no human intermediary required at any step.\n\n## The Near Future\n\nWithin two years, we expect AI agent wallets to represent a significant fraction of on-chain USDC volume. The infrastructure is ready. The only remaining question is how fast the agents themselves will proliferate.',
  0.025000, 'AI', 8, FALSE, '0x9B2E4563Fa78236E9F89342A1A5B08a5dE72D591', 'approved', TRUE, 318
),

-- Article 6 — Approved
(
  'Understanding Circle''s Arc: Why a Payment Company Built a Blockchain',
  'Circle didn''t build Arc because they wanted to be in the blockchain business. They built it because existing blockchains couldn''t deliver what stablecoin finance actually needs.',
  E'Circle didn''t build Arc because they wanted to be in the blockchain business. They built it because existing blockchains couldn''t deliver what stablecoin finance actually needs.\n\nThis distinction matters. Arc is not a general-purpose smart contract platform trying to be everything to everyone. It''s purpose-built infrastructure for one specific job: making USDC the best payment network on earth.\n\n## The Problem with General-Purpose Chains\n\nEthereum, Solana, and their competitors are built around a native gas token. This creates a fundamental problem for stablecoin-native applications: users must hold two assets to do anything. They need ETH to pay gas, and USDC to actually transact.\n\nFor consumer applications, this is a massive UX friction point. For institutional users, it creates accounting complexity. A company paying invoices in USDC shouldn''t need to also manage an ETH treasury.\n\n## Arc''s Answer\n\nArc makes USDC the gas token. Full stop. If you have USDC, you can transact. No other asset required.\n\nThis sounds simple, but the implications run deep:\n\n- Businesses can operate entirely in a known, stable currency\n- AI agents need only one asset in their wallets\n- Cross-border payments work without exotic token exposure\n- Fee predictability becomes possible (gas costs denominated in dollars)\n\n## The Malachite Consensus Engine\n\nArc''s consensus mechanism delivers what financial infrastructure demands: deterministic, sub-second finality. When a transaction confirms on Arc, it''s final. No probabilistic settlement. No reorganization risk.\n\nFor payment applications, this is the difference between "probably got paid" and "definitely got paid." Banks understand the difference. It''s why ACH takes two days — the traditional system needed that time to manage settlement risk.\n\n## What It Means for Developers\n\nBuilding on Arc is deliberately familiar. EVM compatibility means your Solidity contracts work. Ethers.js and viem work. The JSON-RPC interface is standard.\n\nThe only meaningful difference is what you don''t have to worry about: gas token management, unpredictable fee spikes, and probabilistic finality.',
  0.012000, 'Blockchain', 6, FALSE, '0xCca907AE079DB7638A4d2D3e82defaea5FBDF383', 'approved', FALSE, 156
),

-- Article 7 — Approved
(
  'The Economics of Writing Online in 2026',
  'Substack has a 10% cut. Medium pays fractions of cents. Traditional publishers take 85% of book revenue. The math has never worked for writers — until now.',
  E'Substack has a 10% cut. Medium pays fractions of cents per read. Traditional publishers take 85% of book revenue for the privilege of "distribution." The economics of writing online have never worked for writers.\n\nThe platforms take almost everything. Writers get exposure.\n\n## The Platform Extraction Problem\n\nEvery content platform in history has followed the same arc:\n\n1. Attract creators with favorable terms\n2. Build audience around creator content\n3. Extract increasing rent from creators once they''re dependent\n\nYouTube started at 55% revenue share. They''ve since clawed back through ad policy changes, monetization requirements, and algorithmic suppression of non-advertiser-friendly content.\n\nSubstack''s 10% feels fair until you realize they''re also investing your readers'' email addresses in their own network and could change terms at any time.\n\n## What On-Chain Publishing Changes\n\nWhen payment happens on a blockchain, the split is encoded in code, not in a terms-of-service document that can be changed next quarter.\n\nOn Readlearc, every payment is governed by a smart contract. The 85/10/5 split (writer/platform/referrer) is the split. Always. The platform cannot change it without deploying a new contract — a change that would be publicly visible on-chain.\n\n## The Math, Finally\n\nIf you write 10 articles and price them at $0.02 each:\n- 1,000 reads across all articles = $20 gross\n- Your share: $17 (85%)\n- No minimum payout threshold. No monthly payment cycle. Instant settlement.\n\nThose 1,000 reads could come from anywhere. No algorithm gatekeeping your distribution. Readers find your work and pay directly.\n\n## The Trade-off\n\nThe honest trade-off: platforms do provide discovery, SEO, and brand trust. Readlearc is not a replacement for distribution. It''s a better monetization layer for writers who already have an audience or are building one.\n\nThe question is whether 85% of something is better than 30% of something larger. For most independent writers, the math increasingly favors ownership.',
  0.010000, 'Economics', 5, FALSE, '0x7Ab3CE109c56E1Ab1bE4dFEC2eC5aae4dE39AB7c', 'approved', FALSE, 94
),

-- Article 8 — Approved
(
  'Smart Contract Security in 2026: What the Last Five Years Taught Us',
  'Over $10 billion has been lost to smart contract exploits. The patterns are depressingly repetitive. Here''s what the post-mortems all have in common — and how to not be next.',
  E'Over $10 billion has been lost to smart contract exploits over the past five years. The patterns are depressingly repetitive.\n\nReeentrancy. Integer overflow. Unchecked return values. Oracle manipulation. Access control failures.\n\nThe same vulnerabilities, exploited over and over, against protocols that should have known better.\n\n## The Recurring Mistakes\n\n**Reentrancy is still killing projects.** The DAO hack was in 2016. We are in 2026. Projects are still getting drained by reentrancy attacks. The fix is one line: use the checks-effects-interactions pattern. Always update state before making external calls.\n\n**Oracle manipulation is underappreciated.** If your protocol uses a price feed to determine liquidation thresholds, attackers will manipulate that price feed. On-chain oracles based on spot prices are dangerous. Use time-weighted average prices or trusted price feeds with manipulation resistance.\n\n**Access control is not optional.** How many exploits have involved an unprotected admin function? The answer is too many. Every function that changes protocol state needs explicit authorization checks.\n\n## What''s Actually Getting Better\n\nAudit quality has improved dramatically. The good audit firms — Trail of Bits, OpenZeppelin, Spearbit — have developed systematic approaches that catch the class of vulnerabilities that used to slip through.\n\nFormal verification is becoming more accessible. Tools like Certora and Halmos allow developers to mathematically prove properties about their contracts. It''s not magic, but it catches entire classes of bugs before deployment.\n\nImmutable, minimal contracts are winning. The most exploited contracts are the most complex ones. Simple contracts with minimal surface area and well-tested logic are surviving.\n\n## For Arc Developers\n\nThe EVM compatibility means the same security practices apply. Custom errors instead of require strings (cheaper and cleaner). Use OpenZeppelin''s battle-tested implementations rather than rolling your own access control. Get an audit before mainnet.\n\nThe sub-second finality on Arc means flash loan attacks operate in a different context — but don''t assume the speed eliminates the attack vector. Model your adversaries carefully.',
  0.022000, 'Development', 9, FALSE, '0x4Df868336E6d27E9DBBBDa536607FCaC578D88d7', 'approved', FALSE, 178
),

-- Article 9 — Pending (awaiting approval)
(
  'NFTs Are Not Dead: They Just Grew Up',
  'The JPEG boom is over. The speculation frenzy is gone. What remained is something more durable and more interesting than anyone expected.',
  E'The JPEG boom is over. The speculation frenzy is gone. What remained is something more durable and more interesting than anyone expected.\n\nNFTs — stripped of the mania — are just a primitive: a way to represent unique ownership of a digital object on a blockchain. That primitive is genuinely useful. It turns out we just needed to find the right use cases.\n\n## What Died\n\nProfile pictures as status symbols. 10,000-item generative collections with no utility. Celebrity cash grabs. Metaverse land speculation. All gone.\n\nGood riddance.\n\n## What Survived and Thrived\n\n**Event tickets.** NFC-enabled NFT tickets have eliminated ticket fraud and scalping at dozens of major venues. The ownership model is cleaner than any Web2 alternative.\n\n**Music rights.** Fractional ownership of music royalties via NFTs is a growing market. Fans invest in artists early; artists get funding without labels.\n\n**Read receipts.** (Yes, Readlearc is doing this.) Proof that you read an article, attended a course, or completed a certification — all verifiable on-chain.\n\n**In-game items.** True ownership of game assets has finally arrived in mainstream games. The ability to sell your earned items on open markets has changed player economics.\n\n## The Pattern\n\nEvery surviving NFT use case solves a real problem that Web2 couldn''t solve cleanly. The technology is infrastructure, not the product.\n\nThe projects that failed treated the NFT as the product. The projects that succeeded treated it as a mechanism for solving a pre-existing problem.',
  0.008000, 'Web3', 5, FALSE, '0x7Ab3CE109c56E1Ab1bE4dFEC2eC5aae4dE39AB7c', 'pending', FALSE, 0
),

-- Article 10 — Pending
(
  'Getting Started with Readlearc: A Writer''s Guide',
  'Everything you need to know to publish your first article on Readlearc — from setting up your wallet to pricing your content and building a reader base.',
  E'Welcome to Readlearc. This guide will walk you through everything you need to know to publish your first article and start earning USDC.\n\n## What You Need\n\n**A wallet.** MetaMask is the easiest option. Download it from metamask.io, create a wallet, and save your seed phrase somewhere safe. This is your identity on Readlearc — there''s no username/password system.\n\n**Test USDC.** We''re on Arc Testnet, which means you''ll use test USDC — not real money. Get some from the Circle faucet at faucet.circle.com. Select Arc Testnet and enter your wallet address.\n\n**The Arc Testnet.** Your wallet needs to be connected to Arc Testnet. When you connect on Readlearc, we''ll automatically prompt you to add Arc if you''re on a different network.\n\n## Writing Your Article\n\n1. Connect your wallet in the top-right corner\n2. Click "Write" in the navigation\n3. Choose your content type: Article (standard post) or Research (academic paper format)\n4. Write your title and blurb — the blurb is what readers see before paying, so make it compelling\n5. Write your full article content (the first 50% will be shown as a free preview)\n6. Set your price using the slider — we recommend $0.02 for new writers to maximize reads\n7. Select a category and verify the checklist is complete\n8. Click "Publish to Arc" and sign the transaction\n\n## Pricing Strategy\n\nLower prices drive more reads. Higher prices signal premium content. A good starting point is $0.01-$0.05 per article while you''re building an audience.\n\nYou keep 85% of every payment. If 100 people read your $0.02 article, you earn $1.70 in USDC — instantly settled, no minimums, no waiting.\n\n## Building Your Reader Base\n\nShare your profile link (readlearc.io/profile/your-wallet-address) on your existing channels. Readers can follow you to get notified of new articles.\n\nConsistency matters more than any individual article. Writers who publish weekly outperform those who publish occasional masterpieces.\n\n## After You Publish\n\nYour article goes to the admin review queue. Once approved, it appears on the homepage and explore page. Review usually takes less than 24 hours.\n\nTrack your earnings in Creator Studio. You can send your USDC earnings to any address directly from there.',
  0.005000, 'Guide', 7, FALSE, '0xCca907AE079DB7638A4d2D3e82defaea5FBDF383', 'pending', FALSE, 0
);

-- ── Read Receipts ─────────────────────────────────────────────────
INSERT INTO read_receipts (article_id, reader_address, tx_hash, amount_paid) VALUES
(1, '0x4df868336e6d27e9dbbbbda536607fcac578d88d7', '0xabc123def456abc123def456abc123def456abc123def456abc123def456ab01', 0.020000),
(1, '0x9b2e4563fa78236e9f89342a1a5b08a5de72d591', '0xabc123def456abc123def456abc123def456abc123def456abc123def456ab02', 0.020000),
(1, '0x7ab3ce109c56e1ab1be4dfec2ec5aae4de39ab7c', '0xabc123def456abc123def456abc123def456abc123def456abc123def456ab03', 0.020000),
(2, '0x4df868336e6d27e9dbbbbda536607fcac578d88d7', '0xabc123def456abc123def456abc123def456abc123def456abc123def456ab04', 0.015000),
(3, '0xcca907ae079db7638a4d2d3e82defaea5fbdf383', '0xabc123def456abc123def456abc123def456abc123def456abc123def456ab05', 0.050000),
(3, '0x7ab3ce109c56e1ab1be4dfec2ec5aae4de39ab7c', '0xabc123def456abc123def456abc123def456abc123def456abc123def456ab06', 0.050000),
(5, '0xcca907ae079db7638a4d2d3e82defaea5fbdf383', '0xabc123def456abc123def456abc123def456abc123def456abc123def456ab07', 0.025000),
(5, '0x4df868336e6d27e9dbbbbda536607fcac578d88d7', '0xabc123def456abc123def456abc123def456abc123def456abc123def456ab08', 0.025000),
(6, '0x9b2e4563fa78236e9f89342a1a5b08a5de72d591', '0xabc123def456abc123def456abc123def456abc123def456abc123def456ab09', 0.012000),
(8, '0xcca907ae079db7638a4d2d3e82defaea5fbdf383', '0xabc123def456abc123def456abc123def456abc123def456abc123def456ab10', 0.022000);

-- ── Comments ──────────────────────────────────────────────────────
INSERT INTO comments (article_id, author_address, author_name, content, parent_id) VALUES
(1, '0x4df868336e6d27e9dbbbbda536607fcac578d88d7', 'CryptoResearcher', 'This is the most balanced take on the 2026 market I''ve read. The BTC/ETH divergence point is something most people are still missing.', NULL),
(1, '0x9b2e4563fa78236e9f89342a1a5b08a5de72d591', 'DeFiBuilder', 'The AI agents section is underappreciated. We''re already seeing agent-to-agent payments on Arc. USDC as machine money is inevitable.', NULL),
(1, '0xcca907ae079db7638a4d2d3e82defaea5fbdf383', 'Anointing', 'Thanks for the kind words! The agent economy angle is what I''m most excited to write about next.', 2),
(2, '0x9b2e4563fa78236e9f89342a1a5b08a5de72d591', 'DeFiBuilder', 'The gas-in-USDC model is a bigger deal than most people realize. I spent years managing ETH for gas on behalf of users. Never again.', NULL),
(3, '0xcca907ae079db7638a4d2d3e82defaea5fbdf383', 'Anointing', 'Excellent research. The 15-23% creator retention differential is striking. Would love to see the methodology expanded.', NULL),
(3, '0x4df868336e6d27e9dbbbbda536607fcac578d88d7', 'CryptoResearcher', 'The on-chain read receipt as a composable primitive is the most interesting idea in here. Haven''t seen this framed this way before.', NULL),
(5, '0x7ab3ce109c56e1ab1be4dfec2ec5aae4de39ab7c', 'Web3Writer', 'I''ve been thinking about this exact problem for months. The moment AI agents need to pay for data, USDC becomes unavoidable.', NULL),
(5, '0xcca907ae079db7638a4d2d3e82defaea5fbdf383', 'Anointing', 'We built Readlearc partly with this in mind. Articles as data products that agents can purchase autonomously.', 7);

-- ── Reactions ─────────────────────────────────────────────────────
INSERT INTO reactions (article_id, address, reaction_key) VALUES
(1, '0x4df868336e6d27e9dbbbbda536607fcac578d88d7', 'gem'),
(1, '0x9b2e4563fa78236e9f89342a1a5b08a5de72d591', 'flame'),
(1, '0x7ab3ce109c56e1ab1be4dfec2ec5aae4de39ab7c', 'zap'),
(2, '0x4df868336e6d27e9dbbbbda536607fcac578d88d7', 'flame'),
(2, '0x9b2e4563fa78236e9f89342a1a5b08a5de72d591', 'gem'),
(3, '0xcca907ae079db7638a4d2d3e82defaea5fbdf383', 'gem'),
(3, '0x7ab3ce109c56e1ab1be4dfec2ec5aae4de39ab7c', 'zap'),
(4, '0x4df868336e6d27e9dbbbbda536607fcac578d88d7', 'flame'),
(5, '0xcca907ae079db7638a4d2d3e82defaea5fbdf383', 'gem'),
(5, '0x4df868336e6d27e9dbbbbda536607fcac578d88d7', 'gem'),
(5, '0x7ab3ce109c56e1ab1be4dfec2ec5aae4de39ab7c', 'zap'),
(6, '0x9b2e4563fa78236e9f89342a1a5b08a5de72d591', 'flame'),
(8, '0xcca907ae079db7638a4d2d3e82defaea5fbdf383', 'zap');

-- ── Follows ───────────────────────────────────────────────────────
INSERT INTO follows (follower_address, following_address) VALUES
('0x4df868336e6d27e9dbbbbda536607fcac578d88d7', '0xcca907ae079db7638a4d2d3e82defaea5fbdf383'),
('0x9b2e4563fa78236e9f89342a1a5b08a5de72d591', '0xcca907ae079db7638a4d2d3e82defaea5fbdf383'),
('0x7ab3ce109c56e1ab1be4dfec2ec5aae4de39ab7c', '0xcca907ae079db7638a4d2d3e82defaea5fbdf383'),
('0xcca907ae079db7638a4d2d3e82defaea5fbdf383', '0x9b2e4563fa78236e9f89342a1a5b08a5de72d591'),
('0xcca907ae079db7638a4d2d3e82defaea5fbdf383', '0x4df868336e6d27e9dbbbbda536607fcac578d88d7'),
('0x7ab3ce109c56e1ab1be4dfec2ec5aae4de39ab7c', '0x9b2e4563fa78236e9f89342a1a5b08a5de72d591');

-- ── Verify ────────────────────────────────────────────────────────
SELECT 'articles'      AS tbl, COUNT(*) AS rows FROM articles      UNION ALL
SELECT 'read_receipts' AS tbl, COUNT(*) AS rows FROM read_receipts UNION ALL
SELECT 'comments'      AS tbl, COUNT(*) AS rows FROM comments      UNION ALL
SELECT 'reactions'     AS tbl, COUNT(*) AS rows FROM reactions     UNION ALL
SELECT 'follows'       AS tbl, COUNT(*) AS rows FROM follows;
