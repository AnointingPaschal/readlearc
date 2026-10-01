import { useCallback, useEffect, useRef, useState } from "react";
import type { ethers } from "ethers";
import { bankCall, type Cashout, type Deposit, type NgAccount, type WireLink, type Withdrawal, type BankConfig } from "@/lib/bank";

/** All the signed-in user's banking data. Loads once a signer is available; polls while a payout is processing. */
export function useBank(signer: ethers.Signer | null, cfg: BankConfig | null) {
  const [ng, setNg] = useState<NgAccount[]>([]);
  const [cashouts, setCashouts] = useState<Cashout[]>([]);
  const [wires, setWires] = useState<WireLink[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const gen = useRef(0);

  const refresh = useCallback(async () => {
    if (!signer || !cfg) return;
    const my = ++gen.current; setLoading(true); setError("");
    const safe = async <T,>(on: boolean, p: () => Promise<T[]>) => { if (!on) return [] as T[]; try { return await p(); } catch (e: any) { setError(e.message); return [] as T[]; } };
    const [a, c, w, d, x] = await Promise.all([
      safe(cfg.ngnConfigured, () => bankCall<{ data: NgAccount[] }>(signer, "GET", "/api/bank/ng/accounts").then((r) => r.data)),
      safe(cfg.ngnConfigured, () => bankCall<{ data: Cashout[] }>(signer, "GET", "/api/bank/ng/cashout").then((r) => r.data)),
      safe(cfg.circle, () => bankCall<{ data: WireLink[] }>(signer, "GET", "/api/bank/wires").then((r) => r.data)),
      safe(cfg.circle, () => bankCall<{ data: Deposit[] }>(signer, "GET", "/api/bank/deposits").then((r) => r.data)),
      safe(cfg.circle, () => bankCall<{ data: Withdrawal[] }>(signer, "GET", "/api/bank/withdrawals").then((r) => r.data)),
    ]);
    if (my !== gen.current) return;
    setNg(a); setCashouts(c); setWires(w); setDeposits(d); setWithdrawals(x); setLoading(false);
  }, [signer, cfg]);

  useEffect(() => { void refresh(); }, [refresh]);
  // keep an eye on payouts that are still in flight
  useEffect(() => {
    if (!cashouts.some((c) => c.status === "processing")) return;
    const t = setInterval(refresh, 15000);
    return () => clearInterval(t);
  }, [cashouts, refresh]);

  return { ng, setNg, cashouts, wires, setWires, deposits, withdrawals, loading, error, refresh };
}
export type BankData = ReturnType<typeof useBank>;
