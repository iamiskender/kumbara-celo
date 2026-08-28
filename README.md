
## How the shared piggy bank stays safe

A group piggy bank holds everyone's tokens in one contract balance, so the isolation has to come from the accounting rather than from separate custody. Each deposit credits `balances[piggyBankId][user][token]`, and `withdraw` checks that single number. There is no path that reads the contract's token balance, and no owner function that can move funds.

That is the claim the whole design rests on, so it is the part the tests spend the most effort on.

## Tests

```bash
cd contracts
forge install foundry-rs/forge-std
forge test
```

20 tests. Four of them exist purely to attack the isolation claim from a different angle:

**`test_NobodyCanWithdrawMoreThanTheyDeposited`** — three people deposit 100, 300 and 50 into one shared piggy bank. 450 sits in the contract, but the first depositor is refused at 101 and allowed at exactly 100. The other two balances are untouched afterwards.

**`test_AMemberWhoDepositedNothingCanWithdrawNothing`** — joining a group with money in it grants nothing. Membership is not a share.

**`test_BalancesDoNotLeakBetweenTokens`** — depositing cUSD must not create a USDC balance. A suite that only tested one token would never catch this.

**`test_BalancesDoNotLeakBetweenPiggyBanks`** — same user, same token, two piggy banks. A deposit in one is not withdrawable from the other.

Plus a fuzz test, `testFuzz_ContractBalanceAlwaysCoversWhatIsOwed`: across randomised deposits and withdrawals, the contract's token balance always equals the sum of what it says every member is owed. If those two ever drift apart, either someone's money is unreachable or someone else's is spendable.

Two more worth naming:

**`test_HandlesSixDecimalUsdc`** — cUSD has 18 decimals and USDC on Celo has 6. The contract stores raw token units, so the same nominal amount is a different number depending on the token.

**`test_AFailedWithdrawTransferLeavesTheBalanceIntact`** — some tokens return `false` instead of reverting. The whole withdrawal reverts in that case, so the balance is still there rather than having been debited into nothing.

## Tech Stack

- Solidity 0.8.19
- React + Vite
- ethers.js v5
- Celo Mainnet (cUSD + native USDC)
- Foundry
- Vercel

## License

MIT