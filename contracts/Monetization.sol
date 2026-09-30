// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IRolesM {
    function isAdmin(address) external view returns (bool);
}

interface ISocialM {
    function followerCount(address) external view returns (uint32);
    function profileCreatedAt(address) external view returns (uint64);
}

interface IContentStoreM {
    function approvedCount(address) external view returns (uint256);
}

/**
 * @title Monetization
 * @notice Decides which creators may charge for content, subscriptions and tips.
 *
 *  A creator is monetized when (first match wins):
 *   1. they are blocked                        -> NO  (admin override)
 *   2. admin manually approved them            -> YES (manual mode)
 *   3. admin enabled monetization for everyone -> YES (all users)
 *   4. auto mode is on and they meet every
 *      threshold (followers / posts / age)     -> YES (auto mode)
 *
 *  Creators below the bar can `apply()`; admins then approve or reject (manual review).
 */
contract Monetization {
    error NotAdmin();
    error BadInput();
    error AlreadyMonetized();
    error AlreadyApplied();
    error NotMonetized();

    uint8 public constant NONE = 0;
    uint8 public constant PENDING = 1;
    uint8 public constant APPROVED = 2;
    uint8 public constant REJECTED = 3;
    uint8 public constant BLOCKED = 4;

    IRolesM public roles;
    ISocialM public social;
    IContentStoreM public content;

    bool public enabledForAll;
    bool public autoEnabled;
    uint32 public minFollowers;
    uint32 public minPosts;
    uint32 public minAccountDays;

    mapping(address => uint8) public status;

    struct Plan {
        uint256 monthly; // USDC (6 dec), 0 = not offered
        uint256 yearly;
        bool enabled;
    }
    mapping(address => Plan) private _plans;

    event EnabledForAllChanged(bool on);
    event AutoRulesChanged(bool enabled, uint32 minFollowers, uint32 minPosts, uint32 minAccountDays);
    event StatusChanged(address indexed creator, uint8 status, address by);
    event Applied(address indexed creator, string note);
    event PlanSet(address indexed creator, uint256 monthly, uint256 yearly, bool enabled);

    constructor(address _roles, address _social, address _content) {
        roles = IRolesM(_roles);
        social = ISocialM(_social);
        content = IContentStoreM(_content);
    }

    modifier onlyAdmin() {
        if (!roles.isAdmin(msg.sender)) revert NotAdmin();
        _;
    }

    // ── Admin: global switches ────────────────────────────────────
    function setEnabledForAll(bool on) external onlyAdmin {
        enabledForAll = on;
        emit EnabledForAllChanged(on);
    }

    function setAutoRules(bool enabled, uint32 followers, uint32 posts, uint32 accountDays) external onlyAdmin {
        autoEnabled = enabled;
        minFollowers = followers;
        minPosts = posts;
        minAccountDays = accountDays;
        emit AutoRulesChanged(enabled, followers, posts, accountDays);
    }

    // ── Admin: manual per-user control ────────────────────────────
    function setStatus(address creator, uint8 s) external onlyAdmin {
        _set(creator, s);
    }

    function setStatusBatch(address[] calldata creators, uint8 s) external onlyAdmin {
        for (uint256 i = 0; i < creators.length; i++) _set(creators[i], s);
    }

    function _set(address creator, uint8 s) internal {
        if (s > BLOCKED || creator == address(0)) revert BadInput();
        status[creator] = s;
        emit StatusChanged(creator, s, msg.sender);
    }

    // ── Creator: apply for manual review ──────────────────────────
    function apply_(string calldata note) external {
        if (isMonetized(msg.sender)) revert AlreadyMonetized();
        uint8 s = status[msg.sender];
        if (s == PENDING) revert AlreadyApplied();
        if (s == BLOCKED) revert NotMonetized();
        status[msg.sender] = PENDING;
        emit Applied(msg.sender, note);
        emit StatusChanged(msg.sender, PENDING, msg.sender);
    }

    // ── Creator: subscription plan ────────────────────────────────
    function setPlan(uint256 monthly, uint256 yearly, bool enabled) external {
        if (enabled && !isMonetized(msg.sender)) revert NotMonetized();
        _plans[msg.sender] = Plan(monthly, yearly, enabled);
        emit PlanSet(msg.sender, monthly, yearly, enabled);
    }

    function planOf(address creator) external view returns (Plan memory) {
        return _plans[creator];
    }

    // ── Views ─────────────────────────────────────────────────────
    function isMonetized(address a) public view returns (bool) {
        uint8 s = status[a];
        if (s == BLOCKED) return false;
        if (s == APPROVED) return true;
        if (enabledForAll) return true;
        if (autoEnabled) {
            (bool f, bool p, bool d) = autoProgress(a);
            return f && p && d;
        }
        return false;
    }

    /// @notice Which auto thresholds `a` currently meets (followers, posts, account age).
    function autoProgress(address a) public view returns (bool followersOk, bool postsOk, bool ageOk) {
        followersOk = social.followerCount(a) >= minFollowers;
        postsOk = content.approvedCount(a) >= minPosts;
        uint64 created = social.profileCreatedAt(a);
        ageOk = minAccountDays == 0 ? true : (created != 0 && block.timestamp >= uint256(created) + uint256(minAccountDays) * 1 days);
    }

    /// @notice Human-readable reason, for the UI: 0 none, 1 blocked, 2 manual, 3 all users, 4 auto
    function reason(address a) external view returns (uint8) {
        uint8 s = status[a];
        if (s == BLOCKED) return 1;
        if (s == APPROVED) return 2;
        if (enabledForAll) return 3;
        if (autoEnabled) {
            (bool f, bool p, bool d) = autoProgress(a);
            if (f && p && d) return 4;
        }
        return 0;
    }

    function rules()
        external
        view
        returns (bool all, bool auto_, uint32 followers, uint32 posts, uint32 accountDays)
    {
        return (enabledForAll, autoEnabled, minFollowers, minPosts, minAccountDays);
    }
}
