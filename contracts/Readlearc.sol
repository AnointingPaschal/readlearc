// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title Readlearc
 * @notice Pay-per-read publishing on Arc blockchain.
 * @dev Deploy with:
 *   _usdc  = 0x3600000000000000000000000000000000000000
 *   _treasury = your platform wallet
 */

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
}

contract Readlearc {
    // ── Errors ────────────────────────────────────────────────────
    error NotOwner();
    error AlreadyPaid();
    error ArticleNotFound();
    error ZeroAddress();
    error BadSplit();
    error PayFailed();
    error Unauthorized();

    // ── State ─────────────────────────────────────────────────────
    IERC20  public immutable usdc;
    address public           owner;
    address public           treasury;

    uint256 public writerBps   = 8500;   // 85%
    uint256 public platformBps = 1000;   // 10%
    uint256 public referrerBps =  500;   //  5%
    uint256 public constant BPS = 10_000;

    // article_id → reader → paid
    mapping(uint256 => mapping(address => bool)) public paid;
    // Verified writers get writerBps + referrerBps (no referrer cut)
    mapping(address => bool) public verified;
    // Admin roles: address → role (0=none, 1=moderator, 2=admin, 3=super)
    mapping(address => uint8) public roles;

    // ── Events ────────────────────────────────────────────────────
    event ArticlePaid(uint256 indexed articleId, address indexed reader, address indexed writer, uint256 amount);
    event Tipped(address indexed from, address indexed to, uint256 amount);
    event WriterVerified(address indexed writer, bool status);
    event RoleSet(address indexed user, uint8 role);
    event SplitUpdated(uint256 writerBps, uint256 platformBps, uint256 referrerBps);
    event TreasuryUpdated(address newTreasury);

    modifier onlyOwner() { if (msg.sender != owner) revert NotOwner(); _; }
    modifier onlyAdmin()  { if (roles[msg.sender] < 2 && msg.sender != owner) revert Unauthorized(); _; }

    constructor(address _usdc, address _treasury) {
        if (_usdc == address(0) || _treasury == address(0)) revert ZeroAddress();
        usdc     = IERC20(_usdc);
        owner    = msg.sender;
        treasury = _treasury;
        roles[msg.sender] = 3; // owner = super admin
    }

    // ── Pay to read ───────────────────────────────────────────────
    /**
     * @notice Pay for article access. Caller must have approved this contract.
     * @param articleId  Off-chain article ID (from Supabase)
     * @param writer     Article author wallet
     * @param price      Price in USDC (6 decimals)
     * @param referrer   Optional referrer (address(0) if none)
     */
    function payToRead(
        uint256 articleId,
        address writer,
        uint256 price,
        address referrer
    ) external {
        if (paid[articleId][msg.sender]) revert AlreadyPaid();
        if (writer == address(0))        revert ZeroAddress();

        bool isVerified = verified[writer];
        uint256 writerShare;
        uint256 platformShare;
        uint256 referrerShare;

        if (isVerified || referrer == address(0) || referrer == msg.sender || referrer == writer) {
            writerShare   = (price * (writerBps + referrerBps)) / BPS;
            platformShare = price - writerShare;
            referrerShare = 0;
        } else {
            writerShare   = (price * writerBps)   / BPS;
            platformShare = (price * platformBps) / BPS;
            referrerShare = (price * referrerBps) / BPS;
        }

        if (!usdc.transferFrom(msg.sender, writer,   writerShare))   revert PayFailed();
        if (!usdc.transferFrom(msg.sender, treasury, platformShare)) revert PayFailed();
        if (referrerShare > 0)
            if (!usdc.transferFrom(msg.sender, referrer, referrerShare)) revert PayFailed();

        paid[articleId][msg.sender] = true;
        emit ArticlePaid(articleId, msg.sender, writer, price);
    }

    // ── Tip writer ────────────────────────────────────────────────
    function tip(address writer, uint256 amount) external {
        if (writer == address(0)) revert ZeroAddress();
        if (!usdc.transferFrom(msg.sender, writer, amount)) revert PayFailed();
        emit Tipped(msg.sender, writer, amount);
    }

    // ── Check paid ────────────────────────────────────────────────
    function hasPaid(uint256 articleId, address reader) external view returns (bool) {
        return paid[articleId][reader];
    }

    // ── Admin: roles ──────────────────────────────────────────────
    function setRole(address user, uint8 role) external onlyOwner {
        if (user == address(0)) revert ZeroAddress();
        roles[user] = role;
        emit RoleSet(user, role);
    }

    function setVerified(address writer, bool status) external onlyAdmin {
        verified[writer] = status;
        emit WriterVerified(writer, status);
    }

    // ── Admin: config ─────────────────────────────────────────────
    function setSplits(uint256 _writer, uint256 _platform, uint256 _referrer) external onlyOwner {
        if (_writer + _platform + _referrer != BPS) revert BadSplit();
        writerBps   = _writer;
        platformBps = _platform;
        referrerBps = _referrer;
        emit SplitUpdated(_writer, _platform, _referrer);
    }

    function setTreasury(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert ZeroAddress();
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        owner = newOwner;
    }
}
