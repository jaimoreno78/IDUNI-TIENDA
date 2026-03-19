/* ═══════════════════════════════════════════
   REPORTES.JS
═══════════════════════════════════════════ */
function renderReportes() {
  const cfg = DB.getConfig() || {};
  const txs = DB.getTx();
  const evento = DB.getEvento();

  render('#main', `
  <div class="fade-in">
    <div class="card" style="margin-bottom:14px;">
      <div class="card-title">📊 Reportes y Contabilidad</div>
      <div style="font-size:13px;color:var(--gris);">
        📍 ${cfg.nombre||'IDUNI'} — ${cfg.ciudad||''}, ${cfg.dpto||''}
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">
      <div class="card" style="cursor:pointer;text-align:center;" onclick="reporteDia()">
        <div style="font-size:36px;margin-bottom:8px;">📅</div>
        <div style="font-weight:800;">Reporte del Día</div>
        <div style="font-size:12px;color:var(--gris);margin-top:4px;">Resumen de hoy</div>
      </div>
      <div class="card" style="cursor:pointer;text-align:center;" onclick="reporteEvento()">
        <div style="font-size:36px;margin-bottom:8px;">📅</div>
        <div style="font-weight:800;">Reporte Evento</div>
        <div style="font-size:12px;color:var(--gris);margin-top:4px;">${evento?.label||'Sin evento activo'}</div>
      </div>
      <div class="card" style="cursor:pointer;text-align:center;" onclick="reporteDeudores()">
        <div style="font-size:36px;margin-bottom:8px;">⏳</div>
        <div style="font-weight:800;">Deudores</div>
        <div style="font-size:12px;color:var(--gris);margin-top:4px;">Créditos pendientes</div>
      </div>
      <div class="card" style="cursor:pointer;text-align:center;" onclick="reporteGeneral()">
        <div style="font-size:36px;margin-bottom:8px;">💰</div>
        <div style="font-weight:800;">Reporte General</div>
        <div style="font-size:12px;color:var(--gris);margin-top:4px;">Contabilidad completa</div>
      </div>
      <div class="card" style="cursor:pointer;text-align:center;" onclick="reporteIglesia()">
        <div style="font-size:36px;margin-bottom:8px;">🏛️</div>
        <div style="font-weight:800;">Por Iglesia</div>
        <div style="font-size:12px;color:var(--gris);margin-top:4px;">Desglose por iglesia</div>
      </div>
      <div class="card" style="cursor:pointer;text-align:center;" onclick="exportarDatos()">
        <div style="font-size:36px;margin-bottom:8px;">💾</div>
        <div style="font-weight:800;">Exportar Datos</div>
        <div style="font-size:12px;color:var(--gris);margin-top:4px;">Respaldo completo</div>
      </div>
    </div>
  </div>`);
}

function encabezadoReporte(titulo) {
  const cfg = DB.getConfig() || {};
  return `
  <h1 style="color:#0d2a5e;">✡️ ${cfg.nombre||'IDUNI'}</h1>
  <h2 style="color:#1a4fa8;">${titulo}</h2>
  <p style="color:#666;font-size:12px;margin-top:4px;">
    ${cfg.tipo==='campo'?'Campo Real':'Iglesia'} — ${cfg.ciudad||''}, ${cfg.dpto||''}<br/>
    Generado: ${new Date().toLocaleString('es-CO')}
  </p>
  <hr style="margin:12px 0;border-color:#c8dff5;"/>`;
}

window.reporteDia = function() {
  const hoy = isoHoy();
  const txs = DB.getTx().filter(t => t.fecha?.startsWith(hoy));
  const total = txs.reduce((s,t)=>s+t.total,0);
  const pagado = txs.filter(t=>t.pagado).reduce((s,t)=>s+t.total,0);

  imprimir(`
    ${encabezadoReporte('Reporte del Día — ' + fmtDate(new Date()))}
    <table>
      <thead><tr><th>Hora</th><th>Hermano/a</th><th>Iglesia</th><th>Tipo</th><th>Modalidad</th><th>Total</th><th>Estado</th></tr></thead>
      <tbody>
        ${txs.map(t=>`<tr>
          <td>${new Date(t.fecha).toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'})}</td>
          <td>${t.hermanoNombre}</td><td>${t.hermanoIglesia||'—'}</td>
          <td>${t.tipo==='olla'?'Olla':t.tipo==='pan'?'Panadería':'Tienda'}</td>
          <td>${t.modalidad}</td>
          <td class="total">${new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(t.total)}</td>
          <td>${t.pagado?'✅ Pagado':'⏳ Pendiente'}</td>
        </tr>`).join('')}
      </tbody>
    </table>
    <p class="total" style="margin-top:14px;">Total: ${fmt(total)} | Cobrado: ${fmt(pagado)} | Pendiente: ${fmt(total-pagado)}</p>
  `, 'Reporte del Día');
};

window.reporteEvento = function() {
  const ev = DB.getEvento();
  if (!ev) { toast('No hay evento activo','warning'); return; }
  const txs = DB.getTx().filter(t=>t.eventoId===ev.id);
  const total = txs.reduce((s,t)=>s+t.total,0);
  imprimir(`
    ${encabezadoReporte('Reporte de Evento: ' + ev.label)}
    <table>
      <thead><tr><th>Fecha</th><th>Hermano/a</th><th>Iglesia</th><th>Tipo</th><th>Total</th><th>Estado</th></tr></thead>
      <tbody>
        ${txs.map(t=>`<tr>
          <td>${new Date(t.fecha).toLocaleDateString('es-CO')}${t.eventoDia?' D'+t.eventoDia:''}</td>
          <td>${t.hermanoNombre}</td><td>${t.hermanoIglesia||'—'}</td>
          <td>${t.tipo==='olla'?'Olla':t.tipo==='pan'?'Panadería':'Tienda'}</td>
          <td class="total">${new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(t.total)}</td>
          <td>${t.pagado?'✅ Pagado':'⏳ Pendiente'}</td>
        </tr>`).join('')}
      </tbody>
    </table>
    <p class="total" style="margin-top:14px;">Total general: ${fmt(total)}</p>
  `, 'Reporte Evento');
};

window.reporteDeudores = function() {
  const hermanos = DB.getHermanos();
  const deudores = hermanos.map(h=>({...h, deuda:DB.getDeudaCredito(h.id)})).filter(h=>h.deuda>0);
  const total = deudores.reduce((s,h)=>s+h.deuda,0);
  imprimir(`
    ${encabezadoReporte('Reporte de Deudores')}
    <table>
      <thead><tr><th>Nombre</th><th>Tipo</th><th>Iglesia</th><th>Teléfono</th><th>Deuda</th></tr></thead>
      <tbody>
        ${deudores.map(h=>`<tr>
          <td>${h.nombre}</td>
          <td>${h.tipo==='hermana'?'Hermana':h.tipo==='invitado'?'Invitado/a':h.tipo==='nino'?'Niño/a':'Hermano'}</td>
          <td>${h.iglesia}</td><td>${h.tel||'—'}</td>
          <td class="total" style="color:#c0392b;">${new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(h.deuda)}</td>
        </tr>`).join('')}
      </tbody>
    </table>
    <p class="total" style="margin-top:14px;color:#c0392b;">Total por cobrar: ${fmt(total)}</p>
  `, 'Deudores');
};

window.reporteGeneral = function() {
  const txs = DB.getTx();
  const total = txs.reduce((s,t)=>s+t.total,0);
  const pagado = txs.filter(t=>t.pagado).reduce((s,t)=>s+t.total,0);
  const tienda = txs.filter(t=>t.tipo==='tienda').reduce((s,t)=>s+t.total,0);
  const olla   = txs.filter(t=>t.tipo==='olla').reduce((s,t)=>s+t.total,0);
  const pan    = txs.filter(t=>t.tipo==='pan').reduce((s,t)=>s+t.total,0);
  imprimir(`
    ${encabezadoReporte('Reporte General de Contabilidad')}
    <table><thead><tr><th>Servicio</th><th>Total</th></tr></thead><tbody>
      <tr><td>🛒 Tienda</td><td class="total">${fmt(tienda)}</td></tr>
      <tr><td>🍲 Olla Común</td><td class="total">${fmt(olla)}</td></tr>
      <tr><td>🥖 Panadería</td><td class="total">${fmt(pan)}</td></tr>
      <tr><td><strong>TOTAL</strong></td><td class="total"><strong>${fmt(total)}</strong></td></tr>
      <tr><td>✅ Cobrado</td><td class="total" style="color:#1e8449;">${fmt(pagado)}</td></tr>
      <tr><td>⏳ Pendiente</td><td class="total" style="color:#c0392b;">${fmt(total-pagado)}</td></tr>
    </tbody></table>
    <br/><p>Total de transacciones: <strong>${txs.length}</strong></p>
  `, 'Reporte General');
};

window.reporteIglesia = function() {
  const txs = DB.getTx();
  const iglesias = [...new Set(txs.map(t=>t.hermanoIglesia||'Sin iglesia'))];
  const rows = iglesias.map(ig=>{
    const t = txs.filter(x=>x.hermanoIglesia===ig);
    const total = t.reduce((s,x)=>s+x.total,0);
    const pend  = t.filter(x=>!x.pagado).reduce((s,x)=>s+x.total,0);
    return {ig, count:t.length, total, pend};
  }).sort((a,b)=>b.total-a.total);
  imprimir(`
    ${encabezadoReporte('Reporte por Iglesia')}
    <table>
      <thead><tr><th>Iglesia</th><th>Transacciones</th><th>Total</th><th>Pendiente</th></tr></thead>
      <tbody>
        ${rows.map(r=>`<tr>
          <td>${r.ig}</td><td>${r.count}</td>
          <td class="total">${fmt(r.total)}</td>
          <td style="color:#c0392b;">${fmt(r.pend)}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  `, 'Reporte por Iglesia');
};

window.exportarDatos = function() {
  const json = DB.exportar();
  descargarTexto(`IDUNI_respaldo_${isoHoy()}.json`, json);
  toast('Datos exportados correctamente ✓','success');
};

/* ═══════════════════════════════════════════
   CONFIG.JS
═══════════════════════════════════════════ */
function renderConfig() {
  const cfg = DB.getConfig() || {};
  const evento = DB.getEvento();

  render('#main', `
  <div class="fade-in">
    <!-- Info de la iglesia -->
    <div class="card" style="margin-bottom:14px;">
      <div class="card-title">🏛️ Datos de la Iglesia / Campo Real</div>
      <div style="font-size:13px;margin-bottom:12px;background:var(--azul-g);padding:12px;border-radius:10px;">
        <strong>${cfg.nombre||'—'}</strong><br/>
        <span style="color:var(--gris);">${cfg.tipo==='campo'?'Campo Real':'Iglesia'} — ${cfg.ciudad||''}, ${cfg.dpto||''}</span>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="renderSetup();DB.setConfig({...DB.getConfig(),_reconfig:true})">✏️ Cambiar datos</button>
    </div>

    <!-- Evento activo -->
    <div class="card" style="margin-bottom:14px;">
      <div class="card-title">✡️ Evento / Reunión Activa</div>
      ${evento ? `
        <div style="background:var(--azul-g);border-radius:10px;padding:14px;margin-bottom:12px;border-left:4px solid var(--azul-m);">
          <div style="font-weight:800;font-size:15px;">${EVENTOS_DEF.find(e=>e.tipo===evento.tipo)?.icon} ${evento.label}</div>
          ${evento.diaActual?`<div style="color:var(--gris);font-size:12px;margin-top:2px;">Día ${evento.diaActual} de 8</div>`:''}
          <div style="color:var(--gris);font-size:11.5px;margin-top:2px;">Activado: ${fmtDate(evento.fechaInicio)}</div>
          <button class="btn btn-danger btn-sm" style="margin-top:10px;" onclick="cerrarEvento()">🔴 Cerrar evento</button>
        </div>` :
        `<div class="alert alert-warning" style="margin-bottom:12px;">Sin evento activo. Activa uno para comenzar.</div>`}

      <div style="display:flex;flex-direction:column;gap:8px;" id="eventos-lista">
        ${EVENTOS_DEF.map(e=>`
          <div style="display:flex;align-items:center;justify-content:space-between;padding:12px;border-radius:10px;border:2px solid var(--azul-p);background:#fff;cursor:pointer;"
            onclick="activarEvento('${e.tipo}')">
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:24px;">${e.icon}</span>
              <div>
                <div style="font-weight:800;font-size:13px;">${e.label}</div>
                <div style="font-size:11px;color:var(--gris);">${e.dias>1?'Duración: '+e.dias+' días':e.mes||'Mensual'}</div>
              </div>
            </div>
            <button class="btn btn-primary btn-sm">Activar</button>
          </div>`).join('')}
      </div>
    </div>

    <!-- Seguridad de datos -->
    <div class="card">
      <div class="card-title">🔒 Seguridad de Datos</div>
      <p style="font-size:13px;color:var(--gris);margin-bottom:14px;line-height:1.6;">
        Todos los datos se guardan en este dispositivo. Haz respaldos regulares para no perder la información.
      </p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button class="btn btn-primary" onclick="exportarDatos()">💾 Exportar respaldo</button>
        <button class="btn btn-ghost" onclick="importarDatos()">📂 Importar respaldo</button>
        <button class="btn btn-danger btn-sm" onclick="borrarTodo()">⚠️ Borrar todo</button>
      </div>
      <input type="file" id="import_file" accept=".json" style="display:none;" onchange="procesarImport(this)"/>
    </div>
  </div>`);
}

window.activarEvento = function(tipo) {
  const evDef = EVENTOS_DEF.find(e=>e.tipo===tipo);
  if (!evDef) return;
  if (evDef.dias > 1) {
    openModal(`
    <div class="modal-header"><h3>${evDef.icon} ${evDef.label}</h3><button class="btn btn-ghost btn-sm" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <p style="font-size:13px;margin-bottom:14px;">Esta fiesta dura 8 días. ¿En qué día vas a empezar?</p>
      <div class="dias-grid">
        ${[1,2,3,4,5,6,7,8].map(d=>`
          <div class="dia-btn" onclick="confirmarActivarEvento('${tipo}',${d})">
            <span class="d-num">${d}</span>
            <span class="d-lbl">Día ${d}</span>
          </div>`).join('')}
      </div>
    </div>`);
  } else {
    confirmarActivarEvento(tipo, null);
  }
};

window.confirmarActivarEvento = function(tipo, dia) {
  const evDef = EVENTOS_DEF.find(e=>e.tipo===tipo);
  const ev = {
    id:          uid(),
    tipo,
    label:       evDef.label,
    icon:        evDef.icon,
    diaActual:   dia,
    fechaInicio: new Date().toISOString()
  };
  DB.setEvento(ev);
  closeAllModals();
  toast(`Evento activado: ${evDef.label}`, 'success');
  App.refreshHeader();
  renderConfig();
};

window.cerrarEvento = async function() {
  const ok = await confirmar('¿Cerrar el evento activo? Los datos quedan guardados en el historial.');
  if (!ok) return;
  DB.setEvento(null);
  App.refreshHeader();
  toast('Evento cerrado','warning');
  renderConfig();
};

window.importarDatos = function() { el('import_file')?.click(); };
window.procesarImport = async function(input) {
  if (!input.files?.[0]) return;
  const ok = await confirmar('¿Importar este respaldo? Se reemplazarán los datos actuales.');
  if (!ok) return;
  const txt = await input.files[0].text();
  try {
    const data = JSON.parse(txt);
    if (data.config)       DB.setConfig(data.config);
    if (data.productos)    DB.setProductos(data.productos);
    if (data.hermanos)     DB.setHermanos(data.hermanos);
    if (data.iglesias)     DB.setIglesias(data.iglesias);
    if (data.transacciones) localStorage.setItem('iduni_transacciones', JSON.stringify(data.transacciones));
    if (data.abonos)       localStorage.setItem('iduni_abonos', JSON.stringify(data.abonos));
    if (data.preciosOlla)  DB.setPreciosOlla(data.preciosOlla);
    toast('Datos importados correctamente ✓','success');
    setTimeout(()=>App.init(), 600);
  } catch { toast('El archivo no es válido','error'); }
};

window.borrarTodo = async function() {
  const ok = await confirmar('⚠️ ATENCIÓN: Esto borrará TODOS los datos permanentemente. ¿Estás seguro? Esta acción NO se puede deshacer.');
  if (!ok) return;
  const ok2 = await confirmar('¿Confirmas que quieres borrar TODO? Haz un respaldo primero si lo necesitas.');
  if (!ok2) return;
  ['config','evento','productos','hermanos','iglesias','transacciones','abonos','precios_olla','precios_pan'].forEach(k=>{
    localStorage.removeItem('iduni_'+k);
  });
  toast('Datos borrados. Reiniciando...','warning');
  setTimeout(()=>location.reload(), 1200);
};
