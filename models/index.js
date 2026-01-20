const { sequelize, Sequelize } = require('../config/database');

// Import models
const User = require('./users/User')(sequelize, Sequelize);
const Role = require('./users/Role')(sequelize, Sequelize);

// Oxygen Refilling Center Models
const Customer = require('./Customer')(sequelize, Sequelize);
const Supplier = require('./Supplier')(sequelize, Sequelize);
const BottleType = require('./BottleType')(sequelize, Sequelize);
const Bottle = require('./Bottle')(sequelize, Sequelize);
const MainTank = require('./MainTank')(sequelize, Sequelize);
const TankHistory = require('./TankHistory')(sequelize, Sequelize);
const CustomerTransaction = require('./CustomerTransaction')(sequelize, Sequelize);
const SupplierTransaction = require('./SupplierTransaction')(sequelize, Sequelize);
const Category = require('./Category')(sequelize, Sequelize);
const Product = require('./Product')(sequelize, Sequelize);
const Sale = require('./Sale')(sequelize, Sequelize);
const BottleLedger = require('./BottleLedger')(sequelize, Sequelize);

// User & Role relationship
User.belongsTo(Role, {
    foreignKey: 'roleId',
    as: 'role'
});

Role.hasMany(User, {
    foreignKey: 'roleId',
    as: 'users'
});

// Bottle & BottleType relationship
Bottle.belongsTo(BottleType, {
    foreignKey: 'bottleTypeId',
    as: 'bottleType'
});

BottleType.hasMany(Bottle, {
    foreignKey: 'bottleTypeId',
    as: 'bottles'
});

// Bottle & Customer relationship
Bottle.belongsTo(Customer, {
    foreignKey: 'customerId',
    as: 'customer'
});

Customer.hasMany(Bottle, {
    foreignKey: 'customerId',
    as: 'bottles'
});

// TankHistory & MainTank relationship
TankHistory.belongsTo(MainTank, {
    foreignKey: 'mainTankId',
    as: 'mainTank'
});

MainTank.hasMany(TankHistory, {
    foreignKey: 'mainTankId',
    as: 'history'
});

// TankHistory & Supplier relationship
TankHistory.belongsTo(Supplier, {
    foreignKey: 'supplierId',
    as: 'supplier'
});

// CustomerTransaction & Customer relationship
CustomerTransaction.belongsTo(Customer, {
    foreignKey: 'customerId',
    as: 'customer'
});

Customer.hasMany(CustomerTransaction, {
    foreignKey: 'customerId',
    as: 'transactions'
});

// SupplierTransaction & Supplier relationship
SupplierTransaction.belongsTo(Supplier, {
    foreignKey: 'supplierId',
    as: 'supplier'
});

Supplier.hasMany(SupplierTransaction, {
    foreignKey: 'supplierId',
    as: 'transactions'
});

// Product & Category relationship
Product.belongsTo(Category, {
    foreignKey: 'categoryId',
    as: 'category'
});

Category.hasMany(Product, {
    foreignKey: 'categoryId',
    as: 'products'
});

// Sale & Customer relationship
Sale.belongsTo(Customer, {
    foreignKey: 'customerId',
    as: 'customer'
});

// BottleLedger & Bottle relationship
BottleLedger.belongsTo(Bottle, {
    foreignKey: 'bottleId',
    as: 'bottle'
});

Bottle.hasMany(BottleLedger, {
    foreignKey: 'bottleId',
    as: 'ledgerEntries'
});

// BottleLedger & Customer relationship
BottleLedger.belongsTo(Customer, {
    foreignKey: 'customerId',
    as: 'customer'
});

module.exports = {
    sequelize,
    Sequelize,
    User,
    Role,
    Customer,
    Supplier,
    BottleType,
    Bottle,
    MainTank,
    TankHistory,
    CustomerTransaction,
    SupplierTransaction,
    Category,
    Product,
    Sale,
    BottleLedger
};
