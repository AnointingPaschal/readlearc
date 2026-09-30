/**
 * StreamPlayer — pay-per-second, fully on-chain video.
 *
 *  • The video (fMP4 HLS segments) lives in contract event logs; hls.js reads it through a custom
 *    `rl://` loader (see onchain/video.ts) and decrypts each segment with a key from the key server.
 *  • The key server releases keys for the free preview, then only for what a funded StreamPay
 *    session has paid for (verified against the chain + the session key's signed voucher).
 *  • Watching opens a StreamPay session (native USDC deposit). Every second a voucher is signed
 *    with a throw-away session key; stopping settles on-chain and refunds the unused deposit.
 *  • Subscribers to the creator (and the creator / admins) skip the meter entirely.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { ethers } from "ethers";
import {
  Play, Pause, Volume2, VolumeX, Maximize2, Loader2,
  Zap, AlertCircle, CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { C, explainError, send, usdcRateToNative, nativeToUsdc } from "@/lib/chain";
import { txUrl } from "@/lib/config";
import { getContent } from "@/lib/onchain/content";
import { loadManifest, makeChainLoader, type PlayerCtx, type VideoManifest } from "@/lib/onchain/video";
import { generateSessionKey, signVoucher, calcAmountOwed } from "@/lib/onchain/voucher";
import type { SessionProof } from "@/lib/onchain/keys";

interface Props {
  videoId:          number;
  title:            string;
  creatorAddress:   string;
  pricePerSecUsdc:  string;   // e.g. "0.0001"
  durationSeconds:  number;
  freePreviewSecs:  number;
}

type Phase = "idle" | "preparing" | "opening" | "open" | "free" | "closing" | "closed" | "error";

export default function StreamPlayer({
  videoId, title, creatorAddress, pricePerSecUsdc, durationSeconds, freePreviewSecs,
}: Props) {
  void title;
  const { signer, address, isAuth, requireAuth } = useAuth();
  const videoRef   = useRef<HTMLVideoElement>(null);
  const hlsRef     = useRef<import("hls.js").default | null>(null);
  const tickRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const proofRef   = useRef<SessionProof | undefined>(undefined);
  const sessionRef = useRef<{ id: string; key: string; rateNative: bigint; deposit: bigint } | null>(null);
  const elapsedRef = useRef(0);
  const manifestRef = useRef<VideoManifest | null>(null);
  const signerRef  = useRef(signer);
  signerRef.current = signer;

  const [phase,          setPhase]          = useState<Phase>("idle");
  const [playing,        setPlaying]        = useState(false);
  const [muted,          setMuted]          = useState(false);
  const [currentTime,    setCurrentTime]    = useState(0);
  const [elapsed,        setElapsed]        = useState(0);      // paid seconds
  const [spentUsdc,      setSpentUsdc]      = useState("0.000000");
  const [closeTxHash,    setCloseTxHash]    = useState("");
  const [error,          setError]          = useState("");
  const [free,           setFree]           = useState(false);  // no meter: free video / subscriber / owner
  const isFree = pricePerSecUsdc === "0" || parseFloat(pricePerSecUsdc) === 0;

  const teardown = useCallback(() => {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    hlsRef.current?.destroy(); hlsRef.current = null;
  }, []);
  useEffect(() => teardown, [teardown]);

  /** Load the manifest from chain and attach hls.js to the <video>. */
  const attach = useCallback(async () => {
    if (hlsRef.current) return;
    const v = videoRef.current;
    if (!v) return;
    const content = await getContent(videoId);
    if (!content) throw new Error("Video not found on-chain");
    const manifest = await loadManifest(content);
    manifestRef.current = manifest;
    const { default: Hls } = await import("hls.js");
    if (!Hls.isSupported()) throw new Error("This browser can't play HLS video (MediaSource unavailable).");
    const ctx: PlayerCtx = {
      content, manifest, signer: signerRef.current,
      getSession: () => proofRef.current,
      onDenied: () => {
        // paid-through point reached: pause and let the viewer top up / re-open
        v.pause(); setPlaying(false);
        if (!isFree && sessionRef.current == null) setPhase("idle");
      },
    };
    const Loader = makeChainLoader(ctx, Hls.DefaultConfig.loader as never);
    const hls = new Hls({ loader: Loader as never, enableWorker: false, maxBufferLength: 24, backBufferLength: 10, fragLoadPolicy: undefined });
    const playlist = await import("@/lib/onchain/video").then((m) => m.buildPlaylist(manifest));
    const blob = URL.createObjectURL(new Blob([playlist], { type: "application/vnd.apple.mpegurl" }));
    hls.loadSource(blob);
    hls.attachMedia(v);
    hlsRef.current = hls;
    await new Promise<void>((res, rej) => {
      hls.once(Hls.Events.MANIFEST_PARSED, () => res());
      hls.on(Hls.Events.ERROR, (_e, d) => { if (d.fatal) rej(new Error(d.details || "Playback error")); });
    });
  }, [videoId, isFree]);

  /** Is this viewer exempt from the meter? (free video, subscriber, creator, admin) */
  const checkFree = useCallback(async (): Promise<boolean> => {
    if (isFree) return true;
    if (!address) return false;
    if (address.toLowerCase() === creatorAddress.toLowerCase()) return true;
    try {
      if (await C.pay().isSubscribed(creatorAddress, address)) return true;
      if (await C.roles().isAdmin(address)) return true;
    } catch { /* ignore */ }
    return false;
  }, [isFree, address, creatorAddress]);

  // ── Open session ──────────────────────────────────────────────
  const openSession = useCallback(async () => {
    if (!signer || !isAuth) { requireAuth(); return; }
    setPhase("opening");
    setError("");
    try {
      const sessionKey = generateSessionKey();
      const rateNative = usdcRateToNative(pricePerSecUsdc || "0.0001");
      const depositSecs = Math.ceil(durationSeconds * 1.1) || 120;
      const deposit = rateNative * BigInt(depositSecs);
      const pay = C.stream(signer);
      const rc = await send(pay.openSession(creatorAddress, rateNative, sessionKey.publicAddress, { value: deposit }));
      let sessionId = "";
      for (const log of rc.logs) {
        try { const p = pay.interface.parseLog(log); if (p?.name === "SessionOpened") { sessionId = p.args.sessionId; break; } } catch { /* other log */ }
      }
      if (!sessionId) throw new Error("Could not read the session id from the receipt");
      sessionRef.current = { id: sessionId, key: sessionKey.privateKey, rateNative, deposit };
      elapsedRef.current = Math.floor(videoRef.current?.currentTime || 0);
      await pushVoucher(elapsedRef.current);
      setPhase("open");
      await attach();
      const v = videoRef.current!;
      await v.play();
      setPlaying(true);
      startTicker();
    } catch (e) {
      setError(explainError(e, "Failed to open session"));
      setPhase("error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signer, isAuth, pricePerSecUsdc, durationSeconds, creatorAddress, attach]);

  async function pushVoucher(seconds: number) {
    const s = sessionRef.current;
    if (!s) return;
    const owed = calcAmountOwed(s.rateNative, seconds);
    const capped = owed > s.deposit ? s.deposit : owed;
    proofRef.current = { id: s.id, amountOwed: capped.toString(), signature: await signVoucher(s.key, s.id, capped) };
    setSpentUsdc(nativeToUsdc(capped));
  }

  // ── Start free preview / unmetered playback ───────────────────
  const startFreePreview = useCallback(async (unmetered = false) => {
    setPhase("preparing"); setError("");
    try {
      await attach();
      setFree(unmetered);
      setPhase(unmetered ? "free" : "free");
      await videoRef.current!.play().catch(() => {});
      setPlaying(true);
    } catch (e) { setError(explainError(e, "Could not load video")); setPhase("error"); }
  }, [attach]);

  // ── Ticker — fires every second of *watched* time ────────────
  function startTicker() {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      const v = videoRef.current;
      if (!v || v.paused) return;
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
      pushVoucher(elapsedRef.current).catch(console.error);
    }, 1000);
  }

  // ── Close session (settles on-chain, refunds the unused deposit) ──
  const closeSession = useCallback(async () => {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    const s = sessionRef.current;
    if (!s || !signer) return;
    setPhase("closing");
    if (videoRef.current) { videoRef.current.pause(); setPlaying(false); }
    try {
      const owed = BigInt(proofRef.current?.amountOwed ?? "0");
      const sig = proofRef.current?.signature ?? (await signVoucher(s.key, s.id, 0n));
      const rc = await send(C.stream(signer).closeSession(s.id, owed, sig));
      setCloseTxHash(rc.hash);
      sessionRef.current = null; proofRef.current = undefined;
      setPhase("closed");
    } catch (e) {
      setError(explainError(e, "Failed to close session"));
      setPhase("error");
    }
  }, [signer]);

  // ── Handle free preview ending ────────────────────────────────
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const fn = () => {
      if (phase === "free" && !free && v.currentTime >= freePreviewSecs) {
        v.pause();
        setPlaying(false);
        setPhase("idle");
      }
    };
    v.addEventListener("timeupdate", fn);
    return () => v.removeEventListener("timeupdate", fn);
  }, [phase, freePreviewSecs, free]);

  // ── Play / pause ──────────────────────────────────────────────
  async function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (phase === "idle" || phase === "error") {
      if (await checkFree()) { startFreePreview(true); return; }
      const previewLeft = freePreviewSecs > 0 && v.currentTime < freePreviewSecs && !sessionRef.current;
      if (previewLeft) startFreePreview(false); else openSession();
      return;
    }
    if (phase === "free" && !free && currentTime >= freePreviewSecs) { openSession(); return; }
    if (phase === "free") { if (playing) { v.pause(); setPlaying(false); } else { v.play().catch(() => {}); setPlaying(true); } return; }
    if (phase === "open") {
      if (playing) { v.pause(); setPlaying(false); }
      else { v.play().catch(() => {}); setPlaying(true); startTicker(); }
    }
  }

  function toggleMute() {
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    setMuted(!muted);
  }

  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  const paidPct  = durationSeconds > 0 ? Math.min(100, (elapsed / durationSeconds) * 100) : 0;

  return (
    <div style={{ borderRadius: "var(--r-lg)", overflow: "hidden", background: "#000", position: "relative", border: "1px solid var(--border)" }}>

      {/* Video element */}
      <video
        ref={videoRef}
        style={{ width: "100%", display: "block", maxHeight: 480, background: "#000" }}
        playsInline
        onTimeUpdate={e => setCurrentTime((e.target as HTMLVideoElement).currentTime)}
        onEnded={() => { if (phase === "open") closeSession(); }}
      />

      {/* Overlay: loading / error / idle states */}
      {(phase === "idle" || phase === "opening" || phase === "preparing" || phase === "error") && (
        <div style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 16,
          background: "rgba(0,0,0,.72)", color: "#fff",
        }}>
          {(phase === "opening" || phase === "preparing") && <Loader2 size={36} style={{ animation: "spin 1s linear infinite" }} />}
          {phase === "error"   && <AlertCircle size={36} color="#ef4444" />}
          {phase === "idle"    && (
            <>
              <button
                onClick={togglePlay}
                style={{
                  width: 72, height: 72, borderRadius: "50%",
                  background: "var(--brand)", border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <Play size={30} color="#fff" />
              </button>
              {!isFree && (
                <p style={{ fontSize: 13, opacity: .8, textAlign: "center", maxWidth: 260 }}>
                  {freePreviewSecs > 0
                    ? `${freePreviewSecs}s free preview · then $${pricePerSecUsdc}/s`
                    : `$${pricePerSecUsdc} / second`}
                </p>
              )}
            </>
          )}
          {phase === "opening" && <p style={{ fontSize: 13, opacity: .7 }}>Opening pay-per-second session on-chain…</p>}
          {phase === "preparing" && <p style={{ fontSize: 13, opacity: .7 }}>Reading video from the blockchain…</p>}
          {phase === "error"   && <p style={{ fontSize: 13, color: "#fca5a5", textAlign: "center", maxWidth: 300 }}>{error}</p>}
        </div>
      )}

      {/* Settled overlay */}
      {phase === "closed" && (
        <div style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 12,
          background: "rgba(0,0,0,.72)", color: "#fff",
        }}>
          <CheckCircle2 size={36} color="#10b981" />
          <p style={{ fontSize: 14, fontWeight: 700 }}>Session settled</p>
          <p style={{ fontSize: 12, opacity: .7 }}>You watched {elapsed}s · paid ${spentUsdc} USDC</p>
          {closeTxHash && (
            <a href={txUrl(closeTxHash)} target="_blank" rel="noreferrer"
              style={{ fontSize: 11, color: "var(--brand-l)", opacity: .85 }}>
              View settlement →
            </a>
          )}
        </div>
      )}

      {/* Controls bar */}
      {(phase === "open" || phase === "free" || phase === "closing") && (
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          background: "linear-gradient(0deg,rgba(0,0,0,.85),transparent)",
          padding: "40px 16px 12px",
        }}>
          {/* Progress */}
          <div style={{ width: "100%", height: 3, background: "rgba(255,255,255,.2)", borderRadius: 99, marginBottom: 10 }}>
            <div style={{ width: `${paidPct}%`, height: "100%", background: "var(--accent)", borderRadius: 99, transition: "width .5s" }} />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={togglePlay} style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", padding: 0 }}>
              {playing ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <button onClick={toggleMute} style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", padding: 0 }}>
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,.7)", fontFamily: "JetBrains Mono,monospace" }}>
              {fmtTime(currentTime)} / {fmtTime(durationSeconds)}
            </span>
            <div style={{ flex: 1 }} />
            {phase === "open" && (
              <span style={{ fontSize: 11, color: "#34d399", fontFamily: "JetBrains Mono,monospace", display: "flex", alignItems: "center", gap: 4 }}>
                <Zap size={10} />${ spentUsdc } USDC
              </span>
            )}
            {phase === "open" && (
              <button
                onClick={closeSession}
                style={{ fontSize: 11, padding: "3px 10px", borderRadius: 99, background: "rgba(239,68,68,.15)", border: "1px solid rgba(239,68,68,.4)", color: "#fca5a5", cursor: "pointer" }}
              >
                Stop &amp; Settle
              </button>
            )}
            <button
              onClick={() => videoRef.current?.requestFullscreen()}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", padding: 0 }}
            >
              <Maximize2 size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
