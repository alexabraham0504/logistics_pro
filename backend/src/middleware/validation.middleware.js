const { validationResult } = require('express-validator');

// Validate request using express-validator
exports.validate = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }

    next();
};

// Custom error handler for async functions
exports.asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Pagination middleware
exports.paginate = (req, res, next) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    req.pagination = {
        page,
        limit,
        startIndex,
        endIndex
    };

    next();
};

// Sorting middleware
exports.sort = (defaultField = 'createdAt', defaultOrder = 'desc') => {
    return (req, res, next) => {
        const sortField = req.query.sortBy || defaultField;
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

        req.sorting = {
            [sortField]: sortOrder
        };

        next();
    };
};

// Search middleware
exports.search = (...searchFields) => {
    return (req, res, next) => {
        const searchTerm = req.query.search;

        if (searchTerm && searchFields.length > 0) {
            req.searchQuery = {
                $or: searchFields.map(field => ({
                    [field]: { $regex: searchTerm, $options: 'i' }
                }))
            };
        } else {
            req.searchQuery = {};
        }

        next();
    };
};

// Date range filter middleware
exports.dateRangeFilter = (dateField = 'createdAt') => {
    return (req, res, next) => {
        const { startDate, endDate } = req.query;
        const dateFilter = {};

        if (startDate) {
            dateFilter[dateField] = { $gte: new Date(startDate) };
        }

        if (endDate) {
            dateFilter[dateField] = {
                ...dateFilter[dateField],
                $lte: new Date(endDate)
            };
        }

        req.dateFilter = dateFilter;
        next();
    };
};
