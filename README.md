# Kumbara — Micro-Savings on Celo

Kumbara is a flexible, lock-free micro-savings dApp running on Celo Mainnet. Users can create personal piggy banks or open a shared one with a group (family, friends, colleagues). Funds can be deposited or withdrawn at any time using cUSD or native USDC — no lock-up period, no penalties.

This project is inspired by traditional rotating savings practices common in Africa, such as Ajo/Esusu in Nigeria and Chama in Kenya, brought on-chain with full transparency.

## Why this project?

- **Real use case**: Saving as a group is a daily financial practice in many parts of the world, especially in markets Celo targets.
- **Stablecoin-native**: Works with Celo's cUSD and native USDC, keeping users away from price volatility.
- **Safe sharing model**: In group piggy banks, each user's balance is tracked separately — no one can withdraw more than they deposited. Funds never mix.
- **MiniPay compatible**: Uses the injected provider (window.ethereum) standard, so it can be opened directly from MiniPay.

## Architecture

```
kumbara/
├── contracts/
│   └── Kumbara.sol        # Main smart contract (Solidity ^0.8.19)
└── frontend/
    ├── src/
    │   ├── App.jsx                  # Main application
    │   ├── components/
    │   │   ├── PiggyCard.jsx        # Single piggy bank card
    │   │   ├── PiggyIllustration.jsx
    │   │   └── TransactionModal.jsx # Deposit/Withdraw modal
    │   ├── hooks/
    │   │   └── useWallet.js         # Wallet connection & network check
    │   ├── index.css
    │   └── main.jsx
    ├── index.html
    ├── package.json
    └── vite.config.js
```

## Live

- Frontend: https://frontend-three-beta-53.vercel.app
- Contract: Celo Mainnet — `0x2412B7346EE9870311115b9Fc52Fc540a88416b4`
- Explorer: [Celoscan](https://celoscan.io/address/0x2412B7346EE9870311115b9Fc52Fc540a88416b4)

## Tech Stack

- Solidity 0.8.19
- React + Vite
- ethers.js v5
- Celo Mainnet (cUSD + native USDC)
- Vercel
