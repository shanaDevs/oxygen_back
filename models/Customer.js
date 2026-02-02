module.exports = (sequelize, DataTypes) => {
    const Customer = sequelize.define('Customer', {
        id: {
            type: DataTypes.STRING(50),
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        phone: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        address: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        // Customer type
        customerType: {
            type: DataTypes.ENUM('regular', 'wholesale', 'dealer'),
            defaultValue: 'regular',
            field: 'customer_type'
        },
        // Loyalty
        loyaltyPoints: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'loyalty_points'
        },
        // Credit/Outstanding
        totalCredit: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0.00,
            field: 'total_credit',
            comment: 'Total outstanding credit amount'
        },
        creditLimit: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0.00,
            field: 'credit_limit',
            comment: 'Maximum credit allowed'
        },
        // Bottle tracking
        bottlesInHand: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'bottles_in_hand',
            comment: 'Number of center bottles currently with customer'
        },
        ownedBottles: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'owned_bottles',
            comment: 'Number of bottles owned by customer'
        },
        // Statistics
        totalPurchases: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0,
            field: 'total_purchases'
        },
        totalPaid: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0,
            field: 'total_paid'
        },
        totalFills: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'total_fills'
        },
        // Status
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'is_active'
        },
        // Notes
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'customers',
        timestamps: true,
        underscored: true
    });

    return Customer;
};
