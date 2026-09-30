/**
 * Typed contract interfaces for all Readlearc contracts.
 * Uses lib/arc.ts as the single source of truth for addresses.
 */
import { ethers } from "ethers";
import {
  READLEARC_ADDRESS,
  STREAM_PAY_ADDRESS,
  CONTENT_REG_ADDRESS,
  CREATOR_TIP_ADDRESS,
  USDC_ADDRESS,
  getProvider,
} from "./arc";

// ── ABIs ──────────────────────────────────────────────────────────

export const READLEARC_ABI = [
  "function payToRead(uint256 articleId, address writer, uint256 price, address referrer) external",
  "function tip(address writer, uint256 amount) external",
  "function hasPaid(uint256 articleId, address reader) external view returns (bool)",
  "function writerBps() view returns (uint256)",
  "function platformBps() view returns (uint256)",
  "function referrerBps() view returns (uint256)",
  "function setSplits(uint256 _writer, uint256 _platform, uint256 _referrer) external",
  "function setPlatformFee(uint256 newBps) external",
  "function setTreasury(address _treasury) external",
  "function setVerified(address writer, bool status) external",
  "function roles(address) view returns (uint8)",
  "function verified(address) view returns (bool)",
  "function treasury() view returns (address)",
  "event ArticlePaid(uint256 indexed articleId, address indexed reader, address indexed writer, uint256 amount)",
  "event Tipped(address indexed from, address indexed to, uint256 amount)",
];

export const STREAM_PAY_ABI = [
  "function openSession(address creator, uint256 ratePerSec, address sessionKey) external payable returns (bytes32 sessionId)",
  "function closeSession(bytes32 sessionId, uint256 amountOwed, bytes calldata sig) external",
  "function reclaimExpired(bytes32 sessionId) external",
  "function getSession(bytes32 sessionId) external view returns (tuple(address viewer, address creator, uint256 deposit, uint256 ratePerSecond, address sessionKey, uint256 openedAt, uint256 lastAmountOwed, uint8 status))",
  "function previewSplit(uint256 amountOwed) external view returns (uint256 creatorAmt, uint256 platformAmt)",
  "function platformFeeBps() view returns (uint256)",
  "function setPlatformFee(uint256 newBps) external",
  "function setTreasury(address newTreasury) external",
  "function EXPIRY_SECONDS() view returns (uint256)",
  "event SessionOpened(bytes32 indexed sessionId, address indexed viewer, address indexed creator, uint256 deposit, uint256 ratePerSecond)",
  "event SessionClosed(bytes32 indexed sessionId, address indexed creator, uint256 creatorAmount, uint256 platformAmount, uint256 refund)",
  "event SessionReclaimed(bytes32 indexed sessionId, address indexed viewer, uint256 refund)",
];

export const CONTENT_REG_ABI = [
  "function recordUnlock(bytes32 contentId, address reader, uint256 amountPaid) external",
  "function recordSubscription(address creator, address subscriber, uint256 expiry, uint256 amountPaid) external",
  "function hasAccess(bytes32 contentId, address reader) external view returns (bool)",
  "function isSubscribed(address creator, address subscriber) external view returns (bool)",
  "function subscriptionExpiry(address creator, address subscriber) external view returns (uint256)",
  "function setRecorder(address recorder, bool status) external",
  "event Unlocked(bytes32 indexed contentId, address indexed reader, uint256 amountPaid)",
  "event Subscribed(address indexed creator, address indexed subscriber, uint256 expiry, uint256 amountPaid)",
];

export const CREATOR_TIP_ABI = [
  "function tip(address creator, uint256 amount, bytes32 contentId) external",
  "function previewTip(uint256 amount) external view returns (uint256 creatorAmt, uint256 platformAmt)",
  "function platformFeeBps() view returns (uint256)",
  "function setPlatformFee(uint256 newBps) external",
  "function setTreasury(address newTreasury) external",
  "event Tipped(address indexed from, address indexed creator, uint256 gross, uint256 creatorAmount, uint256 platformAmount, bytes32 indexed contentId)",
];

export const USDC_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function transfer(address to, uint256 amount) external returns (bool)",
];

// ── Read-only contract instances ─────────────────────────────────

export function readlearc(provider?: ethers.Provider) {
  return new ethers.Contract(READLEARC_ADDRESS, READLEARC_ABI, provider ?? getProvider());
}

export function streamPay(provider?: ethers.Provider) {
  return new ethers.Contract(STREAM_PAY_ADDRESS, STREAM_PAY_ABI, provider ?? getProvider());
}

export function contentRegistry(provider?: ethers.Provider) {
  return new ethers.Contract(CONTENT_REG_ADDRESS, CONTENT_REG_ABI, provider ?? getProvider());
}

export function creatorTip(provider?: ethers.Provider) {
  return new ethers.Contract(CREATOR_TIP_ADDRESS, CREATOR_TIP_ABI, provider ?? getProvider());
}

export function usdcContract(provider?: ethers.Provider) {
  return new ethers.Contract(USDC_ADDRESS, USDC_ABI, provider ?? getProvider());
}

// ── Signed instances (for server-side calls with a signer) ────────

export function signedReadlearc(signer: ethers.Signer) {
  return new ethers.Contract(READLEARC_ADDRESS, READLEARC_ABI, signer);
}

export function signedStreamPay(signer: ethers.Signer) {
  return new ethers.Contract(STREAM_PAY_ADDRESS, STREAM_PAY_ABI, signer);
}

export function signedContentRegistry(signer: ethers.Signer) {
  return new ethers.Contract(CONTENT_REG_ADDRESS, CONTENT_REG_ABI, signer);
}

export function signedCreatorTip(signer: ethers.Signer) {
  return new ethers.Contract(CREATOR_TIP_ADDRESS, CREATOR_TIP_ABI, signer);
}

export function signedUsdc(signer: ethers.Signer) {
  return new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
}
