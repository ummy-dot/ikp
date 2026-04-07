const ejs = require('ejs');
const fs = require('fs');

try {
    const template = fs.readFileSync('views/user/form.ejs', 'utf-8');

    // Simulate what route passes
    const data = {
        title: 'Laporan Insiden Keselamatan Pasien',
        user: { name: 'Jhon Doe', role: 'user', id: 1 },
        incident: null,
        error: [],
        success: []
    };

    console.log('Compiling...');
    const compiled = ejs.compile(template, { filename: 'views/user/form.ejs' });

    console.log('Rendering...');
    const html = compiled(data);

    console.log('Render Success. Length:', html.length);
} catch (e) {
    console.error('EJS ERROR DETAILS:');
    console.error(e);
}
