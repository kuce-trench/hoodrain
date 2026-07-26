# Smart Contract Reference

## HoodRain.sol

Deployed on Robinhood Chain (chainId 4663).

---

## Constants

| Name | Value | Description |
|---|---|---|
| `SERVICE_FEE_BPS` | `100` | 1% fee on each rain |
| `SWEEP_DELAY` | `30 days` | How long holders have to claim |

---

## Structs

### `Rain`

```solidity
struct Rain {
    address token;          // Token whose holders receive ETH
    address creator;        // Who deposited the ETH
    bytes32 merkleRoot;     // Root of the holder → ETH tree
    uint256 totalEth;       // ETH available for claims (after fee)
    uint256 claimedEth;     // ETH claimed so far
    uint256 claimDeadline;  // After this, creator can sweep
    bool    swept;          // True once creator swept leftovers
}
```

---

## Write Functions

### `createRain(token, merkleRoot)`

```solidity
function createRain(
    address token,
    bytes32 merkleRoot
) external payable returns (uint256 rainId)
```

Deposit ETH for a token's holders. Send ETH with this call.

| Param | Type | Description |
|---|---|---|
| `token` | `address` | ERC20 token whose holders receive ETH |
| `merkleRoot` | `bytes32` | Root from the generate-rain.js script |
| `msg.value` | ETH | Total ETH to distribute (1% fee deducted) |

**Emits:** `RainCreated(rainId, token, creator, totalEth, merkleRoot, claimDeadline)`

---

### `claim(rainId, amount, proof)`

```solidity
function claim(
    uint256 rainId,
    uint256 amount,
    bytes32[] calldata proof
) external
```

Claim your ETH from a rain. Uses your Merkle proof to verify entitlement.

| Param | Type | Description |
|---|---|---|
| `rainId` | `uint256` | Rain ID from `RainCreated` event |
| `amount` | `uint256` | Your ETH share in wei (from the JSON file) |
| `proof` | `bytes32[]` | Your Merkle proof (from the JSON file) |

**Emits:** `Claimed(rainId, account, ethAmount)`

---

### `sweep(rainId)`

```solidity
function sweep(uint256 rainId) external
```

After 30 days, creator can reclaim unclaimed ETH. Only callable by the original creator.

**Emits:** `Swept(rainId, creator, ethAmount)`

---

## Read Functions

| Function | Returns | Description |
|---|---|---|
| `rains(rainId)` | `Rain` | Full rain details |
| `hasClaimed(rainId, address)` | `bool` | Has this address claimed? |
| `remainingEth(rainId)` | `uint256` | ETH still available for claims |
| `getRainsByToken(token)` | `uint256[]` | All rain IDs for a token |

---

## Events

```solidity
event RainCreated(uint256 indexed rainId, address indexed token, 
    address indexed creator, uint256 totalEth, bytes32 merkleRoot, uint256 claimDeadline);

event Claimed(uint256 indexed rainId, address indexed account, uint256 ethAmount);

event Swept(uint256 indexed rainId, address indexed creator, uint256 ethAmount);
```
