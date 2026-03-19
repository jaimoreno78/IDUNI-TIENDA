/* ═══════════════════════════════════════════
   DASHBOARD.JS — Pantalla principal
═══════════════════════════════════════════ */
function renderDashboard() {
  const cfg = DB.getConfig() || {};
  const evento = DB.getEvento();
  const txs = DB.getTx();
  const hoy = isoHoy();
  const txHoy = txs.filter(t => t.fecha && t.fecha.startsWith(hoy));
  const totalHoy = txHoy.reduce((s,t)=>s+t.total,0);
  const pendHoy = txHoy.filter(t=>!t.pagado).reduce((s,t)=>s+t.total,0);

  // Estadísticas del evento activo
  let statsEvento = '';
  if (evento) {
    const txEv = txs.filter(t => t.eventoId === evento.id);
    const totEv = txEv.reduce((s,t)=>s+t.total,0);
    const pendEv = txEv.filter(t=>!t.pagado).reduce((s,t)=>s+t.total,0);
    const evDef = EVENTOS_DEF.find(e=>e.tipo===evento.tipo);
    statsEvento = `
    <div class="card" style="margin-top:14px;">
      <div class="card-title">${evDef?.icon||'📅'} Evento activo: ${evento.label}</div>
      <div class="stats-grid">
        <div class="stat-card"><div class="sc-ico">📝</div><div class="sc-lbl">Transacciones</div><div class="sc-val">${txEv.length}</div></div>
        <div class="stat-card" style="border-left-color:var(--azul-m)"><div class="sc-ico">💰</div><div class="sc-lbl">Total evento</div><div class="sc-val" style="font-size:16px;">${fmt(totEv)}</div></div>
        <div class="stat-card" style="border-left-color:var(--verde)"><div class="sc-ico">✅</div><div class="sc-lbl">Recaudado</div><div class="sc-val" style="font-size:16px;color:var(--verde)">${fmt(totEv-pendEv)}</div></div>
        <div class="stat-card" style="border-left-color:var(--rojo)"><div class="sc-ico">⏳</div><div class="sc-lbl">Pendiente</div><div class="sc-val" style="font-size:16px;color:var(--rojo)">${fmt(pendEv)}</div></div>
      </div>
      ${evento.tipo !== 'sabado' && evento.tipo !== 'nueva_luna' ? `
      <div style="margin-top:12px;">
        <div style="font-size:12px;font-weight:800;color:var(--gris);margin-bottom:8px;text-transform:uppercase;letter-spacing:.4px;">Días de la fiesta</div>
        <div class="dias-grid">
          ${[1,2,3,4,5,6,7,8].map(d=>`
            <div class="dia-btn${evento.diaActual==d?' sel':''}" onclick="cambiarDiaFiesta(${d})">
              <span class="d-num">${d}</span>
              <span class="d-lbl">Día ${d}</span>
            </div>`).join('')}
        </div>
      </div>` : ''}
    </div>`;
  }

  render('#main', `
  <div class="fade-in">
    <div class="dash-hero">
      <div class="iglesia">✡️ ${cfg.nombre||'IDUNI'}</div>
      <div class="lugar">🏛️ ${cfg.tipo==='campo'?'Campo Real':'Iglesia'} — ${cfg.ciudad||''}, ${cfg.dpto||''}</div>
      <div style="margin-top:10px;font-size:12px;color:rgba(255,255,255,.7);">📅 ${hoy()}</div>
      ${evento ? `<div class="evento-badge">${EVENTOS_DEF.find(e=>e.tipo===evento.tipo)?.icon||'📅'} ${evento.label}${evento.diaActual?' · Día '+evento.diaActual:''}</div>` : ''}
    </div>

    ${!evento ? `
    <div class="alert alert-warning" style="margin-bottom:14px;">
      ⚠️ No hay un evento activo. Ve a <strong>Configuración → Activar Evento</strong> antes de registrar ventas.
    </div>` : ''}

    <div class="mode-grid">
      <div class="mode-card normal" onclick="App.setTab('venta')">
        <div class="mode-icon">🛒</div>
        <div class="mode-name">Tienda</div>
        <div class="mode-desc">Venta de productos</div>
      </div>
      <div class="mode-card normal" onclick="App.setTab('olla')">
        <div class="mode-icon">🍲</div>
        <div class="mode-name">Olla Común</div>
        <div class="mode-desc">Desayunos y almuerzos</div>
      </div>
      ${evento && evento.tipo !== 'sabado' && evento.tipo !== 'nueva_luna' ? `
      <div class="mode-card fiesta" onclick="App.setTab('pan')">
        <div class="mode-icon">🥖</div>
        <div class="mode-name">Panadería</div>
        <div class="mode-desc">Solo en fiestas</div>
      </div>
      <div class="mode-card fiesta" onclick="App.setTab('restaurante')">
        <div class="mode-icon">🍽️</div>
        <div class="mode-name">Restaurante</div>
        <div class="mode-desc">Solo en fiestas</div>
      </div>` : ''}
      <div class="mode-card normal" onclick="App.setTab('cuentas')">
        <div class="mode-icon">📋</div>
        <div class="mode-name">Cuentas</div>
        <div class="mode-desc">Saldos y pagos</div>
      </div>
      <div class="mode-card normal" onclick="App.setTab('reportes')">
        <div class="mode-icon">📊</div>
        <div class="mode-name">Reportes</div>
        <div class="mode-desc">Contabilidad</div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">📈 Resumen de hoy</div>
      <div class="stats-grid">
        <div class="stat-card"><div class="sc-ico">🧾</div><div class="sc-lbl">Ventas hoy</div><div class="sc-val">${txHoy.length}</div></div>
        <div class="stat-card"><div class="sc-ico">💰</div><div class="sc-lbl">Total hoy</div><div class="sc-val" style="font-size:16px;">${fmt(totalHoy)}</div></div>
        <div class="stat-card" style="border-left-color:var(--rojo)"><div class="sc-ico">⏳</div><div class="sc-lbl">Por cobrar</div><div class="sc-val" style="color:var(--rojo);font-size:16px;">${fmt(pendHoy)}</div></div>
        <div class="stat-card" style="border-left-color:var(--verde)"><div class="sc-ico">✅</div><div class="sc-lbl">Cobrado</div><div class="sc-val" style="color:var(--verde);font-size:16px;">${fmt(totalHoy-pendHoy)}</div></div>
      </div>
    </div>

    ${statsEvento}

    <div class="card" style="margin-top:14px;">
      <div class="card-title">⚡ Acciones rápidas</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button class="btn btn-primary" onclick="App.setTab('hermanos')">👥 Registrar hermano/a</button>
        <button class="btn btn-gold"    onclick="abrirModalAbono()">🏦 Registrar abono</button>
        <button class="btn btn-ghost"   onclick="App.setTab('historial')">📜 Ver historial</button>
      </div>
    </div>
  </div>`);
}

window.cambiarDiaFiesta = function(dia) {
  const ev = DB.getEvento();
  if (!ev) return;
  ev.diaActual = dia;
  DB.setEvento(ev);
  App.refreshHeader();
  renderDashboard();
  toast(`Día ${dia} activado`, 'success');
};

window.abrirModalAbono = function(hermanoId) {
  openModal(`
  <div class="modal-header"><h3>🏦 Registrar Abono</h3><button class="btn btn-ghost btn-sm" onclick="closeModal()">✕</button></div>
  <div class="modal-body">
    ${compSelectorHermano('ab', null, true)}
    <div style="height:14px;"></div>
    <div class="form-group">
      <label class="label">Monto del abono</label>
      <input class="input" id="ab_monto" type="number" placeholder="0" min="0"/>
    </div>
    <div style="height:10px;"></div>
    ${compMedioPago('ab', 'efectivo')}
    <div style="height:10px;"></div>
    <div class="form-group">
      <label class="label">Observación (opcional)</label>
      <input class="input" id="ab_obs" placeholder="Ej: Abono para fiesta de la Pascua"/>
    </div>
    <div id="ab_saldo_info" style="margin-top:10px;"></div>
  </div>
  <div class="modal-footer">
    <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-success" onclick="confirmarAbono()">💾 Registrar abono</button>
  </div>`);

  window._pagos['ab'] = 'efectivo';
  window.onHermanoSel_ab = function(h) {
    const info = el('ab_saldo_info');
    if (info) info.innerHTML = compAbonoPanel(h.id);
  };
};

window.confirmarAbono = function() {
  const hId = window._hermanoSel?.['ab'];
  const monto = parseFloat(el('ab_monto')?.value || '0');
  if (!hId) { toast('Selecciona un hermano/a', 'error'); return; }
  if (!monto || monto <= 0) { toast('Ingresa un monto válido', 'error'); return; }
  const h = DB.getHermanos().find(x => x.id == hId);
  const medio = window._pagos['ab'] || 'efectivo';
  const foto  = window._fotos['ab'] || null;
  const ref   = el('ab_ref')?.value || '';

  DB.addAbono({
    id: uid(), hermanoId: Number(hId), hermanoNombre: h?.nombre,
    monto, medio, foto, ref,
    obs: el('ab_obs')?.value || '',
    fecha: new Date().toISOString(),
    eventoId: DB.getEvento()?.id || null
  });

  // Si hay deuda de crédito, preguntar si aplica al saldo
  const deuda = DB.getDeudaCredito(Number(hId));
  closeModal();
  toast(`Abono de ${fmt(monto)} registrado para ${h?.nombre}`, 'success');
  if (deuda > 0) {
    setTimeout(() => {
      openModal(`
      <div class="modal-header"><h3>💡 ¿Aplicar abono a deuda?</h3><button class="btn btn-ghost btn-sm" onclick="closeModal()">✕</button></div>
      <div class="modal-body">
        <p style="font-size:14px;line-height:1.5;">
          <strong>${h?.nombre}</strong> tiene una deuda de crédito de <strong style="color:var(--rojo)">${fmt(deuda)}</strong>.
          <br/><br/>¿Deseas aplicar el abono de <strong style="color:var(--verde)">${fmt(monto)}</strong> para saldar esta deuda?
        </p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="closeModal()">No, solo registrar abono</button>
        <button class="btn btn-success" onclick="aplicarAbonoADeuda(${hId},${monto});closeModal()">✅ Sí, aplicar</button>
      </div>`);
    }, 400);
  }
  if (App.currentTab === 'inicio') renderDashboard();
};

window.aplicarAbonoADeuda = function(hermanoId, montoAbono) {
  let restante = montoAbono;
  const txs = DB.getTx().filter(t => t.hermanoId == hermanoId && !t.pagado && t.modalidad === 'credito')
    .sort((a,b) => new Date(a.fecha) - new Date(b.fecha));
  txs.forEach(t => {
    if (restante <= 0) return;
    if (restante >= t.total) {
      DB.updateTx(t.id, { pagado:true, fechaPago: new Date().toISOString(), medioPago:'abono' });
      restante -= t.total;
    }
  });
  toast('Deuda parcial o total saldada con el abono ✓', 'success');
};
