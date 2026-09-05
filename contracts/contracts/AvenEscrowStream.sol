// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AvenEscrowStream
 * @notice Production-grade decentralized continuous payment escrow vault.
 *         Allows clients to fund freelance agreements with linear, per-second
 *         micro-payment streaming, safety withdrawable caps, and cryptographic
 *         work deliverable proofs.
 */
contract AvenEscrowStream is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    enum StreamStatus {
        PENDING_FUNDING, // Drafted, awaiting funding
        IN_PROGRESS,     // Active streaming
        PAUSED,          // Accrual clock temporarily halted
        SUBMITTED,       // Work submitted by freelancer with cryptographic report hash
        COMPLETED,       // Approved by client; 100% funds settled
        CANCELLED,       // Cancelled with atomic split of unearned & earned
        DISPUTED         // Payouts frozen pending arbitration
    }

    struct Stream {
        bytes32 id;
        bytes32 externalAgreementId;    // Web2 ID binding (e.g. keccak256("agr_xxx"))
        address client;
        address freelancer;
        IERC20 token;
        uint256 budget;                 // Total escrow deposit in token units
        uint256 ratePerSecond;          // Scaled flow rate: (budget * 1e18) / durationSeconds
        uint256 durationSeconds;        // Planned duration of work stream
        uint256 startedAt;              // Timestamp when streaming began
        uint256 pausedAt;               // Timestamp when stream was paused (0 if not paused)
        uint256 totalPausedSeconds;     // Accumulated pause duration
        uint256 totalWithdrawn;         // Tokens already claimed by freelancer
        uint256 withdrawableCapPercent; // Max % freelancer can withdraw while in progress (default 75)
        bytes32 reportHash;             // Cryptographic IPFS CID or Git Merkle root digest
        StreamStatus status;
    }

    uint256 private _streamNonce;
    mapping(bytes32 => Stream) public streams;
    bytes32[] public allStreamIds;

    // Events for indexing (The Graph / Viem / Web3 frontends)
    event StreamCreated(
        bytes32 indexed streamId,
        bytes32 indexed externalAgreementId,
        address indexed client,
        address freelancer,
        address token,
        uint256 budget,
        uint256 ratePerSecond,
        uint256 durationSeconds,
        uint256 withdrawableCapPercent
    );

    event StreamClaimed(
        bytes32 indexed streamId,
        address indexed freelancer,
        uint256 amountClaimed,
        uint256 totalWithdrawn
    );

    event StreamPaused(bytes32 indexed streamId, uint256 pausedAt);
    event StreamResumed(bytes32 indexed streamId, uint256 resumedAt, uint256 totalPausedSeconds);
    event WorkSubmitted(bytes32 indexed streamId, bytes32 indexed reportHash);
    event RevisionRequested(bytes32 indexed streamId);
    event StreamApproved(bytes32 indexed streamId, uint256 finalPayout);
    event StreamCancelled(bytes32 indexed streamId, uint256 unearnedRefund, uint256 unwithdrawnPayout);
    event DisputeRaised(bytes32 indexed streamId, address indexed raisedBy);
    event DisputeResolved(bytes32 indexed streamId, uint256 clientRefund, uint256 freelancerPayout);

    modifier onlyClient(bytes32 streamId) {
        require(streams[streamId].client == msg.sender, "Caller is not stream client");
        _;
    }

    modifier onlyFreelancer(bytes32 streamId) {
        require(streams[streamId].freelancer == msg.sender, "Caller is not stream freelancer");
        _;
    }

    modifier streamExists(bytes32 streamId) {
        require(streams[streamId].client != address(0), "Stream does not exist");
        _;
    }

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Creates and immediately funds an escrow payment stream from the client.
     * @param freelancer Address of the contributor / freelancer
     * @param token ERC-20 token address (e.g. USDC)
     * @param budget Total tokens to fund in escrow
     * @param durationSeconds Planned duration of the stream (seconds)
     * @param withdrawableCapPercent Safety withdrawal limit while IN_PROGRESS (e.g. 75 for 75%)
     * @param externalAgreementId Web2 agreement hash to bind with off-chain system
     * @return streamId Unique deterministic on-chain identifier for the stream
     */
    function createAndFundStream(
        address freelancer,
        address token,
        uint256 budget,
        uint256 durationSeconds,
        uint256 withdrawableCapPercent,
        bytes32 externalAgreementId
    ) external nonReentrant returns (bytes32 streamId) {
        require(freelancer != address(0) && freelancer != msg.sender, "Invalid freelancer address");
        require(token != address(0), "Invalid token address");
        require(budget > 0, "Budget must be greater than zero");
        require(durationSeconds >= 60, "Duration must be at least 60 seconds");
        require(withdrawableCapPercent > 0 && withdrawableCapPercent <= 100, "Cap must be 1-100%");

        // Pull tokens from client into this escrow contract
        IERC20(token).safeTransferFrom(msg.sender, address(this), budget);

        // Scaled rate per second with 1e18 precision multiplier to prevent integer truncation
        uint256 ratePerSecond = (budget * 1e18) / durationSeconds;

        _streamNonce++;
        streamId = keccak256(
            abi.encodePacked(
                msg.sender,
                freelancer,
                token,
                budget,
                externalAgreementId,
                _streamNonce,
                block.timestamp
            )
        );

        Stream storage s = streams[streamId];
        s.id = streamId;
        s.externalAgreementId = externalAgreementId;
        s.client = msg.sender;
        s.freelancer = freelancer;
        s.token = IERC20(token);
        s.budget = budget;
        s.ratePerSecond = ratePerSecond;
        s.durationSeconds = durationSeconds;
        s.startedAt = block.timestamp;
        s.pausedAt = 0;
        s.totalPausedSeconds = 0;
        s.totalWithdrawn = 0;
        s.withdrawableCapPercent = withdrawableCapPercent;
        s.reportHash = bytes32(0);
        s.status = StreamStatus.IN_PROGRESS;

        allStreamIds.push(streamId);

        emit StreamCreated(
            streamId,
            externalAgreementId,
            msg.sender,
            freelancer,
            token,
            budget,
            ratePerSecond,
            durationSeconds,
            withdrawableCapPercent
        );
    }

    /**
     * @notice Computes total active elapsed seconds for an agreement.
     */
    function computeActiveSeconds(bytes32 streamId) public view streamExists(streamId) returns (uint256) {
        Stream storage s = streams[streamId];
        if (s.startedAt == 0) return 0;

        uint256 currentReferenceTime = s.status == StreamStatus.PAUSED ? s.pausedAt : block.timestamp;
        if (currentReferenceTime <= s.startedAt + s.totalPausedSeconds) return 0;

        return currentReferenceTime - s.startedAt - s.totalPausedSeconds;
    }

    /**
     * @notice Computes total tokens earned by freelancer up to current block.
     */
    function computeEarned(bytes32 streamId) public view streamExists(streamId) returns (uint256) {
        Stream storage s = streams[streamId];

        if (s.status == StreamStatus.COMPLETED) {
            return s.budget;
        }

        uint256 activeSeconds = computeActiveSeconds(streamId);
        uint256 rawEarned = (activeSeconds * s.ratePerSecond) / 1e18;

        return rawEarned > s.budget ? s.budget : rawEarned;
    }

    /**
     * @notice Computes amount currently available for the freelancer to claim.
     *         Respects the withdrawable safety cap while the stream is active or in review.
     */
    function computeAvailable(bytes32 streamId) public view streamExists(streamId) returns (uint256) {
        Stream storage s = streams[streamId];

        if (s.status == StreamStatus.CANCELLED || s.status == StreamStatus.DISPUTED) {
            return 0;
        }

        uint256 earned = computeEarned(streamId);

        // While active, uncompleted, or in review: enforce safety withdrawal cap
        if (s.status == StreamStatus.IN_PROGRESS || s.status == StreamStatus.PAUSED || s.status == StreamStatus.SUBMITTED) {
            uint256 maxAllowed = (s.budget * s.withdrawableCapPercent) / 100;
            uint256 cappedEarned = earned < maxAllowed ? earned : maxAllowed;
            if (cappedEarned <= s.totalWithdrawn) {
                return 0;
            }
            return cappedEarned - s.totalWithdrawn;
        }

        // When approved and completed: 100% budget unlocked
        if (s.status == StreamStatus.COMPLETED) {
            if (s.budget <= s.totalWithdrawn) {
                return 0;
            }
            return s.budget - s.totalWithdrawn;
        }

        return 0;
    }

    /**
     * @notice Freelancer claims accrued stream earnings.
     * @param streamId Identifier of the stream
     * @param amount Requested withdrawal amount (pass 0 to withdraw full available balance)
     */
    function claimStream(bytes32 streamId, uint256 amount)
        external
        streamExists(streamId)
        onlyFreelancer(streamId)
        nonReentrant
    {
        Stream storage s = streams[streamId];
        require(
            s.status == StreamStatus.IN_PROGRESS ||
            s.status == StreamStatus.PAUSED ||
            s.status == StreamStatus.SUBMITTED ||
            s.status == StreamStatus.COMPLETED,
            "Cannot claim in current stream status"
        );

        uint256 available = computeAvailable(streamId);
        require(available > 0, "No claimable earnings available");

        uint256 amountToWithdraw = amount == 0 ? available : amount;
        require(amountToWithdraw <= available, "Requested amount exceeds available balance");

        s.totalWithdrawn += amountToWithdraw;

        s.token.safeTransfer(s.freelancer, amountToWithdraw);

        emit StreamClaimed(streamId, s.freelancer, amountToWithdraw, s.totalWithdrawn);
    }

    /**
     * @notice Client pauses active stream, freezing the earning accrual clock.
     */
    function pauseStream(bytes32 streamId)
        external
        streamExists(streamId)
        onlyClient(streamId)
    {
        Stream storage s = streams[streamId];
        require(s.status == StreamStatus.IN_PROGRESS, "Only in-progress stream can be paused");

        s.status = StreamStatus.PAUSED;
        s.pausedAt = block.timestamp;

        emit StreamPaused(streamId, block.timestamp);
    }

    /**
     * @notice Client resumes a paused stream, restarting the earning clock.
     */
    function resumeStream(bytes32 streamId)
        external
        streamExists(streamId)
        onlyClient(streamId)
    {
        Stream storage s = streams[streamId];
        require(s.status == StreamStatus.PAUSED, "Only paused stream can be resumed");

        uint256 pausedDuration = block.timestamp - s.pausedAt;
        s.totalPausedSeconds += pausedDuration;
        s.pausedAt = 0;
        s.status = StreamStatus.IN_PROGRESS;

        emit StreamResumed(streamId, block.timestamp, s.totalPausedSeconds);
    }

    /**
     * @notice Freelancer submits work deliverables with a cryptographic report hash (IPFS CID or Git Merkle digest).
     */
    function submitWork(bytes32 streamId, bytes32 reportHash)
        external
        streamExists(streamId)
        onlyFreelancer(streamId)
    {
        Stream storage s = streams[streamId];
        require(
            s.status == StreamStatus.IN_PROGRESS || s.status == StreamStatus.PAUSED,
            "Cannot submit work in current stream status"
        );
        require(reportHash != bytes32(0), "Invalid report hash");

        if (s.status == StreamStatus.PAUSED) {
            uint256 pausedDuration = block.timestamp - s.pausedAt;
            s.totalPausedSeconds += pausedDuration;
            s.pausedAt = 0;
        }

        s.status = StreamStatus.SUBMITTED;
        s.reportHash = reportHash;

        emit WorkSubmitted(streamId, reportHash);
    }

    /**
     * @notice Client requests revisions on submitted work, returning stream to IN_PROGRESS.
     */
    function requestRevision(bytes32 streamId)
        external
        streamExists(streamId)
        onlyClient(streamId)
    {
        Stream storage s = streams[streamId];
        require(s.status == StreamStatus.SUBMITTED, "Work is not currently submitted for review");

        s.status = StreamStatus.IN_PROGRESS;

        emit RevisionRequested(streamId);
    }

    /**
     * @notice Client approves submitted work, unlocking 100% of remaining escrow balance.
     */
    function approveAndRelease(bytes32 streamId)
        external
        streamExists(streamId)
        onlyClient(streamId)
        nonReentrant
    {
        Stream storage s = streams[streamId];
        require(
            s.status == StreamStatus.SUBMITTED || s.status == StreamStatus.IN_PROGRESS,
            "Cannot approve in current status"
        );

        s.status = StreamStatus.COMPLETED;

        uint256 remainingPayout = s.budget > s.totalWithdrawn ? s.budget - s.totalWithdrawn : 0;
        s.totalWithdrawn = s.budget;

        if (remainingPayout > 0) {
            s.token.safeTransfer(s.freelancer, remainingPayout);
        }

        emit StreamApproved(streamId, remainingPayout);
    }

    /**
     * @notice Client cancels stream mid-way with atomic settlement.
     *         Invariant: alreadyWithdrawn + unwithdrawnEarned + unearnedRefund == budget.
     */
    function cancelStream(bytes32 streamId)
        external
        streamExists(streamId)
        onlyClient(streamId)
        nonReentrant
    {
        Stream storage s = streams[streamId];
        require(
            s.status != StreamStatus.COMPLETED && s.status != StreamStatus.CANCELLED,
            "Stream is already finalized"
        );

        uint256 earned = computeEarned(streamId);

        // Strictly verify prior partial claims invariant
        uint256 unwithdrawnEarned = earned > s.totalWithdrawn ? earned - s.totalWithdrawn : 0;
        uint256 unearnedRefund = s.budget > earned ? s.budget - earned : 0;

        s.status = StreamStatus.CANCELLED;
        s.totalWithdrawn += unwithdrawnEarned;

        // Payout remaining accrued earnings to worker
        if (unwithdrawnEarned > 0) {
            s.token.safeTransfer(s.freelancer, unwithdrawnEarned);
        }

        // Refund unearned portion back to client
        if (unearnedRefund > 0) {
            s.token.safeTransfer(s.client, unearnedRefund);
        }

        emit StreamCancelled(streamId, unearnedRefund, unwithdrawnEarned);
    }

    /**
     * @notice Freezes stream and halts all withdrawals during a dispute.
     */
    function disputeStream(bytes32 streamId)
        external
        streamExists(streamId)
    {
        Stream storage s = streams[streamId];
        require(msg.sender == s.client || msg.sender == s.freelancer, "Not an agreement participant");
        require(
            s.status == StreamStatus.IN_PROGRESS ||
            s.status == StreamStatus.PAUSED ||
            s.status == StreamStatus.SUBMITTED,
            "Cannot dispute finalized stream"
        );

        s.status = StreamStatus.DISPUTED;

        emit DisputeRaised(streamId, msg.sender);
    }

    /**
     * @notice Contract owner / designated arbiter resolves a disputed stream.
     * @param streamId Stream to resolve
     * @param clientRefund Refund amount to client
     * @param freelancerPayout Settlement amount to freelancer
     */
    function resolveDispute(bytes32 streamId, uint256 clientRefund, uint256 freelancerPayout)
        external
        streamExists(streamId)
        onlyOwner
        nonReentrant
    {
        Stream storage s = streams[streamId];
        require(s.status == StreamStatus.DISPUTED, "Stream is not under dispute");

        uint256 remainingEscrow = s.budget > s.totalWithdrawn ? s.budget - s.totalWithdrawn : 0;
        require(clientRefund + freelancerPayout == remainingEscrow, "Resolution amounts must equal remaining escrow");

        s.status = StreamStatus.COMPLETED;
        s.totalWithdrawn += freelancerPayout;

        if (freelancerPayout > 0) {
            s.token.safeTransfer(s.freelancer, freelancerPayout);
        }
        if (clientRefund > 0) {
            s.token.safeTransfer(s.client, clientRefund);
        }

        emit DisputeResolved(streamId, clientRefund, freelancerPayout);
    }

    /**
     * @notice Returns total number of streams ever created.
     */
    function totalStreams() external view returns (uint256) {
        return allStreamIds.length;
    }
}
