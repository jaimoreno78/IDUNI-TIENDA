/* ═══════════════════════════════════════════
   APP.JS — Núcleo de la aplicación IDUNI v2
═══════════════════════════════════════════ */

const App = {
  currentTab: 'inicio',

  init() {
    const cfg = DB.getConfig();
    if (!cfg) { renderSetup(); return; }
    this.renderShell();
    this.setTab('inicio');
    this.registerSW();
  },

  renderShell() {
    const cfg = DB.getConfig() || {};
    const evento = DB.getEvento();
    const evDef = evento ? EVENTOS_DEF.find(e=>e.tipo===evento.tipo) : null;
    const esFiesta = evento && evento.tipo !== 'sabado' && evento.tipo !== 'nueva_luna';

    const TABS_NORMAL = [
      {id:'inicio',    icon:'🏠', label:'Inicio'},
      {id:'venta',     icon:'🛒', label:'Tienda'},
      {id:'olla',      icon:'🍲', label:'Olla'},
      {id:'cuentas',   icon:'📋', label:'Cuentas'},
      {id:'historial', icon:'📜', label:'Historial'},
      {id:'productos', icon:'📦', label:'Productos'},
      {id:'hermanos',  icon:'👥', label:'Hermanos'},
      {id:'reportes',  icon:'📊', label:'Reportes'},
      {id:'config',    icon:'⚙️', label:'Config'},
    ];
    const TABS_FIESTA = [
      {id:'inicio',      icon:'🏠', label:'Inicio'},
      {id:'venta',       icon:'🛒', label:'Tienda'},
      {id:'olla',        icon:'🍲', label:'Olla'},
      {id:'pan',         icon:'🥖', label:'Panadería'},
      {id:'restaurante', icon:'🍽️', label:'Restaurante'},
      {id:'cuentas',     icon:'📋', label:'Cuentas'},
      {id:'historial',   icon:'📜', label:'Historial'},
      {id:'hermanos',    icon:'👥', label:'Hermanos'},
      {id:'reportes',    icon:'📊', label:'Reportes'},
      {id:'config',      icon:'⚙️', label:'Config'},
    ];

    const tabs = esFiesta ? TABS_FIESTA : TABS_NORMAL;

    document.getElementById('app').innerHTML = `
    <div id="header">
      <div class="header-top">
        <div class="logo-circle">✡️</div>
        <div class="header-title">
          <div class="name">${cfg.nombre || 'IDUNI'}</div>
          <div class="sub">${cfg.tipo==='campo'?'Campo Real':'Iglesia'} · ${cfg.ciudad||''}</div>
        </div>
        ${evento ? `
        <div class="header-evento">
          ${evDef?.icon} <span>${evento.label}</span>
          ${evento.diaActual?`<span class="dia">D${evento.diaActual}</span>`:''}
        </div>` : ''}
      </div>
      <div class="tabs-bar" id="tabs-bar">
        ${tabs.map(t=>`
          <button class="tab-btn${this.currentTab===t.id?' active':''}" id="tab_${t.id}"
            onclick="App.setTab('${t.id}')">
            ${t.icon} ${t.label}
          </button>`).join('')}
      </div>
    </div>
    <main id="main"></main>
    <div id="toast"></div>`;
  },

  setTab(tab) {
    this.currentTab = tab;
    // Actualizar clases de tabs
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const activeBtn = document.getElementById('tab_'+tab);
    if (activeBtn) { activeBtn.classList.add('active'); activeBtn.scrollIntoView({inline:'center',behavior:'smooth'}); }

    // Scroll al top
    window.scrollTo(0,0);
    document.getElementById('main')?.scrollTo(0,0);

    // Render de la página correspondiente
    switch(tab) {
      case 'inicio':      renderDashboard();    break;
      case 'venta':       renderVenta('tienda');break;
      case 'olla':        renderOlla();         break;
      case 'pan':         renderVenta('pan');   break;
      case 'restaurante': renderVenta('restaurante'); break;
      case 'cuentas':     renderCuentas();      break;
      case 'historial':   renderHistorial();    break;
      case 'productos':   renderProductos();    break;
      case 'hermanos':    renderHermanos();     break;
      case 'reportes':    renderReportes();     break;
      case 'config':      renderConfig();       break;
      default: renderDashboard();
    }
  },

  refreshHeader() {
    const cfg = DB.getConfig() || {};
    const evento = DB.getEvento();
    const evDef = evento ? EVENTOS_DEF.find(e=>e.tipo===evento.tipo) : null;
    const esFiesta = evento && evento.tipo !== 'sabado' && evento.tipo !== 'nueva_luna';

    // Reconstruir shell completo para actualizar tabs (fiesta vs normal)
    const cur = this.currentTab;
    this.renderShell();
    this.setTab(cur);
  },

  registerSW() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js')
        .then(() => console.log('SW registrado ✓'))
        .catch(e => console.warn('SW error:', e));
    }
  }
};

// ── Arrancar ──
window.addEventListener('DOMContentLoaded', () => App.init());

// ── Manejo del botón atrás en Android ──
window.addEventListener('popstate', () => {
  if (_modalStack.length) closeModal();
});
