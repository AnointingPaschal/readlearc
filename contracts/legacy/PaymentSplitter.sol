// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PaymentSplitter {
    address public immutable treasury;
    uint256 public constant TOTAL_BASIS_POINTS = 10000;
    
    // Fee configurations (in basis points, e.g., 8500 = 85%)
    uint256 public defaultWriterBps = 8500;
    uint256 public defaultPlatformBps = 1000;
    uint256 public defaultReferrerBps = 500;

    uint256 public verifiedWriterBps = 9000;
    uint256 public verifiedPlatformBps = 700;
    uint256 public verifiedReferrerBps = 300;

    mapping(address => bool) public verifiedWriters;
    address public owner;

    event SplitUpdated(uint256 writerBps, uint256 platformBps, uint256 referrerBps, bool isVerified);
    event PaymentSplit(bytes32 indexed articleId, address indexed writer, address indexed referrer, uint256 totalAmount);
    event WriterVerified(address indexed writer, bool status);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _treasury) {
        owner = msg.sender;
        treasury = _treasury;
    }

    // Main splitting logic that would interface with ERC20/USDC
    // Note: This is a stub for the hackathon demo. In production, this would use SafeERC20 with USDC.
    function split(bytes32 articleId, uint256 amount, address writer, address referrer) external {
        bool isVerified = verifiedWriters[writer];
        
        uint256 writerShare;
        uint256 platformShare;
        uint256 referrerShare;

        if (isVerified) {
            writerShare = (amount * verifiedWriterBps) / TOTAL_BASIS_POINTS;
            platformShare = (amount * verifiedPlatformBps) / TOTAL_BASIS_POINTS;
            referrerShare = (amount * verifiedReferrerBps) / TOTAL_BASIS_POINTS;
        } else {
            writerShare = (amount * defaultWriterBps) / TOTAL_BASIS_POINTS;
            platformShare = (amount * defaultPlatformBps) / TOTAL_BASIS_POINTS;
            referrerShare = (amount * defaultReferrerBps) / TOTAL_BASIS_POINTS;
        }

        // Logic to transfer USDC shares would go here
        // IERC20(usdc).safeTransferFrom(msg.sender, writer, writerShare);
        // IERC20(usdc).safeTransferFrom(msg.sender, treasury, platformShare);
        // if (referrer != address(0)) {
        //     IERC20(usdc).safeTransferFrom(msg.sender, referrer, referrerShare);
        // }

        emit PaymentSplit(articleId, writer, referrer, amount);
    }

    function setVerifiedWriter(address writer, bool status) external onlyOwner {
        verifiedWriters[writer] = status;
        emit WriterVerified(writer, status);
    }

    function updateDefaultSplits(uint256 writerBps, uint256 platformBps, uint256 referrerBps) external onlyOwner {
        require(writerBps + platformBps + referrerBps == TOTAL_BASIS_POINTS, "Must equal 100%");
        defaultWriterBps = writerBps;
        defaultPlatformBps = platformBps;
        defaultReferrerBps = referrerBps;
        emit SplitUpdated(writerBps, platformBps, referrerBps, false);
    }

    function updateVerifiedSplits(uint256 writerBps, uint256 platformBps, uint256 referrerBps) external onlyOwner {
        require(writerBps + platformBps + referrerBps == TOTAL_BASIS_POINTS, "Must equal 100%");
        verifiedWriterBps = writerBps;
        verifiedPlatformBps = platformBps;
        verifiedReferrerBps = referrerBps;
        emit SplitUpdated(writerBps, platformBps, referrerBps, true);
    }
}
