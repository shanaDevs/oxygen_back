module.exports = (sequelize, DataTypes) => {
    const SupplierPayment = sequelize.define('SupplierPayment', {
        id: {
            type: DataTypes.STRING(50),
            primaryKey: true
        },
        supplierId: {
            type: DataTypes.STRING(50),
            allowNull: false,
            field: 'supplier_id'
        },
        // Optional: Link to specific transaction if paid against one
        transactionId: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'transaction_id'
        },
        amount: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false
        },
        paymentMethod: {
            type: DataTypes.ENUM('cash', 'bank_transfer', 'cheque', 'other'),
            defaultValue: 'cash',
            field: 'payment_method'
        },
        reference: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        paymentDate: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: 'payment_date'
        }
    }, {
        tableName: 'supplier_payments',
        timestamps: true,
        underscored: true
    });

    return SupplierPayment;
};
