module.exports = (sequelize, DataTypes) => {
    const BottleType = sequelize.define('BottleType', {
        id: {
            type: DataTypes.STRING(50),
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        capacityLiters: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            field: 'capacity_liters'
        },
        pricePerFill: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            field: 'price_per_fill'
        },
        depositAmount: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0.00,
            field: 'deposit_amount'
        }
    }, {
        tableName: 'bottle_types',
        timestamps: true,
        underscored: true
    });

    return BottleType;
};
