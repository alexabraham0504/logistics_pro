# LogiFlow ERP - Logistics Management Platform

A comprehensive, enterprise-grade Logistics ERP Software Platform built with the MERN stack (MongoDB, Express.js, React/Next.js, Node.js).

## 🚀 Features

### Core Modules

1. **Authentication & Authorization**
   - JWT-based authentication
   - Role-based access control (RBAC)
   - Three user roles: Customer, Viewer, Admin
   - Secure password encryption with bcrypt

2. **Dashboard**
   - Role-specific dashboards
   - Customer: Personal order tracking
   - Viewer: Comprehensive monitoring with KPIs
   - Admin: Full operational control with quick actions

3. **Transportation Management**
   - Real-time shipment tracking
   - Route visualization
   - Carrier management
   - Delay alerts and management
   - Proof of delivery support

4. **Warehouse Management**
   - Multi-location inventory control
   - Capacity and utilization tracking
   - Zone management
   - Barcode/RFID integration ready

5. **Order Management**
   - Complete order lifecycle (quotation → delivery)
   - Approval workflows
   - SLA compliance tracking
   - Status history and notes

6. **Fleet & Asset Management**
   - Vehicle database with GPS tracking
   - Driver management with license tracking
   - Maintenance scheduling
   - Fuel consumption tracking
   - Cost analysis

7. **Finance & Billing**
   - Automated invoice generation
   - Payment tracking
   - Cost per shipment calculations
   - Revenue analytics

8. **Reporting & Analytics**
   - KPI monitoring (OTIF, cost per shipment, utilization)
   - Visual charts and graphs
   - Export capabilities
   - Performance summaries

9. **Customer Portal**
   - Self-service shipment tracking
   - Order history
   - Invoice visibility

## 👥 User Roles & Permissions

| Feature | Customer | Viewer | Admin |
|---------|----------|--------|-------|
| View own orders | ✅ | ✅ | ✅ |
| View all orders | ❌ | ✅ | ✅ |
| Create/Edit orders | ❌ | ❌ | ✅ |
| Track shipments | ✅ (own) | ✅ (all) | ✅ |
| View dashboards | ✅ (limited) | ✅ | ✅ |
| Access reports | ❌ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ✅ |
| CRUD operations | ❌ | ❌ | ✅ |

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: Socket.io
- **Security**: Helmet, bcryptjs, express-rate-limit

### Frontend
- **Framework**: Next.js 15 (React 19)
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Charts**: Chart.js with react-chartjs-2
- **Icons**: React Icons
- **Styling**: Vanilla CSS with CSS Variables

## 📁 Project Structure

```
logistics_project/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   └── validation.middleware.js
│   │   ├── models/
│   │   │   ├── User.model.js
│   │   │   ├── Order.model.js
│   │   │   ├── Shipment.model.js
│   │   │   ├── Warehouse.model.js
│   │   │   ├── Inventory.model.js
│   │   │   ├── Vehicle.model.js
│   │   │   ├── Driver.model.js
│   │   │   └── Invoice.model.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── user.routes.js
│   │   │   ├── order.routes.js
│   │   │   ├── shipment.routes.js
│   │   │   ├── warehouse.routes.js
│   │   │   ├── inventory.routes.js
│   │   │   ├── fleet.routes.js
│   │   │   ├── invoice.routes.js
│   │   │   ├── report.routes.js
│   │   │   └── dashboard.routes.js
│   │   ├── seeders/
│   │   │   └── seedData.js
│   │   └── server.js
│   ├── .env
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── dashboard/
│   │   │   │   ├── orders/
│   │   │   │   ├── shipments/
│   │   │   │   ├── warehouses/
│   │   │   │   ├── inventory/
│   │   │   │   ├── fleet/
│   │   │   │   ├── invoices/
│   │   │   │   ├── reports/
│   │   │   │   ├── tracking/
│   │   │   │   ├── users/
│   │   │   │   └── my-orders/
│   │   │   ├── login/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── globals.css
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   └── lib/
│   │       └── api.ts
│   ├── .env.local
│   └── package.json
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   cd logistics_project
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```

3. **Configure Environment Variables**
   
   Copy `.env.example` to `.env` and update:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/logistics_erp
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRE=7d
   FRONTEND_URL=http://localhost:3000
   ```

4. **Seed the Database**
   ```bash
   npm run seed
   ```

5. **Start Backend Server**
   ```bash
   npm run dev
   ```

6. **Frontend Setup** (in a new terminal)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

7. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api

## 🔐 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@logistics.com | admin123 |
| Viewer | viewer@logistics.com | viewer123 |
| Customer | customer@test.com | customer123 |

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Orders
- `GET /api/orders` - List orders
- `POST /api/orders` - Create order (Admin)
- `PUT /api/orders/:id/approve` - Approve order (Admin)
- `GET /api/orders/stats/overview` - Order statistics

### Shipments
- `GET /api/shipments` - List shipments
- `GET /api/shipments/track/:trackingNumber` - Track shipment
- `PUT /api/shipments/:id/tracking` - Update tracking
- `PUT /api/shipments/:id/delay` - Report delay

### Warehouses
- `GET /api/warehouses` - List warehouses
- `GET /api/warehouses/:id/utilization` - Get utilization

### Fleet
- `GET /api/fleet/vehicles` - List vehicles
- `GET /api/fleet/drivers` - List drivers
- `POST /api/fleet/vehicles/:id/maintenance` - Add maintenance
- `POST /api/fleet/vehicles/:id/fuel` - Add fuel record

### Reports
- `GET /api/reports/kpi` - KPI metrics
- `GET /api/reports/revenue` - Revenue report
- `GET /api/reports/export/:type` - Export data

## 🎨 Design System

The application uses a custom CSS design system with:
- CSS Variables for theming
- Glassmorphism effects
- Smooth animations and transitions
- Responsive design for all screen sizes
- Dark mode support (ready)

## 🔒 Security Features

- JWT authentication with secure httpOnly considerations
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Helmet.js for security headers
- CORS configuration
- Input validation with express-validator

## 📈 Real-time Features

- Socket.io integration for live tracking
- Real-time shipment location updates
- Delay notifications
- Fleet GPS tracking updates

## 🚀 Production Deployment

1. Set `NODE_ENV=production`
2. Use a production MongoDB instance
3. Configure proper JWT secrets
4. Enable HTTPS
5. Set up proper CORS origins
6. Use PM2 or similar for process management

## 📝 License

This project is for educational/demonstration purposes.

---

Built with ❤️ using MERN Stack + Next.js
#   l o g i s t i c s _ p r o  
 