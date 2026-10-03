# Revisión final — Módulo 7 / Pre-entrega 08

Fecha: 2 de octubre de 2026 (Guayaquil).
Fuente: Modulo7.pdf y las dos capturas de devolución adjuntas.

## Cobertura de la consigna

| Criterio | Implementación |
| --- | --- |
| Filtros, paginación y ordenamiento (25%) | category, available, page, limit, sortBy y order; DAO aplica find, skip, limit, sort y countDocuments; respuesta con payload y pagination |
| Validación Zod/Joi (25%) | Zod en src/validation/schemas.js; crear/actualizar servicio, crear reserva y agregar servicio; validación desde negocio antes de consultar MongoDB |
| Referencias (15%) | Booking mantiene ObjectId y quantity, sin guardar el servicio completo |
| Populate (15%) | DAO de reservas aplica populate('services.service') tanto al listado como al detalle |
| Arquitectura (10%) | routes → controllers → services → repositories → DAO → models |
| Documentación (10%) | README con instalación, variables, API, filtros, metadatos, validación, populate y entrega por repositorio |
| Vistas anteriores | Handlebars con datos MongoDB, servicios y reservas, estados vacíos y referencias eliminadas |
| Tiempo real anterior | Socket.io y actualización DOM sin recarga, manteniendo filtros de la URL |

## Correcciones solicitadas

- Se quitaron todas las emisiones Socket.io de controllers. Los servicios publican eventos de dominio después de persistir; un adaptador los retransmite a Socket.io y retira listeners al cerrar el servidor.
- El seed usa la API del servidor activo. Así las inserciones de ese proceso también notifican a las vistas. Debe ejecutarse con npm start ya activo en otra terminal. No borra datos y evita duplicados al repetirlo secuencialmente.
- Se eliminaron del README la referencia inexistente a LEEME_PRIMERO.md y las menciones al archivo comprimido; la entrega académica se documenta como repositorio público.
- Se instalaron las dependencias desde cero y se ejecutó la suite completa, sin omitir integración.
- Se corrigió una carrera de conexión: si Socket.io se conectó antes de registrar el listener, el cliente igualmente recupera la lista inicial.

## Evidencia de ejecución

Comando: npm install --cache /tmp/modulo7-npm-cache && npm test, sin node_modules previo.
Resultado: 13 tests, 13 pass, 0 fail, 0 skipped, 0 cancelled.

Incluye proceso MongoDB temporal real y aislado, API HTTP, consultas y metadatos, validaciones, referencias y populate, incrementos concurrentes, mensajes, SSR, clientes Socket.io, DOM con JSDOM, escapado XSS, reconexión, mutaciones directas a negocio, seed desde otro proceso e idempotencia secuencial del seed.

No se usó una base personal o remota. JSDOM verifica DOM y comportamiento, no constituye inspección visual de un navegador completo. La colección Postman está preparada para demostración manual; no se ejecutó la aplicación Postman.

## Compatibilidad y alcance

Se conserva payload como array para listados. Servicios agrega pagination. sort sigue funcionando como alias de sortBy. Consultas con ID inválido conservan 404; agregar servicio con ID mal formado ahora devuelve 400 por el requisito Zod. IDs válidos inexistentes devuelven 404. La ruta para agregar servicio incrementa en una unidad y no requiere body, igual que antes.

Los eventos operan en una instancia de Node; escrituras externas directas a MongoDB no generan notificaciones. No se incorpora autenticación ni calendario de cupos, fuera del alcance de esta consigna.

## Acciones del estudiante

Configurar o conservar .env local, disponer de MongoDB local o Atlas, iniciar el proyecto y publicar el contenido en su repositorio público de GitHub. Entregar la URL del repositorio en el curso. El repositorio no se publicó desde este entorno.
