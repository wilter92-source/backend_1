# Backend de Turnos y Reservas - Pre-entrega 6

Es una API para crear servicios y armar reservas. Está hecha con Node.js,
Express y JavaScript con módulos ES. Los datos se guardan en MongoDB Atlas mediante Mongoose.

En esta entrega separé lo que estaba en los managers en tres capas:
services, repositories y DAO. Las rutas de la API siguen siendo las mismas.

## Cómo iniciarlo

Usar Node.js 20 o superior. Desde la carpeta donde está `package.json`:

```bash
npm ci
```

Crear un archivo `.env` copiando `.env.example`. Debe quedar así:

```env
PORT=8080
NODE_ENV=development
MONGO_URI=tu_uri_de_mongodb_atlas
```

Después ejecutar:

```bash
npm start
```

Para cargar los servicios iniciales desde el JSON hacia MongoDB:

```bash
npm run seed
```

La dirección es `http://localhost:8080`. Si cambio PORT, también tengo que
cambiar el puerto en Postman. Para trabajar con reinicio automático puedo
usar `npm run dev`.

## Cómo organicé las capas

El recorrido es: router → controller → service → repository → DAO → MongoDB.

- `src/routes/`: define las URLs y llama a los controllers.
- `src/controllers/`: recibe los datos de la petición y devuelve la respuesta HTTP.
- `src/services/`: valida los datos y contiene las reglas de servicios y reservas.
- `src/repositories/`: pasa las operaciones al DAO, sin reglas de negocio.
- `src/dao/`: contiene los DAOs que conectan con los modelos Mongoose y MongoDB.
- `src/dao/models/`: contiene los esquemas de Service, Booking y Message.
- `src/data/`: contiene los datos JSON usados como fuente para la carga inicial.
- `src/config/env.config.js`: carga y revisa las variables de entorno.
- `src/app.js`: configura Express y conecta las rutas.
- `src/server.js`: inicia el servidor.

Por ejemplo, al agregar un servicio a una reserva, el controller pasa los IDs
al service. El service consulta los repositories para comprobar que ambos
existan. Si el servicio ya estaba agregado, aumenta `quantity`; si no, lo
agrega con cantidad 1. El repository manda el resultado al DAO para guardarlo.

Los controllers y services no leen archivos. Para usar otra persistencia más
adelante, se puede cambiar el DAO conectado al repository.

## Rutas

| Método | Ruta | Qué hace |
| --- | --- | --- |
| GET | `/api/services` | Lista los servicios |
| GET | `/api/services/:sid` | Busca un servicio por ID |
| POST | `/api/services` | Crea un servicio |
| PUT | `/api/services/:sid` | Actualiza campos de un servicio |
| DELETE | `/api/services/:sid` | Elimina un servicio |
| POST | `/api/bookings` | Crea una reserva |
| GET | `/api/bookings/:bid` | Busca una reserva por ID |
| POST | `/api/bookings/:bid/services/:sid` | Agrega un servicio a una reserva |

`sid` es el ID de un servicio y `bid` el de una reserva. Hay que reemplazarlos
por los valores devueltos al crear cada recurso. También se conserva `GET /`
para comprobar que la API responde.

Para filtrar servicios: `GET /api/services?category=salud&available=true`.
`category` usa coincidencia exacta; usar `true` o `false` para `available`.

## Ejemplos para Postman

Seleccionar **Body → raw → JSON** en las peticiones que llevan datos.
Enviar `Content-Type: application/json`.

### Crear un servicio

`POST http://localhost:8080/api/services`

```json
{
  "name": "Consulta general",
  "description": "Consulta de 30 minutos",
  "duration": 30,
  "price": 25,
  "category": "salud",
  "available": true
}
```

Todos esos campos son obligatorios. `name`, `description` y `category` son
textos no vacíos. `duration` es un número mayor que cero (minutos), `price`
es un número mayor o igual a cero y `available` es booleano, sin comillas.
El ID se genera automáticamente.

### Actualizar un servicio

`PUT http://localhost:8080/api/services/1`

```json
{
  "price": 30,
  "available": false
}
```

Se pueden enviar solo los campos que se quieren cambiar; conservan el mismo
formato del POST. Los demás quedan igual. No se puede cambiar el ID y los
campos que no pertenecen al servicio se ignoran.

### Crear una reserva

`POST http://localhost:8080/api/bookings`

```json
{
  "clientName": "Ana Perez",
  "clientEmail": "ana@example.com",
  "date": "2026-10-10",
  "time": "10:30",
  "status": "pending",
  "services": [
    { "service": 1, "quantity": 1 }
  ]
}
```

`clientName`, `clientEmail`, `date`, `time` y `status` son obligatorios.
El nombre y el estado deben ser textos no vacíos; se usa `pending` en este
ejemplo. El email debe tener un formato válido, la fecha debe existir y
seguir `YYYY-MM-DD`, y la hora usa `HH:mm` en formato de 24 horas.

`services` es opcional: se puede omitir o enviar `[]`. Si se incluye, cada
elemento necesita `service` (ID de un servicio existente) y `quantity`
(entero positivo). Solo se guardan el ID y la cantidad, no el servicio
completo. Si se repite un ID en el body, se suman sus cantidades.

### Agregar un servicio a una reserva

`POST http://localhost:8080/api/bookings/1/services/1`

No necesita body. Repetir la petición aumenta la cantidad del mismo servicio.
Si la reserva o el servicio no existen, devuelve 404.

## Respuestas y datos

Las consultas, actualizaciones y eliminaciones responden 200; las creaciones,
201. La respuesta correcta tiene `status: "success"` y los datos en `payload`.
Los errores tienen `status: "error"` y un `message`. Los datos inválidos al
crear o actualizar devuelven 400 y las búsquedas sin resultado devuelven 404.

Los datos se almacenan en MongoDB Atlas. Los archivos de `src/data/` se mantienen como fuente de carga inicial y pueden migrarse ejecutando el script de seed.

Los archivos `services.counter.json` y `bookings.counter.json` guardan el
último ID asignado. No hay que borrarlos al eliminar registros: evitan que se
reutilicen IDs. Se deben subir junto con los datos. Esta versión con archivos
está pensada para ejecutar una sola instancia del servidor a la vez.

## Pruebas

```bash
npm test
```

Las pruebas usan una copia temporal de los datos, por lo que no cambian los
JSON de la entrega. Revisan las rutas, filtros, validaciones, actualización,
eliminación, persistencia, IDs y el incremento de cantidades con varias
peticiones. No necesitan crear `.env`.

## Antes de entregar

- Crear `.env` solo en la computadora local y comprobar `npm start`.
- Ejecutar `npm test` y probar las rutas en Postman con los ejemplos de arriba.
- Revisar los JSON después de las pruebas manuales y no subir datos personales reales.
- Subir el contenido de esta carpeta al repositorio, incluyendo `.env.example`, `.gitignore`, `package-lock.json` y los contadores.
- No subir `.env`, `node_modules` ni credenciales. Ya están excluidos los archivos locales habituales en `.gitignore`.
- Dejar el repositorio público y entregar su enlace, como pide la consigna.
