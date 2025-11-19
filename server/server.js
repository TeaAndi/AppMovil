const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Ruta al archivo usuarios.json
const usuariosPath = path.join(__dirname, '../src/assets/usuarios.json');

// GET: Obtener todos los usuarios
app.get('/api/usuarios', (req, res) => {
  try {
    const data = fs.readFileSync(usuariosPath, 'utf8');
    const usuarios = JSON.parse(data);
    res.json(usuarios);
  } catch (error) {
    console.error('Error leyendo usuarios.json:', error);
    res.status(500).json({ error: 'Error al leer usuarios' });
  }
});

// PUT: Actualizar un usuario específico
app.put('/api/usuarios/:oldUsername', (req, res) => {
  try {
    const { oldUsername } = req.params;
    const { username, password } = req.body;

    // Leer el archivo actual
    const data = fs.readFileSync(usuariosPath, 'utf8');
    let usuarios = JSON.parse(data);

    // Buscar el índice del usuario
    const userIndex = usuarios.findIndex(u => u.username === oldUsername);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Actualizar el usuario
    usuarios[userIndex] = {
      username: username,
      password: password
    };

    // Guardar el archivo actualizado
    fs.writeFileSync(usuariosPath, JSON.stringify(usuarios, null, 2), 'utf8');

    res.json({ 
      message: 'Usuario actualizado exitosamente',
      usuario: usuarios[userIndex]
    });

  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

// POST: Agregar un nuevo usuario
app.post('/api/usuarios', (req, res) => {
  try {
    const { username, password } = req.body;

    // Leer el archivo actual
    const data = fs.readFileSync(usuariosPath, 'utf8');
    let usuarios = JSON.parse(data);

    // Verificar que el usuario no exista
    if (usuarios.find(u => u.username === username)) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }

    // Agregar el nuevo usuario
    usuarios.push({ username, password });

    // Guardar el archivo actualizado
    fs.writeFileSync(usuariosPath, JSON.stringify(usuarios, null, 2), 'utf8');

    res.status(201).json({ 
      message: 'Usuario creado exitosamente',
      usuario: { username, password }
    });

  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

// DELETE: Eliminar un usuario
app.delete('/api/usuarios/:username', (req, res) => {
  try {
    const { username } = req.params;

    // Leer el archivo actual
    const data = fs.readFileSync(usuariosPath, 'utf8');
    let usuarios = JSON.parse(data);

    // Filtrar para eliminar el usuario
    const nuevosUsuarios = usuarios.filter(u => u.username !== username);

    if (nuevosUsuarios.length === usuarios.length) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Guardar el archivo actualizado
    fs.writeFileSync(usuariosPath, JSON.stringify(nuevosUsuarios, null, 2), 'utf8');

    res.json({ message: 'Usuario eliminado exitosamente' });

  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor API corriendo en http://localhost:${PORT}`);
  console.log(`📁 Usuarios JSON: ${usuariosPath}`);
});
