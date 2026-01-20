module.exports = (sequelize, DataTypes) => {
    const Customer = sequelize.define('Customer', {
        id: {
            type: DataTypes.STRING(50),
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        phone: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        address: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        loyaltyPoints: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'loyalty_points'
        },
        totalCredit: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0.00,
            field: 'total_credit'
        },
        bottlesInHand: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'bottles_in_hand'
        }
    }, {
        tableName: 'customers',
        timestamps: true,
        underscored: true
    });

    return Customer;
};
