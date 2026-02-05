/**
 * NotificationService.js
 * Handles real-time notifications via Socket.io
 */

class NotificationService {
    constructor() {
        this.io = null;
    }

    /**
     * Set the Socket.io instance
     * @param {Object} io - Socket.io instance
     */
    init(io) {
        this.io = io;
        console.log('🔔 [NotificationService] Initialized');
    }

    /**
     * Send notification to a specific user
     * @param {string} userId - ID of the user
     * @param {string} type - Notification type (e.g., 'STATUS_UPDATE', 'POD_GENERATED')
     * @param {Object} data - Notification payload
     */
    sendToUser(userId, type, data) {
        if (!this.io) {
            console.warn('⚠️ [NotificationService] Socket.io not initialized');
            return;
        }

        this.io.to(`user_${userId}`).emit('notification', {
            type,
            data,
            timestamp: new Date()
        });

        console.log(`🔔 [NotificationService] Emitted '${type}' to user_${userId}`);
    }

    /**
     * Send notification to all users in a group/role
     * @param {string} role - Role name (e.g., 'admin', 'driver')
     * @param {string} type - Notification type
     * @param {Object} data - Notification payload
     */
    broadcastToRole(role, type, data) {
        if (!this.io) return;

        this.io.to(`role_${role}`).emit('notification', {
            type,
            data,
            timestamp: new Date()
        });
    }

    /**
     * Send global notification
     * @param {string} type 
     * @param {Object} data 
     */
    broadcast(type, data) {
        if (!this.io) return;

        this.io.emit('notification', {
            type,
            data,
            timestamp: new Date()
        });
    }
}

module.exports = new NotificationService();
