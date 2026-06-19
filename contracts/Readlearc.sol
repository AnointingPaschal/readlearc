// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title Readlearc
 * @notice Pay-per-read publishing platform on Arc blockchain.
 *         Articles stored on-chain. Payments in Circle USDC with atomic fee splits.
 *
 * DEPLOY WITH:
 *   _usdc            = 0x3600000000000000000000000000000000000000  (USDC on Arc Testnet)
 *   _platformTreasury = 0xYourWalletAddress
 */

// ── Minimal USDC interface ────────────────────────────────────────────────────
interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
}

// ── Main contract ─────────────────────────────────────────────────────────────
contract Readlearc {

    // ── Custom errors (cheaper than require strings) ──────────────────────────
    error NotOwner();
    error ArticleNotFound();
    error AlreadyRead();
    error ZeroAddress();
    error SplitsMustEqual10000();
    error PaymentFailed();
    error PriceBelowMinimum();
    error EmptyField();
    error SameOwner();

    // ── Article struct ────────────────────────────────────────────────────────
    struct Article {
        uint256 id;
        address author;
        string  title;
        string  blurb;
        string  content;
        uint256 price;      // USDC in 6 decimals (e.g. 20000 = $0.02)
        string  category;
        uint256 readTime;   // estimated minutes
        uint256 timestamp;
        uint256 reads;
        bool    isResearch; // true = research paper format
    }

    // ── State ─────────────────────────────────────────────────────────────────
    IERC20  public immutable usdc;
    address public           platformTreasury;
    address public           owner;

    uint256 public articleCount;

    mapping(uint256 => Article)                  public articles;
    mapping(address => mapping(uint256 => bool)) public readReceipts;
    mapping(address => bool)                     public verifiedWriters;

    // Fee splits in basis points (10 000 = 100%)
    uint256 public defaultWriterBps    = 8500;  // 85%
    uint256 public defaultPlatformBps  = 1000;  // 10%
    uint256 public defaultReferrerBps  =  500;  //  5%

    uint256 public verifiedWriterBps   = 9000;  // 90%
    uint256 public verifiedPlatformBps =  700;  //  7%
    uint256 public verifiedReferrerBps =  300;  //  3%

    uint256 public constant BPS       = 10_000;
    uint256 public constant MIN_PRICE = 1_000;  // $0.001 USDC minimum

    // ── Events ────────────────────────────────────────────────────────────────
    event ArticlePublished(uint256 indexed id, address indexed author, string title, uint256 price);
    event ArticleRead(uint256 indexed id, address indexed reader, address indexed referrer, uint256 price);
    event WriterVerified(address indexed writer, bool status);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event SplitsUpdated(bool isVerified, uint256 writerBps, uint256 platformBps, uint256 referrerBps);

    // ── Access control ────────────────────────────────────────────────────────
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    // ── Constructor ───────────────────────────────────────────────────────────
    /**
     * @param _usdc              Arc Testnet USDC: 0x3600000000000000000000000000000000000000
     * @param _platformTreasury  Your wallet address (receives platform fee share)
     */
    constructor(address _usdc, address _platformTreasury) {
        if (_usdc == address(0) || _platformTreasury == address(0)) revert ZeroAddress();
        owner            = msg.sender;
        usdc             = IERC20(_usdc);
        platformTreasury = _platformTreasury;
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  WRITER FUNCTIONS
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * @notice Publish a new article entirely on-chain.
     * @param _title       Article title
     * @param _blurb       Teaser shown before payment (max ~300 chars)
     * @param _content     Full article body — stored permanently on-chain
     * @param _price       Price in USDC units (6 decimals). e.g. 20000 = $0.02
     * @param _category    Category string (Web3, AI, Research, etc.)
     * @param _readTime    Estimated read time in minutes
     * @param _isResearch  true = research paper, false = standard article
     * @return newId       Article ID assigned on-chain
     */
    function publishArticle(
        string calldata _title,
        string calldata _blurb,
        string calldata _content,
        uint256         _price,
        string calldata _category,
        uint256         _readTime,
        bool            _isResearch
    ) external returns (uint256 newId) {
        if (bytes(_title).length   == 0) revert EmptyField();
        if (bytes(_content).length == 0) revert EmptyField();
        if (_price < MIN_PRICE)          revert PriceBelowMinimum();

        unchecked { newId = ++articleCount; }

        articles[newId] = Article({
            id:         newId,
            author:     msg.sender,
            title:      _title,
            blurb:      _blurb,
            content:    _content,
            price:      _price,
            category:   _category,
            readTime:   _readTime,
            timestamp:  block.timestamp,
            reads:      0,
            isResearch: _isResearch
        });

        // Author always has read access to their own article
        readReceipts[msg.sender][newId] = true;

        emit ArticlePublished(newId, msg.sender, _title, _price);
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  READER FUNCTIONS
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * @notice Pay to unlock an article. Reader must approve this contract to
     *         spend `article.price` USDC before calling.
     *         Call USDC.approve(thisContractAddress, article.price) first.
     * @param _articleId  ID of the article to unlock
     * @param _referrer   Referrer address (pass address(0) if none)
     */
    function payToRead(uint256 _articleId, address _referrer) external {
        Article storage a = articles[_articleId];
        if (a.id == 0)                          revert ArticleNotFound();
        if (readReceipts[msg.sender][_articleId]) revert AlreadyRead();

        uint256 amount     = a.price;
        bool    isVerified = verifiedWriters[a.author];

        uint256 writerShare;
        uint256 platformShare;
        uint256 referrerShare;

        if (isVerified) {
            writerShare   = (amount * verifiedWriterBps)   / BPS;
            platformShare = (amount * verifiedPlatformBps) / BPS;
            referrerShare = (amount * verifiedReferrerBps) / BPS;
        } else {
            writerShare   = (amount * defaultWriterBps)    / BPS;
            platformShare = (amount * defaultPlatformBps)  / BPS;
            referrerShare = (amount * defaultReferrerBps)  / BPS;
        }

        // Transfer writer share
        if (!usdc.transferFrom(msg.sender, a.author, writerShare)) revert PaymentFailed();

        // Referrer + platform shares
        bool validReferrer = _referrer != address(0) && _referrer != msg.sender && _referrer != a.author;

        if (validReferrer && referrerShare > 0) {
            if (!usdc.transferFrom(msg.sender, _referrer, referrerShare))    revert PaymentFailed();
            if (!usdc.transferFrom(msg.sender, platformTreasury, platformShare)) revert PaymentFailed();
        } else {
            // No valid referrer → platform absorbs referrer share
            uint256 platformTotal = platformShare + referrerShare;
            if (!usdc.transferFrom(msg.sender, platformTreasury, platformTotal)) revert PaymentFailed();
        }

        readReceipts[msg.sender][_articleId] = true;
        unchecked { a.reads++; }

        emit ArticleRead(_articleId, msg.sender, _referrer, amount);
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  VIEW FUNCTIONS
    // ═════════════════════════════════════════════════════════════════════════

    /// @notice Public metadata — no content
    function getArticleMetadata(uint256 _id) external view returns (
        uint256 id, address author, string memory title, string memory blurb,
        uint256 price, string memory category, uint256 readTime,
        uint256 timestamp, uint256 reads, bool isResearch
    ) {
        Article storage a = articles[_id];
        return (a.id, a.author, a.title, a.blurb, a.price, a.category, a.readTime, a.timestamp, a.reads, a.isResearch);
    }

    /// @notice Full article including content (blockchain data is always public)
    function getFullArticle(uint256 _id) external view returns (Article memory) {
        return articles[_id];
    }

    /// @notice Check if an address has paid for an article
    function hasReadReceipt(address _user, uint256 _id) external view returns (bool) {
        return readReceipts[_user][_id];
    }

    /// @notice Preview the fee split for a given price
    function previewSplit(uint256 _price, bool _isVerified)
        external view returns (uint256 writerShare, uint256 platformShare, uint256 referrerShare)
    {
        if (_isVerified) {
            writerShare   = (_price * verifiedWriterBps)   / BPS;
            platformShare = (_price * verifiedPlatformBps) / BPS;
            referrerShare = (_price * verifiedReferrerBps) / BPS;
        } else {
            writerShare   = (_price * defaultWriterBps)    / BPS;
            platformShare = (_price * defaultPlatformBps)  / BPS;
            referrerShare = (_price * defaultReferrerBps)  / BPS;
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  ADMIN FUNCTIONS  (onlyOwner)
    // ═════════════════════════════════════════════════════════════════════════

    function setVerifiedWriter(address _writer, bool _status) external onlyOwner {
        if (_writer == address(0)) revert ZeroAddress();
        verifiedWriters[_writer] = _status;
        emit WriterVerified(_writer, _status);
    }

    function updateDefaultSplits(uint256 _writerBps, uint256 _platformBps, uint256 _referrerBps) external onlyOwner {
        if (_writerBps + _platformBps + _referrerBps != BPS) revert SplitsMustEqual10000();
        defaultWriterBps   = _writerBps;
        defaultPlatformBps = _platformBps;
        defaultReferrerBps = _referrerBps;
        emit SplitsUpdated(false, _writerBps, _platformBps, _referrerBps);
    }

    function updateVerifiedSplits(uint256 _writerBps, uint256 _platformBps, uint256 _referrerBps) external onlyOwner {
        if (_writerBps + _platformBps + _referrerBps != BPS) revert SplitsMustEqual10000();
        verifiedWriterBps   = _writerBps;
        verifiedPlatformBps = _platformBps;
        verifiedReferrerBps = _referrerBps;
        emit SplitsUpdated(true, _writerBps, _platformBps, _referrerBps);
    }

    function updateTreasury(address _newTreasury) external onlyOwner {
        if (_newTreasury == address(0)) revert ZeroAddress();
        emit TreasuryUpdated(platformTreasury, _newTreasury);
        platformTreasury = _newTreasury;
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        if (_newOwner == address(0)) revert ZeroAddress();
        if (_newOwner == owner)      revert SameOwner();
        emit OwnershipTransferred(owner, _newOwner);
        owner = _newOwner;
    }
}
