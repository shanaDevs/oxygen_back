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
        // Bottle capacity in liters
        capacityLiters: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            field: 'capacity_liters',
            comment: 'Bottle capacity in liters (e.g., 47.5, 40, 10)'
        },
        // KG required to fill this bottle type
        refillKg: {
            type: DataTypes.DECIMAL(10, 3),
            allowNull: false,
            field: 'refill_kg',
            comment: 'Kilograms of oxygen required to fill this bottle type'
        },
        // Price per fill
        pricePerFill: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            field: 'price_per_fill'
        },
        // Deposit amount (if applicable)
        depositAmount: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0.00,
            field: 'deposit_amount'
        },
        // Description
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        // Active status
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'is_active'
        }
    }, {
        tableName: 'bottle_types',
        timestamps: true,
        underscored: true
    });

    return BottleType;
};
