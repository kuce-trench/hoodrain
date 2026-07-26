# Overview

## Background

Robinhood Chain launched on July 1, 2026. Within weeks, thousands of tokens were being created daily on launchpads like pons.family. Projects wanted to reward their communities, but there was no standard way to do it.

Sending ETH to holders manually is impossible at scale — a token can have thousands of wallets. Building a custom distribution contract requires Solidity knowledge most teams don't have. And existing solutions on other chains don't support Robinhood Chain.

HoodRain solves this. One contract, one script, any token, any amount of ETH.

## What makes HoodRain different

Most "airdrop" tools distribute tokens. HoodRain distributes **ETH** — the native asset everyone already has a wallet for. No token approvals, no wrapping, no bridging. Just ETH directly to holders.

Unlike Pons Fork (which automates a token creator's own fee income), HoodRain is open to **anyone**:

- A project team rewarding their community after a milestone
- A whale gifting ETH to small holders of a token they believe in  
- A DAO paying dividends from treasury income
- A protocol sharing revenue with token holders

## How the Merkle tree makes it work

Distributing ETH to thousands of holders in one transaction would cost enormous gas. HoodRain solves this with a Merkle tree:

1. An off-chain script reads all holder balances and computes each holder's share
2. These are packed into a Merkle tree — a cryptographic structure
3. Only the root (32 bytes) is stored on-chain
4. Each holder claims individually, proving their share with a short proof

This means gas cost per claim is the same whether there are 10 holders or 100,000.

## Fee

HoodRain takes 1% of each rain as a protocol fee. The rest goes entirely to holders.

After 30 days, any unclaimed ETH can be swept back by the creator. This prevents ETH from being locked forever if some holders never claim.
