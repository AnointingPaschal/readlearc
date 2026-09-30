// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title StreamPay
 * @notice Pay-per-second video streaming payment channel on Arc Mainnet.
 *
 * Flow:
 *  1. Viewer calls openSession(creator, ratePerSecond, sessionKey)
 *     with msg.value = ratePerSecond * estimatedDurationSeconds (native USDC, 18-dec).
 *  2. Every second, the session key signs an off-chain voucher off-chain.
 *     The backend verifies it and serves the next HLS segment.
 *  3. When the viewer stops, closeSession(sessionId, amountOwed, sig) is called.
 *     The contract pays the creator amountOwed, refunds the remainder to the viewer,
 *     and takes the platform fee.
 *  4. If the platform vanishes, the viewer can call reclaimExpired(sessionId)
 *     after EXPIRY_SECONDS to recover the full deposit.
 *
 * Fee model:
 *  - platformFeeBps defaults to 200 (2%). Owner can set it to 0 (free) or any value.
 *  - All remaining amount goes to the creator.
 *  - amountOwed must be ≤ deposit and ≥ lastAmountOwed (monotonically increasing).
 */

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address) external view returns (uint256);
}

contract StreamPay {

    // ── Errors ────────────────────────────────────────────────────
    error NotOwner();
    error SessionExists();
    error SessionNotFound();
    error SessionAlreadyClosed();
    error NotExpiredYet();
    error AmountExceedsDeposit();
    error AmountNotMonotonic();
    error InvalidSignature();
    error ZeroRate();
    error BadFee();
    error TransferFailed();
    error ZeroAddress();

    // ── Constants ─────────────────────────────────────────────────
    uint256 public constant BPS           = 10_000;
    uint256 public constant EXPIRY_SECONDS = 86_400; // 24 hours
    bytes32 public constant DOMAIN_TAG    = keccak256("READLEARC_STREAM");

    // ── Config (mutable by owner) ─────────────────────────────────
    address public owner;
    address public treasury;
    uint256 public platformFeeBps = 200; // 2% default; can be set to 0

    // ── Session ───────────────────────────────────────────────────
    enum Status { Open, Closed, Reclaimed }

    struct Session {
        address viewer;
        address creator;
        uint256 deposit;        // native USDC (18 dec)
        uint256 ratePerSecond;  // native USDC per second
        address sessionKey;     // ephemeral key that signs vouchers
        uint256 openedAt;
        uint256 lastAmountOwed; // monotonic floor
        Status  status;
    }

    mapping(bytes32 => Session) public sessions;

    // ── Events ────────────────────────────────────────────────────
    event SessionOpened(bytes32 indexed sessionId, address indexed viewer, address indexed creator, uint256 deposit, uint256 ratePerSecond);
    event SessionClosed(bytes32 indexed sessionId, address indexed creator, uint256 creatorAmount, uint256 platformAmount, uint256 refund);
    event SessionReclaimed(bytes32 indexed sessionId, address indexed viewer, uint256 refund);
    event FeeUpdated(uint256 oldBps, uint256 newBps);
    event TreasuryUpdated(address oldTreasury, address newTreasury);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() { if (msg.sender != owner) revert NotOwner(); _; }

    constructor(address _treasury) {
        if (_treasury == address(0)) revert ZeroAddress();
        owner    = msg.sender;
        treasury = _treasury;
    }

    // ── Open session ──────────────────────────────────────────────
    /**
     * @notice Open a streaming session. Send native USDC as msg.value.
     * @param creator     Creator's wallet address
     * @param ratePerSec  Per-second rate in native USDC (18 dec)
     * @param sessionKey  Ephemeral public key that will sign off-chain vouchers
     */
    function openSession(
        address creator,
        uint256 ratePerSec,
        address sessionKey
    ) external payable returns (bytes32 sessionId) {
        if (creator    == address(0)) revert ZeroAddress();
        if (sessionKey == address(0)) revert ZeroAddress();
        if (ratePerSec == 0)          revert ZeroRate();

        sessionId = keccak256(abi.encodePacked(
            msg.sender, creator, sessionKey, block.timestamp, block.chainid
        ));

        if (sessions[sessionId].openedAt != 0) revert SessionExists();

        sessions[sessionId] = Session({
            viewer:         msg.sender,
            creator:        creator,
            deposit:        msg.value,
            ratePerSecond:  ratePerSec,
            sessionKey:     sessionKey,
            openedAt:       block.timestamp,
            lastAmountOwed: 0,
            status:         Status.Open
        });

        emit SessionOpened(sessionId, msg.sender, creator, msg.value, ratePerSec);
    }

    // ── Close session ─────────────────────────────────────────────
    /**
     * @notice Settle a session. Can be called by viewer or creator.
     * @param sessionId   Session identifier
     * @param amountOwed  Final amount owed to creator (native USDC, 18 dec)
     * @param sig         Signature of the voucher digest by sessionKey
     */
    function closeSession(
        bytes32 sessionId,
        uint256 amountOwed,
        bytes calldata sig
    ) external {
        Session storage s = sessions[sessionId];
        if (s.openedAt == 0)            revert SessionNotFound();
        if (s.status != Status.Open)    revert SessionAlreadyClosed();
        if (amountOwed > s.deposit)     revert AmountExceedsDeposit();
        if (amountOwed < s.lastAmountOwed) revert AmountNotMonotonic();

        // Verify voucher signature from sessionKey
        bytes32 digest = keccak256(abi.encodePacked(
            DOMAIN_TAG, block.chainid, address(this), sessionId, amountOwed
        ));
        bytes32 ethDigest = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", digest));
        address recovered = _recoverSigner(ethDigest, sig);
        if (recovered != s.sessionKey) revert InvalidSignature();

        s.status         = Status.Closed;
        s.lastAmountOwed = amountOwed;

        // ── Calculate splits ─────────────────────────────────────
        uint256 platformAmt;
        uint256 creatorAmt;

        if (platformFeeBps == 0 || amountOwed == 0) {
            platformAmt = 0;
            creatorAmt  = amountOwed;
        } else {
            platformAmt = (amountOwed * platformFeeBps) / BPS;
            creatorAmt  = amountOwed - platformAmt;
        }

        uint256 refund = s.deposit - amountOwed;

        // ── Pay out ──────────────────────────────────────────────
        if (creatorAmt > 0) {
            (bool ok,) = s.creator.call{value: creatorAmt}("");
            if (!ok) revert TransferFailed();
        }
        if (platformAmt > 0 && treasury != address(0)) {
            (bool ok,) = treasury.call{value: platformAmt}("");
            if (!ok) revert TransferFailed();
        }
        if (refund > 0) {
            (bool ok,) = s.viewer.call{value: refund}("");
            if (!ok) revert TransferFailed();
        }

        emit SessionClosed(sessionId, s.creator, creatorAmt, platformAmt, refund);
    }

    // ── Reclaim expired ───────────────────────────────────────────
    /**
     * @notice Viewer can reclaim the full deposit after EXPIRY_SECONDS
     *         if the platform never settles.
     */
    function reclaimExpired(bytes32 sessionId) external {
        Session storage s = sessions[sessionId];
        if (s.openedAt == 0)          revert SessionNotFound();
        if (s.status != Status.Open)  revert SessionAlreadyClosed();
        if (block.timestamp < s.openedAt + EXPIRY_SECONDS) revert NotExpiredYet();
        if (msg.sender != s.viewer)   revert NotOwner();

        s.status = Status.Reclaimed;
        uint256 refund = s.deposit;

        (bool ok,) = s.viewer.call{value: refund}("");
        if (!ok) revert TransferFailed();

        emit SessionReclaimed(sessionId, s.viewer, refund);
    }

    // ── View ──────────────────────────────────────────────────────
    function getSession(bytes32 sessionId) external view returns (Session memory) {
        return sessions[sessionId];
    }

    function previewSplit(uint256 amountOwed) external view returns (uint256 creatorAmt, uint256 platformAmt) {
        if (platformFeeBps == 0 || amountOwed == 0) {
            platformAmt = 0;
            creatorAmt  = amountOwed;
        } else {
            platformAmt = (amountOwed * platformFeeBps) / BPS;
            creatorAmt  = amountOwed - platformAmt;
        }
    }

    // ── Admin ─────────────────────────────────────────────────────
    /**
     * @notice Set platform fee in basis points. 0 = completely free.
     *         Max 2000 (20%).
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

    // ── Internal ──────────────────────────────────────────────────
    function _recoverSigner(bytes32 digest, bytes calldata sig) internal pure returns (address) {
        if (sig.length != 65) return address(0);
        bytes32 r; bytes32 s_; uint8 v;
        assembly {
            r  := calldataload(sig.offset)
            s_ := calldataload(add(sig.offset, 32))
            v  := byte(0, calldataload(add(sig.offset, 64)))
        }
        if (v < 27) v += 27;
        if (v != 27 && v != 28) return address(0);
        return ecrecover(digest, v, r, s_);
    }

    // ── Fallback (reject plain ETH sends) ────────────────────────
    receive() external payable { revert("Use openSession"); }
}
