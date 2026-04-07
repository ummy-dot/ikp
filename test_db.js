const db = require('./config/db');

async function test() {
    try {
        const [cols] = await db.execute('SHOW COLUMNS FROM incidents');
        console.log(cols.map(c => `${c.Field} - ${c.Type} - Nullable: ${c.Null}`).join('\n'));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
test();
