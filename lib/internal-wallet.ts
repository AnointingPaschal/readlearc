/**
 * Readlearc Internal Wallet
 * Fully self-custodial — private keys encrypted in browser, never leave device.
 * Uses Web Crypto AES-GCM + PBKDF2 for encryption.
 */
import { ethers } from "ethers";

export const ARC_RPC      = "https://rpc.testnet.arc.network";
export const ARC_CHAIN_ID = 5042002;
export const USDC_ADDR    = process.env.NEXT_PUBLIC_USDC_ADDRESS || "0x3600000000000000000000000000000000000000";

export const USDC_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
];

export interface StoredWallet {
  name:        string;
  address:     string;
  encryptedKey:string;   // AES-GCM encrypted private key
  createdAt:   number;
}

// ── Crypto helpers ────────────────────────────────────────────────
async function deriveKey(password: string, salt: Uint8Array, usage: "encrypt"|"decrypt") {
  const raw = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(password),
    { name:"PBKDF2" } as AlgorithmIdentifier,
    false, ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name:"PBKDF2", salt, iterations:200_000, hash:"SHA-256" } as Pbkdf2Params,
    raw,
    { name:"AES-GCM", length:256 } as AesKeyGenParams,
    false, [usage]
  );
}

export async function encryptKey(privateKey: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const key  = await deriveKey(password, salt, "encrypt");
  const data = await crypto.subtle.encrypt(
    { name:"AES-GCM", iv }, key, new TextEncoder().encode(privateKey)
  );
  const bytes = new Uint8Array([...salt, ...iv, ...new Uint8Array(data)]);
  return btoa(String.fromCharCode(...bytes));
}

export async function decryptKey(encryptedB64: string, password: string): Promise<string> {
  const bytes = new Uint8Array(atob(encryptedB64).split("").map(c => c.charCodeAt(0)));
  const salt  = bytes.slice(0, 16);
  const iv    = bytes.slice(16, 28);
  const data  = bytes.slice(28);
  const key   = await deriveKey(password, salt, "decrypt");
  const dec   = await crypto.subtle.decrypt({ name:"AES-GCM", iv }, key, data);
  return new TextDecoder().decode(dec);
}

// ── Wallet creation ───────────────────────────────────────────────
export function generateWallet(): { wallet: ethers.HDNodeWallet; mnemonic: string } {
  const wallet   = ethers.Wallet.createRandom();
  const mnemonic = wallet.mnemonic!.phrase;
  return { wallet, mnemonic };
}

export function importFromMnemonic(phrase: string): ethers.HDNodeWallet {
  return ethers.Wallet.fromPhrase(phrase.trim());
}

export function importFromPrivateKey(key: string): ethers.Wallet {
  const k = key.trim().startsWith("0x") ? key.trim() : "0x" + key.trim();
  return new ethers.Wallet(k);
}

export function validateMnemonic(phrase: string): boolean {
  try { ethers.Wallet.fromPhrase(phrase.trim()); return true; } catch { return false; }
}

export function validatePrivateKey(key: string): boolean {
  try { importFromPrivateKey(key); return true; } catch { return false; }
}

// ── Storage ───────────────────────────────────────────────────────
const STORAGE_KEY = "rl-wallets";

export function loadWallets(): StoredWallet[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}

export function saveWallets(wallets: StoredWallet[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wallets));
}

export function getActiveIndex(): number {
  const i = parseInt(localStorage.getItem("rl-wallet-active") || "0");
  return isNaN(i) ? 0 : i;
}

export function setActiveIndex(i: number): void {
  localStorage.setItem("rl-wallet-active", String(i));
}

export async function addWallet(
  wallet: ethers.HDNodeWallet | ethers.Wallet, name: string, password: string
): Promise<StoredWallet> {
  const stored: StoredWallet = {
    name, address: wallet.address,
    encryptedKey: await encryptKey(wallet.privateKey, password),
    createdAt: Date.now(),
  };
  const all = loadWallets();
  all.push(stored);
  saveWallets(all);
  setActiveIndex(all.length - 1);
  return stored;
}

// ── Provider + signer ─────────────────────────────────────────────
export function getProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(ARC_RPC, { chainId: ARC_CHAIN_ID, name: "Arc Testnet" });
}

export async function getSigner(
  encryptedKey: string, password: string
): Promise<ethers.Wallet> {
  const privateKey = await decryptKey(encryptedKey, password);
  return new ethers.Wallet(privateKey, getProvider());
}

// ── Balance ───────────────────────────────────────────────────────
export async function getUsdcBalance(address: string): Promise<string> {
  try {
    const prov = getProvider();
    const usdc = new ethers.Contract(USDC_ADDR, USDC_ABI, prov);
    const [bal, dec] = await Promise.all([usdc.balanceOf(address), usdc.decimals()]);
    return parseFloat(ethers.formatUnits(bal, dec)).toFixed(4);
  } catch { return "0.0000"; }
}

// ── Send USDC ─────────────────────────────────────────────────────
export async function sendUsdc(
  encryptedKey: string, password: string,
  to: string, amount: string
): Promise<{ hash: string }> {
  const signer = await getSigner(encryptedKey, password);
  const usdc   = new ethers.Contract(USDC_ADDR, USDC_ABI, signer);
  const dec    = await usdc.decimals();
  const units  = ethers.parseUnits(amount, dec);
  const tx     = await usdc.transfer(to, units);
  return { hash: tx.hash };
}

// ── Transaction history (from Arc RPC) ───────────────────────────
export async function getTxHistory(address: string): Promise<any[]> {
  try {
    const res = await fetch(`https://testnet.arcscan.app/api/v2/addresses/${address}/transactions?type=USDC`);
    if (!res.ok) return [];
    const d = await res.json();
    return d.items || [];
  } catch { return []; }
}
