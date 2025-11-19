# Backend API - Sistema de Usuarios

API REST simple para gestionar usuarios en el archivo `usuarios.json`.

## 🚀 Instalación y ejecución

### 1. Instalar dependencias
```bash
cd server
npm install
```

### 2. Iniciar el servidor
```bash
npm start
```

El servidor estará disponible en: `http://localhost:3000`

### 3. Modo desarrollo (con auto-reload)
```bash
npm run dev
```

## 📡 Endpoints disponibles

### GET /api/usuarios
Obtiene todos los usuarios.

**Respuesta:**
```json
[
  {
    "username": "jdoe",
    "password": "password123"
  }
]
```

### PUT /api/usuarios/:oldUsername
Actualiza un usuario existente.

**Parámetros URL:**
- `oldUsername`: Nombre de usuario actual

**Body (JSON):**
```json
{
  "username": "nuevo_usuario",
  "password": "nueva_contraseña"
}
```

**Respuesta:**
```json
{
  "message": "Usuario actualizado exitosamente",
  "usuario": {
    "username": "nuevo_usuario",
    "password": "nueva_contraseña"
  }
}
```

### POST /api/usuarios
Crea un nuevo usuario.

**Body (JSON):**
```json
{
  "username": "nuevo_usuario",
  "password": "contraseña"
}
```

### DELETE /api/usuarios/:username
Elimina un usuario.

**Parámetros URL:**
- `username`: Nombre del usuario a eliminar

## 🔧 Configuración

- **Puerto:** 3000 (configurable en `server.js`)
- **CORS:** Habilitado para todas las peticiones
- **Archivo de datos:** `../src/assets/usuarios.json`

## 📝 Notas

- El servidor debe estar corriendo para que la app pueda actualizar usuarios
- Si el servidor no está disponible, la app usará el archivo `usuarios.json` local (solo lectura)
- Los cambios se guardan inmediatamente en el archivo JSON
