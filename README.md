# Kumbara — Celo Uzerinde Mikro-Tasarruf Kasasi

Kumbara, Celo Mainnet uzerinde calisan, esnek (kilitsiz) bir mikro-tasarruf
dApp'idir. Kullanicilar kendi kisisel kumbaralarini olusturabilir veya bir
grupla (ev arkadaslari, arkadas cevresi, aile) birlikte ortak bir kumbara
acabilir. Para cUSD veya native USDC ile, istenildigi zaman yatirilir ve
istenildigi zaman geri cekilir — hic bir kilit suresi veya ceza yoktur.

Bu proje, Nijerya'daki **Ajo/Esusu** ve Kenya'daki **Chama** gibi Afrika'da
yaygin olan geleneksel grup tasarruf pratiklerinden ilham alir ve bu pratigi
seffaf, izlenebilir ve guvenli bir sekilde zincire tasir.

## Neden bu proje?

- **Gercek kullanim ihtiyaci**: Grup halinde tasarruf etmek, dunyanin
  bircok yerinde (ozellikle Celo'nun hedef kitlesi olan gelismekte olan
  pazarlarda) gunluk bir finansal pratiktir.
- **Stablecoin-native**: Celo'nun guclu oldugu cUSD ve native USDC ile
  calisir, boylelikle kullanicilar fiyat volatilitesine maruz kalmaz.
- **Guvenli paylasim modeli**: Grup kumbaralarinda her kullanicinin
  bakiyesi ayri tutulur — kimse baskasinin parasini cekemez. Fonlar
  havuzda "karismaz", bu da en yaygin grup-fonu guvenlik riskini ortadan
  kaldirir.
- **MiniPay uyumlu**: Injected provider (window.ethereum) standardini
  kullanir, bu sayede MiniPay icinden dogrudan acilip kullanilabilir.

## Mimari

```
kumbara/
├── contracts/
│   └── Kumbara.sol        # Ana akilli kontrat (Solidity ^0.8.19)
└── frontend/
    ├── src/
    │   ├── App.jsx                  # Ana uygulama
    │   ├── components/
    │   │   ├── PiggyCard.jsx        # Tek kumbara karti
    │   │   ├── PiggyIllustration.jsx
    │   │   └── TransactionModal.jsx # Yatir/Cek modali
    │   ├── hooks/
    │   │   ├── useWallet.js         # Cuzdan baglantisi + ag kontrolu
    │   │   └── useKumbara.js        # Kontrat etkilesimi (ethers.js v5)
    │   ├── abi/kumbara.js           # Kontrat + ERC20 ABI'leri
    │   └── utils/constants.js       # Token adresleri, ag bilgisi
    └── index.html
```

## Akilli Kontrat

`contracts/Kumbara.sol` — Remix IDE ile derlenip Celo Mainnet'e deploy
edilmistir.

**Temel fonksiyonlar:**

| Fonksiyon | Aciklama |
|---|---|
| `createPersonalPiggyBank(name)` | Sadece sana ait bir kumbara olusturur |
| `createGroupPiggyBank(name)` | Baskalarinin da katilabildigi bir kumbara olusturur |
| `joinGroupPiggyBank(id)` | Mevcut bir grup kumbarasina katilirsin |
| `deposit(id, token, amount)` | cUSD veya USDC yatirir (once `approve` gerekir) |
| `withdraw(id, token, amount)` | Kendi yatirdigin miktari geri cekersin |
| `getMyBalance(id, token)` | O kumbaradaki token bazinda bakiyeni gosterir |
| `getPiggyBankInfo(id)` | Kumbara meta verisini dondurur |

**Guvenlik tasarimi:** Her kullanicinin bakiyesi
`balances[kumbaraId][kullanici][token]` seklinde ayri tutulur. Grup
kumbaralarinda dahi kimse kendi yatirdigindan fazlasini cekemez — bu,
ortak havuzlarda en sik gorulen "kim ne kadar koydu" anlasmazligini ve
fon karismasi riskini ortadan kaldirir.

### Deploy edilmis adres (Celo Mainnet)

```
Kontrat: <DEPLOY SONRASI BURAYA CELOSCAN ADRESI GELECEK>
cUSD:    0x765DE816845861e75A25fCA122bb6898B8B1282a
USDC:    0xcebA9300f2b948710d2653dD7B07f33A8B32118C
```

## Frontend

React + Vite + ethers.js v5 ile yazilmistir. MetaMask ve MiniPay'in
injected provider'ini destekler, yanlis agda oldugunuzda otomatik olarak
Celo Mainnet'e gecis ister.

### Calistirma

```bash
cd frontend
npm install
npm run dev
```

### Deploy

```bash
npm run build
# dist/ klasorunu Vercel, Netlify vb. bir platforma yukleyin
```

## Yol Haritasi

- [ ] MiniPay icin ozel "feeCurrency" destegi ekle (cUSD ile gas odeme)
- [ ] Grup kumbaralari icin hedef tutar / ilerleme cubugu
- [ ] Farcaster Frame entegrasyonu ile sosyal paylasim
- [ ] KarmaGAP proje profili + Proof of Ship aylik raporlama

## Lisans

MIT
