const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User.model');
const Export = require('../src/models/Export.model');
const Shipment = require('../src/models/Shipment.model'); // Ensure Shipment model is loaded if referenced, though we might not need to create one if we make it optional or dummy.

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/logistics_erp');
        console.log('✅ MongoDB Connected');
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err);
        process.exit(1);
    }
};

const createOneExport = async () => {
    await connectDB();

    try {
        // 1. Get or Create Admin User
        let admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            admin = await User.create({
                firstName: 'Demo',
                lastName: 'Admin',
                email: 'admin@logistics.com',
                password: 'password123',
                role: 'admin'
            });
            console.log('Created Admin User');
        }

        // 2. Create Export
        // Note: shipment field is optional in schema?
        // Let's check schema.. field 'shipment' is type ObjectId, ref Shipment. Not required explicitly?
        // Schema: shipment: { type: ..., index: true }. No 'required: true'.

        const newExport = await Export.create({
            exportId: `EXP-TEST-${Date.now()}`,
            exportType: 'sea',
            status: 'preparing',
            exportDetails: {
                exporterName: 'Demo Exporter Ltd',
                importerName: 'Global Trade Inc',
                importerCountry: 'USA',
                productDescription: 'Electronics',
                quantity: 100,
                unit: 'pcs',
                value: 5000,
                currency: 'USD'
            },
            createdBy: admin._id,
            blockchainMetadata: {
                totalBlocks: 0
            }
        });

        console.log(`✅ Created Export: ${newExport.exportId}`);
        process.exit(0);

    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
};

createOneExport();
