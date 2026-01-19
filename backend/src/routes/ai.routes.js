const express = require('express');
const router = express.Router();
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Vehicle = require('../models/Vehicle.model');
const Driver = require('../models/Driver.model');
const Inventory = require('../models/Inventory.model');
const Shipment = require('../models/Shipment.model');
const { protect, authorize } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/validation.middleware');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Finnhub API base URL
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

// Apply protection to all routes
router.use(protect);

// ==================== SYSTEM PROMPTS ====================

const SYSTEM_PROMPTS = {
    fleet: `You are a Fleet Optimizer AI for a logistics platform. You help users understand their fleet status, driver locations, and vehicle information.

RULES:
- Base your answers on the provided fleet data context
- Be concise and professional
- Use bullet points for clarity
- Never invent data not provided in context
- If data is missing, say so clearly`,

    inventory: `You are an Inventory Analyst AI for a logistics platform. You help users understand warehouse stock levels, reorder alerts, and inventory distribution.

RULES:
- Base your answers on the provided inventory data context
- Highlight low stock items proactively
- Be concise and professional
- Never invent data not provided in context`,

    tracking: `You are a Shipment Tracking AI for a logistics platform. You help users track packages and understand delivery timelines.

RULES:
- Provide clear status updates
- Explain any delays professionally
- Use timeline format for journey events
- Never invent tracking data`,

    contract: `You are a Contract Intelligence AI for a logistics platform. You analyze logistics documents and contracts.

RULES:
- Summarize key contract points
- Highlight risks and important clauses
- Never invent contract terms
- Recommend legal review for complex matters`,

    zone: `You are a Zone Analytics AI for a logistics platform. You help users understand delivery zones and coverage.

RULES:
- Explain zone coverage clearly
- Use directional language (improving, stable, declining)
- Never invent specific numbers unless provided`,

    carrier: `You are a Carrier Specialist AI for a logistics platform. You help optimize carrier selection and provide routing recommendations.

RULES:
- Compare carriers objectively
- Use qualitative language (cost-effective, reliable, fast)
- Never guarantee specific savings
- Base recommendations on provided data`,

    market: `You are a Market Intelligence AI for a logistics platform. You analyze industry trends and competitor information.

RULES:
- Use directional language only (improving, stable, pressured, volatile)
- Never claim exact market share or revenue numbers
- Base insights on provided market signals
- If data is outdated, state that clearly`,

    support: `You are a Logistics Platform Assistant. You help users navigate the platform and answer general questions.

RULES:
- Be helpful and professional
- Guide users to the right features
- Explain platform capabilities clearly`
};

// ==================== AGENT DEFINITIONS ====================

const AGENTS = [
    {
        id: 'fleet',
        name: 'Fleet Optimizer',
        description: 'Monitors driver status and vehicle locations',
        model: 'Gemini 2.0',
        status: 'active',
        icon: '🚛',
        capabilities: ['Driver Status', 'Vehicle Tracking', 'Route Optimization']
    },
    {
        id: 'inventory',
        name: 'Inventory Analyst',
        description: 'Analyzes warehouse stock levels and trends',
        model: 'Gemini 2.0',
        status: 'active',
        icon: '📦',
        capabilities: ['Stock Levels', 'Reorder Alerts', 'Warehouse Distribution']
    },
    {
        id: 'tracking',
        name: 'Shipment Tracker',
        description: 'Tracks shipment journeys with timeline visualization',
        model: 'Gemini 2.0',
        status: 'active',
        icon: '📍',
        capabilities: ['Live Tracking', 'Timeline Events', 'Delivery Predictions']
    },
    {
        id: 'contract',
        name: 'Contract Intelligence',
        description: 'Analyzes logistics contracts and documents',
        model: 'Gemini 2.0',
        status: 'active',
        icon: '📄',
        capabilities: ['Document Analysis', 'Rate Extraction', 'Expiry Alerts']
    },
    {
        id: 'zone',
        name: 'Zone Analytics',
        description: 'Visualizes delivery zones and fee coverage',
        model: 'Gemini 2.0',
        status: 'active',
        icon: '🗺️',
        capabilities: ['Zone Heatmaps', 'Coverage Analysis', 'Fee Optimization']
    },
    {
        id: 'carrier',
        name: 'Carrier Specialist',
        description: 'Optimizes carrier selection and routing proposals',
        model: 'Gemini 2.0',
        status: 'active',
        icon: '🏢',
        capabilities: ['Carrier Comparison', 'Savings Analysis', 'Proposal Generation']
    },
    {
        id: 'market',
        name: 'Market Intelligence',
        description: 'Aggregates industry news and competitor insights',
        model: 'GPT-4o-mini + Finnhub',
        status: 'active',
        icon: '📊',
        capabilities: ['News Feed', 'Company Watch', 'Trend Analysis']
    },
    {
        id: 'support',
        name: 'Logistics Assistant',
        description: 'General help and platform guidance',
        model: 'Gemini 2.0',
        status: 'active',
        icon: '💬',
        capabilities: ['General Queries', 'Platform Help', 'Best Practices']
    }
];

// ==================== HELPER FUNCTIONS ====================

async function getFleetContext() {
    const vehicles = await Vehicle.find({ isActive: true })
        .populate('assignedDriver', 'firstName lastName status')
        .limit(20);
    const drivers = await Driver.find({ isActive: true }).limit(20);

    return `FLEET DATA:
- Total Vehicles: ${vehicles.length}
- In Transit: ${vehicles.filter(v => v.status === 'in_transit').length}
- Available: ${vehicles.filter(v => v.status === 'available').length}
- Under Maintenance: ${vehicles.filter(v => v.status === 'maintenance').length}

Vehicles:
${vehicles.map(v => `- ${v.vehicleNumber} (${v.type}): ${v.status}${v.assignedDriver ? `, Driver: ${v.assignedDriver.firstName} ${v.assignedDriver.lastName}` : ''}`).join('\n')}

DRIVER DATA:
- Total Drivers: ${drivers.length}
- On Duty: ${drivers.filter(d => d.status === 'on_duty').length}
- Off Duty: ${drivers.filter(d => d.status === 'off_duty').length}`;
}

async function getInventoryContext() {
    const inventory = await Inventory.find({ isActive: true })
        .populate('warehouse', 'name code')
        .limit(30);

    const lowStock = inventory.filter(i => i.currentQuantity <= i.reorderLevel);
    const outOfStock = inventory.filter(i => i.currentQuantity === 0);

    return `INVENTORY DATA:
- Total SKUs: ${inventory.length}
- Low Stock Items: ${lowStock.length}
- Out of Stock: ${outOfStock.length}

Low Stock Items:
${lowStock.map(i => `- ${i.name} (${i.sku}): ${i.currentQuantity} units (Reorder at: ${i.reorderLevel}) - ${i.warehouse?.name || 'Unknown Warehouse'}`).join('\n') || 'None'}`;
}

async function getTrackingContext(trackingId) {
    if (!trackingId) return 'No tracking ID provided. Ask the user for a tracking number.';

    const shipment = await Shipment.findOne({ trackingNumber: trackingId });
    if (!shipment) return `Shipment ${trackingId} not found in the system.`;

    return `SHIPMENT DATA:
- Tracking Number: ${shipment.trackingNumber}
- Status: ${shipment.status}
- Origin: ${shipment.origin?.address || 'N/A'}
- Destination: ${shipment.destination?.address || 'N/A'}
- Estimated Delivery: ${shipment.estimatedDelivery || 'N/A'}

Timeline:
${shipment.trackingUpdates?.map(u => `- ${u.status} at ${u.location} (${new Date(u.timestamp).toLocaleString()})`).join('\n') || 'No updates yet'}`;
}

async function getMarketData(ticker) {
    if (!process.env.FINNHUB_API_KEY || process.env.FINNHUB_API_KEY === 'your-finnhub-api-key-here') {
        return { error: 'Finnhub API key not configured' };
    }

    try {
        const response = await axios.get(`${FINNHUB_BASE_URL}/stock/profile2`, {
            params: {
                symbol: ticker,
                token: process.env.FINNHUB_API_KEY
            }
        });
        return response.data;
    } catch (error) {
        return { error: error.message };
    }
}

async function getStockQuote(ticker) {
    if (!process.env.FINNHUB_API_KEY || process.env.FINNHUB_API_KEY === 'your-finnhub-api-key-here') {
        return { error: 'Finnhub API key not configured' };
    }

    try {
        const response = await axios.get(`${FINNHUB_BASE_URL}/quote`, {
            params: {
                symbol: ticker,
                token: process.env.FINNHUB_API_KEY
            }
        });
        return response.data;
    } catch (error) {
        return { error: error.message };
    }
}

// Call Gemini AI for non-market agents
async function callGemini(systemPrompt, userMessage, context) {
    console.log('\n========== GEMINI API DEBUG ==========');
    console.log('📍 API Key configured:', process.env.GEMINI_API_KEY ? `✅ Yes (${process.env.GEMINI_API_KEY.substring(0, 10)}...)` : '❌ No');
    console.log('📍 Model: gemini-3-flash-preview');
    console.log('📍 User Message:', userMessage.substring(0, 50) + '...');

    if (!process.env.GEMINI_API_KEY) {
        console.log('❌ ERROR: GEMINI_API_KEY not found in environment');
        return {
            text: '⚠️ Gemini API key not configured. Please add your GEMINI_API_KEY to the backend .env file.',
            error: true
        };
    }

    try {
        console.log('🔄 Calling Gemini API...');
        const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

        const prompt = `${systemPrompt}\n\nCONTEXT:\n${context}\n\nUSER QUERY:\n${userMessage}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('✅ Gemini Response received!');
        console.log('📝 Response length:', text.length, 'characters');
        console.log('========== END DEBUG ==========\n');

        return { text: text };
    } catch (error) {
        console.error('❌ Gemini Error:', error.message);
        console.error('📍 Full error:', error);
        console.log('========== END DEBUG ==========\n');
        return {
            text: `Error calling AI: ${error.message}`,
            error: true
        };
    }
}

// Generate response for Market Lens using Finnhub data (no external AI needed)
function generateMarketResponse(userMessage, context) {
    return { text: `**Market Intelligence Report**\n\n${context}\n\nData powered by Finnhub. Use the Company Watch feature to monitor specific logistics tickers (FDX, UPS, XPO, CHRW, EXPD).` };
}

// ==================== AGENT ROUTES ====================

// @desc    Get all available agents
// @route   GET /api/ai/agents
// @access  Private
router.get('/agents', asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        data: {
            agents: AGENTS,
            stats: {
                totalAgents: AGENTS.length,
                activeAgents: AGENTS.filter(a => a.status === 'active').length,
                executionsToday: 0
            }
        }
    });
}));

// @desc    Get single agent details
// @route   GET /api/ai/agents/:id
// @access  Private
router.get('/agents/:id', asyncHandler(async (req, res) => {
    const agent = AGENTS.find(a => a.id === req.params.id);

    if (!agent) {
        return res.status(404).json({
            success: false,
            message: 'Agent not found'
        });
    }

    res.status(200).json({
        success: true,
        data: { agent }
    });
}));

// ==================== CHAT ENDPOINT ====================

// @desc    Process chat message for an agent
// @route   POST /api/ai/chat
// @access  Private
router.post('/chat', asyncHandler(async (req, res) => {
    const { agentId, message, context, documentContent, documentName } = req.body;

    if (!agentId || !message) {
        return res.status(400).json({
            success: false,
            message: 'agentId and message are required'
        });
    }

    const agent = AGENTS.find(a => a.id === agentId);
    if (!agent) {
        return res.status(404).json({
            success: false,
            message: 'Agent not found'
        });
    }

    const systemPrompt = SYSTEM_PROMPTS[agentId] || SYSTEM_PROMPTS.support;
    let dataContext = '';
    let visualization = null;
    let additionalData = null;

    // Build context based on agent type
    switch (agentId) {
        case 'fleet':
            dataContext = await getFleetContext();
            break;
        case 'inventory':
            dataContext = await getInventoryContext();
            break;
        case 'tracking':
            dataContext = await getTrackingContext(context?.trackingId);
            visualization = 'tracking_map';
            break;
        case 'contract':
            // If document content is provided, include it in context
            if (documentContent) {
                console.log('📄 Document provided for analysis:', documentName);
                const truncatedContent = documentContent.length > 15000
                    ? documentContent.substring(0, 15000) + '\n...[Document truncated for processing]'
                    : documentContent;
                dataContext = `DOCUMENT NAME: ${documentName || 'Uploaded Document'}\n\nDOCUMENT CONTENT:\n${truncatedContent}`;
            } else {
                dataContext = 'No document uploaded. User can upload contracts, agreements, or logistics documents for analysis.';
            }
            visualization = 'document_analysis';
            break;
        case 'zone':
            dataContext = 'Zone coverage data available. The user is viewing the zone heatmap.';
            visualization = 'zone_heatmap';
            break;
        case 'carrier':
            dataContext = 'Carrier optimization context. Available carriers: FedEx, UPS, DHL, USPS.';
            visualization = 'carrier_proposal';
            break;
        case 'market':
            // Get real market data if a ticker is mentioned
            const tickerMatch = message.match(/\b(FDX|UPS|XPO|CHRW|EXPD)\b/i);
            if (tickerMatch) {
                const ticker = tickerMatch[1].toUpperCase();
                const [profile, quote] = await Promise.all([
                    getMarketData(ticker),
                    getStockQuote(ticker)
                ]);

                if (!profile.error && !quote.error) {
                    dataContext = `MARKET DATA for ${ticker}:
- Company: ${profile.name || ticker}
- Industry: ${profile.finnhubIndustry || 'Logistics'}
- Market Cap: $${(profile.marketCapitalization || 0).toLocaleString()}M
- Current Price: $${quote.c || 'N/A'}
- Day Change: ${quote.dp ? quote.dp.toFixed(2) : 'N/A'}%
- 52-Week High: $${quote.h || 'N/A'}
- 52-Week Low: $${quote.l || 'N/A'}

Note: Use directional language. Do NOT quote exact numbers to the user unless asked specifically.`;
                    additionalData = { profile, quote, ticker };
                } else {
                    dataContext = `Market data for ${ticker} unavailable. Error: ${profile.error || quote.error}`;
                }
            } else {
                dataContext = 'General market intelligence context. Monitored logistics companies: FedEx (FDX), UPS, XPO Logistics (XPO), C.H. Robinson (CHRW), Expeditors (EXPD).';
            }
            visualization = 'market_financials';
            break;
        default:
            dataContext = 'General logistics platform assistance.';
    }

    // Generate response - Market uses Finnhub data, others use Gemini AI
    let aiResponse;
    if (agentId === 'market') {
        aiResponse = generateMarketResponse(message, dataContext);
    } else {
        aiResponse = await callGemini(systemPrompt, message, dataContext);
    }

    res.status(200).json({
        success: true,
        data: {
            agent: agent.name,
            response: aiResponse.text,
            data: additionalData,
            visualization: visualization,
            usage: aiResponse.usage || null
        }
    });
}));

// ==================== SPECIALIZED DATA ENDPOINTS ====================

// @desc    Get tracking data for visualization
// @route   GET /api/ai/tracking/:trackingId
// @access  Private
router.get('/tracking/:trackingId', asyncHandler(async (req, res) => {
    const shipment = await Shipment.findOne({ trackingNumber: req.params.trackingId })
        .populate('assignedVehicle')
        .populate('assignedDriver');

    if (!shipment) {
        return res.status(404).json({
            success: false,
            message: 'Shipment not found'
        });
    }

    const timeline = shipment.trackingUpdates?.map(update => ({
        status: update.status,
        location: update.location,
        timestamp: update.timestamp,
        notes: update.notes
    })) || [];

    res.status(200).json({
        success: true,
        data: {
            shipment: {
                trackingNumber: shipment.trackingNumber,
                status: shipment.status,
                origin: shipment.origin,
                destination: shipment.destination,
                estimatedDelivery: shipment.estimatedDelivery
            },
            timeline,
            coordinates: shipment.currentLocation?.coordinates || null
        }
    });
}));

// @desc    Get zone heatmap data
// @route   GET /api/ai/zones/heatmap
// @access  Private
router.get('/zones/heatmap', asyncHandler(async (req, res) => {
    // Aggregate shipment data for heatmap
    const shipments = await Shipment.find({ status: { $in: ['delivered', 'in_transit'] } })
        .select('destination.coordinates')
        .limit(500);

    const heatmapData = {
        regions: [
            { lat: 40.7128, lng: -74.0060, intensity: 0.9, name: 'New York' },
            { lat: 34.0522, lng: -118.2437, intensity: 0.85, name: 'Los Angeles' },
            { lat: 41.8781, lng: -87.6298, intensity: 0.75, name: 'Chicago' },
            { lat: 29.7604, lng: -95.3698, intensity: 0.7, name: 'Houston' },
            { lat: 33.4484, lng: -112.0740, intensity: 0.6, name: 'Phoenix' }
        ],
        totalShipments: shipments.length
    };

    res.status(200).json({
        success: true,
        data: heatmapData
    });
}));

// @desc    Get carrier proposal data
// @route   GET /api/ai/carriers/proposal
// @access  Private
router.get('/carriers/proposal', asyncHandler(async (req, res) => {
    const proposalData = {
        phases: [
            { phase: 1, name: 'Move DHL Volume', status: 'completed' },
            { phase: 2, name: 'Move Recommended Volume', status: 'completed' },
            { phase: 3, name: 'Activate North East Region', status: 'in_progress' },
            { phase: 4, name: 'Activate West Region', status: 'pending' },
            { phase: 5, name: 'Activate North Region', status: 'pending' },
            { phase: 6, name: 'Complete Setup', status: 'pending' }
        ],
        savings: {
            zone0: { NYC: '$3.45', NJ: '$3.10', Boston: '$3.53', Philly: '$3.75' }
        },
        carrierMix: [
            { carrier: 'FedEx', parcelsPerDay: 5500 },
            { carrier: 'DHL', parcelsPerDay: 5000 },
            { carrier: 'UPS', parcelsPerDay: 3009 }
        ]
    };

    res.status(200).json({
        success: true,
        data: proposalData
    });
}));

// @desc    Get market news
// @route   GET /api/ai/market/news
// @access  Private
router.get('/market/news', asyncHandler(async (req, res) => {
    if (!process.env.FINNHUB_API_KEY || process.env.FINNHUB_API_KEY === 'your-finnhub-api-key-here') {
        return res.status(200).json({
            success: true,
            data: {
                message: 'Finnhub API key not configured',
                articles: []
            }
        });
    }

    try {
        const response = await axios.get(`${FINNHUB_BASE_URL}/news`, {
            params: {
                category: 'general',
                token: process.env.FINNHUB_API_KEY
            }
        });

        // Filter for logistics-related news
        const logisticsKeywords = ['logistics', 'shipping', 'supply chain', 'freight', 'delivery', 'warehouse', 'fedex', 'ups', 'dhl'];
        const filteredNews = response.data.filter(article =>
            logisticsKeywords.some(keyword =>
                (article.headline || '').toLowerCase().includes(keyword) ||
                (article.summary || '').toLowerCase().includes(keyword)
            )
        ).slice(0, 10);

        res.status(200).json({
            success: true,
            data: {
                articles: filteredNews.map(article => ({
                    id: article.id,
                    title: article.headline,
                    summary: article.summary,
                    source: article.source,
                    url: article.url,
                    image: article.image,
                    datetime: article.datetime
                }))
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}));

// @desc    Get company financial signals
// @route   GET /api/ai/market/company/:ticker
// @access  Private
router.get('/market/company/:ticker', asyncHandler(async (req, res) => {
    const { ticker } = req.params;

    const [profile, quote] = await Promise.all([
        getMarketData(ticker),
        getStockQuote(ticker)
    ]);

    if (profile.error || quote.error) {
        return res.status(500).json({
            success: false,
            message: profile.error || quote.error
        });
    }

    res.status(200).json({
        success: true,
        data: {
            name: profile.name,
            ticker: profile.ticker || ticker,
            sector: profile.finnhubIndustry,
            logo: profile.logo,
            weburl: profile.weburl,
            marketCap: profile.marketCapitalization,
            shareOutstanding: profile.shareOutstanding,
            quote: {
                current: quote.c,
                high: quote.h,
                low: quote.l,
                open: quote.o,
                previousClose: quote.pc,
                change: quote.d,
                percentChange: quote.dp
            }
        }
    });
}));

module.exports = router;
