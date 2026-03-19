/* ═══════════════════════════════════════════
   CUENTAS.JS — Gestión de cuentas y pagos
═══════════════════════════════════════════ */
function renderCuentas() {
  const hermanos = DB.getHermanos();
  const txs = DB.getTx();

  // Construir resumen por hermano
  const resumen = hermanos.map(h => {
    const deudaCredito = DB.getDeudaCredito(h.id);
    const saldoAbono   = DB.getSaldoAbono(h.id);
    return { ...h, deudaCredito, saldoAbono,
      tiene: deudaCredito > 0 || saldoAbono !== 0 };
  }).filter(h => h.tiene || true); // mostrar todos

  const conDeuda  = resumen.filter(h => h.deudaCredito > 0);
  const conAbono  = resumen.filter(h => h.saldoAbono > 0);
  const alDia     = resumen.filter(h => h.deudaCredito === 0 && h.saldoAbono >= 0);

  render('#main', `
  <div class="fade-in">
    <div class="card" style="margin-bottom:14px;">
      <div class="card-title">📋 Cuentas de la Hermandad</div>
      <div class="stats-grid" style="margin-bottom:14px;">
        <div class="stat-card" style="border-left-color:var(--rojo)">
          <div class="sc-ico">⏳</div><div class="sc-lbl">Con deuda</div>
          <div class="sc-val" style="color:var(--rojo)">${conDeuda.length}</div>
        </div>
        <div class="stat-card" style="border-left-color:var(--verde)">
          <div class="sc-ico">🏦</div><div class="sc-lbl">Con abono</div>
          <div class="sc-val" style="color:var(--verde)">${conAbono.length}</div>
        </div>
        <div class="stat-card" style="border-left-color:var(--azul-m)">
          <div class="sc-ico">💰</div><div class="sc-lbl">Total pendiente</div>
          <div class="sc-val" style="font-size:15px;">${fmt(conDeuda.reduce((s,h)=>s+h.deudaCredito,0))}</div>
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
        <span class="chip sel" id="fc_todos"  onclick="filtrarCuentas('todos',this)">Todos (${resumen.length})</span>
        <span class="chip"     id="fc_deuda"  onclick="filtrarCuentas('deuda',this)">Con deuda (${conDeuda.length})</span>
        <span class="chip"     id="fc_abono"  onclick="filtrarCuentas('abono',this)">Con abono (${conAbono.length})</span>
        <span class="chip"     id="fc_aldia"  onclick="filtrarCuentas('aldia',this)">Al día (${alDia.length})</span>
      </div>
      <input class="input" id="buscar-cuenta" placeholder="🔍 Buscar hermano/a..." oninput="buscarCuenta(this.value)"/>
    </div>

    <div id="lista-cuentas">
      ${resumen.map(h => cardCuenta(h)).join('')}
    </div>
  </div>`);

  window._filtroC = 'todos';
  window._resumenC = resumen;
}

function cardCuenta(h) {
  const d = h.deudaCredito || 0;
  const a = h.saldoAbono || 0;
  let badge = '';
  if (d > 0) badge = `<span class="badge badge-red">Debe ${fmt(d)}</span>`;
  else if (a > 0) badge = `<span class="badge badge-green">Abono ${fmt(a)}</span>`;
  else badge = `<span class="badge badge-gray">Al día ✓</span>`;
  return `
  <div class="card" style="margin-bottom:10px;cursor:pointer;" onclick="verCuentaHermano(${h.id})">
    <div style="display:flex;align-items:center;gap:12px;">
      <div class="herm-avatar">${iniciales(h.nombre)}</div>
      <div style="flex:1;">
        <div style="font-weight:800;font-size:14px;">${h.nombre}</div>
        <div style="font-size:12px;color:var(--gris);">${h.tipo==='hermana'?'Hermana':h.tipo==='invitado'?'Invitado/a':h.tipo==='nino'?'Niño/a':'Hermano'} · ${h.iglesia}</div>
      </div>
      <div style="text-align:right;">${badge}</div>
      <div style="color:var(--gris);font-size:18px;">›</div>
    </div>
  </div>`;
}

window._filtroC = 'todos';
window.filtrarCuentas = function(filtro, chip) {
  window._filtroC = filtro;
  document.querySelectorAll('#main .chip').forEach(c=>c.classList.remove('sel'));
  chip.classList.add('sel');
  actualizarListaCuentas();
};
window.buscarCuenta = function(q) {
  window._busqC = q;
  actualizarListaCuentas();
};
function actualizarListaCuentas() {
  const q = (window._busqC||'').toLowerCase();
  let lista = window._resumenC || [];
  if (window._filtroC === 'deuda') lista = lista.filter(h=>h.deudaCredito>0);
  else if (window._filtroC === 'abono') lista = lista.filter(h=>h.saldoAbono>0);
  else if (window._filtroC === 'aldia') lista = lista.filter(h=>h.deudaCredito===0&&h.saldoAbono>=0);
  if (q) lista = lista.filter(h=>h.nombre.toLowerCase().includes(q)||h.iglesia.toLowerCase().includes(q));
  const cont = el('lista-cuentas');
  if (cont) cont.innerHTML = lista.map(h=>cardCuenta(h)).join('') || '<p style="color:var(--gris);text-align:center;padding:24px;font-size:13px;">Sin resultados</p>';
}

window.verCuentaHermano = function(hermanoId) {
  const h   = DB.getHermanos().find(x=>x.id===hermanoId);
  const txs = DB.getTx().filter(t=>t.hermanoId===hermanoId && !t.pagado && t.modalidad==='credito');
  const abonos = DB.getAbonos().filter(a=>a.hermanoId===hermanoId);
  const sa  = DB.getSaldoAbono(hermanoId);
  const dc  = DB.getDeudaCredito(hermanoId);

  openModal(`
  <div class="modal-header">
    <h3>👤 ${h?.nombre}</h3>
    <button class="btn btn-ghost btn-sm" onclick="closeModal()">✕</button>
  </div>
  <div class="modal-body">
    <div style="font-size:12.5px;color:var(--gris);margin-bottom:12px;">
      ${h?.tipo==='hermana'?'👩 Hermana':h?.tipo==='invitado'?'👋 Invitado/a':h?.tipo==='nino'?'👦 Niño/a':'👨 Hermano'} · 
      🏛️ ${h?.iglesia} · 📞 ${h?.tel||'—'}
    </div>

    ${compAbonoPanel(hermanoId)}

    ${txs.length ? `
    <div style="margin-top:14px;">
      <div style="font-weight:800;font-size:13px;margin-bottom:8px;color:var(--azul-m);">⏳ Créditos pendientes</div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Fecha</th><th>Tipo</th><th>Total</th><th>Pagar</th></tr></thead>
          <tbody>
            ${txs.map(t=>`
              <tr>
                <td style="font-size:11px;">${fmtDateTime(t.fecha)}</td>
                <td>${t.tipo==='olla'?'🍲 Olla':t.tipo==='pan'?'🥖 Pan':'🛒 Tienda'}</td>
                <td style="font-weight:800;color:var(--rojo);">${fmt(t.total)}</td>
                <td>
                  <button class="btn btn-success btn-sm" onclick="abrirPagarTx('${t.id}','${hermanoId}')">💵 Pagar</button>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
        <button class="btn btn-success" onclick="pagarTodo(${hermanoId})">✅ Pagar todo (${fmt(dc)})</button>
        <button class="btn btn-ghost btn-sm" onclick="closeModal();abrirModalAbono(${hermanoId})">🏦 Registrar abono</button>
        <button class="btn btn-lila btn-sm" onclick="enviarWaHermano(${hermanoId})">📱 WhatsApp</button>
      </div>
    </div>` : `<div class="alert alert-success" style="margin-top:12px;">✅ Sin créditos pendientes</div>`}

    ${abonos.length ? `
    <div style="margin-top:14px;">
      <div style="font-weight:800;font-size:13px;margin-bottom:8px;color:var(--azul-m);">🏦 Historial de abonos</div>
      ${abonos.slice(-5).reverse().map(a=>`
        <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--azul-g);font-size:12.5px;">
          <div>
            <span style="font-weight:700;">${fmt(a.monto)}</span>
            <span style="color:var(--gris);margin-left:8px;">${fmtDate(a.fecha)}</span>
            ${a.medio==='transferencia'?`<span class="badge badge-blue" style="margin-left:6px;">📲 Transf.</span>`:''}
            ${a.foto?`<span class="badge badge-green" style="margin-left:6px;cursor:pointer;" onclick="verFoto('${a.foto}')">📷 Ver foto</span>`:''}
          </div>
        </div>`).join('')}
    </div>` : ''}
  </div>`);
};

window.abrirPagarTx = function(txId, hermanoId) {
  const tx = DB.getTx().find(t=>t.id===txId);
  if (!tx) return;
  openModal(`
  <div class="modal-header"><h3>💰 Registrar Pago</h3><button class="btn btn-ghost btn-sm" onclick="closeModal()">✕</button></div>
  <div class="modal-body">
    <div class="alert alert-info" style="margin-bottom:14px;">
      Total a pagar: <strong>${fmt(tx.total)}</strong>
    </div>
    ${compMedioPago('pay','efectivo')}
  </div>
  <div class="modal-footer">
    <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-success" onclick="ejecutarPagoTx('${txId}','${hermanoId}')">✅ Confirmar pago</button>
  </div>`);
  window._pagos['pay'] = 'efectivo';
};

window.ejecutarPagoTx = function(txId, hermanoId) {
  const medio = window._pagos['pay'] || 'efectivo';
  const foto  = window._fotos['pay'] || null;
  const ref   = el('pay_ref')?.value || '';
  DB.updateTx(txId, { pagado:true, fechaPago: new Date().toISOString(), medioPago:medio, fotoPago:foto, refPago:ref });
  closeAllModals();
  toast('Pago registrado ✓', 'success');
  renderCuentas();
};

window.pagarTodo = async function(hermanoId) {
  const ok = await confirmar('¿Registrar el pago de TODA la deuda de crédito?');
  if (!ok) return;
  openModal(`
  <div class="modal-header"><h3>💰 Medio de pago — Todo</h3><button class="btn btn-ghost btn-sm" onclick="closeModal()">✕</button></div>
  <div class="modal-body">${compMedioPago('paytodo','efectivo')}</div>
  <div class="modal-footer">
    <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-success" onclick="ejecutarPagarTodo(${hermanoId})">✅ Confirmar</button>
  </div>`);
  window._pagos['paytodo'] = 'efectivo';
};

window.ejecutarPagarTodo = function(hermanoId) {
  const medio = window._pagos['paytodo'] || 'efectivo';
  const foto  = window._fotos['paytodo'] || null;
  const ref   = el('paytodo_ref')?.value || '';
  DB.getTx().filter(t=>t.hermanoId===hermanoId&&!t.pagado&&t.modalidad==='credito')
    .forEach(t => DB.updateTx(t.id,{pagado:true,fechaPago:new Date().toISOString(),medioPago:medio,fotoPago:foto,refPago:ref}));
  closeAllModals();
  toast('Todos los créditos pagados ✓', 'success');
  renderCuentas();
};

window.enviarWaHermano = function(hermanoId) {
  const h = DB.getHermanos().find(x=>x.id===hermanoId);
  if (!h?.tel) { toast('Este hermano/a no tiene teléfono registrado','error'); return; }
  const txs = DB.getTx().filter(t=>t.hermanoId===hermanoId&&!t.pagado&&t.modalidad==='credito');
  const msg = generarResumenWA(h, txs);
  abrirWhatsApp(h.tel, msg);
};

window.verFoto = function(src) {
  openModal(`
  <div class="modal-header"><h3>📷 Comprobante</h3><button class="btn btn-ghost btn-sm" onclick="closeModal()">✕</button></div>
  <div class="modal-body" style="text-align:center;">
    <img src="${src}" style="max-width:100%;border-radius:10px;"/>
  </div>`);
};
