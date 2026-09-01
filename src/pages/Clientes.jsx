import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom'; // 1. Importamos el hook para el modo oscuro
import { supabase } from '../supabaseClient';

const ADMIN_EMAILS = [
  'sebastianzunigavaldivia@gmail.com',
  'oliver.zuniga@gmail.com',
  'focaldevs@gmail.com',
  'respaldoestudiovaldivia@gmail.com'
];
const CLIENTES_ACCESS_EMAILS = [...ADMIN_EMAILS, 'alientechchile@gmail.com'];

const Clientes = ({ session }) => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pendientes'); // 'pendientes' o 'activos'

  // --- ESTADOS PARA BÚSQUEDA Y PAGINACIÓN ---
  const [searchTerm, setSearchTerm] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina] = useState(10);

  // --- OBTENER EL ESTADO DEL TEMA DESDE EL LAYOUT ---
  const { darkMode } = useOutletContext(); // 2. Extraemos darkMode

  const canAccessClientes = CLIENTES_ACCESS_EMAILS.includes(session?.user?.email?.toLowerCase());

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error("Error cargando clientes:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  // --- ACCIONES DE ADMINISTRADOR ---
  const handleAprobar = async (id, email) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: true })
        .eq('id', id);

      if (error) throw error;

      const cliente = clientes.find(c => c.id === id);
      const nombre = cliente?.full_name || '';

      try {
        const emailHtml = `
          <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #030712; padding: 25px; color: #ffffff; margin: 0;">
            <div style="max-width: 580px; margin: 0 auto; background-color: #070f24; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
              <div style="background-color: #000000; padding: 25px; text-align: center; border-bottom: 3px solid #e11d48;">
                <h1 style="color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 2px; font-weight: bold; text-transform: uppercase;">CHIP <span style="color: #e11d48;">TUNING</span></h1>
                <span style="color: #e11d48; font-size: 11px; font-weight: bold; letter-spacing: 1px; display: block; margin-top: 4px;">PORTAL DISTRIBUIDORES</span>
              </div>
              <div style="padding: 35px 30px; text-align: center;">
                <div style="width: 60px; height: 60px; border-radius: 50%; background-color: rgba(34,197,94,0.15); color: #22c55e; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; font-size: 30px;">✅</div>
                <h2 style="font-size: 18px; color: #ffffff; margin: 0 0 14px;">¡Tu cuenta fue aprobada!</h2>
                <p style="font-size: 14px; color: #94a3b8; line-height: 1.6; margin: 0;">
                  Hola${nombre ? ` <strong style="color:#ffffff;">${nombre}</strong>` : ''}, un administrador revisó tu solicitud y ya tienes acceso completo al Portal Distribuidores Chiptuning. Ya puedes iniciar sesión y comenzar a procesar tus archivos.
                </p>
                <div style="text-align: center; margin-top: 30px;">
                  <a href="https://chiptuning.cl/login" style="background-color: #e11d48; color: #ffffff; padding: 13px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 12px; display: inline-block; letter-spacing: 1px;">
                    INICIAR SESIÓN
                  </a>
                </div>
              </div>
              <div style="background-color: #02050d; padding: 15px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #1e293b;">
                Este es un mensaje automático generado por la plataforma Chiptuning.cl
              </div>
            </div>
          </div>
        `;

        await supabase.functions.invoke('swift-function', {
          body: {
            to: email,
            subject: '✅ Tu cuenta en Chiptuning fue aprobada',
            html: emailHtml
          }
        });
      } catch (emailError) {
        console.error("Error enviando correo de aprobación:", emailError);
      }

      alert(`✅ Cliente aprobado.`);
      fetchClientes();
    } catch (error) {
      alert("Error al aprobar: " + error.message);
    }
  };

  const handleEliminar = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este registro? Esta acción no se puede deshacer: se borrará por completo, incluyendo su acceso a la plataforma. Si vuelve a querer entrar, deberá registrarse y ser aprobado desde cero.")) {
      try {
        // El borrado real (perfil + registros vinculados + cuenta de Auth) requiere
        // la clave de servicio, así que corre en una función de servidor, no acá.
        const { data: { session: adminSession } } = await supabase.auth.getSession();
        const token = adminSession?.access_token;
        if (!token) throw new Error('No se pudo verificar tu sesión. Vuelve a iniciar sesión e intenta de nuevo.');

        const res = await fetch('/.netlify/functions/delete-client', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId: id }),
        });

        const result = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(result.error || 'No se pudo eliminar el registro.');
        }

        // Actualizamos el estado local de inmediato
        setClientes(prevClientes => prevClientes.filter(c => c.id !== id));
        alert("✅ Cliente eliminado por completo (perfil y acceso a la plataforma).");
      } catch (error) {
        alert("Error al eliminar: " + error.message);
      }
    }
  };

  // --- LÓGICA DE FILTRADO Y BÚSQUEDA ---
  const clientesFiltrados = clientes.filter(c => {
    const aprobado = c.is_approved === true;
    const cumpleTab = tab === 'pendientes' ? !aprobado : aprobado;
    
    if (!searchTerm.trim()) return cumpleTab;

    const searchLower = searchTerm.toLowerCase();

    const name = (c.full_name || '').toLowerCase();
    const lastName = (c.apellido || '').toLowerCase();
    const comp = (c.company || '').toLowerCase();
    const mail = (c.email || '').toLowerCase();
    
    const cumpleBusqueda = 
      name.includes(searchLower) ||
      lastName.includes(searchLower) ||
      comp.includes(searchLower) ||
      mail.includes(searchLower);
    
    return cumpleTab && cumpleBusqueda;
  }).sort((a, b) => (a.full_name || '').localeCompare(b.full_name || '', 'es', { sensitivity: 'base' }));

  // --- LÓGICA DE PAGINACIÓN ---
  const totalPaginas = Math.ceil(clientesFiltrados.length / itemsPorPagina);
  const indiceUltimo = paginaActual * itemsPorPagina;
  const indicePrimer = indiceUltimo - itemsPorPagina;
  const clientesPaginados = clientesFiltrados.slice(indicePrimer, indiceUltimo);

  // --- CONFIGURACIÓN DE STYLES COMPATIBLES CON MODO OSCURO/CLARO ---
  const styles = {
    container: { 
      flex: 1, 
      padding: '30px', 
      backgroundColor: darkMode ? '#0f172a' : '#f3f4f6', 
      minHeight: '100vh',
      transition: 'all 0.3s ease'
    },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' },
    tabContainer: { display: 'flex', gap: '10px', marginBottom: '20px' },
    tab: (active) => ({
      padding: '10px 20px', 
      cursor: 'pointer', 
      backgroundColor: active 
        ? (darkMode ? '#2563eb' : '#000000') 
        : (darkMode ? '#1e293b' : '#ddd'),
      color: active ? '#fff' : (darkMode ? '#94a3b8' : '#666'), 
      fontWeight: 'bold', 
      fontSize: '12px', 
      border: darkMode ? '1px solid #334155' : 'none',
      borderRadius: '4px', 
      textTransform: 'uppercase',
      transition: 'all 0.2s ease'
    }),
    searchBar: { 
      display: 'flex', 
      alignItems: 'center', 
      backgroundColor: darkMode ? '#1e293b' : 'white', 
      padding: '8px 15px', 
      borderRadius: '4px', 
      border: darkMode ? '1px solid #334155' : '1px solid #ddd', 
      width: '300px',
      transition: 'all 0.3s ease'
    },
    card: { 
      backgroundColor: darkMode ? '#1e293b' : 'white', 
      padding: '20px', 
      borderRadius: '4px', 
      boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.05)',
      color: darkMode ? '#ffffff' : '#333333',
      transition: 'all 0.3s ease'
    },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { 
      textAlign: 'left', 
      padding: '12px', 
      borderBottom: darkMode ? '2px solid #334155' : '2px solid #eee', 
      fontSize: '11px', 
      color: darkMode ? '#94a3b8' : '#888', 
      textTransform: 'uppercase' 
    },
    td: { 
      padding: '12px', 
      borderBottom: darkMode ? '1px solid #334155' : '1px solid #eee', 
      fontSize: '13px',
      color: darkMode ? '#e2e8f0' : '#333333'
    },
    btnApprove: { backgroundColor: '#22c55e', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px', marginRight: '5px' },
    btnReject: { backgroundColor: '#e11d48', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' },
    pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '30px' },
    pageBtn: (active) => ({ 
      padding: '8px 16px', 
      cursor: 'pointer', 
      backgroundColor: active ? '#e11d48' : (darkMode ? '#0f172a' : 'white'), 
      color: active ? 'white' : (darkMode ? '#94a3b8' : '#666'), 
      border: darkMode ? '1px solid #334155' : '1px solid #ddd', 
      borderRadius: '4px', 
      fontSize: '12px', 
      fontWeight: 'bold',
      transition: 'all 0.2s ease'
    })
  };

  if (!canAccessClientes) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', minHeight: '100vh', backgroundColor: darkMode ? '#0f172a' : '#f3f4f6', fontFamily: "'Inter', sans-serif" }}>
        <h2 style={{ color: darkMode ? '#f8fafc' : '#111' }}>Acceso denegado</h2>
        <p style={{ color: darkMode ? '#94a3b8' : '#666' }}>No tienes permisos para ver esta página.</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '20px', color: darkMode ? '#ffffff' : '#000000' }}>Gestión de Clientes</h2>
        
        {/* BUSCADOR */}
        <div style={styles.searchBar}>
          <span style={{ marginRight: '10px', color: darkMode ? '#94a3b8' : '#333' }}>🔍</span>
          <input 
            type="text" 
            placeholder="Buscar por nombre o empresa..." 
            style={{ 
              border: 'none', 
              outline: 'none', 
              width: '100%', 
              fontSize: '13px', 
              backgroundColor: 'transparent',
              color: darkMode ? '#ffffff' : '#000000'
            }}
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPaginaActual(1); }}
          />
        </div>
      </div>

      <div style={styles.tabContainer}>
        <button style={styles.tab(tab === 'pendientes')} onClick={() => { setTab('pendientes'); setPaginaActual(1); }}>
          Solicitudes ({clientes.filter(c => !c.is_approved).length})
        </button>
        <button style={styles.tab(tab === 'activos')} onClick={() => { setTab('activos'); setPaginaActual(1); }}>
          Clientes Activos ({clientes.filter(c => c.is_approved).length})
        </button>
      </div>

      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Nombre / Empresa</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Créditos</th>
              <th style={styles.th}>País / RUT</th>
              <th style={styles.th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientesPaginados.map((c) => (
              <tr key={c.id}>
                <td style={styles.td}>
                  <div style={{ fontWeight: 'bold' }}>{c.full_name} {c.apellido}</div>
                  <div style={{ fontSize: '11px', color: darkMode ? '#3b82f6' : '#1319CF', fontWeight: 'bold' }}>
                    {c.company || 'PARTICULAR'}
                  </div>
                </td>
                <td style={styles.td}>
                  <div>{c.email}</div>
                  <div style={{ fontSize: '11px', color: darkMode ? '#94a3b8' : '#888', fontStyle: c.phone ? 'normal' : 'italic' }}>
                    {c.phone || 'Sin número registrado'}
                  </div>
                </td>
                <td style={styles.td}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: darkMode ? '#4ade80' : '#333' }}>
                    {c.credits || 0}
                  </div>
                </td>
                <td style={styles.td}>
                  <div>{c.country}</div>
                  <div style={{ fontSize: '10px', color: darkMode ? '#64748b' : '#999' }}>{c.rut}</div>
                </td>
                <td style={styles.td}>
                  {tab === 'pendientes' ? (
                    <>
                      <button style={styles.btnApprove} onClick={() => handleAprobar(c.id, c.email)}>APROBAR</button>
                      <button style={styles.btnReject} onClick={() => handleEliminar(c.id)}>RECHAZAR</button>
                    </>
                  ) : (
                    <>
                      <button style={styles.btnReject} onClick={() => handleEliminar(c.id)}>ELIMINAR</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {loading && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: darkMode ? '#94a3b8' : '#666' }}>Cargando datos...</td></tr>}
            {!loading && clientesPaginados.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: darkMode ? '#64748b' : '#999' }}>No se encontraron resultados.</td></tr>}
          </tbody>
        </table>

        {/* PAGINACIÓN */}
        {totalPaginas > 1 && (
          <div style={styles.pagination}>
            <button 
              onClick={() => { setPaginaActual(p => Math.max(1, p - 1)); window.scrollTo(0,0); }} 
              disabled={paginaActual === 1} 
              style={{ ...styles.pageBtn(false), opacity: paginaActual === 1 ? 0.3 : 1 }}
            >
              ← ANTERIOR
            </button>
            {[...Array(totalPaginas).keys()].map(n => (
              <button 
                key={n + 1} 
                onClick={() => { setPaginaActual(n + 1); window.scrollTo(0,0); }} 
                style={styles.pageBtn(paginaActual === n + 1)}
              >
                {n + 1}
              </button>
            ))}
            <button 
              onClick={() => { setPaginaActual(p => Math.min(totalPaginas, p + 1)); window.scrollTo(0,0); }} 
              disabled={paginaActual === totalPaginas} 
              style={{ ...styles.pageBtn(false), opacity: paginaActual === totalPaginas ? 0.3 : 1 }}
            >
              SIGUIENTE →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Clientes;