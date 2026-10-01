/**
 * Admin → Deploy. A small Remix inside the admin: edit Solidity, compile in the browser with any solc version
 * (optimizer / runs / viaIR / EVM version), deploy and interact — every transaction is signed by the site wallet,
 * so no external wallet is ever connected. "Deploy Readlearc suite" does the whole platform in one click and
 * saves the addresses to Cloudflare KV.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { ethers } from "ethers";
import {
  Rocket, Play, FileCode, Plus, Trash2, Copy, Check, ExternalLink, Loader2, AlertTriangle, CheckCircle2, XCircle,
  ChevronDown, ChevronRight, Download, RotateCcw, Upload, Wallet,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { cfg, txUrl, addressUrl } from "@/lib/config";
import { explainError } from "@/lib/chain";
import {
  listVersions, compile, evmVersionsFor, supportsViaIR, parseVer,
  type CompileResult, type CompiledContract, type CompileSettings, type SolcBuild,
} from "@/lib/solc/compiler";
import { deployContract, deploySuite, ctorInputs, ctorPayable, parseArg, SUITE_STEPS, type StepStatus } from "@/lib/solc/deploy";

// ─────────────── persistence ───────────────
const LS = {
  files: "rl-sol-files", settings: "rl-solc-settings", deployed: () => `rl-deployed-${cfg.chainId}`,
};
const load = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d; } catch { return d; } };
const save = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } };

const bundledLoaders = import.meta.glob("../../../../contracts/*.sol", { query: "?raw", import: "default" }) as Record<string, () => Promise<string>>;
const base = (p: string) => p.slice(p.lastIndexOf("/") + 1);

const SUITE_SETTINGS = { version: "0.8.26", evmVersion: "paris", optimizer: true, runs: 200, viaIR: true };

interface Deployed { id: string; name: string; address: string; abi: any[]; txHash: string; at: number }

const box: React.CSSProperties = { background: "var(--bg-alt)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", padding: "9px 12px", fontSize: 12, color: "var(--text)", outline: "none", width: "100%", boxSizing: "border-box" };
const mono: React.CSSProperties = { fontFamily: "JetBrains Mono,monospace" };
const lab: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4, display: "block" };

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return <button title="Copy" onClick={() => { navigator.clipboard?.writeText(text); setOk(true); setTimeout(() => setOk(false), 1200); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-4)", padding: 2 }}>{ok ? <Check size={13} /> : <Copy size={13} />}</button>;
}

export default function DeployPage() {
  const { signer, isAuth, address, requireAuth } = useAuth();
  const [tab, setTab] = useState<"editor" | "compile" | "deploy">("editor");

  // workspace
  const [bundled, setBundled] = useState<Record<string, string>>({});
  const [edits, setEdits] = useState<Record<string, string>>(() => load(LS.files, {}));
  const files = useMemo(() => ({ ...bundled, ...edits }), [bundled, edits]);
  const [active, setActive] = useState("Roles.sol");
  useEffect(() => {
    (async () => {
      const out: Record<string, string> = {};
      await Promise.all(Object.entries(bundledLoaders).map(async ([p, l]) => { out[base(p)] = await l(); }));
      setBundled(out);
    })();
  }, []);
  useEffect(() => save(LS.files, Object.fromEntries(Object.entries(edits).filter(([k, v]) => bundled[k] !== v))), [edits, bundled]);
  const setFile = (n: string, c: string) => setEdits((e) => ({ ...e, [n]: c }));

  // compiler settings
  const [versions, setVersions] = useState<SolcBuild[]>([]);
  const [verErr, setVerErr] = useState("");
  const [nightly, setNightly] = useState(false);
  const [s, setS] = useState<{ buildPath: string; version: string; evmVersion: string; optimizer: boolean; runs: number; viaIR: boolean }>(
    () => load(LS.settings, { buildPath: "", version: "", evmVersion: "paris", optimizer: true, runs: 200, viaIR: true }));
  useEffect(() => save(LS.settings, s), [s]);
  useEffect(() => {
    listVersions().then((d) => {
      setVersions(d.builds);
      setS((cur) => {
        if (cur.buildPath && d.builds.some((b) => b.path === cur.buildPath)) return cur;
        const b = d.builds.find((x) => x.version === "0.8.26" && !x.prerelease) || d.builds.find((x) => x.version === d.latestRelease)!;
        return { ...cur, buildPath: b.path, version: b.version };
      });
    }).catch((e) => setVerErr(e.message));
  }, []);
  const shown = useMemo(() => versions.filter((b) => nightly || !b.prerelease), [versions, nightly]);
  const evmOptions = useMemo(() => ["default", ...(s.version ? evmVersionsFor(s.version) : [])], [s.version]);
  useEffect(() => { if (s.version && !evmOptions.includes(s.evmVersion)) setS((c) => ({ ...c, evmVersion: "default" })); }, [evmOptions, s.version, s.evmVersion]);

  // compile
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CompileResult | null>(null);
  async function doCompile(autoSwitch = true, entries?: string[]) {
    if (!s.buildPath) return;
    setBusy(true); setStatus("Starting…"); setResult(null);
    try {
      const r = await compile(files, s as CompileSettings, setStatus, entries);
      setResult(r);
      const first = r.contracts.find((c) => c.bytecode) || r.contracts[0];
      if (first) setSel(`${first.file}:${first.name}`);
      if (autoSwitch) setTab("compile");
    } catch (e) { setResult({ ok: false, contracts: [], diagnostics: [{ severity: "error", message: (e as Error).message }], solcVersion: s.version, ms: 0, sources: {} }); setTab("compile"); }
    setBusy(false); setStatus("");
  }

  // deploy single
  const [sel, setSel] = useState("");
  const contract: CompiledContract | undefined = result?.contracts.find((c) => `${c.file}:${c.name}` === sel);
  const [args, setArgs] = useState<string[]>([]);
  const [value, setValue] = useState("");
  const [gas, setGas] = useState("");
  const [dBusy, setDBusy] = useState(false);
  const [dMsg, setDMsg] = useState<{ ok: boolean; text: string; tx?: string } | null>(null);
  const [deployed, setDeployed] = useState<Deployed[]>(() => load(LS.deployed(), []));
  useEffect(() => save(LS.deployed(), deployed), [deployed]);
  const inputs = useMemo(() => (contract ? ctorInputs(contract) : []), [contract]);
  useEffect(() => { setArgs(inputs.map(() => "")); setDMsg(null); }, [sel, inputs.length]);

  const [bal, setBal] = useState("");
  useEffect(() => { if (signer?.provider) signer.provider.getBalance(signer.address).then((b) => setBal(Number(ethers.formatUnits(b, 18)).toFixed(4))).catch(() => setBal("")); }, [signer, dMsg]);

  async function deployOne() {
    if (!contract) return;
    if (!signer) { requireAuth(); return; }
    setDBusy(true); setDMsg(null);
    try {
      const parsed = inputs.map((p, i) => parseArg(p.type, args[i] ?? ""));
      const r = await deployContract(signer, contract, parsed, {
        value: value ? ethers.parseUnits(value, 18) : undefined, gasLimit: gas ? BigInt(gas) : undefined,
      });
      setDeployed((d) => [{ id: r.txHash, name: contract.name, address: r.address, abi: contract.abi, txHash: r.txHash, at: Date.now() }, ...d]);
      setDMsg({ ok: true, text: `${contract.name} deployed at ${r.address}`, tx: r.txHash });
    } catch (e) { setDMsg({ ok: false, text: explainError(e, "Deployment failed") }); }
    setDBusy(false);
  }

  // suite
  const [usdc, setUsdc] = useState(cfg.usdc);
  const [treasury, setTreasury] = useState(cfg.treasury || "");
  useEffect(() => { if (!treasury && address) setTreasury(address); }, [address, treasury]);
  const [steps, setSteps] = useState<Record<string, { status: StepStatus; detail?: string }>>({});
  const [suiteBusy, setSuiteBusy] = useState(false);
  const [suiteErr, setSuiteErr] = useState("");
  const [suiteDone, setSuiteDone] = useState(false);
  const setStep = (id: string, status: StepStatus, detail?: string) => setSteps((x) => ({ ...x, [id]: { status, detail } }));

  async function runSuite() {
    if (!signer) { requireAuth(); return; }
    if (!ethers.isAddress(usdc) || !ethers.isAddress(treasury)) { setSuiteErr("USDC and treasury must be valid addresses."); return; }
    const need = ["Roles", "ContentStore", "Social", "Monetization", "Payments", "StreamPay"];
    if (need.some((n) => !bundled[n + ".sol"])) { setSuiteErr("Bundled contracts are still loading — try again in a second."); return; }
    const build = versions.find((b) => b.version === SUITE_SETTINGS.version && !b.prerelease);
    if (!build) { setSuiteErr(verErr || "Compiler list not loaded yet (needs internet access to binaries.soliditylang.org)."); return; }
    setSuiteBusy(true); setSuiteErr(""); setSteps({}); setSuiteDone(false);
    try {
      setStep("compile", "running");
      const r = await compile(Object.fromEntries(need.map((n) => [n + ".sol", bundled[n + ".sol"]])), { ...SUITE_SETTINGS, buildPath: build.path }, (t) => setStep("compile", "running", t));
      if (!r.ok) { setStep("compile", "error", r.diagnostics.find((d) => d.severity === "error")?.message); throw new Error("Compilation failed"); }
      setStep("compile", "done", `${r.contracts.length} contracts · solc ${SUITE_SETTINGS.version}`);
      const res = await deploySuite({
        signer, compiled: r.contracts, usdc, treasury, onStep: setStep,
        save: async (a) => {
          const resp = await apiFetch("/api/config", {
            method: "PUT", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...a, usdc, treasury, chainId: cfg.chainId, rpcUrl: cfg.rpcUrl }),
          });
          const d = await resp.json().catch(() => ({}));
          if (!resp.ok) throw new Error((d.error || `Save failed (${resp.status})`) + " — contracts ARE deployed; paste the addresses in Finance → Contracts manually.");
        },
      });
      setDeployed((d) => [...Object.entries({ Roles: res.roles, ContentStore: res.contentStore, Social: res.social, Monetization: res.monetization, Payments: res.payments, StreamPay: res.streamPay })
        .map(([name, address]) => ({ id: name + address, name, address, abi: r.contracts.find((c) => c.name === name)!.abi, txHash: "", at: Date.now() })), ...d]);
      setSuiteDone(true);
      setTimeout(() => location.reload(), 2500);
    } catch (e) { setSuiteErr(explainError(e, (e as Error).message)); }
    setSuiteBusy(false);
  }

  // file ops
  const uploadRef = useRef<HTMLInputElement>(null);
  function newFile() {
    const n = prompt("File name", "MyContract.sol")?.trim();
    if (!n) return;
    const name = n.endsWith(".sol") ? n : n + ".sol";
    if (files[name] === undefined) setFile(name, `// SPDX-License-Identifier: MIT\npragma solidity ^${s.version || "0.8.26"};\n\ncontract ${name.replace(/\.sol$/, "").replace(/\W/g, "_")} {\n}\n`);
    setActive(name);
  }
  async function onUpload(fl: FileList | null) {
    for (const f of Array.from(fl || [])) { setFile(f.name, await f.text()); setActive(f.name); }
  }
  function delFile(n: string) {
    if (bundled[n] !== undefined) { setEdits((e) => { const c = { ...e }; delete c[n]; return c; }); return; }
    if (!confirm(`Delete ${n}?`)) return;
    setEdits((e) => { const c = { ...e }; delete c[n]; return c; });
    setActive(Object.keys(files).find((k) => k !== n) || "");
  }
  const dl = (name: string, text: string) => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "application/json" })); a.download = name; a.click(); };

  const walletBar = (
    <div className="card" style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <Wallet size={14} style={{ color: "var(--brand)" }} />
      {isAuth ? (<>
        <span style={{ ...mono, fontSize: 12, color: "var(--text)" }}>{address.slice(0, 8)}…{address.slice(-6)}</span><CopyBtn text={address} />
        <span style={{ fontSize: 11, color: "var(--text-4)" }}>Site wallet · signs every transaction automatically</span>
        <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>{bal ? `${bal} USDC (gas)` : ""}</span>
      </>) : <>
        <span style={{ fontSize: 12, color: "var(--text-3)" }}>Unlock your site wallet to deploy.</span>
        <button className="btn btn-primary btn-sm" onClick={() => requireAuth()}>Unlock wallet</button>
      </>}
      <span style={{ fontSize: 10, color: "var(--text-4)", width: "100%" }}>Network: {cfg.chainName} · chain {cfg.chainId} · {cfg.rpcUrl}</span>
    </div>
  );

  const tabBtn = (id: typeof tab, label: string) => (
    <button onClick={() => setTab(id)} style={{ padding: "8px 14px", fontSize: 13, fontWeight: 700, border: "none", background: "none", cursor: "pointer", color: tab === id ? "var(--brand)" : "var(--text-4)", borderBottom: `2px solid ${tab === id ? "var(--brand)" : "transparent"}` }}>{label}</button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 920 }}>
      <div>
        <h1 style={{ fontFamily: "Outfit,sans-serif", fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-.02em" }}>Contract Deployer</h1>
        <p style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2 }}>Compile and deploy from here. Everything is signed by your site wallet — no wallet connect.</p>
      </div>
      {walletBar}

      {/* ── Suite ── */}
      <div className="card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Rocket size={16} style={{ color: "var(--brand)" }} />
          <span style={{ fontFamily: "Outfit,sans-serif", fontWeight: 800, fontSize: 15, color: "var(--text)" }}>Deploy the Readlearc suite</span>
        </div>
        <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.6, margin: 0 }}>
          Roles → ContentStore → Social → Monetization → Payments → StreamPay, wired together, then the addresses and start block are saved to Cloudflare KV.
          Uses the tested build (solc {SUITE_SETTINGS.version}, optimizer {SUITE_SETTINGS.runs} runs, viaIR, EVM {SUITE_SETTINGS.evmVersion}). Your wallet becomes the owner/super-admin.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 10 }}>
          <div><label style={lab}>USDC token</label><input style={{ ...box, ...mono }} value={usdc} onChange={(e) => setUsdc(e.target.value)} /></div>
          <div><label style={lab}>Treasury (fee recipient)</label><input style={{ ...box, ...mono }} value={treasury} onChange={(e) => setTreasury(e.target.value)} placeholder="0x…" /></div>
        </div>
        <button className="btn btn-primary" disabled={suiteBusy || suiteDone} onClick={runSuite} style={{ alignSelf: "flex-start", display: "flex", gap: 6, alignItems: "center" }}>
          {suiteBusy ? <><Loader2 size={14} className="spin" />Deploying…</> : <><Rocket size={14} />Deploy everything</>}
        </button>
        {Object.keys(steps).length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {SUITE_STEPS.map((st) => {
              const x = steps[st.id]; const status = x?.status || "pending";
              return (
                <div key={st.id} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, opacity: status === "pending" ? .45 : 1 }}>
                  <span style={{ marginTop: 1 }}>{status === "done" ? <CheckCircle2 size={14} color="#16a34a" /> : status === "error" ? <XCircle size={14} color="#dc2626" /> : status === "running" ? <Loader2 size={14} className="spin" /> : <span style={{ display: "inline-block", width: 14 }}>·</span>}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: "var(--text)", fontWeight: 600 }}>{st.label}</div>
                    {x?.detail && <div style={{ ...mono, fontSize: 10.5, color: status === "error" ? "#dc2626" : "var(--text-4)", wordBreak: "break-all" }}>{x.detail}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {suiteErr && <div style={{ fontSize: 12, color: "#dc2626", display: "flex", gap: 6 }}><AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />{suiteErr}</div>}
        {suiteDone && <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>All contracts deployed and saved. Reloading with the new config…</div>}
      </div>

      {/* ── Remix-style workspace ── */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", overflowX: "auto" }}>
          {tabBtn("editor", "Editor")}{tabBtn("compile", "Compiler")}{tabBtn("deploy", `Deploy & Run${deployed.length ? ` (${deployed.length})` : ""}`)}
        </div>

        {tab === "editor" && (
          <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              {Object.keys(files).sort().map((n) => (
                <button key={n} onClick={() => setActive(n)} className="btn btn-ghost btn-sm" style={{ display: "flex", gap: 5, alignItems: "center", fontWeight: n === active ? 800 : 500, borderColor: n === active ? "var(--brand)" : undefined }}>
                  <FileCode size={11} />{n}{edits[n] !== undefined && bundled[n] !== undefined && edits[n] !== bundled[n] && <span style={{ color: "var(--brand)" }}>●</span>}
                </button>
              ))}
              <button className="btn btn-ghost btn-sm" onClick={newFile} title="New file"><Plus size={12} /></button>
              <button className="btn btn-ghost btn-sm" onClick={() => uploadRef.current?.click()} title="Upload .sol"><Upload size={12} /></button>
              <input ref={uploadRef} type="file" accept=".sol" multiple hidden onChange={(e) => onUpload(e.target.files)} />
            </div>
            {active && files[active] !== undefined ? (<>
              <textarea
                value={files[active]} onChange={(e) => setFile(active, e.target.value)} spellCheck={false} wrap="off"
                onKeyDown={(e) => { if (e.key === "Tab") { e.preventDefault(); const t = e.currentTarget, a = t.selectionStart; setFile(active, t.value.slice(0, a) + "    " + t.value.slice(t.selectionEnd)); requestAnimationFrame(() => (t.selectionStart = t.selectionEnd = a + 4)); } }}
                style={{ ...box, ...mono, fontSize: 12, lineHeight: 1.55, height: 420, resize: "vertical", whiteSpace: "pre", overflow: "auto" }}
              />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="btn btn-primary btn-sm" onClick={() => doCompile(true, [active])} disabled={busy || !s.buildPath} style={{ display: "flex", gap: 5, alignItems: "center" }}>
                  {busy ? <Loader2 size={13} className="spin" /> : <Play size={13} />}Compile {active}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => doCompile()} disabled={busy || !s.buildPath}>Compile all</button>
                {bundled[active] !== undefined && edits[active] !== undefined && edits[active] !== bundled[active] && (
                  <button className="btn btn-ghost btn-sm" onClick={() => delFile(active)} style={{ display: "flex", gap: 5, alignItems: "center" }}><RotateCcw size={12} />Reset to original</button>
                )}
                {bundled[active] === undefined && <button className="btn btn-ghost btn-sm" onClick={() => delFile(active)} style={{ display: "flex", gap: 5, alignItems: "center", color: "#dc2626" }}><Trash2 size={12} />Delete file</button>}
                {busy && <span style={{ fontSize: 11, color: "var(--text-4)", alignSelf: "center" }}>{status}</span>}
              </div>
            </>) : <p style={{ fontSize: 12, color: "var(--text-4)" }}>Loading files…</p>}
          </div>
        )}

        {tab === "compile" && (
          <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10 }}>
              <div>
                <label style={lab}>Compiler version</label>
                <select style={box} value={s.buildPath} onChange={(e) => { const b = versions.find((x) => x.path === e.target.value); if (b) setS({ ...s, buildPath: b.path, version: b.version }); }}>
                  {!versions.length && <option value="">{verErr || "Loading versions…"}</option>}
                  {shown.map((b) => <option key={b.path} value={b.path}>{b.longVersion}</option>)}
                </select>
                <label style={{ fontSize: 11, color: "var(--text-4)", display: "flex", gap: 6, marginTop: 5, alignItems: "center" }}><input type="checkbox" checked={nightly} onChange={(e) => setNightly(e.target.checked)} />Include nightly builds</label>
              </div>
              <div>
                <label style={lab}>EVM version</label>
                <select style={box} value={s.evmVersion} onChange={(e) => setS({ ...s, evmVersion: e.target.value })}>
                  {evmOptions.map((v) => <option key={v} value={v}>{v === "default" ? "compiler default" : v}</option>)}
                </select>
                <span style={{ fontSize: 10.5, color: "var(--text-4)" }}>Use <b>paris</b> for chains without PUSH0.</span>
              </div>
              <div>
                <label style={lab}>Optimization</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <label style={{ fontSize: 12, display: "flex", gap: 6, alignItems: "center", color: "var(--text)" }}><input type="checkbox" checked={s.optimizer} onChange={(e) => setS({ ...s, optimizer: e.target.checked })} />Enable</label>
                  <input type="number" min={1} max={1000000} value={s.runs} disabled={!s.optimizer} onChange={(e) => setS({ ...s, runs: Math.max(1, Number(e.target.value) || 200) })} style={{ ...box, width: 100 }} />
                  <span style={{ fontSize: 11, color: "var(--text-4)" }}>runs</span>
                </div>
                <label style={{ fontSize: 12, display: "flex", gap: 6, alignItems: "center", marginTop: 8, color: supportsViaIR(s.version || "0") ? "var(--text)" : "var(--text-4)" }}>
                  <input type="checkbox" disabled={!supportsViaIR(s.version || "0")} checked={s.viaIR && supportsViaIR(s.version || "0")} onChange={(e) => setS({ ...s, viaIR: e.target.checked })} />viaIR <span style={{ fontSize: 10.5, color: "var(--text-4)" }}>(0.8.13+, fixes “stack too deep”)</span>
                </label>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <button className="btn btn-primary btn-sm" onClick={() => doCompile(false, active ? [active] : undefined)} disabled={busy || !s.buildPath} style={{ display: "flex", gap: 5, alignItems: "center" }}>
                {busy ? <Loader2 size={13} className="spin" /> : <Play size={13} />}Compile {active}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => doCompile(false)} disabled={busy || !s.buildPath}>Compile all</button>
              {busy && <span style={{ fontSize: 11, color: "var(--text-4)" }}>{status}</span>}
              {result && !busy && <span style={{ fontSize: 11, color: result.ok ? "#16a34a" : "#dc2626", fontWeight: 700 }}>{result.ok ? `Compiled in ${(result.ms / 1000).toFixed(1)}s` : "Compilation failed"}</span>}
            </div>

            {result?.diagnostics.map((d, i) => (
              <pre key={i} style={{ ...mono, fontSize: 11, whiteSpace: "pre-wrap", margin: 0, padding: "8px 10px", borderRadius: "var(--r)", background: d.severity === "error" ? "rgba(220,38,38,.07)" : "rgba(217,119,6,.07)", border: `1px solid ${d.severity === "error" ? "rgba(220,38,38,.25)" : "rgba(217,119,6,.25)"}`, color: "var(--text-2, var(--text))", overflowX: "auto" }}>{d.message}</pre>
            ))}

            {result && result.contracts.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={lab}>Compiled contracts</span>
                {result.contracts.map((c) => {
                  const k = `${c.file}:${c.name}`; const big = c.deployedSize > 24576;
                  return (
                    <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", border: `1.5px solid ${sel === k ? "var(--brand)" : "var(--border)"}`, borderRadius: "var(--r)", flexWrap: "wrap" }}>
                      <button onClick={() => { setSel(k); setTab("deploy"); }} style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", flex: 1, minWidth: 140 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)" }}>{c.name} <span style={{ fontWeight: 400, fontSize: 11, color: "var(--text-4)" }}>{c.file}</span></div>
                        <div style={{ fontSize: 10.5, color: big ? "#dc2626" : "var(--text-4)" }}>{c.bytecode ? `${c.deployedSize.toLocaleString()} bytes${big ? " — over the 24 KB limit" : ""}` : "abstract / interface"}</div>
                      </button>
                      <button className="btn btn-ghost btn-sm" title="Copy ABI" onClick={() => navigator.clipboard?.writeText(JSON.stringify(c.abi))}><Copy size={11} /> ABI</button>
                      {c.bytecode && <button className="btn btn-ghost btn-sm" title="Copy bytecode" onClick={() => navigator.clipboard?.writeText(c.bytecode)}><Copy size={11} /> Bytecode</button>}
                      <button className="btn btn-ghost btn-sm" title="Download artifact" onClick={() => dl(`${c.name}.json`, JSON.stringify({ abi: c.abi, bytecode: c.bytecode }, null, 2))}><Download size={11} /></button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === "deploy" && (
          <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 14 }}>
            {!result?.contracts.length ? (
              <p style={{ fontSize: 12, color: "var(--text-4)", margin: 0 }}>Compile something first (Editor → Compile) to deploy it here.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <label style={lab}>Contract</label>
                  <select style={box} value={sel} onChange={(e) => setSel(e.target.value)}>
                    {result.contracts.filter((c) => c.bytecode).map((c) => <option key={`${c.file}:${c.name}`} value={`${c.file}:${c.name}`}>{c.name} — {c.file}</option>)}
                  </select>
                </div>
                {contract && inputs.map((p, i) => (
                  <div key={i}>
                    <label style={lab}>{p.name || `arg${i}`} <span style={{ textTransform: "none", fontWeight: 400 }}>({p.format("full")})</span></label>
                    <input style={{ ...box, ...mono }} value={args[i] ?? ""} onChange={(e) => setArgs((a) => a.map((x, j) => (j === i ? e.target.value : x)))} placeholder={p.type.endsWith("]") || p.type.startsWith("tuple") ? "JSON, e.g. [1,2]" : p.type} />
                  </div>
                ))}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10 }}>
                  {contract && ctorPayable(contract) && <div><label style={lab}>Value (USDC native)</label><input style={box} value={value} onChange={(e) => setValue(e.target.value)} placeholder="0" /></div>}
                  <div><label style={lab}>Gas limit (optional)</label><input style={box} value={gas} onChange={(e) => setGas(e.target.value.replace(/\D/g, ""))} placeholder="auto (estimate +20%)" /></div>
                </div>
                <button className="btn btn-primary" disabled={dBusy || !contract} onClick={deployOne} style={{ alignSelf: "flex-start", display: "flex", gap: 6, alignItems: "center" }}>
                  {dBusy ? <><Loader2 size={14} className="spin" />Deploying…</> : <><Rocket size={14} />Deploy {contract?.name}</>}
                </button>
                {dMsg && (
                  <div style={{ fontSize: 12, color: dMsg.ok ? "#16a34a" : "#dc2626", wordBreak: "break-all" }}>
                    {dMsg.text}{dMsg.tx && <> · <a href={txUrl(dMsg.tx)} target="_blank" rel="noreferrer" style={{ color: "var(--brand)" }}>view tx</a></>}
                  </div>
                )}
              </div>
            )}

            <div>
              <span style={lab}>Deployed contracts ({deployed.length})</span>
              {!deployed.length && <p style={{ fontSize: 12, color: "var(--text-4)", margin: 0 }}>Nothing deployed from this browser yet.</p>}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {deployed.map((d) => <Instance key={d.id} d={d} signer={signer} requireAuth={requireAuth} onRemove={() => setDeployed((x) => x.filter((y) => y.id !== d.id))} />)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ───────────────── interact with a deployed contract ─────────────────
function Instance({ d, signer, requireAuth, onRemove }: { d: Deployed; signer: ethers.Wallet | null; requireAuth: () => void; onRemove: () => void }) {
  const [open, setOpen] = useState(false);
  const fns = useMemo(() => {
    try { return ethers.Interface.from(d.abi).fragments.filter((f): f is ethers.FunctionFragment => f.type === "function"); } catch { return []; }
  }, [d.abi]);
  const reads = fns.filter((f) => f.stateMutability === "view" || f.stateMutability === "pure");
  const writes = fns.filter((f) => !(f.stateMutability === "view" || f.stateMutability === "pure"));
  return (
    <div style={{ border: "1.5px solid var(--border)", borderRadius: "var(--r)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 10px" }}>
        <button onClick={() => setOpen(!open)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0, textAlign: "left" }}>
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text)" }}>{d.name}</span>
          <span style={{ ...mono, fontSize: 11, color: "var(--text-4)", overflow: "hidden", textOverflow: "ellipsis" }}>{d.address}</span>
        </button>
        <CopyBtn text={d.address} />
        <a href={addressUrl(d.address)} target="_blank" rel="noreferrer" style={{ color: "var(--text-4)" }}><ExternalLink size={13} /></a>
        <button onClick={onRemove} title="Remove from list" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-4)" }}><Trash2 size={13} /></button>
      </div>
      {open && (
        <div style={{ borderTop: "1px solid var(--border)", padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          {[...writes, ...reads].map((f) => <FnRow key={f.format("sighash")} f={f} d={d} signer={signer} requireAuth={requireAuth} />)}
          {!fns.length && <span style={{ fontSize: 12, color: "var(--text-4)" }}>No public functions.</span>}
        </div>
      )}
    </div>
  );
}

function FnRow({ f, d, signer, requireAuth }: { f: ethers.FunctionFragment; d: Deployed; signer: ethers.Wallet | null; requireAuth: () => void }) {
  const isRead = f.stateMutability === "view" || f.stateMutability === "pure";
  const [vals, setVals] = useState<string[]>(() => f.inputs.map(() => ""));
  const [val, setVal] = useState("");
  const [out, setOut] = useState<{ ok: boolean; text: string; tx?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  async function run() {
    if (!signer) { requireAuth(); return; }
    setBusy(true); setOut(null);
    try {
      const c = new ethers.Contract(d.address, d.abi, signer);
      const args = f.inputs.map((p, i) => parseArg(p.type, vals[i] ?? ""));
      const key = f.format("sighash");
      if (isRead) {
        const r = await c.getFunction(key).staticCall(...args);
        setOut({ ok: true, text: JSON.stringify(r, (_k, v) => (typeof v === "bigint" ? v.toString() : v), 2) });
      } else {
        const overrides: Record<string, unknown> = {};
        if (f.payable && val) overrides.value = ethers.parseUnits(val, 18);
        const fn = c.getFunction(key);
        overrides.gasLimit = ((await fn.estimateGas(...args, overrides)) * 12n) / 10n;
        const tx = await fn(...args, overrides);
        await tx.wait();
        setOut({ ok: true, text: "Transaction confirmed", tx: tx.hash });
      }
    } catch (e) { setOut({ ok: false, text: explainError(e, "Call failed") }); }
    setBusy(false);
  }

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r)", background: isRead ? "rgba(2,132,199,.04)" : "rgba(217,119,6,.05)" }}>
      <button onClick={() => (f.inputs.length ? setOpen(!open) : run())} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: isRead ? "#0284c7" : "#d97706", minWidth: 40 }}>{isRead ? "READ" : f.payable ? "PAY" : "WRITE"}</span>
        <span style={{ ...mono, fontSize: 12, color: "var(--text)", flex: 1 }}>{f.name}({f.inputs.map((p) => p.type).join(",")})</span>
        {busy && <Loader2 size={12} className="spin" />}
      </button>
      {open && (
        <div style={{ padding: "0 10px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
          {f.inputs.map((p, i) => <input key={i} style={{ ...box, ...mono }} placeholder={`${p.name || "arg" + i} (${p.type})`} value={vals[i]} onChange={(e) => setVals((v) => v.map((x, j) => (j === i ? e.target.value : x)))} />)}
          {f.payable && <input style={box} placeholder="value (native USDC)" value={val} onChange={(e) => setVal(e.target.value)} />}
          <button className="btn btn-primary btn-sm" disabled={busy} onClick={run} style={{ alignSelf: "flex-start" }}>{isRead ? "Call" : "Send transaction"}</button>
        </div>
      )}
      {out && (
        <pre style={{ ...mono, fontSize: 11, margin: 0, padding: "8px 10px", borderTop: "1px solid var(--border)", whiteSpace: "pre-wrap", wordBreak: "break-all", color: out.ok ? "var(--text)" : "#dc2626" }}>
          {out.text}{out.tx && <> · <a href={txUrl(out.tx)} target="_blank" rel="noreferrer" style={{ color: "var(--brand)" }}>view tx</a></>}
        </pre>
      )}
    </div>
  );
}
