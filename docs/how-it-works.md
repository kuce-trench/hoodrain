# How it works

## The full flow

```
STEP 1 — Snapshot
─────────────────
Run: node generate-rain.js 0xTOKEN 0.5

The script reads every Transfer event for the token on Robinhood Chain.
It reconstructs the balance of every current holder.
It computes each holder's proportional share of the 0.5 ETH.
It builds a Merkle tree from these (address → amount) pairs.
Output: merkleRoot + a JSON file with every holder's proof.

STEP 2 — Create Rain
────────────────────
Call: createRain(tokenAddress, merkleRoot)  {value: 0.5 ETH}

1% fee → feeRecipient
99%    → stored in contract

A RainCreated event is emitted with the rainId.
The ETH is now locked. Nobody can touch it except via claim().

STEP 3 — Holders Claim
──────────────────────
Each holder calls: claim(rainId, myAmount, myProof)

The contract checks:
  1. Has this address already claimed? (no)
  2. Does keccak256(address, amount) verify against the Merkle root? (yes)

If both pass → ETH is sent directly to the holder's wallet.

STEP 4 — Sweep (optional, after 30 days)
────────────────────────────────────────
If some holders never claim, the creator can call sweep(rainId)
to recover the unclaimed ETH after 30 days.
```

## What is a Merkle tree?

A Merkle tree is a data structure where every piece of data can be proven to belong to a set, using only a short list of hashes — without revealing or re-checking the entire set.

In HoodRain:
- The "set" is all holder addresses and their ETH shares
- The "proof" for each holder is a short list of hashes (~10–20 values)
- The "root" is a single 32-byte hash stored on-chain

This means: even if a token has 50,000 holders, claiming costs about the same gas as if it had 10. The proof verification is O(log n).

## Why off-chain snapshot?

Reading all holders of an ERC20 on-chain is not possible in a single transaction — there is no built-in registry of holders in the ERC20 standard. The generator script reconstructs holder balances by reading all Transfer events from block 0 to the current block, which is only possible off-chain via RPC.

The Merkle root commits this snapshot on-chain. The root cannot be changed after `createRain()` is called.
