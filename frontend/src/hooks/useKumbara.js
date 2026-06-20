import { useState, useCallback } from 'react'
import { ethers } from 'ethers'
import { KUMBARA_ABI, ERC20_ABI } from '../abi/kumbara'
import { KUMBARA_CONTRACT_ADDRESS, TOKENS } from '../utils/constants'

export function useKumbara(signer, address) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const getContract = useCallback(() => {
    if (!signer) throw new Error('Wallet not connected')
    return new ethers.Contract(KUMBARA_CONTRACT_ADDRESS, KUMBARA_ABI, signer)
  }, [signer])

  const getTokenContract = useCallback((tokenAddress) => {
    if (!signer) throw new Error('Wallet not connected')
    return new ethers.Contract(tokenAddress, ERC20_ABI, signer)
  }, [signer])

  const run = useCallback(async (fn) => {
    setLoading(true)
    setError(null)
    try {
      return await fn()
    } catch (err) {
      console.error(err)
      const msg = err?.reason || err?.data?.message || err?.message || 'Islem basarisiz oldu'
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const createPersonalPiggyBank = useCallback((name) => run(async () => {
    const contract = getContract()
    const tx = await contract.createPersonalPiggyBank(name)
    return await tx.wait()
  }), [getContract, run])

  const createGroupPiggyBank = useCallback((name) => run(async () => {
    const contract = getContract()
    const tx = await contract.createGroupPiggyBank(name)
    return await tx.wait()
  }), [getContract, run])

  const joinGroupPiggyBank = useCallback((id) => run(async () => {
    const contract = getContract()
    const tx = await contract.joinGroupPiggyBank(id)
    return await tx.wait()
  }), [getContract, run])

  // Onay (approve) + yatirma iki adimda yapilir
  const deposit = useCallback((id, tokenSymbol, humanAmount) => run(async () => {
    const token = TOKENS[tokenSymbol]
    const amount = ethers.utils.parseUnits(humanAmount, token.decimals)
    const tokenContract = getTokenContract(token.address)

    const currentAllowance = await tokenContract.allowance(address, KUMBARA_CONTRACT_ADDRESS)
    if (currentAllowance.lt(amount)) {
      const approveTx = await tokenContract.approve(KUMBARA_CONTRACT_ADDRESS, amount)
      await approveTx.wait()
    }

    const contract = getContract()
    const tx = await contract.deposit(id, token.address, amount)
    return await tx.wait()
  }), [getContract, getTokenContract, address, run])

  const withdraw = useCallback((id, tokenSymbol, humanAmount) => run(async () => {
    const token = TOKENS[tokenSymbol]
    const amount = ethers.utils.parseUnits(humanAmount, token.decimals)
    const contract = getContract()
    const tx = await contract.withdraw(id, token.address, amount)
    return await tx.wait()
  }), [getContract, run])

  const getMyBalance = useCallback((id, tokenSymbol) => run(async () => {
    const token = TOKENS[tokenSymbol]
    const contract = getContract()
    const raw = await contract.getMyBalance(id, token.address)
    return ethers.utils.formatUnits(raw, token.decimals)
  }), [getContract, run])

  const getPiggyBankInfo = useCallback((id) => run(async () => {
    const contract = getContract()
    const info = await contract.getPiggyBankInfo(id)
    return {
      name: info.name,
      creator: info.creator,
      isGroup: info.isGroup,
      createdAt: new Date(info.createdAt.toNumber() * 1000),
      memberCount: info.memberCount.toNumber(),
    }
  }), [getContract, run])

  const getTotalDeposited = useCallback((id, tokenSymbol) => run(async () => {
    const token = TOKENS[tokenSymbol]
    const contract = getContract()
    const raw = await contract.getTotalDeposited(id, token.address)
    return ethers.utils.formatUnits(raw, token.decimals)
  }), [getContract, run])

  const getPiggyBankCount = useCallback(() => run(async () => {
    const contract = getContract()
    const count = await contract.piggyBankCount()
    return count.toNumber()
  }), [getContract, run])

  return {
    loading,
    error,
    createPersonalPiggyBank,
    createGroupPiggyBank,
    joinGroupPiggyBank,
    deposit,
    withdraw,
    getMyBalance,
    getPiggyBankInfo,
    getTotalDeposited,
    getPiggyBankCount,
  }
}
