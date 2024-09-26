const express = require('express');
const router = express.Router();
const conexion = require('./dataBase.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


router.get('/', (rec, res)=>{
    conexion.query('SELECT * FROM usuarios', (err, datos)=>{
        if (err) {
            console.log('Error a ejecutar la consulta', err)
            return
        }
        res.json(datos);
    })
    
});

// Middleware para verificar el token JWT
function verifyToken(req, res, next) {
    console.log("Cookies recibidas:", req.cookies); 
    const token = req.cookies.token; 
    
    if (!token) {
        return res.status(401).json({ message: "Token no proporcionado" });
    }

    try {
        const payload = jwt.verify(token, 'secretKey');
        req.userId = payload.id; 
        req.nombre = payload.nombre;
        next();
    } catch (error) {
        return res.status(403).json({ message: "Token no válido" });
    }
}

router.get('/protegida', verifyToken, (req, res) => {
    res.json({ 
        message: 'Acceso permitido', 
        userId: req.userId,  // ID del usuario
        nombre: req.nombre    // Nombre del usuario
    });
});

// Ruta para el login (POST)
router.post('/login', (req, res) => {
    const { nombre, password } = req.body;

    if (!nombre || !password) {
        return res.status(400).json({ error: 'Usuario y contraseña son obligatorios' });
    }

    conexion.query(
        'SELECT * FROM usuarios WHERE nombre = ?',
        [nombre],
        async (err, results) => {
            if (err) {
                console.log('Error al buscar usuario', err);
                return res.status(500).json({ error: 'Error al autenticar usuario' });
            }

            if (results.length === 0) {
                return res.status(401).json({ error: 'Usuario no encontrado' });
            }

            const user = results[0];
            const passwordMatch = await bcrypt.compare(password, user.password);

            if (!passwordMatch) {
                return res.status(401).json({ error: 'Contraseña incorrecta' });
            }

            const token = jwt.sign({ id: user.id, nombre: user.nombre }, 'secretKey', { expiresIn: '1h' });
            console.log(token);
            res.status(200).json({
                message: 'Autenticación exitosa',
                token: token,
                nombre: user.nombre // Enviar el nombre del usuario en la respuesta
            });
        }
    );
});

// Ruta para cerrar sesión
router.get('/logout', (req, res) => {

    res.clearCookie('token', { path: '/' });
    res.status(200).json({ message: 'Sesión cerrada' });
    
  });

// Ruta para registrar un nuevo usuario (POST)
router.post('/registro', async (req, res) => {
    const { nombre, correo, password } = req.body;
    
    if (!nombre || !correo || !password) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    try {
      
        const hashedPassword = await bcrypt.hash(password, 10);
        
        conexion.query(
            'INSERT INTO usuarios (nombre, correo, password) VALUES (?, ?, ?)',
            [nombre, correo, hashedPassword],
            (err, result) => {
                if (err) {
                    console.log('Error al insertar datos', err);
                    return res.status(500).json({ error: 'Error al registrar usuario' });
                }
                res.status(201).json({ message: 'Usuario registrado con éxito' });
            }
        );
    } catch (err) {
        console.log('Error al cifrar la contraseña', err);
        res.status(500).json({ error: 'Error al registrar usuario' });
    }
});

// Ruta para buscar FAQs por palabra clave en la pregunta
router.get('/faqs', (req, res) => {
    const { search } = req.query; 
    const searchTerm = `%${search}%`; 

    const query = `SELECT * FROM faqs WHERE pregunta LIKE ?`;
    conexion.query(query, [searchTerm], (err, resultados) => {
        if (err) {
            console.log('Error al obtener FAQs:', err);
            return res.status(500).json({ error: 'Error al obtener FAQs' });
        }
        console.log(resultados);
        res.json(resultados); 
    });
});

    // Ruta para obtener los datos del usuario a partir del token
    router.get('/usuario', verifyToken, (req, res) => {
        const nombre = req.nombre; 
        
        const query = 'SELECT * FROM usuarios WHERE nombre = ?';
        conexion.query(query, [nombre], (err, result) => {
            if (err) {
                console.log('Error al obtener datos del usuario:', err);
                return res.status(500).json({ error: 'Error al obtener los datos del usuario' });
            }

            if (result.length > 0) {
                res.status(200).json(result[0]); 
            } else {
                res.status(404).json({ error: 'Usuario no encontrado' });
            }
        });
    });

// Ruta para crear un nuevo ticket asociado al usuario autenticado
router.post('/tickets', verifyToken, (req, res) => {
    const { nombre, email, categoria, descripcion } = req.body;

    if (!nombre || !email || !categoria || !descripcion) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    const id_usuario = req.userId;

    const num_ticket = Math.floor(Math.random() * 1000000); 

    const query = 'INSERT INTO tickets (id_usuario, nombre, email, categoria, descripcion, num_ticket) VALUES (?, ?, ?, ?, ?, ?)';
    conexion.query(query, [id_usuario, nombre, email, categoria, descripcion, num_ticket], (err, result) => {
        if (err) {
            console.log('Error al crear ticket:', err);
            return res.status(500).json({ error: 'Error al crear el ticket' });
        }

        res.status(201).json({ message: 'Ticket creado con éxito', num_ticket: num_ticket });
    });
});


// Ruta para obtener los tickets del usuario autenticado
router.get('/tickets', verifyToken, (req, res) => {
    const id_usuario = req.userId; 

    const query = 'SELECT * FROM tickets WHERE id_usuario = ?';
    conexion.query(query, [id_usuario], (err, resultados) => {
        if (err) {
            console.log('Error al obtener los tickets:', err);
            return res.status(500).json({ error: 'Error al obtener los tickets' });
        }
        if (resultados.length === 0) {
            return res.status(404).json({ error: 'No se encontraron tickets' });
        }
        res.json(resultados);
    });
});


// Ruta para obtener los tickets del usuario autenticado
router.get('/tickets', verifyToken, (req, res) => {
    const userId = req.userId; 

    const query = 'SELECT * FROM tickets WHERE usuario_id = ?';
    conexion.query(query, [userId], (err, results) => {
        if (err) {
            console.log('Error al obtener los tickets del usuario:', err);
            return res.status(500).json({ error: 'Error al obtener los tickets' });
        }
        console.log(results);
        // Renderizar los resultados en un archivo HTML usando EJS
        res.render('tickets', { tickets: results });
    });
});


module.exports = router;
module.exports.verifyToken = verifyToken;