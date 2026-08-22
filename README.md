# Administrador de Servicios para Sistema de Turnos y Reservas

Proyecto de pre-entrega desarrollado con **Node.js** y **ECMAScript Modules (ESM)**. Su objetivo es crear la base inicial de un sistema de turnos y reservas mediante una clase `ServiceManager` capaz de crear, consultar, actualizar y eliminar servicios.

## Funcionalidades incluidas

- Node.js con sintaxis ESM (`import` / `export`).
- `dotenv` para variables de entorno.
- Validación *fail-fast* de `PORT` y `NODE_ENV`.
- Persistencia en `src/data/services.json`.
- CRUD completo de servicios mediante `ServiceManager`.
- Generación automática del `id`.
- Protección del `id` en actualizaciones.
- Validación de campos obligatorios.
- `.gitignore` preparado para excluir `.env` y `node_modules`.

## Estructura

```text
backend-turnos-reservas/
├── src/
│   ├── config/
│   │   └── env.config.js
│   ├── managers/
│   │   └── ServiceManager.js
│   ├── data/
│   │   └── services.json
│   └── app.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Instalación

1. Abrir la carpeta del proyecto en Visual Studio Code.
2. Abrir la terminal integrada.
3. Ejecutar:

```bash
npm install
```

4. Crear un archivo llamado `.env` en la raíz del proyecto tomando `.env.example` como referencia.

Contenido local requerido:

```env
PORT=8080
NODE_ENV=development
```

**Importante:** `.env` es local y NO debe subirse a GitHub.

## Ejecución

```bash
npm start
```

También se puede usar:

```bash
npm run dev
```

Una ejecución correcta mostrará algo similar a:

```text
Aplicación inicializada correctamente.
Entorno: development
Puerto configurado: 8080
Servicios registrados: 0
```

## Variables de entorno

| Variable | Requerida | Ejemplo local | Descripción |
|---|---|---|---|
| `PORT` | Sí | `8080` | Puerto configurado para la aplicación. |
| `NODE_ENV` | Sí | `development` | Entorno de ejecución. |

`src/config/env.config.js` carga las variables con `dotenv`. Si falta `PORT` o `NODE_ENV`, la aplicación falla al iniciar con un mensaje claro.

## Recurso `services`

Cada servicio utiliza esta estructura:

```js
{
  id,
  name,
  description,
  duration,
  price,
  category,
  available
}
```

El campo `id` es generado automáticamente. Los campos obligatorios al crear un servicio son:

- `name`
- `description`
- `duration`
- `price`
- `category`
- `available`

## Métodos de `ServiceManager`

### `getServices()`

Devuelve todos los servicios guardados.

```js
const services = await serviceManager.getServices();
```

### `getServiceById(id)`

Devuelve el servicio correspondiente al ID o `null` si no existe.

```js
const service = await serviceManager.getServiceById(1);
```

### `addService(serviceData)`

Agrega un servicio. El ID se genera internamente.

```js
const newService = await serviceManager.addService({
  name: 'Consulta general',
  description: 'Consulta inicial de 30 minutos',
  duration: 30,
  price: 25,
  category: 'salud',
  available: true
});
```

Si falta cualquiera de los campos obligatorios, el método lanza un error descriptivo.

Aunque se envíe accidentalmente una propiedad `id`, `addService()` no la utiliza: siempre genera el identificador internamente.

### `updateService(id, updatedData)`

Actualiza solamente los campos enviados.

```js
const updatedService = await serviceManager.updateService(1, {
  price: 30,
  available: false
});
```

El `id` no puede modificarse. Cualquier `id` incluido dentro de `updatedData` es ignorado de forma deliberada.

Si el servicio no existe, devuelve `null`.

### `deleteService(id)`

Elimina un servicio por ID.

```js
const deletedService = await serviceManager.deleteService(1);
```

Si el servicio no existe, devuelve `null`.

## Persistencia

Los servicios se almacenan en:

```text
src/data/services.json
```

El archivo inicia como:

```json
[]
```

El manager utiliza las operaciones asíncronas de `fs` para leer y escribir el archivo.

## Validaciones implementadas

- Se rechazan servicios incompletos.
- `available: false` es válido.
- El ID se genera automáticamente.
- El ID no puede modificarse en `updateService()`.
- Buscar, actualizar o eliminar un ID inexistente devuelve `null`.
- `services.json` debe contener un array JSON.
- Si el archivo no existe, el manager puede crearlo con `[]`.
- Se manejan errores de lectura y escritura.
- `PORT` y `NODE_ENV` son obligatorias.
- `PORT` se transforma y valida como número.

## Archivos que NO deben subirse

El `.gitignore` excluye:

```text
node_modules/
.env
```

Antes de entregar, ejecutar:

```bash
git status
```

y comprobar que ni `.env` ni `node_modules` estén incluidos.

## Checklist final

- [ ] Ejecutar `npm install`.
- [ ] Crear `.env` con `PORT=8080` y `NODE_ENV=development`.
- [ ] Ejecutar `npm start`.
- [ ] Confirmar que la aplicación inicia sin errores.
- [ ] Confirmar `"type": "module"` en `package.json`.
- [ ] Confirmar que `.env.example` existe y tiene variables sin valores.
- [ ] Confirmar que `.env` no está en Git.
- [ ] Confirmar que `node_modules` no está en Git.
- [ ] Confirmar que `src/data/services.json` es JSON válido.
- [ ] Crear un repositorio público en GitHub.
- [ ] Subir el proyecto.
- [ ] Entregar el enlace público del repositorio.


## Pre-entrega 02 - API REST con Express

La aplicación fue migrada a Express con rutas REST para servicios.

Endpoints disponibles:
- GET /api/services
- GET /api/services/:sid
- POST /api/services
- PUT /api/services/:sid
- DELETE /api/services/:sid

Incluye filtros por query params: category y available.
