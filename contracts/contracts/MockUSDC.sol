// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDC
 * @notice Standard 6-decimal ERC-20 token mimicking Circle USD Coin (USDC)
 *         used for testing and local development of AVEN-ETH escrow streaming.
 */
contract MockUSDC is ERC20 {
    uint8 private constant DECIMALS = 6;

    constructor() ERC20("Mock USD Coin", "mUSDC") {
        // Mint initial 1,000,000 mUSDC to deployer
        _mint(msg.sender, 1_000_000 * 10 ** DECIMALS);
    }

    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    /**
     * @notice Open mint function for tests and local simulation faucets
     * @param to Recipient address
     * @param amount Amount to mint in token units (with 6 decimals)
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
