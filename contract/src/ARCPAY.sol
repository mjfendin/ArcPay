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
