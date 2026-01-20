module.exports = (sequelize, DataTypes) => {
    const Product = sequelize.define('Product', {
        id: {
            type: DataTypes.STRING(50),
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        price: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false
        },
        categoryId: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'category_id'
        },
        stock: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        sku: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        image: {
            type: DataTypes.STRING(500),
            allowNull: true
        }
    }, {
        tableName: 'products',
        timestamps: true,
        underscored: true
    });

    return Product;
};
