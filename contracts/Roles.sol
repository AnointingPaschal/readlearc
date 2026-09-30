// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title Roles
 * @notice Single source of truth for platform permissions.
 *         0 = user, 1 = moderator, 2 = admin, 3 = super admin. The deployer is the owner
 *         (always super admin) and can grant/revoke every role.
 */
contract Roles {
    error NotOwner();
    error ZeroAddress();

    address public owner;
    mapping(address => uint8) public roles;

    event RoleSet(address indexed user, uint8 role);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    function roleOf(address a) public view returns (uint8) {
        return a == owner ? 3 : roles[a];
    }

    function isMod(address a) external view returns (bool) {
        return roleOf(a) >= 1;
    }

    function isAdmin(address a) external view returns (bool) {
        return roleOf(a) >= 2;
    }

    function setRole(address user, uint8 role) external onlyOwner {
        if (user == address(0)) revert ZeroAddress();
        require(role <= 3, "bad role");
        roles[user] = role;
        emit RoleSet(user, role);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
