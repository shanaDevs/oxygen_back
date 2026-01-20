module.exports = (sequelize, DataTypes) => {
    const Bottle = sequelize.define('Bottle', {
        id: {
            type: DataTypes.STRING(50),
            primaryKey: true
        },
        serialNumber: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            field: 'serial_number'
        },
        capacityLiters: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            field: 'capacity_liters'
        },
        bottleTypeId: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'bottle_type_id'
        },
        status: {
            type: DataTypes.ENUM('empty', 'filled', 'with_customer'),
            defaultValue: 'empty'
        },
        customerId: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'customer_id'
        },
        customerName: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'customer_name'
        },
        filledDate: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'filled_date'
        },
        issuedDate: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'issued_date'
        }
    }, {
        tableName: 'bottles',
        timestamps: true,
        underscored: true
    });

    return Bottle;
};
