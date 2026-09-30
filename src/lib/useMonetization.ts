import { useCallback, useEffect, useState } from "react";
import { IS_CONFIGURED } from "@/lib/chain";
import { monetizationState, type MonState } from "@/lib/onchain/money";

/** Live monetization eligibility of a wallet (read from the Monetization contract). */
export function useMonetization(address?: string) {
  const [state, setState] = useState<MonState | null>(null);
  const [loading, setLoading] = useState(false);
  const reload = useCallback(async () => {
    if (!address || !IS_CONFIGURED) { setState(null); return; }
    setLoading(true);
    try { setState(await monetizationState(address)); } catch { setState(null); }
    setLoading(false);
  }, [address]);
  useEffect(() => { reload(); }, [reload]);
  return { state, loading, monetized: !!state?.monetized, reload };
}
