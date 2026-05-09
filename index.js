//importa la libreria
const express = require('express');

//intanciar la app
const app = express();

//aca le decimos middelware para json
app.use(express.json())

//configurar el puerto (Por convicion es el 3000)
const PORT = 3014;

//definir de las rutas
// req= request (Lo que viene del cliente)
// res= response (Lo que enviamos del lado back)
app.get('/', (req, res) => {
    res.send('Hola mundo desde back')
})

let users = [{ id: 1, nombre: 'Chris' }]

app.get('/users', (req, res) => res.json(users))

app.post('/users', (req, res) => {
    const {nombre} = req.body

    if(!nombre || nombre.trim()===''){
        return res.status(400).json({
            error:"El nombre es obligatorio"
        })
    }

    const nuevo = {id: users.length+1, nombre}
    users.push(nuevo);
    res.status(201).json(nuevo)
})




app.delete('/users/:id', (req, res) => {
    const idDelete = parseInt(req.params.id)
    const index = users.findIndex(u => u.id === idDelete)

    if (index === -1) {
        return res.status(404).json({
            error: "Usuario no encontrado",
            message: `No existe un usuario con el id ${idDelete}`
        })
    }

    const userEliminado = users.splice(index, 1);


    res.json({
        message: "Usuario eliminado",
        user: userEliminado[0]
    })
})

app.get('/users/:id', (req, res) => {
    const idDelete = parseInt(req.params.id)
    const index = users.find((u) => u.id === id)

    if (!users) {
        return res.status(404).json({
            error: "Usuario no encontrado"
        })
    }

    res.json(user)
})




app.put("/users/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const index = users.findIndex((u) => u.id === id);
    if (index === -1) {
    return res.status(404).json({
      error: "Usuario no encontrado"
    });
  }
    users[index] = { id, ...req.body };
    res.json({
        message: "Usuario actualizado",
        user: users[index]
    });
});


app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`)
})