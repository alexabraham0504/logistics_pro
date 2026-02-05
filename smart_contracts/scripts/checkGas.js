const { ethers } = require('ethers');
const rpc = "https://rpc-amoy.polygon.technology/";

async function check() {
    const provider = new ethers.JsonRpcProvider(rpc);
    const feeData = await provider.getFeeData();
    console.log("Gas Price:", ethers.formatUnits(feeData.gasPrice, "gwei"), "gwei");
    console.log("Max Fee Per Gas:", ethers.formatUnits(feeData.maxFeePerGas, "gwei"), "gwei");
}

check();
