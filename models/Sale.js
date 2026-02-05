module.exports = (sequelize, DataTypes) => {
    const Sale = sequelize.define('Sale', {
        id: {
            type: DataTypes.STRING(50),
            primaryKey: true
        },
        // Invoice number
        invoiceNumber: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: 'sales_invoice_number_unique',
            field: 'invoice_number'
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
        customerPhone: {
            type: DataTypes.STRING(20),
            allowNull: true,
            field: 'customer_phone'
        },
        // Items (JSON array of bottle items)
        items: {
            type: DataTypes.JSON,
            allowNull: false,
            comment: 'Array of {bottleId, serialNumber, bottleTypeId, capacityLiters, refillKg, price}'
        },
        // Number of bottles
        bottleCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'bottle_count'
        },
        // Financial
        subtotal: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0
        },
        tax: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0
        },
        taxPercentage: {
            type: DataTypes.DECIMAL(5, 2),
            defaultValue: 0,
            field: 'tax_percentage'
        },
        discount: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0
        },
        discountPercentage: {
            type: DataTypes.DECIMAL(5, 2),
            defaultValue: 0,
            field: 'discount_percentage'
        },
        total: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false
        },
        // Payment
        paymentMethod: {
            type: DataTypes.ENUM('cash', 'credit', 'partial', 'bank_transfer'),
            defaultValue: 'cash',
            field: 'payment_method'
        },
        amountPaid: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0,
            field: 'amount_paid'
        },
        creditAmount: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0,
            field: 'credit_amount',
            comment: 'Outstanding credit amount'
        },
        changeAmount: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0,
            field: 'change_amount'
        },
        // Status
        status: {
            type: DataTypes.ENUM('pending', 'completed', 'cancelled', 'refunded'),
            defaultValue: 'completed'
        },
        paymentStatus: {
            type: DataTypes.ENUM('pending', 'partial', 'full'),
            defaultValue: 'full',
            field: 'payment_status'
        },
        // User who processed the sale
        userId: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'user_id'
        },
        userName: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: 'user_name'
        },
        // Notes
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        // Timestamps for the sale
        saleDate: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: 'sale_date'
        }
    }, {
        tableName: 'sales',
        timestamps: true,
        underscored: true
    });

    return Sale;
};
