# Backend de Turnos y Reservas

## Descripción del proyecto

Este proyecto consiste en una API REST para gestionar servicios y
reservas.

Durante esta etapa del desarrollo se reorganizó la estructura del
backend separando las responsabilidades entre routes, controllers y
managers, con el objetivo de mantener el código más ordenado y facilitar
futuras modificaciones.

La aplicación utiliza Node.js y Express, trabajando con persistencia de
datos mediante archivos JSON.

## Tecnologías utilizadas

-   Node.js
-   Express
-   JavaScript con ES Modules
-   File System (`fs.promises`)
-   dotenv

## Instalación

``` bash
npm install
```

Crear un archivo `.env` usando como referencia `.env.example`.

Ejemplo:

``` env
PORT=8080
NODE_ENV=development
```

## Ejecución

``` bash
npm start
```

La API se ejecuta utilizando el puerto configurado en las variables de
entorno.

## Organización de la API

La aplicación está separada en capas:

-   Routes: definen los endpoints y conectan las peticiones con los
    controllers.
-   Controllers: manejan la petición HTTP y la comunicación con los
    managers.
-   Managers: contienen la lógica de lectura y escritura de los archivos
    JSON.

Flujo:

Cliente → Route → Controller → Manager → Archivo JSON

## Persistencia

Los datos se almacenan en:

-   src/data/services.json
-   src/data/bookings.json

La lectura y escritura se realiza mediante `fs.promises`.

## Services

Endpoints:

GET /api/services

GET /api/services/:sid

POST /api/services

PUT /api/services/:sid

DELETE /api/services/:sid

Los IDs se generan automáticamente al crear servicios.

## Bookings

Endpoints:

POST /api/bookings

GET /api/bookings/:bid

POST /api/bookings/:bid/services/:sid

Las reservas almacenan únicamente la referencia del servicio mediante su
ID y la cantidad solicitada.

Si un servicio ya existe dentro de una reserva, se incrementa la
cantidad en lugar de duplicarlo.

## Variables de entorno

  Variable   Descripción
  ---------- ---------------------------------
  PORT       Puerto donde inicia el servidor
  NODE_ENV   Ambiente de ejecución

## Notas

-   Los archivos JSON mantienen la información después de reiniciar el
    servidor.
-   `.env` y `node_modules` están excluidos mediante `.gitignore`.
-   El proyecto utiliza módulos ES con import/export.
