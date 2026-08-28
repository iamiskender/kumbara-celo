// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function decimals() external view returns (uint8);
}

/// @title Kumbara - Esnek Mikro-Tasarvuf Kasası
/// @notice Kullanicilar ve gruplar cUSD veya USDC ile istedikleri zaman
///         para yatirip cekebilecekleri kumbaralar olusturabilir.
/// @dev Her kumbara, sahip(ler)inin token bazinda bakiyesini ayri tutar.
///      Toplu havuzlarda herkes SADECE kendi yatirdigini cekebilir; bu
///      fonlarin karismasini ve guven gerektiren paylasim mantigini onler.
contract Kumbara {
    // ---------------------------------------------------------------
    // Durum (State)
    // ---------------------------------------------------------------

    struct PiggyBank {
        string name;            // Kumbara adi (orn. "Yaz Tatili", "Acil Durum Fonu")
        address creator;        // Olusturan kisi
        bool isGroup;           // true = grup kumbarasi (birden fazla katilimci), false = kisisel
        uint256 createdAt;
        address[] members;      // Katilimci listesi (sadece bilgi/goruntuleme amacli)
    }

    // kumbaraId => PiggyBank
    mapping(uint256 => PiggyBank) public piggyBanks;
    uint256 public piggyBankCount;

    // kumbaraId => kullanici => token => bakiye
    mapping(uint256 => mapping(address => mapping(address => uint256))) public balances;

    // kumbaraId => kullanici => katilimci mi?
    mapping(uint256 => mapping(address => bool)) public isMember;

    // kumbaraId => token => toplam yatirilan miktar (goruntuleme/ilerleme icin)
    mapping(uint256 => mapping(address => uint256)) public totalDeposited;

    // Desteklenen tokenlar (Celo mainnet: cUSD ve USDC)
    address public immutable cUSD;
    address public immutable USDC;

    // ---------------------------------------------------------------
    // Olaylar (Events)
    // ---------------------------------------------------------------

    event PiggyBankCreated(uint256 indexed id, address indexed creator, string name, bool isGroup);
    event MemberJoined(uint256 indexed id, address indexed member);
    event Deposited(uint256 indexed id, address indexed user, address indexed token, uint256 amount);
    event Withdrawn(uint256 indexed id, address indexed user, address indexed token, uint256 amount);

    // ---------------------------------------------------------------
    // Kurucu (Constructor)
    // ---------------------------------------------------------------

    /// @param _cUSD Celo mainnet cUSD token adresi
    /// @param _USDC Celo mainnet USDC (Circle) token adresi
    constructor(address _cUSD, address _USDC) {
        require(_cUSD != address(0) && _USDC != address(0), "Gecersiz token adresi");
        cUSD = _cUSD;
        USDC = _USDC;
    }

    // ---------------------------------------------------------------
    // Yardimci (Modifiers / Internal)
    // ---------------------------------------------------------------

    modifier validToken(address token) {
        require(token == cUSD || token == USDC, "Sadece cUSD veya USDC kabul edilir");
        _;
    }

    modifier piggyBankExists(uint256 id) {
        require(id < piggyBankCount, "Kumbara bulunamadi");
        _;
    }

    // ---------------------------------------------------------------
    // Kumbara Olusturma
    // ---------------------------------------------------------------

    /// @notice Yeni bir kisisel kumbara olusturur (sadece sen kullanirsin)
    function createPersonalPiggyBank(string calldata name) external returns (uint256 id) {
        id = _createPiggyBank(name, false);
        _joinPiggyBank(id, msg.sender);
    }

    /// @notice Yeni bir grup kumbarasi olusturur (baskalari da katilabilir)
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

    /// @notice Bir grup kumbarasina katil
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

    // ---------------------------------------------------------------
    // Yatirma / Cekme
    // ---------------------------------------------------------------

    /// @notice Belirtilen kumbaraya cUSD veya USDC yatir
    /// @dev Once token kontratinda bu adrese `approve` cagirmaniz gerekir
    function deposit(uint256 id, address token, uint256 amount)
        external
        piggyBankExists(id)
        validToken(token)
    {
        require(amount > 0, "Miktar sifirdan buyuk olmali");

        // Grup kumbarasiysa otomatik katil; kisisel kumbaradaysa sadece sahibi yatirabilir
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

    /// @notice Kendi yatirdigin miktari (kismen veya tamamen) geri cek
    /// @dev Herkes SADECE kendi yatirdigi miktari cekebilir, fonlar karismaz
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

    // ---------------------------------------------------------------
    // Goruntuleme (View) Fonksiyonlari
    // ---------------------------------------------------------------

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

    /// @notice Bir kumbaranin toplam cUSD ve USDC bakiyesini dondurur
    function getTotalDeposited(uint256 id, address token) external view returns (uint256) {
        return totalDeposited[id][token];
    }
}
