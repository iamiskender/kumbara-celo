// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test} from "forge-std/Test.sol";
import {Kumbara} from "../src/Kumbara.sol";

/// Minimal ERC-20 for the tests. cUSD has 18 decimals, USDC on Celo has 6, and
/// the difference matters: the contract stores raw token units, so a test that
/// used 18 decimals everywhere would never notice a decimal bug.
contract MockToken {
    string public name;
    uint8 public decimals;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    bool public failTransfers;

    constructor(string memory _name, uint8 _decimals) {
        name = _name;
        decimals = _decimals;
    }

    function setFailTransfers(bool value) external {
        failTransfers = value;
    }

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        if (failTransfers) return false;
        require(balanceOf[msg.sender] >= amount, "balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        if (failTransfers) return false;
        require(balanceOf[from] >= amount, "balance");
        require(allowance[from][msg.sender] >= amount, "allowance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract KumbaraTest is Test {
    Kumbara internal kumbara;
    MockToken internal cusd;
    MockToken internal usdc;
    MockToken internal stranger;

    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");
    address internal carol = makeAddr("carol");

    function setUp() public {
        cusd = new MockToken("cUSD", 18);
        usdc = new MockToken("USDC", 6);
        stranger = new MockToken("RANDOM", 18);

        kumbara = new Kumbara(address(cusd), address(usdc));

        for (uint256 i = 0; i < 3; i++) {
            address who = [alice, bob, carol][i];
            cusd.mint(who, 1000e18);
            usdc.mint(who, 1000e6);
            vm.startPrank(who);
            cusd.approve(address(kumbara), type(uint256).max);
            usdc.approve(address(kumbara), type(uint256).max);
            vm.stopPrank();
        }
    }

    function _groupWith(address creator, string memory name) internal returns (uint256 id) {
        vm.prank(creator);
        id = kumbara.createGroupPiggyBank(name);
    }

    // -----------------------------------------------------------------
    // The claim the README makes: in a group piggy bank, funds never mix
    // -----------------------------------------------------------------

    /// The security property this whole design rests on. Three people put money
    /// into one shared piggy bank; none of them can take out more than they
    /// personally put in, even though the tokens sit in a single contract
    /// balance. If this ever fails, the shared piggy bank is a way to rob your
    /// friends.
    function test_NobodyCanWithdrawMoreThanTheyDeposited() public {
        uint256 id = _groupWith(alice, "family");

        vm.prank(alice);
        kumbara.deposit(id, address(cusd), 100e18);
        vm.prank(bob);
        kumbara.deposit(id, address(cusd), 300e18);
        vm.prank(carol);
        kumbara.deposit(id, address(cusd), 50e18);

        // 450 cUSD sits in the contract, but alice's ceiling is her own 100.
        assertEq(cusd.balanceOf(address(kumbara)), 450e18);

        vm.prank(alice);
        vm.expectRevert("Yetersiz bakiye");
        kumbara.withdraw(id, address(cusd), 101e18);

        // Exactly her own amount is fine.
        vm.prank(alice);
        kumbara.withdraw(id, address(cusd), 100e18);

        assertEq(kumbara.getBalanceOf(id, alice, address(cusd)), 0);
        assertEq(kumbara.getBalanceOf(id, bob, address(cusd)), 300e18);
        assertEq(kumbara.getBalanceOf(id, carol, address(cusd)), 50e18);
        assertEq(cusd.balanceOf(address(kumbara)), 350e18);
    }

    /// A member who deposited nothing at all cannot take a share of someone
    /// else's deposit just by being in the group.
    function test_AMemberWhoDepositedNothingCanWithdrawNothing() public {
        uint256 id = _groupWith(alice, "office");

        vm.prank(alice);
        kumbara.deposit(id, address(cusd), 500e18);

        vm.prank(bob);
        kumbara.joinGroupPiggyBank(id);

        vm.prank(bob);
        vm.expectRevert("Yetersiz bakiye");
        kumbara.withdraw(id, address(cusd), 1);
    }

    /// Balances are per token as well as per user. Depositing cUSD must not
    /// create a USDC balance, which is the shape of bug that a single-token
    /// test suite would miss entirely.
    function test_BalancesDoNotLeakBetweenTokens() public {
        uint256 id = _groupWith(alice, "mixed");

        vm.prank(alice);
        kumbara.deposit(id, address(cusd), 200e18);

        assertEq(kumbara.getBalanceOf(id, alice, address(usdc)), 0);

        vm.prank(alice);
        vm.expectRevert("Yetersiz bakiye");
        kumbara.withdraw(id, address(usdc), 1);
    }

    /// Two piggy banks, same user, same token. A deposit into one must not be
    /// withdrawable from the other.
    function test_BalancesDoNotLeakBetweenPiggyBanks() public {
        uint256 first = _groupWith(alice, "holiday");
        uint256 second = _groupWith(alice, "emergency");

        vm.prank(alice);
        kumbara.deposit(first, address(cusd), 100e18);

        vm.prank(alice);
        vm.expectRevert("Yetersiz bakiye");
        kumbara.withdraw(second, address(cusd), 1);
    }

    // -----------------------------------------------------------------
    // Personal piggy banks
    // -----------------------------------------------------------------

    function test_OnlyTheOwnerCanDepositIntoAPersonalPiggyBank() public {
        vm.prank(alice);
        uint256 id = kumbara.createPersonalPiggyBank("mine");

        vm.prank(bob);
        vm.expectRevert("Bu kisisel kumbaraya sadece sahibi yatirabilir");
        kumbara.deposit(id, address(cusd), 10e18);
    }

    function test_NobodyCanJoinAPersonalPiggyBank() public {
        vm.prank(alice);
        uint256 id = kumbara.createPersonalPiggyBank("mine");

        vm.prank(bob);
        vm.expectRevert("Bu kisisel bir kumbara, katilamazsiniz");
        kumbara.joinGroupPiggyBank(id);
    }

    function test_CreatorIsAMemberImmediately() public {
        vm.prank(alice);
        uint256 id = kumbara.createPersonalPiggyBank("mine");

        assertTrue(kumbara.isMember(id, alice));
        assertEq(kumbara.getMemberCount(id), 1);
    }

    // -----------------------------------------------------------------
    // Membership
    // -----------------------------------------------------------------

    /// Depositing into a group joins you automatically. Doing it twice must not
    /// add you to the members array twice.
    function test_DepositingTwiceDoesNotDuplicateMembership() public {
        uint256 id = _groupWith(alice, "team");

        vm.startPrank(bob);
        kumbara.deposit(id, address(cusd), 10e18);
        kumbara.deposit(id, address(cusd), 10e18);
        vm.stopPrank();

        assertEq(kumbara.getMemberCount(id), 2);
        assertEq(kumbara.getBalanceOf(id, bob, address(cusd)), 20e18);
    }

    function test_CannotJoinTheSameGroupTwice() public {
        uint256 id = _groupWith(alice, "team");

        vm.prank(bob);
        kumbara.joinGroupPiggyBank(id);

        vm.prank(bob);
        vm.expectRevert("Zaten katilimcisiniz");
        kumbara.joinGroupPiggyBank(id);
    }

    // -----------------------------------------------------------------
    // Token and input validation
    // -----------------------------------------------------------------

    function test_RejectsAnUnsupportedToken() public {
        uint256 id = _groupWith(alice, "team");

        vm.prank(alice);
        vm.expectRevert("Sadece cUSD veya USDC kabul edilir");
        kumbara.deposit(id, address(stranger), 1e18);
    }

    function test_RejectsAPiggyBankThatDoesNotExist() public {
        vm.prank(alice);
        vm.expectRevert("Kumbara bulunamadi");
        kumbara.deposit(99, address(cusd), 1e18);
    }

    function test_RejectsZeroAmounts() public {
        uint256 id = _groupWith(alice, "team");

        vm.prank(alice);
        vm.expectRevert("Miktar sifirdan buyuk olmali");
        kumbara.deposit(id, address(cusd), 0);

        vm.prank(alice);
        vm.expectRevert("Miktar sifirdan buyuk olmali");
        kumbara.withdraw(id, address(cusd), 0);
    }

    function test_RejectsAnEmptyName() public {
        vm.prank(alice);
        vm.expectRevert("Isim bos olamaz");
        kumbara.createGroupPiggyBank("");
    }

    function test_ConstructorRejectsTheZeroAddress() public {
        vm.expectRevert("Gecersiz token adresi");
        new Kumbara(address(0), address(usdc));
    }

    // -----------------------------------------------------------------
    // Failure paths
    // -----------------------------------------------------------------

    /// A token that returns false rather than reverting must not credit a
    /// balance. Some tokens do exactly this.
    function test_AFailedDepositTransferCreditsNothing() public {
        uint256 id = _groupWith(alice, "team");
        cusd.setFailTransfers(true);

        vm.prank(alice);
        vm.expectRevert("Token transferi basarisiz");
        kumbara.deposit(id, address(cusd), 10e18);

        assertEq(kumbara.getBalanceOf(id, alice, address(cusd)), 0);
    }

    /// The whole withdraw reverts if the transfer fails, so the balance must
    /// still be there afterwards rather than having been debited into nothing.
    function test_AFailedWithdrawTransferLeavesTheBalanceIntact() public {
        uint256 id = _groupWith(alice, "team");

        vm.prank(alice);
        kumbara.deposit(id, address(cusd), 10e18);

        cusd.setFailTransfers(true);

        vm.prank(alice);
        vm.expectRevert("Token transferi basarisiz");
        kumbara.withdraw(id, address(cusd), 10e18);

        assertEq(kumbara.getBalanceOf(id, alice, address(cusd)), 10e18);
    }

    // -----------------------------------------------------------------
    // Accounting
    // -----------------------------------------------------------------

    /// totalDeposited is decremented on withdraw, so it tracks what is
    /// currently held rather than lifetime deposits. Worth pinning, because the
    /// name suggests the opposite and a future change could quietly flip it.
    function test_TotalDepositedTracksWhatIsHeldNotLifetimeDeposits() public {
        uint256 id = _groupWith(alice, "team");

        vm.prank(alice);
        kumbara.deposit(id, address(cusd), 100e18);
        vm.prank(bob);
        kumbara.deposit(id, address(cusd), 40e18);

        assertEq(kumbara.getTotalDeposited(id, address(cusd)), 140e18);

        vm.prank(alice);
        kumbara.withdraw(id, address(cusd), 60e18);

        assertEq(kumbara.getTotalDeposited(id, address(cusd)), 80e18);
    }

    function test_PartialWithdrawalsWork() public {
        uint256 id = _groupWith(alice, "team");

        vm.prank(alice);
        kumbara.deposit(id, address(cusd), 100e18);

        vm.startPrank(alice);
        kumbara.withdraw(id, address(cusd), 30e18);
        kumbara.withdraw(id, address(cusd), 20e18);
        vm.stopPrank();

        assertEq(kumbara.getBalanceOf(id, alice, address(cusd)), 50e18);
        assertEq(cusd.balanceOf(alice), 1000e18 - 50e18);
    }

    /// USDC on Celo has 6 decimals. The contract stores raw units, so the same
    /// nominal amount is a different number for each token.
    function test_HandlesSixDecimalUsdc() public {
        uint256 id = _groupWith(alice, "team");

        vm.prank(alice);
        kumbara.deposit(id, address(usdc), 25e6);

        assertEq(kumbara.getBalanceOf(id, alice, address(usdc)), 25e6);

        vm.prank(alice);
        kumbara.withdraw(id, address(usdc), 25e6);

        assertEq(usdc.balanceOf(alice), 1000e6);
    }

    /// However many people deposit and withdraw, the contract's token balance
    /// must equal the sum of what it says everyone is owed. If those ever drift
    /// apart, someone's money is unreachable or someone else's is spendable.
    function testFuzz_ContractBalanceAlwaysCoversWhatIsOwed(
        uint96 aliceIn,
        uint96 bobIn,
        uint96 aliceOut
    ) public {
        aliceIn = uint96(bound(aliceIn, 1, 1000e18));
        bobIn = uint96(bound(bobIn, 1, 1000e18));
        aliceOut = uint96(bound(aliceOut, 0, aliceIn));

        cusd.mint(alice, aliceIn);
        cusd.mint(bob, bobIn);

        uint256 id = _groupWith(alice, "fuzz");

        vm.prank(alice);
        kumbara.deposit(id, address(cusd), aliceIn);
        vm.prank(bob);
        kumbara.deposit(id, address(cusd), bobIn);

        if (aliceOut > 0) {
            vm.prank(alice);
            kumbara.withdraw(id, address(cusd), aliceOut);
        }

        uint256 owed =
            kumbara.getBalanceOf(id, alice, address(cusd)) +
            kumbara.getBalanceOf(id, bob, address(cusd));

        assertEq(cusd.balanceOf(address(kumbara)), owed);
        assertEq(kumbara.getTotalDeposited(id, address(cusd)), owed);
    }
}