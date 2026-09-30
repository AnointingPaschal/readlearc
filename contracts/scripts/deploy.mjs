// Deploys the full Readlearc contract suite and wires it together.
//
//   DEPLOYER_PRIVATE_KEY=0x... RPC_URL=https://rpc.mainnet.arc.io \
//   TREASURY_ADDRESS=0x... npm run deploy
//
// Optional: USDC_ADDRESS (default: Arc's 0x3600…0000 USDC predeploy), CHAIN_ID
// The deployer becomes the owner (super admin) of Roles. Output is written to
// contracts/deployments/<chainId>.json — paste the addresses into Admin → Finance → Contracts
// (stored in Cloudflare KV) or set the matching VITE_* variables.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ethers } from "ethers";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const art = (n) => JSON.parse(fs.readFileSync(path.join(root, "artifacts", `${n}.json`), "utf8"));

const rpc = process.env.RPC_URL || "https://rpc.mainnet.arc.io";
const pk = process.env.DEPLOYER_PRIVATE_KEY;
if (!pk) { console.error("Set DEPLOYER_PRIVATE_KEY"); process.exit(1); }
const provider = new ethers.JsonRpcProvider(rpc, undefined, { cacheTimeout: -1 });
const wallet = new ethers.Wallet(pk, provider);
const net = await provider.getNetwork();
const usdc = process.env.USDC_ADDRESS || "0x3600000000000000000000000000000000000000";
const treasury = process.env.TREASURY_ADDRESS || wallet.address;

const startBlock = await provider.getBlockNumber();
console.log(`Deployer ${wallet.address}  chain ${net.chainId}  rpc ${rpc}`);
console.log(`USDC ${usdc}  treasury ${treasury}\n`);

async function deploy(name, ...args) {
  const { abi, bytecode } = art(name);
  const c = await new ethers.ContractFactory(abi, bytecode, wallet).deploy(...args);
  await c.waitForDeployment();
  const addr = await c.getAddress();
  console.log(`${name.padEnd(13)} ${addr}`);
  return c;
}

const roles = await deploy("Roles");
const store = await deploy("ContentStore", await roles.getAddress());
const social = await deploy("Social", await roles.getAddress());
const mon = await deploy("Monetization", await roles.getAddress(), await social.getAddress(), await store.getAddress());
const pay = await deploy("Payments", usdc, await roles.getAddress(), await store.getAddress(), await mon.getAddress(), treasury);
const stream = await deploy("StreamPay", treasury);

await (await store.setMonetization(await mon.getAddress())).wait();
console.log("\nContentStore.setMonetization ✓");

const out = {
  chainId: Number(net.chainId),
  rpcUrl: rpc,
  usdc,
  treasury,
  startBlock,
  deployer: wallet.address,
  roles: await roles.getAddress(),
  contentStore: await store.getAddress(),
  social: await social.getAddress(),
  monetization: await mon.getAddress(),
  payments: await pay.getAddress(),
  streamPay: await stream.getAddress(),
  deployedAt: new Date().toISOString(),
};
fs.mkdirSync(path.join(root, "deployments"), { recursive: true });
const file = path.join(root, "deployments", `${net.chainId}.json`);
fs.writeFileSync(file, JSON.stringify(out, null, 2));
console.log(`\nSaved ${file}\n`);
console.log("Paste into Admin → Finance → Contracts, or set:");
console.log(`VITE_CHAIN_ID=${out.chainId}\nVITE_START_BLOCK=${startBlock}\nVITE_RPC_URL=${rpc}\nVITE_USDC_ADDRESS=${usdc}`);
console.log(`VITE_ROLES_ADDRESS=${out.roles}\nVITE_CONTENT_STORE_ADDRESS=${out.contentStore}\nVITE_SOCIAL_ADDRESS=${out.social}`);
console.log(`VITE_MONETIZATION_ADDRESS=${out.monetization}\nVITE_PAYMENTS_ADDRESS=${out.payments}\nVITE_STREAM_PAY_ADDRESS=${out.streamPay}`);
