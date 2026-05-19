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
app.get('/users', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id_usuario, nombre, email, estado FROM Usuarios');
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener usuarios:", error);
        res.status(500).json({ error: "Error al consultar la base de datos" });
    }
});

app.post('/register', async (req, res) => {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
        return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    try {
        const hashPassword = await bcrypt.hash(password, 10);

        await db.query(
            'INSERT INTO Usuarios (nombre, email, password, estado) VALUES (?, ?, ?, ?)',
            [nombre, email, hashPassword, 1]
        );

        return res.status(201).json({ message: "Usuario registrado con éxito" });
    } catch (error) {
        console.error(error);
        if (error.errno === 1062) {
            return res.status(400).json({ error: "El correo ya está registrado como atleta." });
        }
        return res.status(500).json({ error: "Error al registrar el usuario" });
    }
});

app.post('/register_admin', async (req, res) => {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
        return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    try {
        const hashPassword = await bcrypt.hash(password, 10);

        await db.query(
            'INSERT INTO admin (nombre, email, password) VALUES (?, ?, ?)',
            [nombre, email, hashPassword]
        );

        return res.status(201).json({ message: "Admin registrado con éxito" });
    } catch (error) {
        console.error(error);
        if (error.errno === 1062) {
            return res.status(400).json({ error: "El correo ya pertenece a un administrador." });
        }
        return res.status(500).json({ error: "Error al registrar el administrador" });
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
        return res.json({ 
            message: "¡Bienvenido arrebatado!", 
            token: token,
            user: { id: usuario.id_usuario, nombre: usuario.nombre, email: usuario.email }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});

app.post('/login_admin', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [rows] = await db.query('SELECT * FROM admin WHERE email = ?', [email]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: "Administrador no encontrado" });
        }
        const usuario = rows[0];
        const passwordValido = await bcrypt.compare(password, usuario.password);
        if (!passwordValido) {
            return res.status(401).json({ error: "Contraseña incorrecta" });
        }
        const token = jwt.sign(
            { id: usuario.id_admin, nombre: usuario.nombre, rol: 'admin' }, 
            'clave_secreta', 
            { expiresIn: '2h' }
        );
        return res.json({ 
            message: "¡Bienvenido Modo Dios!", 
            token: token,
            user: { id: usuario.id_admin, nombre: usuario.nombre, email: usuario.email, rol: 'admin' }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});

app.get('/rutinas', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM rutina');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Error al consultar las rutinas" });
    }
});
``

app.get('/rutina/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [rutinas] = await db.query('SELECT * FROM rutina WHERE id_rutina = ?', [id]);
        
        if (rutinas.length === 0) {
            return res.status(404).json({ error: "La rutina solicitada no existe" });
        }

        const rutinaInfo = rutinas[0];

        const queryDetalles = `
            SELECT 
                rd.id_detalle,
                rd.series,
                rd.repeticiones,
                rd.tiempo_descanso,
                rd.dia_semana,
                e.id_ejercicio,
                e.nombre AS nombre_ejercicio,
                e.grupo_muscular,
                e.descripcion
            FROM rutina_detalles rd
            INNER JOIN ejercicios e ON rd.ejercicios_id_ejercicio = e.id_ejercicio
            WHERE rd.rutina_id_rutina = ?
            ORDER BY rd.dia_semana ASC, rd.id_detalle ASC
        `;

        const [ejercicios] = await db.query(queryDetalles, [id]);

        return res.json({
            id_rutina: rutinaInfo.id_rutina,
            nombre_rutina: rutinaInfo.nombre_rutina,
            objetivo: rutinaInfo.objetivo,
            total_ejercicios: ejercicios.length,
            ejercicios: ejercicios 
        });

    } catch (error) {
        console.error("Error al consultar el detalle de la rutina:", error);
        return res.status(500).json({ error: "Error interno al obtener los detalles de la rutina" });
    }
});

app.get('/ejercicios', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM ejercicios ORDER BY grupo_muscular ASC, nombre ASC');
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener ejercicios:", error);
        res.status(500).json({ error: "Error al consultar los ejercicios" });
    }
});

app.post('/rutina', async (req, res) => {
    const { nombre_rutina, objetivo, ejercicios } = req.body;

    if (!nombre_rutina || !ejercicios || ejercicios.length === 0) {
        return res.status(400).json({ error: "Faltan datos o ejercicios para la rutina" });
    }

    try {
        const [resultRutina] = await db.query(
            'INSERT INTO rutina (nombre_rutina, objetivo) VALUES (?, ?)',
            [nombre_rutina, objetivo]
        );
        const idRutinaNueva = resultRutina.insertId;

        for (const ej of ejercicios) {
            await db.query(
                'INSERT INTO rutina_detalles (rutina_id_rutina, ejercicios_id_ejercicio, series, repeticiones, tiempo_descanso, dia_semana) VALUES (?, ?, ?, ?, ?, ?)',
                [idRutinaNueva, ej.id_ejercicio, ej.series, ej.repeticiones, ej.tiempo_descanso, 1] 
            );
        }

        return res.status(201).json({ message: "Rutina creada con éxito" });
    } catch (error) {
        console.error("Error al crear la rutina:", error);
        return res.status(500).json({ error: "Error interno al guardar la rutina en la base de datos" });
    }
});

app.delete('/rutina/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query('DELETE FROM rutina WHERE id_rutina = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Rutina no encontrada" });
        }
        
        return res.json({ message: "Rutina eliminada correctamente" });
    } catch (error) {
        console.error("Error al eliminar la rutina:", error);
        return res.status(500).json({ error: "Error interno al eliminar la rutina" });
    }
});

app.put('/rutina/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre_rutina, objetivo, ejercicios } = req.body;
    if (!nombre_rutina || !ejercicios || ejercicios.length === 0) {
        return res.status(400).json({ error: "Faltan datos o ejercicios" });
    }
    try {
        await db.query(
            'UPDATE rutina SET nombre_rutina = ?, objetivo = ? WHERE id_rutina = ?',
            [nombre_rutina, objetivo, id]
        );
        await db.query('DELETE FROM rutina_detalles WHERE rutina_id_rutina = ?', [id]);
        for (const ej of ejercicios) {
            await db.query(
                'INSERT INTO rutina_detalles (rutina_id_rutina, ejercicios_id_ejercicio, series, repeticiones, tiempo_descanso, dia_semana) VALUES (?, ?, ?, ?, ?, ?)',
                [id, ej.id_ejercicio, ej.series, ej.repeticiones, ej.tiempo_descanso, 1]
            );
        }
        return res.json({ message: "Rutina actualizada con éxito" });
    } catch (error) {
        console.error("Error al actualizar la rutina:", error);
        return res.status(500).json({ error: "Error interno al actualizar la rutina" });
    }
});

app.post('/ejercicios', async (req, res) => {
    const { nombre, grupo_muscular, descripcion } = req.body;

    if (!nombre || !grupo_muscular) {
        return res.status(400).json({ error: "Nombre y grupo muscular son obligatorios" });
    }

    try {
        await db.query(
            'INSERT INTO ejercicios (nombre, grupo_muscular, descripcion) VALUES (?, ?, ?)',
            [nombre, grupo_muscular, descripcion]
        );
        res.status(201).json({ message: "Ejercicio creado con éxito" });
    } catch (error) {
        console.error("Error al crear ejercicio:", error);
        res.status(500).json({ error: "Error al guardar el ejercicio" });
    }
});

app.post('/asignar-rutina', async (req, res) => {
    const { id_usuario, id_rutina } = req.body;

    if (!id_usuario || !id_rutina) {
        return res.status(400).json({ error: "Faltan datos para la asignación" });
    }

    try {
        await db.query('DELETE FROM asignacion WHERE Usuarios_id_usuario = ?', [id_usuario]);

        await db.query(
            'INSERT INTO asignacion (Usuarios_id_usuario, rutina_id_rutina) VALUES (?, ?)',
            [id_usuario, id_rutina]
        );

        return res.status(200).json({ message: "Rutina asignada exitosamente al atleta" });
    } catch (error) {
        console.error("Error al asignar rutina:", error);
        return res.status(500).json({ error: "Error interno al asignar la rutina" });
    }
});



app.listen(PORT, () => {
    console.log(`Backend escuchando en http://localhost:${PORT}`);
});