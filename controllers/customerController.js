const { Customer, CustomerTransaction, Bottle } = require('../models');
const { v4: uuidv4 } = require('uuid');

// Generate unique ID
const generateId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Format customer for response
const formatCustomer = (customer) => ({
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    loyaltyPoints: customer.loyaltyPoints || 0,
    totalCredit: parseFloat(customer.totalCredit) || 0,
    bottlesInHand: customer.bottlesInHand || 0,
    createdAt: customer.createdAt
});

// Get all customers
exports.getAllCustomers = async (req, res) => {
    try {
        const customers = await Customer.findAll({
            order: [['name', 'ASC']]
        });
        res.json({ success: true, data: customers.map(formatCustomer) });
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Get single customer
exports.getCustomerById = async (req, res) => {
    try {
        const customer = await Customer.findByPk(req.params.id, {
            include: [
                { model: Bottle, as: 'bottles' },
                { model: CustomerTransaction, as: 'transactions', limit: 10, order: [['createdAt', 'DESC']] }
            ]
        });
        
        if (!customer) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Customer not found' } });
        }
        
        const customerData = formatCustomer(customer);
        customerData.bottles = customer.bottles || [];
        customerData.recentTransactions = customer.transactions || [];
        
        res.json({ success: true, data: customerData });
    } catch (error) {
        console.error('Error fetching customer:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Create customer
exports.createCustomer = async (req, res) => {
    try {
        const { name, email, phone, address } = req.body;
        
        if (!name) {
            return res.status(400).json({ 
                success: false, 
                error: { code: 'VALIDATION_ERROR', message: 'Name is required' } 
            });
        }
        
        const customer = await Customer.create({
            id: generateId('cust'),
            name,
            email: email || null,
            phone: phone || null,
            address: address || null,
            loyaltyPoints: 0,
            totalCredit: 0,
            bottlesInHand: 0
        });
        
        res.status(201).json({ success: true, data: formatCustomer(customer), message: 'Customer created successfully' });
    } catch (error) {
        console.error('Error creating customer:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Update customer
exports.updateCustomer = async (req, res) => {
    try {
        const customer = await Customer.findByPk(req.params.id);
        
        if (!customer) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Customer not found' } });
        }
        
        const { name, email, phone, address, loyaltyPoints, totalCredit, bottlesInHand } = req.body;
        
        await customer.update({
            name: name !== undefined ? name : customer.name,
            email: email !== undefined ? email : customer.email,
            phone: phone !== undefined ? phone : customer.phone,
            address: address !== undefined ? address : customer.address,
            loyaltyPoints: loyaltyPoints !== undefined ? loyaltyPoints : customer.loyaltyPoints,
            totalCredit: totalCredit !== undefined ? totalCredit : customer.totalCredit,
            bottlesInHand: bottlesInHand !== undefined ? bottlesInHand : customer.bottlesInHand
        });
        
        res.json({ success: true, data: formatCustomer(customer), message: 'Customer updated successfully' });
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Delete customer
exports.deleteCustomer = async (req, res) => {
    try {
        const customer = await Customer.findByPk(req.params.id);
        
        if (!customer) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Customer not found' } });
        }
        
        // Check if customer has bottles
        const bottleCount = await Bottle.count({ where: { customerId: req.params.id } });
        if (bottleCount > 0) {
            return res.status(400).json({ 
                success: false, 
                error: { code: 'VALIDATION_ERROR', message: 'Cannot delete customer with bottles in hand. Return bottles first.' } 
            });
        }
        
        await customer.destroy();
        res.json({ success: true, message: 'Customer deleted successfully' });
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};
