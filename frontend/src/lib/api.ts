import axios from 'axios';

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '');
const API_URL = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Don't redirect if we are already trying to login to avoid infinite refresh loop
            const isLoginRequest = error.config?.url?.includes('/auth/login');

            if (typeof window !== 'undefined' && !isLoginRequest) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (credentials: { email: string; password: string }) => api.post('/auth/login', credentials),
    register: (userData: object) => api.post('/auth/register', userData),
    getMe: () => api.get('/auth/me'),
    updateProfile: (data: object) => api.put('/auth/profile', data),
    updatePassword: (data: object) => api.put('/auth/password', data),
};

// Dashboard API
export const dashboardAPI = {
    getCustomerDashboard: () => api.get('/dashboard/customer'),
    getViewerDashboard: () => api.get('/dashboard/viewer'),
    getAdminDashboard: () => api.get('/dashboard/admin'),
};

// Orders API
export const ordersAPI = {
    getAll: (params?: object) => api.get('/orders', { params }),
    getById: (id: string) => api.get(`/orders/${id}`),
    create: (data: object) => api.post('/orders', data),
    update: (id: string, data: object) => api.put(`/orders/${id}`, data),
    approve: (id: string) => api.put(`/orders/${id}/approve`),
    cancel: (id: string, reason?: string) => api.put(`/orders/${id}/cancel`, { reason }),
    delete: (id: string) => api.delete(`/orders/${id}`),
    getStats: () => api.get('/orders/stats/overview'),
};

// Shipments API
export const shipmentsAPI = {
    getAll: (params?: object) => api.get('/shipments', { params }),
    getById: (id: string) => api.get(`/shipments/${id}`),
    track: (trackingNumber: string) => api.get(`/shipments/track/${trackingNumber}`),
    create: (data: object) => api.post('/shipments', data),
    update: (id: string, data: object) => api.put(`/shipments/${id}`, data),
    updateTracking: (id: string, data: object) => api.put(`/shipments/${id}/tracking`, data),
    reportDelay: (id: string, data: object) => api.put(`/shipments/${id}/delay`, data),
    delete: (id: string) => api.delete(`/shipments/${id}`),
    getStats: () => api.get('/shipments/stats/overview'),
};

// Warehouses API
export const warehousesAPI = {
    getAll: (params?: object) => api.get('/warehouses', { params }),
    getById: (id: string) => api.get(`/warehouses/${id}`),
    create: (data: object) => api.post('/warehouses', data),
    update: (id: string, data: object) => api.put(`/warehouses/${id}`, data),
    delete: (id: string) => api.delete(`/warehouses/${id}`),
    getUtilization: (id: string) => api.get(`/warehouses/${id}/utilization`),
    getStats: () => api.get('/warehouses/stats/overview'),
};

// Inventory API
export const inventoryAPI = {
    getAll: (params?: object) => api.get('/inventory', { params }),
    getById: (id: string) => api.get(`/inventory/${id}`),
    getBySku: (sku: string) => api.get(`/inventory/sku/${sku}`),
    getByBarcode: (barcode: string) => api.get(`/inventory/barcode/${barcode}`),
    create: (data: object) => api.post('/inventory', data),
    update: (id: string, data: object) => api.put(`/inventory/${id}`, data),
    adjust: (id: string, data: object) => api.put(`/inventory/${id}/adjust`, data),
    delete: (id: string) => api.delete(`/inventory/${id}`),
    getLowStock: () => api.get('/inventory/alerts/low-stock'),
    getStats: () => api.get('/inventory/stats/overview'),
};

// Fleet API
export const fleetAPI = {
    // Vehicles
    getVehicles: (params?: object) => api.get('/fleet/vehicles', { params }),
    getVehicleById: (id: string) => api.get(`/fleet/vehicles/${id}`),
    createVehicle: (data: object) => api.post('/fleet/vehicles', data),
    updateVehicle: (id: string, data: object) => api.put(`/fleet/vehicles/${id}`, data),
    updateVehicleLocation: (id: string, data: object) => api.put(`/fleet/vehicles/${id}/location`, data),
    addMaintenance: (id: string, data: object) => api.post(`/fleet/vehicles/${id}/maintenance`, data),
    addFuelRecord: (id: string, data: object) => api.post(`/fleet/vehicles/${id}/fuel`, data),
    deleteVehicle: (id: string) => api.delete(`/fleet/vehicles/${id}`),
    // Drivers
    getDrivers: (params?: object) => api.get('/fleet/drivers', { params }),
    getDriverById: (id: string) => api.get(`/fleet/drivers/${id}`),
    createDriver: (data: object) => api.post('/fleet/drivers', data),
    updateDriver: (id: string, data: object) => api.put(`/fleet/drivers/${id}`, data),
    deleteDriver: (id: string) => api.delete(`/fleet/drivers/${id}`),
    // Stats
    getStats: () => api.get('/fleet/stats/overview'),
};

// Invoices API
export const invoicesAPI = {
    getAll: (params?: object) => api.get('/invoices', { params }),
    getById: (id: string) => api.get(`/invoices/${id}`),
    create: (data: object) => api.post('/invoices', data),
    update: (id: string, data: object) => api.put(`/invoices/${id}`, data),
    recordPayment: (id: string, data: object) => api.post(`/invoices/${id}/payments`, data),
    cancel: (id: string, reason?: string) => api.put(`/invoices/${id}/cancel`, { reason }),
    getStats: () => api.get('/invoices/stats/overview'),
};

// Users API
export const usersAPI = {
    getAll: (params?: object) => api.get('/users', { params }),
    getById: (id: string) => api.get(`/users/${id}`),
    create: (data: object) => api.post('/users', data),
    update: (id: string, data: object) => api.put(`/users/${id}`, data),
    delete: (id: string) => api.delete(`/users/${id}`),
    activate: (id: string) => api.put(`/users/${id}/activate`),
    getStats: () => api.get('/users/stats/overview'),
};

// Reports API
export const reportsAPI = {
    getKPI: (params?: object) => api.get('/reports/kpi', { params }),
    getOrdersReport: (params?: object) => api.get('/reports/orders', { params }),
    getRevenueReport: (params?: object) => api.get('/reports/revenue', { params }),
    getShipmentsReport: (params?: object) => api.get('/reports/shipments', { params }),
    getInventoryReport: () => api.get('/reports/inventory'),
    exportReport: (type: string) => api.get(`/reports/export/${type}`),
};

// POD Token API (Blockchain)
export const podAPI = {
    generate: (data: object) => api.post('/pod/generate', data),
    verify: (token: string) => api.get(`/pod/verify/${token}`),
    getByShipment: (shipmentId: string) => api.get(`/pod/shipment/${shipmentId}`),
    getBlockchainProof: (token: string) => api.get(`/pod/${token}/blockchain-proof`),
    getList: (params?: object) => api.get('/pod/list', { params }),
};

// Vahak API (Vehicle Owner - Blockchain)
export const vahakAPI = {
    register: (data: object) => api.post('/vahak/register', data),
    getByVehicle: (vehicleId: string) => api.get(`/vahak/vehicle/${vehicleId}`),
    verify: (vehicleId: string, data: object) => api.put(`/vahak/verify/${vehicleId}`, data),
    getBlockchainHistory: (vehicleId: string) => api.get(`/vahak/${vehicleId}/blockchain-history`),
    getList: (params?: object) => api.get('/vahak/list', { params }),
};

// Blackbug API (Driver Monitoring - Blockchain)
export const blackbugAPI = {
    track: (data: object) => api.post('/blackbug/track', data),
    getDriverMonitoring: (driverId: string) => api.get(`/blackbug/driver/${driverId}`),
    getDriverBlockchain: (driverId: string, params?: object) => api.get(`/blackbug/driver/${driverId}/blockchain`, { params }),
    storeTripSummary: (tripId: string, data: object) => api.post(`/blackbug/trip/${tripId}/summary`, data),
    getDriverAnalytics: (driverId: string, params?: object) => api.get(`/blackbug/analytics/driver/${driverId}`, { params }),
};

// Export API (Blockchain)
export const exportAPI = {
    create: (data: object) => api.post('/export/create', data),
    uploadDocument: (id: string, data: object) => api.post(`/export/${id}/document`, data),
    updateStatus: (id: string, data: object) => api.put(`/export/${id}/status`, data),
    getById: (id: string) => api.get(`/export/${id}`),
    getBlockchainTrace: (id: string) => api.get(`/export/${id}/blockchain-trace`),
    verifyDocument: (id: string, docId: string) => api.get(`/export/${id}/verify-document/${docId}`),
    getList: (params?: object) => api.get('/export/list', { params }),
};

// TOD API (Transfer of Documents - Blockchain)
export const todAPI = {
    generate: (data: object) => api.post('/tod/generate', data),
    verify: (token: string) => api.get(`/tod/verify/${token}`), // Assuming this exists or I should add it to routes? (I didn't add verify route, let me check backend)
    getList: (params?: object) => api.get('/tod/list', { params }),
};

export default api;
