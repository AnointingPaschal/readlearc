import { ethers } from "ethers";

// ─── Configuration ────────────────────────────────────────────────
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";
export const USDC_ADDRESS     = process.env.NEXT_PUBLIC_USDC_ADDRESS     || "";
export const RPC_URL          = process.env.NEXT_PUBLIC_RPC_URL          || "https://rpc.arc.io/testnet";
export const EXPLORER_URL     = process.env.NEXT_PUBLIC_EXPLORER_URL     || "https://explorer.arc.io/testnet";
export const IS_CONFIGURED    = !!(CONTRACT_ADDRESS && USDC_ADDRESS);

// ─── ABIs ─────────────────────────────────────────────────────────
export const CONTRACT_ABI = [
  "function publishArticle(string _title, string _blurb, string _content, uint256 _price, string _category, uint256 _readTime, bool _isResearch) external returns (uint256)",
  "function payToRead(uint256 _articleId, address _referrer) external",
  "function getArticleMetadata(uint256 _id) external view returns (uint256 id, address author, string title, string blurb, uint256 price, string category, uint256 readTime, uint256 timestamp, uint256 reads, bool isResearch)",
  "function getFullArticle(uint256 _id) external view returns (tuple(uint256 id, address author, string title, string blurb, string content, uint256 price, string category, uint256 readTime, uint256 timestamp, uint256 reads, bool isResearch))",
  "function hasReadReceipt(address _user, uint256 _id) external view returns (bool)",
  "function articleCount() external view returns (uint256)",
  "function owner() external view returns (address)",
  "function platformTreasury() external view returns (address)",
  "function verifiedWriters(address) external view returns (bool)",
  "function defaultWriterBps() external view returns (uint256)",
  "function defaultPlatformBps() external view returns (uint256)",
  "function defaultReferrerBps() external view returns (uint256)",
  "function verifiedWriterBps() external view returns (uint256)",
  "function verifiedPlatformBps() external view returns (uint256)",
  "function verifiedReferrerBps() external view returns (uint256)",
  "function previewSplit(uint256 _price, bool _isVerified) external view returns (uint256 writerShare, uint256 platformShare, uint256 referrerShare)",
  "function setVerifiedWriter(address _writer, bool _status) external",
  "function updateDefaultSplits(uint256 _writerBps, uint256 _platformBps, uint256 _referrerBps) external",
  "function updateVerifiedSplits(uint256 _writerBps, uint256 _platformBps, uint256 _referrerBps) external",
  "function updateTreasury(address _newTreasury) external",
  "function transferOwnership(address _newOwner) external",
  "event ArticlePublished(uint256 indexed id, address indexed author, string title, uint256 price)",
  "event ArticleRead(uint256 indexed id, address indexed reader, address indexed referrer, uint256 price)",
  "event WriterVerified(address indexed writer, bool status)",
  "event SplitsUpdated(bool isVerified, uint256 writerBps, uint256 platformBps, uint256 referrerBps)",
  "event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury)",
  "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)",
];

export const USDC_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function transfer(address to, uint256 amount) external returns (bool)",
];

// ─── Providers ────────────────────────────────────────────────────
export function readProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(RPC_URL);
}

export function readContract(provider?: ethers.Provider): ethers.Contract {
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider || readProvider());
}

export function usdcContract(signerOrProvider: ethers.Signer | ethers.Provider): ethers.Contract {
  return new ethers.Contract(USDC_ADDRESS, USDC_ABI, signerOrProvider);
}

// ─── Article helpers ──────────────────────────────────────────────
export type Article = {
  id: string;
  title: string;
  blurb: string;
  content?: string;
  price: string;          // formatted USDC e.g. "0.02"
  priceRaw: bigint;
  category: string;
  readTime: number;
  timestamp: number;
  reads: number;
  authorAddress: string;
  authorShort: string;
};

function parseMeta(m: any): Article {
  return {
    id:            m.id.toString(),
    title:         m.title,
    blurb:         m.blurb,
    content:       m.content,
    price:         ethers.formatUnits(m.price, 6),
    priceRaw:      m.price,
    category:      m.category,
    readTime:      Number(m.readTime),
    timestamp:     Number(m.timestamp),
    reads:         Number(m.reads),
    authorAddress: m.author,
    authorShort:   m.author.slice(0,6) + "…" + m.author.slice(-4),
  };
}

// Fetch latest N articles (newest first)
export async function fetchArticles(limit = 20): Promise<Article[]> {
  if (!CONTRACT_ADDRESS) return [];
  try {
    const c     = readContract();
    const count = Number(await c.articleCount());
    if (count === 0) return [];
    const results: Article[] = [];
    for (let i = count; i >= Math.max(1, count - limit + 1); i--) {
      try {
        const m = await c.getArticleMetadata(i);
        if (m.id.toString() !== "0") results.push(parseMeta(m));
      } catch {}
    }
    return results;
  } catch (e) { console.error("fetchArticles:", e); return []; }
}

// Fetch single article metadata
export async function fetchArticle(id: string, provider?: ethers.Provider): Promise<Article | null> {
  if (!CONTRACT_ADDRESS) return null;
  try {
    const c = readContract(provider);
    const m = await c.getArticleMetadata(id);
    if (m.id.toString() === "0") return null;
    return parseMeta(m);
  } catch { return null; }
}

// Fetch full article content (gated by read receipt on-chain)
export async function fetchFullArticle(id: string, provider?: ethers.Provider): Promise<Article | null> {
  if (!CONTRACT_ADDRESS) return null;
  try {
    const c = readContract(provider);
    const m = await c.getFullArticle(id);
    if (m.id.toString() === "0") return null;
    return parseMeta(m);
  } catch { return null; }
}

// Check if user has paid for article
export async function checkReadReceipt(userAddress: string, articleId: string, provider?: ethers.Provider): Promise<boolean> {
  if (!CONTRACT_ADDRESS || !userAddress) return false;
  try {
    const c = readContract(provider);
    return await c.hasReadReceipt(userAddress, articleId);
  } catch { return false; }
}

// Fetch all articles by an author address
export async function fetchArticlesByAuthor(authorAddress: string, provider?: ethers.Provider): Promise<Article[]> {
  if (!CONTRACT_ADDRESS) return [];
  try {
    const prov = provider || readProvider();
    const c    = readContract(prov);
    const filter = c.filters.ArticlePublished(null, authorAddress);
    const events = await c.queryFilter(filter, -100000);
    const results: Article[] = [];
    for (const ev of [...events].reverse()) {
      try {
        const e = ev as any;
        const m = await c.getArticleMetadata(e.args.id);
        results.push(parseMeta(m));
      } catch {}
    }
    return results;
  } catch { return []; }
}

// Fetch reading history for a reader
export async function fetchReadingHistory(readerAddress: string, provider?: ethers.Provider): Promise<(Article & { pricePaid: string; txHash: string; blockNumber: number })[]> {
  if (!CONTRACT_ADDRESS) return [];
  try {
    const prov = provider || readProvider();
    const c    = readContract(prov);
    const filter = c.filters.ArticleRead(null, readerAddress);
    const events = await c.queryFilter(filter, -100000);
    const results: any[] = [];
    for (const ev of [...events].reverse()) {
      try {
        const e    = ev as any;
        const meta = await c.getArticleMetadata(e.args.id);
        if (meta.id.toString() !== "0") {
          results.push({
            ...parseMeta(meta),
            pricePaid:   ethers.formatUnits(e.args.price, 6),
            txHash:      e.transactionHash,
            blockNumber: e.blockNumber,
          });
        }
      } catch {}
    }
    return results;
  } catch { return []; }
}

// Fetch writer earnings from chain events
export async function fetchWriterStats(authorAddress: string, provider?: ethers.Provider): Promise<{
  articles: Article[];
  totalEarned: number;
  totalReads: number;
  earningsByArticle: Map<string, number>;
}> {
  if (!CONTRACT_ADDRESS) return { articles: [], totalEarned: 0, totalReads: 0, earningsByArticle: new Map() };
  try {
    const prov = provider || readProvider();
    const c    = readContract(prov);

    // Get all articles by this author
    const pubFilter = c.filters.ArticlePublished(null, authorAddress);
    const pubEvents = await c.queryFilter(pubFilter, -100000);

    const articles: Article[] = [];
    for (const ev of [...pubEvents].reverse()) {
      try {
        const e = ev as any;
        const m = await c.getArticleMetadata(e.args.id);
        if (m.id.toString() !== "0") articles.push(parseMeta(m));
      } catch {}
    }

    // Get all read events for those articles
    const earningsByArticle = new Map<string, number>();
    let totalEarned = 0;
    let totalReads  = 0;

    for (const article of articles) {
      try {
        const readFilter = c.filters.ArticleRead(BigInt(article.id));
        const readEvents = await c.queryFilter(readFilter, -100000);
        const earned = (readEvents as any[]).reduce((s, e) => {
          return s + parseFloat(ethers.formatUnits(e.args.price, 6)) * 0.85;
        }, 0);
        earningsByArticle.set(article.id, earned);
        totalEarned += earned;
        totalReads  += (readEvents as any[]).length;
      } catch {}
    }

    return { articles, totalEarned, totalReads, earningsByArticle };
  } catch { return { articles: [], totalEarned: 0, totalReads: 0, earningsByArticle: new Map() }; }
}

// Fetch USDC balance
export async function fetchUsdcBalance(address: string, provider?: ethers.Provider): Promise<string> {
  if (!USDC_ADDRESS || !address) return "0.00";
  try {
    const prov = provider || readProvider();
    const usdc = usdcContract(prov);
    const bal  = await usdc.balanceOf(address);
    const dec  = await usdc.decimals();
    return parseFloat(ethers.formatUnits(bal, dec)).toFixed(4);
  } catch { return "0.00"; }
}

// Fetch all on-chain events for admin
export async function fetchAllEvents(provider?: ethers.Provider) {
  if (!CONTRACT_ADDRESS) return { pub: [], read: [], ver: [] };
  try {
    const prov = provider || readProvider();
    const c    = readContract(prov);
    const [pub, read, ver] = await Promise.all([
      c.queryFilter(c.filters.ArticlePublished(), -100000),
      c.queryFilter(c.filters.ArticleRead(),      -100000),
      c.queryFilter(c.filters.WriterVerified(),   -100000),
    ]);
    return { pub, read, ver };
  } catch { return { pub: [], read: [], ver: [] }; }
}

// Alias for backwards compat
export const ARC_EXPLORER = EXPLORER_URL;

// Fetch wallet USDC transaction history (inflows = earned, outflows = paid to read)
export async function fetchWalletHistory(address: string, provider?: ethers.Provider) {
  if (!CONTRACT_ADDRESS || !address) return [];
  try {
    const prov = provider || readProvider();
    const c    = readContract(prov);
    const [pubEvs, readEvs, verEvs] = await Promise.all([
      c.queryFilter(c.filters.ArticlePublished(null, address), -100000),
      c.queryFilter(c.filters.ArticleRead(null, address),      -100000),
      c.queryFilter(c.filters.ArticleRead(),                   -100000), // reads on articles you wrote
    ]);

    const results: any[] = [];

    // Money received: ArticleRead events on articles YOU wrote
    for (const e of verEvs as any[]) {
      try {
        const meta = await c.getArticleMetadata(e.args.id);
        if (meta.author?.toLowerCase() === address.toLowerCase()) {
          const price = parseFloat(ethers.formatUnits(e.args.price, 6));
          results.push({
            type: "earn", label: `Earned — Article #${e.args.id}`,
            amount: price * 0.85, hash: e.transactionHash, blockNumber: e.blockNumber,
          });
        }
      } catch {}
    }

    // Money spent: ArticleRead events WHERE YOU are the reader
    for (const e of readEvs as any[]) {
      try {
        const price = parseFloat(ethers.formatUnits(e.args.price, 6));
        const meta  = await c.getArticleMetadata(e.args.id);
        results.push({
          type: "read", label: `Read — "${meta.title?.slice(0,40)}"`,
          amount: -price, hash: e.transactionHash, blockNumber: e.blockNumber,
        });
      } catch {}
    }

    return results.sort((a, b) => b.blockNumber - a.blockNumber);
  } catch { return []; }
}

// ─── Database-backed article fetching ─────────────────────────────
// These replace the on-chain versions for content management.
// Payments still go through USDC on Arc blockchain.

export type DBArticle = {
  id: string; title: string; blurb: string; content?: string;
  price: string; priceRaw?: string; category: string; readTime: number;
  isResearch: boolean; authorAddress: string; authorShort: string;
  status: string; featured: boolean; reads: number; timestamp: number;
  hasPaid?: boolean;
};

export async function dbFetchArticles(opts?: {
  limit?: number; category?: string; author?: string;
  search?: string; featured?: boolean;
}): Promise<{ data: DBArticle[]; error?: string }> {
  const p = new URLSearchParams();
  if (opts?.limit)    p.set("limit",    String(opts.limit));
  if (opts?.category && opts.category !== "All") p.set("category", opts.category);
  if (opts?.author)   p.set("author",   opts.author);
  if (opts?.search)   p.set("q",        opts.search);
  if (opts?.featured) p.set("featured", "1");
  try {
    const res  = await fetch(`/api/articles?${p}`);
    const json = await res.json();
    if (!res.ok) return { data:[], error: json?.error || `HTTP ${res.status}` };
    if (!Array.isArray(json)) return { data:[], error:"Unexpected response from database" };
    return { data: json };
  } catch (e: any) {
    return { data:[], error: e.message || "Failed to reach API" };
  }
}

export async function dbFetchArticle(id: string, readerAddress?: string): Promise<DBArticle | null> {
  const p = new URLSearchParams();
  if (readerAddress) p.set("reader", readerAddress);
  try {
    const res = await fetch(`/api/articles/${id}?${p}`);
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function dbRecordPayment(
  articleId: string, readerAddress: string, txHash?: string, amountPaid?: string
): Promise<{ ok: boolean; content?: string }> {
  try {
    const res = await fetch(`/api/articles/${articleId}/pay`, {
      method: "POST", headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ readerAddress, txHash, amountPaid }),
    });
    return res.json();
  } catch { return { ok: false }; }
}

export async function dbCheckPaid(articleId: string, readerAddress: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/articles/${articleId}/pay?reader=${readerAddress}`);
    const d   = await res.json();
    return d.paid === true;
  } catch { return false; }
}

export async function dbPublishArticle(data: {
  title: string; blurb: string; content: string; price: number;
  category: string; readTime: number; isResearch: boolean; authorAddress: string;
}): Promise<DBArticle | null> {
  try {
    const res = await fetch("/api/articles", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  } catch (e: any) { throw e; }
}

export async function dbUpdateArticle(id: string, data: Partial<{
  title: string; blurb: string; content: string; price: number;
  category: string; readTime: number; isResearch: boolean;
}>, authorAddress: string): Promise<void> {
  const res = await fetch(`/api/articles/${id}`, {
    method:"PUT", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ ...data, authorAddress }),
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function dbDeleteArticle(id: string, authorAddress: string): Promise<void> {
  const res = await fetch(`/api/articles/${id}`, {
    method:"DELETE", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ authorAddress }),
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function adminUpdateStatus(id: string, status: string, featured?: boolean): Promise<void> {
  await fetch(`/api/admin/articles/${id}`, {
    method:"PATCH", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ status, ...(featured !== undefined && { featured }) }),
  });
}
