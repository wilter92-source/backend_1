# Backend de Turnos y Reservas — Módulo 7 · Pre-entrega 08

API REST con MongoDB, arquitectura en capas, vistas Handlebars y actualizaciones en tiempo real con Socket.io. Las vistas consultan los mismos servicios de negocio que la API; los registros se leen de MongoDB, no de archivos JSON ni de datos fijos dentro de las plantillas.

## Inicio rápido

Requisitos: Node.js 22.22.2 o superior (recomendado: Node.js 24), npm y MongoDB 6 o superior, local o Atlas.

1. Abrir una terminal en esta carpeta, donde está `package.json`.
2. Ejecutar `npm ci`.
3. Copiar `.env.example` como `.env` y configurar `MONGO_URI`. Si ya tienes un `.env` válido de la entrega anterior, puedes conservarlo. Para Atlas, usar la cadena de conexión de tu cuenta y habilitar acceso desde tu equipo. Nunca publicar esa cadena.
4. Ejecutar `npm start` y mantener esa terminal abierta.
5. En otra terminal de esta misma carpeta, ejecutar `npm run seed` si quieres cargar el catálogo de ejemplo. Requiere el servidor activo: usa su API para validar, persistir y notificar a las vistas. No borra datos y omite los servicios ya existentes.
6. Abrir `http://localhost:8080/views/services` y `http://localhost:8080/views/bookings`.

`.env.example` usa un MongoDB local; no instala ni inicia MongoDB. Si eliges esa configuración, el servicio de MongoDB debe estar activo. El servidor conecta la base **antes** de escuchar peticiones. `npm run dev` inicia Node con reinicio automático al editar.

```env
PORT=8080
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/turnos_reservas
```

Las reservas se crean mediante la API o la colección de Postman incluida. Una base sin reservas muestra un estado vacío válido, no registros inventados.

## Vistas y tiempo real

| Ruta | Contenido |
| --- | --- |
| `/views/services` | Nombre, descripción, duración, precio, categoría y disponibilidad |
| `/views/bookings` | Cliente, email, fecha, hora, estado, servicios poblados y cantidades |

Handlebars genera el HTML inicial. `public/js/socket.js` escucha los eventos siguientes:

| Evento | Acción real que lo emite |
| --- | --- |
| `services:changed` | Crear, actualizar o eliminar un servicio desde la capa de negocio (API y seed) |
| `bookings:changed` | Crear una reserva o agregar un servicio a una reserva |

La capa de servicios publica un evento de dominio después de guardar el cambio correctamente. `src/config/socket.config.js` lo retransmite por Socket.io; los controllers no emiten eventos. Las llamadas directas a servicios de negocio también notifican. El seed utiliza la API del servidor activo para propagar sus inserciones entre procesos. Contiene `action` e `id`; el navegador vuelve a consultar la API con sus filtros actuales y reemplaza únicamente la lista. No se recarga la página. La vista de reservas escucha también los cambios de servicios para reflejar modificaciones del nombre o referencias eliminadas.

Los listeners se registran una sola vez. Al reconectar se recupera el estado actual desde MongoDB. Un cambio hecho directamente en Atlas, por fuera de la aplicación, no genera estos eventos: para la demostración deben usarse las rutas de la API. El proyecto corre en una instancia de Node.

Las plantillas escapan los datos con `{{campo}}`. El cliente usa `textContent` y nodos DOM, sin interpolar datos de usuarios en `innerHTML`. `{{{body}}}` solo inserta el layout renderizado. No se usa un CDN para Socket.io: el propio servidor sirve su cliente.

## Demostración con Postman

1. Iniciar el servidor y abrir las dos vistas en el navegador. También puedes abrir servicios en dos pestañas.
2. Importar `postman/Modulo7.postman_collection.json` en Postman.
3. Revisar la variable de colección `baseUrl`, por defecto `http://localhost:8080`.
4. Ejecutar las peticiones en orden, manualmente o con Collection Runner. Las pruebas guardan automáticamente `sid`, `bid` y `mid`; no hace falta copiar IDs.
5. En la petición 01 aparece el servicio en las pestañas abiertas; en la 03 cambia su disponibilidad sin F5.
6. En la 04 aparece la reserva. La 05 comprueba que `populate` devuelve el nombre y el `_id` del servicio. La 06 verifica cantidad 2.
7. La 13 elimina el servicio de prueba. La reserva queda visible como «Servicio eliminado»; la 14 comprueba la referencia nula.

La colección crea una reserva y un mensaje de demostración que se conservan. Ejecutarla en una base de desarrollo. No contiene credenciales. Su ejecución en Postman con MongoDB queda pendiente de verificación local; no se presenta como una ejecución ya realizada.

## API REST

La respuesta mantiene `{ "status": "success", "payload": ... }`. Los listados mantienen un array en `payload`. Las creaciones responden 201; consultas, cambios y eliminaciones, 200; validación inválida, 400; recurso no encontrado, 404; fallo interno, 500.

| Método | Ruta | Función |
| --- | --- | --- |
| GET | `/` | Estado básico de la API |
| GET | `/api/services` | Listar servicios |
| GET | `/api/services/:sid` | Consultar servicio |
| POST | `/api/services` | Crear servicio |
| PUT | `/api/services/:sid` | Actualizar campos |
| DELETE | `/api/services/:sid` | Eliminar servicio |
| GET | `/api/bookings` | Listar reservas con populate |
| POST | `/api/bookings` | Crear reserva |
| GET | `/api/bookings/:bid` | Consultar reserva con populate |
| POST | `/api/bookings/:bid/services/:sid` | Agregar servicio o incrementar su cantidad |
| GET | `/api/messages` | Listar mensajes |
| POST | `/api/messages` | Crear mensaje |
| GET | `/api/messages/:mid` | Consultar mensaje |

Al agregar un servicio, los IDs mal formados devuelven 400 mediante Zod; IDs válidos pero inexistentes devuelven 404. Las consultas individuales conservan su respuesta 404 anterior.

Todos los IDs son `_id` de MongoDB (24 caracteres hexadecimales). No usar IDs numéricos de entregas anteriores.

### Crear servicio

`POST /api/services`, Body → raw → JSON:

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

Los esquemas Zod están en `src/validation/schemas.js` y se ejecutan desde la capa de servicios antes de consultar MongoDB. Cubren crear y actualizar servicios, crear reservas y los parámetros de agregar un servicio a una reserva. Los errores devuelven 400 e indican el campo problemático.

Los seis campos son obligatorios en POST. Nombre, descripción y categoría deben ser textos no vacíos; duración debe ser positiva; precio, no negativo; disponibilidad, booleano. PUT acepta una selección de estos campos. Los campos desconocidos y `_id` no se actualizan.

### Crear reserva

`POST /api/bookings`. Sustituir el ID ilustrativo por el `_id` real de un servicio existente:

```json
{
  "clientName": "Ana Prueba",
  "clientEmail": "ana@example.com",
  "date": "2026-10-10",
  "time": "10:30",
  "status": "pending",
  "services": [
    { "service": "507f1f77bcf86cd799439011", "quantity": 1 }
  ]
}
```

`status` admite `pending`, `confirmed` o `cancelled`, con `pending` por defecto. `services` puede omitirse o ser un array vacío. La fecha debe existir y usar `YYYY-MM-DD`; la hora usa `HH:mm` de 24 horas. Se verifica la existencia de cada servicio; las cantidades deben ser enteros positivos. Si se repite una referencia en el body, se suman sus cantidades.

Agregar un servicio a una reserva usa una actualización atómica de MongoDB para no perder incrementos simultáneos. Una reserva conserva su referencia si el servicio se elimina; `populate` devuelve `null` y la vista muestra «Servicio eliminado».

Consultar `GET /api/bookings/:bid` con el ID devuelto al crear la reserva. Dentro de `payload.services`, cada `service` será un objeto con `_id`, `name`, `description`, `duration`, `price`, `category` y `available`, junto con `quantity`. En MongoDB permanece solamente la referencia ObjectId; populate se aplica al leer, no al guardar.

Este módulo registra reservas y la disponibilidad general del servicio. No implementa un calendario de cupos ni impide solapamientos horarios; no se presenta como un motor de asignación de turnos completos.

### Crear mensaje

`POST /api/messages`:

```json
{ "user": "Ana", "message": "Quisiera consultar un horario" }
```

Ambos campos son textos no vacíos. Máximos: 100 caracteres para `user`, 2000 para `message`.

### Filtros, orden y paginación

Se aplican en MongoDB desde el DAO, no filtrando todos los registros en memoria. Son iguales en API y vistas para cada recurso.

| Recurso | Filtros exactos | Campos de orden adicionales a createdAt |
| --- | --- | --- |
| Servicios | category, available=true/false | name, price, duration, category |
| Reservas | status, date, clientEmail | date, time, clientName, status |
| Mensajes | user | user |

Todos admiten `page` (desde 1), `limit` (1–100), `sortBy` y `order=asc/desc`. Se conserva `sort` como alias compatible; si se envían ambos, prevalece `sortBy`. Por defecto: `page=1`, `limit=20`, `sortBy=createdAt`, `order=desc`. Los empates se resuelven por `_id`.

`GET /api/services` conserva el array `payload` y agrega `pagination`. El total corresponde al filtro completo, antes de limitar la página:

```json
{
  "status": "success",
  "payload": [],
  "pagination": {
    "total": 0,
    "page": 1,
    "limit": 20,
    "totalPages": 0,
    "hasPrevPage": false,
    "hasNextPage": false
  }
}
```

Una página fuera de rango devuelve un array vacío, conserva la página solicitada y mantiene el total real. `hasPrevPage` indica si la página solicitada es mayor que 1. Reservas y mensajes mantienen su contrato anterior sin metadatos.

```text
/api/services?category=salud&available=true&page=1&limit=10&sortBy=price&order=asc
/views/services?available=true&limit=50
/api/bookings?status=pending&date=2026-10-10&sort=time&order=asc
/views/bookings?status=pending
```

## Arquitectura

`routes → controllers → services → repositories → DAO → models → MongoDB`

- `src/routes/`: rutas de datos y de vistas, separadas.
- `src/controllers/`: entrada y salida HTTP y renderizado; sin emisión de eventos.
- `src/services/`: invocación de esquemas Zod, reglas de negocio, eventos posteriores a persistencia y preparación de consultas permitidas.
- `src/validation/`: esquemas Zod y traducción de errores a respuestas 400.
- `src/events/`: eventos de dominio independientes de HTTP.
- `src/repositories/`: acceso a la persistencia mediante DAOs.
- `src/dao/`: consultas MongoDB, populate y actualización atómica.
- `src/dao/models/`: Service, Booking y Message.
- `src/views/`: layout, servicios, reservas y errores.
- `public/`: CSS y cliente Socket.io.
- `src/config/socket.config.js`: un solo servidor HTTP compartido por Express y Socket.io.
- `src/data/services.json`: únicamente fuente de seed opcional. La aplicación y las pruebas no escriben en este archivo.

Se retiraron el DAO JSON, los contadores y las reservas JSON antiguas. El seed no elimina documentos ni regenera IDs existentes; las referencias de MongoDB se conservan.

## Pruebas

```bash
npm run test:smoke
npm run test:integration
npm test
```

`test:smoke` no necesita MongoDB: comprueba validación, renderizado y escapado Handlebars, rutas básicas, transporte Socket.io real y actualización DOM en JSDOM. La respuesta HTTP de datos del cliente se sustituye únicamente en esa prueba; no demuestra persistencia.

`test:integration` inicia **un proceso MongoDB real temporal** con `mongodb-memory-server`, conecta Mongoose antes de levantar HTTP y utiliza una base aleatoria `modulo7_test_<uuid>`. Al finalizar elimina solo esa base y cierra las conexiones. No usa `.env`, la base del proyecto ni archivos JSON. La primera ejecución puede descargar el binario de MongoDB y requiere acceso a Internet; el sistema debe permitir ejecutar `mongod`.

La integración comprueba CRUD, validaciones, filtros, orden y paginación, ObjectIds, populate, mensajes, cantidades concurrentes, SSR, archivos estáticos, dos clientes, cambios del DOM, escapado XSS y reconexión. También desconecta y reconecta Mongoose para comprobar persistencia.

Si ya tienes un MongoDB de pruebas, puedes evitar la descarga del binario:

PowerShell:

```powershell
$env:MONGO_TEST_URI="mongodb://127.0.0.1:27017"
npm run test:integration
Remove-Item Env:MONGO_TEST_URI
```

macOS o Linux:

```bash
MONGO_TEST_URI=mongodb://127.0.0.1:27017 npm run test:integration
```

La suite sigue seleccionando su propia base aleatoria; el usuario de MongoDB necesita permiso para crear y eliminar esa base. No usar credenciales de producción.

### Verificación de esta versión

Se ejecutó una instalación limpia con `npm install` seguida de `npm test`, incluyendo MongoDB temporal real, JSDOM y socket.io-client. El resultado y la correspondencia con la rúbrica están en `docs/REVISION_MODULO_7.md`.

La suite cubre además metadatos, `sortBy`, eventos desde llamadas directas a negocio, seed ejecutado en otro proceso, ausencia de duplicados y reconexión del cliente. La colección Postman se entrega para demostración manual; no se afirma haberla ejecutado desde la aplicación Postman.

## Entrega

Publicar el contenido del proyecto en un repositorio público de GitHub y entregar su URL en el curso. No subir `.env`, `node_modules` ni credenciales reales. Se incluyen `.env.example`, `.gitignore`, lockfile y colección Postman. Conservar el `.env` local válido al actualizar el proyecto.

El proyecto no se publicó desde este entorno. El sistema mantiene el alcance del curso, sin autenticación; utilizar datos ficticios para las demostraciones.
