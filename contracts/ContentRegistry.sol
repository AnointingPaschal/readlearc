// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ContentRegistry
 * @notice On-chain receipts for article unlocks and subscriptions on Arc Mainnet.
 *
 * The backend calls recordUnlock / recordSubscription after a verified USDC payment.
 * The backend (or any frontend) can verify access via hasAccess / isSubscribed view calls.
 *
 * Only the platform operator (owner) and authorized recorders may write.
 *
 * Fee model: this contract stores no money — all payments happen in Readlearc.sol
 * (article reads) or StreamPay.sol (video). This contract only stores proofs.
 */
contract ContentRegistry {

    // ── Errors ────────────────────────────────────────────────────
    error NotOwner();
    error NotRecorder();
    error ZeroAddress();

    // ── State ─────────────────────────────────────────────────────
    address public owner;

    // Addresses allowed to call recordUnlock / recordSubscription (backend server wallets)
    mapping(address => bool) public recorders;

    // contentId (keccak256 of off-chain article/video id) → reader → unlocked
    mapping(bytes32 => mapping(address => bool)) public unlocked;

    // creator → subscriber → expiry timestamp
    mapping(address => mapping(address => uint256)) public subscriptions;

    // ── Events ────────────────────────────────────────────────────
    event Unlocked(bytes32 indexed contentId, address indexed reader, uint256 amountPaid);
    event Subscribed(address indexed creator, address indexed subscriber, uint256 expiry, uint256 amountPaid);
    event RecorderSet(address indexed recorder, bool status);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() { if (msg.sender != owner) revert NotOwner(); _; }
    modifier onlyRecorder() {
        if (!recorders[msg.sender] && msg.sender != owner) revert NotRecorder();
        _;
    }

    constructor() {
        owner = msg.sender;
        recorders[msg.sender] = true;
    }

    // ── Write ─────────────────────────────────────────────────────
    /**
     * @notice Record that a reader has unlocked a piece of content.
     * @param contentId   keccak256 of the off-chain content identifier
     * @param reader      Wallet address of the reader
     * @param amountPaid  USDC amount paid (6 dec, informational only — not stored as funds)
     */
    function recordUnlock(
        bytes32 contentId,
        address reader,
        uint256 amountPaid
    ) external onlyRecorder {
        if (reader == address(0)) revert ZeroAddress();
        unlocked[contentId][reader] = true;
        emit Unlocked(contentId, reader, amountPaid);
    }

    /**
     * @notice Record a subscription.
     * @param creator     Content creator's wallet
     * @param subscriber  Subscriber's wallet
     * @param expiry      Unix timestamp when the subscription expires
     * @param amountPaid  USDC amount paid (6 dec, informational only)
     */
    function recordSubscription(
        address creator,
        address subscriber,
        uint256 expiry,
        uint256 amountPaid
    ) external onlyRecorder {
        if (creator    == address(0)) revert ZeroAddress();
        if (subscriber == address(0)) revert ZeroAddress();
        subscriptions[creator][subscriber] = expiry;
        emit Subscribed(creator, subscriber, expiry, amountPaid);
    }

    // ── View ──────────────────────────────────────────────────────
    function hasAccess(bytes32 contentId, address reader) external view returns (bool) {
        return unlocked[contentId][reader];
    }

    function isSubscribed(address creator, address subscriber) external view returns (bool) {
        return subscriptions[creator][subscriber] >= block.timestamp;
    }

    function subscriptionExpiry(address creator, address subscriber) external view returns (uint256) {
        return subscriptions[creator][subscriber];
    }

    // ── Admin ─────────────────────────────────────────────────────
    function setRecorder(address recorder, bool status) external onlyOwner {
        if (recorder == address(0)) revert ZeroAddress();
        recorders[recorder] = status;
        emit RecorderSet(recorder, status);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
