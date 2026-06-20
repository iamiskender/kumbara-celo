import { useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'
import { CELO_MAINNET } from '../utils/constants'

export function useWallet() {
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [address, setAddress] = useState(null)
  const [chainOk, setChainOk] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState(null)

  const checkNetwork = useCallback(async (prov) => {
    const network = await prov.getNetwork()
    const isCorrect = network.chainId === parseInt(CELO_MAINNET.chainId, 16)
    setChainOk(isCorrect)
    return isCorrect
  }, [])

  const switchToCelo = useCallback(async () => {
    if (!window.ethereum) return
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: CELO_MAINNET.chainId }],
      })
    } catch (switchError) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [CELO_MAINNET],
        })
      } else {
        throw switchError
      }
    }
  }, [])

  const connect = useCallback(async () => {
    setError(null)
    if (!window.ethereum) {
      setError('No wallet found. Please install MetaMask or MiniPay.')
      return
    }
    setConnecting(true)
    try {
      const prov = new ethers.providers.Web3Provider(window.ethereum, 'any')
      await prov.send('eth_requestAccounts', [])
      const isCorrect = await checkNetwork(prov)
      if (!isCorrect) {
        await switchToCelo()
      }
      const finalProvider = new ethers.providers.Web3Provider(window.ethereum, 'any')
      const sgnr = finalProvider.getSigner()
      const addr = await sgnr.getAddress()
      setProvider(finalProvider)
      setSigner(sgnr)
      setAddress(addr)
      await checkNetwork(finalProvider)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Connection failed.')
    } finally {
      setConnecting(false)
    }
  }, [checkNetwork, switchToCelo])

  const disconnect = useCallback(() => {
    setProvider(null)
    setSigner(null)
    setAddress(null)
    setChainOk(false)
  }, [])

  useEffect(() => {
    if (!window.ethereum) return
    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnect()
      } else {
        connect()
      }
    }
    const handleChainChanged = () => {
      connect()
    }
    window.ethereum.on('accountsChanged', handleAccountsChanged)
    window.ethereum.on('chainChanged', handleChainChanged)
    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
      window.ethereum.removeListener('chainChanged', handleChainChanged)
    }
  }, [connect, disconnect])

  return { provider, signer, address, chainOk, connecting, error, connect, disconnect, switchToCelo }
}
