const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Supplier:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Supplier ID
 *         name:
 *           type: string
 *           description: Supplier name
 *         phone:
 *           type: string
 *           description: Supplier phone number
 *         phone2:
 *           type: string
 *           description: Supplier additional phone number
 *         email:
 *           type: string
 *           description: Supplier email
 *         address:
 *           type: string
 *           description: Supplier address
 *         totalSupplied:
 *           type: number
 *           description: Total liters of oxygen supplied
 *         totalPaid:
 *           type: number
 *           description: Total amount paid to supplier
 *         totalOutstanding:
 *           type: number
 *           description: Total outstanding amount to supplier
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/suppliers:
 *   get:
 *     summary: Get all suppliers
 *     tags: [Suppliers]
 *     responses:
 *       200:
 *         description: List of all suppliers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Supplier'
 */
router.get('/', supplierController.getAllSuppliers);

/**
 * @swagger
 * /api/suppliers/{id}:
 *   get:
 *     summary: Get supplier by ID with transactions
 *     tags: [Suppliers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Supplier details with transactions
 *       404:
 *         description: Supplier not found
 */
router.get('/:id', supplierController.getSupplierById);

/**
 * @swagger
 * /api/suppliers:
 *   post:
 *     summary: Create a new supplier
 *     tags: [Suppliers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - phone
 *               - email
 *               - address
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               phone2:
 *                 type: string
 *               email:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       201:
 *         description: Supplier created successfully
 *       400:
 *         description: Validation error
 */
router.post('/', supplierController.createSupplier);

/**
 * @swagger
 * /api/suppliers/{id}:
 *   put:
 *     summary: Update supplier
 *     tags: [Suppliers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               phone2:
 *                 type: string
 *               email:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Supplier updated successfully
 *       404:
 *         description: Supplier not found
 */
router.put('/:id', supplierController.updateSupplier);

/**
 * @swagger
 * /api/suppliers/{id}:
 *   delete:
 *     summary: Delete supplier
 *     tags: [Suppliers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Supplier deleted successfully
 *       400:
 *         description: Cannot delete supplier with outstanding balance
 *       404:
 *         description: Supplier not found
 */
router.delete('/:id', supplierController.deleteSupplier);

module.exports = router;
