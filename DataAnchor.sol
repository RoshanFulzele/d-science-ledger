// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract DataAnchor is Ownable, ReentrancyGuard {
    struct Dataset {
        address researcher;
        uint64 timestamp;
        string cid;
        string nodeId;
    }

    mapping(bytes32 => Dataset) private datasets;
    mapping(address => uint256) public submissionCount;

    event DataSubmitted(
        bytes32 indexed dataHash,
        address indexed researcher,
        uint256 timestamp,
        string cid,
        string nodeId
    );

    constructor(address initialOwner) Ownable(initialOwner) {}

    function submitData(
        bytes32 dataHash,
        string calldata cid,
        string calldata nodeId
    ) external nonReentrant {
        require(dataHash != bytes32(0), "Invalid hash");
        require(bytes(cid).length != 0, "Empty CID");
        require(datasets[dataHash].timestamp == 0, "Already submitted");

        Dataset storage d = datasets[dataHash];
        d.researcher = msg.sender;
        d.timestamp = uint64(block.timestamp);
        d.cid = cid;
        d.nodeId = nodeId;

        submissionCount[msg.sender] += 1;

        emit DataSubmitted(
            dataHash,
            msg.sender,
            block.timestamp,
            cid,
            nodeId
        );
    }

    function getData(
        bytes32 dataHash
    )
        external
        view
        returns (address researcher, uint256 timestamp, string memory cid, string memory nodeId)
    {
        Dataset storage d = datasets[dataHash];
        return (d.researcher, d.timestamp, d.cid, d.nodeId);
    }

    function verifyHash(
        bytes32 dataHash
    )
        external
        view
        returns (bool exists, address researcher, uint256 timestamp, string memory cid, string memory nodeId)
    {
        Dataset storage d = datasets[dataHash];
        exists = d.timestamp != 0;
        return (exists, d.researcher, d.timestamp, d.cid, d.nodeId);
    }
}

