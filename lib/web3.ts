import { ethers } from "ethers";

export const READLEARC_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";
export const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS || "";

export const READLEARC_ABI = [
  "function publishArticle(string _title, string _blurb, string _content, uint256 _price, string _category, uint256 _readTime) external returns (uint256)",
  "function payToRead(uint256 _articleId, address _referrer) external",
  "function getArticleMetadata(uint256 _articleId) external view returns (uint256 id, address author, string title, string blurb, uint256 price, string category, uint256 readTime, uint256 timestamp, uint256 reads)",
  "function getFullArticle(uint256 _articleId) external view returns (tuple(uint256 id, address author, string title, string blurb, string content, uint256 price, string category, uint256 readTime, uint256 timestamp, uint256 reads))",
  "function hasReadReceipt(address _user, uint256 _articleId) external view returns (bool)",
  "function articleCount() external view returns (uint256)",
  "event ArticlePublished(uint256 indexed id, address indexed author, string title)",
  "event ArticleRead(uint256 indexed id, address indexed reader, address indexed referrer, uint256 price)"
];

export const USDC_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)"
];

// Reusable hook structure for client-side
export async function getProvider() {
  if (typeof window !== "undefined" && (window as any).ethereum) {
    await (window as any).ethereum.request({ method: "eth_requestAccounts" });
    return new ethers.BrowserProvider((window as any).ethereum);
  }
  throw new Error("No crypto wallet found. Please install MetaMask.");
}

// Fetch all articles metadata from chain (fallback to read-only provider if wallet not connected)
export async function fetchAllArticles() {
  if (!READLEARC_ADDRESS) return [];
  
  try {
    let provider;
    if (typeof window !== "undefined" && (window as any).ethereum) {
      provider = new ethers.BrowserProvider((window as any).ethereum);
    } else {
      // Use a public RPC if window.ethereum is not available
      // Note: In production, use your own Alchemy/Infura endpoint
      provider = new ethers.JsonRpcProvider("https://rpc.sepolia.org"); // Example public RPC
    }

    const contract = new ethers.Contract(READLEARC_ADDRESS, READLEARC_ABI, provider);
    const count = await contract.articleCount();
    
    const articles = [];
    // Loop backwards to get newest first (limit to 10 for performance)
    const limit = Number(count) > 10 ? Number(count) - 10 : 1;
    for (let i = Number(count); i >= limit; i--) {
      try {
        const meta = await contract.getArticleMetadata(i);
        articles.push({
          id: meta.id.toString(),
          title: meta.title,
          blurb: meta.blurb,
          price: ethers.formatUnits(meta.price, 6), // Assuming USDC 6 decimals
          category: meta.category,
          readTime: meta.readTime.toString(),
          timestamp: meta.timestamp.toString(),
          reads: meta.reads.toString(),
          author: { handle: meta.author.substring(0, 8) + "...", address: meta.author },
        });
      } catch (err) {
        console.warn("Failed to fetch article", i, err);
      }
    }
    return articles;
  } catch (err) {
    console.error("Error fetching articles:", err);
    return [];
  }
}
