# Deploy Talimatlari (Remix ile Celo Mainnet)

## 1. Remix'i ac

https://remix.ethereum.org adresine git.

## 2. Kontrati yukle

Sol menude `contracts/Kumbara.sol` icerigini kopyala, Remix'te yeni bir
dosya olustur (orn. `Kumbara.sol`) ve icerigi yapistir.

## 3. Derle (Compile)

Sol menuden "Solidity Compiler" sekmesine gec.
- Compiler version: `0.8.19` veya uyumlu bir surum sec
- "Compile Kumbara.sol" butonuna bas

## 4. Cuzdani Celo Mainnet'e bagla

MetaMask'ta ag olarak Celo Mainnet'i ekle (yoksa):
- Network Name: `Celo Mainnet`
- RPC URL: `https://forno.celo.org`
- Chain ID: `42220`
- Symbol: `CELO`
- Explorer: `https://celoscan.io`

Cuzdaninda biraz CELO olmasi gerekiyor (gas icin). Yoksa bir exchange'den
veya Celo Mentobridge'den CELO alabilirsin.

## 5. Deploy et

"Deploy & Run Transactions" sekmesine gec:
- Environment: `Injected Provider - MetaMask` sec
- Account: cuzdan adresinin gorundugunden emin ol, Network olarak "Celo
  Mainnet" gozukmeli
- Contract: `Kumbara` secili olsun
- Constructor parametrelerini gir:
  - `_cUSD`: `0x765DE816845861e75A25fCA122bb6898B8B1282a`
  - `_USDC`: `0xcebA9300f2b948710d2653dD7B07f33A8B32118C`
- "Deploy" butonuna bas, MetaMask'ta islemi onayla

## 6. Adresi kaydet

Deploy basarili olunca Remix'in altinda "Deployed Contracts" kismi altinda
kontrat adresini goreceksin. Bu adresi kopyala.

## 7. Frontend'i guncelle

`frontend/src/utils/constants.js` dosyasinda su satiri bul:

```js
export const KUMBARA_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000'
```

ve deploy ettigin gercek adresle degistir.

## 8. Celoscan'de dogrula (opsiyonel ama onerilir)

https://celoscan.io adresine git, kontrat adresini ara, "Verify and
Publish" sekmesinden kaynak kodunu (Kumbara.sol) yukle. Bu, Proof of Ship
degerlendirmesinde ve kullanici guveninde fark yaratir.

## 9. Test islemleri yap

Proof of Ship skorunu beslemek icin deploy ettikten sonra:
1. Kendi cuzdanindan bir kisisel kumbara olustur
2. Kucuk bir miktar (orn. 1 cUSD) yatir
3. Bir grup kumbarasi olustur, baska bir cuzdandan (varsa) katil
4. Bir cekim islemi yap

Bu islemler hem dApp'in calistigini kanitlar hem de Proof of Ship'in
transaction count / user count metriklerini besler.
