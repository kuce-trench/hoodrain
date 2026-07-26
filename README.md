# 🌧️ HoodRain

**ETH Distribution Protocol for Robinhood Chain**

> *"Make it rain ETH on your holders."*

[![Network](https://img.shields.io/badge/network-Robinhood%20Chain-green?style=flat-square)](https://robinhoodchain.blockscout.com)
[![Chain ID](https://img.shields.io/badge/chainId-4663-blue?style=flat-square)]()
[![License](https://img.shields.io/badge/license-MIT-orange?style=flat-square)](./LICENSE)

---

## What is HoodRain?

HoodRain lets anyone deposit ETH and distribute it proportionally to all holders of any ERC20 token on Robinhood Chain.

Unlike Pons Fork (which routes a token's own fee income), HoodRain is **open to anyone**:
- A project team can reward their community
- A whale can gift ETH to small holders of a token they love
- A DAO can pay dividends

One contract. Any token. Any amount of ETH. Anyone.

---

## How it works

```
1. Run the generator:
   node scripts/generate-rain.js 0xYOUR_TOKEN 0.5

   → Reads all token holders from Robinhood Chain
   → Computes each holder's proportional ETH share
   → Builds a Merkle tree
   → Outputs: merkleRoot + proof file

2. Call createRain(token, merkleRoot) with 0.5 ETH
   → Contract stores the ETH + root on-chain
   → 1% fee deducted, 99% for holders

3. Holders go to the app, connect wallet, click Claim
   → Contract verifies their Merkle proof
   → ETH sent directly to their wallet

4. After 30 days — creator can sweep unclaimed ETH
```

---

## Quick Start

```bash
git clone https://github.com/YOUR_USERNAME/hoodrain
cd hoodrain
npm install
cp .env.example .env
# Fill PRIVATE_KEY and FEE_RECIPIENT
```

**Compile:**
```bash
npm run compile
```

**Deploy to testnet:**
```bash
npm run deploy:testnet
```

**Generate a rain (snapshot + Merkle tree):**
```bash
npm run gen 0xTOKEN_ADDRESS 0.5
# → outputs rain-0xTOKEN-timestamp.json
```

---

## Contract: `createRain(token, merkleRoot)`

Send ETH with this call. 1% fee, rest stored for claims.

| Param | Type | What it is |
|---|---|---|
| `token` | `address` | Token whose holders receive ETH |
| `merkleRoot` | `bytes32` | Root from the generator script |
| `msg.value` | ETH | Total ETH to distribute (gross) |

## Contract: `claim(rainId, amount, proof[])`

Holders call this to receive their ETH.

| Param | Type | What it is |
|---|---|---|
| `rainId` | `uint256` | ID from the `RainCreated` event |
| `amount` | `uint256` | Your share in wei (from the JSON) |
| `proof` | `bytes32[]` | Your Merkle proof (from the JSON) |

---

## Network

| | |
|---|---|
| Chain | Robinhood Chain |
| Chain ID | `4663` |
| RPC | `https://rpc.mainnet.chain.robinhood.com` |
| Explorer | `https://robinhoodchain.blockscout.com` |
| Testnet RPC | `https://rpc.testnet.chain.robinhood.com` |
| Testnet faucet | `https://faucet.testnet.chain.robinhood.com` |

---

## Security

- `ReentrancyGuard` on all state-changing functions
- `MerkleProof` from OpenZeppelin — battle-tested
- Creator cannot change the Merkle root after `createRain()`
- Sweep only available after 30 days, only to original creator
- No admin access to locked ETH — not even the contract owner
