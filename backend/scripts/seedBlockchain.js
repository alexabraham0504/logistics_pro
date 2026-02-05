const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import Models
const User = require('../src/models/User.model');
const Order = require('../src/models/Order.model');
const Shipment = require('../src/models/Shipment.model');
const Export = require('../src/models/Export.model');
const ExportBlockchain = require('../src/models/ExportBlockchain.model');
const PODToken = require('../src/models/PODToken.model');
const Driver = require('../src/models/Driver.model');
const DriverBlockchain = require('../src/models/DriverBlockchain.model');
const Vehicle = require('../src/models/Vehicle.model');

// Import Blockchain Service
const BlockchainService = require('../src/services/BlockchainService');
const CryptoUtil = require('../src/utils/CryptoUtil');

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/logistics_erp');
        console.log('✅ MongoDB Connected');
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err);
        process.exit(1);
    }
};

// Helper: Create Driver Block
async function LoggingBlock(driverId, tripId, eventType, eventData, previousHash, blockNumber) {
    const blockData = { driver: driverId, trip: tripId, eventType, eventData };
    const block = BlockchainService.createBlock(blockData, previousHash, blockNumber);

    await DriverBlockchain.create({
        driver: driverId,
        trip: tripId, // Should be ObjectId or null
        eventType,
        eventData: {
            timestamp: eventData.timestamp || new Date(),
            location: eventData.location,
            speed: eventData.speed,
            distance: eventData.distance,
            duration: eventData.duration,
            eventDetails: eventData
        },
        blockchainData: {
            hash: block.hash,
            previousHash: block.previousHash,
            blockNumber: block.blockNumber,
            timestamp: block.timestamp,
            nonce: block.nonce
        }
    });

    return block;
}

// Helper: Create Export Block
async function createExportBlock(exportId, eventType, eventData, previousHash, blockNumber) {
    const blockData = { export: exportId, eventType, eventData };
    const block = BlockchainService.createBlock(blockData, previousHash, blockNumber);

    await ExportBlockchain.create({
        export: exportId,
        eventType,
        eventData,
        blockchainData: {
            hash: block.hash,
            previousHash: block.previousHash,
            blockNumber: block.blockNumber,
            timestamp: block.timestamp,
            nonce: block.nonce
        }
    });

    return block;
}

const seedBlockchainData = async () => {
    await connectDB();

    try {
        console.log('🚀 Starting Blockchain Seed...');

        // Find admin user
        let admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            // Create fallback admin if missing
            admin = await User.create({
                firstName: 'Admin',
                lastName: 'User',
                email: 'admin@logistics.com',
                password: 'admin', // Will be hashed by pre-save
                role: 'admin'
            });
            console.log('Created fallback Admin user');
        }
        console.log(`👤 using admin: ${admin.email}`);

        // --- -1. CREATE DUMMY ORDER ---
        console.log('\n📦 Creating Mock Order...');
        let mockOrder = await Order.findOne();
        if (!mockOrder) {
            mockOrder = await Order.create({
                orderId: 'ORD-SEED-001',
                customer: admin._id,
                items: [{
                    product: new mongoose.Types.ObjectId(),
                    quantity: 10,
                    price: 100
                }],
                totalAmount: 1000,
                status: 'processing',
                shippingAddress: {
                    street: '123 Test St',
                    city: 'Bangalore',
                    state: 'KA',
                    zipCode: '560001',
                    country: 'India'
                },
                billingAddress: {
                    street: '123 Test St',
                    city: 'Bangalore',
                    state: 'KA',
                    zipCode: '560001',
                    country: 'India'
                },
                paymentInfo: {
                    method: 'credit_card',
                    status: 'paid',
                    transactionId: 'TXN-12345'
                }
            });
        }
        console.log(`✅ Using Mock Order: ${mockOrder._id}`);

        // --- 0. SEED SHIPMENTS for TRIPS ---
        console.log('\n📦 Creating Mock Shipments...');

        // Clear old test data
        // await Shipment.deleteMany({ 'trackingNumber': { $regex: /^TRIP-/ } });

        const tripShipments = [];
        for (let i = 0; i < 3; i++) {
            const shipment = await Shipment.create({
                trackingNumber: `TRIP-SEED-${Date.now()}-${i}`,
                order: mockOrder._id,
                sender: {
                    name: 'Seed Sender',
                    address: 'Warehouse A',
                    phone: '1234567890',
                    email: 'sender@seed.com'
                },
                receiver: {
                    name: 'Seed Receiver',
                    address: 'Shop B',
                    phone: '0987654321',
                    email: 'receiver@seed.com'
                },
                status: 'in_transit',
                senderId: admin._id // Just to have a valid ID
            });
            tripShipments.push(shipment);
        }
        console.log(`✅ Created ${tripShipments.length} mock shipments for trips`);


        // --- 1. SEED DRIVER MONITORING (BLACKBUG) ---
        console.log('\n🏎️  Seeding Driver Monitoring Data...');

        // Ensure clean driver state
        await Driver.deleteMany({ email: 'rajesh.k@logistics.com' });

        let driver = await Driver.create({
            firstName: 'Rajesh',
            lastName: 'Kumar',
            email: 'rajesh.k@logistics.com',
            phone: '+919876543210',
            license: {
                number: 'DL-1234567890123',
                type: 'HMV',
                expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            },
            status: 'available',
            employeeId: 'DRV-101'
        });
        console.log('Created/Reset sample driver');

        // Clear existing blockchain records for this driver
        await DriverBlockchain.deleteMany({ driver: driver._id });

        // Generate random trips and events
        let previousHash = '0';
        let blockNumber = 1;

        for (const shipment of tripShipments) {
            const tripId = shipment._id; // Use real ObjectId

            // Trip Start
            const startBlock = await LoggingBlock(driver._id, tripId, 'trip_start', { timestamp: new Date(Date.now() - 86400000) }, previousHash, blockNumber++);
            previousHash = startBlock.hash;

            // Random Harsh Events
            const events = ['harsh_braking', 'overspeeding', 'harsh_acceleration'];
            for (let i = 0; i < 3; i++) {
                const eventType = events[Math.floor(Math.random() * events.length)];
                const eventData = {
                    timestamp: new Date(Date.now() - 80000000 + (i * 1000000)),
                    speed: 80 + Math.random() * 40,
                    location: { lat: 28.7041 + Math.random(), lng: 77.1025 + Math.random() }
                };
                const eventBlock = await LoggingBlock(driver._id, tripId, eventType, eventData, previousHash, blockNumber++);
                previousHash = eventBlock.hash;
            }

            // Trip End
            const endBlock = await LoggingBlock(driver._id, tripId, 'trip_end', {
                timestamp: new Date(),
                distance: 150 + Math.random() * 300,
                duration: 4 + Math.random() * 5
            }, previousHash, blockNumber++);
            previousHash = endBlock.hash;
        }

        // Update Driver Stats
        driver.behaviorMonitoring = {
            tripCount: 15,
            totalDistance: 4520,
            harshBrakingEvents: 8,
            harshAccelerationEvents: 5,
            overspeedingInstances: 12,
            averageSpeed: 58,
            blockchainHash: previousHash,
            lastMonitoringUpdate: new Date()
        };
        driver.blockchainProfile = {
            blockchainRecordCount: blockNumber - 1,
            lastBlockHash: previousHash,
            updatedAt: new Date()
        };
        await driver.save();
        console.log(`✅ Driver ${driver.firstName} updated with ${blockNumber - 1} blockchain records`);


        // --- 2. SEED VEHICLE OWNERS (VAHAK) ---
        console.log('\n🚛 Seeding Vehicle Owner (Vahak) Data...');

        // Ensure clean vehicle state
        await Vehicle.deleteMany({ vehicleNumber: 'KA-01-HH-1234' });

        let vehicle = await Vehicle.create({
            vehicleNumber: 'KA-01-HH-1234',
            licensePlate: 'KA-01-HH-1234',
            type: 'truck',
            make: 'Tata',
            model: 'Prima',
            status: 'available'
        });

        const ownerData = {
            ownerName: 'Amit Singh Transport',
            ownerPhone: '+919988776655',
            ownerEmail: 'amit.transport@email.com',
            ownerAddress: { street: '123 Transport Nagar', city: 'Bangalore', state: 'Karnataka' },
            ownershipType: 'owned'
        };

        const ownerHash = CryptoUtil.sha256(ownerData);

        vehicle.vahakDetails = {
            ...ownerData,
            verificationStatus: 'verified',
            verifiedBy: admin._id,
            verifiedAt: new Date(Date.now() - 7 * 86400000),
            blockchainHash: ownerHash,
            ownerAadhar: 'ENCRYPTED_AADHAR_MOCK', // Mock encrypted
            ownerPAN: 'ENCRYPTED_PAN_MOCK'
        };

        vehicle.blockchainTracking = {
            vehicleHash: ownerHash,
            lastBlockUpdate: new Date(),
            blockchainRecordCount: 5
        };
        await vehicle.save();
        console.log(`✅ Vehicle ${vehicle.vehicleNumber} updated with Vahak details`);


        // --- 3. SEED EXPORTS ---
        console.log('\n📦 Seeding Export Data...');

        // Clear old Exports
        await Export.deleteMany({});
        await ExportBlockchain.deleteMany({});

        const exportScenarios = [
            { type: 'sea', status: 'in_transit', country: 'USA' },
            { type: 'air', status: 'customs_clearance', country: 'Germany' },
            { type: 'sea', status: 'preparing', country: 'Japan' },
            { type: 'land', status: 'delivered', country: 'Nepal' },
            { type: 'air', status: 'documentation_pending', country: 'UK' }
        ];

        for (const scenario of exportScenarios) {
            // Create Export Record
            const newExport = new Export({
                exportType: scenario.type,
                status: scenario.status,
                exportDetails: {
                    exporterName: 'Indian Spices Ltd',
                    importerName: `Global Importers ${scenario.country}`,
                    importerCountry: scenario.country,
                    productDescription: 'Premium Organic Spices',
                    value: 50000 + Math.random() * 100000,
                    currency: 'USD',
                },
                createdBy: admin._id,
                blockchainMetadata: { totalBlocks: 0 }
            });

            // Genesis Block
            let prevHash = '0';
            let blkNum = 1;

            const genesisBlock = await createExportBlock(newExport._id, 'export_created', {
                exportId: newExport.exportId,
                details: newExport.exportDetails
            }, prevHash, blkNum++);

            prevHash = genesisBlock.hash;

            // Document Upload Block
            const docBlock = await createExportBlock(newExport._id, 'document_upload', {
                documentType: 'commercial_invoice',
                hash: CryptoUtil.sha256('dummy-invoice-content')
            }, prevHash, blkNum++);

            newExport.documents.push({
                documentType: 'commercial_invoice',
                documentUrl: 'https://example.com/invoice.pdf',
                documentHash: docBlock.eventData.hash,
                isVerified: true,
                blockchainHash: docBlock.hash,
                uploadedBy: admin._id
            });
            prevHash = docBlock.hash;

            // Status Updates based on scenario
            if (scenario.status !== 'preparing') {
                const statusBlock = await createExportBlock(newExport._id, 'status_update', {
                    oldStatus: 'preparing',
                    newStatus: 'documentation_pending',
                    updatedBy: admin._id
                }, prevHash, blkNum++);
                prevHash = statusBlock.hash;
            }

            if (scenario.status === 'in_transit' || scenario.status === 'delivered') {
                // ... Add more blocks
            }

            // Update Export Metadata
            newExport.blockchainMetadata = {
                initialHash: genesisBlock.hash,
                currentHash: prevHash,
                totalBlocks: blkNum - 1,
                lastUpdated: new Date()
            };

            await newExport.save();
        }
        console.log(`✅ Created ${exportScenarios.length} exports with blockchain trace`);


        // --- 4. SEED POD TOKENS ---
        console.log('\n📝 Seeding POD Tokens...');

        await PODToken.deleteMany({});

        // Use the tripShipments we created + verify they are "delivered"
        for (const shipment of tripShipments) {
            const podTokenStr = `POD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const deliveryData = {
                timestamp: new Date(),
                receiverName: shipment.receiver.name,
                location: { lat: 12.97, lng: 77.59, address: shipment.receiver.address || 'Bangalore' },
                verificationMethod: 'signature'
            };

            // Create Block
            const blockData = { podToken: podTokenStr, shipment: shipment._id, deliveryData };
            const block = BlockchainService.createBlock(blockData, '0', 1);

            const pod = await PODToken.create({
                podToken: podTokenStr,
                shipment: shipment._id,
                deliveryData,
                blockchainData: {
                    hash: block.hash,
                    previousHash: block.previousHash,
                    blockNumber: block.blockNumber,
                    timestamp: block.timestamp,
                    nonce: block.nonce
                },
                verifiedBy: admin._id,
                isVerified: true,
                verificationUrl: `http://localhost:3000/verify-pod/${podTokenStr}`
            });

            // Update Shipment
            shipment.status = 'delivered';
            shipment.proofOfDelivery = {
                podToken: podTokenStr,
                blockchainHash: block.hash,
                deliveryTime: new Date()
            };
            await shipment.save();
        }
        console.log(`✅ Created ${tripShipments.length} POD tokens`);

        console.log('\n✨ Blockchain Seed Completed Successfully!');
        process.exit(0);

    } catch (err) {
        console.error('❌ Seed Error:', err);
        if (err.errors) {
            Object.keys(err.errors).forEach(key => {
                console.error(`Validation Error [${key}]:`, err.errors[key].message);
            });
        }
        process.exit(1);
    }
};

seedBlockchainData();
