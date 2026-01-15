const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User.model');
const Order = require('../models/Order.model');
const Shipment = require('../models/Shipment.model');
const Warehouse = require('../models/Warehouse.model');
const Inventory = require('../models/Inventory.model');
const Vehicle = require('../models/Vehicle.model');
const Driver = require('../models/Driver.model');
const Invoice = require('../models/Invoice.model');

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/logistics_erp');
        console.log('📦 Connected to MongoDB');

        // Clear existing data
        await Promise.all([
            User.deleteMany({}),
            Order.deleteMany({}),
            Shipment.deleteMany({}),
            Warehouse.deleteMany({}),
            Inventory.deleteMany({}),
            Vehicle.deleteMany({}),
            Driver.deleteMany({}),
            Invoice.deleteMany({})
        ]);
        console.log('🗑️  Cleared existing data');

        // Create Users (Indian Context)
        const users = await User.create([
            { firstName: 'Amit', lastName: 'Verma', email: 'admin@logistics.com', password: 'admin123', role: 'admin', phone: '+91-9876543210', company: 'Bharat Logistics' },
            { firstName: 'Rahul', lastName: 'Mehta', email: 'viewer@logistics.com', password: 'viewer123', role: 'viewer', phone: '+91-9876543211', company: 'Bharat Logistics' },
            { firstName: 'Priya', lastName: 'Sharma', email: 'customer@client.com', password: 'customer123', role: 'customer', phone: '+91-9876543212', company: 'Reliance Retail' },
            { firstName: 'Sneha', lastName: 'Patel', email: 'sneha@client.com', password: 'customer123', role: 'customer', phone: '+91-9876543213', company: 'Tata Croma' }
        ]);
        console.log('👥 Created users');

        // Create Warehouses (Indian Cities)
        const warehouses = await Warehouse.create([
            { name: 'Bhiwandi Distribution Center', code: 'WH-MUM-01', type: 'distribution_center', address: { street: 'Building No. 5, Logistics Park, Bhiwandi', city: 'Mumbai', state: 'Maharashtra', zipCode: '421302', country: 'India' }, capacity: { total: 10000, used: 6500, unit: 'pallets' }, status: 'active' },
            { name: 'Gurgaon Regional Hub', code: 'WH-DEL-01', type: 'regional_hub', address: { street: 'Plot 12, Udyog Vihar Phase IV', city: 'Gurugram', state: 'Haryana', zipCode: '122015', country: 'India' }, capacity: { total: 8000, used: 5200, unit: 'pallets' }, status: 'active' },
            { name: 'Whitefield Cold Storage', code: 'WH-BLR-01', type: 'cold_storage', address: { street: 'Graphite India Road, Whitefield', city: 'Bengaluru', state: 'Karnataka', zipCode: '560066', country: 'India' }, capacity: { total: 3000, used: 1800, unit: 'pallets' }, status: 'active' },
            { name: 'Sriperumbudur Warehouse', code: 'WH-CHE-01', type: 'distribution_center', address: { street: 'NH4 Chennai-Bangalore Highway', city: 'Chennai', state: 'Tamil Nadu', zipCode: '602105', country: 'India' }, capacity: { total: 5000, used: 2000, unit: 'pallets' }, status: 'active' }
        ]);
        console.log('🏭 Created warehouses');

        // Create Vehicles (Indian Makes)
        const vehicles = await Vehicle.create([
            { vehicleNumber: 'MH-04-AB-1234', type: 'truck', make: 'Tata Motors', model: 'Prima 5530', year: 2022, licensePlate: 'MH-04-AB-1234', status: 'available', capacity: { weight: { value: 25000, unit: 'kg' }, pallets: 30 }, fuelType: 'diesel' },
            { vehicleNumber: 'DL-1C-XY-5678', type: 'van', make: 'Mahindra', model: 'Bolero Camper', year: 2023, licensePlate: 'DL-1C-XY-5678', status: 'in_transit', capacity: { weight: { value: 1500, unit: 'kg' }, pallets: 2 }, fuelType: 'diesel' },
            { vehicleNumber: 'KA-01-CD-9012', type: 'refrigerated', make: 'Ashok Leyland', model: 'Ecomet Star', year: 2021, licensePlate: 'KA-01-CD-9012', status: 'available', capacity: { weight: { value: 10000, unit: 'kg' }, pallets: 12 }, fuelType: 'diesel', features: { hasRefrigeration: true } },
            { vehicleNumber: 'TN-02-EF-3456', type: 'truck', make: 'Eicher', model: 'Pro 3015', year: 2023, licensePlate: 'TN-02-EF-3456', status: 'maintenance', capacity: { weight: { value: 12000, unit: 'kg' }, pallets: 15 }, fuelType: 'diesel' }
        ]);
        console.log('🚛 Created vehicles');

        // Create Drivers (Indian Names)
        const drivers = await Driver.create([
            { employeeId: 'DRV-1001', firstName: 'Vikram', lastName: 'Singh', phone: '+91-9988776655', status: 'available', license: { number: 'MH12 20180001234', type: 'HMV', expiryDate: new Date('2027-06-15') }, performance: { rating: 4.8, totalDeliveries: 450, onTimeRate: 97 } },
            { employeeId: 'DRV-1002', firstName: 'Mohammed', lastName: 'Ali', phone: '+91-9988776656', status: 'on_duty', license: { number: 'DL04 20190005678', type: 'LMV', expiryDate: new Date('2026-12-20') }, performance: { rating: 4.6, totalDeliveries: 312, onTimeRate: 94 } },
            { employeeId: 'DRV-1003', firstName: 'Suresh', lastName: 'Gowda', phone: '+91-9988776657', status: 'available', license: { number: 'KA01 20170009012', type: 'HMV', expiryDate: new Date('2028-03-10') }, performance: { rating: 4.9, totalDeliveries: 520, onTimeRate: 99 } }
        ]);
        console.log('👷 Created drivers');

        // Create Inventory (Indian Pricing)
        await Inventory.create([
            { sku: 'ELEC-LAP-001', name: 'Dell Latitude 3420', category: 'Electronics', warehouse: warehouses[0]._id, quantity: { onHand: 100, reserved: 10, available: 90 }, unitCost: 42000, unitPrice: 48000, reorderPoint: 20 },
            { sku: 'ELEC-ACC-002', name: 'Logitech Wireless Mouse', category: 'Electronics', warehouse: warehouses[0]._id, quantity: { onHand: 500, reserved: 50, available: 450 }, unitCost: 650, unitPrice: 950, reorderPoint: 100 },
            { sku: 'FURN-CHR-001', name: 'Godrej Office Chair', category: 'Furniture', warehouse: warehouses[1]._id, quantity: { onHand: 150, reserved: 20, available: 130 }, unitCost: 3500, unitPrice: 5500, reorderPoint: 30 },
            { sku: 'FOOD-FRZ-001', name: 'McCain Fries Pack', category: 'Food', warehouse: warehouses[2]._id, quantity: { onHand: 1000, reserved: 100, available: 900 }, unitCost: 150, unitPrice: 220, reorderPoint: 200, expiryDate: new Date('2026-03-01') },
            { sku: 'AUTO-OIL-001', name: 'Castrol Engine Oil (5L)', category: 'Automotive', warehouse: warehouses[3]._id, quantity: { onHand: 300, reserved: 0, available: 300 }, unitCost: 1800, unitPrice: 2400, reorderPoint: 50 }
        ]);
        console.log('📦 Created inventory items');

        // Create Orders
        const orders = await Order.create([
            { orderNumber: 'ORD-2601-5001', customer: users[2]._id, status: 'delivered', priority: 'high', items: [{ productName: 'Dell Latitude 3420', sku: 'ELEC-LAP-001', quantity: 5, unitPrice: 48000 }], totalAmount: 240000, destination: { name: 'Reliance Corporate Park', address: 'Ghansoli, Thane Belapur Road', city: 'Navi Mumbai', state: 'Maharashtra', zipCode: '400701', country: 'India' }, estimatedDeliveryDate: new Date('2026-01-10'), actualDeliveryDate: new Date('2026-01-09'), slaCompliance: 'met', warehouse: warehouses[0]._id },
            { orderNumber: 'ORD-2601-5002', customer: users[3]._id, status: 'in_transit', priority: 'medium', items: [{ productName: 'Godrej Office Chair', sku: 'FURN-CHR-001', quantity: 10, unitPrice: 5500 }], totalAmount: 55000, destination: { name: 'Croma Store South Ext', address: 'G-5, South Extension I', city: 'New Delhi', state: 'Delhi', zipCode: '110049', country: 'India' }, estimatedDeliveryDate: new Date('2026-01-20'), warehouse: warehouses[1]._id },
            { orderNumber: 'ORD-2601-5003', customer: users[2]._id, status: 'pending', priority: 'low', items: [{ productName: 'Logitech Wireless Mouse', sku: 'ELEC-ACC-002', quantity: 50, unitPrice: 950 }], totalAmount: 47500, destination: { name: 'Reliance Smart Point', address: 'Koramangala, 5th Block', city: 'Bengaluru', state: 'Karnataka', zipCode: '560095', country: 'India' }, estimatedDeliveryDate: new Date('2026-01-25'), warehouse: warehouses[0]._id }
        ]);
        console.log('📋 Created orders');

        // Create Shipments
        const shipments = await Shipment.create([
            { trackingNumber: 'SHP-MUM-00123', order: orders[0]._id, status: 'delivered', carrier: { name: 'BlueDart', code: 'BD' }, vehicle: vehicles[0]._id, driver: drivers[0]._id, origin: { address: 'Logistics Park, Bhiwandi', city: 'Mumbai', state: 'Maharashtra' }, destination: { address: 'Ghansoli, Navi Mumbai', city: 'Mumbai', state: 'Maharashtra' }, estimatedDelivery: new Date('2026-01-10'), actualDelivery: new Date('2026-01-09'), trackingHistory: [{ status: 'pending', description: 'Shipment created' }, { status: 'picked_up', description: 'Picked up from Bhiwandi Hub' }, { status: 'in_transit', description: 'In transit - Thane Checkpost' }, { status: 'delivered', description: 'Delivered to Reliance CP' }] },
            { trackingNumber: 'SHP-DEL-00456', order: orders[1]._id, status: 'in_transit', carrier: { name: 'Rivigo', code: 'RV' }, vehicle: vehicles[1]._id, driver: drivers[1]._id, origin: { address: 'Plot 12, Udyog Vihar', city: 'Gurugram', state: 'Haryana' }, destination: { address: 'South Extension I', city: 'New Delhi', state: 'Delhi' }, estimatedDelivery: new Date('2026-01-20'), currentLocation: { city: 'Mahipalpur', state: 'Delhi' }, delayInfo: { isDelayed: true, reason: 'High traffic congestion' }, trackingHistory: [{ status: 'pending', description: 'Shipment created' }, { status: 'picked_up', description: 'Picked up from Gurgaon Hub' }, { status: 'in_transit', description: 'In transit - NH48' }] }
        ]);
        console.log('🚚 Created shipments');

        // Update orders with shipment references
        orders[0].shipment = shipments[0]._id;
        orders[1].shipment = shipments[1]._id;
        await orders[0].save();
        await orders[1].save();

        // Create Invoices
        await Invoice.create([
            { invoiceNumber: 'INV-2026-001', order: orders[0]._id, customer: users[2]._id, shipment: shipments[0]._id, status: 'paid', issueDate: new Date('2026-01-05'), dueDate: new Date('2026-02-05'), items: [{ description: 'Dell Latitude 3420 x5', quantity: 5, unitPrice: 48000, amount: 240000 }], subtotal: 240000, shippingCost: 2500, totalAmount: 242500, amountPaid: 242500, amountDue: 0, payments: [{ amount: 242500, method: 'upi', date: new Date('2026-01-08') }], paidAt: new Date('2026-01-08'), createdBy: users[0]._id },
            { invoiceNumber: 'INV-2026-002', order: orders[1]._id, customer: users[3]._id, shipment: shipments[1]._id, status: 'sent', issueDate: new Date('2026-01-12'), dueDate: new Date('2026-02-12'), items: [{ description: 'Godrej Office Chair x10', quantity: 10, unitPrice: 5500, amount: 55000 }], subtotal: 55000, shippingCost: 1200, totalAmount: 56200, amountPaid: 0, amountDue: 56200, createdBy: users[0]._id }
        ]);
        console.log('💰 Created invoices');

        console.log('\n✅ Seed data created successfully (Indian Context)!\n');
        console.log('📧 Login Credentials:');
        console.log('   Admin:    admin@logistics.com / admin123 (Amit Verma)');
        console.log('   Viewer:   viewer@logistics.com / viewer123 (Rahul Mehta)');
        console.log('   Customer: customer@client.com / customer123 (Priya Sharma)');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed error:', error);
        process.exit(1);
    }
};

seedData();
