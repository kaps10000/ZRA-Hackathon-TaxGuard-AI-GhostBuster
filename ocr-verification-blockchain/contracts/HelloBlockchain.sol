// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title HelloBlockchain
 * @dev Simple contract to verify blockchain setup
 */
contract HelloBlockchain {
    string private message;
    address public owner;
    uint256 public deploymentTime;

    event MessageUpdated(string oldMessage, string newMessage, address updatedBy);
    event ContractDeployed(address owner, uint256 timestamp);

    constructor(string memory initialMessage) {
        message = initialMessage;
        owner = msg.sender;
        deploymentTime = block.timestamp;

        emit ContractDeployed(owner, deploymentTime);
    }

    /**
     * @dev Get the current message
     */
    function getMessage() public view returns (string memory) {
        return message;
    }

    /**
     * @dev Update the message (only owner can update)
     */
    function setMessage(string memory newMessage) public {
        require(msg.sender == owner, "Only owner can update message");

        string memory oldMessage = message;
        message = newMessage;

        emit MessageUpdated(oldMessage, newMessage, msg.sender);
    }

    /**
     * @dev Get contract info
     */
    function getInfo() public view returns (
        string memory currentMessage,
        address contractOwner,
        uint256 deployedAt
    ) {
        return (message, owner, deploymentTime);
    }
}
