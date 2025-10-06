const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Generate test accounts for different user roles
 */
async function main() {
  console.log("🔐 Generating Test Accounts for ZRA OCR Verification System\n");

  // Get signers from Hardhat network (pre-funded accounts)
  const signers = await ethers.getSigners();

  const roles = [
    { name: "ZRA Officer", index: 0, description: "Primary verification officer" },
    { name: "Auditor", index: 1, description: "System auditor with read access" },
    { name: "Developer", index: 2, description: "Development and testing account" },
    { name: "Admin", index: 3, description: "System administrator" },
    { name: "Test User 1", index: 4, description: "General test user" },
    { name: "Test User 2", index: 5, description: "General test user" }
  ];

  console.log("📋 Generated Accounts:\n");
  console.log("=" .repeat(80));

  const envContent = [];
  envContent.push("# Auto-generated Test Accounts");
  envContent.push("# Generated at: " + new Date().toISOString());
  envContent.push("");
  envContent.push("# Network Configuration");
  envContent.push("GANACHE_URL=http://127.0.0.1:8545");
  envContent.push("HARDHAT_NETWORK=localhost");
  envContent.push("");

  for (const role of roles) {
    const signer = signers[role.index];
    const address = await signer.getAddress();
    const balance = await ethers.provider.getBalance(address);
    const balanceInEth = ethers.formatEther(balance);

    console.log(`${role.name}:`);
    console.log(`  Address: ${address}`);
    console.log(`  Balance: ${balanceInEth} ETH`);
    console.log(`  Description: ${role.description}`);
    console.log();

    // Add to env file
    const envKey = role.name.toUpperCase().replace(/ /g, "_") + "_ADDRESS";
    envContent.push(`# ${role.name} - ${role.description}`);
    envContent.push(`${envKey}=${address}`);
    envContent.push("");
  }

  console.log("=" .repeat(80));

  // Write to .env file
  const envPath = path.join(__dirname, "..", ".env");
  fs.writeFileSync(envPath, envContent.join("\n"));

  console.log("\n✅ Accounts saved to .env file");
  console.log("\n💡 Usage:");
  console.log("   - These accounts are pre-funded with 10,000 ETH each");
  console.log("   - Use them for testing smart contract interactions");
  console.log("   - Addresses are stored in .env for easy access");

  // Create accounts summary JSON
  const accountsSummary = roles.map((role, i) => ({
    role: role.name,
    address: signers[role.index].address,
    description: role.description
  }));

  const summaryPath = path.join(__dirname, "..", "test-accounts.json");
  fs.writeFileSync(summaryPath, JSON.stringify(accountsSummary, null, 2));
  console.log(`   - Accounts summary saved to: test-accounts.json\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
