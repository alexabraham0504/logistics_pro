const hre = require("hardhat");

async function main() {
    const LogisticsTracker = await hre.ethers.getContractFactory("LogisticsTracker");
    const tracker = await LogisticsTracker.deploy();

    await tracker.waitForDeployment();

    console.log(
        `LogisticsTracker deployed to ${tracker.target}`
    );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
