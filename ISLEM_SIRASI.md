# Kumbara — Islem Sirasi (Kopyala-Yapistir)

Asagidaki adimlari sirasiyla uygula. Her adim ya bir kod parcasi ya da
calistirilacak bir komuttur.

---

## ADIM 1 — Remix'te kontrati ac ve derle

1. https://remix.ethereum.org ac
2. Sol panelde "File Explorer" > yeni dosya: `Kumbara.sol`
3. Asagidaki TAM kodu icine yapistir (zip'teki `contracts/Kumbara.sol` ile ayni):

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function decimals() external view returns (uint8);
}

contract Kumbara {
    struct PiggyBank {
        string name;
        address creator;
        bool isGroup;
        uint256 createdAt;
        address[] members;
    }

    mapping(uint256 => PiggyBank) public piggyBanks;
    uint256 public piggyBankCount;
    mapping(uint256 => mapping(address => mapping(address => uint256))) public balances;
    mapping(uint256 => mapping(address => bool)) public isMember;
    mapping(uint256 => mapping(address => uint256)) public totalDeposited;

    address public immutable cUSD;
    address public immutable USDC;

    event PiggyBankCreated(uint256 indexed id, address indexed creator, string name, bool isGroup);
    event MemberJoined(uint256 indexed id, address indexed member);
    event Deposited(uint256 indexed id, address indexed user, address indexed token, uint256 amount);
    event Withdrawn(uint256 indexed id, address indexed user, address indexed token, uint256 amount);

    constructor(address _cUSD, address _USDC) {
        require(_cUSD != address(0) && _USDC != address(0), "Gecersiz token adresi");
        cUSD = _cUSD;
        USDC = _USDC;
    }

    modifier validToken(address token) {
        require(token == cUSD || token == USDC, "Sadece cUSD veya USDC kabul edilir");
        _;
    }

    modifier piggyBankExists(uint256 id) {
        require(id < piggyBankCount, "Kumbara bulunamadi");
        _;
    }

    function createPersonalPiggyBank(string calldata name) external returns (uint256 id) {
        id = _createPiggyBank(name, false);
        _joinPiggyBank(id, msg.sender);
    }

    function createGroupPiggyBank(string calldata name) external returns (uint256 id) {
        id = _createPiggyBank(name, true);
        _joinPiggyBank(id, msg.sender);
    }

    function _createPiggyBank(string calldata name, bool isGroup) private returns (uint256 id) {
        require(bytes(name).length > 0, "Isim bos olamaz");
        id = piggyBankCount++;
        PiggyBank storage pb = piggyBanks[id];
        pb.name = name;
        pb.creator = msg.sender;
        pb.isGroup = isGroup;
        pb.createdAt = block.timestamp;
        emit PiggyBankCreated(id, msg.sender, name, isGroup);
    }

    function joinGroupPiggyBank(uint256 id) external piggyBankExists(id) {
        require(piggyBanks[id].isGroup, "Bu kisisel bir kumbara, katilamazsiniz");
        require(!isMember[id][msg.sender], "Zaten katilimcisiniz");
        _joinPiggyBank(id, msg.sender);
    }

    function _joinPiggyBank(uint256 id, address user) private {
        if (!isMember[id][user]) {
            isMember[id][user] = true;
            piggyBanks[id].members.push(user);
            emit MemberJoined(id, user);
        }
    }

    function deposit(uint256 id, address token, uint256 amount)
        external
        piggyBankExists(id)
        validToken(token)
    {
        require(amount > 0, "Miktar sifirdan buyuk olmali");
        PiggyBank storage pb = piggyBanks[id];
        if (pb.isGroup) {
            _joinPiggyBank(id, msg.sender);
        } else {
            require(msg.sender == pb.creator, "Bu kisisel kumbaraya sadece sahibi yatirabilir");
        }
        bool ok = IERC20(token).transferFrom(msg.sender, address(this), amount);
        require(ok, "Token transferi basarisiz");
        balances[id][msg.sender][token] += amount;
        totalDeposited[id][token] += amount;
        emit Deposited(id, msg.sender, token, amount);
    }

    function withdraw(uint256 id, address token, uint256 amount)
        external
        piggyBankExists(id)
        validToken(token)
    {
        require(amount > 0, "Miktar sifirdan buyuk olmali");
        uint256 bal = balances[id][msg.sender][token];
        require(bal >= amount, "Yetersiz bakiye");
        balances[id][msg.sender][token] = bal - amount;
        totalDeposited[id][token] -= amount;
        bool ok = IERC20(token).transfer(msg.sender, amount);
        require(ok, "Token transferi basarisiz");
        emit Withdrawn(id, msg.sender, token, amount);
    }

    function getMyBalance(uint256 id, address token) external view returns (uint256) {
        return balances[id][msg.sender][token];
    }

    function getBalanceOf(uint256 id, address user, address token) external view returns (uint256) {
        return balances[id][user][token];
    }

    function getMembers(uint256 id) external view piggyBankExists(id) returns (address[] memory) {
        return piggyBanks[id].members;
    }

    function getMemberCount(uint256 id) external view piggyBankExists(id) returns (uint256) {
        return piggyBanks[id].members.length;
    }

    function getPiggyBankInfo(uint256 id)
        external
        view
        piggyBankExists(id)
        returns (string memory name, address creator, bool isGroup, uint256 createdAt, uint256 memberCount)
    {
        PiggyBank storage pb = piggyBanks[id];
        return (pb.name, pb.creator, pb.isGroup, pb.createdAt, pb.members.length);
    }

    function getTotalDeposited(uint256 id, address token) external view returns (uint256) {
        return totalDeposited[id][token];
    }
}
```

4. Sol menude "Solidity Compiler" sekmesine gec
5. Compiler version: `0.8.19` sec
6. **Compile Kumbara.sol** butonuna bas (hatasiz derlenmeli)

---

## ADIM 2 — Cuzdani Celo Mainnet'e bagla

MetaMask'ta ag yoksa, "Add Network" ile bunu ekle:

```
Network Name: Celo Mainnet
RPC URL: https://forno.celo.org
Chain ID: 42220
Currency Symbol: CELO
Block Explorer: https://celoscan.io
```

Cuzdaninda gas icin biraz CELO oldugundan emin ol (en az 0.5-1 CELO yeterli).

---

## ADIM 3 — Deploy et

Remix'te "Deploy & Run Transactions" sekmesine gec:

1. **ENVIRONMENT**: `Injected Provider - MetaMask` sec
2. MetaMask acilir, Celo Mainnet'te oldugunu ve dogru hesabi onayla
3. **CONTRACT**: `Kumbara` secili olmali
4. Asagidaki constructor parametrelerini, "Deploy" butonunun yanindaki
   kutucuklara TEK TEK gir (virgul ile ayirma, her biri ayri kutuya):

```
_cUSD: 0x765DE816845861e75A25fCA122bb6898B8B1282a
_USDC: 0xcebA9300f2b948710d2653dD7B07f33A8B32118C
```

5. **Deploy** butonuna bas
6. MetaMask'ta islemi onayla, biraz bekle

Deploy basarili olunca alt kisimda "Deployed Contracts" altinda `KUMBARA AT 0x...`
seklinde gorunecek. **Bu adresi kopyala** — bir sonraki adimda kullanacaksin.

---

## ADIM 4 — Frontend'de kontrat adresini guncelle

`frontend/src/utils/constants.js` dosyasini ac, en alttaki satiri bul:

```js
export const KUMBARA_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000'
```

ve ADIM 3'te kopyaladigin gercek adresle degistir, ornek:

```js
export const KUMBARA_CONTRACT_ADDRESS = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12'
```

Dosyayi kaydet.

---

## ADIM 5 — Lokal test (opsiyonel ama onerilir)

Terminalde:

```bash
cd kumbara/frontend
npm install
npm run dev
```

Tarayicida `http://localhost:5173` ac, MetaMask'i Celo Mainnet'te baglayip
arayuzun acildigini dogrula.

---

## ADIM 6 — Build alip Vercel'e deploy et

Terminalde:

```bash
cd kumbara/frontend
npm run build
```

Sonra Vercel CLI ile (yoksa once `npm install -g vercel`):

```bash
vercel login
vercel --prod
```

Sorulan sorularda:
- "Set up and deploy?" → `Y`
- "Which scope?" → kendi hesabini sec
- "Link to existing project?" → `N` (ilk defaysa)
- "Project name?" → `kumbara-celo` (veya istedigin isim)
- "In which directory is your code located?" → `./` (frontend klasoru icindeysen)
- "Want to override settings?" → `N` (Vite otomatik algilanir)

Deploy bitince sana bir URL verir, orn:
`https://kumbara-celo.vercel.app`

---

## ADIM 7 — Celoscan'de kontrati dogrula (onerilir)

1. https://celoscan.io adresine git
2. ADIM 3'teki kontrat adresini arama kutusuna yapistir
3. Kontrat sayfasinda "Contract" sekmesi > "Verify and Publish"
4. Compiler type: `Solidity (Single file)`
5. Compiler version: `v0.8.19`
6. License: `MIT`
7. Kaynak kodu (ADIM 1'deki tam kod) yapistir
8. Constructor Arguments ABI-encoded kismina gerek yok, Celoscan
   otomatik algilar (algilamazsa, asagidaki gibi encode edebilirsin:
   https://abi.hashex.org/ uzerinden `_cUSD` ve `_USDC` degerlerini girip
   encoded string'i alabilirsin)
9. **Verify and Publish** butonuna bas

---

## ADIM 8 — Test islemleri yap (Remix konsolu uzerinden)

Bu adim hem dApp'in calistigini kanitlar hem Proof of Ship'in islem/kullanici
sayisi metrigini besler. Remix'te deploy ettigin kontrat hala "Deployed
Contracts" altinda gorunuyor olmali — oradan direkt cagirabilirsin.

### 8.1 — Once cUSD'ye approve ver

Remix'te "Deploy & Run Transactions" sekmesinde, "At Address" kutusuna
cUSD adresini yapistir ve bagla:

```
0x765DE816845861e75A25fCA122bb6898B8B1282a
```

Bu adrese ERC20 ABI'sini Remix taniyamayabilir; bunun icin once asagidaki
arayuz kodunu ayri bir dosya olarak ekleyip derle (`IERC20.sol`):

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20Test {
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}
```

Derledikten sonra "At Address" kutusuna cUSD adresini yapistirip
`IERC20Test` arayuzu uzerinden baglan. Acilan fonksiyonlardan `approve`'u
kullan:

```
spender: <ADIM 3'teki Kumbara kontrat adresin>
amount: 1000000000000000000
```

(1000000000000000000 = 1 cUSD, cunku cUSD 18 decimal kullanir)

"approve" butonuna bas, MetaMask'ta onayla.

### 8.2 — Kisisel kumbara olustur

Kumbara kontratina geri don (Deployed Contracts altinda), `createPersonalPiggyBank`
fonksiyonunu bul ve cagir:

```
name: "Test Kumbaram"
```

### 8.3 — Yatirma yap

`deposit` fonksiyonunu cagir:

```
id: 0
token: 0x765DE816845861e75A25fCA122bb6898B8B1282a
amount: 1000000000000000000
```

(id=0, cunku ilk olusturdugun kumbara — kontrat sayaci 0'dan baslar)

### 8.4 — Bakiyeni kontrol et

`getMyBalance` (view fonksiyon, gas gerektirmez) cagir:

```
id: 0
token: 0x765DE816845861e75A25fCA122bb6898B8B1282a
```

Sonuc `1000000000000000000` donmeli (1 cUSD).

### 8.5 — Cekim yap

`withdraw` fonksiyonunu cagir:

```
id: 0
token: 0x765DE816845861e75A25fCA122bb6898B8B1282a
amount: 500000000000000000
```

(0.5 cUSD geri cekiyorsun, kalan bakiyen 0.5 cUSD olmali)

### 8.6 — Grup kumbarasi test et

`createGroupPiggyBank` cagir:

```
name: "Test Grup Kumbarasi"
```

Bu `id: 1` olarak olusur (sayac artmis durumda). Baska bir cuzdanin varsa
o cuzdandan `joinGroupPiggyBank(1)` cagirip katilim test edebilirsin.

---

## ADIM 9 — GitHub'a push et

Terminalde proje kok dizininde:

```bash
cd kumbara
git init
git add .
git commit -m "Kumbara: Celo mainnet mikro-tasarruf dApp'i"
git branch -M main
git remote add origin https://github.com/iamiskender/kumbara-celo.git
git push -u origin main
```

(Repo'yu GitHub'da onceden olusturman gerekiyor: github.com/new ->
repo adi `kumbara-celo` -> Create repository, sonra yukaridaki komutlari
calistir)

---

## ADIM 10 — KarmaGAP + Proof of Ship'e kayit

1. https://gap.karmahq.xyz adresine git, cuzdanla baglan
2. "Add Project" ile yeni proje olustur:
   - Title: `Kumbara`
   - Description: README'deki "Neden bu proje?" kismini ozetle
   - Links: GitHub repo + Vercel canli link
3. Proof of Ship sezonuna kayit ol (talent.app/~/earn/celo-proof-of-ship
   uzerindeki "Submit Project" butonu)
4. Contract address alanina ADIM 3'teki kontrat adresini ekle
5. Talent Protocol profilinde "human checkmark" oldugunu dogrula

---

## Ozet — Sirayla Yapilacaklar Listesi

- [ ] 1. Remix'te kontrati derle
- [ ] 2. MetaMask'i Celo Mainnet'e bagla
- [ ] 3. Kontrati deploy et, adresi kopyala
- [ ] 4. `constants.js`'i guncelle
- [ ] 5. Lokal test et (`npm run dev`)
- [ ] 6. Build al, Vercel'e deploy et
- [ ] 7. Celoscan'de dogrula
- [ ] 8. Test islemleri yap (approve, deposit, withdraw, grup testi)
- [ ] 9. GitHub'a push et
- [ ] 10. KarmaGAP + Proof of Ship'e kayit ol
