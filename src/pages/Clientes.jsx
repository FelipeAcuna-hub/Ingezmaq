import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom'; // 1. Importamos el hook para el modo oscuro
import { supabase } from '../supabaseClient';

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
      alert(`✅ Cliente aprobado.`);
      fetchClientes();
    } catch (error) {
      alert("Error al aprobar: " + error.message);
    }
  };

  const handleEliminar = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este registro? Esta acción no se puede deshacer.")) {
      try {
        // Agregamos .select() para confirmar que devolvió el objeto borrado
        const { data, error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', id)
          .select();
  
        if (error) throw error;
  
        // Si data está vacío, significa que RLS o una Foreign Key bloqué la eliminación
        if (!data || data.length === 0) {
          alert("⚠️ No se pudo eliminar el registro. Verifica los permisos RLS en Supabase o si el usuario tiene registros vinculados (tickets, archivos, etc.).");
          return;
        }
  
        // Actualizamos el estado local de inmediato
        setClientes(prevClientes => prevClientes.filter(c => c.id !== id));
        alert("✅ Registro eliminado correctamente.");
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
  });

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
                <td style={styles.td}>{c.email}</td>
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