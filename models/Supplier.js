module.exports = (sequelize, DataTypes) => {
    const Supplier = sequelize.define('Supplier', {
        id: {
            type: DataTypes.STRING(50),
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        phone: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        address: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        totalSupplied: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0.00,
            field: 'total_supplied'
        },
        totalPaid: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0.00,
            field: 'total_paid'
        },
        totalOutstanding: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0.00,
            field: 'total_outstanding'
        }
    }, {
        tableName: 'suppliers',
        timestamps: true,
        underscored: true
    });

    return Supplier;
};
