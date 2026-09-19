# ARCPAY — Contract Verification (Arc Mainnet)

## Deployed Contract
- **Contract:** ARCPAY (ERC-20 payment token)
- **Address:** `0x843a74dFEB8a3f1D550e20E96F62bdb0A242de94`
- **Deployer:** `0x86764B1B8b6FBBB9E5bD379EFEE76Cf6cf7b0368`
- **Tx hash:** `0x895370b34b00178763ef7709f92c2baa816a28df18d69800add9df7a822e5991`
- **Chain:** Arc Mainnet (chain ID 5042)

## Constructor Args (ABI-encoded)
```
0x0000000000000000000000000000000000000000033b2e3c9fd0803ce8000000
```
(initialSupply = 1,000,000,000 * 10^18)

## Compiler Settings
- Solidity: `v0.8.26+commit.8a97fa7a`
- Optimization: enabled, runs 200
- EVM version: `cancun`
- License: MIT

## How to verify (2 minutes)
1. Open https://explorer.arc.io/contract-verification
2. Fill:
   - Contract address: `0x843a74dFEB8a3f1D550e20E96F62bdb0A242de94`
   - License: MIT
   - Method: Solidity (Single file)
   - Compiler: v0.8.26
   - EVM: cancun
   - Optimization: enabled, runs 200
3. Paste source code below into the code box
4. Click "Verify & publish"

## Source Code (flattened)
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/**
 * @title ARCPAY
 * @notice Payment token for the ArcPay ecosystem on Arc.
 * @dev Standard ERC-20 with a fixed supply minted to the deployer.
 *      Deployed on Arc Mainnet (chain ID 5042) where USDC is native gas.
 */
contract ARCPAY {
    string public constant name = "ARCPAY";
    string public constant symbol = "ARCPAY";
    uint8 public constant decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(uint256 initialSupply_) {
        totalSupply = initialSupply_;
        balanceOf[msg.sender] = initialSupply_;
        emit Transfer(address(0), msg.sender, initialSupply_);
    }

    function transfer(address to, uint256 value) external returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        require(allowed >= value, "ARCPAY: allowance exceeded");
        if (allowed != type(uint256).max) {
            allowance[from][msg.sender] = allowed - value;
        }
        _transfer(from, to, value);
        return true;
    }

    function _transfer(address from, address to, uint256 value) internal {
        require(to != address(0), "ARCPAY: transfer to zero");
        require(balanceOf[from] >= value, "ARCPAY: balance exceeded");
        balanceOf[from] -= value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
    }
}
```
