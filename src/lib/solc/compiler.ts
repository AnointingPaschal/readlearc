/**
 * In-browser Solidity compiler (Remix-style).
 *  - Any solc release can be picked: the matching `soljson` is loaded straight from binaries.soliditylang.org
 *    inside a Web Worker, so the UI never blocks and no server is involved.
 *  - Optimizer (+ runs), viaIR and EVM version are passed through as standard-JSON settings.
 *  - Imports that aren't in the workspace (`@openzeppelin/...`, `https://...`) are fetched from jsDelivr / the URL.
 */

export interface SolcBuild { path: string; version: string; longVersion: string; prerelease?: string }
export interface VersionList { builds: SolcBuild[]; latestRelease: string }

const BIN = "https://binaries.soliditylang.org/bin/";

export async function listVersions(): Promise<VersionList> {
  const r = await fetch(BIN + "list.json");
  if (!r.ok) throw new Error(`Couldn't load the compiler list (${r.status})`);
  const d = (await r.json()) as { builds: SolcBuild[]; latestRelease: string };
  const builds = [...d.builds].sort((a, b) => cmpVer(b.version, a.version) || (b.prerelease ? -1 : 1));
  return { builds, latestRelease: d.latestRelease };
}

export const parseVer = (v: string): [number, number, number] => {
  const m = v.match(/(\d+)\.(\d+)\.(\d+)/);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : [0, 0, 0];
};
export function cmpVer(a: string, b: string) {
  const x = parseVer(a), y = parseVer(b);
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
}
const gte = (v: string, min: string) => cmpVer(v, min) >= 0;

/** EVM versions a given compiler understands (newest default is picked by solc itself). */
export function evmVersionsFor(v: string): string[] {
  const all: [string, string][] = [
    ["homestead", "0.0.0"], ["tangerineWhistle", "0.0.0"], ["spuriousDragon", "0.0.0"], ["byzantium", "0.4.21"],
    ["constantinople", "0.4.21"], ["petersburg", "0.5.5"], ["istanbul", "0.5.13"], ["berlin", "0.8.5"], ["london", "0.8.7"],
    ["paris", "0.8.18"], ["shanghai", "0.8.20"], ["cancun", "0.8.24"], ["prague", "0.8.30"], ["osaka", "0.8.30"],
  ];
  return all.filter(([, min]) => gte(v, min)).map(([n]) => n);
}
export const supportsViaIR = (v: string) => gte(v, "0.8.13");

export interface CompileSettings {
  /** build.path, e.g. "soljson-v0.8.26+commit.8a97fa7a.js" */
  buildPath: string;
  /** build.version, e.g. "0.8.26" */
  version: string;
  evmVersion: string; // "default" | name
  optimizer: boolean;
  runs: number;
  viaIR: boolean;
}

export interface CompiledContract {
  file: string;
  name: string;
  abi: any[];
  bytecode: string;       // 0x-prefixed creation code
  deployedSize: number;   // bytes
  warnings?: string[];
}
export interface Diagnostic { severity: "error" | "warning" | "info"; message: string; file?: string }
export interface CompileResult { ok: boolean; contracts: CompiledContract[]; diagnostics: Diagnostic[]; solcVersion: string; ms: number; sources: Record<string, string> }

// ───────────────────────────── worker ─────────────────────────────
const WORKER_SRC = `
var api = null;
function load(url) {
  importScripts(url);
  var M = self.Module;
  if (!M || typeof M.cwrap !== 'function') throw new Error('Compiler failed to initialise');
  var compile;
  if (typeof M._solidity_compile === 'function') { var f1 = M.cwrap('solidity_compile', 'string', ['string', 'number', 'number']); compile = function (i) { return f1(i, 0, 0); }; }
  else if (typeof M._compileJSONCallback === 'function') { var f2 = M.cwrap('compileJSONCallback', 'string', ['string', 'number', 'number']); compile = function (i) { return f2(i, 0, 0); }; }
  else if (typeof M._compileStandard === 'function') { var f3 = M.cwrap('compileStandard', 'string', ['string', 'number']); compile = function (i) { return f3(i, 0); }; }
  else throw new Error('This compiler build has no standard-JSON interface (use 0.4.11 or newer)');
  var v = '';
  try { v = M.cwrap(typeof M._solidity_version === 'function' ? 'solidity_version' : 'version', 'string', [])(); } catch (e) {}
  api = { compile: compile, version: v };
  return v;
}
self.onmessage = function (e) {
  var m = e.data;
  try {
    if (m.type === 'load') { var v = load(m.url); self.postMessage({ id: m.id, ok: true, version: v }); }
    else if (m.type === 'compile') { if (!api) throw new Error('Compiler not loaded'); self.postMessage({ id: m.id, ok: true, output: api.compile(m.input) }); }
  } catch (err) { self.postMessage({ id: m.id, ok: false, error: String((err && err.message) || err) }); }
};
`;

let worker: Worker | null = null;
let loadedPath = "";
let seq = 0;
let loading: Promise<void> | null = null;

function call<T = any>(w: Worker, msg: Record<string, unknown>): Promise<T> {
  const id = ++seq;
  return new Promise((resolve, reject) => {
    const on = (e: MessageEvent) => {
      if (e.data.id !== id) return;
      w.removeEventListener("message", on);
      e.data.ok ? resolve(e.data) : reject(new Error(e.data.error));
    };
    w.addEventListener("message", on);
    w.postMessage({ ...msg, id });
  });
}

async function ensureCompiler(buildPath: string, onStatus?: (s: string) => void) {
  if (worker && loadedPath === buildPath) return;
  if (loading) await loading.catch(() => {});
  if (worker && loadedPath === buildPath) return;
  loading = (async () => {
    worker?.terminate();
    worker = new Worker(URL.createObjectURL(new Blob([WORKER_SRC], { type: "text/javascript" })));
    onStatus?.("Downloading compiler…");
    await call(worker, { type: "load", url: BIN + buildPath });
    loadedPath = buildPath;
  })();
  try { await loading; } catch (e) { worker?.terminate(); worker = null; loadedPath = ""; throw e; } finally { loading = null; }
}

// ───────────────────────────── imports ─────────────────────────────
const IMPORT_RE = /import\s+(?:[^"';]*?\s+from\s+)?["']([^"']+)["']/g;

function normalize(p: string) {
  const out: string[] = [];
  for (const part of p.split("/")) { if (part === "." || part === "") continue; if (part === "..") out.pop(); else out.push(part); }
  return out.join("/");
}
function resolveImport(importer: string, spec: string) {
  if (spec.startsWith("./") || spec.startsWith("../")) {
    if (/^https?:\/\//.test(importer)) return new URL(spec, importer).toString();
    const dir = importer.includes("/") ? importer.slice(0, importer.lastIndexOf("/") + 1) : "";
    return normalize(dir + spec);
  }
  return spec;
}
function remoteUrl(key: string): string | null {
  if (/^https?:\/\//.test(key)) return key;
  if (/^ipfs:\/\//.test(key)) return "https://ipfs.io/ipfs/" + key.slice(7);
  if (/^github\.com\//.test(key) || /^@?[a-z0-9][\w.-]*\/.+/i.test(key)) {
    if (key.startsWith("github.com/")) { const [, o, r, ...rest] = key.split("/"); return `https://cdn.jsdelivr.net/gh/${o}/${r}/${rest.join("/")}`; }
    return "https://cdn.jsdelivr.net/npm/" + key; // "@openzeppelin/contracts@4.9.6/token/ERC20/ERC20.sol" or "@openzeppelin/contracts/…"
  }
  return null;
}

/** Fetch every import that the workspace doesn't already contain. */
async function collectSources(pool: Record<string, string>, entries: string[], onStatus?: (s: string) => void) {
  const sources: Record<string, string> = {};
  for (const e of entries) { if (!(e in pool)) throw new Error(`File not found: ${e}`); sources[e] = pool[e]; }
  const queue = [...entries];
  const seen = new Set(queue);
  let fetched = 0;
  while (queue.length) {
    const file = queue.shift()!;
    for (const m of sources[file].matchAll(IMPORT_RE)) {
      const key = resolveImport(file, m[1]);
      if (seen.has(key)) continue;
      seen.add(key);
      if (key in pool) { sources[key] = pool[key]; queue.push(key); continue; }
      const url = remoteUrl(key);
      if (!url) throw new Error(`File not found: "${m[1]}" (imported from ${file}). Add it to the workspace.`);
      if (++fetched > 150) throw new Error("Too many remote imports");
      onStatus?.(`Fetching ${key}…`);
      const r = await fetch(url);
      if (!r.ok) throw new Error(`Couldn't fetch ${key} (${r.status})`);
      sources[key] = await r.text();
      queue.push(key);
    }
  }
  return sources;
}

// ───────────────────────────── compile ─────────────────────────────
/** Compile `entries` (default: every file) plus whatever they import. `files` is the workspace pool. */
export async function compile(files: Record<string, string>, s: CompileSettings, onStatus?: (t: string) => void, entries?: string[]): Promise<CompileResult> {
  const t0 = performance.now();
  const sources = await collectSources(files, entries?.length ? entries : Object.keys(files), onStatus);
  await ensureCompiler(s.buildPath, onStatus);
  onStatus?.("Compiling…");

  const settings: Record<string, unknown> = {
    optimizer: { enabled: s.optimizer, runs: s.runs },
    outputSelection: { "*": { "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object"] } },
  };
  if (s.evmVersion && s.evmVersion !== "default") settings.evmVersion = s.evmVersion;
  if (s.viaIR && supportsViaIR(s.version)) settings.viaIR = true;
  const input = { language: "Solidity", sources: Object.fromEntries(Object.entries(sources).map(([k, v]) => [k, { content: v }])), settings };

  const { output } = await call<{ output: string }>(worker!, { type: "compile", input: JSON.stringify(input) });
  const out = JSON.parse(output) as { errors?: any[]; contracts?: Record<string, Record<string, any>> };

  const diagnostics: Diagnostic[] = (out.errors || []).map((e) => ({
    severity: e.severity === "error" ? "error" : e.severity === "warning" ? "warning" : "info",
    message: String(e.formattedMessage || e.message),
    file: e.sourceLocation?.file,
  }));
  const contracts: CompiledContract[] = [];
  for (const [file, byName] of Object.entries(out.contracts || {})) {
    for (const [name, c] of Object.entries(byName)) {
      const bc: string = c.evm?.bytecode?.object || "";
      contracts.push({
        file, name, abi: c.abi || [],
        bytecode: bc ? "0x" + bc : "",
        deployedSize: Math.floor((c.evm?.deployedBytecode?.object || "").length / 2),
      });
    }
  }
  return { ok: !diagnostics.some((d) => d.severity === "error"), contracts, diagnostics, solcVersion: s.version, ms: Math.round(performance.now() - t0), sources };
}

export function disposeCompiler() { worker?.terminate(); worker = null; loadedPath = ""; }
