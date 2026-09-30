// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title CreatorTip
 * @notice Direct USDC tipping for articles and videos on Arc Mainnet.
 *
 * The tipper approves this contract then calls tip(creator, amount).
 * The contract deducts the platform fee and forwards the rest to the creator instantly.
 *
 * Fee model:
 *  - platformFeeBps defaults to 200 (2%). Owner can set it to 0 (free) at any time.
 *  - Max fee is capped at 2000 bps (20%) to protect tippers.
 */

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

contract CreatorTip {

    // ── Errors ────────────────────────────────────────────────────
    error NotOwner();
    error ZeroAddress();
    error ZeroAmount();
    error BadFee();
    error TransferFailed();

    // ── State ─────────────────────────────────────────────────────
    IERC20  public immutable usdc;
    address public           owner;
    address public           treasury;
    uint256 public           platformFeeBps = 200; // 2% default; settable to 0
    uint256 public constant  BPS            = 10_000;

    // ── Events ────────────────────────────────────────────────────
    event Tipped(address indexed from, address indexed creator, uint256 gross, uint256 creatorAmount, uint256 platformAmount, bytes32 indexed contentId);
    event FeeUpdated(uint256 oldBps, uint256 newBps);
    event TreasuryUpdated(address oldTreasury, address newTreasury);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() { if (msg.sender != owner) revert NotOwner(); _; }

    constructor(address _usdc, address _treasury) {
        if (_usdc == address(0) || _treasury == address(0)) revert ZeroAddress();
        usdc     = IERC20(_usdc);
        owner    = msg.sender;
        treasury = _treasury;
    }

    // ── Tip ───────────────────────────────────────────────────────
    /**
     * @notice Send a USDC tip to a creator. Caller must have approved this contract first.
     * @param creator   Recipient's wallet
     * @param amount    Gross tip amount in USDC (6 dec)
     * @param contentId Optional content identifier (pass bytes32(0) for a general tip)
     */
    function tip(address creator, uint256 amount, bytes32 contentId) external {
        if (creator == address(0)) revert ZeroAddress();
        if (amount  == 0)          revert ZeroAmount();

        uint256 platformAmt;
        uint256 creatorAmt;

        if (platformFeeBps == 0) {
            platformAmt = 0;
            creatorAmt  = amount;
        } else {
            platformAmt = (amount * platformFeeBps) / BPS;
            creatorAmt  = amount - platformAmt;
        }

        if (!usdc.transferFrom(msg.sender, creator, creatorAmt)) revert TransferFailed();
        if (platformAmt > 0 && treasury != address(0)) {
            if (!usdc.transferFrom(msg.sender, treasury, platformAmt)) revert TransferFailed();
        }

        emit Tipped(msg.sender, creator, amount, creatorAmt, platformAmt, contentId);
    }

    // ── View ──────────────────────────────────────────────────────
    function previewTip(uint256 amount) external view returns (uint256 creatorAmt, uint256 platformAmt) {
        if (platformFeeBps == 0 || amount == 0) {
            platformAmt = 0;
            creatorAmt  = amount;
        } else {
            platformAmt = (amount * platformFeeBps) / BPS;
            creatorAmt  = amount - platformAmt;
        }
    }

    // ── Admin ─────────────────────────────────────────────────────
    /**
     * @notice Set platform fee. 0 = completely free. Max 2000 (20%).
     */
    function setPlatformFee(uint256 newBps) external onlyOwner {
        if (newBps > 2000) revert BadFee();
        emit FeeUpdated(platformFeeBps, newBps);
        platformFeeBps = newBps;
    }

    function setTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert ZeroAddress();
        emit TreasuryUpdated(treasury, newTreasury);
        treasury = newTreasury;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
