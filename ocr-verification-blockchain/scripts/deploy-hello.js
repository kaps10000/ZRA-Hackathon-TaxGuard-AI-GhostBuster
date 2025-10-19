const { ethers } = require("hardhat");

/**
 * Deploy HelloBlockchain contract to verify setup
 */
async function main() {
  console.log("🚀 Deploying HelloBlockchain Contract...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  // Deploy the contract
  const HelloBlockchain = await ethers.getContractFactory("HelloBlockchain");
  const initialMessage = "ZRA OCR Verification System - Blockchain is Live! ✅";

  console.log("⏳ Deploying contract...");
  const contract = await HelloBlockchain.deploy(initialMessage);

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("✅ Contract deployed successfully!");
  console.log("📍 Contract address:", contractAddress);
  console.log();

  // Verify deployment by calling contract methods
  console.log("🔍 Verifying deployment...\n");

  const message = await contract.getMessage();
  const owner = await contract.owner();
  const deploymentTime = await contract.deploymentTime();

  console.log("Contract Info:");
  console.log("  - Message:", message);
  console.log("  - Owner:", owner);
  console.log("  - Deployed at:", new Date(Number(deploymentTime) * 1000).toLocaleString());
  console.log();

  // Test updating the message
  console.log("🧪 Testing message update...");
  const tx = await contract.setMessage("Blockchain verification successful!");
  await tx.wait();

  const newMessage = await contract.getMessage();
  console.log("  - Updated message:", newMessage);
  console.log();

  console.log("=" .repeat(80));
  console.log("✨ Deployment Summary:");
  console.log("=" .repeat(80));
  console.log(`Contract Name: HelloBlockchain`);
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Network: ${network.name}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Gas Used: ${(await tx.wait()).gasUsed.toString()}`);
  console.log("=" .repeat(80));
  console.log();
  console.log("🎉 Blockchain environment setup complete!");
  console.log("💡 Next steps:");
  console.log("   1. Create DocumentVerification smart contract");
  console.log("   2. Implement proof storage and verification logic");
  console.log("   3. Set up integration with backend API");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
