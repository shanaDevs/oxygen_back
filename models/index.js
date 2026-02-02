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
const SalePayment = require('./SalePayment')(sequelize, Sequelize);
const BottleLedger = require('./BottleLedger')(sequelize, Sequelize);
const Notification = require('./Notification')(sequelize, Sequelize);

// ==================== RELATIONSHIPS ====================

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

// Bottle & Customer relationship (current holder)
Bottle.belongsTo(Customer, {
    foreignKey: 'customerId',
    as: 'customer'
});

Customer.hasMany(Bottle, {
    foreignKey: 'customerId',
    as: 'bottles'
});

// Bottle & Customer relationship (owner)
Bottle.belongsTo(Customer, {
    foreignKey: 'ownerId',
    as: 'owner'
});

Customer.hasMany(Bottle, {
    foreignKey: 'ownerId',
    as: 'customerOwnedBottles'
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

Customer.hasMany(Sale, {
    foreignKey: 'customerId',
    as: 'sales'
});

// SalePayment & Sale relationship
SalePayment.belongsTo(Sale, {
    foreignKey: 'saleId',
    as: 'sale'
});

Sale.hasMany(SalePayment, {
    foreignKey: 'saleId',
    as: 'payments'
});

// SalePayment & Customer relationship
SalePayment.belongsTo(Customer, {
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

// BottleLedger & Sale relationship
BottleLedger.belongsTo(Sale, {
    foreignKey: 'saleId',
    as: 'sale'
});

// Notification & User relationship
Notification.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
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
    SalePayment,
    BottleLedger,
    Notification
};
