'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { FiArrowLeft, FiArrowRight, FiThumbsUp, FiMessageSquare, FiExternalLink, FiSearch, FiSettings, FiX } from 'react-icons/fi';
import styles from './ClippedView.module.css';

interface Article {
    id: string;
    title: string;
    summary: string;
    source: string;
    likes: number;
    comments: number;
    url?: string;
}

interface Category {
    id: string;
    name: string;
    description: string;
    image: string;
    articles: Article[];
}

interface ClippedViewProps {
    onBack?: () => void;
}

const CATEGORIES: Category[] = [
    {
        id: 'ecommerce',
        name: 'Ecommerce Platforms',
        description: 'Ecommerce Platforms is a leading publication that provides comprehensive coverage of the ecommerce industry.',
        image: '/images/ecommerce-logistics.png',
        articles: [
            {
                id: '1',
                title: '5 Best ecommerce platforms for Beginners',
                summary: 'This article provides a comprehensive overview of popular e-commerce platforms suitable for beginners.\n\nIt highlights key features to consider when choosing a platform, such as ease of use, inventory management, customization options, support, integration capabilities, payment methods, and security.\n\nThe article focuses on four leading platforms:\n\n**Shopify**',
                source: 'Ecommerce Weekly',
                likes: 4,
                comments: 2
            },
            {
                id: '2',
                title: '10 Key Features for B2B Ecommerce Sites',
                summary: 'Discover the essential features that every B2B ecommerce site needs to succeed in 2024. From bulk ordering to custom pricing tiers, learn how to optimize your platform.',
                source: 'B2B Insider',
                likes: 12,
                comments: 5
            },
            {
                id: '3',
                title: 'Shopify vs Magento: A Comprehensive Comparison',
                summary: 'An in-depth look at the pros and cons of two of the market leaders. Which one is right for your scaling business?',
                source: 'Tech Review',
                likes: 8,
                comments: 1
            },
            {
                id: '4',
                title: 'Payment Gateway Security Standards',
                summary: 'Understanding PCI DSS compliance and how to ensure your customers data remains checking.',
                source: 'Security Today',
                likes: 15,
                comments: 0
            }
        ]
    },
    {
        id: 'inbound',
        name: 'Inbound Logistics',
        description: 'Inbound Logistics is a media company founded in 1981 that serves as the information leader in supply chain management.',
        image: '/images/inbound-logistics.png',
        articles: [
            {
                id: '5',
                title: 'Optimizing Inbound Supply Chain Operations',
                summary: 'Learn how to streamline your inbound logistics for maximum efficiency and cost reduction in a volatile market.',
                source: 'Logistics Today',
                likes: 25,
                comments: 8
            },
            {
                id: '6',
                title: 'The Role of AI in Inventory Management',
                summary: 'Artificial Intelligence is revolutionizing how warehouses manage stock levels. Here is what you need to know.',
                source: 'AI Future',
                likes: 30,
                comments: 12
            }
        ]
    },
    {
        id: 'supply-chain',
        name: 'Supply Chain Management Review',
        description: 'Supply Chain Management Review (SCMR) is a professional publication modeled after the Harvard Business Review.',
        image: '/images/supply-chain-management.png',
        articles: [
            {
                id: '7',
                title: 'Future of Supply Chain Technology 2025',
                summary: 'Exploring the latest trends in supply chain management technology including Blockchain, IoT, and Autonomous delivering.',
                source: 'SCMR',
                likes: 42,
                comments: 3
            }
        ]
    }
];

const FILTER_TABS = ['All', 'Supply Chain', 'Logistics'];

interface Comment {
    user: string;
    text: string;
}

export default function ClippedView({ onBack }: ClippedViewProps) {
    const { token } = useAuth();
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [currentArticleIndex, setCurrentArticleIndex] = useState(0);
    const [activeFilter, setActiveFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState<Comment[]>([]);

    useEffect(() => {
        if (selectedCategory) {
            const article = selectedCategory.articles[currentArticleIndex];
            fetchComments(article.id);
        }
    }, [selectedCategory, currentArticleIndex, token]);

    const fetchComments = async (articleId: string) => {
        try {
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/ai/clipped/${articleId}/comments`, config);
            if (response.data.success) {
                setComments(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch comments:', error);
        }
    };

    const handleCategoryClick = (category: Category) => {
        setSelectedCategory(category);
        setCurrentArticleIndex(0);
        setShowComments(false);
    };

    const handleBack = () => {
        if (selectedCategory) {
            setSelectedCategory(null);
        } else if (onBack) {
            onBack();
        }
    };

    const nextArticle = () => {
        if (selectedCategory && currentArticleIndex < selectedCategory.articles.length - 1) {
            setCurrentArticleIndex(prev => prev + 1);
            setShowComments(false);
        }
    };

    const prevArticle = () => {
        if (currentArticleIndex > 0) {
            setCurrentArticleIndex(prev => prev - 1);
            setShowComments(false);
        }
    };

    const handleSubmitComment = async () => {
        if (!commentText.trim() || !selectedCategory) return;

        const currentArticle = selectedCategory.articles[currentArticleIndex];

        try {
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/ai/clipped/comments`, {
                articleId: currentArticle.id,
                categoryId: selectedCategory.id,
                title: currentArticle.title,
                user: 'User', // In a real app, backend can extract this from the token
                text: commentText
            }, config);

            if (response.data.success) {
                setComments(response.data.data);
                setCommentText('');
            }
        } catch (error) {
            console.error('Failed to submit comment:', error);
        }
    };

    const filteredCategories = CATEGORIES.filter(category => {
        const matchesFilter = activeFilter === 'All' ||
            category.name.toLowerCase().includes(activeFilter.toLowerCase()) ||
            (activeFilter === 'Logistics' && category.name.toLowerCase().includes('inbound')); // Special case for Inbound Logistics matching 'Logistics' filter more broadly if needed, though simple include works for 'Inbound Logistics'

        const matchesSearch = category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            category.description.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <button onClick={handleBack} className={styles.backBtn}>
                    <FiArrowLeft /> {selectedCategory ? 'Back' : 'Back to Agent Studio'}
                </button>
                <div className={styles.headerCenter}>
                    <h1>{selectedCategory ? selectedCategory.name : 'Clipped'}</h1>
                </div>
                <div style={{ width: 100 }}></div>
            </header>

            <div className={styles.content}>
                {!selectedCategory ? (
                    <>
                        {/* Category Grid View */}
                        <p className={styles.subtitle}>
                            Select a category and articles to view the summary.
                        </p>

                        <div className={styles.searchContainer}>
                            <input
                                type="text"
                                className={styles.searchInput}
                                placeholder="Search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button className={styles.filterBtn}><FiSettings /></button>
                        </div>

                        <div className={styles.filterTabs}>
                            {FILTER_TABS.map((tab) => (
                                <button
                                    key={tab}
                                    className={`${styles.filterTab} ${activeFilter === tab ? styles.active : ''}`}
                                    onClick={() => setActiveFilter(tab)}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className={styles.categoryGrid}>
                            {filteredCategories.map((category) => (
                                <div
                                    key={category.id}
                                    className={styles.categoryCard}
                                    onClick={() => handleCategoryClick(category)}
                                >
                                    <div className={styles.categoryImage}>
                                        <img src={category.image} alt={category.name} />
                                    </div>
                                    <div className={styles.categoryInfo}>
                                        <h3 className={styles.categoryName}>
                                            {category.name}
                                            <FiExternalLink className={styles.externalIcon} />
                                        </h3>
                                        <p className={styles.categoryDescription}>
                                            {category.description}
                                        </p>
                                        <span className={styles.exploreLink}>
                                            EXPLORE ARTICLES
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        {/* Detail View with 3D Stack */}
                        <div className={styles.detailContainer}>
                            {/* Left: Gallery Image */}
                            <div className={styles.leftColumn}>
                                <span className={styles.viewContentsLink}>View Contents</span>
                                <div className={styles.verticalGallery}>
                                    <img src={selectedCategory.image} alt="" className={styles.galleryImage} />
                                    <div className={styles.galleryOverlay}>
                                        LOGISTICS
                                    </div>
                                </div>
                            </div>

                            {/* Right: Stack Interaction */}
                            <div className={styles.stackSection}>
                                <div className={styles.searchContainer} style={{ justifyContent: 'flex-start', marginBottom: '1rem', visibility: 'hidden' }}>
                                    {/* Hidden search to keep layout or remove it? Screenshot has a search bar at top center? No, top center of page. */}
                                </div>

                                <div className={styles.stackContainer}>
                                    {/* Navigation Arrows */}
                                    <button
                                        className={`${styles.navArrow} ${styles.prevArrow}`}
                                        onClick={prevArticle}
                                        disabled={currentArticleIndex === 0}
                                    >
                                        <FiArrowLeft />
                                    </button>

                                    {/* The Stack */}
                                    {selectedCategory.articles.map((article, index) => {
                                        // Calculate relative index from current
                                        const diff = index - currentArticleIndex;
                                        if (diff < 0) return null; // Hide previous cards
                                        if (diff > 4) return null; // Only show up to 5 cards (0-4)

                                        return (
                                            <div
                                                key={article.id}
                                                className={styles.stackCard}
                                                data-index={diff}
                                            >
                                                {/* Only render content for the top card to avoid clutter/performance */}
                                                <div style={{ opacity: diff === 0 ? 1 : 0.3, transition: 'opacity 0.3s' }}>
                                                    <div className={styles.articleHeader}>
                                                        <span className={styles.articleCategoryTitle}>
                                                            {selectedCategory.name}
                                                        </span>
                                                        <FiExternalLink className={styles.articleLinkIcon} />
                                                    </div>

                                                    <h3 className={styles.articleTitle}>{article.title}</h3>

                                                    <p className={styles.articleSummary}>
                                                        {article.summary}
                                                    </p>

                                                    <div className={styles.cardFooter}>
                                                        <span className={styles.likeCount}>
                                                            {article.likes} <FiThumbsUp />
                                                        </span>
                                                        <button
                                                            className={styles.footerBtn}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setShowComments(!showComments);
                                                            }}
                                                        >
                                                            <FiMessageSquare />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    <button
                                        className={`${styles.navArrow} ${styles.nextArrow}`}
                                        onClick={nextArticle}
                                        disabled={currentArticleIndex >= selectedCategory.articles.length - 1}
                                    >
                                        <FiArrowRight />
                                    </button>

                                    {/* Comments Panel */}
                                    {showComments && (
                                        <div className={styles.commentsPanel}>
                                            <div className={styles.panelHeader}>
                                                <span className={styles.panelTitle}>Add Comments</span>
                                                <button className={styles.closePanel} onClick={() => setShowComments(false)}><FiX /></button>
                                            </div>
                                            <div className={styles.commentList}>
                                                {comments.map((comment, index) => (
                                                    <div key={index} className={styles.commentItem}>
                                                        <span className={styles.commentUser}>{comment.user}</span>
                                                        <p className={styles.commentText}>{comment.text}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className={styles.commentInputArea}>
                                                <textarea
                                                    className={styles.panelInput}
                                                    placeholder="Write your comment..."
                                                    value={commentText}
                                                    onChange={(e) => setCommentText(e.target.value)}
                                                    maxLength={280}
                                                />
                                                <div className={styles.panelFooter}>
                                                    <span className={styles.charCount}>{commentText.length}/280</span>
                                                    <button className={styles.submitBtn} onClick={handleSubmitComment}>Submit</button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
