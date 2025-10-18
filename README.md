# 💖 CharityChain dApp

A simple and modern blockchain donation application built with Next.js, Soroban smart contracts, and Freighter wallet integration.

It allows users to make transparent donations on the Stellar Testnet and view the total amount raised.

## 🚀 Features

- ✅ Freighter wallet connection (connect/disconnect)
- ✅ Donation via Soroban smart contract
- ✅ Auto-updated stats (total funds)
- ✅ Transaction hash display for transparency
- ✅ Clean, minimal, and responsive UI

## ⚙️ Setup

### 1. Install Dependencies

```bash
cd charitychain-app
pnpm install
```

### 2. Configure Environment

Create a `.env.local` file in the app root:

```bash
# Replace with your deployed contract ID (starts with 'C')
NEXT_PUBLIC_CONTRACT_ID=your_contract_id_here

# Soroban RPC URL for Testnet
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org

# Network Passphrase
NEXT_PUBLIC_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
```

### 3. Build & Deploy the Soroban Contract

```bash
cd ../charitychain-contract
cargo build --target wasm32-unknown-unknown --release

stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/charitychain.wasm \
  --source alice \
  --network testnet \
  --alias charitychain
```

Copy the contract ID from the output and add it to your `.env.local`.

### 4. Run the Development Server

```bash
cd charitychain-app
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

## 💡 Usage

1. **Connect Wallet**: Click "Connect Freighter" to connect your Stellar wallet.
2. **Send Donation**: Enter an XLM amount and click "Donate."
3. **View Stats**: After a successful transaction, the total funds are updated automatically.
4. **Transaction Info**: The transaction hash (TX) is displayed below the donation card for transparency.

## 🔧 Smart Contract Functions

| Function | Description |
|----------|-------------|
| `contribute(contributor: Address, amount: u32)` | Adds a donation and updates total funds |
| `get_total_funds(env: Env) -> u32` | Returns the current total amount donated |
| `get_last_contributor(env: Env) -> Option<Address>` | Returns the last contributor's address |

**Total**: 3 functions — fully compliant with PRD guidelines.

## 🧠 Tech Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **Blockchain**: Stellar Soroban, Rust smart contracts
- **Wallet**: Freighter API
- **Network**: Stellar Testnet

## 🧩 Project Structure

```bash
charitychain/
│
├── charitychain-contract/   # Soroban smart contract (Rust)
│   └── src/lib.rs
│
└── charitychain-app/        # Next.js frontend
    ├── pages/
    │   ├── index.tsx        # Wallet connection page
    │   └── main.tsx         # Donation page
    ├── lib/
    │   ├── soroban.ts       # Contract interaction logic
    │   └── freighter.ts     # Wallet helper functions
    └── .env.local
```

## 🧾 License

This project is open-source and developed for educational and demonstration purposes on the Stellar Testnet.

## 🪐 About

CharityChain demonstrates how blockchain can be used for social good — combining transparency, simplicity, and decentralization to build trust in charitable donations.
