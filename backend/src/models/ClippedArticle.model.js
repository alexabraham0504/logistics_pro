const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const clippedArticleSchema = new mongoose.Schema({
    articleId: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    category: {
        type: String, // 'ecommerce', 'inbound', 'supply-chain'
        required: true
    },
    comments: [commentSchema],
    likes: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ClippedArticle', clippedArticleSchema);
