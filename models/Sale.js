module.exports = (sequelize, DataTypes) => {
    const Sale = sequelize.define('Sale', {
        id: {
            type: DataTypes.STRING(50),
            primaryKey: true
        },
        items: {
            type: DataTypes.JSON,
            allowNull: true
        },
        subtotal: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0.00
        },
        tax: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0.00
        },
        discount: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0.00
        },
        total: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false
        },
        paymentMethod: {
            type: DataTypes.ENUM('cash', 'card', 'mobile'),
            defaultValue: 'cash',
            field: 'payment_method'
        },
        status: {
            type: DataTypes.ENUM('completed', 'pending', 'cancelled'),
            defaultValue: 'completed'
        },
        customerId: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'customer_id'
        },
        userId: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'user_id'
        }
    }, {
        tableName: 'sales',
        timestamps: true,
        underscored: true
    });

    return Sale;
};
