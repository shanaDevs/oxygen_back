const express = require('express');
const router = express.Router();
const { Sale, Bottle, BottleLedger, Customer, Supplier, SupplierTransaction, SupplierPayment } = require('../models');
const {
    generateInvoicePDF,
    generateBottleLedgerPDF,
    generateCustomerStatementPDF,
    generateSupplierStatementPDF,
    generatePaymentReceiptPDF
} = require('../utils/pdfGenerator');

/**
 * @swagger
 * /api/pdf/invoice/{saleId}:
 *   get:
 *     summary: Generate invoice PDF for a sale
 *     tags: [PDF]
 */
router.get('/invoice/:saleId', async (req, res) => {
    try {
        const sale = await Sale.findByPk(req.params.saleId);

        if (!sale) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Sale not found' } });
        }

        generateInvoicePDF(sale.toJSON(), res);
    } catch (error) {
        console.error('Error generating invoice PDF:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
});

/**
 * @swagger
 * /api/pdf/invoice-by-number/{invoiceNumber}:
 *   get:
 *     summary: Generate invoice PDF by invoice number
 *     tags: [PDF]
 */
router.get('/invoice-by-number/:invoiceNumber', async (req, res) => {
    try {
        const sale = await Sale.findOne({ where: { invoiceNumber: req.params.invoiceNumber } });

        if (!sale) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } });
        }

        generateInvoicePDF(sale.toJSON(), res);
    } catch (error) {
        console.error('Error generating invoice PDF:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
});

/**
 * @swagger
 * /api/pdf/bottle-ledger/{bottleId}:
 *   get:
 *     summary: Generate bottle ledger PDF
 *     tags: [PDF]
 */
router.get('/bottle-ledger/:bottleId', async (req, res) => {
    try {
        const bottle = await Bottle.findByPk(req.params.bottleId);

        if (!bottle) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Bottle not found' } });
        }

        const ledgerEntries = await BottleLedger.findAll({
            where: { bottleId: req.params.bottleId },
            order: [['createdAt', 'DESC']],
            limit: 100
        });

        generateBottleLedgerPDF(bottle.toJSON(), ledgerEntries.map(e => e.toJSON()), res);
    } catch (error) {
        console.error('Error generating bottle ledger PDF:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
});

/**
 * @swagger
 * /api/pdf/bottle-ledger-by-serial/{serialNumber}:
 *   get:
 *     summary: Generate bottle ledger PDF by serial number
 *     tags: [PDF]
 */
router.get('/bottle-ledger-by-serial/:serialNumber', async (req, res) => {
    try {
        const bottle = await Bottle.findOne({ where: { serialNumber: req.params.serialNumber } });

        if (!bottle) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Bottle not found' } });
        }

        const ledgerEntries = await BottleLedger.findAll({
            where: { bottleId: bottle.id },
            order: [['createdAt', 'DESC']],
            limit: 100
        });

        generateBottleLedgerPDF(bottle.toJSON(), ledgerEntries.map(e => e.toJSON()), res);
    } catch (error) {
        console.error('Error generating bottle ledger PDF:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
});

/**
 * @swagger
 * /api/pdf/customer-statement/{customerId}:
 *   get:
 *     summary: Generate customer statement PDF
 *     tags: [PDF]
 */
router.get('/customer-statement/:customerId', async (req, res) => {
    try {
        const customer = await Customer.findByPk(req.params.customerId);

        if (!customer) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Customer not found' } });
        }

        // Get customer's sales
        const sales = await Sale.findAll({
            where: { customerId: req.params.customerId },
            order: [['createdAt', 'DESC']],
            limit: 50
        });

        const outstanding = parseFloat(customer.totalCredit) || 0;

        generateCustomerStatementPDF(
            customer.toJSON(),
            sales.map(s => s.toJSON()),
            outstanding,
            res
        );
    } catch (error) {
        console.error('Error generating customer statement PDF:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
});

/**
 * @swagger
 * /api/pdf/supplier-statement/{supplierId}:
 *   get:
 *     summary: Generate supplier statement PDF
 *     tags: [PDF]
 */
router.get('/supplier-statement/:supplierId', async (req, res) => {
    try {
        let supplier;
        let transactions;
        let payments;

        if (req.params.supplierId === 'all') {
            // Global view
            const allSuppliers = await Supplier.findAll();
            const totalOutstanding = allSuppliers.reduce((sum, s) => sum + parseFloat(s.totalOutstanding || 0), 0);

            supplier = {
                name: 'ALL SUPPLIERS - GLOBAL STATEMENT',
                phone: 'Multi-vendor Report',
                address: 'Oxygen Refilling Center Network',
                totalOutstanding: totalOutstanding
            };

            transactions = await SupplierTransaction.findAll({
                order: [['createdAt', 'DESC']],
                limit: 100
            });

            payments = await SupplierPayment.findAll({
                order: [['paymentDate', 'DESC']],
                limit: 100
            });
        } else {
            // Single supplier view
            supplier = await Supplier.findByPk(req.params.supplierId);

            if (!supplier) {
                return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Supplier not found' } });
            }

            supplier = supplier.toJSON();

            transactions = await SupplierTransaction.findAll({
                where: { supplierId: req.params.supplierId },
                order: [['createdAt', 'DESC']],
                limit: 50
            });

            payments = await SupplierPayment.findAll({
                where: { supplierId: req.params.supplierId },
                order: [['paymentDate', 'DESC']],
                limit: 50
            });

            transactions = transactions.map(t => t.toJSON());
            payments = payments.map(p => p.toJSON());
        }

        generateSupplierStatementPDF(
            supplier,
            transactions,
            payments,
            res
        );
    } catch (error) {
        console.error('Error generating supplier statement PDF:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
});

/**
 * @swagger
 * /api/pdf/payment-receipt:
 *   get:
 *     summary: Generate payment receipt PDF (dynamic)
 *     tags: [PDF]
 *     parameters:
 *       - in: query
 *         name: id
 *         type: string
 *       - in: query
 *         name: name
 *         type: string
 *       - in: query
 *         name: amount
 *         type: number
 *       - in: query
 *         name: type
 *         type: string
 *         enum: [customer, supplier]
 */
router.get('/payment-receipt', (req, res) => {
    try {
        const { id, name, amount, type, method, remainingBalance, notes, phone } = req.query;

        generatePaymentReceiptPDF({
            id: id || `RCP-${Date.now()}`,
            name: name || 'Valued Customer',
            amount: parseFloat(amount) || 0,
            type: type || 'customer',
            method: method || 'Cash',
            remainingBalance: remainingBalance !== undefined ? parseFloat(remainingBalance) : undefined,
            notes: notes || '',
            phone: phone || '',
            createdAt: new Date()
        }, res);
    } catch (error) {
        console.error('Error generating payment receipt PDF:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
});

module.exports = router;
