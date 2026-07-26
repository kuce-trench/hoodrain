# Transparency & Addresses

## Contract addresses

| Contract | Address | Network |
|---|---|---|
| HoodRain (testnet) | `0x1459483B4E3883443BFb914C7d1bAf7c97506ef8` | Robinhood Chain Testnet (46630) |
| HoodRain (mainnet) | `TBD — after mainnet deploy` | Robinhood Chain (4663) |

## Verify on explorer

**Testnet:**
[explorer.testnet.chain.robinhood.com/address/0x1459483B4E3883443BFb914C7d1bAf7c97506ef8](https://explorer.testnet.chain.robinhood.com/address/0x1459483B4E3883443BFb914C7d1bAf7c97506ef8#code)

Contract source code is verified — what you read is exactly what runs.

## Protocol fee

HoodRain takes 1% (`SERVICE_FEE_BPS = 100`) of each rain. This goes to the `feeRecipient` address set at deployment.

The fee recipient address is public — readable from the contract at any time.

## What the contract owner can do

The contract owner can only change the `feeRecipient` address.

The owner **cannot:**
- Access locked ETH
- Cancel a rain
- Change a Merkle root after creation
- Pause the contract
- Upgrade the contract

There is no proxy. There is no backdoor.

## Source code

Full source on GitHub: [github.com/kuce-trench/hoodrain](https://github.com/kuce-trench/hoodrain)

## Network details

| | |
|---|---|
| Mainnet Chain ID | `4663` |
| Mainnet RPC | `https://rpc.mainnet.chain.robinhood.com` |
| Mainnet Explorer | `https://robinhoodchain.blockscout.com` |
| Testnet Chain ID | `46630` |
| Testnet RPC | `https://rpc.testnet.chain.robinhood.com` |
| Testnet Faucet | `https://faucet.testnet.chain.robinhood.com` |
