const mysql = require('mysql2/promise');

async function cleanDatabase() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '123456',
        database: 'ikp_db'
    });

    try {
        console.log('Deleting all records from patient_data and incidents...');
        
        // Delete patient_data
        const [resultPatient] = await connection.execute('DELETE FROM patient_data');
        console.log(`Deleted ${resultPatient.affectedRows} records from patient_data`);
        
        // Delete incidents
        const [resultIncidents] = await connection.execute('DELETE FROM incidents');
        console.log(`Deleted ${resultIncidents.affectedRows} records from incidents`);
        
        console.log('Database cleaned!');

    } finally {
        await connection.end();
    }
}

cleanDatabase().catch(console.error);
