module.exports = (sequelize, DataTypes) => {
    const TankHistory = sequelize.define('TankHistory', {
        id: {
            type: DataTypes.STRING(50),
            primaryKey: true
        },
        mainTankId: {
            type: DataTypes.STRING(50),
            allowNull: false,
            field: 'main_tank_id'
        },
        supplierId: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'supplier_id'
        },
        operationType: {
            type: DataTypes.ENUM('refill', 'fill_bottles', 'adjustment'),
            allowNull: false,
            field: 'operation_type'
        },
        litersBefore: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            field: 'liters_before'
        },
        litersChanged: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            field: 'liters_changed'
        },
        litersAfter: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            field: 'liters_after'
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'tank_history',
        timestamps: true,
        underscored: true,
        updatedAt: false
    });

    return TankHistory;
};
