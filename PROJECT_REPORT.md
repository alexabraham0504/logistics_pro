# Bharat Logistics ERP - Complete Project Report

**Report Date:** February 4, 2026

---

## Executive Summary

Bharat Logistics ERP is a comprehensive, enterprise-grade logistics management platform that we have developed using modern web technologies. The platform integrates blockchain verification for document authenticity, artificial intelligence for smart analytics, and real-time tracking capabilities to provide a complete supply chain management solution. The system is designed to handle all aspects of logistics operations from order management to delivery confirmation, with immutable proof stored on the blockchain.

---

## Technology Stack

### Backend Infrastructure

The backend of Bharat Logistics is built on Node.js with Express.js as the web framework. We use MongoDB as our primary database through the Mongoose ODM library version 8.x, which provides a robust schema-based solution for modeling our application data. For real-time communication between the server and connected clients, we have implemented Socket.io version 4.x, enabling instant notifications and live tracking updates.

The blockchain integration is powered by Ethers.js version 6.x, which allows us to interact with smart contracts deployed on the Polygon Amoy testnet. For artificial intelligence capabilities, we have integrated Google's Generative AI SDK, utilizing the Gemini 2.0 model for our intelligent agent system. Additionally, we use Yahoo Finance library version 3.x to fetch real-time market data for our Market Intelligence AI agent.

### Frontend Application

The frontend is developed using Next.js version 16.1.2 with the modern App Router architecture. We are using React version 19.2.3 as our UI library, and the entire codebase is written in TypeScript version 5.x for enhanced type safety and developer experience. For data visualization, we utilize Chart.js version 4.x through the react-chartjs-2 wrapper to display analytics and statistics on the dashboard. Real-time updates from the server are received through Socket.io-client version 4.x.

### Blockchain Layer

Smart contract development is handled through Hardhat version 2.19, which provides a comprehensive development environment for Ethereum-compatible blockchains. Our smart contracts are written in Solidity version 0.8.19 and are designed to deploy on the Polygon Amoy testnet for low-cost, fast transactions. The hybrid architecture allows us to maintain quick off-chain operations while ensuring critical data is anchored on-chain for immutability.

---

## Project Architecture

The project follows a monorepo structure with three main directories: backend, frontend, and smart_contracts. Each directory is a self-contained application with its own dependencies and configuration.

The backend directory contains the Express.js API server with a well-organized source folder structure. Within the source folder, we have dedicated directories for configuration files, middleware functions for authentication and error handling, fourteen MongoDB models representing our data entities, seventeen API route modules covering all business operations, three specialized services for blockchain operations, notifications, and smart contract interactions, utility functions for cryptographic operations, and database seeders for initial data population.

The frontend directory houses our Next.js application with a source folder containing the app directory following Next.js 16 conventions, reusable components, React context providers for state management, and utility libraries. The app directory contains the main landing page, login functionality, and a comprehensive dashboard with twelve distinct modules.

The smart_contracts directory contains our Hardhat project with the Solidity contracts, deployment scripts, and configuration files for both local development and Polygon Amoy testnet deployment.

---

## Database Schema

Our MongoDB database consists of fourteen collections that represent the core entities of the logistics platform.

The User model stores account information with role-based access control, supporting different user types such as administrators, managers, drivers, and warehouse staff. The Order model captures customer orders with all relevant details including origin, destination, items, and status tracking. The Shipment model tracks the physical movement of goods, linking orders to vehicles and drivers with real-time status updates.

For the fleet management system, we have the Driver model containing driver profiles, license information, and current status, along with the DriverBlockchain model that stores blockchain verification records for driver-related transactions. The Vehicle model maintains our fleet inventory with details about each vehicle's capacity, type, and current assignment.

The warehousing and inventory system uses the Warehouse model for location details and capacity management, and the Inventory model for tracking stock levels, reorder points, and distribution across warehouses. The Invoice model handles billing and payment tracking for completed orders.

Our blockchain verification system relies on the PODToken model for Proof of Delivery records, the TODToken model for Transfer of Delivery records, the Export model for export documentation, and the ExportBlockchain model for blockchain-verified export records. Finally, the ClippedArticle model stores market news articles that users have saved for reference in the Market Intelligence section.

---

## API Endpoints

The backend exposes seventeen distinct API route modules, each handling a specific domain of the application.

The authentication routes at the path /api/auth handle user registration, login, and JWT token management. User management operations are available at /api/users, providing CRUD operations for user accounts and profile management.

Core business operations are handled through several routes: the orders route at /api/orders manages the complete order lifecycle from creation to completion; the shipments route at /api/shipments tracks physical delivery progress; the warehouses route at /api/warehouses manages storage facilities; the inventory route at /api/inventory handles stock management and alerts; the fleet route at /api/fleet manages vehicles and drivers; and the invoices route at /api/invoices processes billing operations.

Advanced features are exposed through specialized routes. The AI route at /api/ai provides access to our eight intelligent agents for various analytics and recommendations. The blockchain route at /api/blockchain handles on-chain verification operations. The POD and TOD routes at /api/pod and /api/tod manage Proof of Delivery and Transfer of Delivery tokens respectively. The Vahak route at /api/vahak integrates with the Vahak logistics platform, and the Blackbug route at /api/blackbug provides GPS tracking integration. The export route at /api/export handles data export operations with blockchain verification. Dashboard statistics are available at /api/dashboard, and comprehensive reports can be generated through /api/reports.

---

## AI Agent System

The platform features eight specialized AI agents powered by Google's Gemini 2.0 model, each designed to provide intelligent assistance in a specific domain.

The Fleet Optimizer agent monitors driver status and vehicle locations, providing route optimization suggestions and fleet utilization analysis. It helps logistics managers make informed decisions about vehicle assignments and driver scheduling.

The Inventory Analyst agent examines warehouse stock levels and identifies reorder alerts before items run out. It analyzes inventory distribution across warehouses and provides recommendations for optimal stock positioning.

The Shipment Tracker agent provides real-time tracking information and status updates for active shipments. It can predict delivery times and alert users to potential delays based on historical data and current conditions.

The Contract Intelligence agent analyzes logistics contracts and documents, extracting key information such as rates, terms, and expiry dates. It can process uploaded PDF documents and provide summaries of important contractual obligations.

The Zone Analytics agent visualizes delivery zones and fee coverage areas through heatmap displays. It helps in understanding geographical distribution of deliveries and optimizing zone-based pricing.

The Cost Analytics agent analyzes spending patterns and provides cost predictions for logistics operations. It identifies opportunities for cost optimization and tracks budget utilization across different categories.

The Market Intelligence agent monitors industry trends and competitor information using real-time data from Yahoo Finance. It tracks logistics company stocks, provides market sentiment analysis, and aggregates industry news.

The Support Assistant serves as a general help agent, guiding users through platform features and answering common questions about best practices in logistics management.

---

## Blockchain Integration

### Smart Contract Architecture

The core of our blockchain integration is the LogisticsTracker smart contract written in Solidity. This contract provides immutable on-chain verification for logistics documents, ensuring that once a record is verified, it cannot be altered or deleted.

The contract exposes two main functions. The verifyRecord function accepts a record identifier, record type, and data hash, storing this information on the blockchain along with a timestamp and the address of the wallet that recorded it. This function also emits a RecordVerified event that external systems can monitor for audit purposes. The checkIntegrity function allows anyone to verify whether a provided hash matches the on-chain record for a given identifier, enabling tamper detection.

The contract supports three record types: POD for Proof of Delivery tokens confirming successful delivery, TOD for Transfer of Delivery tokens documenting custody transfers, and VAHAK for records from the Vahak logistics platform integration.

### Hybrid Architecture

We have implemented a hybrid blockchain architecture that balances performance with immutability. Most data operations occur off-chain in our MongoDB database, ensuring fast response times and low operational costs. However, critical verification data is automatically published to the Polygon Amoy blockchain through our SmartContractService.

When a new block is created in our internal blockchain simulation, the BlockchainService automatically detects the record type and publishes the SHA-256 hash to the smart contract. This provides cryptographic proof that the data existed at a specific point in time and has not been modified since. The transaction hash returned from the blockchain is stored alongside the local record, creating a link between our database and the immutable ledger.

### Deployment Options

The smart contracts can be deployed to either a local Hardhat node for development and testing, or to the Polygon Amoy testnet for production-like environments. Deployment scripts are provided for both scenarios, and a comprehensive deployment guide is included in the smart_contracts directory.

---

## Frontend Dashboard

The dashboard is the heart of the user interface, providing access to all platform functionality through a well-organized navigation structure.

The main dashboard page presents an overview of key statistics and recent activity across all areas of the logistics operation. Users can see at-a-glance metrics for orders, shipments, inventory levels, and fleet status.

The AI Hub section contains twenty-seven components providing access to all eight AI agents. Each agent has its own interface optimized for its specific use case, with chat functionality, visualization displays, and contextual data presentation.

The Blockchain Explorer section consists of fifteen components that allow users to view on-chain verification records, check transaction statuses, and verify document integrity. Users can browse POD, TOD, and Vahak records with their corresponding blockchain transaction data.

Additional dashboard modules include Fleet Management for vehicle and driver administration, Inventory Management for stock operations and alerts, Order Management for the complete order lifecycle, Shipment Tracking for real-time delivery monitoring, Invoice Management for billing operations, Report Generation for analytics and exports, User Administration for account management, and Warehouse Management for storage facility operations.

---

## Security Implementation

Security is implemented at multiple layers throughout the application.

Authentication uses JSON Web Tokens with secure signing and configurable expiration. Passwords are hashed using bcryptjs before storage, ensuring that even database breaches do not expose user credentials.

The application implements rate limiting of one hundred requests per fifteen minutes per IP address to prevent abuse and denial-of-service attacks. Helmet.js middleware sets various HTTP security headers to protect against common web vulnerabilities.

Cross-Origin Resource Sharing is configured to allow requests only from approved origins, with dynamic support for development localhost addresses, Vercel deployments, and Render deployments. Input validation using express-validator ensures that all incoming data meets expected formats before processing.

---

## Deployment Configuration

The backend is configured for deployment on Render with a Dockerfile for containerized deployment. The application includes trust proxy settings to ensure rate limiting works correctly behind reverse proxies. Environment variables control all sensitive configuration including database connections, API keys, and blockchain wallet credentials.

The frontend is configured for Vercel deployment with Next.js optimization. Environment variables manage the API URL configuration for connecting to the backend.

A render.yaml file is included for infrastructure-as-code deployment on Render, and comprehensive deployment documentation guides the process for setting up the production environment.

---

## Real-Time Features

Real-time functionality is implemented through Socket.io with a sophisticated room-based architecture.

Users automatically join a personal room upon connection, enabling targeted notifications for their specific activities. Role-based rooms allow broadcasting to all users of a particular type, such as all drivers or all managers. Shipment-specific rooms provide live updates as packages move through the delivery process, and fleet rooms enable real-time vehicle tracking.

The NotificationService orchestrates message broadcasting across these rooms, triggered by events throughout the application such as POD generation, shipment status changes, and inventory alerts.

---

## Current Status and Recent Development

The application is currently running in active development mode with both the backend server on port 5000 and the frontend server on port 3000 operational.

Recent development work has focused on several key areas. Blockchain integration issues were resolved, particularly addressing the "network does not support ENS" error that was preventing successful transaction publishing to the Polygon Amoy network. A hybrid deployment configuration was established allowing seamless switching between local development and the Polygon Amoy testnet.

The AI generation system was enhanced with fixes for Unicode encoding errors that were preventing content creation. Token economy research was conducted to define allocation models for rewarding different logistics roles including drivers, warehouse staff, and managers.

The Vahak chain was integrated into the blockchain explorer, and socket connection and login flow issues were debugged and resolved. The blockchain explorer interface was refined with dark theme optimizations for a premium appearance. Comprehensive data security and compliance documentation was created. Mobile user interface optimizations were implemented to fix navbar and header visibility issues on smaller screens.

---

Conclusion

Bharat Logistics ERP represents a complete, production-ready logistics management solution that combines the reliability of traditional web technologies with the innovation of blockchain verification and artificial intelligence. The platform provides comprehensive tools for managing every aspect of logistics operations while ensuring data integrity through immutable on-chain records.

The modular architecture allows for easy extension and maintenance, while the hybrid blockchain approach provides the benefits of decentralized verification without sacrificing performance. The AI agent system adds intelligent assistance across all operational areas, helping users make better decisions faster.

With both the backend and frontend actively running and all major features implemented, the platform is ready for production deployment and real-world use.




