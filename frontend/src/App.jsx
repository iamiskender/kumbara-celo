import { useState, useEffect, useCallback } from 'react'
import { useWallet } from './hooks/useWallet'
import { useKumbara } from './hooks/useKumbara'
import { TOKENS } from './utils/constants'
import PiggyIllustration from './components/PiggyIllustration'
import PiggyCard from './components/PiggyCard'
import TransactionModal from './components/TransactionModal'

function shortenAddress(addr) {
  if (!addr) return ''
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export default function App() {
  const { signer, address, chainOk, connecting, error: walletError, connect, switchToCelo } = useWallet()
  const kumbara = useKumbara(signer, address)

  const [piggies, setPiggies] = useState([])
  const [balancesById, setBalancesById] = useState({})
  const [membersById, setMembersById] = useState({})
  const [createTab, setCreateTab] = useState('personal')
  const [newName, setNewName] = useState('')
  const [modal, setModal] = useState(null) // { mode: 'deposit'|'withdraw', piggy }
  const [toast, setToast] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const showToast = useCallback((message, isError = false) => {
    setToast({ message, isError })
    setTimeout(() => setToast(null), 3500)
  }, [])

  const loadPiggies = useCallback(async () => {
    if (!signer || !chainOk) return
    setRefreshing(true)
    try {
      const count = await kumbara.getPiggyBankCount()
      const list = []
      const balMap = {}
      const memberMap = {}

      for (let id = 0; id < count; id++) {
        const info = await kumbara.getPiggyBankInfo(id)
        list.push({ id, ...info })

        const cusdBal = await kumbara.getMyBalance(id, 'cUSD')
        const usdcBal = await kumbara.getMyBalance(id, 'USDC')
        balMap[id] = { cUSD: cusdBal, USDC: usdcBal }

        memberMap[id] = info.creator?.toLowerCase() === address?.toLowerCase()
      }

      setPiggies(list.reverse())
      setBalancesById(balMap)
      setMembersById(memberMap)
    } catch (err) {
      console.error(err)
    } finally {
      setRefreshing(false)
    }
  }, [signer, chainOk, kumbara, address])

  useEffect(() => {
    loadPiggies()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signer, chainOk])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    try {
      if (createTab === 'personal') {
        await kumbara.createPersonalPiggyBank(newName.trim())
      } else {
        await kumbara.createGroupPiggyBank(newName.trim())
      }
      showToast('Piggy bank created!')
      setNewName('')
      await loadPiggies()
    } catch (err) {
      showToast(err?.reason || 'Failed to create piggy bank', true)
    }
  }

  const handleJoin = async (id) => {
    try {
      await kumbara.joinGroupPiggyBank(id)
      showToast('You joined the piggy bank!')
      await loadPiggies()
    } catch (err) {
      showToast(err?.reason || 'Failed to join', true)
    }
  }

  const handleConfirmTransaction = async (id, token, amount) => {
    try {
      if (modal.mode === 'deposit') {
        await kumbara.deposit(id, token, amount)
        showToast(`Deposited ${amount} ${token}.`)
      } else {
        await kumbara.withdraw(id, token, amount)
        showToast(`Withdrew ${amount} ${token}.`)
      }
      setModal(null)
      await loadPiggies()
    } catch (err) {
      showToast(err?.reason || 'Transaction failed', true)
    }
  }

  const totalAcrossPiggies = Object.values(balancesById).reduce(
    (acc, b) => acc + Number(b.cUSD || 0) + Number(b.USDC || 0),
    0
  )

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <span className="brand-mark">Kumbara</span>
          <span className="brand-tag">Celo Mainnet</span>
        </div>
        {address ? (
          <button className="wallet-pill connected">
            <span className={`dot ${chainOk ? '' : 'warn'}`} />
            {shortenAddress(address)}
          </button>
        ) : (
          <button className="wallet-pill" onClick={connect} disabled={connecting}>
            {connecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        )}
      </header>

      {address && !chainOk && (
        <div className="network-banner">
          <span>Wrong network selected. Kumbara only works on Celo Mainnet.</span>
          <button onClick={switchToCelo}>Switch to Celo</button>
        </div>
      )}

      {!address && (
        <section className="hero">
          <div>
            <h1>Keep your savings <em>on chain</em>, not under the mattress.</h1>
            <p>
              Create piggy banks, deposit cUSD or USDC anytime, and withdraw
              whenever you need to. Solo or with a group — you stay in control.
            </p>
            <div className="hero-stats">
              <div className="hero-stat">
                <div className="num">2</div>
                <div className="label">Supported Tokens</div>
              </div>
              <div className="hero-stat">
                <div className="num">0%</div>
                <div className="label">Lock-up Period</div>
              </div>
              <div className="hero-stat">
                <div className="num">100%</div>
                <div className="label">Your Control</div>
              </div>
            </div>
          </div>
          <div className="piggy-illustration">
            <PiggyIllustration />
          </div>
        </section>
      )}

      {address && chainOk && (
        <>
          <div className="create-card">
            <p className="section-title">New Piggy Bank</p>
            <p className="section-sub">A personal piggy bank belongs only to you. Others can join a group piggy bank.</p>
            <div className="tab-row">
              <button
                className={`tab-btn ${createTab === 'personal' ? 'active' : ''}`}
                onClick={() => setCreateTab('personal')}
              >
                Personal Piggy Bank
              </button>
              <button
                className={`tab-btn ${createTab === 'group' ? 'active' : ''}`}
                onClick={() => setCreateTab('group')}
              >
                Group Piggy Bank
              </button>
            </div>
            <form className="form-row" onSubmit={handleCreate}>
              <input
                className="text-input"
                placeholder={createTab === 'personal' ? 'e.g. Summer Vacation Fund' : 'e.g. Roommates Rent Pool'}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <button className="btn-primary" type="submit" disabled={kumbara.loading}>
                {kumbara.loading ? 'Creating...' : 'Create'}
              </button>
            </form>
          </div>

          <p className="section-title">My Piggy Banks</p>
          <p className="section-sub">
            {refreshing ? 'Loading...' : `${piggies.length} piggy bank${piggies.length === 1 ? '' : 's'}, roughly $${totalAcrossPiggies.toFixed(2)} in value`}
          </p>

          {piggies.length === 0 && !refreshing ? (
            <div className="empty-state">
              <PiggyIllustration />
              <p>You don't have a piggy bank yet. Create your first one above.</p>
            </div>
          ) : (
            <div className="piggy-grid">
              {piggies.map((piggy) => (
                <PiggyCard
                  key={piggy.id}
                  piggy={piggy}
                  balances={balancesById[piggy.id]}
                  isMember={membersById[piggy.id]}
                  onDeposit={(p) => setModal({ mode: 'deposit', piggy: p })}
                  onWithdraw={(p) => setModal({ mode: 'withdraw', piggy: p })}
                  onJoin={handleJoin}
                />
              ))}
            </div>
          )}
        </>
      )}

      {modal && (
        <TransactionModal
          mode={modal.mode}
          piggy={modal.piggy}
          loading={kumbara.loading}
          onClose={() => setModal(null)}
          onConfirm={handleConfirmTransaction}
        />
      )}

      {toast && (
        <div className={`toast ${toast.isError ? 'error' : ''}`}>{toast.message}</div>
      )}

      {walletError && <div className="toast error">{walletError}</div>}

      <footer className="footer">
        <span>Kumbara · Open-source micro-savings on Celo</span>
        <a href="https://celoscan.io" target="_blank" rel="noreferrer">View on Celoscan</a>
      </footer>
    </div>
  )
}
