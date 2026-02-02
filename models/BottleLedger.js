module.exports = (sequelize, DataTypes) => {
    const BottleLedger = sequelize.define('BottleLedger', {
        id: {
            type: DataTypes.STRING(50),
            primaryKey: true
        },
        bottleId: {
            type: DataTypes.STRING(50),
            allowNull: false,
            field: 'bottle_id'
        },
        serialNumber: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: 'serial_number'
        },
        // Operation type
        operationType: {
            type: DataTypes.ENUM(
                'received',      // Bottle arrived at center
                'created',       // New bottle added to system
                'filled',        // Bottle filled from tank
                'issued',        // Bottle issued to customer
                'returned',      // Bottle returned from customer
                'refilled',      // Re-fill operation
                'updated',       // Details updated
                'transferred',   // Transferred to another customer
                'maintenance',   // Sent for maintenance
                'retired',       // Bottle retired
                'adjustment'     // Manual adjustment
            ),
            allowNull: false,
            field: 'operation_type'
        },
        // Status tracking
        previousStatus: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'previous_status'
        },
        newStatus: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'new_status'
        },
        // Location tracking
        previousLocation: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'previous_location'
        },
        newLocation: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'new_location'
        },
        // Customer info
        customerId: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'customer_id'
        },
        customerName: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'customer_name'
        },
        // Related transactions
        transactionId: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'transaction_id'
        },
        saleId: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'sale_id'
        },
        tankHistoryId: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'tank_history_id'
        },
        // Fill info  
        kgUsed: {
            type: DataTypes.DECIMAL(15, 3),
            allowNull: true,
            defaultValue: 0,
            field: 'kg_used',
            comment: 'Kg of oxygen used for filling'
        },
        litersUsed: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: true,
            defaultValue: 0,
            field: 'liters_used',
            comment: 'Legacy - liters used'
        },
        // Financial
        amount: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: true,
            defaultValue: 0
        },
        // Notes
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        performedBy: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: 'performed_by'
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: 'created_at'
        }
    }, {
        tableName: 'bottle_ledger',
        timestamps: false,
        underscored: true,
        indexes: [
            { fields: ['bottle_id'] },
            { fields: ['operation_type'] },
            { fields: ['customer_id'] },
            { fields: ['sale_id'] },
            { fields: ['created_at'] },
            { fields: ['serial_number'] }
        ]
    });

    return BottleLedger;
};
