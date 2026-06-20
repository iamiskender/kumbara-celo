export const KUMBARA_ABI = [
  "function createPersonalPiggyBank(string name) external returns (uint256 id)",
  "function createGroupPiggyBank(string name) external returns (uint256 id)",
  "function joinGroupPiggyBank(uint256 id) external",
  "function deposit(uint256 id, address token, uint256 amount) external",
  "function withdraw(uint256 id, address token, uint256 amount) external",
  "function getMyBalance(uint256 id, address token) external view returns (uint256)",
  "function getBalanceOf(uint256 id, address user, address token) external view returns (uint256)",
  "function getMembers(uint256 id) external view returns (address[])",
  "function getMemberCount(uint256 id) external view returns (uint256)",
  "function getPiggyBankInfo(uint256 id) external view returns (string name, address creator, bool isGroup, uint256 createdAt, uint256 memberCount)",
  "function getTotalDeposited(uint256 id, address token) external view returns (uint256)",
  "function piggyBankCount() external view returns (uint256)",
  "function isMember(uint256 id, address user) external view returns (bool)",
  "event PiggyBankCreated(uint256 indexed id, address indexed creator, string name, bool isGroup)",
  "event MemberJoined(uint256 indexed id, address indexed member)",
  "event Deposited(uint256 indexed id, address indexed user, address indexed token, uint256 amount)",
  "event Withdrawn(uint256 indexed id, address indexed user, address indexed token, uint256 amount)"
]

export const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)"
]
