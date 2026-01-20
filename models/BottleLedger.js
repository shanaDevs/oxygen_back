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
        operationType: {
            type: DataTypes.ENUM('created', 'filled', 'issued', 'returned', 'refilled', 'updated', 'deleted', 'adjustment'),
            allowNull: false,
            field: 'operation_type',
            comment: 'Type of operation performed on the bottle'
        },
        previousStatus: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'previous_status',
            comment: 'Status before the operation'
        },
        newStatus: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'new_status',
            comment: 'Status after the operation'
        },
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
        transactionId: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'transaction_id',
            comment: 'Related customer transaction ID if applicable'
        },
        tankHistoryId: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'tank_history_id',
            comment: 'Related tank history ID if applicable'
        },
        litersUsed: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: true,
            defaultValue: 0,
            field: 'liters_used',
            comment: 'Liters of oxygen used (for filling operations)'
        },
        amount: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: true,
            defaultValue: 0,
            comment: 'Amount associated with this operation'
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Additional notes or details'
        },
        performedBy: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: 'performed_by',
            comment: 'User who performed the operation'
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
            { fields: ['created_at'] },
            { fields: ['serial_number'] }
        ]
    });

    return BottleLedger;
};
