## De-Science Ledger

Dark, futuristic DeSci data anchoring demo built with **HTML5 + CSS3 + Vanilla JavaScript only**.

### Structure

- `index.html` – landing page, architecture, live strip, demo mode toggle.
- `login.html` – glassmorphism auth UI, email/password + MetaMask.
- `dashboard.html` – verified nodes, stats, activity feed.
- `upload.html` – hash + IPFS + `submitData` transaction flow.
- `verify.html` – local hash vs on-chain verification console.
- `css/style.css` – dark neon, glass, animations, responsive layout.
- `js/app.js` – MetaMask, routing glue, upload & verify flows.
- `js/config.example.js` – copy to `js/config.js` and fill with your keys.
- `contracts/DataAnchor.sol` – Solidity contract for Sepolia.

### Setup

1. Copy config:

```bash
cp js/config.example.js js/config.js
```

Edit `js/config.js` and set:

- `RPC_URL` – your Sepolia RPC.
- `CONTRACT_ADDRESS` – deployed `DataAnchor` contract.
- `CONTRACT_ABI` – keep as-is unless you modify the contract.
- `IPFS_ENDPOINT` / `IPFS_JWT` – e.g. Pinata or Web3.Storage.

2. Open with a static server (so MetaMask + fetch work correctly), e.g.:

```bash
npx serve .
```

3. Deploy the contract (using Hardhat/Foundry/Remix), grab its address, and put it in `config.js`.

### Hackathon Demo Flow

- Connect MetaMask from any page (Sepolia).
- Use **Upload** to hash a file (client-side), upload to IPFS, and call `submitData`.
- Watch the **Dashboard** stats and activity feed update.
- Use **Verify** to re-upload a file and check integrity against `verifyHash`.

