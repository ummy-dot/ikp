const ejs = require('ejs');
const fs = require('fs');

try {
    const template = fs.readFileSync('views/user/form.ejs', 'utf-8');
    ejs.compile(template);
    console.log('EJS Syntax is PERFECTLY OK!');
} catch (e) {
    console.error('EJS ERROR DETAILS:');
    console.error(e);
}
