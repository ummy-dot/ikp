// Test age calculation
const birthDate = '1990-05-15';
const testDate = new Date('2026-03-11');

const bd = new Date(birthDate);
let age = testDate.getFullYear() - bd.getFullYear();
const monthDiff = testDate.getMonth() - bd.getMonth();

if (monthDiff < 0 || (monthDiff === 0 && testDate.getDate() < bd.getDate())) {
    age--;
}

console.log('Birth date:', birthDate);
console.log('Test date:', testDate.toDateString());
console.log('Calculated age:', age);

// Test kelompok umur calculation
let kelompokUmur = '';
if (age <= 1 && age === 0) kelompokUmur = '0-1 bulan';
else if (age < 1) kelompokUmur = '> 1 bulan - 1 tahun';
else if (age <= 5) kelompokUmur = '> 1 tahun - 5 tahun';
else if (age <= 15) kelompokUmur = '> 5 tahun - 15 tahun';
else if (age <= 30) kelompokUmur = '> 15 tahun - 30 tahun';
else if (age <= 65) kelompokUmur = '> 30 tahun - 65 tahun';
else kelompokUmur = '> 65 tahun';

console.log('Calculated kelompok_umur:', kelompokUmur);
console.log('\nExpected ENUM value: "> 30 tahun - 65 tahun"');
console.log('Match:', kelompokUmur === '> 30 tahun - 65 tahun' ? '✓ YES' : '✗ NO');
