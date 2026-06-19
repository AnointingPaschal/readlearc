import { ethers } from "ethers";

// ─── Configuration ────────────────────────────────────────────────
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";
export const USDC_ADDRESS     = process.env.NEXT_PUBLIC_USDC_ADDRESS     || "";
export const RPC_URL          = process.env.NEXT_PUBLIC_RPC_URL          || "https://rpc.arc.io/testnet";
export const EXPLORER_URL     = process.env.NEXT_PUBLIC_EXPLORER_URL     || "https://explorer.arc.io/testnet";
export const IS_CONFIGURED    = !!(CONTRACT_ADDRESS && USDC_ADDRESS);

// ─── ABIs ─────────────────────────────────────────────────────────
export const CONTRACT_ABI = [
  "function publishArticle(string _title, string _blurb, string _content, uint256 _price, string _category, uint256 _readTime) external returns (uint256)",
  "function payToRead(uint256 _articleId, address _referrer) external",
  "function getArticleMetadata(uint256 _articleId) external view returns (uint256 id, address author, string title, string blurb, uint256 price, string category, uint256 readTime, uint256 timestamp, uint256 reads)",
  "function getFullArticle(uint256 _articleId) external view returns (tuple(uint256 id, address author, string title, string blurb, string content, uint256 price, string category, uint256 readTime, uint256 timestamp, uint256 reads))",
  "function hasReadReceipt(address _user, uint256 _articleId) external view returns (bool)",
  "function articleCount() external view returns (uint256)",
  "function owner() external view returns (address)",
  "function verifiedWriters(address) external view returns (bool)",
  "function defaultWriterBps() external view returns (uint256)",
  "function defaultPlatformBps() external view returns (uint256)",
  "function defaultReferrerBps() external view returns (uint256)",
  "function verifiedWriterBps() external view returns (uint256)",
  "function verifiedPlatformBps() external view returns (uint256)",
  "function verifiedReferrerBps() external view returns (uint256)",
  "function setVerifiedWriter(address _writer, bool _status) external",
  "function transferOwnership(address newOwner) external",
  "event ArticlePublished(uint256 indexed id, address indexed author, string title)",
  "event ArticleRead(uint256 indexed id, address indexed reader, address indexed referrer, uint256 price)",
  "event WriterVerified(address indexed writer, bool status)",
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
