module.exports = (sequelize, DataTypes) => {
    const SupplierTransaction = sequelize.define('SupplierTransaction', {
        id: {
            type: DataTypes.STRING(50),
            primaryKey: true
        },
        supplierId: {
            type: DataTypes.STRING(50),
            allowNull: false,
            field: 'supplier_id'
        },
        supplierName: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'supplier_name'
        },
        litersSupplied: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            field: 'liters_supplied'
        },
        pricePerLiter: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0.00,
            field: 'price_per_liter'
        },
        totalAmount: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            field: 'total_amount'
        },
        amountPaid: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0.00,
            field: 'amount_paid'
        },
        outstanding: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0.00
        },
        paymentStatus: {
            type: DataTypes.ENUM('full', 'partial', 'outstanding'),
            defaultValue: 'full',
            field: 'payment_status'
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'supplier_transactions',
        timestamps: true,
        underscored: true,
        updatedAt: false
    });

    return SupplierTransaction;
};
