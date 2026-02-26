// Copy this file to config.js and fill in your real values.
// config.js is loaded by all pages via a plain <script> tag.

window.DS_CONFIG = {
  // Public Sepolia RPC (you can replace with your own or Alchemy/Infura endpoint)
  RPC_URL: "https://sepolia.drpc.org",

  // Your deployed smart contract address on Sepolia
  CONTRACT_ADDRESS: "0xYourDeployedContractAddressHere",

  // Minimal ABI for the Data Anchor contract
  CONTRACT_ABI: [
    "event DataSubmitted(bytes32 indexed dataHash,address indexed researcher,uint256 timestamp,string cid,string nodeId)",
    "function submitData(bytes32 dataHash,string calldata cid,string calldata nodeId) external",
    "function getData(bytes32 dataHash) external view returns (address researcher,uint256 timestamp,string memory cid,string memory nodeId)",
    "function verifyHash(bytes32 dataHash) external view returns (bool exists,address researcher,uint256 timestamp,string memory cid,string memory nodeId)"
  ],

  // IPFS / pinning service (Pinata example)
  IPFS_ENDPOINT: "https://api.pinata.cloud/pinning/pinFileToIPFS",
  IPFS_JWT: "PINATA_JWT_OR_BEARER_TOKEN",

  // Optional: links
  GITHUB_URL: "https://github.com/your-org/de-science-ledger",
  DOCS_URL: "https://docs.your-domain.xyz",

  // Block explorer base URL for Sepolia
  EXPLORER_TX_BASE: "https://sepolia.etherscan.io/tx/"
};

