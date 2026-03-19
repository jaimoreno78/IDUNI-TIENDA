/* ═══════════════════════════════════════════
   VENTA.JS — Tienda, Panadería, Restaurante
═══════════════════════════════════════════ */

let _carrito = [];
let _modoVenta = 'tienda'; // tienda | pan | restaurante

function renderVenta(modo) {
  _modoVenta = modo || 'tienda';
  _carrito = [];
  window._modalidades['vt'] = 'inmediato';
  window._pagos['vt']       = 'efectivo';
  window._hermanoSel = window._hermanoSel || {};
  window._hermanoSel['vt'] = null;

  const evento = DB.getEvento();
  const esFiesta = evento && evento.tipo !== 'sabado' && evento.tipo !== 'nueva_luna';

  let titulo, productos, subtitulo;
  if (_modoVenta === 'pan') {
    titulo = '🥖 Panadería';
    subtitulo = 'Productos de panadería';
    productos = DB.getPreciosPan();
  } else if (_modoVenta === 'restaurante') {
    titulo = '🍽️ Restaurante';
    subtitulo = 'Servicio de comidas (Fiesta)';
    productos = DB.getPreciosOlla();
  } else {
    titulo = '🛒 Tienda';
    subtitulo = 'Venta de productos';
    productos = null; // se carga dinámicamente
  }

  render('#main', `
  <div class="fade-in">
    <div class="card" style="margin-bottom:14px;">
      <div class="card-title">${titulo} <span style="font-size:12px;font-weight:600;color:var(--gris);">${subtitulo}</span></div>
      ${!evento ? `<div class="alert alert-warning" style="margin-bottom:12px;">⚠️ Activa un evento en Configuración primero.</div>` : ''}
      ${compSelectorHermano('vt', null, true)}
      <div style="height:12px;"></div>
      ${compModalidad('vt', 'inmediato')}
    </div>

    <div style="display:grid;grid-template-columns:1fr;gap:14px;">
      <div class="card" id="productos-panel">
        ${renderProductosPanel(productos)}
      </div>
      <div class="card" id="carrito-panel">
        <div class="card-title">🧾 Carrito</div>
        <div id="carrito-items"><p style="color:var(--gris);font-size:13px;text-align:center;padding:16px;">Selecciona productos</p></div>
        <div id="carrito-footer" style="display:none;">
          <div style="height:12px;"></div>
          ${compMedioPago('vt','efectivo')}
          <div style="height:12px;"></div>
          <button class="btn btn-primary btn-block btn-lg" onclick="confirmarVenta()">
            ✅ Registrar Venta
          </button>
          <button class="btn btn-ghost btn-block" style="margin-top:8px;" onclick="limpiarCarrito()">
            🗑️ Limpiar carrito
          </button>
        </div>
      </div>
    </div>
  </div>`);

  // Inicializar
  window._modalidades['vt'] = 'inmediato';
  window._pagos['vt'] = 'efectivo';
}

function renderProductosPanel(prodsFijos) {
  if (_modoVenta === 'pan') {
    return `
    <div class="card-title">🥖 Selecciona productos</div>
    <div class="prod-grid">
      ${(prodsFijos||[]).map(p=>`
        <div class="prod-card" onclick="agregarAlCarrito(${JSON.stringify({...p,id:p.id||uid()}).replace(/"/g,'&quot;')})">
          <div class="prod-ico">${p.icono||'🥖'}</div>
          <div class="prod-name">${p.nombre}</div>
          <div class="prod-price">${fmt(p.precio)}</div>
        </div>`).join('')}
    </div>
    <button class="btn btn-ghost btn-sm" style="margin-top:12px;" onclick="abrirEditarPreciosPan()">✏️ Editar precios</button>`;
  }

  if (_modoVenta === 'restaurante') {
    const po = DB.getPreciosOlla();
    const ops = [
      {id:'da',nombre:'Desayuno Adulto',precio:po.desayunoAdulto,icono:'☕'},
      {id:'dn',nombre:'Desayuno Niño',  precio:po.desayunoNino,  icono:'🧃'},
      {id:'aa',nombre:'Almuerzo Adulto',precio:po.almuerzoAdulto,icono:'🍽️'},
      {id:'an',nombre:'Almuerzo Niño',  precio:po.almuerzoNino,  icono:'🍱'},
    ];
    return `
    <div class="card-title">🍽️ Selecciona servicio</div>
    <div class="olla-grid">
      ${ops.map(o=>`
        <div class="olla-item">
          <div class="oi-ico">${o.icono}</div>
          <div class="oi-name">${o.nombre}</div>
          <div class="oi-price">${fmt(o.precio)}</div>
          <div class="qty-wrap" style="justify-content:center;">
            <button class="qty-btn" onclick="cambiarOlla('${o.id}',-1)">−</button>
            <span class="qty-num" id="olla_qty_${o.id}">0</span>
            <button class="qty-btn" onclick="cambiarOlla('${o.id}',1)">+</button>
          </div>
        </div>`).join('')}
    </div>
    <button class="btn btn-ghost btn-sm" style="margin-top:12px;" onclick="abrirEditarPreciosOlla()">✏️ Editar precios</button>`;
  }

  // TIENDA — con categorías
  const prods = DB.getProductos();
  const cats = ['Todos', ...new Set(prods.map(p=>p.categoria))];
  return `
  <div class="card-title">📦 Productos</div>
  <div style="display:flex;gap:6px;flex-wrap:nowrap;overflow-x:auto;padding-bottom:6px;scrollbar-width:none;">
    ${cats.map(c=>`<span class="chip${c==='Todos'?' sel':''}" onclick="filtrarCat('${c}',this)">${c}</span>`).join('')}
  </div>
  <input class="input" style="margin-top:10px;" placeholder="🔍 Buscar producto..." oninput="buscarProd(this.value)"/>
  <div class="prod-grid" id="prod-grid" style="margin-top:10px;">
    ${prods.map(p=>cardProducto(p)).join('')}
  </div>`;
}

window._catSel = 'Todos';
window._busqProd = '';

window.filtrarCat = function(cat, chipEl) {
  window._catSel = cat;
  document.querySelectorAll('.chip').forEach(c=>c.classList.remove('sel'));
  chipEl.classList.add('sel');
  actualizarGridProds();
};
window.buscarProd = function(q) {
  window._busqProd = q;
  actualizarGridProds();
};
function actualizarGridProds() {
  const prods = DB.getProductos().filter(p => {
    const catOk = window._catSel === 'Todos' || p.categoria === window._catSel;
    const busOk = !window._busqProd || p.nombre.toLowerCase().includes(window._busqProd.toLowerCase()) || (p.marca||'').toLowerCase().includes(window._busqProd.toLowerCase());
    return catOk && busOk;
  });
  const g = el('prod-grid');
  if (g) g.innerHTML = prods.map(p=>cardProducto(p)).join('') || '<p style="color:var(--gris);font-size:13px;text-align:center;padding:20px;">Sin resultados</p>';
}
function cardProducto(p) {
  return `<div class="prod-card" onclick="agregarAlCarrito(${encodeURI(JSON.stringify(p))})">
    <div class="prod-ico">${p.icono||'📦'}</div>
    <div class="prod-name">${p.nombre}</div>
    <div class="prod-sub">${p.marca||''} · ${p.tamano||''}</div>
    <div class="prod-price">${fmt(p.precio)}</div>
    ${p.stock<5?`<div style="margin-top:4px;"><span class="badge badge-red">Stock: ${p.stock}</span></div>`:''}
  </div>`;
}

// Decode and add to cart
window.agregarAlCarrito = function(prodEncoded) {
  let p;
  try { p = typeof prodEncoded === 'string' ? JSON.parse(decodeURI(prodEncoded)) : prodEncoded; } catch { return; }
  const ex = _carrito.find(i=>i.id===p.id);
  if (ex) ex.qty++;
  else _carrito.push({...p, qty:1});
  renderCarrito();
};

// Olla qty
window._ollaQtys = {da:0,dn:0,aa:0,an:0};
window.cambiarOlla = function(key, delta) {
  const po = DB.getPreciosOlla();
  const map = {da:{nombre:'Desayuno Adulto',precio:po.desayunoAdulto,icono:'☕'},dn:{nombre:'Desayuno Niño',precio:po.desayunoNino,icono:'🧃'},aa:{nombre:'Almuerzo Adulto',precio:po.almuerzoAdulto,icono:'🍽️'},an:{nombre:'Almuerzo Niño',precio:po.almuerzoNino,icono:'🍱'}};
  window._ollaQtys[key] = Math.max(0, (window._ollaQtys[key]||0) + delta);
  const qEl = el('olla_qty_'+key);
  if (qEl) qEl.textContent = window._ollaQtys[key];
  // Sincronizar carrito
  _carrito = _carrito.filter(i=>!['da','dn','aa','an'].includes(i.id));
  Object.entries(window._ollaQtys).forEach(([k,q])=>{
    if (q>0) _carrito.push({...map[k], id:k, qty:q});
  });
  renderCarrito();
};

function renderCarrito() {
  const itemsEl = el('carrito-items');
  const footerEl = el('carrito-footer');
  if (!itemsEl) return;
  if (!_carrito.length) {
    itemsEl.innerHTML = `<p style="color:var(--gris);font-size:13px;text-align:center;padding:16px;">Selecciona productos</p>`;
    if (footerEl) footerEl.style.display='none';
    return;
  }
  itemsEl.innerHTML = `
  ${_carrito.map(i=>`
    <div class="cart-item">
      <div style="font-size:20px;flex-shrink:0;">${i.icono||'📦'}</div>
      <div class="cart-item-name">
        <div class="cn">${i.nombre}</div>
        <div class="cs">${fmt(i.precio)} c/u</div>
      </div>
      <div class="qty-wrap">
        <button class="qty-btn" onclick="cambiarCartQty('${i.id}',-1)">−</button>
        <span class="qty-num">${i.qty}</span>
        <button class="qty-btn" onclick="cambiarCartQty('${i.id}',1)">+</button>
      </div>
      <div style="font-weight:900;color:var(--azul-m);font-size:13px;width:70px;text-align:right;">${fmt(i.precio*i.qty)}</div>
    </div>`).join('')}
  <div class="divider"></div>
  <div class="cart-total"><span>TOTAL</span><span class="t-val">${fmt(_carrito.reduce((s,i)=>s+i.precio*i.qty,0))}</span></div>`;
  if (footerEl) footerEl.style.display='block';
}

window.cambiarCartQty = function(id, delta) {
  _carrito = _carrito.map(i=>i.id==id?{...i,qty:Math.max(0,i.qty+delta)}:i).filter(i=>i.qty>0);
  renderCarrito();
};
window.limpiarCarrito = function() {
  _carrito = [];
  window._ollaQtys = {da:0,dn:0,aa:0,an:0};
  renderCarrito();
};

window.confirmarVenta = function() {
  const hId    = window._hermanoSel?.['vt'];
  const modal  = window._modalidades?.['vt'] || 'inmediato';
  const medio  = window._pagos?.['vt'] || 'efectivo';

  if (!hId) { toast('Selecciona un hermano/a', 'error'); return; }
  if (!_carrito.length) { toast('Agrega productos al carrito', 'error'); return; }

  const evento = DB.getEvento();
  if (!evento) { toast('Activa un evento en Configuración', 'warning'); return; }

  const h = DB.getHermanos().find(x => x.id == hId);
  const total = _carrito.reduce((s,i)=>s+i.precio*i.qty,0);

  // Validar abono
  if (modal === 'abono') {
    const sa = DB.getSaldoAbono(Number(hId));
    if (sa <= 0) {
      // Preguntar al cajero
      openModal(`
      <div class="modal-header"><h3>⚠️ Saldo insuficiente</h3><button class="btn btn-ghost btn-sm" onclick="closeModal()">✕</button></div>
      <div class="modal-body">
        <p style="font-size:14px;line-height:1.5;">
          <strong>${h?.nombre}</strong> no tiene saldo de abono disponible (saldo: <strong style="color:var(--rojo)">${fmt(sa)}</strong>).
          <br/><br/>¿Cómo deseas proceder?
        </p>
      </div>
      <div class="modal-footer" style="flex-direction:column;gap:8px;">
        <button class="btn btn-primary btn-block" onclick="closeModal();_registrarVenta('credito','${hId}')">📋 Registrar como crédito</button>
        <button class="btn btn-gold btn-block" onclick="closeModal();abrirModalAbono(${hId})">🏦 Registrar abono primero</button>
        <button class="btn btn-ghost btn-block" onclick="closeModal()">Cancelar</button>
      </div>`);
      return;
    }
    if (sa < total) {
      openModal(`
      <div class="modal-header"><h3>⚠️ Saldo parcial</h3><button class="btn btn-ghost btn-sm" onclick="closeModal()">✕</button></div>
      <div class="modal-body">
        <p style="font-size:14px;line-height:1.5;">
          El saldo disponible de <strong style="color:var(--verde)">${fmt(sa)}</strong> es menor al total de 
          <strong style="color:var(--azul-m)">${fmt(total)}</strong>. 
          Diferencia: <strong style="color:var(--rojo)">${fmt(total-sa)}</strong>.
          <br/><br/>¿Cómo manejar la diferencia?
        </p>
      </div>
      <div class="modal-footer" style="flex-direction:column;gap:8px;">
        <button class="btn btn-primary btn-block" onclick="closeModal();_registrarVenta('abono','${hId}',true)">Abono + resto como crédito</button>
        <button class="btn btn-ghost btn-block" onclick="closeModal()">Cancelar</button>
      </div>`);
      return;
    }
  }

  _registrarVenta(modal, hId);
};

window._registrarVenta = function(modal, hId, combinado=false) {
  const h      = DB.getHermanos().find(x => x.id == hId);
  const medio  = window._pagos?.['vt'] || 'efectivo';
  const foto   = window._fotos?.['vt'] || null;
  const ref    = el('vt_ref')?.value || '';
  const evento = DB.getEvento();
  const total  = _carrito.reduce((s,i)=>s+i.precio*i.qty,0);

  const tx = {
    id:            uid(),
    hermanoId:     Number(hId),
    hermanoNombre: h?.nombre,
    hermanoIglesia:h?.iglesia,
    hermanoTipo:   h?.tipo,
    items:         [..._carrito],
    total,
    modalidad:     modal,
    medioPago:     modal === 'inmediato' ? medio : (modal==='credito'?'pendiente':'abono'),
    fotoPago:      medio === 'transferencia' ? foto : null,
    refPago:       medio === 'transferencia' ? ref  : null,
    pagado:        modal === 'inmediato',
    fechaPago:     modal === 'inmediato' ? new Date().toISOString() : null,
    fecha:         new Date().toISOString(),
    tipo:          _modoVenta,
    eventoId:      evento?.id,
    eventoLabel:   evento?.label,
    eventoTipo:    evento?.tipo,
    eventoDia:     evento?.diaActual || null,
    combinado
  };

  DB.addTx(tx);
  toast(`✅ Venta registrada · ${fmt(total)}`, 'success');
  limpiarCarrito();
  window._hermanoSel['vt'] = null;
  limpiarSelectorHermano('vt');
  window._modalidades['vt'] = 'inmediato';
  selMod('vt','inmediato');
  closeAllModals();
};

// ── Olla Común (tab independiente) ──
function renderOlla() {
  _modoVenta = 'olla';
  _carrito = [];
  window._ollaQtys = {da:0,dn:0,aa:0,an:0};
  window._modalidades['vt'] = 'inmediato';
  window._pagos['vt'] = 'efectivo';
  window._hermanoSel = window._hermanoSel || {};
  window._hermanoSel['vt'] = null;

  render('#main', `
  <div class="fade-in">
    <div class="card" style="margin-bottom:14px;">
      <div class="card-title">🍲 Olla Común</div>
      ${compSelectorHermano('vt', null, true)}
      <div style="height:12px;"></div>
      ${compModalidad('vt','inmediato')}
    </div>
    <div class="card">
      <div class="card-title">🍽️ Platos disponibles</div>
      <div class="olla-grid">
        ${renderOllaItems()}
      </div>
      <button class="btn btn-ghost btn-sm" style="margin-top:12px;" onclick="abrirEditarPreciosOlla()">✏️ Editar precios</button>
    </div>
    <div class="card" style="margin-top:14px;" id="carrito-panel">
      <div class="card-title">🧾 Resumen</div>
      <div id="carrito-items"><p style="color:var(--gris);font-size:13px;text-align:center;padding:12px;">Selecciona platos arriba</p></div>
      <div id="carrito-footer" style="display:none;">
        <div style="height:10px;"></div>
        ${compMedioPago('vt','efectivo')}
        <div style="height:10px;"></div>
        <button class="btn btn-primary btn-block btn-lg" onclick="confirmarVenta()">✅ Registrar Pedido</button>
      </div>
    </div>
  </div>`);
  window._pagos['vt'] = 'efectivo';
}

function renderOllaItems() {
  const po = DB.getPreciosOlla();
  const ops = [
    {id:'da',nombre:'Desayuno Adulto',precio:po.desayunoAdulto,icono:'☕'},
    {id:'dn',nombre:'Desayuno Niño',  precio:po.desayunoNino,  icono:'🧃'},
    {id:'aa',nombre:'Almuerzo Adulto',precio:po.almuerzoAdulto,icono:'🍽️'},
    {id:'an',nombre:'Almuerzo Niño',  precio:po.almuerzoNino,  icono:'🍱'},
  ];
  return ops.map(o=>`
    <div class="olla-item">
      <div class="oi-ico">${o.icono}</div>
      <div class="oi-name">${o.nombre}</div>
      <div class="oi-price">${fmt(o.precio)}</div>
      <div class="qty-wrap" style="justify-content:center;">
        <button class="qty-btn" onclick="cambiarOlla('${o.id}',-1)">−</button>
        <span class="qty-num" id="olla_qty_${o.id}">0</span>
        <button class="qty-btn" onclick="cambiarOlla('${o.id}',1)">+</button>
      </div>
    </div>`).join('');
}

// ── Editar precios ──
window.abrirEditarPreciosOlla = function() {
  const po = DB.getPreciosOlla();
  openModal(`
  <div class="modal-header"><h3>✏️ Editar precios Olla/Restaurante</h3><button class="btn btn-ghost btn-sm" onclick="closeModal()">✕</button></div>
  <div class="modal-body">
    <div class="form-row cols-2">
      ${[['desayunoAdulto','Desayuno Adulto ☕'],['desayunoNino','Desayuno Niño 🧃'],['almuerzoAdulto','Almuerzo Adulto 🍽️'],['almuerzoNino','Almuerzo Niño 🍱']].map(([k,l])=>`
        <div class="form-group">
          <label class="label">${l}</label>
          <input class="input" id="op_${k}" type="number" value="${po[k]}"/>
        </div>`).join('')}
    </div>
  </div>
  <div class="modal-footer">
    <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-success" onclick="
      DB.setPreciosOlla({
        desayunoAdulto: +el('op_desayunoAdulto').value,
        desayunoNino:   +el('op_desayunoNino').value,
        almuerzoAdulto: +el('op_almuerzoAdulto').value,
        almuerzoNino:   +el('op_almuerzoNino').value
      });closeModal();toast('Precios actualizados','success');
      if(App.currentTab==='olla')renderOlla();
    ">💾 Guardar</button>
  </div>`);
};

window.abrirEditarPreciosPan = function() {
  const pans = DB.getPreciosPan();
  openModal(`
  <div class="modal-header"><h3>✏️ Editar precios Panadería</h3><button class="btn btn-ghost btn-sm" onclick="closeModal()">✕</button></div>
  <div class="modal-body">
    <div class="form-row cols-2">
      ${pans.map(p=>`
        <div class="form-group">
          <label class="label">${p.icono} ${p.nombre}</label>
          <input class="input" id="pan_${p.id}" type="number" value="${p.precio}"/>
        </div>`).join('')}
    </div>
  </div>
  <div class="modal-footer">
    <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-success" onclick="
      DB.setPreciosPan(DB.getPreciosPan().map(p=>({...p,precio:+(el('pan_'+p.id)?.value||p.precio)})));
      closeModal();toast('Precios actualizados','success');
      if(App.currentTab==='pan')renderVenta('pan');
    ">💾 Guardar</button>
  </div>`);
};
