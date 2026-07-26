# HoodRain — Twitter / X Posts

---

## 🧵 LAUNCH THREAD

**Tweet 1 — hook:**
> Pons Fork lets creators send their fee income to holders.
>
> But what if you're not the creator?
> What if you just want to reward a community you love?
>
> Introducing 🌧️ HoodRain — make it rain ETH on any token's holders.
> On Robinhood Chain. 🧵

---

**Tweet 2 — problem:**
> Right now on Robinhood Chain, there's no way for:
>
> ❌ A whale to reward small holders of their favorite token
> ❌ A DAO to pay dividends
> ❌ A project to airdrop ETH without building custom contracts
>
> Every distribution is one-off and manual.

---

**Tweet 3 — solution:**
> HoodRain fixes this.
>
> 1️⃣ Run one script → snapshots all holders, builds a Merkle tree
> 2️⃣ Call createRain() → deposit ETH on-chain
> 3️⃣ Holders claim → ETH sent directly to their wallet
>
> Any ERC20 token. Any amount of ETH. Anyone can create a rain.

---

**Tweet 4 — technical:**
> How does it know who gets what?
>
> The generator script reads all Transfer events on Robinhood Chain, reconstructs every holder's balance, and computes proportional shares.
>
> The result is a Merkle tree — a cryptographic structure that lets each holder prove their share without trusting anyone.

---

**Tweet 5 — differentiation:**
> HoodRain vs Pons Fork:
>
> Pons Fork: routes a token's own fee income → automatic
> HoodRain: anyone deposits ETH → holders of any token get it
>
> They're not competitors. Pons Fork is for creators.
> HoodRain is for everyone else.

---

**Tweet 6 — CTA:**
> 1% fee. 30-day claim window. No custodial risk.
>
> Source on GitHub: [link]
> Docs: [link]
>
> 🌧️ Built on Robinhood Chain (chainId 4663)
> First ETH distribution protocol on the chain.

---

## 📌 STANDALONE POSTS

### Post A — simple hook
> New primitive on Robinhood Chain:
>
> Deposit ETH → choose a token → every holder gets their proportional share.
>
> One contract. Any token. Anyone.
>
> 🌧️ HoodRain [link]

---

### Post B — use case angle
> Imagine you hold 5% of a pons.family token.
>
> Someone sends 1 ETH to HoodRain pointing at that token.
>
> Your wallet receives 0.05 ETH. Automatically. Just for holding.
>
> No staking. No lockups. Just holding.
>
> 🌧️ [link]

---

### Post C — narrative
> Robin Hood took from the rich and gave to the poor.
>
> HoodRain takes ETH from anyone who wants to give
> and distributes it to every holder of a token.
>
> Proportional. On-chain. Verifiable.
>
> 🌧️ HoodRain on Robinhood Chain

---

### Post D — technical for devs
> HoodRain uses Merkle proofs for gas-efficient ETH distribution.
>
> createRain(token, merkleRoot) → stores ETH + root
> claim(rainId, amount, proof[]) → holder receives ETH
>
> Leaf = keccak256(abi.encodePacked(address, uint256))
> Off-chain snapshot script included in the repo.
>
> GitHub: [link]
> Chain: 4663

---

### Post E — short punchy
> Pons Fork: creator fees → holders
> HoodRain: anyone's ETH → holders
>
> Different protocols. Same chain. Different use cases.
>
> First ETH distribution primitive on Robinhood Chain. 🌧️

---

## 📋 HASHTAGS
`#RobinhoodChain` `#HoodRain` `#DeFi` `#HOOD` `#memecoin` `#Web3` `#Solidity`
