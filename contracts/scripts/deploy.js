const hre = require("hardhat");

async function main() {
  console.log("Deploying TrustTraceAnchor smart contract...");
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const TrustTraceAnchor = await hre.ethers.getContractFactory("TrustTraceAnchor");
  const anchor = await TrustTraceAnchor.deploy();
  await anchor.waitForDeployment();

  const address = await anchor.getAddress();
  console.log("TrustTraceAnchor successfully deployed to:", address);

  return address;
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = main;
