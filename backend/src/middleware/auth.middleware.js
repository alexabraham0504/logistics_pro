const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

// Protect routes - verify token
exports.protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route'
        });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');

        // Get user from token
        req.user = await User.findById(decoded.id);

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!req.user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'User account is deactivated'
            });
        }

        next();
    } catch (error) {
        console.error('Auth middleware error:', error.message);
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route'
        });
    }
};

// Role-based access control
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role '${req.user.role}' is not authorized to access this route`
            });
        }
        next();
    };
};

// Check if user can only access their own resources
exports.checkOwnership = (model, resourceIdParam = 'id', ownerField = 'customer') => {
    return async (req, res, next) => {
        try {
            // Admins and viewers can access all
            if (['admin', 'viewer'].includes(req.user.role)) {
                return next();
            }

            const resource = await model.findById(req.params[resourceIdParam]);

            if (!resource) {
                return res.status(404).json({
                    success: false,
                    message: 'Resource not found'
                });
            }

            // Check if customer owns the resource
            const ownerId = resource[ownerField]?.toString();
            const userId = req.user._id.toString();

            if (ownerId !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to access this resource'
                });
            }

            req.resource = resource;
            next();
        } catch (error) {
            console.error('Ownership check error:', error.message);
            return res.status(500).json({
                success: false,
                message: 'Error checking resource ownership'
            });
        }
    };
};

// Read-only middleware for viewers
exports.readOnly = (req, res, next) => {
    if (req.user.role === 'viewer') {
        const allowedMethods = ['GET', 'HEAD', 'OPTIONS'];
        if (!allowedMethods.includes(req.method)) {
            return res.status(403).json({
                success: false,
                message: 'Viewer role has read-only access'
            });
        }
    }
    next();
};

// Customer restrictions - can only read their own data
exports.customerRestrictions = (req, res, next) => {
    if (req.user.role === 'customer') {
        const allowedMethods = ['GET', 'HEAD', 'OPTIONS'];
        if (!allowedMethods.includes(req.method)) {
            return res.status(403).json({
                success: false,
                message: 'Customer role has read-only access'
            });
        }
    }
    next();
};
