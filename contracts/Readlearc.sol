// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Readlearc
 * @dev On-chain pay-per-read publishing platform.
 * Stores articles natively on-chain and handles atomic USDC fee splits.
 */
interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
}

contract Readlearc {
    struct Article {
        uint256 id;
        address author;
        string title;
        string blurb;
        string content;
        uint256 price; // in USDC smallest units (e.g., 6 decimals)
        string category;
        uint256 readTime;
        uint256 timestamp;
        uint256 reads;
    }

    // Storage
    IERC20 public immutable usdc;
    address public immutable platformTreasury;
    
    uint256 public articleCount;
    mapping(uint256 => Article) public articles;
    
    // readReceipts[readerAddress][articleId] = true if paid
    mapping(address => mapping(uint256 => bool)) public readReceipts;
    
    // Writer Verification
    mapping(address => bool) public verifiedWriters;
    address public owner;

    // Fee Configurations (in basis points, 10000 = 100%)
    uint256 public defaultWriterBps = 8500;
    uint256 public defaultPlatformBps = 1000;
    uint256 public defaultReferrerBps = 500;

    uint256 public verifiedWriterBps = 9000;
    uint256 public verifiedPlatformBps = 700;
    uint256 public verifiedReferrerBps = 300;

    // Events
    event ArticlePublished(uint256 indexed id, address indexed author, string title);
    event ArticleRead(uint256 indexed id, address indexed reader, address indexed referrer, uint256 price);
    event WriterVerified(address indexed writer, bool status);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    /**
     * @param _usdc Address of the USDC token contract on Arc
     * @param _platformTreasury Address where platform fees are sent
     */
    constructor(address _usdc, address _platformTreasury) {
        owner = msg.sender;
        usdc = IERC20(_usdc);
        platformTreasury = _platformTreasury;
    }

    /**
     * @dev Publish a new article entirely on-chain.
     */
    function publishArticle(
        string memory _title,
        string memory _blurb,
        string memory _content,
        uint256 _price,
        string memory _category,
        uint256 _readTime
    ) external returns (uint256) {
        articleCount++;
        uint256 newId = articleCount;

        articles[newId] = Article({
            id: newId,
            author: msg.sender,
            title: _title,
            blurb: _blurb,
            content: _content,
            price: _price,
            category: _category,
            readTime: _readTime,
            timestamp: block.timestamp,
            reads: 0
        });

        // The author always has access to their own article
        readReceipts[msg.sender][newId] = true;

        emit ArticlePublished(newId, msg.sender, _title);
        return newId;
    }

    /**
     * @dev Pay to read an article. Handles the atomic fee split via USDC transferFrom.
     * Reader must have approved this contract to spend their USDC beforehand.
     */
    function payToRead(uint256 _articleId, address _referrer) external {
        Article storage article = articles[_articleId];
        require(article.id != 0, "Article does not exist");
        require(!readReceipts[msg.sender][_articleId], "Already paid");

        uint256 amount = article.price;
        bool isVerified = verifiedWriters[article.author];
        
        uint256 writerShare;
        uint256 platformShare;
        uint256 referrerShare;

        // Calculate splits
        if (isVerified) {
            writerShare = (amount * verifiedWriterBps) / 10000;
            platformShare = (amount * verifiedPlatformBps) / 10000;
            referrerShare = (amount * verifiedReferrerBps) / 10000;
        } else {
            writerShare = (amount * defaultWriterBps) / 10000;
            platformShare = (amount * defaultPlatformBps) / 10000;
            referrerShare = (amount * defaultReferrerBps) / 10000;
        }

        // Execute transfers
        // Assumes msg.sender has approved this contract for 'amount' USDC
        if (writerShare > 0) {
            require(usdc.transferFrom(msg.sender, article.author, writerShare), "USDC transfer to writer failed");
        }
        
        if (referrerShare > 0 && _referrer != address(0) && _referrer != msg.sender) {
            require(usdc.transferFrom(msg.sender, _referrer, referrerShare), "USDC transfer to referrer failed");
            if (platformShare > 0) {
                require(usdc.transferFrom(msg.sender, platformTreasury, platformShare), "USDC transfer to platform failed");
            }
        } else {
            // If no valid referrer, platform gets the referrer share too
            uint256 totalPlatformShare = platformShare + referrerShare;
            if (totalPlatformShare > 0) {
                require(usdc.transferFrom(msg.sender, platformTreasury, totalPlatformShare), "USDC transfer to platform failed");
            }
        }

        // Record receipt and increment reads
        readReceipts[msg.sender][_articleId] = true;
        article.reads++;

        emit ArticleRead(_articleId, msg.sender, _referrer, amount);
    }

    /**
     * @dev Get an article's public metadata (without the full content)
     */
    function getArticleMetadata(uint256 _articleId) external view returns (
        uint256 id, address author, string memory title, string memory blurb,
        uint256 price, string memory category, uint256 readTime, uint256 timestamp, uint256 reads
    ) {
        Article storage a = articles[_articleId];
        return (a.id, a.author, a.title, a.blurb, a.price, a.category, a.readTime, a.timestamp, a.reads);
    }

    /**
     * @dev Get the full article. 
     * NOTE: Since this is on a public blockchain, anyone can technically query this function off-chain.
     * The paywall logic acts as a frontend gate and social contract.
     */
    function getFullArticle(uint256 _articleId) external view returns (Article memory) {
        return articles[_articleId];
    }

    /**
     * @dev Check if a user has paid for an article
     */
    function hasReadReceipt(address _user, uint256 _articleId) external view returns (bool) {
        return readReceipts[_user][_articleId];
    }

    // --- Admin Functions ---

    function setVerifiedWriter(address _writer, bool _status) external onlyOwner {
        verifiedWriters[_writer] = _status;
        emit WriterVerified(_writer, _status);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }
}
