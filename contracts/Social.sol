// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IRolesS {
    function isMod(address) external view returns (bool);
}

/**
 * @title Social
 * @notice Profiles, followers, comments, reactions and communities — all on-chain.
 *         Lists (followers, members, comments, posts) are emitted as events and folded by the
 *         client; counters and membership flags needed for access control live in storage.
 */
contract Social {
    error NotMod();
    error BadInput();
    error UsernameTaken();
    error NotOwner();
    error NotMember();
    error NotFound();
    error AlreadyDone();

    IRolesS public roles;

    constructor(address _roles) {
        roles = IRolesS(_roles);
    }

    // ═════════════════════════════ Profiles ═════════════════════════════
    struct Profile {
        string username;
        string displayName;
        string bio;
        string avatarColor;
        string website;
        string twitter;
        uint64 createdAt;
        uint64 updatedAt;
    }

    mapping(address => Profile) private _profiles;
    mapping(bytes32 => address) public usernameOwner;

    event ProfileSet(address indexed user, string username);

    function setProfile(
        string calldata username,
        string calldata displayName,
        string calldata bio,
        string calldata avatarColor,
        string calldata website,
        string calldata twitter
    ) external {
        bytes memory u = bytes(username);
        if (u.length < 3 || u.length > 30) revert BadInput();
        for (uint256 i = 0; i < u.length; i++) {
            bytes1 ch = u[i];
            bool ok = (ch >= 0x61 && ch <= 0x7a) || (ch >= 0x30 && ch <= 0x39) || ch == 0x5f;
            if (!ok) revert BadInput();
        }
        if (bytes(bio).length > 500 || bytes(displayName).length > 100) revert BadInput();

        bytes32 h = keccak256(u);
        address holder = usernameOwner[h];
        if (holder != address(0) && holder != msg.sender) revert UsernameTaken();

        Profile storage p = _profiles[msg.sender];
        if (bytes(p.username).length > 0) {
            bytes32 old = keccak256(bytes(p.username));
            if (old != h) delete usernameOwner[old];
        }
        usernameOwner[h] = msg.sender;
        if (p.createdAt == 0) p.createdAt = uint64(block.timestamp);
        p.username = username;
        p.displayName = displayName;
        p.bio = bio;
        p.avatarColor = avatarColor;
        p.website = website;
        p.twitter = twitter;
        p.updatedAt = uint64(block.timestamp);
        emit ProfileSet(msg.sender, username);
    }

    function profileOf(address a) external view returns (Profile memory) {
        return _profiles[a];
    }

    /// @notice Batch profile read for feeds and member lists.
    function profilesOf(address[] calldata a) external view returns (Profile[] memory out) {
        out = new Profile[](a.length);
        for (uint256 i = 0; i < a.length; i++) out[i] = _profiles[a[i]];
    }

    function profileCreatedAt(address a) external view returns (uint64) {
        return _profiles[a].createdAt;
    }

    function addressOfUsername(string calldata username) external view returns (address) {
        return usernameOwner[keccak256(bytes(username))];
    }

    // ═════════════════════════════ Follows ═════════════════════════════
    mapping(address => mapping(address => bool)) public isFollowing;
    mapping(address => uint32) public followerCount;
    mapping(address => uint32) public followingCount;

    event Followed(address indexed follower, address indexed target);
    event Unfollowed(address indexed follower, address indexed target);

    function follow(address target) external {
        if (target == msg.sender || target == address(0)) revert BadInput();
        if (isFollowing[msg.sender][target]) revert AlreadyDone();
        isFollowing[msg.sender][target] = true;
        followerCount[target] += 1;
        followingCount[msg.sender] += 1;
        emit Followed(msg.sender, target);
    }

    function unfollow(address target) external {
        if (!isFollowing[msg.sender][target]) revert AlreadyDone();
        isFollowing[msg.sender][target] = false;
        followerCount[target] -= 1;
        followingCount[msg.sender] -= 1;
        emit Unfollowed(msg.sender, target);
    }

    // ═════════════════════════════ Comments ═════════════════════════════
    uint256 public commentCount;
    mapping(uint256 => address) public commentAuthor;
    mapping(uint256 => uint256) public commentContent;

    event Commented(uint256 indexed contentId, uint256 indexed id, address indexed author, uint256 parentId, string text);
    event CommentEdited(uint256 indexed contentId, uint256 indexed id, string text);
    event CommentDeleted(uint256 indexed contentId, uint256 indexed id, address by);

    function comment(uint256 contentId, string calldata text, uint256 parentId) external returns (uint256 id) {
        if (bytes(text).length == 0 || bytes(text).length > 2000) revert BadInput();
        if (parentId != 0 && commentContent[parentId] != contentId) revert BadInput();
        id = ++commentCount;
        commentAuthor[id] = msg.sender;
        commentContent[id] = contentId;
        emit Commented(contentId, id, msg.sender, parentId, text);
    }

    function editComment(uint256 id, string calldata text) external {
        if (commentAuthor[id] != msg.sender) revert NotOwner();
        if (bytes(text).length == 0 || bytes(text).length > 2000) revert BadInput();
        emit CommentEdited(commentContent[id], id, text);
    }

    function deleteComment(uint256 id) external {
        address a = commentAuthor[id];
        if (a == address(0)) revert NotFound();
        if (a != msg.sender && !roles.isMod(msg.sender)) revert NotOwner();
        emit CommentDeleted(commentContent[id], id, msg.sender);
    }

    // ═════════════════════════════ Reactions ═════════════════════════════
    // key 1..6: flame, zap, gem, thumbsdown, cloudrain, xoctagon. 0 clears.
    mapping(uint256 => mapping(address => uint8)) public reactionOf;
    mapping(uint256 => uint32[7]) private _reactionCounts;

    event Reacted(uint256 indexed contentId, address indexed user, uint8 key);

    function react(uint256 contentId, uint8 key) external {
        if (key > 6) revert BadInput();
        uint8 prev = reactionOf[contentId][msg.sender];
        if (prev == key) return;
        if (prev != 0) _reactionCounts[contentId][prev] -= 1;
        if (key != 0) _reactionCounts[contentId][key] += 1;
        reactionOf[contentId][msg.sender] = key;
        emit Reacted(contentId, msg.sender, key);
    }

    function reactionCounts(uint256 contentId) external view returns (uint32[7] memory) {
        return _reactionCounts[contentId];
    }

    // ═════════════════════════════ Communities ═════════════════════════════
    struct Group {
        address owner;
        bool isPrivate;
        bool active;
        uint64 createdAt;
        uint32 memberCount;
        uint32 postCount;
        string name;
        string description;
        string category;
        string banner;
        string rules;
        string tags; // comma separated
    }

    uint256 public groupCount;
    uint256 public postCount;
    mapping(uint256 => Group) private _groups;
    mapping(uint256 => mapping(address => bool)) public isMember;
    mapping(uint256 => mapping(address => bool)) public hasRequested;
    mapping(uint256 => uint256) public postGroup;
    mapping(uint256 => address) public postAuthor;
    mapping(uint256 => mapping(address => bool)) public postLiked;

    event GroupCreated(uint256 indexed id, address indexed owner, string name);
    event GroupUpdated(uint256 indexed id);
    event GroupDeleted(uint256 indexed id, address by);
    event Joined(uint256 indexed groupId, address indexed member);
    event JoinRequested(uint256 indexed groupId, address indexed user);
    event Left(uint256 indexed groupId, address indexed member, address by);
    event GroupPosted(
        uint256 indexed groupId,
        uint256 indexed postId,
        address indexed author,
        uint256 articleId,
        string postType,
        string content
    );
    event GroupPostDeleted(uint256 indexed groupId, uint256 indexed postId, address by);
    event GroupPostLiked(uint256 indexed groupId, uint256 indexed postId, address indexed user);

    function createGroup(
        string calldata name,
        string calldata description,
        string calldata category,
        string calldata banner,
        string calldata rules,
        string calldata tags,
        bool isPrivate
    ) external returns (uint256 id) {
        if (bytes(name).length == 0 || bytes(name).length > 100) revert BadInput();
        id = ++groupCount;
        Group storage g = _groups[id];
        g.owner = msg.sender;
        g.isPrivate = isPrivate;
        g.active = true;
        g.createdAt = uint64(block.timestamp);
        g.memberCount = 1;
        g.name = name;
        g.description = description;
        g.category = category;
        g.banner = banner;
        g.rules = rules;
        g.tags = tags;
        isMember[id][msg.sender] = true;
        emit GroupCreated(id, msg.sender, name);
        emit Joined(id, msg.sender);
    }

    function updateGroup(
        uint256 id,
        string calldata name,
        string calldata description,
        string calldata banner,
        string calldata rules,
        string calldata tags
    ) external {
        Group storage g = _groups[id];
        if (!g.active) revert NotFound();
        if (g.owner != msg.sender) revert NotOwner();
        if (bytes(name).length == 0 || bytes(name).length > 100) revert BadInput();
        g.name = name;
        g.description = description;
        g.banner = banner;
        g.rules = rules;
        g.tags = tags;
        emit GroupUpdated(id);
    }

    function deleteGroup(uint256 id) external {
        Group storage g = _groups[id];
        if (!g.active) revert NotFound();
        if (g.owner != msg.sender && !roles.isMod(msg.sender)) revert NotOwner();
        g.active = false;
        emit GroupDeleted(id, msg.sender);
    }

    function setPrivate(uint256 id, bool priv) external {
        Group storage g = _groups[id];
        if (!g.active) revert NotFound();
        if (g.owner != msg.sender && !roles.isMod(msg.sender)) revert NotOwner();
        g.isPrivate = priv;
        emit GroupUpdated(id);
    }

    /// @notice Public groups: join instantly. Private groups: file a request the owner approves.
    function join(uint256 id) external {
        Group storage g = _groups[id];
        if (!g.active) revert NotFound();
        if (isMember[id][msg.sender]) revert AlreadyDone();
        if (g.isPrivate) {
            if (hasRequested[id][msg.sender]) revert AlreadyDone();
            hasRequested[id][msg.sender] = true;
            emit JoinRequested(id, msg.sender);
            return;
        }
        isMember[id][msg.sender] = true;
        g.memberCount += 1;
        emit Joined(id, msg.sender);
    }

    function approveMember(uint256 id, address user) external {
        Group storage g = _groups[id];
        if (!g.active) revert NotFound();
        if (g.owner != msg.sender) revert NotOwner();
        if (isMember[id][user]) revert AlreadyDone();
        hasRequested[id][user] = false;
        isMember[id][user] = true;
        g.memberCount += 1;
        emit Joined(id, user);
    }

    function leave(uint256 id) external {
        Group storage g = _groups[id];
        if (g.owner == msg.sender) revert NotOwner(); // owner cannot leave
        if (!isMember[id][msg.sender]) revert NotMember();
        isMember[id][msg.sender] = false;
        g.memberCount -= 1;
        emit Left(id, msg.sender, msg.sender);
    }

    function removeMember(uint256 id, address user) external {
        Group storage g = _groups[id];
        if (!g.active) revert NotFound();
        if (g.owner != msg.sender && !roles.isMod(msg.sender)) revert NotOwner();
        if (user == g.owner || !isMember[id][user]) revert BadInput();
        isMember[id][user] = false;
        g.memberCount -= 1;
        emit Left(id, user, msg.sender);
    }

    function post(uint256 groupId, string calldata content, uint256 articleId, string calldata postType)
        external
        returns (uint256 id)
    {
        Group storage g = _groups[groupId];
        if (!g.active) revert NotFound();
        if (!isMember[groupId][msg.sender]) revert NotMember();
        if (bytes(content).length == 0 || bytes(content).length > 100_000) revert BadInput();
        id = ++postCount;
        postGroup[id] = groupId;
        postAuthor[id] = msg.sender;
        g.postCount += 1;
        emit GroupPosted(groupId, id, msg.sender, articleId, postType, content);
    }

    function deletePost(uint256 postId) external {
        uint256 gid = postGroup[postId];
        Group storage g = _groups[gid];
        if (postAuthor[postId] == address(0)) revert NotFound();
        if (postAuthor[postId] != msg.sender && g.owner != msg.sender && !roles.isMod(msg.sender)) revert NotOwner();
        if (g.postCount > 0) g.postCount -= 1;
        emit GroupPostDeleted(gid, postId, msg.sender);
    }

    function likePost(uint256 postId) external {
        uint256 gid = postGroup[postId];
        if (postAuthor[postId] == address(0)) revert NotFound();
        if (postLiked[postId][msg.sender]) revert AlreadyDone();
        postLiked[postId][msg.sender] = true;
        emit GroupPostLiked(gid, postId, msg.sender);
    }

    function getGroup(uint256 id) external view returns (Group memory) {
        return _groups[id];
    }

    function getGroups(uint256 fromId, uint256 toId) external view returns (uint256[] memory ids, Group[] memory out) {
        if (toId > groupCount) toId = groupCount;
        if (fromId == 0) fromId = 1;
        if (fromId > toId) return (new uint256[](0), new Group[](0));
        uint256 n = toId - fromId + 1;
        ids = new uint256[](n);
        out = new Group[](n);
        for (uint256 i = 0; i < n; i++) {
            ids[i] = fromId + i;
            out[i] = _groups[fromId + i];
        }
    }
}
