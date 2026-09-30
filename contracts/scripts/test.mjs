// End-to-end contract tests on an in-process ganache chain. Run: npm test
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import ganache from "ganache";
import { ethers } from "ethers";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const art = (n) => JSON.parse(fs.readFileSync(path.join(root, "artifacts", `${n}.json`), "utf8"));

const server = ganache.provider({ logging: { quiet: true }, chain: { allowUnlimitedContractSize: true }, wallet: { totalAccounts: 8, defaultBalance: 1000 } });
const provider = new ethers.BrowserProvider(server);
// ganache's gas estimation ignores SSTORE refunds / the 63⁄64 rule and sometimes under-estimates
// (seen as rare, random reverts on `delete`-heavy calls). Real nodes are accurate; pad for the test chain.
const _est = provider.estimateGas.bind(provider);
provider.estimateGas = async (tx) => ((await _est(tx)) * 13n) / 10n + 30_000n;
const signers = [];
for (let i = 0; i < 8; i++) signers.push(await provider.getSigner(i));
const [owner, alice, bob, carol, dave, treasury, admin2] = signers;
const A = (s) => s.address;

async function deploy(name, signer, ...args) {
  const { abi, bytecode } = art(name);
  const f = new ethers.ContractFactory(abi, bytecode, signer);
  const c = await f.deploy(...args);
  await c.waitForDeployment();
  return c;
}
const as = (c, s) => c.connect(s);
// Expected-revert helper: uses eth_call (staticCall) so the failure is a clean, catchable rejection.
async function reverts(fn, label) {
  try { await fn(); } catch { return; }
  assert.fail(`expected revert: ${label}`);
}
let passed = 0;
async function t(name, fn) {
  try { await fn(); } catch (e) { console.error("  ✗", name, "\n", String(e.stack || e).split("\n").filter(l => /test\.mjs/.test(l) || /Error/.test(l)).slice(0, 4).join("\n")); process.exit(1); }
  passed++; console.log("  ✓", name);
}

// ── Deploy the whole system ──────────────────────────────────────
const usdc = await deploy("MockUSDC", owner);
const roles = await deploy("Roles", owner);
const store = await deploy("ContentStore", owner, await roles.getAddress());
const social = await deploy("Social", owner, await roles.getAddress());
const mon = await deploy("Monetization", owner, await roles.getAddress(), await social.getAddress(), await store.getAddress());
const pay = await deploy("Payments", owner, await usdc.getAddress(), await roles.getAddress(), await store.getAddress(), await mon.getAddress(), A(treasury));
await (await store.setMonetization(await mon.getAddress())).wait();
await (await roles.setRole(A(admin2), 2)).wait();
for (const s of [alice, bob, carol, dave]) await (await usdc.mint(A(s), 100_000_000n)).wait(); // $100 each

const meta = (o = {}) => ({
  kind: 0, title: "Hello chain", blurb: "b", category: "Tech", slug: "", preview: "preview text", mime: "",
  price: 0n, readTime: 3, durationSecs: 0, freePreviewSecs: 0, isResearch: false, encrypted: false, ...o,
});
const bal = async (a) => usdc.balanceOf(a);

console.log("Roles");
await t("owner is super admin, granted admin works", async () => {
  assert.equal(await roles.roleOf(A(owner)), 3n);
  assert.equal(await roles.isAdmin(A(admin2)), true);
  assert.equal(await roles.isAdmin(A(alice)), false);
  await reverts(() => as(roles, alice).setRole.staticCall(A(bob), 2), "non-owner setRole");
});

console.log("ContentStore — on-chain articles & videos");
await t("create article -> pending; chunks stored as logs; finalize", async () => {
  await (await as(store, alice).create(meta())).wait();
  let c = await store.get(1);
  assert.equal(c.author, A(alice));
  assert.equal(c.status, 0n); // pending
  const body = ["<p>first chunk</p>", "<p>second chunk</p>"].map((s) => ethers.hexlify(ethers.toUtf8Bytes(s)));
  const tx = await as(store, alice).writeChunks(1, 0, body);
  await tx.wait();
  await (await as(store, alice).finalize(1, 2, ethers.keccak256(ethers.concat(body)))).wait();
  c = await store.get(1);
  assert.equal(c.finalized, true);
  assert.equal(c.chunkCount, 2n);
  // read the body back from logs, bounded by the stored block range
  const logs = await store.queryFilter(store.filters.Chunk(1n, 1n), Number(c.firstBlock), Number(c.lastBlock));
  assert.equal(logs.length, 2);
  assert.equal(ethers.toUtf8String(logs[1].args.data), "<p>second chunk</p>");
});
await t("only the author can write chunks / finalize", async () => {
  await reverts(() => as(store, bob).writeChunks.staticCall(1, 0, ["0x01"]), "bob writes");
  await reverts(() => as(store, alice).writeChunks.staticCall(1, 0, ["0x01"]), "write after finalize");
});
await t("moderation: mod approves, approvedCount tracks", async () => {
  assert.equal(await store.approvedCount(A(alice)), 0n);
  await reverts(() => as(store, bob).setStatus.staticCall(1, 1), "non-mod setStatus");
  await (await as(store, admin2).setStatus(1, 1)).wait();
  assert.equal(await store.approvedCount(A(alice)), 1n);
  await (await as(store, admin2).setFeatured(1, true)).wait();
  assert.equal((await store.get(1)).featured, true);
});
await t("rewrite bumps version and clears finalized", async () => {
  await (await as(store, alice).beginRewrite(1)).wait();
  let c = await store.get(1);
  assert.equal(c.version, 2n); assert.equal(c.finalized, false);
  await (await as(store, alice).writeChunks(1, 0, ["0x6162"])).wait();
  await (await as(store, alice).finalize(1, 1, ethers.ZeroHash)).wait();
  c = await store.get(1);
  const logs = await store.queryFilter(store.filters.Chunk(1n, 2n), Number(c.firstBlock), Number(c.lastBlock));
  assert.equal(logs.length, 1);
});
await t("video needs unique slug; thumbnail event", async () => {
  await reverts(() => as(store, alice).create.staticCall(meta({ kind: 1 })), "video without slug");
  await (await as(store, alice).create(meta({ kind: 1, slug: "my-vid", mime: "application/x-rl-hls", durationSecs: 60 }))).wait();
  await reverts(() => as(store, bob).create.staticCall(meta({ kind: 1, slug: "my-vid" })), "duplicate slug");
  assert.equal(await store.idBySlug("my-vid"), 2n);
  await (await as(store, alice).setThumb(2, "0xffd8ffe0")).wait();
  assert.equal((await store.get(2)).hasThumb, true);
});
await t("rejected content can be resubmitted by its author only", async () => {
  await (await as(store, admin2).setStatus(1, 2)).wait();
  await reverts(() => as(store, bob).resubmit.staticCall(1), "bob resubmits");
  await (await as(store, alice).resubmit(1)).wait();
  assert.equal((await store.get(1)).status, 0n);
  await (await as(store, admin2).setStatus(1, 1)).wait();
  await reverts(() => as(store, alice).resubmit.staticCall(1), "resubmit non-rejected");
});
await t("remove hides content and fixes counters", async () => {
  await (await as(store, admin2).setStatus(2, 1)).wait();
  assert.equal(await store.approvedCount(A(alice)), 2n);
  await (await as(store, alice).remove(2)).wait();
  assert.equal((await store.get(2)).status, 3n);
  assert.equal(await store.approvedCount(A(alice)), 1n);
});
await t("getCards returns light feed projections", async () => {
  const cards = await store.getCards(1, 99);
  assert.equal(cards.length, 2);
  assert.equal(cards[1].slug, "my-vid");
  assert.equal(cards[1].hasThumb, true);
});
await t("getRange returns a page", async () => {
  const [ids, items] = await store.getRange(1, 50);
  assert.equal(ids.length, 2);
  assert.equal(items[0].title, "Hello chain");
});

console.log("Monetization — all / auto / manual");
await t("default: nobody is monetized, paid publish is rejected", async () => {
  assert.equal(await mon.isMonetized(A(alice)), false);
  await reverts(() => as(store, alice).create.staticCall(meta({ price: 20_000n })), "paid publish when not monetized");
});
await t("MANUAL: admin approves a specific user; revoke/block works", async () => {
  await reverts(() => as(mon, alice).setStatus.staticCall(A(alice), 2), "non-admin approve");
  await (await as(mon, admin2).setStatus(A(alice), 2)).wait();
  assert.equal(await mon.isMonetized(A(alice)), true);
  assert.equal(await mon.reason(A(alice)), 2n);
  assert.equal(await mon.isMonetized(A(bob)), false);
  await (await as(mon, admin2).setStatus(A(alice), 4)).wait();
  assert.equal(await mon.isMonetized(A(alice)), false);
  await (await as(mon, admin2).setStatus(A(alice), 2)).wait();
});
await t("MANUAL: application flow (apply -> pending -> approved/rejected)", async () => {
  await (await as(mon, bob).apply_("please")).wait();
  assert.equal(await mon.status(A(bob)), 1n);
  await reverts(() => as(mon, bob).apply_.staticCall("again"), "double apply");
  await (await as(mon, admin2).setStatus(A(bob), 3)).wait();
  assert.equal(await mon.isMonetized(A(bob)), false);
  await (await as(mon, bob).apply_("reapply after rejection")).wait();
  await (await as(mon, admin2).setStatusBatch([A(bob)], 0)).wait();
});
await t("AUTO: thresholds (followers, posts, account age) grant monetization", async () => {
  await (await as(mon, admin2).setAutoRules(true, 2, 1, 0)).wait();
  // carol: has a profile, 0 followers, 0 posts
  await (await as(social, carol).setProfile("carol", "Carol", "", "#6d28d9", "", "")).wait();
  assert.equal(await mon.isMonetized(A(carol)), false);
  await (await as(social, alice).follow(A(carol))).wait();
  await (await as(social, bob).follow(A(carol))).wait();
  let [f, p, d] = await mon.autoProgress(A(carol));
  assert.deepEqual([f, p, d], [true, false, true]);
  await (await as(store, carol).create(meta({ title: "carol post" }))).wait();
  await (await as(store, admin2).setStatus(3, 1)).wait(); // approve carol's post (id 3)
  assert.equal(await mon.isMonetized(A(carol)), true);
  assert.equal(await mon.reason(A(carol)), 4n);
  // unfollow drops her below the bar again
  await (await as(social, bob).unfollow(A(carol))).wait();
  assert.equal(await mon.isMonetized(A(carol)), false);
  await (await as(mon, admin2).setAutoRules(false, 0, 0, 0)).wait();
});
await t("ALL: enabling for everyone monetizes everyone except blocked users", async () => {
  await (await as(mon, admin2).setEnabledForAll(true)).wait();
  assert.equal(await mon.isMonetized(A(dave)), true);
  assert.equal(await mon.reason(A(dave)), 3n);
  await (await as(mon, admin2).setStatus(A(dave), 4)).wait();
  assert.equal(await mon.isMonetized(A(dave)), false);
  await (await as(mon, admin2).setStatus(A(dave), 0)).wait();
  await (await as(mon, admin2).setEnabledForAll(false)).wait();
});

console.log("Payments — unlock, subscribe, tip");
const PRICE = 20_000n; // $0.02
let paidId;
await t("monetized author publishes a paid article", async () => {
  await (await as(store, alice).create(meta({ title: "Paid piece", price: PRICE, encrypted: true }))).wait();
  paidId = Number(await store.count());
  await (await as(store, alice).writeChunks(paidId, 0, ["0xaa"])).wait();
  await (await as(store, alice).finalize(paidId, 1, ethers.ZeroHash)).wait();
  await (await as(store, admin2).setStatus(paidId, 1)).wait();
});
await t("no access before paying; payToRead splits 85/10/5 with referrer", async () => {
  assert.equal(await pay.hasAccess(paidId, A(bob)), false);
  assert.equal(await pay.hasAccess(paidId, A(alice)), true); // author
  await (await as(usdc, bob).approve(await pay.getAddress(), 10n ** 9n)).wait();
  const [a0, t0, r0] = [await bal(A(alice)), await bal(A(treasury)), await bal(A(carol))];
  await (await as(pay, bob).payToRead(paidId, A(carol))).wait();
  assert.equal((await bal(A(alice))) - a0, 17_000n);
  assert.equal((await bal(A(treasury))) - t0, 2_000n);
  assert.equal((await bal(A(carol))) - r0, 1_000n);
  assert.equal(await pay.hasAccess(paidId, A(bob)), true);
  assert.equal(await pay.reads(paidId), 1n);
  assert.equal(await pay.earned(A(alice)), 17_000n);
});
await t("double pay and author self-pay are rejected", async () => {
  await reverts(() => as(pay, bob).payToRead.staticCall(paidId, ethers.ZeroAddress), "double pay");
  await reverts(() => as(pay, alice).payToRead.staticCall(paidId, ethers.ZeroAddress), "self pay");
});
await t("revoking monetization turns the article free (no one can be charged)", async () => {
  await (await as(mon, admin2).setStatus(A(alice), 4)).wait();
  assert.equal(await pay.hasAccess(paidId, A(dave)), true);
  await (await as(usdc, dave).approve(await pay.getAddress(), 10n ** 9n)).wait();
  await reverts(() => as(pay, dave).payToRead.staticCall(paidId, ethers.ZeroAddress), "pay when not monetized");
  await (await as(mon, admin2).setStatus(A(alice), 2)).wait();
  assert.equal(await pay.hasAccess(paidId, A(dave)), false);
});
await t("subscription unlocks all the creator's paid content and stacks renewals", async () => {
  await reverts(() => as(pay, dave).subscribe.staticCall(A(alice), 0), "no plan yet");
  await (await as(mon, alice).setPlan(5_000_000n, 50_000_000n, true)).wait();
  await (await as(usdc, dave).approve(await pay.getAddress(), 10n ** 9n)).wait();
  const a0 = await bal(A(alice));
  await (await as(pay, dave).subscribe(A(alice), 0)).wait();
  assert.equal((await bal(A(alice))) - a0, 4_900_000n); // 2% fee
  assert.equal(await pay.isSubscribed(A(alice), A(dave)), true);
  assert.equal(await pay.hasAccess(paidId, A(dave)), true);
  const e1 = await pay.subscriptionExpiry(A(alice), A(dave));
  await (await as(pay, dave).subscribe(A(alice), 0)).wait();
  const e2 = await pay.subscriptionExpiry(A(alice), A(dave));
  assert.equal(e2 - e1, BigInt(30 * 86400));
});
await t("non-monetized creators cannot enable plans or receive tips", async () => {
  await reverts(() => as(mon, carol).setPlan.staticCall(1n, 1n, true), "plan without monetization");
  await reverts(() => as(pay, dave).tip.staticCall(A(carol), 1000n, 0), "tip non-monetized");
});
await t("tip: 2% fee, event emitted", async () => {
  const a0 = await bal(A(alice)), t0 = await bal(A(treasury));
  await (await as(pay, dave).tip(A(alice), 1_000_000n, paidId)).wait();
  assert.equal((await bal(A(alice))) - a0, 980_000n);
  assert.equal((await bal(A(treasury))) - t0, 20_000n);
});
await t("admin can change splits/fees; invalid splits rejected", async () => {
  await reverts(() => as(pay, alice).setSplits.staticCall(9000, 500, 500), "non-admin");
  await reverts(() => as(pay, admin2).setSplits.staticCall(9000, 500, 600), "sum != 10000");
  await (await as(pay, admin2).setSplits(8000, 1500, 500)).wait();
  assert.equal(await pay.writerBps(), 8000n);
  await (await as(pay, admin2).setSplits(8500, 1000, 500)).wait();
});

console.log("Social — profiles, follows, comments, reactions, communities");
await t("profiles: unique lowercase usernames, rename frees old name", async () => {
  await (await as(social, alice).setProfile("alice", "Alice", "bio", "#111", "", "")).wait();
  await reverts(() => as(social, bob).setProfile.staticCall("alice", "x", "", "#111", "", ""), "username taken");
  await reverts(() => as(social, bob).setProfile.staticCall("Bad Name", "x", "", "#111", "", ""), "invalid chars");
  await (await as(social, alice).setProfile("alice2", "Alice", "bio", "#111", "", "")).wait();
  assert.equal(await social.addressOfUsername("alice"), ethers.ZeroAddress);
  await (await as(social, bob).setProfile("alice", "Bob", "", "#111", "", "")).wait();
  assert.equal((await social.profileOf(A(alice))).username, "alice2");
});
await t("batch reads: profilesOf / readsBatch", async () => {
  const ps = await social.profilesOf([A(alice), A(carol), A(owner)]);
  assert.equal(ps[0].username, "alice2"); assert.equal(ps[1].username, "carol"); assert.equal(ps[2].username, "");
  const rs = await pay.readsBatch([1, paidId]);
  assert.equal(rs[1], 1n);
});
await t("follow / unfollow counters and events", async () => {
  await (await as(social, dave).follow(A(alice))).wait();
  assert.equal(await social.followerCount(A(alice)), 1n);
  assert.equal(await social.isFollowing(A(dave), A(alice)), true);
  await reverts(() => as(social, dave).follow.staticCall(A(alice)), "double follow");
  await reverts(() => as(social, dave).follow.staticCall(A(dave)), "self follow");
  const ev = await social.queryFilter(social.filters.Followed(null, A(alice)));
  assert.equal(ev.length, 1);
  await (await as(social, dave).unfollow(A(alice))).wait();
  assert.equal(await social.followerCount(A(alice)), 0n);
});
await t("comments: thread, edit by author only, delete by mod", async () => {
  await (await as(social, bob).comment(paidId, "first!", 0)).wait();
  await (await as(social, carol).comment(paidId, "reply", 1)).wait();
  await reverts(() => as(social, carol).comment.staticCall(999, "bad parent", 1), "parent on other content");
  await reverts(() => as(social, carol).editComment.staticCall(1, "hijack"), "edit others");
  await (await as(social, bob).editComment(1, "first (edited)")).wait();
  await reverts(() => as(social, carol).deleteComment.staticCall(1), "non-mod delete");
  await (await as(social, admin2).deleteComment(1)).wait();
});
await t("reactions: one per user, switch moves the counter, clear works", async () => {
  await (await as(social, bob).react(paidId, 1)).wait();
  await (await as(social, carol).react(paidId, 1)).wait();
  await (await as(social, bob).react(paidId, 3)).wait();
  let c = await social.reactionCounts(paidId);
  assert.equal(c[1], 1n); assert.equal(c[3], 1n);
  await (await as(social, carol).react(paidId, 0)).wait();
  c = await social.reactionCounts(paidId);
  assert.equal(c[1], 0n);
  await reverts(() => as(social, bob).react.staticCall(paidId, 9), "bad key");
});
await t("communities: public join, private request/approve, posts, moderation", async () => {
  await (await as(social, alice).createGroup("Devs", "desc", "Tech", "", "be kind", "a,b", false)).wait();
  await (await as(social, alice).createGroup("Secret", "desc", "Tech", "", "", "", true)).wait();
  await reverts(() => as(social, bob).post.staticCall(1, "not a member", 0, "discussion"), "non-member post");
  await (await as(social, bob).join(1)).wait();
  await (await as(social, bob).post(1, "hello community", 0, "discussion")).wait();
  assert.equal((await social.getGroup(1)).memberCount, 2n);
  assert.equal((await social.getGroup(1)).postCount, 1n);
  await (await as(social, bob).join(2)).wait();
  assert.equal(await social.isMember(2, A(bob)), false); // pending
  await reverts(() => as(social, carol).approveMember.staticCall(2, A(bob)), "non-owner approve");
  await (await as(social, alice).approveMember(2, A(bob))).wait();
  assert.equal(await social.isMember(2, A(bob)), true);
  await reverts(() => as(social, alice).leave.staticCall(1), "owner cannot leave");
  await (await as(social, alice).removeMember(1, A(bob))).wait();
  assert.equal((await social.getGroup(1)).memberCount, 1n);
  await (await as(social, alice).likePost(1)).wait();
  await reverts(() => as(social, alice).likePost.staticCall(1), "double like");
  await reverts(() => as(social, carol).setPrivate.staticCall(1, true), "non-owner setPrivate");
  await (await as(social, alice).setPrivate(1, true)).wait();
  assert.equal((await social.getGroup(1)).isPrivate, true);
  await (await as(social, admin2).deleteGroup(2)).wait();
  assert.equal((await social.getGroup(2)).active, false);
});

console.log(`\n${passed} tests passed`);
await server.close?.();
process.exit(0);
