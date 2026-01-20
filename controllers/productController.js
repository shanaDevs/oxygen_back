const { Product, Category } = require('../models');

// Generate unique ID
const generateId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Format product for response
const formatProduct = (product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    price: parseFloat(product.price) || 0,
    categoryId: product.categoryId,
    stock: product.stock || 0,
    sku: product.sku,
    image: product.image,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt
});

// Format category for response
const formatCategory = (category) => ({
    id: category.id,
    name: category.name,
    description: category.description,
    createdAt: category.createdAt
});

// === Products ===

// Get all products
exports.getAllProducts = async (req, res) => {
    try {
        const { categoryId } = req.query;
        const where = {};
        
        if (categoryId) {
            where.categoryId = categoryId;
        }
        
        const products = await Product.findAll({
            where,
            order: [['name', 'ASC']]
        });
        
        res.json({ success: true, data: products.map(formatProduct) });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Get single product
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        
        if (!product) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } });
        }
        
        res.json({ success: true, data: formatProduct(product) });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Create product
exports.createProduct = async (req, res) => {
    try {
        const { name, description, price, categoryId, stock, sku, image } = req.body;
        
        if (!name || price === undefined) {
            return res.status(400).json({ 
                success: false, 
                error: { code: 'VALIDATION_ERROR', message: 'Name and price are required' } 
            });
        }
        
        const product = await Product.create({
            id: generateId('prod'),
            name,
            description: description || null,
            price,
            categoryId: categoryId || null,
            stock: stock || 0,
            sku: sku || null,
            image: image || null
        });
        
        res.status(201).json({ success: true, data: formatProduct(product), message: 'Product created successfully' });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Update product
exports.updateProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        
        if (!product) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } });
        }
        
        const { name, description, price, categoryId, stock, sku, image } = req.body;
        
        await product.update({
            name: name !== undefined ? name : product.name,
            description: description !== undefined ? description : product.description,
            price: price !== undefined ? price : product.price,
            categoryId: categoryId !== undefined ? categoryId : product.categoryId,
            stock: stock !== undefined ? stock : product.stock,
            sku: sku !== undefined ? sku : product.sku,
            image: image !== undefined ? image : product.image
        });
        
        res.json({ success: true, data: formatProduct(product), message: 'Product updated successfully' });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Delete product
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        
        if (!product) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } });
        }
        
        await product.destroy();
        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// === Categories ===

// Get all categories
exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.findAll({
            order: [['name', 'ASC']]
        });
        res.json({ success: true, data: categories.map(formatCategory) });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Create category
exports.createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        
        if (!name) {
            return res.status(400).json({ 
                success: false, 
                error: { code: 'VALIDATION_ERROR', message: 'Name is required' } 
            });
        }
        
        const category = await Category.create({
            id: generateId('cat'),
            name,
            description: description || null
        });
        
        res.status(201).json({ success: true, data: formatCategory(category), message: 'Category created successfully' });
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};
