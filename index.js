const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./config/db'); 

const app = express();

app.use(express.json());
app.use(cors());

const PORT = 3014;

app.get('/', (req, res) => {
    res.send('hola');
});

app.get('/test-db', async (req, res) => {
    try {
   
        const [rows] = await db.query('SELECT 1 + 1 AS resultado');
        res.json({ message: "¡Conexión exitosa a la base de datos!", rows });
    } catch (error) {
        console.error("Error conectando a la BD:", error);
        res.status(500).json({ error: "Fallo la conexión a MySQL" });
    }
});

app.listen(PORT, () => {
    console.log(`Backend escuchando en http://localhost:${PORT}`);
});

app.post('/register', async (req, res) => {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
        return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    try {
        const hashPassword = await bcrypt.hash(password, 10);

        const [resultado] = await db.query(
            'INSERT INTO Usuarios (nombre, email, password, estado) VALUES (?, ?, ?, ?)',
            [nombre, email, hashPassword, 1]
        );

        res.status(201).json({ message: "Usuario registrado con éxito" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al registrar el usuario" });
    }
});

app.post('/register_admin', async (req, res) => {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
        return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    try {
        const hashPassword = await bcrypt.hash(password, 10);

        const [resultado] = await db.query(
            'INSERT INTO admin (nombre, email, password) VALUES (?, ?, ?)',
            [nombre, email, hashPassword]
        );

        res.status(201).json({ message: "Usuario registrado con éxito" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al registrar el usuario" });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [rows] = await db.query('SELECT * FROM Usuarios WHERE email = ?', [email]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        const usuario = rows[0];
        const passwordValido = await bcrypt.compare(password, usuario.password);

        if (!passwordValido) {
            return res.status(401).json({ error: "Contraseña incorrecta" });
        }

        const token = jwt.sign(
            { id: usuario.id_usuario, nombre: usuario.nombre }, 
            'clave_secreta', 
            { expiresIn: '2h' }
        );

        res.json({ 
            message: "¡Bienvenido arrebatado!", 
            token: token 
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error interno del servidor" });
    }

    
});

app.post('/login_admin', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [rows] = await db.query('SELECT * FROM admin WHERE email = ?', [email]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        const usuario = rows[0];
        const passwordValido = await bcrypt.compare(password, usuario.password);

        if (!passwordValido) {
            return res.status(401).json({ error: "Contraseña incorrecta" });
        }

        const token = jwt.sign(
            { id: usuario.id_usuario, nombre: usuario.nombre }, 
            'clave_secreta', 
            { expiresIn: '2h' }
        );

        res.json({ 
            message: "¡Bienvenido arrebatado!", 
            token: token 
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error interno del servidor" });
    }

    
});