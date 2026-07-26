# Creating a Rain

## What you need

- A wallet with ETH on Robinhood Chain (chainId 4663)
- Node.js installed
- The token address you want to distribute to

## Step 1 — Run the generator

The generator script reads all holders of a token and builds the Merkle tree.

```bash
node scripts/generate-rain.js 0xYOUR_TOKEN_ADDRESS 0.5
```

Replace:
- `0xYOUR_TOKEN_ADDRESS` — the ERC20 token whose holders receive ETH
- `0.5` — total ETH you want to send (gross, before 1% fee)

The script will:
1. Connect to Robinhood Chain RPC
2. Read all Transfer events to reconstruct holder balances
3. Compute proportional ETH shares
4. Build a Merkle tree
5. Output a JSON file: `rain-0xTOKEN-timestamp.json`

## Step 2 — Note the Merkle root

The script prints:
```
Merkle root: 0x1234...abcd
```

Save this — you need it in the next step.

## Step 3 — Approve and call createRain()

Call `createRain(tokenAddress, merkleRoot)` on the HoodRain contract, sending your ETH with the transaction.

**On Blockscout (no-code):**
1. Go to the HoodRain contract on the explorer
2. Click **Write contract**
3. Connect your wallet
4. Fill in `createRain`:
   - `token`: your token address
   - `merkleRoot`: the root from step 2
   - `value`: your ETH amount (e.g. `0.5`)
5. Submit

A `RainCreated` event will be emitted with your `rainId`.

## Step 4 — Share the proof file

Publish the JSON file generated in step 1. Holders need it to find their proof and claim their ETH.

You can host it on:
- GitHub (add to your repo)
- IPFS
- Any public URL

## Step 5 — Holders claim

Holders go to the HoodRain app, connect their wallet, and click **Claim**. The app reads the JSON file and submits their proof automatically.

Or they can claim directly on Blockscout:
1. Find the HoodRain contract
2. Click **Write contract** → `claim`
3. Enter: `rainId`, `amount` (in wei, from the JSON), `proof` (from the JSON)
