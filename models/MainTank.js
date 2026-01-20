module.exports = (sequelize, DataTypes) => {
    const MainTank = sequelize.define('MainTank', {
        id: {
            type: DataTypes.STRING(50),
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        capacityLiters: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            field: 'capacity_liters'
        },
        currentLevelLiters: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0.00,
            field: 'current_level_liters'
        },
        lastRefillDate: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'last_refill_date'
        },
        lastRefillAmount: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0.00,
            field: 'last_refill_amount'
        }
    }, {
        tableName: 'main_tank',
        timestamps: true,
        underscored: true
    });

    return MainTank;
};
