const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const orderRoutes = require('./routes/order.routes');
const shipmentRoutes = require('./routes/shipment.routes');
const warehouseRoutes = require('./routes/warehouse.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const fleetRoutes = require('./routes/fleet.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const reportRoutes = require('./routes/report.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const aiRoutes = require('./routes/ai.routes');

const app = express();
// Enable trust proxy for Render deployment to fix rate limiting
app.set('trust proxy', 1);
const httpServer = createServer(app);

// Parse allowed origins
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : [process.env.FRONTEND_URL || 'http://localhost:3000'];

// Socket.io setup for real-time tracking
const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Make io accessible in routes
app.set('io', io);

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// CORS configuration
// CORS configuration - handle preflight properly
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Allow any Vercel, Render, or Localhost origin dynamically
        if (origin.includes('localhost') || origin.includes('.onrender.com') || origin.includes('.vercel.app')) {
            return callback(null, true);
        }

        if (allowedOrigins.indexOf(origin) === -1) {
            console.warn('Blocked by CORS:', origin);
            // Temporarily allow all for debugging if needed, but keeping it safe-ish above
            return callback(new Error('The CORS policy for this site does not allow access from the specific Origin.'), false);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Handle preflight requests explicitly
app.options('*', cors());

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/logistics_erp')
    .then(() => console.log('✅ MongoDB Connected Successfully'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/fleet', fleetRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Logistics ERP API is running',
        timestamp: new Date().toISOString()
    });
});

// Socket.io connection handling for real-time tracking
io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);

    socket.on('joinShipmentRoom', (shipmentId) => {
        socket.join(`shipment_${shipmentId}`);
        console.log(`📦 Client joined shipment room: ${shipmentId}`);
    });

    socket.on('leaveShipmentRoom', (shipmentId) => {
        socket.leave(`shipment_${shipmentId}`);
    });

    socket.on('joinFleetRoom', (vehicleId) => {
        socket.join(`fleet_${vehicleId}`);
        console.log(`🚛 Client joined fleet room: ${vehicleId}`);
    });

    socket.on('disconnect', () => {
        console.log('🔌 Client disconnected:', socket.id);
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
    httpServer.listen(PORT, () => {
        console.log(`
      ╔═══════════════════════════════════════════════════════════╗
      ║                                                           ║
      ║   🚀 LOGISTICS ERP Backend Server                         ║
      ║   📍 Running on: http://localhost:${PORT}                   ║
      ║   📊 Environment: ${process.env.NODE_ENV || 'development'} - Yahoo Finance Enabled ║
      ║                                                           ║
      ╚═══════════════════════════════════════════════════════════╝
      `);
    });
}

module.exports = { app, io };
