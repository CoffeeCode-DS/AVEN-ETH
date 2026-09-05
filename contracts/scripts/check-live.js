const hre = require("hardhat");

async function main() {
  const usdcAddress = "0xf922026C1810BF93C5a31e35B87ee4dc9Bc8f651";
  const escrowAddress = "0x5Cfa2C922C1C1Fd42ba7570306a7D83e630dC6F9";

  console.log("Connecting to Base Sepolia...");
  const mockUSDC = await hre.ethers.getContractAt("MockUSDC", usdcAddress);
  const escrow = await hre.ethers.getContractAt("AvenEscrowStream", escrowAddress);

  const name = await mockUSDC.name();
  const symbol = await mockUSDC.symbol();
  const decimals = await mockUSDC.decimals();
  const totalSupply = await mockUSDC.totalSupply();

  const owner = await escrow.owner();
  const totalStreams = await escrow.totalStreams();

  console.log("=================================================");
  console.log("✅ LIVE CONTRACT STATUS ON BASE SEPOLIA (CHAIN ID: 84532)");
  console.log("=================================================");
  console.log(`MockUSDC Name        : ${name}`);
  console.log(`MockUSDC Symbol      : ${symbol}`);
  console.log(`MockUSDC Decimals    : ${decimals}`);
  console.log(`MockUSDC TotalSupply : ${hre.ethers.formatUnits(totalSupply, decimals)} ${symbol}`);
  console.log("-------------------------------------------------");
  console.log(`Escrow Vault Address : ${escrowAddress}`);
  console.log(`Escrow Vault Owner   : ${owner}`);
  console.log(`Total Streams On-Chain: ${totalStreams.toString()}`);
  console.log("=================================================");
}

main().catch(console.error);
