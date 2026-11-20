import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { REGIONES_CHILE, COMUNAS_CHILE } from '../utils/comunasChile';

const CAMPOS_FACTURA = [
  { campo: 'razon_social', etiqueta: 'Razón social', placeholder: 'Nombre legal de la empresa' },
  { campo: 'rut_facturacion', etiqueta: 'RUT de la empresa', placeholder: '76.123.456-0' },
  { campo: 'giro', etiqueta: 'Giro', placeholder: 'Giro registrado en el SII' },
  { campo: 'direccion_comercial', etiqueta: 'Dirección comercial', placeholder: 'Calle y número' },
  { campo: 'comuna', etiqueta: 'Comuna', placeholder: 'Selecciona la comuna', selectorComunas: true },
  { campo: 'ciudad', etiqueta: 'Ciudad', placeholder: 'Selecciona la ciudad', selectorComunas: true },
  { campo: 'correo_facturacion', etiqueta: 'Correo para recibir facturas', placeholder: 'facturas@empresa.cl', type: 'email' }
];

// Valida el dígito verificador de un RUT chileno, con o sin puntos y guion.
const rutValido = (rut) => {
  const limpio = rut.replace(/[.\-\s]/g, '').toUpperCase();
  if (!/^\d{7,8}[\dK]$/.test(limpio)) return false;

  let suma = 0;
  let multiplicador = 2;
  for (let i = limpio.length - 2; i >= 0; i--) {
    suma += Number(limpio[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }

  const resto = 11 - (suma % 11);
  const digito = resto === 11 ? '0' : resto === 10 ? 'K' : String(resto);
  return digito === limpio.slice(-1);
};

const Perfil = ({ session }) => {
  const [loading, setLoading] = useState(false);
  
  // --- OBTENER EL ESTADO DEL TEMA DESDE EL LAYOUT ---
  const { darkMode } = useOutletContext(); // 2. Extraemos darkMode del contexto

  // --- ESTADOS UNIFICADOS PARA CONTRASEÑA ---
  const [newPassword, setNewPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const [profile, setProfile] = useState({
    full_name: '',
    apellido: '',
    phone: '',
    company: '',
    rut: '',
    actividad: '',
    country: 'Chile',
    fecha_nacimiento: '',
    credits: 0,
    tipo_documento: 'boleta',
    ...Object.fromEntries(CAMPOS_FACTURA.map(({ campo }) => [campo, '']))
  });

  const [pestana, setPestana] = useState('personal');
  const [misArchivos, setMisArchivos] = useState([]);
  const [cargandoArchivos, setCargandoArchivos] = useState(true);

  // Los datos de factura se piden según las reglas de Chile (RUT, giro, comuna).
  const esChile = profile.country === 'Chile';
  const pideFactura = esChile && profile.tipo_documento === 'factura';

  // Solicitudes del propio cliente para la pestaña Archivos (también si quien
  // mira su perfil es un admin: siempre se filtra por su propio id).
  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;
    supabase
      .from('archivos')
      .select('id, numero_orden, patente, marca_modelo, estado, created_at, detalles_tecnicos')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error('Error cargando archivos del perfil:', error.message);
        setMisArchivos(data || []);
        setCargandoArchivos(false);
      });
  }, [session?.user?.id]);

  useEffect(() => {
    const getProfile = async () => {
      let userId = session?.user?.id;
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id;
      }
      if (!userId) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (data) {
          setProfile({
            full_name: data.full_name || '',
            apellido: data.apellido || '',
            phone: data.phone || '',
            company: data.company || '',
            rut: data.rut || '',
            actividad: data.actividad || '',
            country: data.country || 'Chile',
            fecha_nacimiento: data.fecha_nacimiento || '',
            credits: data.credits || 0,
            tipo_documento: data.tipo_documento || 'boleta',
            ...Object.fromEntries(CAMPOS_FACTURA.map(({ campo }) => [campo, data[campo] || '']))
          });
        }
      } catch (error) {
        console.error('Error cargando perfil:', error.message);
      }
    };

    getProfile();
  }, [session]);

  // --- FUNCIÓN PARA CAMBIAR CONTRASEÑA ---
  const handlePasswordChange = async () => {
    if (!newPassword || newPassword.length < 6) {
      alert("Por favor, escribe una nueva contraseña de al menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
      alert("✅ ¡Contraseña actualizada con éxito!");
      setNewPassword(""); 
    } catch (error) {
      alert("Error al cambiar contraseña: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    let userId = session?.user?.id;
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
    }

    if (!userId) {
      alert('Error: No se pudo identificar al usuario.');
      return;
    }

    const datosFactura = Object.fromEntries(CAMPOS_FACTURA.map(({ campo }) => [campo, profile[campo].trim()]));

    if (pideFactura) {
      const faltantes = CAMPOS_FACTURA.filter(({ campo }) => !datosFactura[campo]);
      if (faltantes.length > 0) {
        setPestana('facturacion');
        alert('Para recibir factura completa estos datos: ' + faltantes.map(c => c.etiqueta).join(', ') + '.');
        return;
      }
      if (!rutValido(datosFactura.rut_facturacion)) {
        setPestana('facturacion');
        alert('El RUT de la empresa no es válido. Revisa los números y el dígito verificador.');
        return;
      }
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: userId,
        ...profile,
        ...datosFactura,
        fecha_nacimiento: profile.fecha_nacimiento || null,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      alert('✅ ¡Perfil actualizado correctamente!');
    } catch (error) {
      alert('Error al actualizar: ' + (error.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  // --- PALETA DE COLORES DINÁMICA ---
  const styles = {
    mainContent: { 
      flex: 1, 
      padding: '0', 
      backgroundColor: darkMode ? '#0f172a' : '#f3f4f6', // Gris claro o azul slate oscuro
      minHeight: '100vh',
      transition: 'all 0.3s ease'
    },
    formCard: { 
      backgroundColor: darkMode ? '#1e293b' : 'white', // Tarjeta clara o azul oscuro
      margin: '30px', 
      padding: '40px', 
      borderRadius: '4px', 
      boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.05)',
      transition: 'all 0.3s ease'
    },
    sectionTitle: { 
      fontSize: '18px', 
      fontWeight: 'bold', 
      marginBottom: '25px', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '10px', 
      color: darkMode ? '#f8fafc' : '#333', // Texto principal blanco o negro
      borderBottom: darkMode ? '1px solid #334155' : '1px solid #e2e8f0',
      paddingBottom: '8px'
    },
    inputGroup: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' },
    label: { 
      display: 'block', 
      fontSize: '11px', 
      fontWeight: 'bold', 
      color: darkMode ? '#94a3b8' : '#333', // Etiquetas grises claras o negras
      marginBottom: '8px', 
      textTransform: 'uppercase' 
    },
    input: { 
      width: '100%', 
      padding: '12px', 
      border: darkMode ? '1px solid #475569' : '1px solid #ddd', 
      backgroundColor: darkMode ? '#0f172a' : '#ffffff', // Fondo de inputs
      color: darkMode ? '#ffffff' : '#000000', // Texto de inputs
      borderRadius: '4px', 
      fontSize: '14px', 
      boxSizing: 'border-box', 
      outline: 'none',
      transition: 'all 0.2s ease'
    },
    inputWarning: {
      width: '100%',
      padding: '12px',
      border: '1px solid #f59e0b',
      backgroundColor: darkMode ? 'rgba(245, 158, 11, 0.1)' : '#fffbeb',
      color: darkMode ? '#ffffff' : '#000000',
      borderRadius: '4px',
      fontSize: '14px',
      boxSizing: 'border-box',
      outline: 'none',
      transition: 'all 0.2s ease'
    },
    warningText: {
      margin: '6px 0 0',
      fontSize: '11px',
      fontWeight: 600,
      color: '#f59e0b'
    },
    tabBar: {
      display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '30px',
      borderBottom: darkMode ? '1px solid #334155' : '1px solid #e2e8f0', paddingBottom: '12px'
    },
    tab: (activa) => ({
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '10px 18px', borderRadius: '4px', cursor: 'pointer',
      fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase',
      border: darkMode ? '1px solid #334155' : '1px solid #ddd',
      backgroundColor: activa ? (darkMode ? '#2563eb' : '#000000') : (darkMode ? '#0f172a' : '#ffffff'),
      color: activa ? '#ffffff' : (darkMode ? '#94a3b8' : '#555555'),
      transition: 'all 0.2s ease'
    }),
    tabBadge: (activa) => ({
      fontSize: '11px', padding: '1px 8px', borderRadius: '999px',
      backgroundColor: activa ? 'rgba(255,255,255,0.25)' : (darkMode ? '#334155' : '#e2e8f0'),
      color: activa ? '#ffffff' : (darkMode ? '#e2e8f0' : '#333333')
    }),
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '30px' },
    statCard: {
      padding: '18px', borderRadius: '6px', textAlign: 'center',
      border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0',
      backgroundColor: darkMode ? '#0f172a' : '#fafafa'
    },
    datoArchivo: { fontSize: '14px', fontWeight: 600, color: darkMode ? '#ffffff' : '#000000' },
    textoSuave: { fontSize: '14px', color: darkMode ? '#94a3b8' : '#666666' },
    th: {
      textAlign: 'left', padding: '10px', fontSize: '11px', textTransform: 'uppercase',
      color: darkMode ? '#94a3b8' : '#888888', borderBottom: darkMode ? '2px solid #334155' : '2px solid #eeeeee'
    },
    td: {
      padding: '10px', color: darkMode ? '#e2e8f0' : '#333333',
      borderBottom: darkMode ? '1px solid #334155' : '1px solid #eeeeee'
    },
    submitBtn: {
      backgroundColor: darkMode ? '#2563eb' : '#000000', // Botón principal azul o negro
      color: 'white', 
      border: 'none', 
      padding: '15px 40px', 
      fontWeight: 'bold', 
      cursor: 'pointer', 
      borderRadius: '4px', 
      textTransform: 'uppercase', 
      fontSize: '13px', 
      opacity: loading ? 0.7 : 1,
      transition: 'all 0.2s ease'
    }
  };

  const PESTANAS = [
    { id: 'personal', etiqueta: '👤 Información personal' },
    { id: 'facturacion', etiqueta: '📄 Facturación' },
    { id: 'archivos', etiqueta: '📁 Archivos' }
  ];

  const ESTADOS_ARCHIVO = [
    { estado: 'completado', etiqueta: 'Completados', color: '#22c55e' },
    { estado: 'en gestión', etiqueta: 'En gestión', color: '#2563eb' },
    { estado: 'pendiente', etiqueta: 'Pendientes', color: '#f59e0b' }
  ];

  const renderPestanaArchivos = () => {
    if (cargandoArchivos) {
      return <p style={styles.textoSuave}>Cargando tus archivos...</p>;
    }
    if (misArchivos.length === 0) {
      return (
        <p style={styles.textoSuave}>
          Todavía no has enviado archivos. <Link to="/upload" style={{ color: '#2563eb', fontWeight: 'bold' }}>Sube tu primer archivo</Link>.
        </p>
      );
    }

    const creditosUsados = misArchivos.reduce((suma, a) => suma + (Number(a.detalles_tecnicos?.costo_creditos) || 0), 0);
    const conteoServicios = {};
    misArchivos.forEach(a => {
      const servicio = a.detalles_tecnicos?.servicios_solicitados;
      if (servicio) conteoServicios[servicio] = (conteoServicios[servicio] || 0) + 1;
    });
    const servicioFrecuente = Object.entries(conteoServicios).sort((x, y) => y[1] - x[1])[0];
    const colorEstado = (estado) => ESTADOS_ARCHIVO.find(e => e.estado === estado)?.color || '#94a3b8';

    const tarjetas = [
      { etiqueta: 'Archivos enviados', valor: misArchivos.length, color: darkMode ? '#ffffff' : '#000000' },
      ...ESTADOS_ARCHIVO.map(e => ({ etiqueta: e.etiqueta, valor: misArchivos.filter(a => a.estado === e.estado).length, color: e.color })),
      { etiqueta: 'Créditos usados', valor: creditosUsados, color: darkMode ? '#ffffff' : '#000000' }
    ];

    return (
      <>
        <div style={styles.sectionTitle}>📊 RESUMEN DE TUS ARCHIVOS</div>
        <div style={styles.statsGrid}>
          {tarjetas.map(({ etiqueta, valor, color }) => (
            <div key={etiqueta} style={styles.statCard}>
              <div style={{ fontSize: '26px', fontWeight: 800, color }}>{valor}</div>
              <div style={styles.label}>{etiqueta}</div>
            </div>
          ))}
        </div>

        <div style={{ ...styles.inputGroup, marginBottom: '30px' }}>
          <div>
            <div style={styles.label}>Último archivo enviado</div>
            <div style={styles.datoArchivo}>{new Date(misArchivos[0].created_at).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' })}</div>
          </div>
          <div>
            <div style={styles.label}>Servicio más solicitado</div>
            <div style={styles.datoArchivo}>{servicioFrecuente ? `${servicioFrecuente[0]} (${servicioFrecuente[1]})` : '—'}</div>
          </div>
        </div>

        <div style={styles.sectionTitle}>🕒 ÚLTIMOS ARCHIVOS</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr>
                {['N° Orden', 'Fecha', 'Patente', 'Vehículo', 'Servicio', 'Estado'].map(col => (
                  <th key={col} style={styles.th}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {misArchivos.slice(0, 5).map(a => (
                <tr key={a.id}>
                  <td style={{ ...styles.td, fontWeight: 'bold', color: '#2563eb' }}>#{a.numero_orden || '---'}</td>
                  <td style={styles.td}>{new Date(a.created_at).toLocaleDateString('es-CL')}</td>
                  <td style={styles.td}>{a.patente || '—'}</td>
                  <td style={styles.td}>{a.marca_modelo || '—'}</td>
                  <td style={styles.td}>{a.detalles_tecnicos?.servicios_solicitados || '—'}</td>
                  <td style={styles.td}>
                    <span style={{ color: colorEstado(a.estado), fontWeight: 'bold', textTransform: 'uppercase', fontSize: '11px' }}>{a.estado || '—'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: '16px', textAlign: 'right' }}>
          <Link to="/archivos" style={{ color: '#2563eb', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase' }}>
            Ver todos mis archivos →
          </Link>
        </div>
      </>
    );
  };

  // Safari ignora el relleno de los <select> nativos y los dibuja más bajos que
  // los campos de texto: se les da la misma altura y una flecha propia.
  const estiloSelector = (base) => ({
    ...base,
    height: '46px',
    paddingRight: '38px',
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    cursor: 'pointer',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='${darkMode ? '%2394a3b8' : '%23555555'}' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 14px center'
  });

  return (
    <div style={styles.mainContent}>
      <form onSubmit={handleUpdate} style={styles.formCard}>
        <div style={styles.tabBar}>
          {PESTANAS.map(({ id, etiqueta }) => (
            <button key={id} type="button" style={styles.tab(pestana === id)} onClick={() => setPestana(id)}>
              {etiqueta}
              {id === 'archivos' && !cargandoArchivos && (
                <span style={styles.tabBadge(pestana === id)}>{misArchivos.length}</span>
              )}
            </button>
          ))}
        </div>

        {pestana === 'personal' && (
          <>
            <div style={styles.sectionTitle}>👤 INFORMACIÓN PERSONAL</div>
            <div style={styles.inputGroup}>
              <div>
                <label style={styles.label}>NOMBRE</label>
                <input
                  style={styles.input}
                  type="text"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                />
              </div>
              <div>
                <label style={styles.label}>APELLIDO</label>
                <input
                  style={styles.input}
                  type="text"
                  value={profile.apellido}
                  onChange={(e) => setProfile({ ...profile, apellido: e.target.value })}
                />
              </div>
              <div>
                <label style={styles.label}>TELÉFONO</label>
                <input
                  style={styles.input}
                  type="text"
                  placeholder="+56 9 ..."
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
              </div>
              <div>
                <label style={styles.label}>FECHA DE CUMPLEAÑOS</label>
                <input
                  style={profile.fecha_nacimiento ? styles.input : styles.inputWarning}
                  type="date"
                  value={profile.fecha_nacimiento}
                  onChange={(e) => setProfile({ ...profile, fecha_nacimiento: e.target.value })}
                />
                {!profile.fecha_nacimiento && (
                  <p style={styles.warningText}>⚠️ Falta completar este campo.</p>
                )}
              </div>
            </div>

            <div style={styles.sectionTitle}>🔑 ACCESO</div>
            <div style={styles.inputGroup}>
              <div>
                <label style={styles.label}>E-MAIL</label>
                <input
                  style={{ 
                    ...styles.input, 
                    backgroundColor: darkMode ? '#1e293b' : '#f9f9f9', // Campo bloqueado más opaco
                    borderColor: darkMode ? '#334155' : '#ddd',
                    color: darkMode ? '#64748b' : '#666'
                  }}
                  type="email"
                  value={session?.user?.email}
                  disabled
                />
              </div>

              <div>
                <label style={styles.label}>NUEVA CONTRASEÑA</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    style={{ ...styles.input, paddingRight: '40px' }}
                    type={mostrarPassword ? "text" : "password"}
                    placeholder="Escribe tu nueva clave"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '16px',
                      padding: '5px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: darkMode ? '#94a3b8' : '#333'
                    }}
                  >
                    {mostrarPassword ? '🔒' : '👁️'}
                  </button>
                </div>

                <p
                  onClick={handlePasswordChange}
                  style={{
                    fontSize: '11px',
                    color: '#e11d48',
                    cursor: 'pointer',
                    marginTop: '8px',
                    fontWeight: 'bold',
                    display: 'inline-block'
                  }}
                >
                  {loading ? 'Procesando...' : 'Aplicar cambio de contraseña'}
                </p>
              </div>
            </div>

          </>
        )}

        {pestana === 'facturacion' && (
          <>
            <div style={styles.sectionTitle}>📄 INFORMACIÓN DE FACTURACIÓN</div>
            <div style={styles.inputGroup}>
              <div>
                <label style={styles.label}>COMPAÑÍA</label>
                <input style={styles.input} type="text" placeholder="Nombre de tu taller" value={profile.company} onChange={(e) => setProfile({ ...profile, company: e.target.value })} />
              </div>
              <div>
                <label style={styles.label}>RUT / VAT</label>
                <input style={styles.input} type="text" placeholder="12.345.678-9" value={profile.rut} onChange={(e) => setProfile({ ...profile, rut: e.target.value })} />
              </div>
              <div>
                <label style={styles.label}>ACTIVIDAD</label>
                <input style={styles.input} type="text" placeholder="Giro comercial" value={profile.actividad} onChange={(e) => setProfile({ ...profile, actividad: e.target.value })} />
              </div>
              <div>
                <label style={styles.label}>PAÍS</label>
                <select style={estiloSelector(styles.input)} value={profile.country} onChange={(e) => setProfile({ ...profile, country: e.target.value })}>
                  <option value="Chile">Chile</option>
                  <option value="Argentina">Argentina</option>
                  <option value="Peru">Perú</option>
                </select>
              </div>
            </div>

            {esChile && (
              <>
                <div style={styles.sectionTitle}>🧾 DOCUMENTO TRIBUTARIO</div>
                <div style={styles.inputGroup}>
                  <div>
                    <label style={styles.label}>TIPO DE DOCUMENTO</label>
                    <select
                      style={estiloSelector(styles.input)}
                      value={profile.tipo_documento}
                      onChange={(e) => setProfile({ ...profile, tipo_documento: e.target.value })}
                    >
                      <option value="boleta">Boleta</option>
                      <option value="factura">Factura</option>
                    </select>
                  </div>
                  {pideFactura && CAMPOS_FACTURA.map(({ campo, etiqueta, placeholder, type, selectorComunas }) => (
                    <div key={campo}>
                      <label style={styles.label}>{etiqueta}</label>
                      {selectorComunas ? (
                        <select
                          style={estiloSelector(profile[campo].trim() ? styles.input : styles.inputWarning)}
                          value={profile[campo]}
                          onChange={(e) => setProfile({ ...profile, [campo]: e.target.value })}
                        >
                          <option value="">{placeholder}</option>
                          {/* Un valor escrito a mano antes de existir esta lista no se pierde. */}
                          {profile[campo] && !COMUNAS_CHILE.includes(profile[campo]) && (
                            <option value={profile[campo]}>{profile[campo]}</option>
                          )}
                          {REGIONES_CHILE.map(({ region, comunas }) => (
                            <optgroup key={region} label={region}>
                              {comunas.map(comuna => <option key={comuna} value={comuna}>{comuna}</option>)}
                            </optgroup>
                          ))}
                        </select>
                      ) : (
                        <input
                          style={profile[campo].trim() ? styles.input : styles.inputWarning}
                          type={type || 'text'}
                          placeholder={placeholder}
                          value={profile[campo]}
                          onChange={(e) => setProfile({ ...profile, [campo]: e.target.value })}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

          </>
        )}

        {pestana === 'archivos' && renderPestanaArchivos()}

        {pestana !== 'archivos' && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button type="submit" disabled={loading} style={styles.submitBtn}>
                {loading ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
              </button>
            </div>
        )}
      </form>
    </div>
  );
};

export default Perfil;