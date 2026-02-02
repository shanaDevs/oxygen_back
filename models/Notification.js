module.exports = (sequelize, DataTypes) => {
    const Notification = sequelize.define('Notification', {
        id: {
            type: DataTypes.STRING(50),
            primaryKey: true
        },
        // Notification type
        type: {
            type: DataTypes.ENUM(
                'tank_low',
                'tank_critical',
                'bottle_issue',
                'bottle_return',
                'payment_received',
                'payment_due',
                'sale_complete',
                'refill_complete',
                'system'
            ),
            allowNull: false
        },
        // Title and message
        title: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        // Priority
        priority: {
            type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
            defaultValue: 'medium'
        },
        // Related entity
        entityType: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'entity_type',
            comment: 'Type of related entity: sale, bottle, customer, tank, etc.'
        },
        entityId: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'entity_id'
        },
        // Data payload
        data: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Additional data related to the notification'
        },
        // Read status
        isRead: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'is_read'
        },
        readAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'read_at'
        },
        // User (if user-specific)
        userId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'user_id'
        }
    }, {
        tableName: 'notifications',
        timestamps: true,
        underscored: true
    });

    return Notification;
};
