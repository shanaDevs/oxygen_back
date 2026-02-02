module.exports = (sequelize, DataTypes) => {
    const TankHistory = sequelize.define('TankHistory', {
        id: {
            type: DataTypes.STRING(50),
            primaryKey: true
        },
        mainTankId: {
            type: DataTypes.STRING(50),
            allowNull: false,
            field: 'main_tank_id'
        },
        supplierId: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'supplier_id'
        },
        operationType: {
            type: DataTypes.ENUM('refill', 'fill_bottles', 'adjustment', 'loss'),
            allowNull: false,
            field: 'operation_type'
        },
        // KG-based fields (primary)
        kgBefore: {
            type: DataTypes.DECIMAL(15, 3),
            defaultValue: 0,
            field: 'kg_before',
            comment: 'Tank level in kg before operation'
        },
        kgChanged: {
            type: DataTypes.DECIMAL(15, 3),
            defaultValue: 0,
            field: 'kg_changed',
            comment: 'Amount of kg added or removed'
        },
        kgAfter: {
            type: DataTypes.DECIMAL(15, 3),
            defaultValue: 0,
            field: 'kg_after',
            comment: 'Tank level in kg after operation'
        },
        // Legacy liters fields
        litersBefore: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0,
            field: 'liters_before'
        },
        litersChanged: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0,
            field: 'liters_changed'
        },
        litersAfter: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0,
            field: 'liters_after'
        },
        // For bottle fills
        bottlesFilled: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'bottles_filled',
            comment: 'Number of bottles filled in this operation'
        },
        bottleIds: {
            type: DataTypes.JSON,
            allowNull: true,
            field: 'bottle_ids',
            comment: 'Array of bottle IDs filled'
        },
        // Payment info for refills
        totalAmount: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0,
            field: 'total_amount'
        },
        amountPaid: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0,
            field: 'amount_paid'
        },
        paymentStatus: {
            type: DataTypes.ENUM('pending', 'partial', 'full'),
            defaultValue: 'pending',
            field: 'payment_status'
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        performedBy: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: 'performed_by'
        }
    }, {
        tableName: 'tank_history',
        timestamps: true,
        underscored: true
    });

    return TankHistory;
};
