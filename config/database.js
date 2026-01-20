const { Sequelize } = require('sequelize');
require('dotenv').config();

// Lazy initialization for serverless environments
let sequelize = null;

const getSequelize = () => {
    if (!sequelize) {
        sequelize = new Sequelize(
            process.env.DB_NAME || 'oxygen_refilling_center',
            process.env.DB_USER || 'root',
            process.env.DB_PASSWORD || 'DB_PASSWORD',
            {
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 3306,
                dialect: 'mysql',
                logging: process.env.NODE_ENV === 'development' ? console.log : false,
                pool: {
                    max: 5,
                    min: 0,
                    acquire: 30000,
                    idle: 10000
                },
                define: {
                    timestamps: true,
                    underscored: true,
                    freezeTableName: false
                },
                dialectOptions: process.env.NODE_ENV === 'production' ? {
                    ssl: {
                        require: true,
                        rejectUnauthorized: false
                    }
                } : {}
            }
        );
    }
    return sequelize;
};

// For backward compatibility, create a getter
Object.defineProperty(module.exports, 'sequelize', {
    get: getSequelize
});

module.exports.Sequelize = Sequelize;
module.exports.getSequelize = getSequelize;

