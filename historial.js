/* ═══════════════════════════════════════════
   HISTORIAL.JS
═══════════════════════════════════════════ */
function renderHistorial() {
  const txs = DB.getTx().slice().reverse();
  window._txsHist = txs;
  window._filtroH = { pagado:'todos', tipo:'todos', evento:'todos', q:'' };

  render('#main', `
  <div class="fade-in">
    <div class="card" style="margin-bottom:14px;">
      <div class="card-title">📜 Historial de Transacciones</div>
      <div class="form-row cols-2" style="margin-bottom:10px;">
        <div class="form-group">
          <label class="label">Estado</label>
          <select class="select" onchange="filtroH('pagado',this.value)">
            <option value="todos">Todos</option>
            <option value="false">Pendientes</option>
            <option value="true">Pagados</option>
          </select>
        </div>
        <div class="form-group">
          <label class="label">Tipo</label>
          <select class="select" onchange="filtroH('tipo',this.value)">
            <option value="todos">Todos</option>
            <option value="tienda">🛒 Tienda</option>
            <option value="olla">🍲 Olla</option>
            <option value="pan">🥖 Panadería</option>
          </select>
        </div>
        <div class="form-group">
          <label class="label">Evento</label>
          <select class="select" onchange="filtroH('evento',this.value)">
            <option value="todos">Todos los eventos</option>
            ${EVENTOS_DEF.map(e=>`<option value="${e.tipo}">${e.icon} ${e.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="label">Buscar</label>
          <input class="input" placeholder="Nombre o iglesia..." oninput="filtroH('q',this.value)"/>
        </div>
      </div>
      <div id="hist-stats"></div>
    </div>
    <div class="card">
      <div id="hist-tabla"></div>
    </div>
  </div>`);
  actualizarHistorial();
}

window.filtroH = function(k, v) {
  window._filtroH[k] = v;
  actualizarHistorial();
};

function actualizarHistorial() {
  const f = window._filtroH;
  let lista = window._txsHist || [];
  if (f.pagado !== 'todos') lista = lista.filter(t=>String(t.pagado)===f.pagado);
  if (f.tipo !== 'todos') lista = lista.filter(t=>t.tipo===f.tipo);
  if (f.evento !== 'todos') lista = lista.filter(t=>t.eventoTipo===f.evento);
  if (f.q) lista = lista.filter(t=>(t.hermanoNombre||'').toLowerCase().includes(f.q.toLowerCase())||(t.hermanoIglesia||'').toLowerCase().includes(f.q.toLowerCase()));

  const total  = lista.reduce((s,t)=>s+t.total,0);
  const pagado = lista.filter(t=>t.pagado).reduce((s,t)=>s+t.total,0);
  const pend   = total-pagado;

  const stats = el('hist-stats');
  if (stats) stats.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card"><div class="sc-ico">📝</div><div class="sc-lbl">Transacciones</div><div class="sc-val">${lista.length}</div></div>
      <div class="stat-card"><div class="sc-ico">💰</div><div class="sc-lbl">Total</div><div class="sc-val" style="font-size:15px;">${fmt(total)}</div></div>
      <div class="stat-card" style="border-left-color:var(--verde)"><div class="sc-ico">✅</div><div class="sc-lbl">Pagado</div><div class="sc-val" style="color:var(--verde);font-size:15px;">${fmt(pagado)}</div></div>
      <div class="stat-card" style="border-left-color:var(--rojo)"><div class="sc-ico">⏳</div><div class="sc-lbl">Pendiente</div><div class="sc-val" style="color:var(--rojo);font-size:15px;">${fmt(pend)}</div></div>
    </div>`;

  const tabla = el('hist-tabla');
  if (!tabla) return;
  if (!lista.length) { tabla.innerHTML = `<p style="color:var(--gris);text-align:center;padding:24px;">Sin transacciones</p>`; return; }

  tabla.innerHTML = `
  <div class="table-wrap">
    <table>
      <thead><tr><th>Fecha</th><th>Hermano/a</th><th>Iglesia</th><th>Evento</th><th>Tipo</th><th>Total</th><th>Modalidad</th><th>Estado</th><th></th></tr></thead>
      <tbody>
        ${lista.map(t=>`
          <tr>
            <td style="font-size:11.5px;white-space:nowrap;">${fmtDateTime(t.fecha)}</td>
            <td style="font-weight:700;">${t.hermanoNombre||'—'}</td>
            <td style="font-size:11.5px;">${t.hermanoIglesia||'—'}</td>
            <td><span class="badge badge-blue" style="font-size:10px;">${t.eventoLabel||'—'}${t.eventoDia?' D'+t.eventoDia:''}</span></td>
            <td>${t.tipo==='olla'?'🍲':t.tipo==='pan'?'🥖':'🛒'}</td>
            <td style="font-weight:800;color:var(--azul-m);">${fmt(t.total)}</td>
            <td><span class="badge ${t.modalidad==='inmediato'?'badge-green':t.modalidad==='abono'?'badge-gold':'badge-lila'}">${t.modalidad==='inmediato'?'Inmediato':t.modalidad==='abono'?'Abono':'Crédito'}</span></td>
            <td><span class="badge ${t.pagado?'badge-green':'badge-red'}">${t.pagado?'✅ Pagado':'⏳ Pend.'}</span></td>
            <td>
              ${t.fotoPago?`<button class="btn btn-ghost btn-sm" onclick="verFoto('${t.fotoPago}')">📷</button>`:''}
              <button class="btn btn-ghost btn-sm" onclick="verDetalleTx('${t.id}')">🔍</button>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

window.verDetalleTx = function(txId) {
  const t = DB.getTx().find(x=>x.id===txId);
  if (!t) return;
  openModal(`
  <div class="modal-header"><h3>🔍 Detalle de Transacción</h3><button class="btn btn-ghost btn-sm" onclick="closeModal()">✕</button></div>
  <div class="modal-body">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px;margin-bottom:14px;">
      <div><span style="font-weight:800;">Hermano/a:</span> ${t.hermanoNombre}</div>
      <div><span style="font-weight:800;">Iglesia:</span> ${t.hermanoIglesia}</div>
      <div><span style="font-weight:800;">Fecha:</span> ${fmtDateTime(t.fecha)}</div>
      <div><span style="font-weight:800;">Evento:</span> ${t.eventoLabel||'—'}${t.eventoDia?' D'+t.eventoDia:''}</div>
      <div><span style="font-weight:800;">Modalidad:</span> ${t.modalidad}</div>
      <div><span style="font-weight:800;">Estado:</span> ${t.pagado?'✅ Pagado':'⏳ Pendiente'}</div>
      ${t.pagado?`<div><span style="font-weight:800;">Pagado el:</span> ${fmtDate(t.fechaPago)}</div><div><span style="font-weight:800;">Medio:</span> ${t.medioPago||'—'}</div>`:''}
      ${t.refPago?`<div style="grid-column:1/-1;"><span style="font-weight:800;">Referencia:</span> ${t.refPago}</div>`:''}
    </div>
    <div style="font-weight:800;font-size:12px;margin-bottom:8px;color:var(--azul-m);text-transform:uppercase;">Detalle de items</div>
    ${compCarrito(t.items, 'Total')}
    ${t.fotoPago?`<div style="margin-top:12px;"><div style="font-weight:800;font-size:12px;margin-bottom:6px;">📷 Comprobante de pago</div><img src="${t.fotoPago}" style="max-width:100%;border-radius:8px;"/></div>`:''}
  </div>`);
};

/* ═══════════════════════════════════════════
   PRODUCTOS.JS
═══════════════════════════════════════════ */
function renderProductos() {
  window._editProd = null;
  render('#main', `
  <div class="fade-in">
    <div class="card" style="margin-bottom:14px;">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
        <div class="card-title" style="margin-bottom:0;">📦 Catálogo de Productos</div>
        <button class="btn btn-primary" onclick="abrirFormProd(null)">+ Nuevo Producto</button>
      </div>
      <input class="input" style="margin-top:12px;" placeholder="🔍 Buscar producto..." oninput="buscarProds(this.value)"/>
    </div>
    <div id="tabla-prods" class="card">
      ${tablaProds(DB.getProductos())}
    </div>
  </div>`);
}
window.buscarProds = function(q) {
  const prods = DB.getProductos().filter(p=>!q||p.nombre.toLowerCase().includes(q.toLowerCase())||(p.marca||'').toLowerCase().includes(q.toLowerCase()));
  const c = el('tabla-prods');
  if (c) c.innerHTML = tablaProds(prods);
};
function tablaProds(prods) {
  if (!prods.length) return `<p style="color:var(--gris);text-align:center;padding:24px;">Sin productos</p>`;
  return `
  <div class="table-wrap">
    <table>
      <thead><tr><th>Icono</th><th>Nombre</th><th>Marca</th><th>Tamaño</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Acciones</th></tr></thead>
      <tbody>
        ${prods.map(p=>`
          <tr>
            <td style="font-size:22px;">${p.icono||'📦'}</td>
            <td style="font-weight:700;">${p.nombre}</td>
            <td style="font-size:12px;">${p.marca||'—'}</td>
            <td><span class="badge badge-blue">${p.tamano||'—'}</span></td>
            <td>${p.categoria||'—'}</td>
            <td style="font-weight:800;color:var(--azul-m);">${fmt(p.precio)}</td>
            <td><span class="badge ${p.stock<5?'badge-red':'badge-green'}">${p.stock}</span></td>
            <td style="display:flex;gap:6px;">
              <button class="btn btn-ghost btn-sm" onclick="abrirFormProd(${p.id})">✏️</button>
              <button class="btn btn-danger btn-sm" onclick="eliminarProd(${p.id})">🗑️</button>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

window.abrirFormProd = function(prodId) {
  const p = prodId ? DB.getProductos().find(x=>x.id===prodId) : null;
  const ICONOS = ['📖','📓','✏️','💿','👕','💧','🧃','🍞','🧴','📿','🎵','🪴','🧸','📦'];
  openModal(`
  <div class="modal-header"><h3>${p?'✏️ Editar Producto':'➕ Nuevo Producto'}</h3><button class="btn btn-ghost btn-sm" onclick="closeModal()">✕</button></div>
  <div class="modal-body">
    <div class="form-row cols-2">
      <div class="form-group" style="grid-column:1/-1;">
        <label class="label">Nombre del producto</label>
        <input class="input" id="pp_nombre" value="${p?.nombre||''}" placeholder="Ej: Biblia Reina Valera"/>
      </div>
      <div class="form-group">
        <label class="label">Marca</label>
        <input class="input" id="pp_marca" value="${p?.marca||''}" placeholder="Ej: Soc. Bíblica"/>
      </div>
      <div class="form-group">
        <label class="label">Tamaño</label>
        <input class="input" id="pp_tamano" value="${p?.tamano||''}" placeholder="Ej: Mediana, M, 500ml"/>
      </div>
      <div class="form-group">
        <label class="label">Categoría</label>
        <select class="select" id="pp_cat">
          ${CATEGORIAS_PROD.map(c=>`<option${p?.categoria===c?' selected':''}>${c}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="label">Precio (COP)</label>
        <input class="input" id="pp_precio" type="number" value="${p?.precio||''}" placeholder="0"/>
      </div>
      <div class="form-group">
        <label class="label">Stock</label>
        <input class="input" id="pp_stock" type="number" value="${p?.stock||0}" placeholder="0"/>
      </div>
      <div class="form-group" style="grid-column:1/-1;">
        <label class="label">Icono</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap;" id="pp_iconos">
          ${ICONOS.map(ico=>`<span style="font-size:28px;cursor:pointer;padding:4px;border-radius:8px;border:2px solid ${(p?.icono||'📦')===ico?'var(--azul-m)':'transparent'};"
            onclick="selIcoP('${ico}',this)">${ico}</span>`).join('')}
        </div>
      </div>
    </div>
  </div>
  <div class="modal-footer">
    <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-success" onclick="guardarProd(${prodId||'null'})">💾 Guardar</button>
  </div>`);
  window._icoP = p?.icono || '📦';
};

window.selIcoP = function(ico, span) {
  window._icoP = ico;
  document.querySelectorAll('#pp_iconos span').forEach(s=>s.style.borderColor='transparent');
  span.style.borderColor = 'var(--azul-m)';
};
window.guardarProd = function(prodId) {
  const nombre = (el('pp_nombre').value||'').trim();
  const precio = parseFloat(el('pp_precio').value||0);
  if (!nombre||!precio) { toast('Nombre y precio son obligatorios','error'); return; }
  const prod = {
    id:        prodId || uid(),
    nombre, precio,
    marca:     el('pp_marca').value||'',
    tamano:    el('pp_tamano').value||'',
    categoria: el('pp_cat').value||'Otros',
    stock:     parseInt(el('pp_stock').value||0),
    icono:     window._icoP||'📦'
  };
  const prods = DB.getProductos();
  if (prodId) DB.setProductos(prods.map(p=>p.id===prodId?prod:p));
  else DB.setProductos([...prods, prod]);
  closeModal();
  toast(prodId?'Producto actualizado':'Producto creado','success');
  renderProductos();
};
window.eliminarProd = async function(prodId) {
  const ok = await confirmar('¿Eliminar este producto del catálogo?');
  if (!ok) return;
  DB.setProductos(DB.getProductos().filter(p=>p.id!==prodId));
  toast('Producto eliminado','warning');
  renderProductos();
};

/* ═══════════════════════════════════════════
   HERMANOS.JS
═══════════════════════════════════════════ */
function renderHermanos() {
  render('#main', `
  <div class="fade-in">
    <div class="card" style="margin-bottom:14px;">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
        <div class="card-title" style="margin-bottom:0;">👥 Hermandad</div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-primary" onclick="abrirFormHermano(null)">+ Agregar</button>
          <button class="btn btn-ghost btn-sm" onclick="abrirGestionIglesias()">🏛️ Iglesias</button>
        </div>
      </div>
      <input class="input" style="margin-top:12px;" placeholder="🔍 Buscar nombre, doc, iglesia..." oninput="buscarHermanos(this.value)"/>
    </div>
    <div id="lista-herm"></div>
  </div>`);
  window._hermBusq = '';
  actualizarListaHerm();
}
window.buscarHermanos = function(q) { window._hermBusq = q; actualizarListaHerm(); };
function actualizarListaHerm() {
  const q = (window._hermBusq||'').toLowerCase();
  const lista = DB.getHermanos().filter(h=>!q||h.nombre.toLowerCase().includes(q)||(h.doc||'').includes(q)||(h.iglesia||'').toLowerCase().includes(q));
  const cont = el('lista-herm');
  if (!cont) return;
  if (!lista.length) { cont.innerHTML=`<p style="color:var(--gris);text-align:center;padding:24px;">Sin resultados</p>`; return; }
  cont.innerHTML = `
  <div class="card">
    <div class="table-wrap">
      <table>
        <thead><tr><th>Nombre</th><th>Tipo</th><th>Doc.</th><th>Teléfono</th><th>Iglesia</th><th>Saldo</th><th>Acciones</th></tr></thead>
        <tbody>
          ${lista.map(h=>{
            const dc = DB.getDeudaCredito(h.id);
            const sa = DB.getSaldoAbono(h.id);
            return `
            <tr>
              <td style="font-weight:700;">${h.nombre}</td>
              <td><span class="badge ${h.tipo==='hermana'?'badge-lila':h.tipo==='invitado'?'badge-orange':h.tipo==='nino'?'badge-gold':'badge-blue'}">${h.tipo==='hermana'?'Hermana':h.tipo==='invitado'?'Invitado/a':h.tipo==='nino'?'Niño/a':'Hermano'}</span></td>
              <td style="font-family:monospace;font-size:12px;">${h.doc||'—'}</td>
              <td style="font-size:12px;">${h.tel||'—'}</td>
              <td style="font-size:12px;"><span class="badge badge-blue">${h.iglesia||'—'}</span></td>
              <td>${dc>0?`<span class="badge badge-red">Debe ${fmt(dc)}</span>`:sa>0?`<span class="badge badge-green">Abono ${fmt(sa)}</span>`:`<span class="badge badge-gray">Al día</span>`}</td>
              <td style="display:flex;gap:5px;">
                <button class="btn btn-ghost btn-sm" onclick="abrirFormHermano(${h.id})">✏️</button>
                <button class="btn btn-lila btn-sm" onclick="enviarWaHermano(${h.id})">📱</button>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

window.abrirFormHermano = function(hermId) {
  const h = hermId ? DB.getHermanos().find(x=>x.id===hermId) : null;
  const iglesias = DB.getIglesias();
  openModal(`
  <div class="modal-header"><h3>${h?'✏️ Editar Hermano/a':'➕ Registrar Hermano/a'}</h3><button class="btn btn-ghost btn-sm" onclick="closeModal()">✕</button></div>
  <div class="modal-body">
    <div class="form-row cols-2">
      <div class="form-group" style="grid-column:1/-1;">
        <label class="label">Nombre completo</label>
        <input class="input" id="fh_nombre" value="${h?.nombre||''}" placeholder="Nombre y apellidos"/>
      </div>
      <div class="form-group">
        <label class="label">Tipo</label>
        <select class="select" id="fh_tipo">
          ${TIPO_PERSONA.map(t=>`<option value="${t.val}"${h?.tipo===t.val?' selected':''}>${t.icon} ${t.label}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="label">Documento</label>
        <input class="input" id="fh_doc" value="${h?.doc||''}" placeholder="CC / NIT / Pasaporte"/>
      </div>
      <div class="form-group">
        <label class="label">Teléfono (WhatsApp)</label>
        <input class="input" id="fh_tel" value="${h?.tel||''}" type="tel" placeholder="300..."/>
      </div>
      <div class="form-group">
        <label class="label">Correo electrónico</label>
        <input class="input" id="fh_correo" value="${h?.correo||''}" type="email" placeholder=""/>
      </div>
      <div class="form-group" style="grid-column:1/-1;">
        <label class="label">Iglesia de origen</label>
        <select class="select" id="fh_iglesia">
          ${iglesias.map(i=>`<option${h?.iglesia===i?' selected':''}>${i}</option>`).join('')}
          <option value="__otra">➕ Agregar nueva iglesia...</option>
        </select>
      </div>
      <div class="form-group" id="fh_nueva_igl" style="display:none;grid-column:1/-1;">
        <label class="label">Nueva iglesia</label>
        <input class="input" id="fh_nueva_igl_val" placeholder="Nombre de la iglesia"/>
      </div>
    </div>
  </div>
  <div class="modal-footer">
    <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-success" onclick="guardarHermano(${hermId||'null'})">💾 Guardar</button>
  </div>`);
  el('fh_iglesia')?.addEventListener('change', function() {
    const ni = el('fh_nueva_igl');
    if (ni) ni.style.display = this.value==='__otra'?'block':'none';
  });
};

window.guardarHermano = function(hermId) {
  const nombre = (el('fh_nombre').value||'').trim();
  if (!nombre) { toast('El nombre es obligatorio','error'); return; }
  let iglesia = el('fh_iglesia').value;
  if (iglesia==='__otra') {
    iglesia = (el('fh_nueva_igl_val').value||'').trim();
    if (!iglesia) { toast('Escribe el nombre de la nueva iglesia','error'); return; }
    DB.setIglesias([...DB.getIglesias(), iglesia]);
  }
  const herm = {
    id:     hermId || uid(),
    nombre, iglesia,
    tipo:   el('fh_tipo').value||'hermano',
    doc:    el('fh_doc').value||'',
    tel:    el('fh_tel').value||'',
    correo: el('fh_correo').value||''
  };
  const lista = DB.getHermanos();
  if (hermId) DB.setHermanos(lista.map(h=>h.id===hermId?herm:h));
  else DB.setHermanos([...lista, herm]);
  closeModal();
  toast(hermId?'Datos actualizados':'Hermano/a registrado','success');
  renderHermanos();
};

window.abrirGestionIglesias = function() {
  const iglesias = DB.getIglesias();
  openModal(`
  <div class="modal-header"><h3>🏛️ Iglesias / Sucursales</h3><button class="btn btn-ghost btn-sm" onclick="closeModal()">✕</button></div>
  <div class="modal-body">
    <div style="display:flex;gap:8px;margin-bottom:12px;">
      <input class="input" id="nueva_igl" placeholder="Nombre de la iglesia o campo real"/>
      <button class="btn btn-primary" onclick="
        const v=(el('nueva_igl').value||'').trim();
        if(!v)return;
        DB.setIglesias([...DB.getIglesias(),v]);
        el('nueva_igl').value='';
        abrirGestionIglesias();closeModal();abrirGestionIglesias();
      ">+</button>
    </div>
    <div style="max-height:300px;overflow-y:auto;">
      ${iglesias.map((ig,i)=>`
        <div style="display:flex;justify-content:space-between;align-items:center;padding:9px 12px;border-radius:9px;background:var(--azul-g);margin-bottom:6px;">
          <span style="font-weight:600;font-size:13px;">🏛️ ${ig}</span>
          <button class="btn btn-danger btn-sm" onclick="eliminarIglesia(${i})">✕</button>
        </div>`).join('')}
    </div>
  </div>`);
};

window.eliminarIglesia = async function(idx) {
  const ok = await confirmar('¿Eliminar esta iglesia de la lista?');
  if (!ok) return;
  DB.setIglesias(DB.getIglesias().filter((_,i)=>i!==idx));
  closeAllModals();
  abrirGestionIglesias();
};
