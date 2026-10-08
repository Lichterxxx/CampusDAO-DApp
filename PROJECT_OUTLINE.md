# CampusDAO Project Outline

## 1. Project purpose

CampusDAO is a lightweight governance DApp for creating public proposals and recording transparent support/oppose votes on Ethereum Sepolia.

It demonstrates how a smart contract can replace an administrator-controlled vote database with deterministic rules and publicly verifiable state.

## 2. Core user flow

1. Open the website.
2. Connect MetaMask.
3. Confirm or switch to Ethereum Sepolia.
4. Create a proposal (transaction 1).
5. Vote support or oppose (transaction 2).
6. Observe the updated on-chain vote count.
7. Open the transaction or contract on Sepolia Etherscan.
8. Optionally finalize the proposal after its deadline (transaction 3).

## 3. Smart-contract responsibilities

- Store proposals and vote totals.
- Associate proposals and votes with wallet addresses.
- Enforce one vote per wallet per proposal.
- Reject votes after the deadline.
- Calculate the final result deterministically.
- Emit events for creation, voting, and finalization.

## 4. Frontend responsibilities

- Connect to MetaMask.
- Display the connected wallet and active network.
- Request a switch to Sepolia when required.
- Read public proposal state without requiring a wallet connection.
- Create proposals, vote, and finalize through MetaMask.
- Display transaction progress, errors, and Etherscan links.
- Explain the on-chain design and known limitations during the demonstration.

## 5. On-chain data

- Proposal ID
- Creator address
- Title and description
- Creation and end timestamps
- Support and oppose vote totals
- Finalization state and outcome
- Whether each address has voted

## 6. Off-chain data

- UI state and temporary form inputs
- Wallet-address display formatting
- Loading, error, and confirmation messages

No real names, student IDs, passwords, private keys, or other personal information are stored.

## 7. Limitations

- One address is not necessarily one human (Sybil resistance is out of scope).
- Votes are public, not secret ballots.
- Transactions require Sepolia ETH for gas.
- On-chain text is public and difficult to remove.
- The website is a convenient interface but can still be hosted centrally.

## 8. Minimum success criteria

- Solidity contract compiles successfully.
- Contract is deployed to Sepolia.
- Website connects to MetaMask and shows the account.
- Wrong-network handling works.
- Two state-changing transactions complete through the website.
- Refreshed data matches the Sepolia contract state.
- Repository includes source code and complete setup instructions.
