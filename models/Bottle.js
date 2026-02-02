module.exports = (sequelize, DataTypes) => {
    const Bottle = sequelize.define('Bottle', {
        id: {
            type: DataTypes.STRING(50),
            primaryKey: true
        },
        serialNumber: {
            type: DataTypes.STRING(100),
            allowNull: true,
            unique: true,
            field: 'serial_number'
        },
        // Bottle capacity in liters
        capacityLiters: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            field: 'capacity_liters'
        },
        // Reference to bottle type
        bottleTypeId: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'bottle_type_id'
        },
        // Bottle status: empty (in center), filled (ready to issue), with_customer (issued out)
        status: {
            type: DataTypes.ENUM('empty', 'filled', 'with_customer', 'maintenance', 'retired', 'damaged'),
            defaultValue: 'empty'
        },
        // Location: 'center' or 'customer'
        location: {
            type: DataTypes.ENUM('center', 'customer'),
            defaultValue: 'center',
            comment: 'Current physical location of the bottle'
        },
        // Customer who currently has the bottle
        customerId: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'customer_id'
        },
        customerName: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'customer_name'
        },
        // Ownership: 'center' (center owns it) or customer ID (customer owns it)
        ownerId: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'owner_id',
            comment: 'Who owns this bottle - null means center, otherwise customer ID'
        },
        ownerName: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'owner_name'
        },
        // Dates
        receivedDate: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'received_date',
            comment: 'When bottle was first received at center'
        },
        filledDate: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'filled_date'
        },
        issuedDate: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'issued_date'
        },
        lastReturnedDate: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'last_returned_date'
        },
        // Tracking
        fillCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'fill_count',
            comment: 'Total times this bottle has been filled'
        },
        issueCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'issue_count',
            comment: 'Total times this bottle has been issued'
        },
        // Notes
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'bottles',
        timestamps: true,
        underscored: true
    });

    return Bottle;
};
