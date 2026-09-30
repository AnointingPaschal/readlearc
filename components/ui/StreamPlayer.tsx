"use client";
/**
 * StreamPlayer
 * Pay-per-second HLS video player wired to the StreamPay contract.
 *
 * Flow:
 *  1. On mount: calls openSession() on StreamPay with msg.value = deposit.
 *  2. Registers the session with POST /api/stream/session/register.
 *  3. Every second of playback: signs a voucher with the session key
 *     and sends it to POST /api/stream/session/[id]/heartbeat.
 *  4. On pause/unmount: calls closeSession() on-chain.
 *  5. On close: calls POST /api/stream/session/[id]/close to record earnings.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { ethers } from "ethers";
import {
  Play, Pause, Volume2, VolumeX, Maximize2, Loader2,
  DollarSign, Clock, Zap, AlertCircle, CheckCircle2,
} from "lucide-react";
import { useAuth } from "../../lib/auth";
import { STREAM_PAY_ADDRESS, usdcRateToNative, nativeToUsdc, txUrl } from "../../lib/arc";
import { STREAM_PAY_ABI } from "../../lib/contracts";
import { generateSessionKey, signVoucher, calcAmountOwed } from "../../lib/stream-channel";

interface Props {
  slug:             string;
  title:            string;
  creatorAddress:   string;
  pricePerSecUsdc:  string;   // e.g. "0.0001"
  durationSeconds:  number;
  freePreviewSecs:  number;
  hlsMasterUrl:     string;
}

type Phase = "idle" | "opening" | "open" | "free" | "closing" | "closed" | "error";

export default function StreamPlayer({
  slug, title, creatorAddress, pricePerSecUsdc, durationSeconds, freePreviewSecs, hlsMasterUrl,
}: Props) {
  const { signer, isAuth, requireAuth } = useAuth();
  const videoRef   = useRef<HTMLVideoElement>(null);
  const tickRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionRef = useRef<{ id: string; key: string; rateNative: bigint; deposit: bigint } | null>(null);

  const [phase,          setPhase]          = useState<Phase>("idle");
  const [playing,        setPlaying]        = useState(false);
  const [muted,          setMuted]          = useState(false);
  const [currentTime,    setCurrentTime]    = useState(0);
  const [elapsed,        setElapsed]        = useState(0);      // paid seconds
  const [spentUsdc,      setSpentUsdc]      = useState("0.000000");
  const [openTxHash,     setOpenTxHash]     = useState("");
  const [closeTxHash,    setCloseTxHash]    = useState("");
  const [error,          setError]          = useState("");
  const isFree = pricePerSecUsdc === "0" || parseFloat(pricePerSecUsdc) === 0;

  // ── Cleanup ticker on unmount ─────────────────────────────────
  useEffect(() => {
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, []);

  // ── Open session ──────────────────────────────────────────────
  const openSession = useCallback(async () => {
    if (!signer || !isAuth) { requireAuth(); return; }
    if (phase !== "idle") return;

    setPhase("opening");
    setError("");

    try {
      const sessionKey   = generateSessionKey();
      const rateNative   = usdcRateToNative(pricePerSecUsdc || "0.0001");
      // Deposit: cover full video + 10% buffer
      const depositSecs  = Math.ceil(durationSeconds * 1.1) || 120;
      const deposit      = rateNative * BigInt(depositSecs);

      const contract = new ethers.Contract(STREAM_PAY_ADDRESS, STREAM_PAY_ABI, signer);
      const tx = await contract.openSession(
        creatorAddress,
        rateNative,
        sessionKey.publicAddress,
        { value: deposit }
      );
      const receipt = await tx.wait();
      setOpenTxHash(tx.hash);

      // Extract sessionId from event
      let sessionId = "";
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed?.name === "SessionOpened") {
            sessionId = parsed.args.sessionId;
            break;
          }
        } catch {}
      }
      if (!sessionId) throw new Error("Could not extract sessionId from receipt");

      // Register with backend
      const regRes = await fetch("/api/stream/session/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ sessionId, videoSlug: slug, openTxHash: tx.hash }),
      });
      if (!regRes.ok) throw new Error("Session registration failed");

      sessionRef.current = { id: sessionId, key: sessionKey.privateKey, rateNative, deposit };
      setPhase("open");

      // Start playback
      if (videoRef.current) {
        videoRef.current.src = hlsMasterUrl;
        await videoRef.current.play();
        setPlaying(true);
        startTicker();
      }
    } catch (e: any) {
      setError(e.message || "Failed to open session");
      setPhase("error");
    }
  }, [signer, isAuth, phase, pricePerSecUsdc, durationSeconds, creatorAddress, slug, hlsMasterUrl]);

  // ── Start free preview ────────────────────────────────────────
  const startFreePreview = useCallback(async () => {
    if (!videoRef.current) return;
    setPhase("free");
    videoRef.current.src = hlsMasterUrl;
    await videoRef.current.play().catch(() => {});
    setPlaying(true);
  }, [hlsMasterUrl]);

  // ── Ticker — fires every second ───────────────────────────────
  function startTicker() {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(async () => {
      const s = sessionRef.current;
      if (!s) return;

      setElapsed(prev => {
        const next = prev + 1;
        const amountOwed = calcAmountOwed(s.rateNative, next);

        // Sign and send voucher
        signVoucher(s.key, s.id, amountOwed, next).then(signed => {
          fetch(`/api/stream/session/${s.id}/heartbeat`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({
              amountOwed:    amountOwed.toString(),
              secondsWatched: next,
              signature:     signed.signature,
            }),
          }).catch(console.error);
        });

        setSpentUsdc(nativeToUsdc(amountOwed));
        return next;
      });
    }, 1000);
  }

  // ── Close session ─────────────────────────────────────────────
  const closeSession = useCallback(async () => {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    const s = sessionRef.current;
    if (!s || phase !== "open") return;

    setPhase("closing");
    if (videoRef.current) { videoRef.current.pause(); setPlaying(false); }

    try {
      const amountOwed = calcAmountOwed(s.rateNative, elapsed);
      const signed     = await signVoucher(s.key, s.id, amountOwed, elapsed);

      const contract = new ethers.Contract(STREAM_PAY_ADDRESS, STREAM_PAY_ABI, signer!);
      const tx = await contract.closeSession(s.id, amountOwed, signed.signature);
      await tx.wait();
      setCloseTxHash(tx.hash);

      // Record earnings
      await fetch(`/api/stream/session/${s.id}/close`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          closeTxHash:     tx.hash,
          amountOwedNative: amountOwed.toString(),
          secondsWatched:  elapsed,
        }),
      }).catch(console.error);

      setPhase("closed");
    } catch (e: any) {
      setError(e.message || "Failed to close session");
      setPhase("error");
    }
  }, [phase, elapsed, signer]);

  // ── Handle free preview ending ────────────────────────────────
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const fn = () => {
      if (phase === "free" && v.currentTime >= freePreviewSecs) {
        v.pause();
        setPlaying(false);
        setPhase("idle");
      }
    };
    v.addEventListener("timeupdate", fn);
    return () => v.removeEventListener("timeupdate", fn);
  }, [phase, freePreviewSecs]);

  // ── Play / pause ──────────────────────────────────────────────
  function togglePlay() {
    if (!videoRef.current) return;
    if (phase === "idle" || phase === "error") {
      if (isFree || freePreviewSecs > 0) {
        startFreePreview();
      } else {
        openSession();
      }
      return;
    }
    if (phase === "free" && currentTime >= freePreviewSecs) {
      openSession();
      return;
    }
    if (phase === "open") {
      if (playing) {
        videoRef.current.pause();
        setPlaying(false);
        if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
      } else {
        videoRef.current.play().catch(() => {});
        setPlaying(true);
        startTicker();
      }
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
      {(phase === "idle" || phase === "opening" || phase === "error") && (
        <div style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 16,
          background: "rgba(0,0,0,.72)", color: "#fff",
        }}>
          {phase === "opening" && <Loader2 size={36} style={{ animation: "spin 1s linear infinite" }} />}
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
          {phase === "opening" && <p style={{ fontSize: 13, opacity: .7 }}>Opening session on Arc Mainnet…</p>}
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
