const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',   
  user: 'root',        
  password: '',        
  database: 'soporte' 
});


connection.connect((err) => {
  if (err) {
    console.error('Error al conectarse a la base de datos:', err.message);
    process.exit(1);
  }
  console.log('Conexión con éxito');
});

module.exports = connection;
