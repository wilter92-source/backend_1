# Backend de Turnos y Reservas

Proyecto desarrollado como parte de la pre-entrega del módulo 3 de Backend.

La aplicación consiste en una API REST para gestionar servicios y reservas utilizando Node.js, Express y persistencia de datos mediante archivos JSON.

## Tecnologías utilizadas

- Node.js
- Express
- JavaScript con ES Modules
- FileSystem (`fs.promises`)
- dotenv

---

## Instalación

Clonar el repositorio y ejecutar:

```bash
npm install
```

Luego crear un archivo `.env` en la raíz del proyecto utilizando como referencia el archivo `.env.example`.

Ejemplo:

```env
PORT=8080
NODE_ENV=development
```

> El archivo `.env` contiene variables locales y no debe subirse al repositorio.

---

## Ejecución

Para iniciar el servidor:

```bash
npm start
```

El servidor se ejecutará en el puerto configurado en las variables de entorno.

Ejemplo:

```
Servidor iniciado correctamente.
Puerto: 8080
```

---

# Estructura del proyecto

```
backend-turnos-reservas/

├── src/
│   ├── config/
│   │   └── env.config.js
│   │
│   ├── data/
│   │   ├── services.json
│   │   └── bookings.json
│   │
│   ├── managers/
│   │   ├── ServiceManager.js
│   │   └── BookingManager.js
│   │
│   ├── routes/
│   │   ├── services.router.js
│   │   └── bookings.router.js
│   │
│   ├── app.js
│   └── server.js
│
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

# Persistencia

Los datos se almacenan utilizando archivos JSON:

```
src/data/services.json
src/data/bookings.json
```

La aplicación utiliza `fs.promises` para leer y escribir los archivos de forma asíncrona.

---

# Recurso Services

Cada servicio contiene:

```json
{
  "id": 1,
  "name": "Consulta médica",
  "description": "Consulta general",
  "duration": 30,
  "price": 25,
  "category": "salud",
  "available": true
}
```

El campo `id` se genera automáticamente.

## Endpoints disponibles

### Obtener todos los servicios

```
GET /api/services
```

### Obtener servicio por ID

```
GET /api/services/:sid
```

### Crear servicio

```
POST /api/services
```

Ejemplo:

```json
{
  "name": "Consulta médica",
  "description": "Consulta general",
  "duration": 30,
  "price": 25,
  "category": "salud",
  "available": true
}
```

### Actualizar servicio

```
PUT /api/services/:sid
```

### Eliminar servicio

```
DELETE /api/services/:sid
```

---

# Recurso Bookings

Las reservas contienen:

```json
{
  "id": 1,
  "clientName": "Juan Pérez",
  "clientEmail": "juan@email.com",
  "date": "2026-09-01",
  "time": "10:00",
  "status": "pending",
  "services": [
    {
      "service": 1,
      "quantity": 1
    }
  ]
}
```

Las reservas guardan únicamente el ID del servicio y la cantidad solicitada.

## Endpoints disponibles

### Crear reserva

```
POST /api/bookings
```

### Obtener reserva por ID

```
GET /api/bookings/:bid
```

### Agregar servicio a una reserva

```
POST /api/bookings/:bid/services/:sid
```

Si un servicio ya existe dentro de la reserva, aumenta el valor de `quantity`.

---

# Variables de entorno

Variables utilizadas:

| Variable | Descripción |
|---|---|
| PORT | Puerto donde inicia el servidor |
| NODE_ENV | Ambiente de ejecución |

---

# Notas

- Los archivos JSON permiten mantener la información después de reiniciar el servidor.
- La carpeta `node_modules` y el archivo `.env` están excluidos mediante `.gitignore`.
- El proyecto utiliza módulos ES (`import` / `export`).
