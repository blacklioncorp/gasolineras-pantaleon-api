// generate_hash.js (En la raíz del proyecto)

// Asegúrate de tener instalado bcryptjs: npm install bcryptjs
const bcrypt = require('bcryptjs'); 

const password = 'admin'; // La contraseña que quieres hashear
const saltRounds = 10;

console.log(`Generando hash para la contraseña: "${password}"`);

bcrypt.hash(password, saltRounds)
    .then(hash => {
        console.log('--------------------------------------------------');
        console.log(`✅ HASH GENERADO (ÚSALO EN src/config/init.sql):`);
        console.log(hash);
        console.log('--------------------------------------------------');
    })
    .catch(err => console.error("Error al hashear:", err));