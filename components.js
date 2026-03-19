/* ═══════════════════════════════════════════
   COMPONENTS.JS — Componentes reutilizables
═══════════════════════════════════════════ */

// ── Selector de hermano con búsqueda ──
function compSelectorHermano(selId, onSelect, showSaldo=true) {
  const hermanos = DB.getHermanos();
  return `
  <div>
    <label class="label">Hermano / Hermana</label>
    <input class="input" id="${selId}_buscar" placeholder="🔍 Buscar nombre o documento..."
      oninput="filtrarHermanos('${selId}')" autocomplete="off"/>
    <div id="${selId}_lista" style="max-height:220px;overflow-y:auto;margin-top:8px;">
      ${hermanos.map(h => compHermanoRow(h, selId, showSaldo)).join('')}
    </div>
    <div id="${selId}_sel" style="display:none;"></div>
  </div>`;
}

function compHermanoRow(h, selId, showSaldo=true) {
  const saldoAbono = DB.getSaldoAbono(h.id);
  const deuda = DB.getDeudaCredito(h.id);
  let saldoHtml = '';
  if (showSaldo) {
    if (saldoAbono > 0)
      saldoHtml = `<div class="herm-saldo favor">Abono: ${fmt(saldoAbono)}</div>`;
    else if (deuda > 0)
      saldoHtml = `<div class="herm-saldo deuda">Debe: ${fmt(deuda)}</div>`;
    else
      saldoHtml = `<div class="herm-saldo cero">Al día ✓</div>`;
  }
  const tipoIcon = h.tipo==='hermana'?'👩':'h.tipo==="invitado"'?'👋':h.tipo==='nino'?'👦':'👨';
  return `
  <div class="herm-card" onclick="seleccionarHermano('${selId}','${h.id}')">
    <div class="herm-avatar">${iniciales(h.nombre)}</div>
    <div class="herm-info">
      <div class="hn">${h.nombre}</div>
      <div class="hi">${h.tipo==='hermana'?'Hermana':h.tipo==='invitado'?'Invitado/a':h.tipo==='nino'?'Niño/a':'Hermano'} · ${h.iglesia}</div>
    </div>
    ${saldoHtml}
  </div>`;
}

window.filtrarHermanos = function(selId) {
  const q = (el(selId+'_buscar').value||'').toLowerCase();
  const hermanos = DB.getHermanos();
  const filtrados = q ? hermanos.filter(h =>
    h.nombre.toLowerCase().includes(q) || (h.doc||'').includes(q) || (h.iglesia||'').toLowerCase().includes(q)
  ) : hermanos;
  render('#'+selId+'_lista', filtrados.map(h=>compHermanoRow(h,selId,true)).join('') || '<p style="color:var(--gris);text-align:center;padding:12px;font-size:13px;">Sin resultados</p>');
};

// ── Selector de modalidad de pago ──
function compModalidad(wrpId, selVal='inmediato') {
  return `
  <div>
    <label class="label">Modalidad de venta</label>
    <div class="modalidad-row" id="${wrpId}_mod">
      <div class="m-chip${selVal==='inmediato'?' sel-inmediato':''}" onclick="selMod('${wrpId}','inmediato')">
        💵 Pago inmediato
      </div>
      <div class="m-chip${selVal==='abono'?' sel-abono':''}" onclick="selMod('${wrpId}','abono')">
        🏦 Con abono
      </div>
      <div class="m-chip${selVal==='credito'?' sel-credito':''}" onclick="selMod('${wrpId}','credito')">
        📋 Crédito
      </div>
    </div>
    <div id="${wrpId}_mod_info" style="margin-top:6px;"></div>
  </div>`;
}

// ── Selector de medio de pago ──
function compMedioPago(wrpId, selVal='efectivo') {
  return `
  <div>
    <label class="label">Medio de pago</label>
    <div class="pago-row" id="${wrpId}_pago">
      <div class="p-chip${selVal==='efectivo'?' sel-efectivo':''}" onclick="selPago('${wrpId}','efectivo')">
        💵 Efectivo
      </div>
      <div class="p-chip${selVal==='transferencia'?' sel-transferencia':''}" onclick="selPago('${wrpId}','transferencia')">
        📲 Transferencia
      </div>
    </div>
    <div id="${wrpId}_pago_extra" style="margin-top:8px;"></div>
  </div>`;
}

// ── Chip helpers ──
window._modalidades = {};
window._pagos = {};
window._fotos = {};

window.selMod = function(wrpId, val) {
  window._modalidades[wrpId] = val;
  const row = el(wrpId+'_mod');
  if (!row) return;
  row.querySelectorAll('.m-chip').forEach(c => {
    c.className = 'm-chip';
    if (c.textContent.includes('inmediato') && val==='inmediato') c.className += ' sel-inmediato';
    if (c.textContent.includes('abono') && val==='abono') c.className += ' sel-abono';
    if (c.textContent.includes('Crédito') && val==='credito') c.className += ' sel-credito';
  });
  const info = el(wrpId+'_mod_info');
  if (!info) return;
  if (val==='credito') info.innerHTML = `<div class="alert alert-info" style="font-size:12px;">📋 Se registrará como deuda pendiente. El hermano/a paga al final del día o de la fiesta.</div>`;
  else if (val==='abono') {
    const hId = window._hermanoSel?.[wrpId];
    if (hId) {
      const sa = DB.getSaldoAbono(hId);
      info.innerHTML = `<div class="alert ${sa>0?'alert-success':'alert-warning'}" style="font-size:12px;">
        🏦 Saldo de abono disponible: <strong>${fmt(sa)}</strong>
        ${sa<=0?'<br>⚠️ No hay saldo. Primero debe hacer un abono.':''}
      </div>`;
    } else info.innerHTML = '';
  } else info.innerHTML = '';
};

window.selPago = function(wrpId, val) {
  window._pagos[wrpId] = val;
  const row = el(wrpId+'_pago');
  if (!row) return;
  row.querySelectorAll('.p-chip').forEach(c => {
    c.className = 'p-chip';
    if (c.textContent.includes('Efectivo') && val==='efectivo') c.className += ' sel-efectivo';
    if (c.textContent.includes('Transferencia') && val==='transferencia') c.className += ' sel-transferencia';
  });
  const extra = el(wrpId+'_pago_extra');
  if (!extra) return;
  if (val==='transferencia') {
    extra.innerHTML = `
      <div>
        <label class="label">N° de referencia / comprobante</label>
        <input class="input" id="${wrpId}_ref" placeholder="Número de referencia de la transferencia"/>
        <div class="photo-upload" style="margin-top:8px;" onclick="el('${wrpId}_foto_input').click()">
          <div id="${wrpId}_foto_preview">
            <span style="font-size:28px;">📷</span>
            <div style="font-size:13px;font-weight:700;color:var(--azul-m);margin-top:4px;">Toca para adjuntar foto / pantallazo</div>
            <div style="font-size:11px;color:var(--gris);">Opcional pero recomendado como respaldo</div>
          </div>
        </div>
        <input type="file" id="${wrpId}_foto_input" accept="image/*" capture="environment" style="display:none"
          onchange="cargarFoto('${wrpId}',this)"/>
      </div>`;
  } else extra.innerHTML = '';
};

window.cargarFoto = async function(wrpId, input) {
  if (!input.files?.[0]) return;
  const b64 = await fileToBase64(input.files[0]);
  window._fotos[wrpId] = b64;
  const prev = el(wrpId+'_foto_preview');
  if (prev) prev.innerHTML = `<img src="${b64}" style="max-width:100%;max-height:180px;border-radius:8px;"/>
    <div style="font-size:11px;color:var(--verde);font-weight:700;margin-top:4px;">✅ Foto adjuntada</div>`;
};

// ── Resumen de carrito ──
function compCarrito(items, totalLabel='Total') {
  if (!items.length) return `<p style="color:var(--gris);text-align:center;padding:16px;font-size:13px;">Sin items</p>`;
  return `
  ${items.map(i=>`
    <div class="cart-item">
      <div style="font-size:20px;flex-shrink:0;">${i.icono||'📦'}</div>
      <div class="cart-item-name">
        <div class="cn">${i.nombre}</div>
        <div class="cs">${fmt(i.precio)} × ${i.qty}</div>
      </div>
      <div style="font-weight:900;color:var(--azul-m);font-size:14px;">${fmt(i.precio*i.qty)}</div>
    </div>`).join('')}
  <div class="divider"></div>
  <div class="cart-total">
    <span>${totalLabel}</span>
    <span class="t-val">${fmt(items.reduce((s,i)=>s+i.precio*i.qty,0))}</span>
  </div>`;
}

// ── Abono panel ──
function compAbonoPanel(hermanoId) {
  const sa = DB.getSaldoAbono(hermanoId);
  const dc = DB.getDeudaCredito(hermanoId);
  const abonos = DB.getAbonos().filter(a=>a.hermanoId===hermanoId);
  const total = abonos.reduce((s,a)=>s+a.monto,0);
  const consumido = total - sa;
  const pct = total > 0 ? Math.min(100, Math.round(consumido/total*100)) : 0;
  return `
  <div>
    <div class="saldo-box ${sa>0?'favor':sa<0?'deuda':'neutro'}">
      <div>
        <div class="saldo-lbl">Saldo de abono</div>
        <div class="saldo-val" style="color:${sa>0?'var(--verde)':sa<0?'var(--rojo)':'var(--gris)'}">${fmt(sa)}</div>
      </div>
      <div style="text-align:right;">
        <div class="saldo-lbl">Crédito pendiente</div>
        <div class="saldo-val" style="color:${dc>0?'var(--rojo)':'var(--verde)'}">${dc>0?fmt(dc):'$0'}</div>
      </div>
    </div>
    ${total>0?`
    <div style="margin-top:8px;">
      <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700;color:var(--gris);margin-bottom:4px;">
        <span>Abonado: ${fmt(total)}</span><span>Consumido: ${fmt(consumido)}</span>
      </div>
      <div class="abono-bar-wrap">
        <div class="abono-bar" style="width:${pct}%;background:${sa>0?'var(--azul-m)':'var(--rojo)'}"></div>
      </div>
    </div>`:''}
  </div>`;
}

// ── Selector ──
window.seleccionarHermano = function(selId, hermanoId) {
  const h = DB.getHermanos().find(x=>x.id==hermanoId);
  if (!h) return;
  window._hermanoSel = window._hermanoSel || {};
  window._hermanoSel[selId] = hermanoId;
  const lista = el(selId+'_lista');
  const buscar = el(selId+'_buscar');
  const selDiv = el(selId+'_sel');
  if (lista) lista.style.display = 'none';
  if (buscar) buscar.style.display = 'none';
  if (selDiv) {
    selDiv.style.display = 'block';
    selDiv.innerHTML = `
      <div class="herm-card sel" style="cursor:default;">
        <div class="herm-avatar">${iniciales(h.nombre)}</div>
        <div class="herm-info">
          <div class="hn">${h.nombre}</div>
          <div class="hi">${h.tipo==='hermana'?'Hermana':h.tipo==='invitado'?'Invitado/a':h.tipo==='nino'?'Niño/a':'Hermano'} · ${h.iglesia}</div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="limpiarSelectorHermano('${selId}')">✕ Cambiar</button>
      </div>`;
  }
  // Actualizar info de abono si hay modalidad
  if (window._modalidades?.[selId] === 'abono') selMod(selId, 'abono');
  // Disparar callback
  if (typeof window['onHermanoSel_'+selId] === 'function') window['onHermanoSel_'+selId](h);
};

window.limpiarSelectorHermano = function(selId) {
  if (!window._hermanoSel) return;
  window._hermanoSel[selId] = null;
  const lista = el(selId+'_lista');
  const buscar = el(selId+'_buscar');
  const selDiv = el(selId+'_sel');
  if (lista) { lista.style.display=''; lista.innerHTML = DB.getHermanos().map(h=>compHermanoRow(h,selId,true)).join(''); }
  if (buscar) { buscar.style.display=''; buscar.value=''; }
  if (selDiv) selDiv.style.display='none';
};
