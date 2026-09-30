// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IRolesCS {
    function isMod(address) external view returns (bool);
    function isAdmin(address) external view returns (bool);
}

interface IMonetizationCS {
    function isMonetized(address) external view returns (bool);
}

/**
 * @title ContentStore
 * @notice Articles and videos stored fully on-chain.
 *
 *  - Small, list-friendly metadata lives in contract storage (title, blurb, price, …).
 *  - The heavy body (article HTML / encrypted video segments) is written as `Chunk` event
 *    logs. Logs are permanent consensus data on the chain, ~3x cheaper than storage, and
 *    are retrievable with a single eth_getLogs call bounded by [firstBlock, lastBlock].
 *  - Paid content is encrypted client-side before it is written; the decryption key is
 *    released only to wallets with an on-chain receipt (see Payments.hasAccess).
 *
 * Content can never be erased from the chain. `remove` only hides it from the platform.
 */
contract ContentStore {
    // ── Errors ────────────────────────────────────────────────────
    error NotAuthor();
    error NotMod();
    error NotAdmin();
    error NotFound();
    error Finalized();
    error NotFinalized();
    error BadInput();
    error SlugTaken();
    error NotMonetized();
    error ZeroAddress();

    // ── Types ─────────────────────────────────────────────────────
    uint8 public constant ARTICLE = 0;
    uint8 public constant VIDEO = 1;

    uint8 public constant PENDING = 0;
    uint8 public constant APPROVED = 1;
    uint8 public constant REJECTED = 2;
    uint8 public constant REMOVED = 3;

    struct Meta {
        uint8 kind;
        string title;
        string blurb;
        string category;
        string slug;      // videos: unique, url friendly. articles: empty
        string preview;   // articles: free preview text/html shown before unlock
        string mime;      // videos: e.g. "application/x-rl-hls"
        uint256 price;    // article: USDC (6 dec). video: USDC per second (6 dec). 0 = free
        uint32 readTime;
        uint32 durationSecs;
        uint32 freePreviewSecs;
        bool isResearch;
        bool encrypted;   // body chunks are AES-GCM encrypted (paid content)
    }

    struct Content {
        address author;
        uint8 kind;
        uint8 status;
        bool featured;
        bool finalized;
        bool isResearch;
        bool encrypted;
        bool hasThumb;
        uint32 version;
        uint32 chunkCount;
        uint32 readTime;
        uint32 durationSecs;
        uint32 freePreviewSecs;
        uint64 createdAt;
        uint64 updatedAt;
        uint64 firstBlock;
        uint64 lastBlock;
        uint64 thumbBlock;
        uint256 price;
        bytes32 bodyHash;
        string title;
        string blurb;
        string category;
        string slug;
        string preview;
        string mime;
    }

    /// @dev Light-weight projection for feeds (no preview body, no chunk bookkeeping).
    struct Card {
        address author;
        uint8 kind;
        uint8 status;
        bool featured;
        bool finalized;
        bool isResearch;
        bool encrypted;
        bool hasThumb;
        uint32 version;
        uint32 readTime;
        uint32 durationSecs;
        uint32 freePreviewSecs;
        uint64 createdAt;
        uint64 thumbBlock;
        uint256 price;
        string title;
        string blurb;
        string category;
        string slug;
    }

    // ── State ─────────────────────────────────────────────────────
    IRolesCS public roles;
    IMonetizationCS public monetization; // optional until wired

    uint256 public count;
    bool public autoApprove;

    mapping(uint256 => Content) private _c;
    mapping(bytes32 => uint256) public slugToId;
    mapping(address => uint256[]) private _byAuthor;
    mapping(address => uint256) public approvedCount; // approved, non-removed posts per author

    // ── Events ────────────────────────────────────────────────────
    event ContentCreated(uint256 indexed id, address indexed author, uint8 kind, string title);
    event ContentUpdated(uint256 indexed id);
    event ContentFinalized(uint256 indexed id, uint32 version, uint32 chunkCount, bytes32 bodyHash);
    event RewriteStarted(uint256 indexed id, uint32 version);
    event StatusChanged(uint256 indexed id, uint8 status, address by);
    event FeaturedChanged(uint256 indexed id, bool featured);
    event Chunk(uint256 indexed id, uint32 indexed version, uint32 indexed index, bytes data);
    event Thumb(uint256 indexed id, bytes data);
    event AutoApproveChanged(bool on);
    event MonetizationSet(address monetization);

    constructor(address _roles) {
        if (_roles == address(0)) revert ZeroAddress();
        roles = IRolesCS(_roles);
    }

    modifier onlyAuthor(uint256 id) {
        if (_c[id].author == address(0)) revert NotFound();
        if (_c[id].author != msg.sender) revert NotAuthor();
        _;
    }
    modifier onlyMod() {
        if (!roles.isMod(msg.sender)) revert NotMod();
        _;
    }

    // ── Admin ─────────────────────────────────────────────────────
    function setMonetization(address m) external {
        if (!roles.isAdmin(msg.sender)) revert NotAdmin();
        monetization = IMonetizationCS(m);
        emit MonetizationSet(m);
    }

    function setAutoApprove(bool on) external {
        if (!roles.isAdmin(msg.sender)) revert NotAdmin();
        autoApprove = on;
        emit AutoApproveChanged(on);
    }

    // ── Create / edit ─────────────────────────────────────────────
    function create(Meta calldata m) external returns (uint256 id) {
        if (m.kind > 1 || bytes(m.title).length == 0 || bytes(m.title).length > 300) revert BadInput();
        if (bytes(m.preview).length > 4000 || bytes(m.blurb).length > 1000) revert BadInput();
        _checkPrice(m.price);

        if (bytes(m.slug).length > 0) {
            bytes32 sh = keccak256(bytes(m.slug));
            if (slugToId[sh] != 0) revert SlugTaken();
            id = ++count;
            slugToId[sh] = id;
        } else {
            if (m.kind == VIDEO) revert BadInput(); // videos need a slug
            id = ++count;
        }

        Content storage c = _c[id];
        c.author = msg.sender;
        c.kind = m.kind;
        c.status = (autoApprove || roles.isMod(msg.sender)) ? APPROVED : PENDING;
        if (c.status == APPROVED) approvedCount[msg.sender] += 1;
        c.isResearch = m.isResearch;
        c.encrypted = m.encrypted;
        c.version = 1;
        c.readTime = m.readTime;
        c.durationSecs = m.durationSecs;
        c.freePreviewSecs = m.freePreviewSecs;
        c.createdAt = uint64(block.timestamp);
        c.updatedAt = uint64(block.timestamp);
        c.price = m.price;
        c.title = m.title;
        c.blurb = m.blurb;
        c.category = m.category;
        c.slug = m.slug;
        c.preview = m.preview;
        c.mime = m.mime;

        _byAuthor[msg.sender].push(id);
        emit ContentCreated(id, msg.sender, m.kind, m.title);
        emit StatusChanged(id, c.status, msg.sender);
    }

    /// @notice Edit metadata (not the body). Slug and kind are immutable.
    function update(uint256 id, Meta calldata m) external onlyAuthor(id) {
        Content storage c = _c[id];
        if (bytes(m.title).length == 0 || bytes(m.title).length > 300) revert BadInput();
        if (bytes(m.preview).length > 4000 || bytes(m.blurb).length > 1000) revert BadInput();
        if (c.status == REMOVED) revert NotFound();
        _checkPrice(m.price);
        c.title = m.title;
        c.blurb = m.blurb;
        c.category = m.category;
        c.preview = m.preview;
        c.price = m.price;
        c.readTime = m.readTime;
        c.durationSecs = m.durationSecs;
        c.freePreviewSecs = m.freePreviewSecs;
        c.isResearch = m.isResearch;
        c.encrypted = m.encrypted;
        c.updatedAt = uint64(block.timestamp);
        emit ContentUpdated(id);
    }

    // ── Body (chunk stream) ───────────────────────────────────────
    function writeChunks(uint256 id, uint32 startIndex, bytes[] calldata chunks) external onlyAuthor(id) {
        Content storage c = _c[id];
        if (c.finalized) revert Finalized();
        if (chunks.length == 0) revert BadInput();
        if (c.firstBlock == 0) c.firstBlock = uint64(block.number);
        c.lastBlock = uint64(block.number);
        uint32 v = c.version;
        for (uint256 i = 0; i < chunks.length; i++) {
            emit Chunk(id, v, startIndex + uint32(i), chunks[i]);
        }
    }

    function setThumb(uint256 id, bytes calldata data) external onlyAuthor(id) {
        if (data.length == 0 || data.length > 60_000) revert BadInput();
        Content storage c = _c[id];
        c.hasThumb = true;
        c.thumbBlock = uint64(block.number);
        emit Thumb(id, data);
    }

    function finalize(uint256 id, uint32 chunkCount, bytes32 bodyHash) external onlyAuthor(id) {
        Content storage c = _c[id];
        if (c.finalized) revert Finalized();
        if (chunkCount == 0 || c.firstBlock == 0) revert BadInput();
        c.finalized = true;
        c.chunkCount = chunkCount;
        c.bodyHash = bodyHash;
        c.updatedAt = uint64(block.timestamp);
        emit ContentFinalized(id, c.version, chunkCount, bodyHash);
    }

    /// @notice Start replacing the body with a new version (used by "edit article").
    function beginRewrite(uint256 id) external onlyAuthor(id) {
        Content storage c = _c[id];
        if (c.status == REMOVED) revert NotFound();
        c.version += 1;
        c.finalized = false;
        c.chunkCount = 0;
        c.firstBlock = 0;
        c.lastBlock = 0;
        c.bodyHash = bytes32(0);
        emit RewriteStarted(id, c.version);
    }

    /// @notice Author puts a rejected piece back in the review queue after editing it.
    function resubmit(uint256 id) external onlyAuthor(id) {
        Content storage c = _c[id];
        if (c.status != REJECTED) revert BadInput();
        _setStatus(id, c, PENDING);
    }

    // ── Moderation ────────────────────────────────────────────────
    function setStatus(uint256 id, uint8 status) external onlyMod {
        Content storage c = _c[id];
        if (c.author == address(0)) revert NotFound();
        if (status > REMOVED) revert BadInput();
        _setStatus(id, c, status);
    }

    function setFeatured(uint256 id, bool featured) external onlyMod {
        Content storage c = _c[id];
        if (c.author == address(0)) revert NotFound();
        c.featured = featured;
        emit FeaturedChanged(id, featured);
    }

    /// @notice Author (or a moderator) hides content from the platform.
    function remove(uint256 id) external {
        Content storage c = _c[id];
        if (c.author == address(0)) revert NotFound();
        if (msg.sender != c.author && !roles.isMod(msg.sender)) revert NotAuthor();
        _setStatus(id, c, REMOVED);
    }

    function _setStatus(uint256 id, Content storage c, uint8 status) internal {
        bool wasCounted = c.status == APPROVED;
        bool nowCounted = status == APPROVED;
        if (wasCounted && !nowCounted) approvedCount[c.author] -= 1;
        if (!wasCounted && nowCounted) approvedCount[c.author] += 1;
        c.status = status;
        if (status == REMOVED) c.featured = false;
        emit StatusChanged(id, status, msg.sender);
    }

    function _checkPrice(uint256 price) internal view {
        if (price == 0) return;
        address m = address(monetization);
        if (m != address(0) && !IMonetizationCS(m).isMonetized(msg.sender)) revert NotMonetized();
    }

    // ── Views ─────────────────────────────────────────────────────
    function get(uint256 id) external view returns (Content memory) {
        if (_c[id].author == address(0)) revert NotFound();
        return _c[id];
    }

    /// @notice Inclusive range read used by feeds and admin lists. Skips nothing; caller filters.
    function getRange(uint256 fromId, uint256 toId) external view returns (uint256[] memory ids, Content[] memory out) {
        if (toId > count) toId = count;
        if (fromId == 0) fromId = 1;
        if (fromId > toId) return (new uint256[](0), new Content[](0));
        uint256 n = toId - fromId + 1;
        ids = new uint256[](n);
        out = new Content[](n);
        for (uint256 i = 0; i < n; i++) {
            ids[i] = fromId + i;
            out[i] = _c[fromId + i];
        }
    }

    /// @notice Inclusive id range of feed cards (ids are fromId..toId, clamped to count).
    function getCards(uint256 fromId, uint256 toId) external view returns (Card[] memory out) {
        if (toId > count) toId = count;
        if (fromId == 0) fromId = 1;
        if (fromId > toId) return new Card[](0);
        uint256 n = toId - fromId + 1;
        out = new Card[](n);
        for (uint256 i = 0; i < n; i++) {
            Content storage c = _c[fromId + i];
            out[i] = Card(
                c.author, c.kind, c.status, c.featured, c.finalized, c.isResearch, c.encrypted, c.hasThumb,
                c.version, c.readTime, c.durationSecs, c.freePreviewSecs, c.createdAt, c.thumbBlock, c.price,
                c.title, c.blurb, c.category, c.slug
            );
        }
    }

    /// @notice Cheap cross-contract read used by Payments / Monetization.
    function core(uint256 id)
        external
        view
        returns (address author, uint8 kind, uint8 status, bool finalized, uint256 price)
    {
        Content storage c = _c[id];
        return (c.author, c.kind, c.status, c.finalized, c.price);
    }

    function idsByAuthor(address a) external view returns (uint256[] memory) {
        return _byAuthor[a];
    }

    function idBySlug(string calldata slug) external view returns (uint256) {
        return slugToId[keccak256(bytes(slug))];
    }
}
