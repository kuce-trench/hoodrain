/**
 * HoodRain — Merkle Tree Generator
 *
 * Reads all holders of a token on Robinhood Chain,
 * computes proportional ETH shares, builds a Merkle tree,
 * and outputs the root + proofs needed to call createRain().
 *
 * Usage:
 *   node scripts/generate-rain.js <tokenAddress> <totalEthGross>
 *
 * Example:
 *   node scripts/generate-rain.js 0x1234...abcd 0.5
 *
 *   → Sends 0.5 ETH total (0.005 ETH fee, 0.495 ETH to holders)
 *   → Outputs: rain-0x1234abcd-1234567890.json
 */

require("dotenv").config();
const { ethers } = require("ethers");
const { MerkleTree } = require("merkletreejs");
const fs = require("fs");

// ── Minimal ERC20 ABI ─────────────────────────────────────────────────────────

const ERC20_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "function balanceOf(address) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
];

// ── Config ────────────────────────────────────────────────────────────────────

const RPC_URL    = process.env.RPC_URL || "https://rpc.mainnet.chain.robinhood.com";
const FEE_BPS    = 100n; // matches HoodRain contract (1%)
const CHUNK_SIZE = 2000; // blocks per RPC batch

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const tokenAddress = process.argv[2];
  const totalEthArg  = process.argv[3]; // gross ETH, e.g. "0.5"

  if (!tokenAddress || !totalEthArg) {
    console.error("Usage: node generate-rain.js <tokenAddress> <totalEthGross>");
    console.error("Example: node generate-rain.js 0x1234...abcd 0.5");
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const token    = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

  // ── Token info ───────────────────────────────────────────────────────────────
  const [name, symbol, decimals, totalSupply] = await Promise.all([
    token.name(),
    token.symbol(),
    token.decimals(),
    token.totalSupply(),
  ]);

  console.log("\n╔═══════════════════════════════════╗");
  console.log("║      HoodRain — Tree Generator    ║");
  console.log("╚═══════════════════════════════════╝\n");
  console.log(`Token:        ${name} (${symbol})`);
  console.log(`Address:      ${tokenAddress}`);
  console.log(`Total Supply: ${ethers.formatUnits(totalSupply, decimals)} ${symbol}`);

  // ── Compute ETH amounts ───────────────────────────────────────────────────
  const grossWei = ethers.parseEther(totalEthArg);
  const feeWei   = (grossWei * FEE_BPS) / 10_000n;
  const netWei   = grossWei - feeWei;

  console.log(`\nETH gross:    ${totalEthArg} ETH`);
  console.log(`Fee (1%):     ${ethers.formatEther(feeWei)} ETH`);
  console.log(`Net to holders: ${ethers.formatEther(netWei)} ETH`);

  // ── Scan all Transfer events to reconstruct holder balances ───────────────
  console.log("\nScanning Transfer events...");
  const currentBlock = await provider.getBlockNumber();
  const holders      = new Map(); // address → balance (BigInt)

  for (let fromBlock = 0; fromBlock <= currentBlock; fromBlock += CHUNK_SIZE) {
    const toBlock = Math.min(fromBlock + CHUNK_SIZE - 1, currentBlock);
    const events  = await token.queryFilter(
      token.filters.Transfer(),
      fromBlock,
      toBlock
    );

    for (const e of events) {
      const { from, to, value } = e.args;

      if (from !== ethers.ZeroAddress) {
        const bal = holders.get(from) ?? 0n;
        holders.set(from, bal - value < 0n ? 0n : bal - value);
      }
      if (to !== ethers.ZeroAddress) {
        const bal = holders.get(to) ?? 0n;
        holders.set(to, bal + value);
      }
    }

    process.stdout.write(`  Blocks ${fromBlock}–${toBlock} / ${currentBlock}\r`);
  }

  console.log(`\n\nUnique addresses found: ${holders.size}`);

  // ── Filter zero balances ──────────────────────────────────────────────────
  const qualified = [...holders.entries()]
    .filter(([, bal]) => bal > 0n)
    .sort((a, b) => (b[1] > a[1] ? 1 : -1));

  console.log(`Holders with balance > 0: ${qualified.length}`);

  // ── Compute proportional ETH shares ──────────────────────────────────────
  const totalQualSupply = qualified.reduce((sum, [, bal]) => sum + bal, 0n);

  let allocations = qualified.map(([address, balance]) => {
    // share = netWei * balance / totalQualSupply
    const share = (netWei * balance) / totalQualSupply;
    return { address, balance, share };
  });

  // Remove dust (shares too small to be worth claiming)
  const DUST_THRESHOLD = ethers.parseEther("0.00001"); // 0.00001 ETH
  allocations = allocations.filter(a => a.share >= DUST_THRESHOLD);
  console.log(`After dust filter (> 0.00001 ETH): ${allocations.length} holders`);

  // Fix rounding: any leftover goes to the largest holder
  const totalAllocated = allocations.reduce((sum, a) => sum + a.share, 0n);
  const rounding       = netWei - totalAllocated;
  if (rounding > 0n && allocations.length > 0) {
    allocations[0].share += rounding;
  }

  // ── Build Merkle tree ─────────────────────────────────────────────────────
  console.log("\nBuilding Merkle tree...");

  const leaves = allocations.map(({ address, share }) =>
    ethers.keccak256(
      ethers.solidityPacked(["address", "uint256"], [address, share])
    )
  );

  // Sort leaves for deterministic tree (matches OpenZeppelin's MerkleProof)
  const tree = new MerkleTree(leaves, ethers.keccak256, { sort: true });
  const root = tree.getHexRoot();

  console.log(`Merkle root: ${root}`);

  // ── Build output JSON ─────────────────────────────────────────────────────
  const output = {
    meta: {
      token:          tokenAddress,
      name,
      symbol,
      snapshotBlock:  currentBlock,
      snapshotTime:   new Date().toISOString(),
      grossEth:       totalEthArg,
      feeEth:         ethers.formatEther(feeWei),
      netEth:         ethers.formatEther(netWei),
      holderCount:    allocations.length,
    },
    merkleRoot: root,
    holders: allocations.map(({ address, balance, share }, i) => ({
      address,
      tokenBalance:    ethers.formatUnits(balance, decimals),
      ethShareEther:   ethers.formatEther(share),
      ethShareWei:     share.toString(),
      proof:           tree.getHexProof(leaves[i]),
    })),
  };

  const filename = `rain-${tokenAddress.slice(0, 10)}-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(output, null, 2));

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n╔═══════════════════════════════════╗");
  console.log("║           Done! ✅                ║");
  console.log("╚═══════════════════════════════════╝");
  console.log(`\nOutput file: ${filename}`);
  console.log(`\n📋 Next steps:`);
  console.log(`  1. Call createRain() on the HoodRain contract:`);
  console.log(`       token:      ${tokenAddress}`);
  console.log(`       merkleRoot: ${root}`);
  console.log(`       msg.value:  ${totalEthArg} ETH`);
  console.log(`  2. Publish the JSON file so holders can find their proofs`);
  console.log(`  3. Holders go to the app, connect wallet, and click Claim\n`);
}

main().catch((err) => {
  console.error("\n❌ Error:", err.message);
  process.exit(1);
});
