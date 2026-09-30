// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20P {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

interface IRolesP {
    function isAdmin(address) external view returns (bool);
}

interface IContentStoreP {
    function core(uint256 id)
        external
        view
        returns (address author, uint8 kind, uint8 status, bool finalized, uint256 price);
}

interface IMonetizationP {
    struct Plan {
        uint256 monthly;
        uint256 yearly;
        bool enabled;
    }

    function isMonetized(address) external view returns (bool);
    function planOf(address) external view returns (Plan memory);
}

/**
 * @title Payments
 * @notice USDC payments for on-chain content. Payment = receipt: access is decided by reading
 *         this contract (`hasAccess`), so nothing has to be trusted off-chain.
 *
 *  - payToRead      one-off article unlock, split writer / platform / referrer
 *  - subscribe      monthly or yearly subscription to one creator, unlocks all their paid content
 *  - tip            direct tip with a small platform fee
 *
 *  Every method that takes money only works for creators that Monetization.isMonetized().
 */
contract Payments {
    error NotAdmin();
    error ZeroAddress();
    error NotForSale();
    error NotFound();
    error AlreadyUnlocked();
    error BadSplit();
    error PayFailed();
    error NoPlan();
    error BadInput();

    uint256 public constant BPS = 10_000;
    uint8 private constant ARTICLE = 0;
    uint8 private constant APPROVED = 1;

    IERC20P public immutable usdc;
    IRolesP public roles;
    IContentStoreP public store;
    IMonetizationP public monetization;
    address public treasury;

    uint256 public writerBps = 8500;
    uint256 public platformBps = 1000;
    uint256 public referrerBps = 500;
    uint256 public subFeeBps = 200;
    uint256 public tipFeeBps = 200;

    mapping(address => bool) public verified; // verified writers skip the referrer cut

    mapping(uint256 => mapping(address => bool)) public paid;
    mapping(uint256 => uint32) public reads;
    mapping(address => mapping(address => uint256)) public subscriptionExpiry; // creator => subscriber => expiry
    mapping(address => uint256) public earned; // lifetime creator USDC received through this contract

    event ArticlePaid(
        uint256 indexed contentId,
        address indexed reader,
        address indexed writer,
        uint256 amount,
        uint256 writerShare,
        uint256 platformShare,
        uint256 referrerShare
    );
    event Subscribed(
        address indexed creator,
        address indexed subscriber,
        uint8 plan,
        uint256 expiry,
        uint256 amount,
        uint256 creatorShare
    );
    event Tipped(
        address indexed from,
        address indexed creator,
        uint256 indexed contentId,
        uint256 amount,
        uint256 creatorShare
    );
    event WriterVerified(address indexed writer, bool status);
    event SplitsUpdated(uint256 writerBps, uint256 platformBps, uint256 referrerBps);
    event FeesUpdated(uint256 subFeeBps, uint256 tipFeeBps);
    event TreasuryUpdated(address treasury);

    constructor(address _usdc, address _roles, address _store, address _monetization, address _treasury) {
        if (_usdc == address(0) || _roles == address(0) || _treasury == address(0)) revert ZeroAddress();
        usdc = IERC20P(_usdc);
        roles = IRolesP(_roles);
        store = IContentStoreP(_store);
        monetization = IMonetizationP(_monetization);
        treasury = _treasury;
    }

    modifier onlyAdmin() {
        if (!roles.isAdmin(msg.sender)) revert NotAdmin();
        _;
    }

    // ── Article unlock ────────────────────────────────────────────
    function payToRead(uint256 contentId, address referrer) external {
        (address author, uint8 kind, uint8 status, bool fin, uint256 price) = store.core(contentId);
        if (author == address(0)) revert NotFound();
        if (kind != ARTICLE || status != APPROVED || !fin) revert NotForSale();
        if (price == 0 || !monetization.isMonetized(author)) revert NotForSale();
        if (author == msg.sender || paid[contentId][msg.sender]) revert AlreadyUnlocked();

        uint256 writerShare;
        uint256 platformShare;
        uint256 referrerShare;
        if (verified[author] || referrer == address(0) || referrer == msg.sender || referrer == author) {
            writerShare = (price * (writerBps + referrerBps)) / BPS;
            platformShare = price - writerShare;
        } else {
            writerShare = (price * writerBps) / BPS;
            platformShare = (price * platformBps) / BPS;
            referrerShare = price - writerShare - platformShare;
        }

        paid[contentId][msg.sender] = true;
        reads[contentId] += 1;
        earned[author] += writerShare;

        _pull(author, writerShare);
        _pull(treasury, platformShare);
        if (referrerShare > 0) _pull(referrer, referrerShare);

        emit ArticlePaid(contentId, msg.sender, author, price, writerShare, platformShare, referrerShare);
    }

    // ── Subscriptions ─────────────────────────────────────────────
    /// @param plan 0 = monthly (30 days), 1 = yearly (365 days)
    function subscribe(address creator, uint8 plan) external {
        if (creator == address(0) || creator == msg.sender || plan > 1) revert BadInput();
        if (!monetization.isMonetized(creator)) revert NotForSale();
        IMonetizationP.Plan memory p = monetization.planOf(creator);
        uint256 price = plan == 0 ? p.monthly : p.yearly;
        if (!p.enabled || price == 0) revert NoPlan();

        uint256 cur = subscriptionExpiry[creator][msg.sender];
        uint256 start = cur > block.timestamp ? cur : block.timestamp;
        uint256 expiry = start + (plan == 0 ? 30 days : 365 days);
        subscriptionExpiry[creator][msg.sender] = expiry;

        uint256 fee = (price * subFeeBps) / BPS;
        uint256 creatorShare = price - fee;
        earned[creator] += creatorShare;
        _pull(creator, creatorShare);
        if (fee > 0) _pull(treasury, fee);

        emit Subscribed(creator, msg.sender, plan, expiry, price, creatorShare);
    }

    function isSubscribed(address creator, address subscriber) public view returns (bool) {
        return subscriptionExpiry[creator][subscriber] >= block.timestamp;
    }

    // ── Tips ──────────────────────────────────────────────────────
    function tip(address creator, uint256 amount, uint256 contentId) external {
        if (creator == address(0) || amount == 0 || creator == msg.sender) revert BadInput();
        if (!monetization.isMonetized(creator)) revert NotForSale();
        uint256 fee = (amount * tipFeeBps) / BPS;
        uint256 creatorShare = amount - fee;
        earned[creator] += creatorShare;
        _pull(creator, creatorShare);
        if (fee > 0) _pull(treasury, fee);
        emit Tipped(msg.sender, creator, contentId, amount, creatorShare);
    }

    // ── Access ────────────────────────────────────────────────────
    /// @notice The access rule used by the UI and by the key-release function.
    function hasAccess(uint256 contentId, address reader) external view returns (bool) {
        (address author,, uint8 status, bool fin, uint256 price) = store.core(contentId);
        if (author == address(0)) return false;
        if (reader == author) return true;
        if (status != APPROVED || !fin) return false;
        if (price == 0 || !monetization.isMonetized(author)) return true;
        if (paid[contentId][reader]) return true;
        return isSubscribed(author, reader);
    }

    /// @notice Batch read used by feeds (unlock counts per content id).
    function readsBatch(uint256[] calldata ids) external view returns (uint32[] memory out) {
        out = new uint32[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) out[i] = reads[ids[i]];
    }

    // ── Admin ─────────────────────────────────────────────────────
    function setVerified(address writer, bool status) external onlyAdmin {
        verified[writer] = status;
        emit WriterVerified(writer, status);
    }

    function setSplits(uint256 _writer, uint256 _platform, uint256 _referrer) external onlyAdmin {
        if (_writer + _platform + _referrer != BPS) revert BadSplit();
        writerBps = _writer;
        platformBps = _platform;
        referrerBps = _referrer;
        emit SplitsUpdated(_writer, _platform, _referrer);
    }

    function setFees(uint256 _subFeeBps, uint256 _tipFeeBps) external onlyAdmin {
        if (_subFeeBps > 2000 || _tipFeeBps > 2000) revert BadSplit();
        subFeeBps = _subFeeBps;
        tipFeeBps = _tipFeeBps;
        emit FeesUpdated(_subFeeBps, _tipFeeBps);
    }

    function setTreasury(address t) external onlyAdmin {
        if (t == address(0)) revert ZeroAddress();
        treasury = t;
        emit TreasuryUpdated(t);
    }

    function _pull(address to, uint256 amount) internal {
        if (amount == 0) return;
        if (!usdc.transferFrom(msg.sender, to, amount)) revert PayFailed();
    }
}
