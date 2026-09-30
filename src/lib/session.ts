/**
 * Persistent session management — private key re-encrypted with a random
 * session key stored in localStorage. Session survives browser restarts
 * until explicit logout.
 */

const SESSION_STORE = "rl-session-v2";

interface SessionData {
  address:       string;
  walletIndex:   number;
  encryptedKey:  string;   // AES-GCM encrypted PK
  sessionKey:    string;   // base64 random key
  createdAt:     number;
}

async function sessionCryptoKey(rawBase64: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(rawBase64), c => c.charCodeAt(0));
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt","decrypt"]);
}

export async function saveSession(privateKey: string, address: string, walletIndex: number): Promise<void> {
  const rawKey = crypto.getRandomValues(new Uint8Array(32));
  const iv     = crypto.getRandomValues(new Uint8Array(12));
  const key    = await crypto.subtle.importKey("raw", rawKey, "AES-GCM", false, ["encrypt"]);
  const enc    = await crypto.subtle.encrypt({ name:"AES-GCM", iv }, key, new TextEncoder().encode(privateKey));

  const combined = new Uint8Array([...iv, ...new Uint8Array(enc)]);
  const session: SessionData = {
    address,
    walletIndex,
    encryptedKey: btoa(String.fromCharCode(...combined)),
    sessionKey:   btoa(String.fromCharCode(...rawKey)),
    createdAt:    Date.now(),
  };
  localStorage.setItem(SESSION_STORE, JSON.stringify(session));
}

export async function restoreSession(): Promise<{ privateKey: string; address: string; walletIndex: number } | null> {
  try {
    const raw = localStorage.getItem(SESSION_STORE);
    if (!raw) return null;
    const session: SessionData = JSON.parse(raw);

    const key   = await sessionCryptoKey(session.sessionKey);
    const bytes = Uint8Array.from(atob(session.encryptedKey), c => c.charCodeAt(0));
    const iv    = bytes.slice(0, 12);
    const data  = bytes.slice(12);
    const dec   = await crypto.subtle.decrypt({ name:"AES-GCM", iv }, key, data);
    const privateKey = new TextDecoder().decode(dec);

    return { privateKey, address: session.address, walletIndex: session.walletIndex };
  } catch {
    localStorage.removeItem(SESSION_STORE);
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_STORE);
}

export function hasSession(): boolean {
  return !!localStorage.getItem(SESSION_STORE);
}
