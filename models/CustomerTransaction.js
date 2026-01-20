module.exports = (sequelize, DataTypes) => {
    const CustomerTransaction = sequelize.define('CustomerTransaction', {
        id: {
            type: DataTypes.STRING(50),
            primaryKey: true
        },
        customerId: {
            type: DataTypes.STRING(50),
            allowNull: false,
            field: 'customer_id'
        },
        customerName: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'customer_name'
        },
        transactionType: {
            type: DataTypes.ENUM('issue', 'return', 'refill', 'payment'),
            allowNull: false,
            field: 'transaction_type'
        },
        bottleIds: {
            type: DataTypes.JSON,
            allowNull: true,
            field: 'bottle_ids'
        },
        bottleCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'bottle_count'
        },
        bottleType: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: 'bottle_type'
        },
        totalAmount: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0.00,
            field: 'total_amount'
        },
        amountPaid: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0.00,
            field: 'amount_paid'
        },
        creditAmount: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0.00,
            field: 'credit_amount'
        },
        paymentStatus: {
            type: DataTypes.ENUM('full', 'partial', 'credit'),
            defaultValue: 'full',
            field: 'payment_status'
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'customer_transactions',
        timestamps: true,
        underscored: true,
        updatedAt: false
    });

    return CustomerTransaction;
};
