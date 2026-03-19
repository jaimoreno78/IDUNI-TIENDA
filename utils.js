/* ═══════════════════════════════════════════
   UTILS.JS — Utilidades globales
═══════════════════════════════════════════ */

// ── Formato moneda COP ──
function fmt(n) {
  return new Intl.NumberFormat('es-CO', {style:'currency', currency:'COP', maximumFractionDigits:0}).format(n||0);
}
function fmtNum(n) {
  return new Intl.NumberFormat('es-CO').format(n||0);
}

// ── Formato fecha ──
function fmtDate(d, opts) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-CO', opts || {day:'2-digit', month:'short', year:'numeric'});
}
function fmtDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('es-CO', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'});
}
function hoy() {
  return new Date().toLocaleDateString('es-CO', {weekday:'long', day:'numeric', month:'long', year:'numeric'});
}
function isoHoy() {
  return new Date().toISOString().split('T')[0];
}

// ── ID único ──
function uid() { return Date.now() + Math.random().toString(36).slice(2, 7); }

// ── Iniciales ──
function iniciales(nombre) {
  if (!nombre) return '?';
  return nombre.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
}

// ── Toast ──
function toast(msg, type='success', dur=3200) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = '';
  const ico = document.createElement('span');
  ico.textContent = type==='success'?'✅': type==='error'?'❌': type==='warning'?'⚠️':'ℹ️';
  const txt = document.createElement('span');
  txt.textContent = msg;
  el.appendChild(ico); el.appendChild(txt);
  el.className = `show ${type}`;
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), dur);
}

// ── Modal ──
let _modalStack = [];
function openModal(html, opts={}) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal slide-up">${html}</div>`;
  if (opts.closeOnOverlay !== false) {
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  }
  document.body.appendChild(overlay);
  _modalStack.push(overlay);
  return overlay;
}
function closeModal() {
  const el = _modalStack.pop();
  if (el) el.remove();
}
function closeAllModals() {
  _modalStack.forEach(el => el.remove());
  _modalStack = [];
}

// ── Confirmación ──
function confirmar(msg) {
  return new Promise(res => {
    const ov = openModal(`
      <div class="modal-header"><h3>⚠️ Confirmar</h3></div>
      <div class="modal-body"><p style="font-size:15px;line-height:1.5;">${msg}</p></div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="closeModal();__confirmRes(false)">Cancelar</button>
        <button class="btn btn-danger" onclick="closeModal();__confirmRes(true)">Confirmar</button>
      </div>
    `);
    window.__confirmRes = res;
  });
}

// ── Render helper ──
function render(selector, html) {
  const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
  if (el) el.innerHTML = html;
}
function el(id) { return document.getElementById(id); }

// ── Foto a base64 ──
function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

// ── WhatsApp ──
function abrirWhatsApp(tel, msg) {
  const num = (tel||'').replace(/\D/g,'');
  const url = `https://wa.me/57${num}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

// ── Descargar texto ──
function descargarTexto(nombre, contenido) {
  const a = document.createElement('a');
  a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(contenido);
  a.download = nombre;
  a.click();
}

// ── Imprimir sección ──
function imprimir(html, titulo) {
  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html><head>
    <meta charset="UTF-8">
    <title>${titulo}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:20px;color:#111;}
      h1{color:#0d2a5e;margin-bottom:4px;} h2{color:#1a4fa8;}
      table{width:100%;border-collapse:collapse;font-size:13px;margin-top:10px;}
      th{background:#eaf3fd;color:#1a4fa8;padding:8px;text-align:left;border:1px solid #c8dff5;}
      td{padding:7px 8px;border:1px solid #e0e8f4;}
      .total{font-weight:bold;font-size:15px;} .footer{margin-top:20px;font-size:11px;color:#888;}
    </style>
  </head><body>${html}<div class="footer">Generado por IDUNI Sistema — ${new Date().toLocaleString('es-CO')}</div></body></html>`);
  w.document.close();
  setTimeout(() => { w.print(); }, 400);
}

// ── Generar resumen texto para WhatsApp ──
function generarResumenWA(hermano, txs, config) {
  const deuda = txs.filter(t=>!t.pagado).reduce((s,t)=>s+t.total,0);
  const lineas = txs.filter(t=>!t.pagado).map(t=>`  • ${t.tipo==='olla'?'Olla':t.tipo==='pan'?'Panadería':'Tienda'} ${fmtDate(t.fecha)} — ${fmt(t.total)}`).join('\n');
  const cfg = config || DB.getConfig() || {};
  return `🙏 Cordial saludo ${hermano.tipo==='hermana'?'Hermana':'Hermano'} *${hermano.nombre}*

Desde *${cfg.nombre||'IDUNI'}* (${cfg.ciudad||''}) le informamos su saldo pendiente:

${lineas||'Sin detalles'}

💰 *TOTAL A PAGAR: ${fmt(deuda)}*

Por favor acercarse a cancelar.
Gracias y bendiciones ✡️
_${cfg.nombre||'IDUNI'} — ${cfg.ciudad||''}_ `;
}
