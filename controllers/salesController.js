const { Sale, Customer } = require('../models');

// Generate unique ID
const generateId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Format sale for response
const formatSale = (sale) => ({
    id: sale.id,
    items: sale.items || [],
    subtotal: parseFloat(sale.subtotal) || 0,
    tax: parseFloat(sale.tax) || 0,
    discount: parseFloat(sale.discount) || 0,
    total: parseFloat(sale.total) || 0,
    paymentMethod: sale.paymentMethod,
    status: sale.status,
    customerId: sale.customerId,
    userId: sale.userId,
    createdAt: sale.createdAt
});

// Get all sales
exports.getAllSales = async (req, res) => {
    try {
        const { status, paymentMethod } = req.query;
        const where = {};
        
        if (status) {
            where.status = status;
        }
        if (paymentMethod) {
            where.paymentMethod = paymentMethod;
        }
        
        const sales = await Sale.findAll({
            where,
            order: [['createdAt', 'DESC']]
        });
        
        res.json({ success: true, data: sales.map(formatSale) });
    } catch (error) {
        console.error('Error fetching sales:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Get single sale
exports.getSaleById = async (req, res) => {
    try {
        const sale = await Sale.findByPk(req.params.id);
        
        if (!sale) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Sale not found' } });
        }
        
        res.json({ success: true, data: formatSale(sale) });
    } catch (error) {
        console.error('Error fetching sale:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Create sale
exports.createSale = async (req, res) => {
    try {
        const { items, subtotal, tax, discount, total, paymentMethod, status, customerId, userId } = req.body;
        
        if (!items || !total) {
            return res.status(400).json({ 
                success: false, 
                error: { code: 'VALIDATION_ERROR', message: 'Items and total are required' } 
            });
        }
        
        const sale = await Sale.create({
            id: generateId('sale'),
            items,
            subtotal: subtotal || 0,
            tax: tax || 0,
            discount: discount || 0,
            total,
            paymentMethod: paymentMethod || 'cash',
            status: status || 'completed',
            customerId: customerId || null,
            userId: userId || null
        });
        
        res.status(201).json({ success: true, data: formatSale(sale), message: 'Sale created successfully' });
    } catch (error) {
        console.error('Error creating sale:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Update sale status
exports.updateSale = async (req, res) => {
    try {
        const sale = await Sale.findByPk(req.params.id);
        
        if (!sale) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Sale not found' } });
        }
        
        const { status } = req.body;
        
        await sale.update({
            status: status !== undefined ? status : sale.status
        });
        
        res.json({ success: true, data: formatSale(sale), message: 'Sale updated successfully' });
    } catch (error) {
        console.error('Error updating sale:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};
