# CampusDAO test report

Tested locally on 8 October 2026 before Sepolia deployment.

## Smart contract

Compiler and bytecode settings:

- Solidity compiler: `0.8.30+commit.73712a01`
- EVM target: `shanghai`
- Optimizer: disabled
- Creation bytecode: 6,560 bytes
- Runtime bytecode: 6,532 bytes

An isolated Ganache chain and three test wallets were used. All 14 checks passed:

1. Initial proposal count is zero.
2. A proposal can be created.
3. The creator address is recorded.
4. A new proposal starts open and pending.
5. A support vote is counted.
6. The voter mapping records the wallet.
7. A duplicate vote is rejected.
8. A second wallet can cast an oppose vote.
9. Finalization before the deadline is rejected.
10. The deadline can be reached.
11. A late vote is rejected.
12. The proposal can be finalized.
13. Equal totals produce the `Tie` outcome.
14. Repeated finalization is rejected.

## Frontend

The static frontend was served over HTTP and loaded in an automated DOM environment.

- Page title loaded correctly.
- Vendored ethers.js loaded correctly.
- The missing-deployment notice appeared correctly.
- The wallet button rendered correctly.
- The contract state showed `Not deployed` before configuration.
- No blocking JavaScript runtime errors were detected.

## Sepolia verification

The contract was deployed to Sepolia at
`0xa9b0d7787ac3a76af2c4533bc33c237677004f19` in block `11868486`.
The deployment receipt succeeded, the address contains 6,532 bytes of runtime code,
and `totalProposals()` returned zero immediately after deployment. The runtime code
length exactly matches the locally compiled runtime artifact.

The full website flow was subsequently verified on Sepolia:

1. Proposal creation succeeded in transaction
   `0x70db7663a73da158ba659e45179789939eb00b5a8a6734f33261f1c4e476b0c1`.
2. A support vote succeeded in transaction
   `0x9e643576ab2891d4efeff0dff23f34f8354523a8fa97b4ec6992f9c5d49a4992`.
3. Finalization succeeded in transaction
   `0xcc899074a45d7c26b5139a9a72651e0f4f2694f778515784b43a68253411347c`.

The finalized proposal displayed `Passed`, with one support vote and zero oppose votes.
