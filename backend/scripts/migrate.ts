import { pool } from '../infrastructure/db/pool';
import fs from 'fs';
import path from 'path';

async function migrate() {
    const migrationsDir = path.join(__dirname, '../infrastructure/db/migrations');
    const files = fs.readdirSync(migrationsDir).sort();

    console.log('Running migrations...');

    for (const file of files) {
        if (file.endsWith('.sql')) {
            console.log(`Executing ${file}...`);
            const filePath = path.join(migrationsDir, file);
            const sql = fs.readFileSync(filePath, 'utf-8');
            try {
                await pool.query(sql);
                console.log(`Successfully executed ${file}`);
            } catch (error) {
                console.error(`Failed to execute ${file}:`, error);
                // Don't exit process, let's try to run all and see. 
                // In real world we might want to stop, but for now we want to fix missing tables.
            }
        }
    }

    console.log('Migrations complete.');
    await pool.end();
}

migrate();
