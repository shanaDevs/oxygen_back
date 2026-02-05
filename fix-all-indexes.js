const { sequelize } = require('./config/database');

async function fixAllIndexes() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Connected.');

        const [tables] = await sequelize.query('SHOW TABLES');
        const dbName = sequelize.getDatabaseName();
        const tableField = `Tables_in_${dbName}`;

        for (const tableRow of tables) {
            const tableName = tableRow[tableField] || tableRow[`Tables_in_${dbName.toLowerCase()}`];
            console.log(`\nChecking table: ${tableName}`);

            try {
                const [indexes] = await sequelize.query(`SHOW INDEX FROM \`${tableName}\``);
                console.log(`Found ${indexes.length} indexes.`);

                // Identify redundant unique indexes
                // Sequelize often creates name, name_2, name_3...
                const indexesToDrop = [];
                const seenBasenames = new Map();

                for (const idx of indexes) {
                    const keyName = idx.Key_name;
                    if (keyName === 'PRIMARY') continue;

                    // Foreign keys usually end with _foreign_idx or similar in some setups, 
                    // but in our case they seem to be needed.
                    // However, unique ones like serial_number_2 are definitely redundant.

                    if (keyName.match(/_\d+$/) || keyName.includes('unique')) {
                        indexesToDrop.push(keyName);
                    }
                }

                // Also drop any that look like duplicates even without suffix
                const uniqueIndexesToDrop = [...new Set(indexesToDrop)];
                console.log(`Indexes identified for potential cleanup: ${uniqueIndexesToDrop.length}`);

                for (const indexName of uniqueIndexesToDrop) {
                    try {
                        process.stdout.write(`  Dropping index ${indexName}... `);
                        await sequelize.query(`ALTER TABLE \`${tableName}\` DROP INDEX \`${indexName}\``);
                        console.log('OK');
                    } catch (err) {
                        console.log(`FAILED: ${err.message}`);
                    }
                }
            } catch (err) {
                console.log(`Could not check table ${tableName}: ${err.message}`);
            }
        }

        console.log('\nGlobal cleanup complete.');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixAllIndexes();
