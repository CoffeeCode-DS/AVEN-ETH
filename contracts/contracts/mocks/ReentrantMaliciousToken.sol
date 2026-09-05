// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../AvenEscrowStream.sol";

/**
 * @title ReentrantMaliciousToken
 * @notice An ERC-20 token that attempts to re-enter AvenEscrowStream during transfer
 *         to verify that ReentrancyGuard successfully reverts the transaction.
 */
contract ReentrantMaliciousToken is ERC20 {
    AvenEscrowStream public targetEscrow;
    bytes32 public targetStreamId;
    bool public attackEnabled;
    bool public attackAttempted;
    bool public attackSucceeded;

    constructor() ERC20("Malicious Token", "BAD") {
        _mint(msg.sender, 1_000_000 * 10 ** 18);
    }

    function setAttackTarget(address _targetEscrow, bytes32 _streamId) external {
        targetEscrow = AvenEscrowStream(_targetEscrow);
        targetStreamId = _streamId;
        attackEnabled = true;
    }

    function transfer(address to, uint256 amount) public override returns (bool) {
        if (attackEnabled && address(targetEscrow) != address(0)) {
            attackEnabled = false; // prevent infinite loop
            attackAttempted = true;
            // Attempt to re-enter claimStream
            try targetEscrow.claimStream(targetStreamId, 1) {
                attackSucceeded = true;
            } catch {
                attackSucceeded = false;
            }
        }
        return super.transfer(to, amount);
    }
}
