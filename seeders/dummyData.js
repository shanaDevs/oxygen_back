const { 
    Customer, 
    Supplier, 
    BottleType, 
    Bottle, 
    MainTank, 
    TankHistory,
    CustomerTransaction,
    SupplierTransaction,
    Category,
    Product
} = require('../models');

// Generate unique ID
const generateId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const seedDummyData = async () => {
    try {
        console.log('🌱 Checking for dummy data...');
        
        // Check if data already exists
        const existingCustomers = await Customer.count();
        if (existingCustomers > 0) {
            console.log('ℹ️  Dummy data already exists, skipping seed.');
            return;
        }
        
        console.log('🌱 Seeding dummy data for Oxygen Refilling Center...');
        
        // ========================
        // 1. Create Main Tank
        // ========================
        const tank = await MainTank.create({
            id: 'tank-1',
            name: 'Main Oxygen Storage Tank',
            capacityLiters: 20000,
            currentLevelLiters: 15000,
            lastRefillDate: new Date(),
            lastRefillAmount: 5000
        });
        console.log('✅ Main tank created');
        
        // ========================
        // 2. Create Bottle Types
        // ========================
        const bottleTypes = await BottleType.bulkCreate([
            { id: 'type-1', name: 'Small', capacityLiters: 10, pricePerFill: 500, depositAmount: 2000 },
            { id: 'type-2', name: 'Medium', capacityLiters: 20, pricePerFill: 900, depositAmount: 3500 },
            { id: 'type-3', name: 'Large', capacityLiters: 40, pricePerFill: 1600, depositAmount: 5000 },
            { id: 'type-4', name: 'Extra Large', capacityLiters: 50, pricePerFill: 1900, depositAmount: 6000 }
        ]);
        console.log('✅ Bottle types created');
        
        // ========================
        // 3. Create Suppliers
        // ========================
        const suppliers = await Supplier.bulkCreate([
            {
                id: 'sup-1',
                name: 'Oxygen Lanka Pvt Ltd',
                phone: '011-2345678',
                email: 'info@oxygenlanka.lk',
                address: '123 Industrial Zone, Colombo',
                totalSupplied: 50000,
                totalPaid: 700000,
                totalOutstanding: 50000
            },
            {
                id: 'sup-2',
                name: 'BOC Gases Sri Lanka',
                phone: '011-8765432',
                email: 'sales@bocgas.lk',
                address: '456 Factory Road, Kelaniya',
                totalSupplied: 30000,
                totalPaid: 450000,
                totalOutstanding: 0
            },
            {
                id: 'sup-3',
                name: 'Industrial Gas Solutions',
                phone: '077-1234567',
                email: 'contact@igs.lk',
                address: '789 Commerce Street, Gampaha',
                totalSupplied: 20000,
                totalPaid: 280000,
                totalOutstanding: 20000
            }
        ]);
        console.log('✅ Suppliers created');
        
        // ========================
        // 4. Create Customers
        // ========================
        const customers = await Customer.bulkCreate([
            {
                id: 'cust-1',
                name: 'City Hospital',
                phone: '011-5551234',
                email: 'supplies@cityhospital.lk',
                address: '100 Hospital Road, Colombo 07',
                loyaltyPoints: 500,
                totalCredit: 25000,
                bottlesInHand: 5
            },
            {
                id: 'cust-2',
                name: 'Lanka Medical Center',
                phone: '011-5559876',
                email: 'procurement@lmc.lk',
                address: '200 Medical Lane, Colombo 03',
                loyaltyPoints: 350,
                totalCredit: 15000,
                bottlesInHand: 3
            },
            {
                id: 'cust-3',
                name: 'Asiri Surgical Hospital',
                phone: '011-5554321',
                email: 'orders@asiri.lk',
                address: '181 Kirula Road, Colombo 05',
                loyaltyPoints: 800,
                totalCredit: 0,
                bottlesInHand: 8
            },
            {
                id: 'cust-4',
                name: 'Nawaloka Hospital',
                phone: '011-5556789',
                email: 'supplies@nawaloka.lk',
                address: '23 Sri Saugathagama Mawatha, Colombo 02',
                loyaltyPoints: 600,
                totalCredit: 45000,
                bottlesInHand: 6
            },
            {
                id: 'cust-5',
                name: 'Welding Works Ltd',
                phone: '077-8889999',
                email: 'info@weldingworks.lk',
                address: '50 Industrial Estate, Ratmalana',
                loyaltyPoints: 150,
                totalCredit: 8000,
                bottlesInHand: 2
            },
            {
                id: 'cust-6',
                name: 'Home Care Solutions',
                phone: '077-1112222',
                email: 'orders@homecare.lk',
                address: '75 Galle Road, Dehiwala',
                loyaltyPoints: 200,
                totalCredit: 5000,
                bottlesInHand: 4
            }
        ]);
        console.log('✅ Customers created');
        
        // ========================
        // 5. Create Bottles
        // ========================
        const bottles = [];
        
        // Empty bottles
        for (let i = 1; i <= 12; i++) {
            bottles.push({
                id: `bot-e${i}`,
                serialNumber: `OXY-E${String(i).padStart(4, '0')}`,
                capacityLiters: [10, 20, 40][i % 3],
                bottleTypeId: [`type-1`, `type-2`, `type-3`][i % 3],
                status: 'empty',
                customerId: null,
                customerName: null
            });
        }
        
        // Filled bottles
        for (let i = 1; i <= 45; i++) {
            bottles.push({
                id: `bot-f${i}`,
                serialNumber: `OXY-F${String(i).padStart(4, '0')}`,
                capacityLiters: [10, 20, 40, 50][i % 4],
                bottleTypeId: [`type-1`, `type-2`, `type-3`, `type-4`][i % 4],
                status: 'filled',
                customerId: null,
                customerName: null,
                filledDate: new Date()
            });
        }
        
        // Bottles with customers
        const customerBottles = [
            { customerId: 'cust-1', customerName: 'City Hospital', count: 5 },
            { customerId: 'cust-2', customerName: 'Lanka Medical Center', count: 3 },
            { customerId: 'cust-3', customerName: 'Asiri Surgical Hospital', count: 8 },
            { customerId: 'cust-4', customerName: 'Nawaloka Hospital', count: 6 },
            { customerId: 'cust-5', customerName: 'Welding Works Ltd', count: 2 },
            { customerId: 'cust-6', customerName: 'Home Care Solutions', count: 4 }
        ];
        
        let bottleIndex = 1;
        for (const cb of customerBottles) {
            for (let i = 0; i < cb.count; i++) {
                bottles.push({
                    id: `bot-c${bottleIndex}`,
                    serialNumber: `OXY-C${String(bottleIndex).padStart(4, '0')}`,
                    capacityLiters: [10, 20, 40][bottleIndex % 3],
                    bottleTypeId: [`type-1`, `type-2`, `type-3`][bottleIndex % 3],
                    status: 'with_customer',
                    customerId: cb.customerId,
                    customerName: cb.customerName,
                    issuedDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
                });
                bottleIndex++;
            }
        }
        
        await Bottle.bulkCreate(bottles);
        console.log(`✅ ${bottles.length} bottles created`);
        
        // ========================
        // 6. Create Supplier Transactions
        // ========================
        const supplierTransactions = await SupplierTransaction.bulkCreate([
            {
                id: 'stx-1',
                supplierId: 'sup-1',
                supplierName: 'Oxygen Lanka Pvt Ltd',
                litersSupplied: 5000,
                pricePerLiter: 15,
                totalAmount: 75000,
                amountPaid: 75000,
                outstanding: 0,
                paymentStatus: 'full',
                notes: 'Monthly delivery - January'
            },
            {
                id: 'stx-2',
                supplierId: 'sup-1',
                supplierName: 'Oxygen Lanka Pvt Ltd',
                litersSupplied: 5000,
                pricePerLiter: 15,
                totalAmount: 75000,
                amountPaid: 25000,
                outstanding: 50000,
                paymentStatus: 'partial',
                notes: 'Emergency supply'
            },
            {
                id: 'stx-3',
                supplierId: 'sup-2',
                supplierName: 'BOC Gases Sri Lanka',
                litersSupplied: 3000,
                pricePerLiter: 15,
                totalAmount: 45000,
                amountPaid: 45000,
                outstanding: 0,
                paymentStatus: 'full',
                notes: 'Regular delivery'
            },
            {
                id: 'stx-4',
                supplierId: 'sup-3',
                supplierName: 'Industrial Gas Solutions',
                litersSupplied: 2000,
                pricePerLiter: 14,
                totalAmount: 28000,
                amountPaid: 8000,
                outstanding: 20000,
                paymentStatus: 'partial',
                notes: 'New supplier trial'
            }
        ]);
        console.log('✅ Supplier transactions created');
        
        // ========================
        // 7. Create Tank History
        // ========================
        await TankHistory.bulkCreate([
            {
                id: 'th-1',
                mainTankId: 'tank-1',
                supplierId: 'sup-1',
                operationType: 'refill',
                litersBefore: 10000,
                litersChanged: 5000,
                litersAfter: 15000,
                notes: 'Refill from Oxygen Lanka Pvt Ltd'
            },
            {
                id: 'th-2',
                mainTankId: 'tank-1',
                supplierId: null,
                operationType: 'fill_bottles',
                litersBefore: 16000,
                litersChanged: 1000,
                litersAfter: 15000,
                notes: 'Filled 25 bottles'
            }
        ]);
        console.log('✅ Tank history created');
        
        // ========================
        // 8. Create Customer Transactions
        // ========================
        const customerTransactions = await CustomerTransaction.bulkCreate([
            {
                id: 'ctx-1',
                customerId: 'cust-1',
                customerName: 'City Hospital',
                transactionType: 'issue',
                bottleIds: ['bot-c1', 'bot-c2'],
                bottleCount: 2,
                bottleType: '20L',
                totalAmount: 1800,
                amountPaid: 1800,
                creditAmount: 0,
                paymentStatus: 'full',
                notes: 'Regular supply'
            },
            {
                id: 'ctx-2',
                customerId: 'cust-1',
                customerName: 'City Hospital',
                transactionType: 'issue',
                bottleIds: ['bot-c3', 'bot-c4', 'bot-c5'],
                bottleCount: 3,
                bottleType: '40L',
                totalAmount: 4800,
                amountPaid: 0,
                creditAmount: 4800,
                paymentStatus: 'credit',
                notes: 'Emergency order - credit approved'
            },
            {
                id: 'ctx-3',
                customerId: 'cust-2',
                customerName: 'Lanka Medical Center',
                transactionType: 'issue',
                bottleIds: ['bot-c6', 'bot-c7', 'bot-c8'],
                bottleCount: 3,
                bottleType: '10L',
                totalAmount: 1500,
                amountPaid: 1000,
                creditAmount: 500,
                paymentStatus: 'partial',
                notes: 'Weekly supply'
            },
            {
                id: 'ctx-4',
                customerId: 'cust-3',
                customerName: 'Asiri Surgical Hospital',
                transactionType: 'issue',
                bottleIds: ['bot-c9', 'bot-c10'],
                bottleCount: 2,
                bottleType: '50L',
                totalAmount: 3800,
                amountPaid: 3800,
                creditAmount: 0,
                paymentStatus: 'full',
                notes: 'Cash payment'
            },
            {
                id: 'ctx-5',
                customerId: 'cust-4',
                customerName: 'Nawaloka Hospital',
                transactionType: 'payment',
                bottleIds: [],
                bottleCount: 0,
                bottleType: null,
                totalAmount: 0,
                amountPaid: 10000,
                creditAmount: -10000,
                paymentStatus: 'full',
                notes: 'Partial payment towards credit'
            }
        ]);
        console.log('✅ Customer transactions created');
        
        // ========================
        // 9. Create Categories
        // ========================
        await Category.bulkCreate([
            { id: 'cat-1', name: 'Oxygen Bottles', description: 'Medical and industrial oxygen bottles' },
            { id: 'cat-2', name: 'Medical Supplies', description: 'Related medical supplies' },
            { id: 'cat-3', name: 'Accessories', description: 'Bottle accessories and regulators' }
        ]);
        console.log('✅ Categories created');
        
        // ========================
        // 10. Create Products
        // ========================
        await Product.bulkCreate([
            { id: 'prod-1', name: 'Oxygen Regulator Standard', description: 'Standard flow regulator', price: 3500, categoryId: 'cat-3', stock: 25, sku: 'REG-STD-001' },
            { id: 'prod-2', name: 'Oxygen Regulator Premium', description: 'Premium flow regulator with gauge', price: 5500, categoryId: 'cat-3', stock: 15, sku: 'REG-PRM-001' },
            { id: 'prod-3', name: 'Nasal Cannula', description: 'Disposable nasal cannula', price: 150, categoryId: 'cat-2', stock: 200, sku: 'NC-001' },
            { id: 'prod-4', name: 'Oxygen Mask Adult', description: 'Adult oxygen mask with tubing', price: 350, categoryId: 'cat-2', stock: 100, sku: 'OM-ADT-001' },
            { id: 'prod-5', name: 'Oxygen Mask Pediatric', description: 'Pediatric oxygen mask with tubing', price: 300, categoryId: 'cat-2', stock: 50, sku: 'OM-PED-001' }
        ]);
        console.log('✅ Products created');
        
        console.log('');
        console.log('🎉 Dummy data seeding complete!');
        console.log('');
        console.log('Summary:');
        console.log('  • 1 Main tank (15,000L / 20,000L capacity)');
        console.log('  • 4 Bottle types');
        console.log('  • 3 Suppliers');
        console.log('  • 6 Customers');
        console.log(`  • ${bottles.length} Bottles (12 empty, 45 filled, 28 with customers)`);
        console.log('  • 4 Supplier transactions');
        console.log('  • 5 Customer transactions');
        console.log('');
        
    } catch (error) {
        console.error('❌ Error seeding dummy data:', error);
    }
};

module.exports = { seedDummyData };
