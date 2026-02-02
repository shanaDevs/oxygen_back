module.exports = (sequelize, DataTypes) => {
    const SalePayment = sequelize.define('SalePayment', {
        id: {
            type: DataTypes.STRING(50),
            primaryKey: true
        },
        saleId: {
            type: DataTypes.STRING(50),
            allowNull: false,
            field: 'sale_id'
        },
        customerId: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'customer_id'
        },
        // Payment info
        amount: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false
        },
        paymentMethod: {
            type: DataTypes.ENUM('cash', 'bank_transfer', 'cheque', 'other'),
            defaultValue: 'cash',
            field: 'payment_method'
        },
        // Reference for bank/cheque payments
        reference: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        // Payment type
        paymentType: {
            type: DataTypes.ENUM('sale', 'outstanding', 'advance'),
            defaultValue: 'sale',
            field: 'payment_type'
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        receivedBy: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: 'received_by'
        },
        paymentDate: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: 'payment_date'
        }
    }, {
        tableName: 'sale_payments',
        timestamps: true,
        underscored: true
    });

    return SalePayment;
};
