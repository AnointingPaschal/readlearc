/** Deploy helpers: single contract (Remix "Deploy") and the full Readlearc suite, all signed by the site wallet. */
import { ethers } from "ethers";
import type { CompiledContract } from "./compiler";

export type Signer = ethers.Wallet;

/** Parse one constructor / function argument typed as text into what ethers expects. */
export function parseArg(type: string, raw: string): unknown {
  const t = raw.trim();
  if (type.endsWith("]") || type.startsWith("tuple")) return JSON.parse(t || "[]");
  if (type === "bool") return t === "true" || t === "1";
  return t;
}
export function ctorInputs(c: CompiledContract): ethers.ParamType[] {
  const frag = c.abi.find((x) => x.type === "constructor");
  return frag ? ethers.Interface.from([frag]).deploy.inputs.map((i) => i) : [];
}
export const ctorPayable = (c: CompiledContract) => c.abi.find((x) => x.type === "constructor")?.stateMutability === "payable";

export interface DeployResult { address: string; txHash: string; blockNumber: number; gasUsed: string }

export async function deployContract(
  signer: Signer, c: CompiledContract, args: unknown[], opts: { value?: bigint; gasLimit?: bigint } = {},
): Promise<DeployResult> {
  if (!c.bytecode) throw new Error(`${c.name} has no bytecode (abstract contract or interface — it can't be deployed).`);
  const factory = new ethers.ContractFactory(c.abi, c.bytecode, signer);
  const dep = await factory.getDeployTransaction(...args, { value: opts.value });
  const gas = opts.gasLimit ?? ((await signer.estimateGas(dep)) * 12n) / 10n;
  const tx = await signer.sendTransaction({ ...dep, gasLimit: gas });
  const rc = await tx.wait();
  if (!rc || rc.status !== 1 || !rc.contractAddress) throw new Error("Deployment transaction failed");
  return { address: rc.contractAddress, txHash: tx.hash, blockNumber: rc.blockNumber, gasUsed: rc.gasUsed.toString() };
}

// ───────────────────── Readlearc suite ─────────────────────
export interface SuiteAddresses { roles: string; contentStore: string; social: string; monetization: string; payments: string; streamPay: string; startBlock: number }
export type StepStatus = "pending" | "running" | "done" | "error";
export interface Step { id: string; label: string; status: StepStatus; detail?: string }

export const SUITE_STEPS: { id: string; label: string }[] = [
  { id: "compile", label: "Compile contracts" },
  { id: "Roles", label: "Deploy Roles" },
  { id: "ContentStore", label: "Deploy ContentStore" },
  { id: "Social", label: "Deploy Social" },
  { id: "Monetization", label: "Deploy Monetization" },
  { id: "Payments", label: "Deploy Payments" },
  { id: "StreamPay", label: "Deploy StreamPay" },
  { id: "wire", label: "Link ContentStore → Monetization" },
  { id: "save", label: "Save addresses to Cloudflare KV" },
];

export async function deploySuite(opts: {
  signer: Signer;
  compiled: CompiledContract[];
  usdc: string;
  treasury: string;
  onStep: (id: string, status: StepStatus, detail?: string) => void;
  save: (a: SuiteAddresses) => Promise<void>;
}): Promise<SuiteAddresses> {
  const { signer, compiled, usdc, treasury, onStep } = opts;
  const pick = (n: string) => { const c = compiled.find((x) => x.name === n); if (!c) throw new Error(`${n} was not compiled`); return c; };
  const startBlock = await signer.provider!.getBlockNumber();
  const addr: Record<string, string> = {};
  const run = async (name: string, args: unknown[]) => {
    onStep(name, "running");
    try {
      const r = await deployContract(signer, pick(name), args);
      addr[name] = r.address;
      onStep(name, "done", r.address);
    } catch (e) { onStep(name, "error", (e as Error).message); throw e; }
  };
  await run("Roles", []);
  await run("ContentStore", [addr.Roles]);
  await run("Social", [addr.Roles]);
  await run("Monetization", [addr.Roles, addr.Social, addr.ContentStore]);
  await run("Payments", [usdc, addr.Roles, addr.ContentStore, addr.Monetization, treasury]);
  await run("StreamPay", [treasury]);

  onStep("wire", "running");
  try {
    const store = new ethers.Contract(addr.ContentStore, pick("ContentStore").abi, signer);
    const gas = ((await store.setMonetization.estimateGas(addr.Monetization)) * 12n) / 10n;
    await (await store.setMonetization(addr.Monetization, { gasLimit: gas })).wait();
    onStep("wire", "done");
  } catch (e) { onStep("wire", "error", (e as Error).message); throw e; }

  const result: SuiteAddresses = {
    roles: addr.Roles, contentStore: addr.ContentStore, social: addr.Social,
    monetization: addr.Monetization, payments: addr.Payments, streamPay: addr.StreamPay, startBlock,
  };
  onStep("save", "running");
  try { await opts.save(result); onStep("save", "done"); } catch (e) { onStep("save", "error", (e as Error).message); throw e; }
  return result;
}
