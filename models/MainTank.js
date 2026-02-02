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
        // Tank capacity in TONS
        capacityTons: {
            type: DataTypes.DECIMAL(15, 3),
            allowNull: false,
            defaultValue: 10,
            field: 'capacity_tons',
            comment: 'Total tank capacity in tons'
        },
        // Current level in KG
        currentLevelKg: {
            type: DataTypes.DECIMAL(15, 3),
            defaultValue: 0.00,
            field: 'current_level_kg',
            comment: 'Current oxygen level in kilograms'
        },
        // Legacy field for backwards compatibility (calculated as currentLevelKg * some factor)
        capacityLiters: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: true,
            field: 'capacity_liters',
            comment: 'Legacy field - capacity in liters'
        },
        currentLevelLiters: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0.00,
            field: 'current_level_liters',
            comment: 'Legacy field - current level in liters'
        },
        lastRefillDate: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'last_refill_date'
        },
        lastRefillAmountKg: {
            type: DataTypes.DECIMAL(15, 3),
            defaultValue: 0.00,
            field: 'last_refill_amount_kg',
            comment: 'Last refill amount in kg'
        },
        lastRefillAmount: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0.00,
            field: 'last_refill_amount',
            comment: 'Legacy field'
        },
        // Alert thresholds
        lowLevelAlertKg: {
            type: DataTypes.DECIMAL(15, 3),
            defaultValue: 500,
            field: 'low_level_alert_kg',
            comment: 'Alert when tank level falls below this (kg)'
        },
        criticalLevelAlertKg: {
            type: DataTypes.DECIMAL(15, 3),
            defaultValue: 100,
            field: 'critical_level_alert_kg',
            comment: 'Critical alert threshold (kg)'
        }
    }, {
        tableName: 'main_tank',
        timestamps: true,
        underscored: true
    });

    return MainTank;
};
