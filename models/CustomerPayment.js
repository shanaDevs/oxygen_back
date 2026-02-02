module.exports = (sequelize, DataTypes) => {
    const CustomerPayment = sequelize.define('CustomerPayment', {
        id: {
            type: DataTypes.STRING(50),
            primaryKey: true
        },
        customerId: {
            type: DataTypes.STRING(50),
            allowNull: false,
            field: 'customer_id'
        },
        transactionId: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'transaction_id',
            comment: 'Reference to the bottle transaction this payment is for'
        },
        amount: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            defaultValue: 0.00
        },
        paymentMethod: {
            type: DataTypes.ENUM('cash', 'bank_transfer', 'cheque', 'card', 'other'),
            defaultValue: 'cash',
            field: 'payment_method'
        },
        paymentType: {
            type: DataTypes.ENUM('full', 'partial', 'advance'),
            defaultValue: 'full',
            field: 'payment_type'
        },
        reference: {
            type: DataTypes.STRING(255),
            allowNull: true,
            comment: 'Cheque number, transfer reference, etc.'
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        paymentDate: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: 'payment_date'
        }
    }, {
        tableName: 'customer_payments',
        timestamps: true,
        underscored: true,
        updatedAt: false
    });

    return CustomerPayment;
};
