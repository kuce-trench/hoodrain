// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title HoodRain
 * @notice ETH Distribution Protocol for Robinhood Chain
 * @dev Deployed on Robinhood Chain (ChainID: 4663)
 *
 *  How it works:
 *  1. Anyone calls createRain() with ETH + a Merkle root
 *     (root = snapshot of token holders and their proportional shares)
 *  2. Holders call claim() with their amount + Merkle proof to receive ETH
 *  3. After 30 days, unclaimed ETH can be swept back by the creator
 *
 *  The Merkle tree is built off-chain by the hoodrain-gen script.
 *  Fee: 1% of the deposited ETH per rain event.
 */

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract HoodRain is ReentrancyGuard, Ownable {

    // ─── Constants ─────────────────────────────────────────────────────────────

    /// @dev 1% service fee on each rain
    uint256 public constant SERVICE_FEE_BPS = 100;

    /// @dev Creator can sweep unclaimed ETH after 30 days
    uint256 public constant SWEEP_DELAY = 30 days;

    // ─── State ─────────────────────────────────────────────────────────────────

    address public feeRecipient;
    uint256 public rainCount;

    struct Rain {
        address token;          // Which token's holders receive this ETH
        address creator;        // Who deposited the ETH
        bytes32 merkleRoot;     // Root of the (holder → ETH amount) tree
        uint256 totalEth;       // Total ETH available for claims (after fee)
        uint256 claimedEth;     // ETH claimed so far
        uint256 claimDeadline;  // After this, creator can sweep unclaimed ETH
        bool    swept;          // True once creator has swept leftovers
    }

    /// @dev rainId → Rain details
    mapping(uint256 => Rain) public rains;

    /// @dev rainId → wallet → has claimed?
    mapping(uint256 => mapping(address => bool)) public hasClaimed;

    /// @dev token → list of rain IDs (for dashboards)
    mapping(address => uint256[]) public rainsByToken;

    // ─── Events ────────────────────────────────────────────────────────────────

    event RainCreated(
        uint256 indexed rainId,
        address indexed token,
        address indexed creator,
        uint256 totalEth,
        bytes32 merkleRoot,
        uint256 claimDeadline
    );

    event Claimed(
        uint256 indexed rainId,
        address indexed account,
        uint256 ethAmount
    );

    event Swept(
        uint256 indexed rainId,
        address indexed creator,
        uint256 ethAmount
    );

    event FeeRecipientUpdated(address indexed oldRecipient, address indexed newRecipient);

    // ─── Constructor ───────────────────────────────────────────────────────────

    constructor(address _feeRecipient) Ownable(msg.sender) {
        require(_feeRecipient != address(0), "HoodRain: zero fee recipient");
        feeRecipient = _feeRecipient;
    }

    // ─── Core: Create Rain ─────────────────────────────────────────────────────

    /**
     * @notice Deposit ETH to be distributed among a token's holders.
     *
     * @param token       The ERC20 token whose holders will receive ETH.
     *                    Any ERC20 on Robinhood Chain works.
     * @param merkleRoot  Root of the Merkle tree mapping each holder address
     *                    to their ETH share (in wei). Built with hoodrain-gen.
     *
     * @return rainId     The ID of this rain event.
     *
     * @dev The caller sends ETH with this call. 1% goes to feeRecipient,
     *      99% is stored for holder claims.
     */
    function createRain(
        address token,
        bytes32 merkleRoot
    ) external payable nonReentrant returns (uint256 rainId) {
        require(msg.value > 0,            "HoodRain: no ETH sent");
        require(token != address(0),      "HoodRain: zero token address");
        require(merkleRoot != bytes32(0), "HoodRain: empty merkle root");

        // ── Take fee ───────────────────────────────────────────────────────────
        uint256 fee = (msg.value * SERVICE_FEE_BPS) / 10_000;
        uint256 net = msg.value - fee;

        (bool feeSent, ) = feeRecipient.call{value: fee}("");
        require(feeSent, "HoodRain: fee transfer failed");

        // ── Store rain ─────────────────────────────────────────────────────────
        rainId = rainCount++;
        uint256 deadline = block.timestamp + SWEEP_DELAY;

        rains[rainId] = Rain({
            token:         token,
            creator:       msg.sender,
            merkleRoot:    merkleRoot,
            totalEth:      net,
            claimedEth:    0,
            claimDeadline: deadline,
            swept:         false
        });

        rainsByToken[token].push(rainId);

        emit RainCreated(rainId, token, msg.sender, net, merkleRoot, deadline);
    }

    // ─── Core: Claim ───────────────────────────────────────────────────────────

    /**
     * @notice Claim your ETH from a rain event.
     *
     * @param rainId  The rain event to claim from.
     * @param amount  Your ETH allocation in wei (must match the Merkle tree).
     * @param proof   Your Merkle proof (from the hoodrain-gen output JSON).
     *
     * @dev The leaf is: keccak256(abi.encodePacked(msg.sender, amount))
     *      This must match exactly what the generator produced.
     */
    function claim(
        uint256         rainId,
        uint256         amount,
        bytes32[]  calldata proof
    ) external nonReentrant {
        Rain storage r = rains[rainId];

        require(!r.swept,                          "HoodRain: rain already swept");
        require(!hasClaimed[rainId][msg.sender],   "HoodRain: already claimed");
        require(amount > 0,                        "HoodRain: zero amount");

        // ── Verify Merkle proof ────────────────────────────────────────────────
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, amount));
        require(
            MerkleProof.verify(proof, r.merkleRoot, leaf),
            "HoodRain: invalid proof"
        );

        // ── Pay out ────────────────────────────────────────────────────────────
        hasClaimed[rainId][msg.sender] = true;
        r.claimedEth += amount;

        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "HoodRain: ETH transfer failed");

        emit Claimed(rainId, msg.sender, amount);
    }

    // ─── Core: Sweep ───────────────────────────────────────────────────────────

    /**
     * @notice After 30 days, the creator can reclaim unclaimed ETH.
     *         This prevents ETH from being locked forever if some holders
     *         never claim.
     *
     * @param rainId  The rain event to sweep.
     */
    function sweep(uint256 rainId) external nonReentrant {
        Rain storage r = rains[rainId];

        require(msg.sender == r.creator,            "HoodRain: not the creator");
        require(block.timestamp >= r.claimDeadline, "HoodRain: claim window still open");
        require(!r.swept,                           "HoodRain: already swept");

        uint256 remaining = r.totalEth - r.claimedEth;
        require(remaining > 0, "HoodRain: nothing left to sweep");

        r.swept = true;

        (bool sent, ) = r.creator.call{value: remaining}("");
        require(sent, "HoodRain: sweep transfer failed");

        emit Swept(rainId, r.creator, remaining);
    }

    // ─── View ──────────────────────────────────────────────────────────────────

    /// @notice ETH still available for claims in a rain event.
    function remainingEth(uint256 rainId) external view returns (uint256) {
        Rain storage r = rains[rainId];
        if (r.swept) return 0;
        return r.totalEth - r.claimedEth;
    }

    /// @notice All rain IDs for a given token (for dashboards).
    function getRainsByToken(address token) external view returns (uint256[] memory) {
        return rainsByToken[token];
    }

    // ─── Admin ─────────────────────────────────────────────────────────────────

    function setFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "HoodRain: zero recipient");
        emit FeeRecipientUpdated(feeRecipient, newRecipient);
        feeRecipient = newRecipient;
    }
}
