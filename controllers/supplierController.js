const { Supplier, SupplierTransaction } = require('../models');
const { isValidSriLankanPhone } = require('../utils/validation');

// Generate unique ID
const generateId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Format supplier for response
const formatSupplier = (supplier) => ({
    id: supplier.id,
    name: supplier.name,
    phone: supplier.phone,
    phone2: supplier.phone2,
    email: supplier.email,
    address: supplier.address,
    totalSupplied: parseFloat(supplier.totalSupplied) || 0,
    totalPaid: parseFloat(supplier.totalPaid) || 0,
    totalOutstanding: parseFloat(supplier.totalOutstanding) || 0,
    createdAt: supplier.createdAt
});

// Get all suppliers
exports.getAllSuppliers = async (req, res) => {
    try {
        const suppliers = await Supplier.findAll({
            order: [['name', 'ASC']]
        });
        res.json({ success: true, data: suppliers.map(formatSupplier) });
    } catch (error) {
        console.error('Error fetching suppliers:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Get single supplier
exports.getSupplierById = async (req, res) => {
    try {
        const supplier = await Supplier.findByPk(req.params.id, {
            include: [
                { model: SupplierTransaction, as: 'transactions', limit: 10, order: [['createdAt', 'DESC']] }
            ]
        });

        if (!supplier) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Supplier not found' } });
        }

        const supplierData = formatSupplier(supplier);
        supplierData.recentTransactions = supplier.transactions || [];

        res.json({ success: true, data: supplierData });
    } catch (error) {
        console.error('Error fetching supplier:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Create supplier
exports.createSupplier = async (req, res) => {
    try {
        const { name, phone, phone2, email, address } = req.body;

        if (!name || !phone || !email || !address) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Name, phone, email, and address are required' }
            });
        }

        if (phone && !isValidSriLankanPhone(phone)) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Invalid primary Sri Lankan phone number' }
            });
        }

        if (phone2 && !isValidSriLankanPhone(phone2)) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Invalid secondary Sri Lankan phone number' }
            });
        }

        // Check for existing supplier with same phone
        const existingSupplier = await Supplier.findOne({ where: { phone } });
        if (existingSupplier) {
            return res.status(400).json({
                success: false,
                error: { code: 'DUPLICATE_ENTRY', message: 'Supplier with this phone number already exists' }
            });
        }

        const supplier = await Supplier.create({
            id: generateId('sup'),
            name,
            phone,
            phone2: phone2 || null,
            email: email || null,
            address: address || null,
            totalSupplied: 0,
            totalPaid: 0,
            totalOutstanding: 0
        });

        res.status(201).json({ success: true, data: formatSupplier(supplier), message: 'Supplier created successfully' });
    } catch (error) {
        console.error('Error creating supplier:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Update supplier
exports.updateSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findByPk(req.params.id);

        if (!supplier) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Supplier not found' } });
        }

        const { name, phone, phone2, email, address, totalSupplied, totalPaid, totalOutstanding } = req.body;

        // Check for duplicate phone if phone is being updated
        if (phone && phone !== supplier.phone) {
            if (!isValidSriLankanPhone(phone)) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'VALIDATION_ERROR', message: 'Invalid primary Sri Lankan phone number' }
                });
            }

            const existingSupplier = await Supplier.findOne({ where: { phone } });
            if (existingSupplier) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'DUPLICATE_ENTRY', message: 'Supplier with this phone number already exists' }
                });
            }
        }

        if (phone2 && !isValidSriLankanPhone(phone2)) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Invalid secondary Sri Lankan phone number' }
            });
        }

        await supplier.update({
            name: name !== undefined ? name : supplier.name,
            phone: phone !== undefined ? phone : supplier.phone,
            phone2: phone2 !== undefined ? phone2 : supplier.phone2,
            email: email !== undefined ? email : supplier.email,
            address: address !== undefined ? address : supplier.address,
            totalSupplied: totalSupplied !== undefined ? totalSupplied : supplier.totalSupplied,
            totalPaid: totalPaid !== undefined ? totalPaid : supplier.totalPaid,
            totalOutstanding: totalOutstanding !== undefined ? totalOutstanding : supplier.totalOutstanding
        });

        res.json({ success: true, data: formatSupplier(supplier), message: 'Supplier updated successfully' });
    } catch (error) {
        console.error('Error updating supplier:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Delete supplier
exports.deleteSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findByPk(req.params.id);

        if (!supplier) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Supplier not found' } });
        }

        // Check if supplier has outstanding balance
        if (parseFloat(supplier.totalOutstanding) > 0) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Cannot delete supplier with outstanding balance' }
            });
        }

        await supplier.destroy();
        res.json({ success: true, message: 'Supplier deleted successfully' });
    } catch (error) {
        console.error('Error deleting supplier:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};
