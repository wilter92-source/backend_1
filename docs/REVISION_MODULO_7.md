# Revisión de la pre-entrega del módulo 7

La implementación se basó en `Modulo 7.docx`, el proyecto del ZIP y las seis observaciones de la imagen adjunta. Fecha de revisión: 27 de septiembre de 2026.

## Requisitos de la rúbrica

| Requisito | Implementación |
| --- | --- |
| Handlebars y estructura de vistas — 20% | Motor en app.js, layout principal, services.handlebars, bookings.handlebars y router/controller propios |
| Datos reales — 20% | Vistas → servicios → repositorios → DAOs → modelos MongoDB; sin registros fijos en las plantillas |
| Socket.io — 25% | Express y Socket.io comparten servidor HTTP; cliente servido localmente y listeners en public/js/socket.js |
| Cambios relevantes sin recargar — 25% | Eventos después de crear, actualizar o eliminar servicios; crear reservas o agregar servicios; actualización parcial del DOM |
| Organización y documentación — 10% | Capas conservadas, README actualizado, variables de ejemplo, gitignore, lockfile, pruebas y colección Postman |

Esta correspondencia indica dónde está resuelto cada requisito; no es una garantía de calificación ni una afirmación de ejecución completa con MongoDB.

## Correcciones de la entrega anterior

| Observación | Cambio |
| --- | --- |
| Las pruebas fallaban por no conectar MongoDB | Suite con MongoDB temporal o MONGO_TEST_URI, conexión previa al servidor y limpieza de una base aleatoria |
| IDs numéricos y escrituras JSON en pruebas | ObjectIds y consultas MongoDB; se eliminaron las escrituras en src/data |
| Messages solo tenía modelo | DAO, repository, service, controller, router y montaje en app.js; crear, listar y consultar |
| Persistencia JSON antigua confundía | Eliminado json.dao.js, contadores y reservas JSON; services.json queda identificado como seed |
| Filtros, paginación y orden pendientes | Consultas en MongoDB para servicios y reservas, con validación y límite máximo |
| README no explicaba MongoDB para tests | Sección con proceso temporal, requisitos y alternativa MONGO_TEST_URI |
| Flujo Postman con populate | Colección encadenada con variables y aserciones; también cubierto por la suite de integración preparada |

## Alcance de las comprobaciones

`npm run test:smoke` terminó con tres pruebas aprobadas: validaciones previas a persistencia; renderizado y escapado Handlebars; Socket.io con actualización DOM, filtros y reconexión. JSDOM no es una inspección visual de un navegador completo.

La suite `test:integration` no pudo completar su preparación porque MongoDB terminó con código 100 y `open: Operation not permitted`. No se utilizaron las credenciales incluidas en el ZIP original ni se modificó una base remota del usuario. Las pruebas de integración están escritas, pero sus resultados quedan pendientes de ejecución local.

La colección Postman no se ejecutó contra MongoDB en este entorno. El README detalla cómo correrla y qué debe verse en dos pestañas. No se generaron capturas falsas ni resultados de pruebas inventados.

## Cambios adicionales

Se corrigieron fechas inexistentes, horas inválidas, estados y cantidades; se agrupan referencias repetidas al crear una reserva. La actualización de cantidades usa un pipeline atómico. La vista contempla referencias a servicios eliminados. El seed deja de borrar todos los servicios y conserva los IDs existentes. Se retiró el cambio global de DNS del servidor anterior.

## Pendiente externo

Ejecutar la integración y Postman con una base operativa, publicar el repositorio de GitHub y enviar su enlace al curso. Estos pasos dependen del entorno y la cuenta del estudiante.

Todos los archivos JavaScript pasaron `node --check`; las dependencias declaradas coinciden con el lockfile. El ZIP fue comprobado con su CRC y excluye `.env`, credenciales y `node_modules`.
