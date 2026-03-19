/* ═══════════════════════════════════════════
   DB.JS — Capa de datos (localStorage)
   IDUNI v2
═══════════════════════════════════════════ */
const DB = {
  _get(k, def) {
    try { const v = localStorage.getItem('iduni_' + k); return v ? JSON.parse(v) : def; } catch { return def; }
  },
  _set(k, v) { try { localStorage.setItem('iduni_' + k, JSON.stringify(v)); } catch(e) { console.warn('DB save error', e); } },

  // ── Config de la Iglesia ──
  getConfig()   { return this._get('config', null); },
  setConfig(c)  { this._set('config', c); },

  // ── Evento activo ──
  getEvento()   { return this._get('evento', null); },
  setEvento(e)  { this._set('evento', e); },

  // ── Productos ──
  getProductos() { return this._get('productos', DATOS_INICIALES.productos); },
  setProductos(p){ this._set('productos', p); },

  // ── Hermanos ──
  getHermanos()  { return this._get('hermanos', DATOS_INICIALES.hermanos); },
  setHermanos(h) { this._set('hermanos', h); },

  // ── Iglesias/Sucursales ──
  getIglesias()  { return this._get('iglesias', DATOS_INICIALES.iglesias); },
  setIglesias(i) { this._set('iglesias', i); },

  // ── Transacciones (append-only) ──
  getTx()        { return this._get('transacciones', []); },
  addTx(tx)      { const all = this.getTx(); all.push(tx); this._set('transacciones', all); return tx; },
  updateTx(id, changes) {
    const all = this.getTx().map(t => t.id === id ? {...t, ...changes} : t);
    this._set('transacciones', all);
  },

  // ── Abonos ──
  getAbonos()    { return this._get('abonos', []); },
  addAbono(a)    { const all = this.getAbonos(); all.push(a); this._set('abonos', all); return a; },
  updateAbono(id, changes) {
    const all = this.getAbonos().map(a => a.id === id ? {...a, ...changes} : a);
    this._set('abonos', all);
  },

  // ── Precios Olla/Restaurante ──
  getPreciosOlla() { return this._get('precios_olla', DATOS_INICIALES.preciosOlla); },
  setPreciosOlla(p){ this._set('precios_olla', p); },

  // ── Precios Panadería ──
  getPreciosPan() { return this._get('precios_pan', DATOS_INICIALES.preciosPan); },
  setPreciosPan(p){ this._set('precios_pan', p); },

  // ── Saldo de hermano (crédito/abono) ──
  getSaldo(hermanoId) {
    // saldo > 0 = a favor (tiene crédito/abono), saldo < 0 = debe
    const abonos = this.getAbonos().filter(a => a.hermanoId === hermanoId);
    const saldoAbono = abonos.reduce((s, a) => s + (a.monto || 0), 0);
    const txs = this.getTx().filter(t => t.hermanoId === hermanoId && !t.pagado && t.modalidad !== 'inmediato');
    const deuda = txs.reduce((s, t) => s + t.total, 0);
    // Descontar pagos ya aplicados sobre abono
    const pagosAbono = this.getTx()
      .filter(t => t.hermanoId === hermanoId && t.pagado && t.medioPago === 'abono')
      .reduce((s, t) => s + t.total, 0);
    return Math.round(saldoAbono - pagosAbono - 0); // simplificado: el saldo real se calcula en utils
  },

  // Cálculo de saldo real de abono
  getSaldoAbono(hermanoId) {
    const abonos = this.getAbonos()
      .filter(a => a.hermanoId === hermanoId)
      .reduce((s, a) => s + a.monto, 0);
    const consumido = this.getTx()
      .filter(t => t.hermanoId === hermanoId && t.modalidad === 'abono')
      .reduce((s, t) => s + t.total, 0);
    return abonos - consumido;
  },

  // Deuda total de crédito pendiente
  getDeudaCredito(hermanoId) {
    return this.getTx()
      .filter(t => t.hermanoId === hermanoId && !t.pagado && t.modalidad === 'credito')
      .reduce((s, t) => s + t.total, 0);
  },

  // Exportar todo
  exportar() {
    return JSON.stringify({
      config: this.getConfig(),
      productos: this.getProductos(),
      hermanos: this.getHermanos(),
      iglesias: this.getIglesias(),
      transacciones: this.getTx(),
      abonos: this.getAbonos(),
      preciosOlla: this.getPreciosOlla(),
      preciosPan: this.getPreciosPan(),
      fechaExport: new Date().toISOString()
    }, null, 2);
  }
};

/* ─── Datos iniciales de ejemplo ──────────────────── */
const DATOS_INICIALES = {
  productos: [
    {id:1,nombre:"Biblia Reina Valera",marca:"Soc. Bíblica",tamano:"Mediana",categoria:"Libros",precio:85000,stock:20,icono:"📖"},
    {id:2,nombre:"Biblia de Estudio",marca:"Soc. Bíblica",tamano:"Grande",categoria:"Libros",precio:120000,stock:10,icono:"📖"},
    {id:3,nombre:"Cuaderno de Notas",marca:"Norma",tamano:"A5",categoria:"Papelería",precio:8000,stock:50,icono:"📓"},
    {id:4,nombre:"Lapicero Azul",marca:"Bic",tamano:"Estándar",categoria:"Papelería",precio:1500,stock:100,icono:"✏️"},
    {id:5,nombre:"CD Cánticos IDUNI",marca:"IDUNI",tamano:"Estándar",categoria:"Música",precio:15000,stock:30,icono:"💿"},
    {id:6,nombre:"Camiseta IDUNI",marca:"IDUNI",tamano:"M",categoria:"Ropa",precio:40000,stock:15,icono:"👕"},
    {id:7,nombre:"Agua Botella 500ml",marca:"Cristal",tamano:"500ml",categoria:"Alimentos",precio:2500,stock:60,icono:"💧"},
    {id:8,nombre:"Jugo en Caja",marca:"Hit",tamano:"200ml",categoria:"Alimentos",precio:2000,stock:48,icono:"🧃"},
  ],
  hermanos: [
    {id:1,nombre:"Juan Carlos Pérez",doc:"12345678",tel:"3001234567",correo:"juan@correo.com",iglesia:"Bogotá Central",tipo:"hermano"},
    {id:2,nombre:"María Esperanza López",doc:"87654321",tel:"3109876543",correo:"maria@correo.com",iglesia:"Medellín Norte",tipo:"hermana"},
    {id:3,nombre:"Pedro Antonio Gómez",doc:"11223344",tel:"3155551234",correo:"pedro@correo.com",iglesia:"Cali Sur",tipo:"hermano"},
  ],
  iglesias: ["Bogotá Central","Medellín Norte","Cali Sur","Barranquilla","Bucaramanga","Pereira","Manizales","Pasto","Ibagué","Cúcuta","Villavicencio","Acacías Meta","Florencia Caquetá"],
  preciosOlla: {
    desayunoAdulto: 8000,
    desayunoNino:   5000,
    almuerzoAdulto: 12000,
    almuerzoNino:   8000
  },
  preciosPan: [
    {id:1,nombre:"Pan Blanco",precio:1000,icono:"🍞"},
    {id:2,nombre:"Arepa",precio:1500,icono:"🫓"},
    {id:3,nombre:"Pandebono",precio:2000,icono:"🥐"},
    {id:4,nombre:"Empanada",precio:2500,icono:"🥟"},
    {id:5,nombre:"Café",precio:2000,icono:"☕"},
    {id:6,nombre:"Avena",precio:2500,icono:"🥛"},
    {id:7,nombre:"Aromática",precio:1500,icono:"🍵"},
    {id:8,nombre:"Jugo Natural",precio:3000,icono:"🥤"},
  ]
};

const EVENTOS_DEF = [
  {tipo:"sabado",    label:"Sábado",                 icon:"✡️",  color:"#1a4fa8", dias:1},
  {tipo:"nueva_luna",label:"Nueva Luna",              icon:"🌙",  color:"#6c3483", dias:1},
  {tipo:"pascua",    label:"Fiesta de la Pascua",     icon:"🌾",  color:"#c9842a", dias:8, mes:"Abril"},
  {tipo:"pentecostes",label:"Fiesta de Pentecostés",  icon:"🕊️", color:"#1e8449", dias:8, mes:"Junio"},
  {tipo:"cabanas",   label:"Fiesta de las Cabañas",   icon:"🏕️", color:"#8b3a3a", dias:8, mes:"Octubre"},
];

const TIPO_PERSONA = [
  {val:"hermano",  label:"Hermano",   icon:"🙏"},
  {val:"hermana",  label:"Hermana",   icon:"🙏"},
  {val:"invitado", label:"Invitado/a",icon:"👋"},
  {val:"nino",     label:"Niño/a",    icon:"👦"},
  {val:"general",  label:"General",   icon:"👤"},
];

const CATEGORIAS_PROD = ["Libros","Papelería","Música","Ropa","Alimentos","Higiene","Otros"];
