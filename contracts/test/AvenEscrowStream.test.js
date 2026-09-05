const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("AvenEscrowStream Protocol", function () {
  let mockUSDC;
  let escrow;
  let owner, client, freelancer, bystander;

  const INITIAL_MINT = ethers.parseUnits("10000", 6); // 10,000 USDC
  const STREAM_BUDGET = ethers.parseUnits("1000", 6);  // 1,000 USDC
  const DURATION = 1000;                              // 1,000 seconds
  const CAP_PERCENT = 75;                             // 75%
  const EXTERNAL_AGR_ID = ethers.keccak256(ethers.toUtf8Bytes("agr_freelance_001"));

  beforeEach(async function () {
    [owner, client, freelancer, bystander] = await ethers.getSigners();

    // 1. Deploy MockUSDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDC.deploy();
    await mockUSDC.waitForDeployment();

    // 2. Deploy AvenEscrowStream
    const AvenEscrowStream = await ethers.getContractFactory("AvenEscrowStream");
    escrow = await AvenEscrowStream.deploy();
    await escrow.waitForDeployment();

    // 3. Fund Client with 10,000 USDC
    await mockUSDC.mint(client.address, INITIAL_MINT);

    // 4. Client approves Escrow Vault to spend USDC
    await mockUSDC.connect(client).approve(await escrow.getAddress(), ethers.MaxUint256);
  });

  describe("1. Deployment & Token Setup", function () {
    it("should deploy MockUSDC with 6 decimals", async function () {
      expect(await mockUSDC.decimals()).to.equal(6);
      expect(await mockUSDC.balanceOf(client.address)).to.equal(INITIAL_MINT);
    });

    it("should set deployer as owner", async function () {
      expect(await escrow.owner()).to.equal(owner.address);
    });
  });

  describe("2. Stream Creation & Input Validation", function () {
    it("should create and fund stream with correct parameters and emit event", async function () {
      const escrowAddr = await escrow.getAddress();
      const clientBalanceBefore = await mockUSDC.balanceOf(client.address);

      const tx = await escrow.connect(client).createAndFundStream(
        freelancer.address,
        await mockUSDC.getAddress(),
        STREAM_BUDGET,
        DURATION,
        CAP_PERCENT,
        EXTERNAL_AGR_ID
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "StreamCreated"
      );
      expect(event).to.not.be.undefined;

      const streamId = event.args[0];
      const stream = await escrow.streams(streamId);

      expect(stream.client).to.equal(client.address);
      expect(stream.freelancer).to.equal(freelancer.address);
      expect(stream.budget).to.equal(STREAM_BUDGET);
      expect(stream.durationSeconds).to.equal(DURATION);
      expect(stream.withdrawableCapPercent).to.equal(CAP_PERCENT);
      expect(stream.status).to.equal(1); // IN_PROGRESS

      // Verify tokens locked in escrow
      expect(await mockUSDC.balanceOf(escrowAddr)).to.equal(STREAM_BUDGET);
      expect(await mockUSDC.balanceOf(client.address)).to.equal(clientBalanceBefore - STREAM_BUDGET);
    });

    it("should reject stream creation with invalid parameters", async function () {
      const usdcAddr = await mockUSDC.getAddress();

      // Zero address freelancer
      await expect(
        escrow.connect(client).createAndFundStream(ethers.ZeroAddress, usdcAddr, STREAM_BUDGET, DURATION, CAP_PERCENT, EXTERNAL_AGR_ID)
      ).to.be.revertedWith("Invalid freelancer address");

      // Self freelancer
      await expect(
        escrow.connect(client).createAndFundStream(client.address, usdcAddr, STREAM_BUDGET, DURATION, CAP_PERCENT, EXTERNAL_AGR_ID)
      ).to.be.revertedWith("Invalid freelancer address");

      // 0 budget
      await expect(
        escrow.connect(client).createAndFundStream(freelancer.address, usdcAddr, 0, DURATION, CAP_PERCENT, EXTERNAL_AGR_ID)
      ).to.be.revertedWith("Budget must be greater than zero");

      // Duration < 60s
      await expect(
        escrow.connect(client).createAndFundStream(freelancer.address, usdcAddr, STREAM_BUDGET, 30, CAP_PERCENT, EXTERNAL_AGR_ID)
      ).to.be.revertedWith("Duration must be at least 60 seconds");

      // Cap > 100%
      await expect(
        escrow.connect(client).createAndFundStream(freelancer.address, usdcAddr, STREAM_BUDGET, DURATION, 105, EXTERNAL_AGR_ID)
      ).to.be.revertedWith("Cap must be 1-100%");
    });
  });

  describe("3. Linear Flow Math & 75% Safety Cap", function () {
    let streamId;

    beforeEach(async function () {
      const tx = await escrow.connect(client).createAndFundStream(
        freelancer.address,
        await mockUSDC.getAddress(),
        STREAM_BUDGET,
        DURATION,
        CAP_PERCENT,
        EXTERNAL_AGR_ID
      );
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "StreamCreated"
      );
      streamId = event.args[0];
    });

    it("should accurately stream funds linearly at 25% and 50% elapsed time", async function () {
      // Fast forward 250s (25% of 1000s duration)
      await time.increase(250);

      const earned25 = await escrow.computeEarned(streamId);
      // Expected: ~250 USDC (with 6 decimals = 250,000,000)
      const expected25 = ethers.parseUnits("250", 6);
      expect(earned25).to.be.closeTo(expected25, ethers.parseUnits("2", 6));

      // Fast forward another 250s (total 500s = 50%)
      await time.increase(250);
      const earned50 = await escrow.computeEarned(streamId);
      const expected50 = ethers.parseUnits("500", 6);
      expect(earned50).to.be.closeTo(expected50, ethers.parseUnits("2", 6));
    });

    it("should enforce the 75% safety cap while stream is IN_PROGRESS", async function () {
      // Fast forward 900s (90% of duration)
      await time.increase(900);

      const earned = await escrow.computeEarned(streamId);
      expect(earned).to.be.closeTo(ethers.parseUnits("900", 6), ethers.parseUnits("2", 6));

      // Available to claim MUST be capped at 75% = 750 USDC
      const available = await escrow.computeAvailable(streamId);
      const expectedCapped = ethers.parseUnits("750", 6); // 75% of 1000
      expect(available).to.be.closeTo(expectedCapped, ethers.parseUnits("2", 6));

      // Worker claims all available
      await escrow.connect(freelancer).claimStream(streamId, 0);

      const freelancerBalance = await mockUSDC.balanceOf(freelancer.address);
      expect(freelancerBalance).to.be.closeTo(expectedCapped, ethers.parseUnits("2", 6));

      // Now available must be 0
      expect(await escrow.computeAvailable(streamId)).to.equal(0);
    });
  });

  describe("4. Pause and Resume Earning Clock", function () {
    let streamId;

    beforeEach(async function () {
      const tx = await escrow.connect(client).createAndFundStream(
        freelancer.address,
        await mockUSDC.getAddress(),
        STREAM_BUDGET,
        DURATION,
        CAP_PERCENT,
        EXTERNAL_AGR_ID
      );
      const receipt = await tx.wait();
      streamId = receipt.logs.find((l) => l.fragment?.name === "StreamCreated").args[0];
    });

    it("should freeze accrual during pause interval and resume accurately", async function () {
      // 1. Work for 200s
      await time.increase(200);
      const earnedBeforePause = await escrow.computeEarned(streamId);

      // 2. Client pauses stream
      await escrow.connect(client).pauseStream(streamId);

      // 3. Fast forward 500s while paused
      await time.increase(500);

      // 4. Earned MUST NOT change while paused
      const earnedDuringPause = await escrow.computeEarned(streamId);
      expect(earnedDuringPause).to.be.closeTo(earnedBeforePause, ethers.parseUnits("2", 6));

      // 5. Client resumes stream
      await escrow.connect(client).resumeStream(streamId);

      // 6. Work for another 100s
      await time.increase(100);

      // Total active time should be ~300s (not 800s)
      const earnedAfterResume = await escrow.computeEarned(streamId);
      expect(earnedAfterResume).to.be.closeTo(ethers.parseUnits("300", 6), ethers.parseUnits("3", 6));
    });
  });

  describe("5. Work Submission & 100% Release upon Approval", function () {
    let streamId;

    beforeEach(async function () {
      const tx = await escrow.connect(client).createAndFundStream(
        freelancer.address,
        await mockUSDC.getAddress(),
        STREAM_BUDGET,
        DURATION,
        CAP_PERCENT,
        EXTERNAL_AGR_ID
      );
      const receipt = await tx.wait();
      streamId = receipt.logs.find((l) => l.fragment?.name === "StreamCreated").args[0];
    });

    it("should allow freelancer to submit deliverable report and client to approve 100% payout", async function () {
      await time.increase(500); // 50% time

      // Freelancer partially claims 300 USDC
      await escrow.connect(freelancer).claimStream(streamId, ethers.parseUnits("300", 6));

      // Freelancer submits deliverable report hash
      const reportHash = ethers.keccak256(ethers.toUtf8Bytes("ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG"));
      await escrow.connect(freelancer).submitWork(streamId, reportHash);

      const streamSub = await escrow.streams(streamId);
      expect(streamSub.status).to.equal(3); // SUBMITTED
      expect(streamSub.reportHash).to.equal(reportHash);

      // Client approves work
      await escrow.connect(client).approveAndRelease(streamId);

      const streamComp = await escrow.streams(streamId);
      expect(streamComp.status).to.equal(4); // COMPLETED

      // Total received by freelancer must equal 100% of budget (1,000 USDC)
      const finalFreelancerBalance = await mockUSDC.balanceOf(freelancer.address);
      expect(finalFreelancerBalance).to.equal(STREAM_BUDGET);
    });
  });

  describe("6. Strict Cancellation Settlement with Prior Partial Claim (Crucial Invariant)", function () {
    it("should correctly settle cancelStream after partial withdrawal with zero dust and exact split", async function () {
      const tx = await escrow.connect(client).createAndFundStream(
        freelancer.address,
        await mockUSDC.getAddress(),
        STREAM_BUDGET, // 1000 USDC
        DURATION,      // 1000 sec
        CAP_PERCENT,
        EXTERNAL_AGR_ID
      );
      const receipt = await tx.wait();
      const streamId = receipt.logs.find((l) => l.fragment?.name === "StreamCreated").args[0];

      // 1. Advance to 400 seconds (40% earned = 400 USDC)
      await time.increase(400);

      // 2. Freelancer withdraws 200 USDC (partial claim)
      const partialClaim = ethers.parseUnits("200", 6);
      await escrow.connect(freelancer).claimStream(streamId, partialClaim);

      expect(await mockUSDC.balanceOf(freelancer.address)).to.equal(partialClaim);

      // 3. Advance to 600 seconds (60% earned = 600 USDC)
      await time.increase(200);

      const clientBalBeforeCancel = await mockUSDC.balanceOf(client.address);

      // 4. Client cancels stream
      const cancelTx = await escrow.connect(client).cancelStream(streamId);
      const cancelReceipt = await cancelTx.wait();
      const cancelEvent = cancelReceipt.logs.find((l) => l.fragment?.name === "StreamCancelled");
      expect(cancelEvent).to.not.be.undefined;

      const unearnedRefund = cancelEvent.args[1];
      const unwithdrawnPayout = cancelEvent.args[2];

      // Mathematical Invariants:
      // totalBudget (1000) = alreadyWithdrawn (200) + unwithdrawnPayout (~400) + unearnedRefund (~400)
      const totalSettled = partialClaim + unwithdrawnPayout + unearnedRefund;
      expect(totalSettled).to.be.closeTo(STREAM_BUDGET, ethers.parseUnits("2", 6));

      // Client refund should be ~400 USDC (the 40% unearned duration)
      expect(unearnedRefund).to.be.closeTo(ethers.parseUnits("400", 6), ethers.parseUnits("2", 6));

      // Freelancer total balance should be ~600 USDC (60% earned)
      const freelancerTotal = await mockUSDC.balanceOf(freelancer.address);
      expect(freelancerTotal).to.be.closeTo(ethers.parseUnits("600", 6), ethers.parseUnits("2", 6));

      // Escrow contract balance must now be 0
      expect(await mockUSDC.balanceOf(await escrow.getAddress())).to.equal(0);
    });
  });

  describe("7. Dispute Resolution", function () {
    let streamId;

    beforeEach(async function () {
      const tx = await escrow.connect(client).createAndFundStream(
        freelancer.address,
        await mockUSDC.getAddress(),
        STREAM_BUDGET,
        DURATION,
        CAP_PERCENT,
        EXTERNAL_AGR_ID
      );
      const receipt = await tx.wait();
      streamId = receipt.logs.find((l) => l.fragment?.name === "StreamCreated").args[0];
    });

    it("should freeze withdrawals on dispute and allow arbiter resolution", async function () {
      await time.increase(500);

      // Freelancer raises dispute
      await escrow.connect(freelancer).disputeStream(streamId);
      const stream = await escrow.streams(streamId);
      expect(stream.status).to.equal(6); // DISPUTED

      // Claims must be rejected while disputed
      await expect(
        escrow.connect(freelancer).claimStream(streamId, 0)
      ).to.be.revertedWith("Cannot claim in current stream status");

      // Owner resolves dispute: 400 USDC to freelancer, 600 USDC refund to client
      const payout = ethers.parseUnits("400", 6);
      const refund = ethers.parseUnits("600", 6);

      await escrow.connect(owner).resolveDispute(streamId, refund, payout);

      const streamResolved = await escrow.streams(streamId);
      expect(streamResolved.status).to.equal(4); // COMPLETED
    });
  });

  describe("8. Reentrancy Protection Security Test", function () {
    it("should block reentrant calls during token transfers", async function () {
      // 1. Deploy ReentrantMaliciousToken
      const ReentrantMaliciousToken = await ethers.getContractFactory("ReentrantMaliciousToken");
      const badToken = await ReentrantMaliciousToken.deploy();
      await badToken.waitForDeployment();

      // 2. Fund client with bad token & approve escrow
      const attackBudget = ethers.parseUnits("1000", 18);
      await badToken.transfer(client.address, attackBudget);
      await badToken.connect(client).approve(await escrow.getAddress(), attackBudget);

      // 3. Create stream with bad token
      const tx = await escrow.connect(client).createAndFundStream(
        freelancer.address,
        await badToken.getAddress(),
        attackBudget,
        DURATION,
        CAP_PERCENT,
        EXTERNAL_AGR_ID
      );
      const receipt = await tx.wait();
      const attackStreamId = receipt.logs.find((l) => l.fragment?.name === "StreamCreated").args[0];

      // 4. Arm attack on the bad token
      await badToken.setAttackTarget(await escrow.getAddress(), attackStreamId);

      // 5. Advance time and claim
      await time.increase(500);

      await escrow.connect(freelancer).claimStream(attackStreamId, ethers.parseUnits("100", 18));

      // Verify that attack was attempted but failed due to ReentrancyGuard
      expect(await badToken.attackAttempted()).to.be.true;
      expect(await badToken.attackSucceeded()).to.be.false;
    });
  });
});
