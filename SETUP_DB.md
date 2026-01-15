# Database Setup Instructions

The Logistics ERP application requires a MongoDB database to store users, orders, and shipments. The error you are seeing (`buffering timed out`) indicates that the MongoDB server is not running on your machine.

## 1. Install MongoDB

If you haven't installed MongoDB yet, please download and install the **MongoDB Community Server** for Windows:

- [Download MongoDB Community Server](https://www.mongodb.com/try/download/community)
- During installation, check the box **"Install MongoDB as a Service"** (this is usually default).
- We also recommend installing **MongoDB Compass** (GUI) to view your data easily.

## 2. Verify Installation

After installation, open a new Command Prompt or PowerShell and run:

```bash
mongod --version
```

If this command works, MongoDB is installed.

## 3. Start MongoDB

If you installed it as a Service, it should start automatically. You can verify it's running by checking:
1. Press `Win + R` type `services.msc`
2. Look for "MongoDB Server"
3. Ensure Status is "Running"

If you installed it manually (`zip` version), you need to create a data folder (e.g., `C:\data\db`) and run:
`mongod --dbpath="c:\data\db"`

## 4. Run the Project Seed

Once the database is running, populate it with the sample data:

```bash
cd backend
npm run seed
```

You should see: `✅ Data imported successfully`

## 5. Start the App

Restart your backend server:

```bash
npm run dev
```

Your login should now work!
