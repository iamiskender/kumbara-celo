import { useEffect, useState } from 'react'
import { TOKENS } from '../utils/constants'

export default function PiggyCard({ piggy, balances, onDeposit, onWithdraw, onJoin, isMember }) {
  return (
    <div className={`piggy-card ${piggy.isGroup ? 'group' : ''}`}>
      <div className="piggy-card-head">
        <div>
          <p className="piggy-name">{piggy.name}</p>
          <span className="piggy-meta">#{piggy.id} · {piggy.createdAt.toLocaleDateString('en-US')}</span>
        </div>
        <span className={`badge ${piggy.isGroup ? 'group' : ''}`}>
          {piggy.isGroup ? `Group · ${piggy.memberCount} member${piggy.memberCount === 1 ? '' : 's'}` : 'Personal'}
        </span>
      </div>

      {Object.values(TOKENS).map((token) => (
        <div className="token-row" key={token.symbol}>
          <span className="token-name">
            <span className="token-dot" style={{ background: token.color }} />
            {token.symbol}
          </span>
          <span className="token-balance">
            {balances?.[token.symbol] !== undefined ? Number(balances[token.symbol]).toFixed(2) : '—'}
          </span>
        </div>
      ))}

      <div className="piggy-actions">
        {piggy.isGroup && !isMember ? (
          <button className="btn-primary" onClick={() => onJoin(piggy.id)}>Join</button>
        ) : (
          <>
            <button className="btn-primary" onClick={() => onDeposit(piggy)}>Deposit</button>
            <button className="btn-ghost" onClick={() => onWithdraw(piggy)}>Withdraw</button>
          </>
        )}
      </div>
    </div>
  )
}
