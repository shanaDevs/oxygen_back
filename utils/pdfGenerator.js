const PDFDocument = require('pdfkit');

/**
 * Generate a PDF invoice for a sale
 */
const generateInvoicePDF = (sale, res) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Pipe to response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice-${sale.invoiceNumber}.pdf`);
    doc.pipe(res);

    // Colors
    const primaryColor = '#0066cc';
    const textColor = '#333333';
    const mutedColor = '#666666';

    // Header
    doc.fontSize(20)
        .fillColor(primaryColor)
        .text('OXYGEN REFILLING CENTER', 50, 50)
        .fontSize(10)
        .fillColor(mutedColor)
        .text('Industrial Oxygen Supply & Refilling Services', 50, 75);

    // Invoice Details Box
    doc.fontSize(24)
        .fillColor(primaryColor)
        .text('INVOICE', 400, 50, { align: 'right' })
        .fontSize(10)
        .fillColor(textColor)
        .text(`Invoice #: ${sale.invoiceNumber}`, 400, 80, { align: 'right' })
        .text(`Date: ${new Date(sale.saleDate || sale.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })}`, 400, 95, { align: 'right' });

    // Line separator
    doc.moveTo(50, 120).lineTo(550, 120).stroke('#ddd');

    // Customer Info
    doc.fontSize(12)
        .fillColor(primaryColor)
        .text('Bill To:', 50, 140)
        .fontSize(11)
        .fillColor(textColor)
        .text(sale.customerName || 'Walk-in Customer', 50, 158)
        .fontSize(10)
        .fillColor(mutedColor)
        .text(sale.customerPhone || '', 50, 175);

    // Payment Status Badge
    const statusColor = sale.paymentStatus === 'full' ? '#22c55e' :
        sale.paymentStatus === 'partial' ? '#f59e0b' : '#ef4444';
    doc.roundedRect(400, 140, 100, 25, 5).fill(statusColor);
    doc.fontSize(10)
        .fillColor('#ffffff')
        .text(sale.paymentStatus.toUpperCase(), 400, 148, { width: 100, align: 'center' });

    // Items Table Header
    const tableTop = 220;
    doc.fontSize(10)
        .fillColor('#ffffff')
        .rect(50, tableTop, 500, 25)
        .fill(primaryColor);

    doc.fillColor('#ffffff')
        .text('#', 60, tableTop + 8)
        .text('Description', 90, tableTop + 8)
        .text('Serial #', 250, tableTop + 8)
        .text('Qty', 360, tableTop + 8, { align: 'center', width: 40 })
        .text('Price', 410, tableTop + 8, { align: 'right', width: 60 })
        .text('Amount', 480, tableTop + 8, { align: 'right', width: 70 });

    // Items
    let yPos = tableTop + 30;
    const items = Array.isArray(sale.items) ? sale.items :
        typeof sale.items === 'string' ? JSON.parse(sale.items) : [];

    items.forEach((item, index) => {
        // Alternate row colors
        if (index % 2 === 0) {
            doc.rect(50, yPos - 3, 500, 22).fill('#f9fafb');
        }

        doc.fontSize(9)
            .fillColor(textColor)
            .text((index + 1).toString(), 60, yPos)
            .text(`${item.capacityLiters || item.capacity || 0}L Oxygen Bottle (${item.refillKg || item.kg || 0}kg)`, 90, yPos)
            .text(item.serialNumber || 'N/A', 250, yPos)
            .text('1', 360, yPos, { align: 'center', width: 40 })
            .text(`Rs. ${parseFloat(item.price || item.pricePerFill || 0).toLocaleString()}`, 410, yPos, { align: 'right', width: 60 })
            .text(`Rs. ${parseFloat(item.price || item.pricePerFill || 0).toLocaleString()}`, 480, yPos, { align: 'right', width: 70 });

        yPos += 22;
    });

    // Totals
    yPos += 20;
    doc.moveTo(350, yPos).lineTo(550, yPos).stroke('#ddd');
    yPos += 15;

    // Subtotal
    doc.fontSize(10)
        .fillColor(mutedColor)
        .text('Subtotal:', 410, yPos)
        .fillColor(textColor)
        .text(`Rs. ${parseFloat(sale.subtotal || sale.total).toLocaleString()}`, 480, yPos, { align: 'right', width: 70 });

    // Tax
    if (parseFloat(sale.tax) > 0) {
        yPos += 18;
        doc.fillColor(mutedColor)
            .text(`Tax (${sale.taxPercentage || 0}%):`, 410, yPos)
            .fillColor(textColor)
            .text(`Rs. ${parseFloat(sale.tax).toLocaleString()}`, 480, yPos, { align: 'right', width: 70 });
    }

    // Discount
    if (parseFloat(sale.discount) > 0) {
        yPos += 18;
        doc.fillColor('#22c55e')
            .text(`Discount (${sale.discountPercentage || 0}%):`, 410, yPos)
            .text(`-Rs. ${parseFloat(sale.discount).toLocaleString()}`, 480, yPos, { align: 'right', width: 70 });
    }

    // Total
    yPos += 25;
    doc.roundedRect(400, yPos - 5, 150, 30, 5).fill(primaryColor);
    doc.fontSize(12)
        .fillColor('#ffffff')
        .text('TOTAL:', 410, yPos + 3)
        .text(`Rs. ${parseFloat(sale.total).toLocaleString()}`, 480, yPos + 3, { align: 'right', width: 70 });

    // Payment Details
    yPos += 50;
    doc.fontSize(11)
        .fillColor(primaryColor)
        .text('Payment Details', 50, yPos)
        .fontSize(10)
        .fillColor(textColor);

    yPos += 20;
    doc.text(`Amount Paid: Rs. ${parseFloat(sale.amountPaid || 0).toLocaleString()}`, 50, yPos);

    if (parseFloat(sale.creditAmount) > 0) {
        yPos += 15;
        doc.fillColor('#ef4444')
            .text(`Credit/Outstanding: Rs. ${parseFloat(sale.creditAmount).toLocaleString()}`, 50, yPos);
    }

    if (parseFloat(sale.changeAmount) > 0) {
        yPos += 15;
        doc.fillColor('#22c55e')
            .text(`Change Given: Rs. ${parseFloat(sale.changeAmount).toLocaleString()}`, 50, yPos);
    }

    // Footer
    const footerY = 750;
    doc.moveTo(50, footerY).lineTo(550, footerY).stroke('#ddd');
    doc.fontSize(9)
        .fillColor(mutedColor)
        .text('Thank you for your business!', 50, footerY + 15, { align: 'center', width: 500 })
        .text('For inquiries, please contact: +94 XX XXX XXXX', 50, footerY + 30, { align: 'center', width: 500 });

    doc.end();
};

/**
 * Generate a PDF for bottle ledger history
 */
const generateBottleLedgerPDF = (bottle, ledgerEntries, res) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=BottleLedger-${bottle.serialNumber}.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(20)
        .fillColor('#0066cc')
        .text('BOTTLE LEDGER REPORT', 50, 50)
        .fontSize(10)
        .fillColor('#666666')
        .text(`Generated: ${new Date().toLocaleDateString()}`, 50, 75);

    // Bottle Info
    doc.fontSize(14)
        .fillColor('#333333')
        .text(`Serial Number: ${bottle.serialNumber}`, 50, 110)
        .fontSize(11)
        .text(`Capacity: ${bottle.capacityLiters}L`, 50, 130)
        .text(`Current Status: ${bottle.status}`, 50, 145)
        .text(`Location: ${bottle.location}`, 50, 160)
        .text(`Fill Count: ${bottle.fillCount || 0}`, 50, 175);

    // Table Header
    const tableTop = 220;
    doc.rect(50, tableTop, 500, 20).fill('#0066cc');
    doc.fontSize(9)
        .fillColor('#ffffff')
        .text('Date', 55, tableTop + 6)
        .text('Operation', 140, tableTop + 6)
        .text('Customer', 240, tableTop + 6)
        .text('Status Change', 340, tableTop + 6)
        .text('Notes', 440, tableTop + 6);

    // Entries
    let yPos = tableTop + 25;
    ledgerEntries.forEach((entry, index) => {
        if (yPos > 700) {
            doc.addPage();
            yPos = 50;
        }

        if (index % 2 === 0) {
            doc.rect(50, yPos - 2, 500, 18).fill('#f9fafb');
        }

        doc.fontSize(8)
            .fillColor('#333333')
            .text(new Date(entry.createdAt).toLocaleDateString(), 55, yPos)
            .text(entry.operationType, 140, yPos)
            .text(entry.customerName || '-', 240, yPos)
            .text(`${entry.previousStatus || '-'} → ${entry.newStatus || '-'}`, 340, yPos)
            .text((entry.notes || '').substring(0, 20), 440, yPos);

        yPos += 18;
    });

    doc.end();
};

/**
 * Generate customer statement PDF
 */
const generateCustomerStatementPDF = (customer, transactions, outstanding, res) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Statement-${customer.name.replace(/\s+/g, '_')}.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(20)
        .fillColor('#0066cc')
        .text('CUSTOMER STATEMENT', 50, 50);

    // Customer Info
    doc.fontSize(12)
        .fillColor('#333333')
        .text(customer.name, 50, 90)
        .fontSize(10)
        .fillColor('#666666')
        .text(customer.phone || '', 50, 107)
        .text(customer.address || '', 50, 122);

    // Outstanding Badge
    const color = outstanding > 0 ? '#ef4444' : '#22c55e';
    doc.roundedRect(400, 90, 130, 40, 5).fill(color);
    doc.fontSize(10)
        .fillColor('#ffffff')
        .text('Outstanding', 400, 98, { width: 130, align: 'center' })
        .fontSize(14)
        .text(`Rs. ${outstanding.toLocaleString()}`, 400, 112, { width: 130, align: 'center' });

    // Transactions Table
    const tableTop = 170;
    doc.rect(50, tableTop, 500, 20).fill('#0066cc');
    doc.fontSize(9)
        .fillColor('#ffffff')
        .text('Date', 55, tableTop + 6)
        .text('Type', 120, tableTop + 6)
        .text('Invoice', 180, tableTop + 6)
        .text('Bottles', 260, tableTop + 6)
        .text('Amount', 340, tableTop + 6, { align: 'right', width: 60 })
        .text('Paid', 410, tableTop + 6, { align: 'right', width: 60 })
        .text('Credit', 480, tableTop + 6, { align: 'right', width: 60 });

    let yPos = tableTop + 25;
    transactions.forEach((tx, index) => {
        if (yPos > 700) {
            doc.addPage();
            yPos = 50;
        }

        if (index % 2 === 0) {
            doc.rect(50, yPos - 2, 500, 16).fill('#f9fafb');
        }

        doc.fontSize(8)
            .fillColor('#333333')
            .text(new Date(tx.createdAt || tx.saleDate).toLocaleDateString(), 55, yPos)
            .text(tx.type || 'Sale', 120, yPos)
            .text(tx.invoiceNumber || '-', 180, yPos)
            .text(tx.bottleCount || tx.bottles || '0', 260, yPos)
            .text(`Rs. ${parseFloat(tx.total || tx.amount || 0).toLocaleString()}`, 340, yPos, { align: 'right', width: 60 })
            .text(`Rs. ${parseFloat(tx.amountPaid || tx.paid || 0).toLocaleString()}`, 410, yPos, { align: 'right', width: 60 })
            .text(`Rs. ${parseFloat(tx.creditAmount || tx.credit || 0).toLocaleString()}`, 480, yPos, { align: 'right', width: 60 });

        yPos += 16;
    });

    doc.end();
};

/**
 * Generate a PDF for payment receipt (customer or supplier)
 */
const generatePaymentReceiptPDF = (payment, res) => {
    const doc = new PDFDocument({ margin: 50, size: 'A5', layout: 'landscape' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Receipt-${payment.id}.pdf`);
    doc.pipe(res);

    const primaryColor = '#0066cc';
    const textColor = '#333333';

    // Header
    doc.fontSize(16).fillColor(primaryColor).text('PAYMENT RECEIPT', 50, 40);
    doc.fontSize(8).fillColor('#666666').text('OXYGEN REFILLING CENTER', 50, 60);

    // Receipt details
    doc.fontSize(9).fillColor(textColor)
        .text(`Receipt #: ${payment.id}`, 350, 40, { align: 'right' })
        .text(`Date: ${new Date(payment.createdAt).toLocaleDateString()}`, 350, 55, { align: 'right' });

    doc.moveTo(50, 75).lineTo(530, 75).stroke('#ddd');

    // Payer details
    doc.fontSize(10).fillColor(primaryColor).text(payment.type === 'supplier' ? 'Paid To:' : 'Received From:', 50, 95);
    doc.fontSize(12).fillColor(textColor).text(payment.name, 50, 110);

    if (payment.phone) {
        doc.fontSize(9).fillColor('#666666').text(payment.phone, 50, 125);
    }

    // Payment Info
    doc.roundedRect(250, 90, 270, 80, 5).fill('#f8fafc');
    doc.fillColor(textColor).fontSize(10);

    let y = 105;
    doc.text('Amount:', 270, y).fontSize(14).font('Helvetica-Bold').text(`Rs. ${parseFloat(payment.amount).toLocaleString()}`, 380, y, { align: 'right', width: 120 }).font('Helvetica').fontSize(10);

    y += 25;
    doc.text('Method:', 270, y).text(payment.method || 'Cash', 380, y, { align: 'right', width: 120 });

    y += 15;
    if (payment.remainingBalance !== undefined) {
        doc.text('Balance Remaining:', 270, y).fillColor('#ef4444').text(`Rs. ${parseFloat(payment.remainingBalance).toLocaleString()}`, 380, y, { align: 'right', width: 120 });
    }

    // Notes
    if (payment.notes) {
        doc.fillColor('#666666').fontSize(8).text(`Notes: ${payment.notes}`, 50, 160);
    }

    // Footer
    doc.fontSize(8).fillColor('#999999').text('This is a computer-generated receipt.', 50, 240, { align: 'center', width: 480 });

    doc.end();
};

module.exports = {
    generateInvoicePDF,
    generateBottleLedgerPDF,
    generateCustomerStatementPDF,
    generatePaymentReceiptPDF
};
