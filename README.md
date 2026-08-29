# Kumbara — Micro-Savings on Celo

[![contracts](https://github.com/iamiskender/kumbara-celo/actions/workflows/tests.yml/badge.svg)](https://github.com/iamiskender/kumbara-celo/actions/workflows/tests.yml)

Kumbara is a flexible, lock-free micro-savings dApp running on Celo Mainnet. Users can create personal piggy banks or open a shared one with a group (family, friends, colleagues). Funds can be deposited or withdrawn at any time using cUSD or native USDC, with no lock-up period and no penalties.

This project is inspired by traditional rotating savings practices common in Africa, such as Ajo/Esusu in Nigeria and Chama in Kenya, brought on-chain with full transparency.

## Why this project?

- **Real use case**: Saving as a group is a daily financial practice in many parts of the world, especially in markets Celo targets.
- **Stablecoin-native**: Works with Celo's cUSD and native USDC, keeping users away from price volatility.
- **Safe sharing model**: In group piggy banks, each user's balance is tracked separately. No one can withdraw more than they deposited, and funds never mix.
- **MiniPay compatible**: Uses the injected provider (`window.ethereum`) standard, so it can be opened directly from MiniPay.

## Live

- Frontend: https://frontend-three-beta-53.vercel.app
- Contract: Celo Mainnet, `0x2412B7346EE9870311115b9Fc52Fc540a88416b4`
- Explorer: [Celoscan](https://celoscan.io/address/0x2412B7346EE9870311115b9Fc52Fc540a88416b4)

## How the shared piggy bank stays safe

A group piggy bank holds everyone's tokens in one contract balance, so the isolation has to come from the accounting rather than from separate custody. Each deposit credits `balances[piggyBankId][user][token]`, and `withdraw` checks that single number. There is no path that reads the contract's token balance, and no owner function that can move funds.

That is the claim the whole design rests on, so it is the part the tests spend the most effort on.

## Tests

    cd contracts
    forge install foundry-rs/forge-std
    forge test

20 tests. Four of them exist purely to attack the isolation claim from a different angle:

**`test_NobodyCanWithdrawMoreThanTheyDeposited`** — three people deposit 100, 300 and 50 into one shared piggy bank. 450 sits in the contract, but the first depositor is refused at 101 and allowed at exactly 100. The other two balances are untouched afterwards.

**`test_AMemberWhoDepositedNothingCanWithdrawNothing`** — joining a group with money in it grants nothing. Membership is not a share.

**`test_BalancesDoNotLeakBetweenTokens`** — depositing cUSD must not create a USDC balance. A suite that only tested one token would never catch this.

**`test_BalancesDoNotLeakBetweenPiggyBanks`** — same user, same token, two piggy banks. A deposit in one is not withdrawable from the other.

Plus a fuzz test, `testFuzz_ContractBalanceAlwaysCoversWhatIsOwed`: across randomised deposits and withdrawals, the contract's token balance always equals the sum of what it says every member is owed. If those two ever drift apart, either someone's money is unreachable or someone else's is spendable.

Two more worth naming:

**`test_HandlesSixDecimalUsdc`** — cUSD has 18 decimals and USDC on Celo has 6. The contract stores raw token units, so the same nominal amount is a different number depending on the token.

**`test_AFailedWithdrawTransferLeavesTheBalanceIntact`** — some tokens return `false` instead of reverting. The whole withdrawal reverts in that case, so the balance is still there rather than having been debited into nothing.

## Layout

    contracts/
      src/Kumbara.sol        Main contract (Solidity ^0.8.19)
      test/Kumbara.t.sol     Foundry test suite
      foundry.toml
    frontend/
      src/App.jsx
      src/components/
      src/hooks/useWallet.js
      src/main.jsx
      index.html
      package.json
      vite.config.js

## Tech Stack

- Solidity 0.8.19
- React + Vite
- ethers.js v5
- Celo Mainnet (cUSD + native USDC)
- Foundry
- Vercel

## License

MIT
