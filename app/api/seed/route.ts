import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as sb } from "../../../lib/supabase";

// ── Wallets ──────────────────────────────────────────────────────────────────
const W1 = "0xcca907ae079db7638a4d2d3e82defaea5fbdf383"; // main author
const W2 = "0x4df868336e6d27e9dbbbda536607fcac578d88d7";
const W3 = "0x9b2e4563fa78236e9f89342a1a5b08a5de72d591";
const W4 = "0x7ab3ce109c56e1ab1be4dfec2ec5aae4de39ab7c";
const W5 = "0xa12f9c3e2bd4058e7a0e1b7c8d3f0a9b1e4c7d2f";
const W6 = "0xb34e5a6c1f2d8b7a0e9c4f1d2a3b5e6c7d8f9a0b";
const ALL = [W1,W2,W3,W4,W5,W6];

// ── Articles ─────────────────────────────────────────────────────────────────
const ARTICLES = [
  // Web3 / Technology
  { title:"The State of Crypto in 2026: Maturity, AI, and Institutional Takeover",
    blurb:"Bitcoin is digital gold. Ethereum is tech equity. AI agents hold USDC wallets. The digital asset market has fundamentally matured — and the real story is infrastructure.",
    content:`<h2>The Bitcoin and Ethereum Divergence</h2><p>Bitcoin has solidified its role as digital gold for institutional hedging. Ethereum trades more like a high-growth tech stock, correlating heavily with the Nasdaq. Bitcoin ETFs have anchored BTC stability while ETH faces macro headwinds.</p><h2>AI Agents Become Active Participants</h2><p>AI agents can't open bank accounts — but they can hold crypto wallets. This drives massive demand for programmable micro-transactions: autonomous systems paying for compute, APIs, and data using USDC.</p><h2>Real-World Asset Tokenization</h2><p>Billions in US Treasury bills, government bonds, and corporate credit now trade on-chain. RWA tokenization bridges TradFi and DeFi, enabling 24/7 atomic settlement.</p><h2>The Bottom Line</h2><p>Crypto in 2026 is less about speculative moonshots and more about structural integration into global finance. The infrastructure is real, the institutions are here, and the technology is delivering.</p>`,
    price:"0.02", category:"Web3", read_time:8, is_research:false, author_address:W1, status:"featured", featured:true, reads:312 },

  { title:"Building on Arc: A Developer's First Look at Circle's L1",
    blurb:"Arc is Circle's purpose-built Layer 1 for stablecoin finance. USDC as native gas. Sub-second finality. Full EVM compatibility. Here's everything a developer needs to know.",
    content:`<h2>What Makes Arc Different</h2><p><strong>USDC as native gas.</strong> No ETH management. Every transaction cost is in USDC — predictable and dollar-denominated.</p><p><strong>Sub-second finality.</strong> Arc's consensus finalizes blocks in under one second, deterministically.</p><p><strong>EVM compatibility.</strong> Solidity contracts deploy without modification.</p><h2>Testnet Setup</h2><p>Chain ID: 5042002 | RPC: https://rpc.testnet.arc.network | Explorer: https://testnet.arcscan.app</p><h2>Should You Build on Arc?</h2><p>If your application is payment-centric, needs predictable fees, or targets institutional users — yes. Arc is purpose-built for exactly this use case.</p>`,
    price:"0.015", category:"Development", read_time:6, is_research:false, author_address:W1, status:"approved", featured:false, reads:187 },

  { title:"AI Agent Wallets: Why USDC Is the Native Currency of Autonomous Systems",
    blurb:"As AI agents manage real economic activity — paying for compute, APIs, data — the question of currency is now architectural. Here's why USDC on Arc is the answer.",
    content:`<h2>The Problem with Existing Solutions</h2><p>Fiat is inaccessible to autonomous software. Volatile crypto makes budgeting impossible. Centralized APIs have rate limits incompatible with agent-speed transactions.</p><h2>Why USDC on Arc Solves All Three</h2><p>Any software can generate a wallet — no KYC. $100 USDC is worth $100 next week. Arc settles in under one second with USDC-denominated fees.</p><h2>What This Enables</h2><p>AI agents with payment capability can rent compute by the millisecond, purchase data on demand, pay contributors in real-time, and participate in information markets autonomously. Readlearc demonstrates this: AI agents could purchase research articles and pay writers directly.</p>`,
    price:"0.025", category:"AI", read_time:7, is_research:false, author_address:W3, status:"featured", featured:true, reads:445 },

  { title:"DeFi in 2026: What Survived the Regulatory Winter",
    blurb:"Regulators declared war on DeFi three years ago. Today a leaner, more compliant ecosystem has emerged — collateralized lending, DEX infrastructure, stablecoins, and RWAs.",
    content:`<h2>What Got Wiped Out</h2><p>Anonymous yield farms paying 10,000% APY — gone. Algorithmic stablecoins with no collateral — gone. The protocols that collapsed deserved to collapse.</p><h2>What Survived</h2><p>Collateralized lending, DEX infrastructure, stablecoins with legal frameworks, and RWA protocols with institutional-grade compliance. The Clarity for Payment Stablecoins Act gave USDC and USDT legal frameworks. Adoption is accelerating.</p><h2>The New Landscape</h2><p>DeFi 2026 is less anarchic, more institutionally focused, significantly more compliant — and more likely to be here in another five years.</p>`,
    price:"0.018", category:"DeFi", read_time:6, is_research:false, author_address:W2, status:"approved", featured:false, reads:276 },

  { title:"Smart Contract Security in 2026: What Five Years of Exploits Taught Us",
    blurb:"Over $10 billion lost to smart contract exploits. The patterns are depressingly repetitive. Reentrancy. Oracle manipulation. Access control failures. Here's how to not be next.",
    content:`<h2>The Recurring Mistakes</h2><p>Reentrancy still kills projects — use the checks-effects-interactions pattern. Oracle manipulation drains protocols — use time-weighted average prices. Access control failures expose admin functions — every state-changing function needs explicit authorization.</p><h2>What's Getting Better</h2><p>Audit quality has improved. Formal verification is becoming accessible. Immutable, minimal contracts are winning. The most exploited contracts are the most complex ones.</p>`,
    price:"0.022", category:"Development", read_time:9, is_research:false, author_address:W2, status:"approved", featured:false, reads:203 },

  { title:"The Economics of Writing Online in 2026",
    blurb:"Substack takes 10%. Medium pays fractions of cents. Publishers take 85% of book revenue. The math has never worked for writers — until blockchain pay-per-read.",
    content:`<h2>The Platform Extraction Problem</h2><p>Every content platform follows the same arc: attract creators with favorable terms, build audience around their content, extract increasing rent once creators are dependent.</p><h2>What On-Chain Publishing Changes</h2><p>When payment splits are encoded in smart contracts, the terms can't change next quarter. On Readlearc, every payment is governed by the protocol — 85% writer share, always.</p><h2>The Math</h2><p>10 articles × $0.02 × 1,000 total reads = $20 gross, $17 to you. No payout minimums. No monthly cycles. Instant settlement.</p>`,
    price:"0.01", category:"Economics", read_time:5, is_research:false, author_address:W4, status:"approved", featured:false, reads:142 },

  { title:"NFTs Are Not Dead: They Just Grew Up",
    blurb:"The speculative bubble burst in 2022. What remained is a genuinely useful primitive: provable digital ownership. The use cases that survived are the ones that mattered.",
    content:`<h2>What the Crash Killed</h2><p>Profile picture projects with no utility. Speculative flips. Celebrity cash-grabs. The noise is gone.</p><h2>What Remained</h2><p>On-chain read receipts for content monetization. Gaming items with genuine scarcity. Event ticketing with programmable royalties. Digital art with provable provenance. These use cases weren't hype — they were infrastructure waiting for the right market conditions.</p>`,
    price:"0.008", category:"Web3", read_time:5, is_research:false, author_address:W4, status:"approved", featured:false, reads:98 },

  // Research papers — multi-discipline
  { title:"Adaptive Learning Systems Powered by Artificial Intelligence: Measuring Personalization Effects on Academic Outcomes",
    blurb:"We evaluate AI-driven adaptive learning across 12,000 students in Nigeria, Brazil, and Indonesia. Students using adaptive systems show a 34% improvement in concept retention and 28% reduction in time-to-mastery compared to traditional instruction.",
    content:`<h2>Abstract</h2><p>This study evaluates AI-driven adaptive learning systems across 12,000 students in Nigeria, Brazil, and Indonesia, measuring impact on academic outcomes across mathematics, science, and literacy.</p><h2>Introduction</h2><p>Traditional classroom instruction delivers uniform content at uniform pace. Adaptive learning systems adjust difficulty, pacing, and instructional modality in real time based on individual learner performance signals.</p><h2>Methodology</h2><p>Randomized controlled trial across 48 schools. Control group received standard instruction. Treatment group used AI-adaptive software for 60 minutes daily over 18 weeks. Outcome measures: concept retention scores at 4-week intervals, time-to-mastery on standardized module completion, and six-month longitudinal follow-up.</p><h2>Results</h2><p>Treatment students demonstrated 34% improvement in concept retention (p&lt;0.001) and 28% reduction in time-to-mastery (p&lt;0.001). Effects were largest for students who entered below grade-level baseline, suggesting AI personalization disproportionately benefits learners with foundational gaps.</p><h2>Discussion</h2><p>The magnitude of effects exceeds most prior meta-analytic estimates of computer-assisted instruction, likely due to advances in real-time diagnostic capability. Adaptive pacing — adjusting content speed based on individual signal — accounts for approximately 60% of the observed benefit.</p><h2>Conclusion</h2><p>AI-adaptive learning systems demonstrate significant, reproducible improvements in academic outcomes. Policy implications include targeted deployment for remedial learners and teacher professional development to optimize human-AI instructional integration.</p>`,
    price:"0.05", category:"Computer Science", read_time:18, is_research:true, author_address:W3, status:"featured", featured:true, reads:134 },

  { title:"Token-Gated Content and NFT Royalties: Restructuring Creator-Platform Power Dynamics in Web3 Media",
    blurb:"We analyze 847 token-gated content platforms and find creators capture 67% more revenue under NFT royalty models versus traditional subscription splits, with long-tail creator benefits exceeding 300%.",
    content:`<h2>Abstract</h2><p>Token-gated content platforms — where access requires ownership of a specific digital asset — represent a structural departure from traditional subscription and advertising models. We analyze 847 platforms and 2.3 million creator-reader transactions.</p><h2>Literature Review</h2><p>Prior work on creator economy platforms documents systematic rent extraction by platform intermediaries. Our contribution examines whether blockchain-based token gating alters this dynamic.</p><h2>Methodology</h2><p>We collect transaction-level data from 847 token-gated platforms across Ethereum, Polygon, and Arc networks from 2024–2026. Revenue attribution uses smart contract event logs to calculate creator vs. platform splits.</p><h2>Results</h2><p>Creators capture an average of 78% of gross revenue on token-gated platforms versus 47% on traditional subscription platforms (p&lt;0.001). Effects are largest for long-tail creators (300%+ improvement) and smallest for top-10% earners (23% improvement).</p><h2>Conclusion</h2><p>Token gating and NFT royalty mechanics systematically shift value from platforms to creators, with the largest benefits accruing to emerging creators who lack bargaining power on traditional platforms.</p>`,
    price:"0.05", category:"Economics", read_time:20, is_research:true, author_address:W1, status:"featured", featured:true, reads:89 },

  { title:"Blockchain Technology in Healthcare Data Management: A Systematic Review of Security, Interoperability, and Patient Privacy",
    blurb:"A systematic review of 127 blockchain healthcare implementations finds distributed ledger technology reduces unauthorized data access by 71%, improves cross-institution data sharing by 45%, while introducing governance challenges requiring careful regulatory alignment.",
    content:`<h2>Abstract</h2><p>Systematic review of 127 peer-reviewed blockchain healthcare implementations from 2020–2026, evaluating security outcomes, interoperability achievements, patient privacy preservation, and governance challenges.</p><h2>Background</h2><p>Healthcare data breaches affected 133 million patients globally in 2024. Fragmented electronic health record systems impede care coordination. Blockchain technology offers cryptographic integrity guarantees and decentralized access control as potential solutions.</p><h2>Literature Review</h2><p>Existing reviews focus narrowly on technical architecture or specific use cases. This review synthesizes evidence across security, interoperability, and privacy dimensions simultaneously, identifying cross-domain tensions.</p><h2>Methodology</h2><p>Systematic search of PubMed, IEEE Xplore, and ACM Digital Library. Inclusion criteria: peer-reviewed, quantitative outcomes reported, implementation in clinical or administrative healthcare setting. Quality assessment using GRADE framework.</p><h2>Results</h2><p>127 studies met inclusion criteria. Blockchain implementations reduced unauthorized access incidents by 71% (95% CI: 64–78%). Cross-institution data sharing improved by 45%. Patient privacy preserved in 94% of implementations using zero-knowledge proof protocols. Primary governance challenge: key management for elderly and cognitively impaired patients.</p><h2>Conclusion</h2><p>Blockchain demonstrates robust security and interoperability benefits in healthcare contexts. Governance frameworks for key management and regulatory alignment represent the primary barriers to broader adoption.</p>`,
    price:"0.05", category:"Medicine & Surgery", read_time:22, is_research:true, author_address:W1, status:"approved", featured:false, reads:76 },

  { title:"Quantifying the Environmental Cost of Proof-of-Work Cryptocurrency Mining: A Lifecycle Carbon Analysis",
    blurb:"Full lifecycle carbon analysis of Bitcoin mining operations across 23 countries finds average emission intensity of 487 gCO₂eq/kWh — 3.2× the global electricity grid average. Renewable energy adoption reduces footprint by 78% but faces regulatory and geographic constraints.",
    content:`<h2>Abstract</h2><p>We conduct full lifecycle carbon analysis of Bitcoin mining operations across 23 countries, integrating hardware manufacturing, facility construction, electricity consumption, and end-of-life electronics disposal.</p><h2>Introduction</h2><p>Proof-of-work consensus mechanisms require sustained computational competition that translates directly into energy consumption. Accurate environmental accounting has been complicated by geographic dispersion and hardware heterogeneity.</p><h2>Methodology</h2><p>Primary data collection from 847 mining facilities via energy disclosure requests and regulatory filings. Hardware lifecycle data from manufacturer specifications and iFixit teardown analyses. Carbon intensity data from IEA national grid emission factors. Monte Carlo simulation (n=10,000) to propagate uncertainty.</p><h2>Results</h2><p>Average emission intensity: 487 gCO₂eq/kWh (95% CI: 412–563). Annual Bitcoin network carbon footprint: 127 Mt CO₂eq — comparable to Argentina's national emissions. Renewable-powered facilities achieve 78% reduction (107 gCO₂eq/kWh) but represent only 23% of total hash rate.</p><h2>Implications</h2><p>Proof-of-stake consensus eliminates computational competition and reduces energy consumption by 99.95%. Regulatory disclosure requirements for mining operations would accelerate renewable transition and enable accurate environmental accounting.</p>`,
    price:"0.05", category:"Environmental Science & Policy", read_time:19, is_research:true, author_address:W1, status:"featured", featured:true, reads:112 },

  { title:"DeFi Protocol Adoption in Emerging Markets: Financial Inclusion Effects in Sub-Saharan Africa",
    blurb:"Using transaction data from 14 DeFi protocols and survey data from 3,200 respondents across Nigeria, Ghana, Kenya, and South Africa, we find DeFi adoption correlates with a 38% reduction in remittance costs and credit access for 67% of unbanked participants.",
    content:`<h2>Abstract</h2><p>We analyze DeFi protocol adoption across 3,200 respondents in Nigeria, Ghana, Kenya, and South Africa, measuring effects on financial inclusion, remittance costs, and credit access for populations historically excluded from formal banking.</p><h2>Introduction</h2><p>Sub-Saharan Africa has the world's lowest formal banking penetration (43%) but highest mobile money adoption (67%). DeFi protocols offer programmable financial services accessible via smartphone without bank account requirements.</p><h2>Data and Methodology</h2><p>Household survey (n=3,200) using stratified random sampling across urban and rural populations. Administrative data from 14 DeFi protocol APIs. Instrumental variable approach using mobile network tower density as instrument for DeFi access.</p><h2>Results</h2><p>DeFi adoption reduces average remittance cost from 8.7% to 5.4% of transfer value (38% reduction). 67% of unbanked participants accessed credit via DeFi collateralized lending within 12 months. Saving behavior improved: DeFi adopters show 23% higher 6-month savings rates.</p><h2>Conclusion</h2><p>DeFi protocols demonstrate measurable financial inclusion effects in Sub-Saharan Africa. Policy implications include regulatory sandboxes for DeFi stablecoin operations and mobile-first interface standards for low-literacy users.</p>`,
    price:"0.05", category:"Economics", read_time:21, is_research:true, author_address:W2, status:"approved", featured:false, reads:98 },

  { title:"Neuroplasticity and Second Language Acquisition in Adults: A Longitudinal fMRI Study",
    blurb:"Longitudinal fMRI study tracking 89 adults learning Mandarin Chinese over 24 months reveals significant gray matter density increases in Broca's area and the superior temporal gyrus, with plasticity response correlated with age of acquisition onset.",
    content:`<h2>Abstract</h2><p>We track neuroplastic changes in 89 adult Mandarin Chinese learners using longitudinal fMRI at 0, 6, 12, and 24 months, correlating structural and functional brain changes with language acquisition outcomes.</p><h2>Introduction</h2><p>The critical period hypothesis posits that language acquisition becomes progressively more difficult after early childhood due to reduced neural plasticity. Recent evidence challenges this hypothesis by demonstrating significant adult neuroplasticity in language-related cortical regions.</p><h2>Methodology</h2><p>Participants: 89 English-speaking adults (age 22–55, mean 34.2). No prior Mandarin exposure. Standardized HSK instruction for 10 hours/week. fMRI acquisition at 3T using BOLD contrast. Voxel-based morphometry for gray matter density. Functional connectivity analysis using seed regions in Broca's area (BA44/45) and superior temporal gyrus.</p><h2>Results</h2><p>Significant gray matter density increases in Broca's area (Cohen's d = 0.72) and superior temporal gyrus (Cohen's d = 0.61) at 24 months. Plasticity response inversely correlated with age (r = -0.34, p = 0.001) but remained significant across all age groups. Tonal processing showed unique activation in right hemisphere auditory cortex not observed in non-tonal language learners.</p><h2>Conclusion</h2><p>Adult neuroplasticity in language acquisition is robust and measurable. Age effects are real but do not preclude significant structural and functional brain changes in mature learners.</p>`,
    price:"0.045", category:"Neuroscience", read_time:17, is_research:true, author_address:W5, status:"approved", featured:false, reads:67 },

  { title:"CRISPR-Cas9 Off-Target Effects in Therapeutic Genome Editing: A Comprehensive Safety Analysis",
    blurb:"Analysis of 2,847 therapeutic CRISPR applications reveals off-target editing rates of 0.003% with current guide RNA optimization protocols — a 94% improvement over 2020 baseline — with remaining off-target events concentrated in non-coding genomic regions.",
    content:`<h2>Abstract</h2><p>Comprehensive safety analysis of 2,847 therapeutic CRISPR-Cas9 applications in clinical and preclinical settings, focusing on off-target editing rates, genomic distribution of off-target events, and downstream functional consequences.</p><h2>Background</h2><p>CRISPR-Cas9 therapeutic applications have expanded dramatically following FDA approval of sickle cell disease treatment in 2023. Safety evaluation — particularly off-target editing — is critical for broader therapeutic application.</p><h2>Methodology</h2><p>Meta-analysis of published and regulatory-submitted data from 2,847 CRISPR applications across 34 therapeutic indications. Off-target detection via GUIDE-seq and CIRCLE-seq orthogonal methodologies. Statistical integration using random-effects model.</p><h2>Results</h2><p>Mean off-target rate: 0.003% (95% CI: 0.001–0.006%) with current guide RNA optimization protocols — 94% improvement over 2020 baseline rate of 0.05%. 89% of off-target events occur in non-coding intergenic regions. Functional consequence analysis (RNA-seq, proteomics) identifies measurable downstream effects in 2.3% of off-target events.</p><h2>Conclusion</h2><p>Current CRISPR therapeutic safety profiles are substantially improved from early clinical applications. Remaining off-target events warrant continued monitoring but are concentrated in genomic regions with lower functional consequence probability.</p>`,
    price:"0.055", category:"Biology", read_time:23, is_research:true, author_address:W6, status:"approved", featured:false, reads:54 },

  { title:"Urban Heat Island Mitigation Through Green Infrastructure: A Global Meta-Analysis of 341 Cities",
    blurb:"Meta-analysis of 341 global cities finds green infrastructure reduces urban temperatures by 1.2–3.8°C at the neighborhood scale, with rooftop gardens demonstrating highest cost-effectiveness and tree canopy cover showing largest absolute cooling effect.",
    content:`<h2>Abstract</h2><p>Meta-analysis synthesizing evidence from 341 cities across 67 countries on the temperature-reduction effectiveness of urban green infrastructure interventions, including street trees, green roofs, living walls, and urban parks.</p><h2>Introduction</h2><p>Urban heat islands — localized temperature elevations in cities relative to surrounding rural areas — intensify heat-related health risks. Green infrastructure offers temperature mitigation through evapotranspiration, shading, and albedo modification.</p><h2>Methodology</h2><p>Systematic search of peer-reviewed literature and municipal implementation reports. Inclusion criteria: quantitative temperature measurement pre- and post-implementation, at minimum 12-month observation period. Random-effects meta-regression to assess moderating variables.</p><h2>Results</h2><p>Green infrastructure reduces urban temperatures by 1.2–3.8°C at neighborhood scale. Tree canopy coverage shows largest absolute effect (mean 2.7°C reduction per 10% coverage increase). Rooftop gardens demonstrate highest cost-effectiveness ($340 per degree-day reduction). Combined interventions produce synergistic effects 23% larger than sum of individual components.</p><h2>Conclusion</h2><p>Green infrastructure is an effective urban heat island mitigation strategy. Optimal implementation requires combination approaches tailored to existing urban morphology and climate context.</p>`,
    price:"0.04", category:"Environmental Science & Policy", read_time:16, is_research:true, author_address:W5, status:"approved", featured:false, reads:83 },

  { title:"Machine Learning Approaches to Antimicrobial Resistance Prediction: Integrating Genomic and Clinical Data",
    blurb:"We develop and validate a gradient boosting model predicting antimicrobial resistance with 94.7% accuracy by integrating whole-genome sequencing with clinical metadata across 18,000 bacterial isolates from 12 hospitals.",
    content:`<h2>Abstract</h2><p>We develop a gradient boosting ensemble model for predicting antimicrobial resistance (AMR) phenotypes from whole-genome sequencing data integrated with clinical metadata, validated across 18,000 bacterial isolates from 12 hospital networks.</p><h2>Introduction</h2><p>Antimicrobial resistance is projected to cause 10 million annual deaths by 2050. Rapid, accurate AMR prediction can guide empirical therapy selection during the 24–72 hour culture turnaround period when patients require immediate treatment decisions.</p><h2>Methods</h2><p>Training dataset: 18,000 bacterial isolates (Staphylococcus aureus, E. coli, Klebsiella pneumoniae, Pseudomonas aeruginosa). Features: SNP profiles from WGS, mobile genetic elements, plasmid presence, patient demographics, prior antibiotic exposure. XGBoost model with SHAP value interpretation. Validation: 3-fold cross-validation plus external validation cohort.</p><h2>Results</h2><p>Overall AMR prediction accuracy: 94.7% (95% CI: 93.8–95.5%). AUROC: 0.97. Performance superior to rule-based resistance prediction in 11 of 12 antibiotic classes tested. SHAP analysis identifies mobile genetic elements as primary drivers of resistance prediction uncertainty.</p><h2>Conclusion</h2><p>ML-integrated AMR prediction achieves clinically actionable accuracy and can meaningfully accelerate appropriate antibiotic therapy selection, potentially reducing empirical broad-spectrum antibiotic use and slowing resistance development.</p>`,
    price:"0.05", category:"Medicine & Surgery", read_time:20, is_research:true, author_address:W6, status:"approved", featured:false, reads:91 },
];

// ── Groups ───────────────────────────────────────────────────────────────────
function mkGroup(id: string, name: string, desc: string, type: string, cat: string, owner: string, members: string[], rules: string, tags: string[], posts: number) {
  return { name, description: desc, type, category: cat, owner_address: owner, member_addresses: members, member_count: members.length, post_count: posts, rules, tags };
}

const GROUPS = [
  mkGroup("g1","ML Research Lab","Collaborative space for machine learning researchers to share papers, datasets, and methodologies. Focus on applied ML in healthcare, education, and social impact.","public","Technology",W3,[W1,W2,W3,W4,W5],"1. Cite sources\n2. Constructive peer review only\n3. Share code when possible\n4. No promotional content",["machine-learning","deep-learning","AI","research"],12),
  mkGroup("g2","Global Health & Epidemiology Network","Research network for public health researchers, epidemiologists, and medical professionals working on infectious disease, health policy, and global health equity.","public","Medicine",W6,[W1,W2,W3,W6],"1. Evidence-based discussion only\n2. Respect patient privacy\n3. Preprints must be labelled\n4. No medical advice to individuals",["epidemiology","public-health","medicine","global-health"],8),
  mkGroup("g3","DeFi Economics Research Group","Private research collaboration studying decentralized finance economics, token mechanism design, and blockchain market microstructure. Invitation only.","private","Business",W2,[W1,W2,W4],"1. NDA applies to unpublished research\n2. Data sharing requires consent\n3. Weekly check-ins required",["defi","economics","blockchain","mechanism-design"],6),
  mkGroup("g4","Environmental Science Collective","Open collaborative space for environmental researchers, climate scientists, and policy advocates. Share research, data, and policy analysis on climate change and sustainability.","public","Environment",W5,[W2,W3,W4,W5,W6],"1. Data must be reproducible\n2. Include uncertainty estimates\n3. Policy advocacy must be labelled as such",["climate","environment","sustainability","ecology"],15),
  mkGroup("g5","Computational Neuroscience Hub","Interdisciplinary space bridging neuroscience and computer science. Topics include neural decoding, brain-computer interfaces, computational models of cognition, and AI-brain analogies.","public","Science",W5,[W1,W3,W5,W6],"1. Interdisciplinary perspectives welcomed\n2. Methods must be reproducible\n3. Speculative ideas welcome but must be flagged",["neuroscience","computational","brain-computer","cognition"],7),
  mkGroup("g6","Blockchain & Law Policy Forum","Research and policy discussion on the intersection of blockchain technology, regulatory frameworks, and legal innovation. Open to legal scholars, technologists, and policymakers.","public","Law",W1,[W1,W2,W3,W4,W5,W6],"1. Legal analysis not legal advice\n2. Jurisdiction must be specified\n3. Policy positions must be supported by evidence",["blockchain","law","regulation","policy"],19),
  mkGroup("g7","Genomics & Precision Medicine Collaboration","Private research collaboration for genomics researchers, clinicians, and bioinformaticians working on precision medicine applications. Focus on clinical translation and ethical considerations.","private","Medicine",W6,[W5,W6],"1. Patient data must be anonymized\n2. Ethics approval documentation required\n3. GDPR compliance mandatory",["genomics","precision-medicine","CRISPR","bioinformatics"],4),
  mkGroup("g8","Urban Planning & Smart Cities","Interdisciplinary forum for urban planners, architects, data scientists, and policy makers studying sustainable urban development, smart city technologies, and urban equity.","public","Engineering",W4,[W2,W4,W5],"1. Equity lens required in analysis\n2. Local context must be acknowledged\n3. Implementation feasibility should be considered",["urban-planning","smart-cities","sustainability","architecture"],9),
];

// ── Group Posts ───────────────────────────────────────────────────────────────
// Built after group IDs are known
function groupPostsFor(groupIds: string[]) {
  const [g1,g2,g3,g4,g5,g6,g7,g8] = groupIds;
  return [
    // ML Lab
    {group_id:g1,author_address:W3,content:"Welcome to the ML Research Lab! 🎉 This space is for sharing cutting-edge ML research, discussing methodologies, and collaborating on papers. Please introduce yourself and your research focus.",type:"announcement",likes:8},
    {group_id:g1,author_address:W1,content:"Just published a new paper on adaptive learning systems — AI-driven personalization showing 34% improvement in concept retention across 12,000 students. Link in the articles section. Would love feedback on the methodology section, particularly the instrumental variable approach.",type:"discussion",likes:5},
    {group_id:g1,author_address:W4,content:"Quick question for the group: what's everyone's take on the reproducibility crisis in ML? We've been trying to replicate 3 landmark papers for our meta-analysis and getting significantly different results. Is this a methodology documentation problem or something deeper?",type:"discussion",likes:12},
    {group_id:g1,author_address:W5,content:"For anyone working on federated learning: we've open-sourced our privacy-preserving gradient aggregation implementation. Works well with non-IID healthcare data. The code handles differential privacy budget tracking automatically. DM me for the repo link.",type:"discussion",likes:7},
    {group_id:g1,author_address:W2,content:"Reading recommendation: 'Foundation Models as a Service' in this week's NeurIPS proceedings. Changes the economic calculation for smaller research groups significantly. The per-inference cost curve has dropped 87% in 18 months.",type:"discussion",likes:4},

    // Global Health
    {group_id:g2,author_address:W6,content:"Research network is open. Priority topics for 2026: AMR surveillance systems, pandemic preparedness policy, and health equity metrics. Excited to have researchers from 8 countries in this space already.",type:"announcement",likes:6},
    {group_id:g2,author_address:W1,content:"New WHO data: global antimicrobial resistance now causing 1.3M attributable deaths annually. Our ML-based AMR prediction paper (linked above) addresses early detection — but we need better surveillance infrastructure. Who's working on this? Would love to connect.",type:"discussion",likes:9},
    {group_id:g2,author_address:W3,content:"The WHO's new pandemic preparedness framework has significant gaps in funding mechanisms for low-income country surveillance. Has anyone written on this? I'm working on a policy brief and looking for co-authors with health economics background.",type:"discussion",likes:5},
    {group_id:g2,author_address:W2,content:"Reminder: The Lancet is running a special issue on digital health in LMICs. Deadline: August 15. Our data from the DeFi financial inclusion study has some interesting intersections with mobile health payment mechanisms worth writing up.",type:"announcement",likes:3},

    // DeFi Group (private)
    {group_id:g3,author_address:W2,content:"Q2 2026 update: Our analysis of mechanism design in AMM liquidity pools shows that concentrated liquidity provision (Uniswap v3 style) increases LP capital efficiency by 2847% but concentrates 89% of fee income in active LPs. Full draft circulating for comments.",type:"announcement",likes:2},
    {group_id:g3,author_address:W1,content:"The RWA tokenization data is ready. 847 platforms, 2.3M transactions. Initial findings: creator revenue share is 78% vs 47% on traditional platforms. This is publishable. Who wants to be on this paper?",type:"discussion",likes:3},
    {group_id:g3,author_address:W4,content:"Ran the regression on stablecoin adoption and formal banking exclusion. Statistically significant negative correlation in 19 of 23 countries. But the causal identification is tricky — mobile infrastructure is confounding. Working on IV approach using tower density.",type:"discussion",likes:2},

    // Environmental Science
    {group_id:g4,author_address:W5,content:"Welcome everyone! This space is for rigorous environmental research and evidence-based climate policy discussion. Please share your research interests and any ongoing projects you'd welcome collaborators on.",type:"announcement",likes:10},
    {group_id:g4,author_address:W3,content:"The urban heat island meta-analysis is published. 341 cities, 67 countries. Tree canopy shows 2.7°C reduction per 10% coverage increase. Rooftop gardens most cost-effective at $340/degree-day. Open access — full paper linked.",type:"discussion",likes:14},
    {group_id:g4,author_address:W6,content:"Deep concern about the new IPCC methodology for forest carbon accounting. The permanence discount rate assumptions haven't been updated since 2014. Given accelerating wildfire rates, we're systematically overestimating carbon sequestration in boreal forests. Who else has been tracking this?",type:"discussion",likes:8},
    {group_id:g4,author_address:W2,content:"Ocean acidification data update: Pacific Ocean pH has dropped to 7.98 in monitoring stations above 45°N — 0.3 units below pre-industrial baseline. This exceeds the threshold for pteropod shell dissolution in 34% of sampled locations. Alarming but consistent with modeling predictions.",type:"discussion",likes:11},

    // Neuro Hub
    {group_id:g5,author_address:W5,content:"New fMRI paper published: adult neuroplasticity in L2 acquisition showing measurable gray matter changes in Broca's area after 24 months of Mandarin instruction. Adult language learning is more neurologically tractable than the critical period hypothesis suggested. Full paper linked in articles.",type:"discussion",likes:9},
    {group_id:g5,author_address:W1,content:"Has anyone implemented neural decoding on open-source MEG data? I'm trying to replicate the Huth et al. semantic mapping approach with fMRI but running into preprocessing pipeline issues. Specifically, the MNI normalization is introducing systematic artifacts at the occipital-temporal boundary.",type:"discussion",likes:6},
    {group_id:g5,author_address:W3,content:"Interesting parallel between transformer attention mechanisms and cortical attention networks. Not claiming causal similarity — just structural analogy. Working on a paper examining whether attentional bottleneck theory generates testable predictions for transformer failure modes. Early thoughts?",type:"discussion",likes:7},

    // Blockchain & Law
    {group_id:g6,author_address:W1,content:"This forum is for rigorous legal-technical analysis of blockchain regulation. Please cite jurisdiction. No investment advice. Speculation labeled as such. Excited to have legal scholars from 6 jurisdictions and technologists collaborating here.",type:"announcement",likes:5},
    {group_id:g6,author_address:W2,content:"The EU's MiCA framework has a significant gap: it doesn't address DeFi protocols where there is no identifiable 'issuer' or 'offeror.' Article 4 requirements become paradoxical when applied to immutable smart contracts. Anyone writing on this? I have a draft ELJ submission.",type:"discussion",likes:13},
    {group_id:g6,author_address:W4,content:"Question for the US practitioners: How is the SEC defining 'sufficient decentralization' in the post-Hinman landscape? The 2025 Digital Asset Clarity Act definition seems to create a bootstrap problem — you need the token to be already decentralized to qualify for the exemption.",type:"discussion",likes:9},
    {group_id:g6,author_address:W5,content:"Nigerian crypto regulation update: CBN has clarified that USDC on Arc qualifies as a 'digital payment instrument' under the 2024 Payments Act, not a 'crypto-asset' under the 2025 VASP Act. Different licensing requirements. This distinction matters for Readlearc's payment infrastructure.",type:"discussion",likes:7},
    {group_id:g6,author_address:W3,content:"Working paper: 'Smart Contract Enforceability Across Common Law Jurisdictions.' Key finding: courts in England, Australia, Singapore, and Nigeria have uniformly held that self-executing code terms are enforceable as contract where offer, acceptance, and consideration are established at execution. Circulating for comments.",type:"discussion",likes:6},

    // Genomics (private)
    {group_id:g7,author_address:W6,content:"CRISPR off-target analysis is complete. 2,847 applications across 34 indications. Off-target rate now 0.003% — 94% improvement from 2020. Submitting to Nature Medicine next week. Co-author list: confirm order in this thread.",type:"announcement",likes:1},
    {group_id:g7,author_address:W5,content:"The precision medicine cohort data is cleaned. 18,000 WGS samples. Ready for the XGBoost training run. ETA on compute: 4 days on the AWS cluster. Should have AMR prediction results by Friday.",type:"discussion",likes:2},

    // Urban Planning
    {group_id:g8,author_address:W4,content:"Opening this space for rigorous urban research and design discussion. I'm particularly interested in how computational methods are changing planning practice — from agent-based traffic models to ML-based zoning outcome prediction.",type:"announcement",likes:4},
    {group_id:g8,author_address:W2,content:"Following up on the urban heat island meta-analysis: the 2.7°C cooling per 10% tree canopy finding has huge implications for planning ordinances. Most cities have 15–20% canopy goals. Modeling suggests 30% would achieve meaningful heat-health outcome improvements.",type:"discussion",likes:6},
    {group_id:g8,author_address:W5,content:"Smart city data governance frameworks are consistently failing on equity grounds. When cities optimize traffic signals for throughput, they consistently improve commute times for car-dependent outer suburbs while degrading pedestrian and transit conditions in dense urban cores. Anyone have counter-examples?",type:"discussion",likes:8},
  ];
}

// ── GET: counts for seed page ─────────────────────────────────────────────────
export async function GET() {
  const tables = ["articles","groups","group_posts","comments","reactions","read_receipts","follows","profiles"];
  const counts: Record<string,number> = {};
  for (const t of tables) {
    try {
      const { count } = await sb.from(t).select("*",{count:"exact",head:true});
      counts[t] = count ?? 0;
    } catch { counts[t] = 0; }
  }
  return NextResponse.json({ counts });
}

// ── POST: seed ────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { tables = "all", reset = false } = await req.json().catch(() => ({}));
  const results: Record<string,any> = {};

  const seedAll = tables === "all";
  const want = (t: string) => seedAll || (Array.isArray(tables) && tables.includes(t));

  // ── Articles ──────────────────────────────────────────────────────────────
  if (want("articles")) {
    if (reset) {
      await sb.from("read_receipts").delete().neq("id", 0);
      await sb.from("comments").delete().neq("id", 0);
      await sb.from("reactions").delete().neq("id", 0);
      await sb.from("articles").delete().neq("id", 0);
    }
    const { data: arts, error } = await sb.from("articles").insert(ARTICLES).select("id,title,status");
    if (error) { results.articles = { error: error.message }; }
    else {
      results.articles = { inserted: arts?.length };
      const ids = (arts || []).map((a:any) => a.id);
      const [id1,id2,id3,id4,id5,id6,id7,id8,id9,id10,id11,id12,id13,id14] = ids;

      // receipts
      const receipts = [
        { article_id:id1, reader_address:W2, tx_hash:`0x${"a".repeat(64)}`, amount_paid:0.02 },
        { article_id:id1, reader_address:W3, tx_hash:`0x${"b".repeat(64)}`, amount_paid:0.02 },
        { article_id:id1, reader_address:W4, tx_hash:`0x${"c".repeat(64)}`, amount_paid:0.02 },
        { article_id:id3, reader_address:W1, tx_hash:`0x${"d".repeat(64)}`, amount_paid:0.025 },
        { article_id:id5, reader_address:W4, tx_hash:`0x${"e".repeat(64)}`, amount_paid:0.022 },
        { article_id:id8, reader_address:W1, tx_hash:`0x${"f".repeat(64)}`, amount_paid:0.05 },
        { article_id:id9, reader_address:W4, tx_hash:`0x${"1".repeat(64)}`, amount_paid:0.05 },
        { article_id:id10,reader_address:W2, tx_hash:`0x${"2".repeat(64)}`, amount_paid:0.05 },
      ].filter(r => r.article_id);
      if (receipts.length) { const { error:e } = await sb.from("read_receipts").insert(receipts); if(e) results.receipts={error:e.message}; else results.receipts={inserted:receipts.length}; }

      // comments
      const comments = [
        { article_id:id1, author_address:W2, author_name:"DeFiResearcher", content:"Best 2026 market analysis I've read. The BTC/ETH divergence section is spot on — most analysts are still treating them as correlated assets." },
        { article_id:id1, author_address:W3, author_name:"AIBuilder",      content:"The AI agent economy point is underappreciated. We're seeing autonomous agents make thousands of USDC micropayments per day on Arc already. This is real." },
        { article_id:id3, author_address:W1, author_name:"Anointing",      content:"The USDC-as-agent-currency thesis is exactly right. This is the architectural assumption underlying Readlearc's payment model — automated reading agents purchasing content autonomously." },
        { article_id:id8, author_address:W4, author_name:"EducationResearcher", content:"The 34% retention improvement is striking. Our school district pilot showed similar numbers. The critical variable seems to be adaptive pacing, not content personalization per se." },
        { article_id:id9, author_address:W1, author_name:"Anointing",      content:"The 78% vs 47% creator revenue finding validates the core Readlearc thesis. Platform rent extraction is structural — you need cryptographic enforcement to eliminate it, not better contracts." },
        { article_id:id11,author_address:W5, author_name:"NeurosciResearcher","content":"Confirming the superior temporal gyrus finding from independent data. The right hemisphere tonal processing lateralization is novel — not predicted by standard language processing models." },
      ].filter(c => c.article_id);
      if (comments.length) { const { error:e } = await sb.from("comments").insert(comments); if(e) results.comments={error:e.message}; else results.comments={inserted:comments.length}; }

      // reactions
      const reactions = [
        { article_id:id1, address:W2, reaction_key:"gem"   },
        { article_id:id1, address:W3, reaction_key:"flame" },
        { article_id:id1, address:W4, reaction_key:"zap"   },
        { article_id:id3, address:W1, reaction_key:"flame" },
        { article_id:id3, address:W4, reaction_key:"gem"   },
        { article_id:id8, address:W2, reaction_key:"gem"   },
        { article_id:id8, address:W5, reaction_key:"zap"   },
        { article_id:id9, address:W1, reaction_key:"gem"   },
        { article_id:id12,address:W3, reaction_key:"gem"   },
        { article_id:id14,address:W6, reaction_key:"flame" },
      ].filter(r => r.article_id);
      if (reactions.length) { const { error:e } = await sb.from("reactions").insert(reactions); if(e) results.reactions={error:e.message}; else results.reactions={inserted:reactions.length}; }
    }
  }

  // ── Groups ────────────────────────────────────────────────────────────────
  if (want("groups")) {
    if (reset) {
      await sb.from("group_posts").delete().neq("id",0);
      await sb.from("groups").delete().neq("id",0);
    }
    const { data: grps, error } = await sb.from("groups").insert(GROUPS).select("id");
    if (error) { results.groups = { error: error.message }; }
    else {
      results.groups = { inserted: grps?.length };
      const gids = (grps||[]).map((g:any)=>String(g.id));
      const posts = groupPostsFor(gids);
      const { data: gp, error:pe } = await sb.from("group_posts").insert(posts).select("id");
      results.group_posts = pe ? { error: pe.message } : { inserted: gp?.length };
    }
  }

  // ── Follows ───────────────────────────────────────────────────────────────
  if (want("follows")) {
    if (reset) await sb.from("follows").delete().neq("id",0);
    const follows = [
      { follower_address:W2, following_address:W1 },
      { follower_address:W3, following_address:W1 },
      { follower_address:W4, following_address:W1 },
      { follower_address:W5, following_address:W1 },
      { follower_address:W1, following_address:W3 },
      { follower_address:W1, following_address:W6 },
      { follower_address:W4, following_address:W3 },
      { follower_address:W6, following_address:W5 },
    ];
    const { error } = await sb.from("follows").insert(follows);
    results.follows = error ? { error: error.message } : { inserted: follows.length };
  }

  return NextResponse.json({ ok: true, results });
}
