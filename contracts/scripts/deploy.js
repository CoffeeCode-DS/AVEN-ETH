const hre = require("hardhat");

async function main() {
  const networkName = hre.network.name;
  const signers = await hre.ethers.getSigners();
  if (!signers || signers.length === 0) {
    console.error("=================================================");
    console.error("❌ ERROR: No deployer account configured!");
    console.error("=================================================");
    console.error(`To deploy to ${networkName}, you must provide your private key.`);
    console.error("1. Open contracts/.env");
    console.error("2. Set: PRIVATE_KEY=0xYourPrivateKeyHere");
    console.error("3. Ensure your wallet has Base Sepolia testnet ETH.");
    console.error("=================================================");
    process.exit(1);
  }
  const deployer = signers[0];

  console.log("=================================================");
  console.log("🚀 AVEN-ETH Protocol Smart Contract Deployment");
  console.log("=================================================");
  console.log(`Deploying from account : ${deployer.address}`);
  console.log(`Target Network         : ${networkName}`);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Account Native Balance : ${hre.ethers.formatEther(balance)} ETH\n`);

  if (networkName !== "hardhat" && networkName !== "localhost" && balance === 0n) {
    console.error("❌ ERROR: Deployer balance is 0 ETH!");
    console.error("Please fund your wallet with Base Sepolia testnet ETH from a faucet before deploying.");
    console.error("Faucets:");
    console.error("1. https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet");
    console.error("2. https://superchain.faucets.cblockchain.org/");
    console.error("3. https://cloud.google.com/application/web3/faucet/ethereum/sepolia");
    process.exit(1);
  }

  // 1. Deploy MockUSDC
  console.log("1. Deploying MockUSDC Token...");
  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy();
  await mockUSDC.waitForDeployment();
  const usdcAddress = await mockUSDC.getAddress();
  console.log(`   ✓ MockUSDC deployed at: ${usdcAddress}`);

  // 2. Deploy AvenEscrowStream Core Vault
  console.log("\n2. Deploying AvenEscrowStream Core Vault...");
  const AvenEscrowStream = await hre.ethers.getContractFactory("AvenEscrowStream");
  const escrow = await AvenEscrowStream.deploy();
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log(`   ✓ AvenEscrowStream deployed at: ${escrowAddress}`);

  // 3. Verification on Block Explorer (for Live Testnets)
  if (networkName !== "hardhat" && networkName !== "localhost") {
    console.log("\n⏳ Waiting for 5 block confirmations for explorer indexing...");
    const deployTx = escrow.deploymentTransaction();
    if (deployTx) {
      await deployTx.wait(5);
    }

    console.log("\n🔍 Verifying MockUSDC on Basescan...");
    try {
      await hre.run("verify:verify", {
        address: usdcAddress,
        constructorArguments: [],
      });
      console.log("   ✓ MockUSDC verified!");
    } catch (err) {
      console.log(`   ⚠ MockUSDC verification notice: ${err.message}`);
    }

    console.log("\n🔍 Verifying AvenEscrowStream on Basescan...");
    try {
      await hre.run("verify:verify", {
        address: escrowAddress,
        constructorArguments: [],
      });
      console.log("   ✓ AvenEscrowStream verified!");
    } catch (err) {
      console.log(`   ⚠ AvenEscrowStream verification notice: ${err.message}`);
    }
  }

  console.log("\n=================================================");
  console.log("🎉 Deployment & Verification Complete!");
  console.log("=================================================");
  console.log(`MockUSDC Address        : ${usdcAddress}`);
  console.log(`AvenEscrowStream Address: ${escrowAddress}`);
  if (networkName === "baseSepolia") {
    console.log("-------------------------------------------------");
    console.log(`Basescan MockUSDC        : https://sepolia.basescan.org/address/${usdcAddress}#code`);
    console.log(`Basescan AvenEscrowStream: https://sepolia.basescan.org/address/${escrowAddress}#code`);
  }
  console.log("=================================================");
  console.log("\nNext Steps:");
  console.log("1. Save these addresses in your frontend / backend config");
  console.log("2. Open the Basescan link to see the verified green checkmark on your contract code!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
