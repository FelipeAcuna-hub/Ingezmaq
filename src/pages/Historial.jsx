import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const Historial = ({ session }) => {
  const [movimientos, setMovimientos] = useState([]);
  const [canjes, setCanjes] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- ESTADOS DE PAGINACIÓN ---
  const [pagMovimientos, setPagMovimientos] = useState(1);
  const [pagCanjes, setPagCanjes] = useState(1);
  const itemsPorPagina = 4;

  const ADMIN_EMAILS = [
    'sebastianzunigavaldivia@gmail.com',
    'oliver.zuniga@gmail.com',
    'focaldevs@gmail.com'
  ];

  const isAdmin =
    session?.user?.user_metadata?.role === 'admin' ||
    ADMIN_EMAILS.includes(session?.user?.email?.toLowerCase());

  // --- FUNCIÓN DE CARGA DE DATOS COMPLETA ---
  // CAMBIO: Dependencias optimizadas para evitar re-creaciones de la función// --- FUNCIÓN DE CARGA DE DATOS COMPLETA REESTRUCTURADA ---
  const fetchDatos = useCallback(async () => {
    try {
      setLoading(true);
      if (!session?.user?.id) return;

      console.log("Cargando historial unificado desde movimientos...");

      // 1. CARGAMOS TODO DESDE LA ÚNICA TABLA REAL: movimientos
      let query = supabase
        .from('movimientos')
        .select('*, profiles:user_id(company)')
        .order('created_at', { ascending: false });

      if (!isAdmin) {
        query = query.eq('user_id', session?.user?.id);
      }

      const { data: todosLosMovimientos, error: errorMovs } = await query;
      if (errorMovs) throw errorMovs;

      // 2. SEPARAMOS EN TU ESTADO LOCAL SEGÚN EL TIPO DE OPERACIÓN
      // Las recargas/abonos van a la Sección 1
      const recargas = todosLosMovimientos.filter(m => m.tipo === 'carga');
      
      // Los canjes/descuentos van a la Sección 2 (Soportando 'canje' o 'gasto')
      const consumos = todosLosMovimientos.filter(m => m.tipo === 'canje' || m.tipo === 'gasto');

      setMovimientos(recargas);
      setCanjes(consumos);

    } catch (error) {
      console.error("Error cargando historial:", error.message);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, isAdmin]); // CAMBIO: Dependemos del ID, no del objeto session entero

  // CAMBIO: useEffect ahora solo se dispara cuando el ID de usuario cambia realmente
  useEffect(() => {
    if (session?.user?.id) {
      fetchDatos();
    }
  }, [session?.user?.id, fetchDatos]); 

  // --- LÓGICA DE CÁLCULO DE PÁGINAS ---
  const totalPagMovs = Math.ceil(movimientos.length / itemsPorPagina);
  const movsPaginados = movimientos.slice((pagMovimientos - 1) * itemsPorPagina, pagMovimientos * itemsPorPagina);

  const totalPagCanjes = Math.ceil(canjes.length / itemsPorPagina);
  const canjesPaginados = canjes.slice((pagCanjes - 1) * itemsPorPagina, pagCanjes * itemsPorPagina);

  const styles = {
    mainContent: { flex: 1, padding: '0', backgroundColor: '#f3f4f6', minHeight: '100vh' },
    card: { backgroundColor: 'white', margin: '30px', padding: '40px', borderRadius: '4px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', minHeight: '200px' },
    headerFlex: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '2px solid #e11d48', paddingBottom: '10px' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '15px 12px', borderBottom: '2px solid #eee', fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' },
    td: { padding: '15px 12px', borderBottom: '1px solid #eee', fontSize: '14px', color: '#333' },
    tituloSeccion: { fontSize: '18px', margin: 0, textTransform: 'uppercase', color: '#000', fontWeight: 'bold' },
    refreshBtn: { backgroundColor: '#000', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', transition: 'opacity 0.2s' },
    companyText: { color: '#e11d48', fontWeight: 'bold', fontSize: '12px' },
    adminBadge: { backgroundColor: '#f9f9f9', padding: '4px 8px', borderRadius: '3px', fontSize: '11px', color: '#666', border: '1px solid #eee', fontStyle: 'italic' },
    pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '25px' },
    pageBtn: (active) => ({
      padding: '6px 12px',
      cursor: 'pointer',
      backgroundColor: active ? '#e11d48' : 'white',
      color: active ? 'white' : '#666',
      border: '1px solid #ddd',
      borderRadius: '2px',
      fontSize: '12px',
      fontWeight: 'bold',
      transition: 'all 0.2s'
    })
  };

  const renderPagination = (current, total, setPage) => (
    total > 1 && (
      <div style={styles.pagination}>
        <button 
          onClick={() => setPage(p => Math.max(1, p - 1))} 
          disabled={current === 1}
          style={{ ...styles.pageBtn(false), opacity: current === 1 ? 0.3 : 1 }}
        >
          Anterior
        </button>
        {[...Array(total).keys()].map(n => (
          <button key={n+1} onClick={() => setPage(n+1)} style={styles.pageBtn(current === n+1)}>
            {n+1}
          </button>
        ))}
        <button 
          onClick={() => setPage(p => Math.min(total, p + 1))} 
          disabled={current === total}
          style={{ ...styles.pageBtn(false), opacity: current === total ? 0.3 : 1 }}
        >
          Siguiente
        </button>
      </div>
    )
  );

  return (
    <div style={styles.mainContent}>
      
      {/* --- SECCIÓN 1: RECARGAS Y RETIROS --- */}
      <div style={styles.card}>
        <div style={styles.headerFlex}>
          <h2 style={styles.tituloSeccion}>
            {isAdmin ? "Gestión Global de Recargas" : "Mi Historial de Recargas"}
          </h2>
          <button 
            onClick={fetchDatos} 
            disabled={loading} 
            style={{ ...styles.refreshBtn, opacity: loading ? 0.5 : 1 }}
          >
            {loading ? 'CARGANDO...' : '🔄 ACTUALIZAR'}
          </button>
        </div>
        
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>FECHA</th>
              {isAdmin && <th style={styles.th}>EMPRESA</th>}
              <th style={styles.th}>DESCRIPCIÓN</th>
              {isAdmin && <th style={styles.th}>ADMIN</th>}
              <th style={{ ...styles.th, textAlign: 'right' }}>CANTIDAD</th>
            </tr>
          </thead>
          <tbody>
            {movsPaginados.map(m => (
              <tr key={m.id}>
                <td style={styles.td}>
                  {new Date(m.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </td>
                {isAdmin && <td style={styles.td}><span style={styles.companyText}>{m.profiles?.company || 'PARTICULAR'}</span></td>}
                <td style={styles.td}>{m.descripcion}</td>
                {isAdmin && (
                  <td style={styles.td}>
                    <span style={styles.adminBadge}>{m.admin_email || 'Sistema'}</span>
                  </td>
                )}
                <td style={{ ...styles.td, textAlign: 'right', fontWeight: 'bold', color: m.tipo === 'gasto' ? '#e11d48' : '#228b22' }}>
                  {m.tipo === 'gasto' ? '-' : '+'}{m.cantidad.toLocaleString('es-CL')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {renderPagination(pagMovimientos, totalPagMovs, setPagMovimientos)}
        {!loading && movimientos.length === 0 && <p style={{ textAlign: 'center', color: '#999', marginTop: '20px' }}>No hay registros disponibles.</p>}
      </div>

      {/* --- SECCIÓN 2: CANJES --- */}
      <div style={styles.card}>
        <div style={styles.headerFlex}>
          <h2 style={styles.tituloSeccion}>
            {isAdmin ? "Gestión Global de Canjes" : "Mis Canjes Realizados"}
          </h2>
          <button 
            onClick={fetchDatos} 
            disabled={loading} 
            style={{ ...styles.refreshBtn, opacity: loading ? 0.5 : 1 }}
          >
            {loading ? 'CARGANDO...' : '🔄 ACTUALIZAR'}
          </button>
        </div>
        
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>FECHA</th>
              {isAdmin && <th style={styles.th}>EMPRESA</th>}
              <th style={styles.th}>DETALLE</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>CANTIDAD</th>
            </tr>
          </thead>
          <tbody>
            {canjesPaginados.map(c => (
              <tr key={c.id}>
                <td style={styles.td}>
                  {new Date(c.fecha).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </td>
                {isAdmin && <td style={styles.td}><span style={styles.companyText}>{c.profiles?.company || 'PARTICULAR'}</span></td>}
                <td style={styles.td}>{c.descripcion}</td>
                <td style={{ ...styles.td, textAlign: 'right', fontWeight: 'bold', color: '#e11d48' }}>
                  -{c.cantidad.toLocaleString('es-CL')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {renderPagination(pagCanjes, totalPagCanjes, setPagCanjes)}
        {!loading && canjes.length === 0 && <p style={{ textAlign: 'center', color: '#999', marginTop: '20px' }}>No hay canjes registrados.</p>}
      </div>
    </div>
  );
};

export default Historial;