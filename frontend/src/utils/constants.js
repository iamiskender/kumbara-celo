// Celo Mainnet token adresleri (resmi: docs.celo.org/tooling/contracts/token-contracts)
export const TOKENS = {
  cUSD: {
    symbol: 'cUSD',
    label: 'Celo Dolari',
    address: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
    decimals: 18,
    color: '#FBCC5C',
  },
  USDC: {
    symbol: 'USDC',
    label: 'USD Coin',
    address: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C',
    decimals: 6,
    color: '#2775CA',
  },
}

// Celo Mainnet ag bilgisi
export const CELO_MAINNET = {
  chainId: '0xa4ec', // 42220
  chainName: 'Celo Mainnet',
  nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
  rpcUrls: ['https://forno.celo.org'],
  blockExplorerUrls: ['https://celoscan.io'],
}

// Kumbara kontrat adresi - Celo Mainnet'te deploy edildi
export const KUMBARA_CONTRACT_ADDRESS = '0x2412B7346EE9870311115b9Fc52Fc540a88416b4'
