# AVEN-ETH: Decentralized Freelance Escrow and Continuous Payment Streaming Protocol

[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636?style=for-the-badge&logo=solidity&logoColor=white)](https://soliditylang.org/)
[![Base Sepolia](https://img.shields.io/badge/Base_Sepolia-Live_Testnet-0052FF?style=for-the-badge&logo=coinbase&logoColor=white)](https://sepolia.basescan.org/address/0x5Cfa2C922C1C1Fd42ba7570306a7D83e630dC6F9)
[![Hardhat Tests](https://img.shields.io/badge/Hardhat_Tests-11%2F11_Passing-yellow?style=for-the-badge&logo=ethereum&logoColor=white)](./contracts)
[![Server Tests](https://img.shields.io/badge/Server_Tests-15%2F15_Passing-brightgreen?style=for-the-badge&logo=node.js&logoColor=white)](./server)
[![React](https://img.shields.io/badge/React_18-Vite_SPA-61DAFB?style=for-the-badge&logo=react&logoColor=black)](./client)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](./LICENSE)

AVEN-ETH is an open-source, non-custodial freelance protocol combining continuous per-second payment streaming smart contracts on Base Sepolia (Ethereum Layer-2) with an Ethereum Attestation Service (EAS) reputation framework and a verifiable SHA-256 Proof-of-Work ledger.

---

## 1. Live On-Chain Deployments (Base Sepolia - Chain ID: 84532)

The protocol contracts are deployed and verified on the Base Sepolia Layer-2 testnet:

| Contract / Account | Network | Address | Block Explorer |
|---|---|---|---|
| **AvenEscrowStream (Core Vault)** | Base Sepolia | `0x5Cfa2C922C1C1Fd42ba7570306a7D83e630dC6F9` | [View on Basescan](https://sepolia.basescan.org/address/0x5Cfa2C922C1C1Fd42ba7570306a7D83e630dC6F9#code) |
| **MockUSDC (ERC-20 Token)** | Base Sepolia | `0xf922026C1810BF93C5a31e35B87ee4dc9Bc8f651` | [View on Basescan](https://sepolia.basescan.org/address/0xf922026C1810BF93C5a31e35B87ee4dc9Bc8f651#code) |
| **Protocol Deployer Wallet** | Base Sepolia | `0xd6695ab2D1C5636f86480e07e26AF65b2C08ad57` | [View on Basescan](https://sepolia.basescan.org/address/0xd6695ab2D1C5636f86480e07e26AF65b2C08ad57) |

---

## 2. Executive Overview

### The Problem in Traditional Freelance Escrow
1. **Custodial Capital Inefficiency:** Platforms such as Upwork and Fiverr hold client deposits in centralized bank accounts, charging 10% to 20% intermediary fees while withholding payment for 14-day clearance cycles.
2. **Liquidity Friction for Contributors:** Contributors work for extended durations before receiving milestone disbursements, exposing them to non-payment or unilateral chargeback risks.
3. **Platform-Locked Reputations:** Contributor ratings are siloed inside proprietary platforms and cannot be exported or independently verified across platforms or credit systems.

### The AVEN-ETH Protocol Solution
1. **Continuous Per-Second Streaming:** Funds stream dynamically every second as verified work occurs, enabling on-demand withdrawals.
2. **Non-Custodial Smart Contract Vault:** Deposits are held in `AvenEscrowStream.sol`. Neither the client nor the platform operators can withdraw locked funds once work is logged.
3. **75% Safety Withdrawable Cap:** During active execution (`IN_PROGRESS`), contributors can withdraw up to 75% of accrued earnings for immediate liquidity, while the final 25% requires client review and milestone approval.
4. **Zero-Dust Atomic Cancellation:** If an agreement is cancelled, earned funds are disbursed to the contributor and unearned funds are refunded to the client in an atomic transaction with zero rounding dust.
5. **Decentralized Reputation Attestations:** Completed contracts mint cryptographic EAS attestations with verifiable Merkle digests, category multipliers, and time-decay curves.

---

## 3. Mathematical Specifications & Invariants

### 3.1 Linear Stream Flow Rate (Wei Precision)
Solidity does not support floating-point arithmetic. To eliminate division-induced truncation errors, budgets are scaled by $10^{18}$ wei units prior to division by agreement duration:

$$\text{ratePerSecond} = \frac{\text{budget} \times 10^{18}}{\text{durationSeconds}}$$

$$\text{rawEarned} = \frac{\Delta t_{\text{active}} \times \text{ratePerSecond}}{10^{18}}$$

Active elapsed time strictly subtracts all paused durations:
$$\Delta t_{\text{active}} = t_{\text{current}} - t_{\text{started}} - \text{totalPausedSeconds}$$

### 3.2 Dynamic 75% Safety Withdrawable Cap
While the stream status is `IN_PROGRESS`, `PAUSED`, or `SUBMITTED`, the maximum withdrawable balance is mathematically bounded:

$$\text{maxWithdrawable} = \min\left(\text{rawEarned}, \frac{\text{budget} \times 75}{100}\right) - \text{totalWithdrawn}$$

Upon milestone approval via `approveAndRelease()`, the cap is lifted to 100%, allowing the remaining 25% balance to be withdrawn.

### 3.3 Atomic Cancellation Settlement Invariant
When a stream is cancelled mid-lifecycle after partial withdrawals:

$$\text{alreadyWithdrawn} + \text{unwithdrawnEarned} + \text{unearnedRefund} \equiv \text{budget}$$

This equation guarantees that no tokens remain stranded (zero dust) and neither party can be overpaid or double-refunded.

---

## 4. System Architecture

```
AVEN-ETH/
├── contracts/                        # Smart Contracts & Testing Suite
│   ├── contracts/
│   │   ├── AvenEscrowStream.sol     # Core Escrow Vault (ReentrancyGuard, SafeERC20, Linear Math)
│   │   ├── MockUSDC.sol             # 6-decimal ERC-20 token with open mint faucet
│   │   └── mocks/
│   │       └── ReentrantMaliciousToken.sol # Exploit test contract for reentrancy verification
│   ├── test/
│   │   └── AvenEscrowStream.test.js # 11 unit & time-travel invariant tests
│   ├── scripts/
│   │   ├── deploy.js                # Base Sepolia deployment & verification script
│   │   └── check-live.js            # On-chain state inspection script
│   └── hardhat.config.cjs           # Solidity 0.8.24 viaIR, optimizer, and network configuration
│
├── client/                           # React 18 + Vite Web3 Frontend
│   ├── src/
│   │   ├── context/
│   │   │   ├── Web3Context.jsx      # 🦊 MetaMask EIP-1193 integration, chain switching, faucet
│   │   │   ├── AuthContext.jsx      # Role and session management
│   │   │   ├── ThemeContext.jsx     # Dark and light display theme provider
│   │   │   └── ToastContext.jsx     # Real-time event notifications
│   │   ├── web3/
│   │   │   └── contracts.js         # Deployed Base Sepolia contract ABIs and addresses
│   │   ├── components/
│   │   │   ├── Topbar.jsx           # Wallet connection, network status, faucet trigger
│   │   │   ├── StreamingMeter.jsx   # Real-time continuous flow odometer
│   │   │   ├── EscrowFlow.jsx       # Non-custodial architectural visualizer
│   │   │   └── SmartContractPanel.jsx # On-chain contract state inspector
│   │   └── pages/
│   │       ├── AgreementDetail.jsx  # Escrow funding modal and Basescan verification links
│   │       ├── Blockchain.jsx       # Block explorer and chain visualization
│   │       ├── Security.jsx         # SHA-256 chain verification & tamper detection demo
│   │       └── Wallet.jsx           # Balance manager and transaction ledger
│   └── package.json
│
├── server/                           # Express.js Backend & Consensus Service
│   ├── src/
│   │   ├── services/
│   │   │   ├── blockchainService.js # SHA-256 Proof-of-Work engine (Difficulty = 3)
│   │   │   ├── escrowService.js     # State machine orchestrator
│   │   │   ├── reputationService.js # EAS attestation scoring and decay algorithm
│   │   │   └── stateMachine.js      # Lifecycle validation rules
│   │   ├── data/
│   │   │   └── db.json              # Persistent JSON store
│   │   ├── tests/
│   │   │   └── fullFlow.test.js     # 15 node:test lifecycle integration tests
│   │   └── index.js                 # API server entrypoint (port 5000)
│   └── package.json
│
└── package.json                      # Monorepo orchestration scripts
```

---

## 5. Automated Invariant Verification (26/26 Tests Passing)

All system layers are validated via automated tests covering mathematical precision, state transitions, and exploit mitigation.

```bash
# Execute entire test suite (Server + Contracts)
npm run test:all
```

### 5.1 Smart Contract Test Suite (11/11 Passing)
```bash
npm run test:contracts
```
```
  AvenEscrowStream Protocol
    1. Deployment & Token Setup
      ✔ should deploy MockUSDC with 6 decimals
      ✔ should set deployer as owner
    2. Stream Creation & Input Validation
      ✔ should create and fund stream with correct parameters and emit event
      ✔ should reject stream creation with invalid parameters
    3. Linear Flow Math & 75% Safety Cap
      ✔ should accurately stream funds linearly at 25% and 50% elapsed time
      ✔ should enforce the 75% safety cap while stream is IN_PROGRESS
    4. Pause and Resume Earning Clock
      ✔ should freeze accrual during pause interval and resume accurately
    5. Work Submission & 100% Release upon Approval
      ✔ should allow freelancer to submit deliverable report and client to approve 100% payout
    6. Strict Cancellation Settlement with Prior Partial Claim (Crucial Invariant)
      ✔ should correctly settle cancelStream after partial withdrawal with zero dust and exact split
    7. Dispute Resolution
      ✔ should freeze withdrawals on dispute and allow arbiter resolution
    8. Reentrancy Protection Security Test
      ✔ should block reentrant calls during token transfers

  11 passing (1s)
```

### 5.2 Server Integration Suite (15/15 Passing)
```bash
npm test --prefix server
```
```
✔ valid transition transitions through all phases without error
✔ invalid transition throws error for unpermitted jumps
✔ complete agreement streaming lifecycle: create -> fund -> start -> stream -> claim -> submit -> approve
✔ stream pausing and resuming
✔ stream cancellation with automatic refund to client and earned payment to worker
✔ on-demand stream withdrawals mint an attestation and update wallet balance
✔ dynamic reputation calculation aggregates attestations into a score up to 10,000 pts
✔ client dispute freezes stream, locks withdrawals, and allows resolution
...
ℹ pass 15
ℹ fail 0
```

---

## 6. Installation and Execution

### Prerequisites
- Node.js 18 or higher
- npm 9 or higher
- 🦊 MetaMask browser extension (optional; application includes full offline simulation mode)

### 6.1 Clone Repository and Install Dependencies
```bash
git clone https://github.com/mailmeatdarshan/AVEN-ETH.git
cd AVEN-ETH
npm install
```

### 6.2 Start Local Development Services
Run the backend and frontend in separate terminal instances:

```bash
# Terminal 1: Backend Server (Port 5000)
cd server
npm run dev

# Terminal 2: Frontend Client (Port 5173)
cd client
npm run dev
```

Navigate to `http://localhost:5173` in a web browser.

---

## 7. Operational Modes

### Mode A: On-Chain Web3 Execution (Base Sepolia)
1. **Connect Wallet:** In the navigation header, select **"Connect 🦊 MetaMask"**.
2. **Network Alignment:** If connected to a different network, click **"SWITCH TO BASE"** to automatically add and switch to Base Sepolia (Chain ID `84532`).
3. **Obtain Testnet USDC:** Click the **"+ 500 USDC"** faucet button in the header. Confirm the transaction in 🦊 MetaMask to mint test tokens directly from `MockUSDC.sol`.
4. **Draft Agreement:** Navigate to **"Create Agreement"**, specify title, budget (e.g., 100 USDC), and duration.
5. **Execute On-Chain Funding:** Open the agreement and select **"Fund Escrow"**:
   - First prompt approves the token allowance via `MockUSDC.approve()`.
   - Second prompt executes `AvenEscrowStream.createAndFundStream()`.
   - The transaction is indexed on Base Sepolia, displaying an active Basescan transaction link.

### Mode B: Local Simulation Execution
1. Open `http://localhost:5173/login`.
2. Select **"Client Workspace (Sarah Chen)"** or **"Contributor Workspace (Marcus Rivera)"** for one-click access.
3. Inspect the live Proof-of-Work blockchain ledger on `/blockchain` or test the **Tamper Detection Engine** on `/security` by deliberately modifying block headers to observe cryptographic verification failure.

---

## 8. Security Mitigations

- **Reentrancy Mitigation:** `AvenEscrowStream.sol` applies OpenZeppelin `ReentrancyGuard` across all withdrawal endpoints (`claimStream`, `cancelStream`, `resolveDispute`).
- **Safe Token Operations:** Uses OpenZeppelin `SafeERC20` (`safeTransfer`, `safeTransferFrom`) to handle non-standard ERC-20 return behaviors.
- **Pull-Payment Pattern:** Contributors pull their accrued balances rather than relying on automatic push transfers, eliminating denial-of-service attack vectors caused by recipient execution reverts.
- **Non-Custodial Architecture:** Funds deposited into an agreement cannot be withdrawn by the protocol deployer or any third party.
- **Strict Role Enforcement:** API routes validate JWT claims, preventing contributors from executing client-restricted actions (such as funding or milestone approvals).

---

## 9. Technical Reference and Defense FAQ

### Why is payment denominated in USDC rather than native ETH?
Cryptocurrency volatility poses significant risk for fixed-duration freelance contracts. A 30-day agreement denominated in ETH could fluctuate by 20% or more between contract signing and delivery. USDC maintains a stable 1:1 USD peg while retaining smart contract composability and programmability.

### Why deploy to Base Sepolia instead of Ethereum Mainnet?
Continuous per-second payment streaming and frequent partial withdrawals require low transaction fees. Ethereum Mainnet gas fees ($5 to $50 per transaction) render micropayments infeasible. Base Sepolia, as an Optimistic Layer-2 rollup, delivers Ethereum-level cryptographic security with sub-cent gas fees (~$0.0001 per transaction) and 2-second block confirmations.

### How does the contract prevent rounding errors without floating-point numbers?
Solidity integers truncate on division. To guarantee mathematical precision down to atomic units, calculations scale budgets by $10^{18}$ before division: `ratePerSecond = (budget * 1e18) / durationSeconds`. When calculating earned amounts, multiplication occurs prior to division: `(activeSeconds * ratePerSecond) / 1e18`.

### What guarantees that cancelled agreements settle correctly?
The cancellation handler implements the invariant `alreadyWithdrawn + unwithdrawnEarned + unearnedRefund == budget`. Earned funds up to the cancellation timestamp are sent to the contributor, while unearned funds return to the client in a single atomic transaction, preventing dust accumulation or double payouts.

---

## 10. License

This project is licensed under the [MIT License](LICENSE).
