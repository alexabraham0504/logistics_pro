const ethers = require("ethers");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🔐 Generating new random wallet...");
    const wallet = ethers.Wallet.createRandom();

    console.log("✅ Wallet Created!");
    console.log("----------------------------------------------------");
    console.log(`Address:     ${wallet.address}`);
    console.log(`Private Key: ${wallet.privateKey}`);
    console.log("----------------------------------------------------");
    console.log("⚠️  SAVE THIS PRIVATE KEY SECURELY. DO NOT SHARE IT.");

    const envPath = path.join(__dirname, "../.env");
    const envContent = `PRIVATE_KEY=${wallet.privateKey}\nAMOY_RPC_URL=https://rpc-amoy.polygon.technology/\n`;

    // specific to our project, we also need this for the backend service later
    // but for now let's just create the smart contract one
    fs.writeFileSync(envPath, envContent);
    console.log(`\n📄 Saved to ${envPath}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
