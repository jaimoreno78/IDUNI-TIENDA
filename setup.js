/* ═══════════════════════════════════════════
   SETUP.JS — Configuración inicial
═══════════════════════════════════════════ */
function renderSetup() {
  document.getElementById('app').innerHTML = `
  <div id="setup-screen">
    <div class="setup-card slide-up">
      <div class="setup-logo">
        <span class="star">✡️</span>
        <div class="title">IDUNI</div>
        <div class="sub">IGLESIA DE LA DOCTRINA UNIVERSAL DE ISRAEL</div>
        <div style="margin-top:8px;color:var(--gris);font-size:12px;">Sistema Integral de Tienda y Servicios</div>
      </div>

      <div style="background:var(--azul-g);border-radius:12px;padding:14px;margin-bottom:20px;">
        <div style="font-size:13px;color:var(--azul-m);font-weight:700;margin-bottom:4px;">👋 ¡Bienvenido!</div>
        <div style="font-size:12.5px;color:var(--gris);line-height:1.5;">
          Configura tu iglesia o campo real. Esta información aparecerá en todos los reportes.
          Solo se hace una vez.
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:14px;">
        <div class="form-group">
          <label class="label">Nombre de la Iglesia / Campo Real</label>
          <input class="input" id="s_nombre" placeholder="Ej: Iglesia IDUNI Acacías Meta" maxlength="80"/>
        </div>
        <div class="form-row cols-2">
          <div class="form-group">
            <label class="label">Departamento</label>
            <input class="input" id="s_dpto" placeholder="Ej: Meta"/>
          </div>
          <div class="form-group">
            <label class="label">Ciudad / Municipio</label>
            <input class="input" id="s_ciudad" placeholder="Ej: Acacías"/>
          </div>
        </div>
        <div class="form-group">
          <label class="label">Dirección (opcional)</label>
          <input class="input" id="s_dir" placeholder="Ej: Calle 5 # 10-20 Barrio Centro"/>
        </div>
        <div class="form-group">
          <label class="label">Teléfono de contacto (opcional)</label>
          <input class="input" id="s_tel" placeholder="3001234567" type="tel"/>
        </div>
        <div class="form-group">
          <label class="label">Tipo de lugar</label>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px;">
            <div class="chip sel" id="tipo_iglesia" onclick="selTipoLugar('iglesia')">🏛️ Iglesia</div>
            <div class="chip" id="tipo_campo" onclick="selTipoLugar('campo')">🌿 Campo Real</div>
          </div>
        </div>

        <button class="btn btn-primary btn-lg btn-block" onclick="guardarSetup()" style="margin-top:8px;">
          ✅ Comenzar a usar IDUNI
        </button>
      </div>

      <div style="margin-top:16px;text-align:center;font-size:11px;color:var(--gris);">
        Todos los datos se guardan de forma segura en este dispositivo.<br/>
        Esta aplicación funciona sin internet. 🔒
      </div>
    </div>
  </div>`;

  window._tipoLugar = 'iglesia';
}

window.selTipoLugar = function(tipo) {
  window._tipoLugar = tipo;
  ['iglesia','campo'].forEach(t => {
    const chip = el('tipo_'+t);
    if (chip) chip.className = 'chip' + (t===tipo?' sel':'');
  });
};

window.guardarSetup = function() {
  const nombre = (el('s_nombre').value||'').trim();
  const dpto   = (el('s_dpto').value||'').trim();
  const ciudad = (el('s_ciudad').value||'').trim();
  if (!nombre || !ciudad) { toast('Completa el nombre y la ciudad', 'error'); return; }
  DB.setConfig({
    nombre, dpto, ciudad,
    direccion: (el('s_dir').value||'').trim(),
    tel:       (el('s_tel').value||'').trim(),
    tipo:      window._tipoLugar || 'iglesia',
    fechaCreacion: new Date().toISOString()
  });
  toast('¡Configuración guardada! Bienvenido a IDUNI 🙏', 'success');
  setTimeout(() => App.init(), 800);
};
