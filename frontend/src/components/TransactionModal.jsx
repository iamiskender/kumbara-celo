import { useState } from 'react'
import { TOKENS } from '../utils/constants'

export default function TransactionModal({ mode, piggy, onClose, onConfirm, loading }) {
  const [token, setToken] = useState('cUSD')
  const [amount, setAmount] = useState('')

  const isDeposit = mode === 'deposit'

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) return
    onConfirm(piggy.id, token, amount)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{isDeposit ? 'Deposit to' : 'Withdraw from'} — {piggy.name}</h3>
        <form onSubmit={handleSubmit}>
          <div className="modal-token-row">
            {Object.values(TOKENS).map((t) => (
              <button
                type="button"
                key={t.symbol}
                className={`token-toggle ${token === t.symbol ? 'active' : ''}`}
                onClick={() => setToken(t.symbol)}
              >
                {t.symbol}
              </button>
            ))}
          </div>
          <input
            className="text-input"
            type="number"
            step="0.01"
            min="0"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
          />
          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Processing...' : isDeposit ? 'Deposit' : 'Withdraw'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
