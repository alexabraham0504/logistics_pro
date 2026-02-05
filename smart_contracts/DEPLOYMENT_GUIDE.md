# 🚀 Smart Contract Deployment Guide

This workspace is set up to deploy to **Polygon Amoy Testnet** (for production/public access) and **Localhost** (for dev).

## 1. Prerequisites (For Amoy)
You need **Testnet MATIC (POL)** tokens in your deployer wallet.

*   **Wallet Address**: `0x19371C13938213208D613a2D300D8E35659223cC` (Saved in `.env`)
*   **Check Balance**: Run `npm run check-balance` (configured in scripts) or `node scripts/checkBalance.js`
*   **Get Funds**:
    *   [Polygon Portal Faucet](https://faucet.polygon.technology/)
    *   [Alchemy Faucet](https://www.alchemy.com/faucets/polygon-amoy)
    *   [QuickNode Faucet](https://faucet.quicknode.com/polygon/amoy)

## 2. How to Deploy

### Option A: Local Deployment (Default)
Fast, free, works on your machine only.
```bash
npm run deploy:local
```

### Option B: Polygon Amoy (Public)
Requires funds. Visible on public block explorers.
```bash
npm run deploy:amoy
```

## 3. After Deployment (Important!)
After deploying to Amoy, the terminal will show a NEW Contract Address (e.g., `0x123...abc`).

1.  **Copy that Address**.
2.  Update your **Backend** environment variables:
    *   Open `d:\logistics_project\backend\.env` (or create it).
    *   Add/Update:
        ```ini
        SMART_CONTRACT_ADDRESS=0x123...abc
        BLOCKCHAIN_RPC_URL=https://rpc-amoy.polygon.technology/
        ```
3.  **Restart Backend**: `npm run dev`

Your app is now live on the blockchain! 🌍
