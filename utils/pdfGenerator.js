const PDFDocument = require('pdfkit');

/**
 * Generate a modern PDF invoice for a sale
 */
const generateInvoicePDF = (sale, res) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=Invoice-${sale.invoiceNumber}.pdf`);
    doc.pipe(res);

    const primaryColor = '#1e293b';
    const accentColor = '#2563eb';
    const textColor = '#334155';
    const mutedColor = '#64748b';
    const borderColor = '#e2e8f0';

    // Header Background Accent
    doc.rect(0, 0, 600, 15).fill(accentColor);

    // Organization Logo/Name
    doc.fontSize(22)
        .font('Helvetica-Bold')
        .fillColor(primaryColor)
        .text('OXYGEN', 50, 45, { continued: true })
        .fillColor(accentColor)
        .text(' POS')
        .fontSize(8)
        .font('Helvetica')
        .fillColor(mutedColor)
        .text('PROFESSIONAL REFILLING SERVICES', 50, 70);

    // Invoice Details Box (Right Aligned)
    doc.fontSize(24)
        .font('Helvetica-Bold')
        .fillColor(primaryColor)
        .text('INVOICE', 350, 45, { align: 'right', width: 200 })
        .fontSize(10)
        .font('Helvetica')
        .fillColor(textColor)
        .text(`No: ${sale.invoiceNumber}`, 350, 72, { align: 'right', width: 200 })
        .fontSize(9)
        .fillColor(mutedColor)
        .text(`Date: ${new Date(sale.saleDate || sale.createdAt).toLocaleDateString('en-GB')}`, 350, 88, { align: 'right', width: 200 });

    // Header Line
    doc.moveTo(50, 115).lineTo(545, 115).lineWidth(0.5).stroke(borderColor);

    // Customer Info & Status
    doc.fontSize(9)
        .font('Helvetica-Bold')
        .fillColor(mutedColor)
        .text('BILL TO', 50, 135)
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor(primaryColor)
        .text(sale.customerName || 'Walk-in Customer', 50, 153)
        .fontSize(10)
        .font('Helvetica')
        .fillColor(textColor)
        .text(sale.customerPhone || '', 50, 170);

    // Payment Status Badge
    const statusColor = sale.paymentStatus === 'full' ? '#10b981' :
        sale.paymentStatus === 'partial' ? '#f59e0b' : '#ef4444';

    doc.roundedRect(425, 135, 120, 45, 8).fill('#f8fafc');
    doc.roundedRect(425, 135, 120, 45, 8).lineWidth(1).stroke(borderColor);

    doc.fontSize(8)
        .font('Helvetica-Bold')
        .fillColor(mutedColor)
        .text('PAYMENT STATUS', 425, 145, { width: 120, align: 'center' })
        .fontSize(10)
        .fillColor(statusColor)
        .text(sale.paymentStatus.toUpperCase(), 425, 160, { width: 120, align: 'center' });

    // Items Table Header
    const tableTop = 220;
    doc.roundedRect(50, tableTop, 495, 30, 4).fill(primaryColor);

    doc.fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#ffffff')
        .text('#', 65, tableTop + 11)
        .text('DESCRIPTION / CAPACITY', 90, tableTop + 11)
        .text('SERIAL NO', 250, tableTop + 11)
        .text('QTY', 360, tableTop + 11, { align: 'center', width: 40 })
        .text('UNIT PRICE', 410, tableTop + 11, { align: 'right', width: 60 })
        .text('LINE TOTAL', 480, tableTop + 11, { align: 'right', width: 65 });

    // Items
    let yPos = tableTop + 40;
    const items = Array.isArray(sale.items) ? sale.items :
        typeof sale.items === 'string' ? JSON.parse(sale.items) : [];

    items.forEach((item, index) => {
        if (yPos > 730) {
            doc.addPage();
            yPos = 50;
        }

        if (index % 2 === 0) {
            doc.rect(50, yPos - 5, 495, 24).fill('#f8fafc');
        }

        doc.fontSize(9)
            .font('Helvetica')
            .fillColor(textColor)
            .text((index + 1).toString(), 65, yPos)
            .fillColor(primaryColor)
            .text(`${item.capacityLiters || item.capacity || 0}L Bottle (${item.refillKg || item.kg || 0}kg Refill)`, 90, yPos)
            .fillColor(mutedColor)
            .text((item.serialNumber || 'N/A').toUpperCase(), 250, yPos)
            .fillColor(textColor)
            .text('1', 360, yPos, { align: 'center', width: 40 })
            .text(`Rs. ${parseFloat(item.price || item.pricePerFill || 0).toLocaleString()}`, 410, yPos, { align: 'right', width: 60 })
            .font('Helvetica-Bold')
            .text(`Rs. ${parseFloat(item.price || item.pricePerFill || 0).toLocaleString()}`, 480, yPos, { align: 'right', width: 65 });

        yPos += 24;
    });

    // Totals Section
    yPos += 20;
    if (yPos > 700) { doc.addPage(); yPos = 50; }

    doc.moveTo(350, yPos).lineTo(545, yPos).lineWidth(0.5).stroke(borderColor);
    yPos += 15;

    // Subtotal
    doc.fontSize(9)
        .font('Helvetica')
        .fillColor(mutedColor)
        .text('Subtotal', 360, yPos)
        .fillColor(textColor)
        .text(`Rs. ${parseFloat(sale.subtotal || sale.total).toLocaleString()}`, 470, yPos, { align: 'right', width: 75 });

    // Tax
    if (parseFloat(sale.tax) > 0) {
        yPos += 18;
        doc.fillColor(mutedColor)
            .text(`Tax (${sale.taxPercentage || 0}%)`, 360, yPos)
            .fillColor(textColor)
            .text(`Rs. ${parseFloat(sale.tax).toLocaleString()}`, 470, yPos, { align: 'right', width: 75 });
    }

    // Discount
    if (parseFloat(sale.discount) > 0) {
        yPos += 18;
        doc.fillColor('#10b981')
            .text(`Discount (${sale.discountPercentage || 0}%)`, 360, yPos)
            .text(`-Rs. ${parseFloat(sale.discount).toLocaleString()}`, 470, yPos, { align: 'right', width: 75 });
    }

    // Final Total
    yPos += 25;
    doc.roundedRect(350, yPos - 8, 195, 35, 6).fill(primaryColor);
    doc.fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#ffffff')
        .text('NET TOTAL PAYABLE', 365, yPos + 4)
        .fontSize(13)
        .text(`Rs. ${parseFloat(sale.total).toLocaleString()}`, 465, yPos + 3, { align: 'right', width: 70 });

    // Payment Ledger
    yPos += 60;
    if (yPos > 700) { doc.addPage(); yPos = 50; }

    doc.fontSize(9)
        .font('Helvetica-Bold')
        .fillColor(mutedColor)
        .text('PAYMENT BREAKDOWN', 50, yPos);

    yPos += 15;
    doc.rect(50, yPos, 220, 60).fill('#f8fafc');
    doc.rect(50, yPos, 220, 60).lineWidth(0.5).stroke(borderColor);

    yPos += 12;
    doc.fontSize(8).font('Helvetica').fillColor(textColor)
        .text(`Amount Settled:`, 65, yPos)
        .font('Helvetica-Bold').text(`Rs. ${parseFloat(sale.amountPaid || 0).toLocaleString()}`, 180, yPos, { align: 'right', width: 80 });

    if (parseFloat(sale.creditAmount) > 0) {
        yPos += 15;
        doc.font('Helvetica').fillColor('#ef4444')
            .text(`Credit Balance:`, 65, yPos)
            .font('Helvetica-Bold').text(`Rs. ${parseFloat(sale.creditAmount).toLocaleString()}`, 180, yPos, { align: 'right', width: 80 });
    }

    if (parseFloat(sale.changeAmount) > 0) {
        yPos += 15;
        doc.font('Helvetica').fillColor('#10b981')
            .text(`Change Returned:`, 65, yPos)
            .font('Helvetica-Bold').text(`Rs. ${parseFloat(sale.changeAmount).toLocaleString()}`, 180, yPos, { align: 'right', width: 80 });
    }

    // Footer - Relative Position
    yPos += 80;
    if (yPos > 780) { doc.addPage(); yPos = 50; }
    doc.fontSize(7)
        .font('Helvetica')
        .fillColor(mutedColor)
        .text('SYSTEM GENERATED TAX INVOICE | POWERED BY OXYGEN POS', 50, yPos, { align: 'center', width: 500 });

    doc.end();
};

/**
 * Generate a PDF for bottle ledger history
 */
const generateBottleLedgerPDF = (bottle, ledgerEntries, res) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=BottleLedger-${bottle.serialNumber}.pdf`);
    doc.pipe(res);

    const primaryColor = '#1e293b';
    const accentColor = '#2563eb';
    const mutedColor = '#64748b';

    // Header Background Accent
    doc.rect(0, 0, 600, 15).fill(accentColor);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').fillColor(primaryColor).text('BOTTLE LEDGER REPORT', 50, 45);
    doc.fontSize(8).font('Helvetica').fillColor(mutedColor).text(`Generated: ${new Date().toLocaleString()}`, 50, 70);

    // Bottle Info
    doc.roundedRect(50, 100, 495, 80, 8).fill('#f8fafc');
    doc.roundedRect(50, 100, 495, 80, 8).lineWidth(0.5).stroke('#e2e8f0');

    doc.fontSize(14).font('Helvetica-Bold').fillColor(primaryColor).text(`Serial: ${bottle.serialNumber}`, 70, 115);
    doc.fontSize(10).font('Helvetica').fillColor('#334155')
        .text(`Capacity: ${bottle.capacityLiters}L`, 70, 140)
        .text(`Location: ${bottle.location}`, 70, 155)
        .text(`Current Status: ${bottle.status.toUpperCase()}`, 300, 115)
        .text(`Total Fills: ${bottle.fillCount || 0}`, 300, 140);

    // Table Header
    const tableTop = 210;
    doc.roundedRect(50, tableTop, 495, 25, 4).fill(primaryColor);
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff')
        .text('DATE', 65, tableTop + 9)
        .text('OPERATION', 140, tableTop + 9)
        .text('CUSTOMER / ENTITY', 260, tableTop + 9)
        .text('STATUS TRANSITION', 400, tableTop + 9);

    // Entries
    let yPos = tableTop + 35;
    ledgerEntries.forEach((entry, index) => {
        if (yPos > 730) { doc.addPage(); yPos = 50; }
        if (index % 2 === 0) { doc.rect(50, yPos - 5, 495, 20).fill('#f8fafc'); }
        doc.fontSize(8).font('Helvetica').fillColor('#334155')
            .text(new Date(entry.createdAt).toLocaleDateString(), 65, yPos)
            .text(entry.operationType.toUpperCase(), 140, yPos)
            .text(entry.customerName || '-', 260, yPos)
            .text(`${entry.previousStatus || '-'} → ${entry.newStatus || '-'}`, 400, yPos);
        yPos += 20;
    });

    // Footer
    yPos += 40;
    if (yPos > 780) { doc.addPage(); yPos = 50; }
    doc.fontSize(7).fillColor(mutedColor).text('OXYGEN POS | BOTTLE LIFECYCLE AUDIT | SYSTEM GENERATED', 50, yPos, { align: 'center', width: 500 });

    doc.end();
};

/**
 * Generate customer statement PDF
 */
const generateCustomerStatementPDF = (customer, transactions, outstanding, res) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=Statement-${customer.name.replace(/\s+/g, '_')}.pdf`);
    doc.pipe(res);

    const primaryColor = '#1e293b';
    const accentColor = '#2563eb';
    const mutedColor = '#64748b';

    doc.rect(0, 0, 600, 15).fill(accentColor);
    doc.fontSize(20).font('Helvetica-Bold').fillColor(primaryColor).text('CUSTOMER STATEMENT', 50, 45);
    doc.fontSize(8).font('Helvetica').fillColor(mutedColor).text(`Audit Period: Up to ${new Date().toLocaleDateString()}`, 50, 70);

    doc.fontSize(9).font('Helvetica-Bold').fillColor(mutedColor).text('CUSTOMER DETAILS', 50, 100);
    doc.fontSize(12).font('Helvetica-Bold').fillColor(primaryColor).text(customer.name, 50, 115);
    doc.fontSize(9).font('Helvetica').fillColor('#334155').text(customer.phone || '-', 50, 132);

    const color = outstanding > 0 ? '#ef4444' : '#10b981';
    doc.roundedRect(365, 100, 180, 55, 8).fill('#f8fafc');
    doc.roundedRect(365, 100, 180, 55, 8).lineWidth(0.5).stroke('#e2e8f0');
    doc.fontSize(8).font('Helvetica-Bold').fillColor(mutedColor).text('NET OUTSTANDING BALANCE', 365, 113, { width: 180, align: 'center' });
    doc.fontSize(16).fillColor(color).text(`Rs. ${outstanding.toLocaleString()}`, 365, 128, { width: 180, align: 'center' });

    const tableTop = 180;
    doc.roundedRect(50, tableTop, 495, 25, 4).fill(primaryColor);
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff')
        .text('DATE', 65, tableTop + 9).text('ACTIVITY', 130, tableTop + 9).text('DOC NO', 210, tableTop + 9)
        .text('AMOUNT', 340, tableTop + 9, { align: 'right', width: 60 })
        .text('PAID', 410, tableTop + 9, { align: 'right', width: 60 })
        .text('BALANCE', 480, tableTop + 9, { align: 'right', width: 60 });

    let yPos = tableTop + 35;
    transactions.forEach((tx, index) => {
        if (yPos > 730) { doc.addPage(); yPos = 50; }
        if (index % 2 === 0) { doc.rect(50, yPos - 5, 495, 20).fill('#f8fafc'); }
        doc.fontSize(8).font('Helvetica').fillColor('#334155')
            .text(new Date(tx.createdAt || tx.saleDate).toLocaleDateString(), 65, yPos)
            .text(tx.type || 'Sale', 130, yPos).text(tx.invoiceNumber || '-', 210, yPos)
            .text(parseFloat(tx.total || tx.amount || 0).toLocaleString(), 340, yPos, { align: 'right', width: 60 })
            .text(parseFloat(tx.amountPaid || tx.paid || 0).toLocaleString(), 410, yPos, { align: 'right', width: 60 })
            .font('Helvetica-Bold')
            .text(parseFloat(tx.creditAmount || tx.credit || 0).toLocaleString(), 480, yPos, { align: 'right', width: 60 })
            .font('Helvetica');
        yPos += 20;
    });

    yPos += 40;
    if (yPos > 780) { doc.addPage(); yPos = 50; }
    doc.fontSize(7).fillColor(mutedColor).text('OXYGEN POS | CUSTOMER ACCOUNT SUMMARY | SYSTEM GENERATED', 50, yPos, { align: 'center', width: 500 });
    doc.end();
};

/**
 * Generate a PDF for payment receipt
 */
const generatePaymentReceiptPDF = (payment, res) => {
    const doc = new PDFDocument({ margin: 50, size: 'A5', layout: 'landscape' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=Receipt-${payment.id}.pdf`);
    doc.pipe(res);

    const primaryColor = '#1e293b';
    const accentColor = '#2563eb';

    doc.rect(0, 0, 600, 10).fill(accentColor);
    doc.fontSize(18).font('Helvetica-Bold').fillColor(primaryColor).text('PAYMENT RECEIPT', 50, 35);
    doc.fontSize(8).font('Helvetica').fillColor('#64748b').text('OFFICIAL SETTLEMENT DOCUMENT', 50, 55);

    doc.fontSize(9).fillColor('#334155')
        .text(`Receipt #: ${payment.id}`, 380, 35, { align: 'right' })
        .text(`Date: ${new Date(payment.createdAt).toLocaleDateString()}`, 380, 50, { align: 'right' });

    doc.moveTo(50, 75).lineTo(545, 75).lineWidth(0.5).stroke('#e2e8f0');

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#64748b').text(payment.type === 'supplier' ? 'PAID TO:' : 'RECEIVED FROM:', 50, 95);
    doc.fontSize(14).font('Helvetica-Bold').fillColor(primaryColor).text(payment.name, 50, 110);

    doc.roundedRect(300, 90, 245, 100, 8).fill('#f8fafc');
    doc.roundedRect(300, 90, 245, 100, 8).lineWidth(1).stroke('#e2e8f0');

    doc.fontSize(9).font('Helvetica').fillColor('#334155').text('Transaction Amount:', 320, 110);
    doc.fontSize(22).font('Helvetica-Bold').fillColor(accentColor).text(`Rs. ${parseFloat(payment.amount).toLocaleString()}`, 320, 130);
    doc.fontSize(9).font('Helvetica').fillColor('#64748b').text(`Method: ${payment.method || 'Cash'}`, 320, 165);

    if (payment.remainingBalance !== undefined) {
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#ef4444').text(`Remaining Balance: Rs. ${parseFloat(payment.remainingBalance).toLocaleString()}`, 320, 180);
    }

    doc.fontSize(8).font('Helvetica').fillColor('#94a3b8').text('This is a system generated receipt.', 50, 255, { align: 'center', width: 495 });
    doc.end();
};

/**
 * Generate supplier statement PDF with a modern unified ledger
 */
const generateSupplierStatementPDF = (supplier, transactions, payments, res) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=Supplier_Statement-${supplier.name.replace(/\s+/g, '_')}.pdf`);
    doc.pipe(res);

    const primaryColor = '#1e293b';
    const accentColor = '#2563eb';
    const textColor = '#334155';
    const mutedColor = '#64748b';
    const borderColor = '#e2e8f0';

    const formatCurrency = (val) => `Rs. ${parseFloat(val || 0).toLocaleString()}`;

    doc.rect(0, 0, 600, 15).fill(accentColor);
    doc.fontSize(22).font('Helvetica-Bold').fillColor(primaryColor).text('OXYGEN', 50, 45, { continued: true }).fillColor(accentColor).text(' POS');
    doc.fontSize(8).font('Helvetica').fillColor(mutedColor).text('REFILLING & PROCUREMENT NETWORK', 50, 70);

    doc.fontSize(14).font('Helvetica-Bold').fillColor(primaryColor).text('SUPPLIER AUDIT', 350, 45, { align: 'right', width: 200 });
    doc.fontSize(9).font('Helvetica').fillColor(mutedColor).text('FINANCIAL STATEMENT', 350, 62, { align: 'right', width: 200 });
    doc.fontSize(8).text(`As of: ${new Date().toLocaleDateString('en-GB')}`, 350, 75, { align: 'right', width: 200 });

    doc.moveTo(50, 100).lineTo(545, 100).lineWidth(0.5).stroke(borderColor);

    doc.fontSize(9).font('Helvetica-Bold').fillColor(mutedColor).text('PROCUREMENT ENTITY / SUPPLIER', 50, 120);
    doc.fontSize(12).font('Helvetica-Bold').fillColor(primaryColor).text(supplier.name, 50, 135);
    doc.fontSize(9).font('Helvetica').fillColor(textColor).text(supplier.phone || '-', 50, 152).text(supplier.address || '-', 50, 165, { width: 200 });

    const outstanding = parseFloat(supplier.totalOutstanding) || 0;
    const liabilityColor = outstanding > 0 ? '#ef4444' : '#10b981';
    doc.roundedRect(365, 120, 180, 65, 8).fill('#f8fafc');
    doc.roundedRect(365, 120, 180, 65, 8).lineWidth(1).stroke(borderColor);
    doc.fontSize(8).font('Helvetica-Bold').fillColor(mutedColor).text('NET OUTSTANDING LIABILITY', 365, 133, { width: 180, align: 'center' });
    doc.fontSize(18).font('Helvetica-Bold').fillColor(liabilityColor).text(formatCurrency(outstanding), 365, 150, { width: 180, align: 'center' });

    const ledger = [
        ...transactions.map(t => ({
            date: new Date(t.createdAt),
            type: 'PROCUREMENT',
            description: `Oxygen Delivery (${t.litersSupplied || t.kgSupplied} Kg)`,
            id: t.id,
            debit: parseFloat(t.totalAmount),
            credit: 0,
            status: t.paymentStatus
        })),
        ...payments.map(p => ({
            date: new Date(p.paymentDate),
            type: 'SETTLEMENT',
            description: `Payment - ${p.paymentMethod.replace('_', ' ').toUpperCase()}`,
            id: p.id,
            debit: 0,
            credit: parseFloat(p.amount),
            status: 'full'
        }))
    ].sort((a, b) => a.date - b.date);

    const tableTop = 220;
    doc.roundedRect(50, tableTop, 495, 30, 4).fill(primaryColor);
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff')
        .text('DATE', 65, tableTop + 11).text('ACTIVITY DESCRIPTION', 135, tableTop + 11).text('REF ID', 310, tableTop + 11)
        .text('DEBIT (+)', 380, tableTop + 11, { width: 50, align: 'right' })
        .text('CREDIT (-)', 435, tableTop + 11, { width: 50, align: 'right' })
        .text('BALANCE', 490, tableTop + 11, { width: 45, align: 'right' });

    let yPos = tableTop + 40;
    let runningBalance = 0;

    ledger.forEach((item, index) => {
        if (yPos > 730) { doc.addPage(); yPos = 50; }
        runningBalance += (item.debit - item.credit);
        if (index % 2 === 0) { doc.rect(50, yPos - 5, 495, 24).fill('#f8fafc'); }
        // Append status to description for procurement
        let fullDescription = item.description;
        if (item.type === 'PROCUREMENT') {
            fullDescription += ` [${item.status.toUpperCase()}]`;
        }

        doc.fontSize(8).font('Helvetica').fillColor(textColor)
            .text(item.date.toLocaleDateString('en-GB'), 65, yPos)
            .fillColor(primaryColor).text(fullDescription, 135, yPos, { width: 170 })
            .fillColor(mutedColor).text(item.id.length > 10 ? `#${item.id.slice(-6).toUpperCase()}` : item.id, 310, yPos)
            .fillColor(item.debit > 0 ? '#ef4444' : textColor)
            .text(item.debit > 0 ? parseFloat(item.debit).toLocaleString() : '-', 380, yPos, { width: 50, align: 'right' })
            .fillColor(item.credit > 0 ? '#10b981' : textColor)
            .text(item.credit > 0 ? parseFloat(item.credit).toLocaleString() : '-', 435, yPos, { width: 50, align: 'right' })
            .fillColor(primaryColor).font('Helvetica-Bold').text(parseFloat(runningBalance).toLocaleString(), 490, yPos, { width: 45, align: 'right' });

        yPos += 24;
    });

    yPos += 20;
    if (yPos > 700) { doc.addPage(); yPos = 50; }

    doc.rect(345, yPos, 200, 45).fill('#f1f5f9');
    doc.rect(345, yPos, 200, 45).lineWidth(0.5).stroke(borderColor);
    yPos += 15;
    doc.fontSize(9).font('Helvetica-Bold').fillColor(mutedColor).text('FINAL ACCOUNT LIABILITY:', 355, yPos);
    doc.fontSize(12).fillColor(outstanding > 0 ? '#ef4444' : '#10b981').text(formatCurrency(outstanding), 440, yPos - 2, { align: 'right', width: 95 });

    // Footer at flow end
    yPos += 60;
    if (yPos > 780) { doc.addPage(); yPos = 50; }
    doc.fontSize(7).font('Helvetica').fillColor(mutedColor).text('OXYGEN POS | INDUSTRIAL PROCUREMENT LEDGER | SYSTEM GENERATED DOCUMENT', 50, yPos, { align: 'center', width: 500 });

    doc.end();
};

module.exports = {
    generateInvoicePDF,
    generateBottleLedgerPDF,
    generateCustomerStatementPDF,
    generateSupplierStatementPDF,
    generatePaymentReceiptPDF
};
