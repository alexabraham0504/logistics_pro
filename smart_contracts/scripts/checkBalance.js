const ethers = require("ethers");
require("dotenv").config();

async function main() {
    // connect to Amoy
    const provider = new ethers.JsonRpcProvider(process.env.AMOY_RPC_URL || "https://rpc-amoy.polygon.technology/");

    try {
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        console.log(`Checking balance for: ${wallet.address}`);

        const balance = await provider.getBalance(wallet.address);
        const ethBalance = ethers.formatEther(balance);

        console.log(`Balance: ${ethBalance} POL`);

        if (balance > 0) {
            console.log("✅ Wallet has funds!");
        } else {
            console.log("❌ Wallet is empty.");
        }
    } catch (e) {
        console.error("Connection Error:", e.message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
