import { ethers } from "ethers";

export const READLEARC_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";
export const USDC_ADDRESS      = process.env.NEXT_PUBLIC_USDC_ADDRESS || "";
export const ARC_EXPLORER      = process.env.NEXT_PUBLIC_EXPLORER_URL || "https://explorer.arc.io/testnet";
export const ARC_RPC           = process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.arc.io/testnet";

// ── ABIs ──────────────────────────────────────────────────────────
export const READLEARC_ABI = [
  "function publishArticle(string _title, string _blurb, string _content, uint256 _price, string _category, uint256 _readTime) external returns (uint256)",
  "function payToRead(uint256 _articleId, address _referrer) external",
  "function getArticleMetadata(uint256 _articleId) external view returns (uint256 id, address author, string title, string blurb, uint256 price, string category, uint256 readTime, uint256 timestamp, uint256 reads)",
  "function getFullArticle(uint256 _articleId) external view returns (tuple(uint256 id, address author, string title, string blurb, string content, uint256 price, string category, uint256 readTime, uint256 timestamp, uint256 reads))",
  "function hasReadReceipt(address _user, uint256 _articleId) external view returns (bool)",
  "function articleCount() external view returns (uint256)",
  "function verifiedWriters(address) external view returns (bool)",
  "event ArticlePublished(uint256 indexed id, address indexed author, string title)",
  "event ArticleRead(uint256 indexed id, address indexed reader, address indexed referrer, uint256 price)",
];

export const USDC_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function symbol() external view returns (string)",
];

// ── Read-only provider ────────────────────────────────────────────
export function getReadProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(ARC_RPC);
}

// ── Signer provider (requires MetaMask) ──────────────────────────
export async function getProvider(): Promise<ethers.BrowserProvider> {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    throw new Error("No crypto wallet found. Please install MetaMask.");
  }
  await (window as any).ethereum.request({ method: "eth_requestAccounts" });
  return new ethers.BrowserProvider((window as any).ethereum);
}

// ── Normalise an article metadata tuple ──────────────────────────
function normaliseMeta(meta: any) {
  return {
    id:          meta.id.toString(),
    title:       meta.title,
    blurb:       meta.blurb,
    price:       ethers.formatUnits(meta.price, 6),
    priceRaw:    meta.price.toString(),
    category:    meta.category,
    readTime:    meta.readTime.toString(),
    timestamp:   meta.timestamp.toString(),
    reads:       meta.reads.toString(),
    authorAddress: meta.author,
    author: {
      address: meta.author,
      handle:  meta.author.slice(0, 6) + "…" + meta.author.slice(-4),
    },
  };
}

// ── Fetch all articles (newest-first, up to limit) ───────────────
export async function fetchAllArticles(limit = 20): Promise<any[]> {
  if (!READLEARC_ADDRESS) return [];
  try {
    const prov = getReadProvider();
    const c    = new ethers.Contract(READLEARC_ADDRESS, READLEARC_ABI, prov);
    const count = Number(await c.articleCount());
    const results: any[] = [];
    for (let i = count; i >= Math.max(1, count - limit + 1); i--) {
      try { results.push(normaliseMeta(await c.getArticleMetadata(i))); } catch {}
    }
    return results;
  } catch (err) {
    console.error("fetchAllArticles:", err);
    return [];
  }
}

// ── Fetch articles published by one address ───────────────────────
export async function fetchArticlesByAuthor(
  authorAddress: string,
  provider: ethers.Provider
): Promise<any[]> {
  if (!READLEARC_ADDRESS) return [];
  try {
    const c = new ethers.Contract(READLEARC_ADDRESS, READLEARC_ABI, provider);
    // Use ArticlePublished(id indexed, author indexed, title) filter
    const filter = c.filters.ArticlePublished(null, authorAddress);
    const events = await c.queryFilter(filter, -100000);
    const metas: any[] = [];
    for (const ev of [...events].reverse()) {
      try {
        const e = ev as any;
        metas.push(normaliseMeta(await c.getArticleMetadata(e.args.id)));
      } catch {}
    }
    return metas;
  } catch (err) {
    console.error("fetchArticlesByAuthor:", err);
    return [];
  }
}

// ── Fetch reading history for a reader address ────────────────────
export async function fetchReadingHistory(
  readerAddress: string,
  provider: ethers.Provider
): Promise<any[]> {
  if (!READLEARC_ADDRESS) return [];
  try {
    const c = new ethers.Contract(READLEARC_ADDRESS, READLEARC_ABI, provider);
    const filter = c.filters.ArticleRead(null, readerAddress);
    const events = await c.queryFilter(filter, -100000);
    const history: any[] = [];
    for (const ev of [...events].reverse()) {
      try {
        const e    = ev as any;
        const meta = normaliseMeta(await c.getArticleMetadata(e.args.id));
        history.push({
          ...meta,
          pricePaid: ethers.formatUnits(e.args.price, 6),
          txHash:    e.transactionHash,
          blockNumber: e.blockNumber,
        });
      } catch {}
    }
    return history;
  } catch (err) {
    console.error("fetchReadingHistory:", err);
    return [];
  }
}

// ── Fetch all ArticleRead events where this author earned ─────────
export async function fetchWriterEarnings(
  authorAddress: string,
  provider: ethers.Provider
): Promise<{ events: any[]; totalEarned: number; weekEarned: number }> {
  if (!READLEARC_ADDRESS) return { events: [], totalEarned: 0, weekEarned: 0 };
  try {
    const c = new ethers.Contract(READLEARC_ADDRESS, READLEARC_ABI, provider);

    // 1. All articles by this author
    const pubFilter = c.filters.ArticlePublished(null, authorAddress);
    const pubEvents = await c.queryFilter(pubFilter, -100000);
    if (pubEvents.length === 0) return { events: [], totalEarned: 0, weekEarned: 0 };

    const articleIds = pubEvents.map((e: any) => e.args.id.toString());

    // 2. All reads of those articles
    const earningsEvents: any[] = [];
    for (const id of articleIds) {
      try {
        const readFilter = c.filters.ArticleRead(id);
        const readEvs    = await c.queryFilter(readFilter, -100000);
        for (const ev of readEvs) {
          const e   = ev as any;
          const raw = parseFloat(ethers.formatUnits(e.args.price, 6));
          // Writer earns 85% (or 90% if verified — use 85% as default)
          earningsEvents.push({
            articleId:  id.toString(),
            reader:     e.args.reader,
            gross:      raw,
            earned:     parseFloat((raw * 0.85).toFixed(6)),
            txHash:     e.transactionHash,
            blockNumber: e.blockNumber,
            timestamp:  null, // filled below if needed
          });
        }
      } catch {}
    }

    const now7dAgo = Date.now() / 1000 - 7 * 86400;
    let totalEarned = 0;
    let weekEarned  = 0;
    for (const ev of earningsEvents) {
      totalEarned += ev.earned;
      // Approximate: use block number to guess recency; without timestamps we use all for week
      weekEarned  += ev.earned; // refined in page once block timestamps fetched
    }

    return { events: earningsEvents, totalEarned, weekEarned };
  } catch (err) {
    console.error("fetchWriterEarnings:", err);
    return { events: [], totalEarned: 0, weekEarned: 0 };
  }
}

// ── Fetch all tx events for wallet page (reads + earnings) ───────
export async function fetchWalletHistory(
  address: string,
  provider: ethers.Provider
): Promise<any[]> {
  if (!READLEARC_ADDRESS) return [];
  try {
    const c = new ethers.Contract(READLEARC_ADDRESS, READLEARC_ABI, provider);

    // Outgoing: articles this user paid to read
    const readFilter  = c.filters.ArticleRead(null, address);
    const readEvents  = await c.queryFilter(readFilter, -100000);

    // Incoming: reads of articles this user authored
    const pubFilter   = c.filters.ArticlePublished(null, address);
    const pubEvents   = await c.queryFilter(pubFilter, -100000);
    const ownIds      = pubEvents.map((e: any) => BigInt(e.args.id.toString()));

    const earnEvents: any[] = [];
    for (const id of ownIds) {
      try {
        const f = c.filters.ArticleRead(id);
        const evs = await c.queryFilter(f, -100000);
        earnEvents.push(...evs);
      } catch {}
    }

    const txMap = new Map<string, any>();

    for (const ev of readEvents) {
      const e   = ev as any;
      const amt = parseFloat(ethers.formatUnits(e.args.price, 6));
      txMap.set(e.transactionHash, {
        type:     "read",
        label:    `Read Article #${e.args.id}`,
        amount:   -amt,
        hash:     e.transactionHash,
        block:    e.blockNumber,
      });
    }

    for (const ev of earnEvents) {
      const e   = ev as any;
      const amt = parseFloat(ethers.formatUnits(e.args.price, 6)) * 0.85;
      // Only add as earning if not already a "read" tx from this address
      if (!txMap.has(e.transactionHash)) {
        txMap.set(e.transactionHash, {
          type:   "earn",
          label:  `Earned from Article #${e.args.id}`,
          amount: +parseFloat(amt.toFixed(6)),
          hash:   e.transactionHash,
          block:  e.blockNumber,
        });
      }
    }

    return [...txMap.values()].sort((a, b) => b.block - a.block);
  } catch (err) {
    console.error("fetchWalletHistory:", err);
    return [];
  }
}
