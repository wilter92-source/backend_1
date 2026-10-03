/* El HTML inicial lo genera Handlebars. Los eventos invalidan la lista y
   el navegador consulta la API con los mismos filtros, sin recargar la página. */
(() => {
  const list = document.getElementById('live-list');
  if (!list) return;
  const status = document.getElementById('connection-status');
  const resource = list.dataset.resource;
  const socket = io();
  let running = false;
  let pending = false;
  function element(tag, text) {
    const node = document.createElement(tag);
    node.textContent = text; // Los datos de usuarios nunca se insertan como HTML.
    return node;
  }
  function render(items) {
    const fragment = document.createDocumentFragment();
    for (const item of items) {
      const card = document.createElement('article');
      card.append(element('h2', resource === 'services' ? item.name : item.clientName));
      const rows = resource === 'services' ? [item.description, `Duración: ${item.duration} minutos`, `Precio: $${item.price}`, `Categoría: ${item.category}`, `Disponible: ${item.available ? 'Sí' : 'No'}`] :
        [`Email: ${item.clientEmail}`, `Fecha: ${item.date}`, `Hora: ${item.time}`, `Estado: ${item.status}`];
      rows.forEach(row => card.append(element('p', row)));
      if (resource === 'bookings') {
        const ul = document.createElement('ul');
        for (const entry of item.services) ul.append(element('li', `${entry.service?.name ?? 'Servicio eliminado'} — Cantidad: ${entry.quantity}`));
        if (!item.services.length) ul.append(element('li', 'Sin servicios asociados.'));
        card.append(ul);
      }
      fragment.append(card);
    }
    if (!items.length) fragment.append(element('p', `No hay ${resource === 'services' ? 'servicios' : 'reservas'} para esta consulta.`));
    list.replaceChildren(fragment);
  }
  async function refresh() {
    pending = true;
    if (running) return;
    running = true;
    try {
      while (pending) {
        pending = false;
        const response = await fetch(`/api/${resource}${window.location.search}`, { cache: 'no-store' });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        render(result.payload);
        status.textContent = socket.connected ? 'Conectado · Datos actualizados' : 'Sin conexión · Reconectando…';
      }
    } catch {
      status.textContent = 'No se pudo actualizar. Pulsa aquí para reintentar.';
    } finally { running = false; }
  }
  status.addEventListener('click', refresh);
  socket.on('connect', refresh); // Recupera también los cambios ocurridos durante una desconexión.
  socket.on('disconnect', () => { status.textContent = 'Sin conexión · Reconectando…'; });
  socket.on('connect_error', () => { status.textContent = 'No se pudo conectar · Reintentando…'; });
  socket.on('services:changed', refresh);
  if (resource === 'bookings') socket.on('bookings:changed', refresh);
  if (socket.connected) refresh();
})();
