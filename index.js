const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();


app.use(express.json()); 
app.use(cors());         

const PORT = 3014;

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',            
    password: '',             
    database: 'gym'
});

app.get('/', (req, res) => {
    res.send('holaaaa');
});

// Arrancar el servidor
app.listen(PORT, () => {
    console.log(`Backend escuchando en http://localhost:${PORT}`);
});