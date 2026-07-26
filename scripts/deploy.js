const { ethers, network } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("╔═══════════════════════════════════════╗");
  console.log("║   HoodRain — Deployment Script        ║");
  console.log("╚═══════════════════════════════════════╝");
  console.log(`Network:   ${network.name} (chainId: ${network.config.chainId})`);
  console.log(`Deployer:  ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Balance:   ${ethers.formatEther(balance)} ETH\n`);

  const feeRecipient = process.env.FEE_RECIPIENT || deployer.address;
  console.log(`Fee recipient: ${feeRecipient}`);

  const HoodRain = await ethers.getContractFactory("HoodRain");
  const hoodRain = await HoodRain.deploy(feeRecipient);
  await hoodRain.waitForDeployment();

  const address = await hoodRain.getAddress();
  console.log(`\n✅ HoodRain deployed at: ${address}`);

  console.log(`\nNext steps:`);
  console.log(`  Verify: npx hardhat verify --network ${network.name} ${address} "${feeRecipient}"`);
  console.log(`  Update VITE_CONTRACT_ADDRESS=${address} in frontend .env`);

  require("fs").writeFileSync(
    "./deployments.json",
    JSON.stringify({
      network: network.name,
      chainId: network.config.chainId,
      address,
      feeRecipient,
      deployedAt: new Date().toISOString()
    }, null, 2)
  );
}

main().catch((err) => { console.error(err); process.exitCode = 1; });
