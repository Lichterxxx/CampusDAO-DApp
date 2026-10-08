# CampusDAO

CampusDAO is a transparent proposal-voting DApp deployed on Ethereum Sepolia. Users connect MetaMask, create proposals, cast one support/oppose vote per wallet, and independently verify the result through the contract or Sepolia Etherscan.

> This is a classroom prototype. It demonstrates one-address-one-vote, not one-human-one-vote, and it is not intended for official or secret elections.

## Sepolia deployment

- Contract: [`0xa9b0d7787ac3a76af2c4533bc33c237677004f19`](https://sepolia.etherscan.io/address/0xa9b0d7787ac3a76af2c4533bc33c237677004f19)
- Deployment transaction: [`0xfa05b059b21470b61ed218d81352ee753b7fc6f2ca85acca51f6fb65a5630731`](https://sepolia.etherscan.io/tx/0xfa05b059b21470b61ed218d81352ee753b7fc6f2ca85acca51f6fb65a5630731)
- Network: Ethereum Sepolia (`11155111`)
- Deployment block: `11868486`
- Compiler: Solidity `0.8.30`, EVM `shanghai`, optimizer disabled

## Why blockchain?

A traditional voting website stores results in an administrator-controlled database. CampusDAO instead places proposal state and vote totals in a public smart contract. The contract applies the same deterministic rules to every wallet, prevents the same address from voting twice, and exposes results that anyone can independently read.

Blockchain improves verifiability; it does **not** solve voter identity, coercion, or Sybil attacks by itself.

## Features

- MetaMask connection and wallet-address display
- Ethereum Sepolia network detection and switching
- Create a timed proposal
- Cast one support or oppose vote per address
- Reject duplicate and late votes in the contract
- Permissionless deterministic finalization
- Read public proposal state without connecting a wallet
- Transaction progress, errors, and Etherscan links
- Responsive single-page interface designed for the live demonstration

## Architecture

```text
User
  ↓
CampusDAO website
  ↓
MetaMask (externally owned account)
  ↓ signed transaction through the ABI
CampusDAO contract
  ↓
Ethereum Sepolia state and transaction history
```

The frontend is only an interface. The source of truth is the deployed contract.

## Repository structure

```text
campusdao-dapp/
├── contracts/
│   ├── CampusDAO.sol
│   └── CampusDAO.abi.json
├── frontend/
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   ├── config.js
│   ├── favicon.svg
│   └── vendor/
│       └── ethers.umd.min.js
├── .openai/
│   └── hosting.json
├── scripts/
│   └── serve.mjs
├── TEST_REPORT.md
├── PROJECT_OUTLINE.md
├── SUBMISSION.md
├── README.md
└── .gitignore
```

## Smart-contract design

Each proposal stores:

- proposal ID
- creator wallet address
- title and description
- creation and end timestamps
- support and oppose totals
- finalization state and final outcome

The nested mapping below prevents the same address from voting twice on the same proposal:

```solidity
mapping(uint256 => mapping(address => bool)) public hasVoted;
```

Main functions:

```solidity
createProposal(string title, string description, uint256 durationMinutes)
vote(uint256 proposalId, bool support)
finalizeProposal(uint256 proposalId)
getProposal(uint256 proposalId)
```

Main events:

```solidity
ProposalCreated(...)
VoteCast(...)
ProposalFinalized(...)
```

## Deploy to Sepolia with Remix

### 1. Prepare MetaMask

1. Install MetaMask from its official source.
2. Add or select the Ethereum Sepolia network.
3. Obtain a small amount of Sepolia test ETH from a reputable faucet.
4. Never share a private key or seed phrase.

### 2. Compile

1. Open [Remix](https://remix.ethereum.org/).
2. Create `CampusDAO.sol`.
3. Copy the contents of `contracts/CampusDAO.sol` into Remix.
4. Open **Solidity Compiler**.
5. Select Solidity compiler `0.8.30`.
6. In Advanced Configurations, use EVM version `shanghai` and leave optimization disabled.
7. Compile `CampusDAO.sol`.

### 3. Deploy

1. Open **Deploy & Run Transactions**.
2. Select **Injected Provider - MetaMask**.
3. Confirm that Remix and MetaMask both show Sepolia.
4. Select `CampusDAO`.
5. Click **Deploy**.
6. Confirm the deployment transaction in MetaMask.
7. Copy the deployed contract address.

### 4. Configure the frontend

The deployed address is stored in `frontend/config.js`:

```js
contractAddress: "0xa9b0d7787ac3a76af2c4533bc33c237677004f19"
```

The frontend ABI is already included in `frontend/app.js`.

## Run locally

The frontend is static and has no build-time dependency. It must be served over HTTP rather than opened with `file://`.

From the repository root:

```bash
node scripts/serve.mjs
```

Then open the address printed by the server. It starts at port `8080` and automatically
tries the next available port if that port is already occupied, for example:

```text
http://127.0.0.1:8080
```

MetaMask must be available in the browser used for the demonstration.

## Verification performed

Before Sepolia deployment, the contract passed 14 local-chain checks covering creation,
two-wallet voting, duplicate and late vote rejection, deadline enforcement, tie
calculation, and finalization. The frontend also passed its static resource and runtime
checks. See [`TEST_REPORT.md`](TEST_REPORT.md) for the exact scope.

## Live demonstration plan (about 7 minutes)

### 0:00–0:45 — Purpose

Explain that CampusDAO replaces an administrator-controlled vote database with public smart-contract rules and independently verifiable state.

### 0:45–1:30 — Wallet and network

1. Open the website.
2. Click **Connect wallet**.
3. Approve the connection in MetaMask.
4. Show the wallet address and Sepolia status.

### 1:30–3:00 — Transaction 1

1. Enter a proposal title and description.
2. Choose the one-minute demo duration.
3. Click **Create proposal**.
4. Confirm the transaction in MetaMask.
5. Show the proposal after confirmation.

### 3:00–4:30 — Transaction 2

1. Click **Support** or **Oppose**.
2. Confirm the transaction in MetaMask.
3. Show the updated total.
4. Explain that the contract now prevents that wallet from voting again.

### 4:30–5:30 — Independent verification

1. Open the transaction link.
2. Show the contract address on Sepolia Etherscan.
3. Refresh the DApp to demonstrate that the state remains on-chain.

### 5:30–7:00 — Design and limitations

Explain the on-chain data, `msg.sender`, deterministic rules, gas, public votes, and the one-address-one-vote limitation.

## Suggested demo proposal

```text
Title: Should the university library open 24 hours during exams?

Description: Vote on extending library opening hours during the final examination period.

Duration: 1 minute
```

## Likely Q&A

### Why not use a normal database?

A normal database requires voters to trust its administrator. In CampusDAO, the contract rules and vote totals are public, and anyone can read the same result from Sepolia.

### Does it guarantee one person, one vote?

No. It guarantees one address, one vote per proposal. Identity verification or Sybil resistance would require an additional mechanism such as an allowlist, institution-issued credential, or decentralized identity system.

### Are votes anonymous?

No. Addresses are pseudonymous, but transactions and vote choices are public.

### What is stored on-chain?

Proposal content, creator address, timestamps, vote totals, final state, and whether an address has voted. Private keys and real-world personal information are never stored by the DApp.

### What happens if the website disappears?

The contract state remains on Sepolia. Users could still inspect it on Etherscan or build another interface using the same address and ABI.

## Security and limitations

- Do not use this prototype for official elections.
- Do not place personal or confidential information in proposal text.
- A user may control multiple addresses.
- Votes are public and permanent.
- Every write transaction requires Sepolia ETH for gas.
- The frontend uses a public RPC endpoint. A fixed ethers.js browser build is vendored locally for a more reliable classroom demonstration.
- The contract is intentionally non-upgradeable to keep the classroom trust model clear.

## Submission

After deployment and GitHub publishing, submit:

```text
1. GitHub Repository: https://github.com/Lichterxxx/CampusDAO-DApp
2. Smart Contract Address: 0xa9b0d7787ac3a76af2c4533bc33c237677004f19
```

## License

MIT
