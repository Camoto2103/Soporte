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
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(403).json({ error: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, 'secretKey', (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Token no válido' });
        }

        req.userId = decoded.id; 
        next();
    });
};

router.get('/protegida', verifyToken, (req, res) => {
    res.json({ message: 'Acceso permitido', userId: req.userId });
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

            res.status(200).json({
                message: 'Autenticación exitosa',
                token: token,
                nombre: user.nombre // Enviar el nombre del usuario en la respuesta
            });
        }
    );
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

// Ruta para crear un nuevo ticket asociado al usuario autenticado
router.post('/tickets', verifyToken, (req, res) => {
    const { nombre, email, categoria, descripcion } = req.body;

    if (!nombre || !email || !categoria || !descripcion) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    // Obtener id_usuario desde el token
    const id_usuario = req.userId;

    // Generar un número de ticket
    const num_ticket = Math.floor(Math.random() * 1000000); // Generar un número aleatorio para el ticket

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
    const id_usuario = req.userId; // Obtener id_usuario desde el token

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


// Ruta para obtener las respuestas de un ticket del usuario autenticado
router.get('/tickets/:id/respuestas', verifyToken, (req, res) => {
    const { id } = req.params;
    const id_usuario = req.userId; // Obtener id_usuario desde el token

    // Verificar que el ticket pertenece al usuario autenticado
    const query = `
        SELECT * FROM tickets WHERE id_ticket = ? AND id_usuario = ?
    `;
    conexion.query(query, [id, id_usuario], (err, ticket) => {
        if (err || ticket.length === 0) {
            console.log('Error al obtener el ticket o no pertenece al usuario:', err);
            return res.status(404).json({ error: 'Ticket no encontrado o no pertenece al usuario' });
        }

        // Obtener las respuestas del ticket
        const respuestaQuery = `
            SELECT tr.id_ticket, tr.respuesta, tr.estado, tr.fecha_actualizacion
            FROM tickets_respuestas tr
            WHERE tr.id_ticket = ?
        `;
        conexion.query(respuestaQuery, [id], (err, respuestas) => {
            if (err) {
                console.log('Error al obtener respuestas del ticket:', err);
                return res.status(500).json({ error: 'Error al obtener las respuestas del ticket' });
            }
            res.json(respuestas);
        });
    });
});

module.exports = router;
module.exports.verifyToken = verifyToken;