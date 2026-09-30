// Compiles every contract with solc-js and writes ABIs + bytecode.
//  - contracts/artifacts/<Name>.json   (abi + bytecode, used by deploy/tests)
//  - ../src/abi/<Name>.json            (abi only, bundled into the web app)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import solc from "solc";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const files = {
  Roles: "Roles.sol",
  ContentStore: "ContentStore.sol",
  Social: "Social.sol",
  Monetization: "Monetization.sol",
  Payments: "Payments.sol",
  StreamPay: "StreamPay.sol",
  MockUSDC: "test/MockUSDC.sol",
};
const sources = {};
for (const f of Object.values(files)) sources[f] = { content: fs.readFileSync(path.join(root, f), "utf8") };

const input = {
  language: "Solidity",
  sources,
  settings: {
    viaIR: true,
    evmVersion: "paris", // widest EVM compatibility (no PUSH0 / MCOPY)
    optimizer: { enabled: true, runs: 200 },
    outputSelection: { "*": { "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object"] } },
  },
};
const out = JSON.parse(solc.compile(JSON.stringify(input)));
let failed = false;
for (const e of out.errors || []) {
  if (e.severity === "error") failed = true;
  if (e.severity === "error" || !/SPDX|Unused|shadow/.test(e.message)) console.error(e.formattedMessage);
}
if (failed) process.exit(1);

fs.mkdirSync(path.join(root, "artifacts"), { recursive: true });
const abiDir = path.join(root, "..", "src", "abi");
fs.mkdirSync(abiDir, { recursive: true });
for (const [name, file] of Object.entries(files)) {
  const c = out.contracts[file][name];
  const bytecode = "0x" + c.evm.bytecode.object;
  const size = (c.evm.deployedBytecode.object.length / 2);
  fs.writeFileSync(path.join(root, "artifacts", `${name}.json`), JSON.stringify({ abi: c.abi, bytecode }, null, 2));
  if (name !== "MockUSDC") fs.writeFileSync(path.join(abiDir, `${name}.json`), JSON.stringify(c.abi));
  console.log(`${name.padEnd(13)} ${size} bytes${size > 24576 ? "  ⚠ exceeds 24KB limit" : ""}`);
}
