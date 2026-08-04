import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const checkIsWorkTime = () => {
  const now = new Date();
  const chileTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Santiago" }));
  const hour = chileTime.getHours();
  const day = chileTime.getDay(); // 0: Domingo, 1: Lunes, ..., 6: Sábado

  // Turno mañana: Lunes a Sábado de 09:00 a 13:00
  const morningShift = hour >= 9 && hour < 13;
  // Turno tarde: Solo Lunes a Viernes (1 al 5) de 15:00 a 19:00
  const afternoonShift = day !== 6 && day !== 0 && hour >= 15 && hour < 19;

  // Está abierto si es de Lunes a Sábado y calza con los turnos (Domingo siempre cerrado)
  return day !== 0 && (morningShift || afternoonShift);
};

// --- ICONOS SVG EN LÍNEA (sin dependencias externas) ---
const Icon = {
  Refresh: (props) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <polyline points="21 3 21 9 15 9" />
    </svg>
  ),
  Search: (props) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Info: (props) => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="11" x2="12" y2="16.5" />
      <circle cx="12" cy="7.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  ),
  Plus: (props) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" {...props}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Minus: (props) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" {...props}>
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Close: (props) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" {...props}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Chevron: ({ dir = 'left', ...props }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ transform: dir === 'right' ? 'rotate(180deg)' : 'none' }} {...props}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  Clock: (props) => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15.5 14" />
    </svg>
  ),
  Lock: (props) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  User: (props) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </svg>
  ),
  Inbox: (props) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />
    </svg>
  ),
  File: (props) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  )
};

const Admin = ({ session }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [movimientos, setMovimientos] = useState([]);

  // --- NUEVOS ESTADOS PARA METRICAS DE ARCHIVOS ---
  const [stats, setStats] = useState({ semana: 0, mes: 0, total: 0 });

  // --- OBTENER EL ESTADO DEL TEMA DESDE EL LAYOUT ---
  const { darkMode } = useOutletContext();

  // Inicializado con un valor por defecto seguro
  const [config, setConfig] = useState({ is_online: 'auto', mensaje_online: '', mensaje_offline: '' });

  // --- NUEVOS ESTADOS PARA BÚSQUEDA Y PAGINACIÓN ---
  const [searchTerm, setSearchTerm] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina] = useState(10);

  const ADMIN_EMAILS = [
    'sebastianzunigavaldivia@gmail.com',
    'oliver.zuniga@gmail.com',
    'focaldevs@gmail.com'
  ];

  const isAdmin =
    session?.user?.user_metadata?.role === 'admin' ||
    ADMIN_EMAILS.includes(session?.user?.email?.toLowerCase());

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchConfig();
      fetchFileStats(); // Llamamos al cargador de métricas
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('email', { ascending: true });
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracion_global').select('*').eq('id', 'atencion_cliente').single();
      if (data && !error) setConfig(data);
    } catch (e) {
      console.error("Error cargando config inicial:", e);
    }
  };

  // 📊 CÁLCULO DE ARCHIVOS PROCESADOS POR RANGOS TEMPORALES
  const fetchFileStats = async () => {
    try {
      const ahora = new Date();

      // Hace 7 días atras
      const haceUnaSemana = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      // Hace 30 días atras
      const haceUnMes = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // Consultas paralelas optimizadas con count
      const [resTotal, resMes, resSemana] = await Promise.all([
        supabase.from('archivos').select('*', { count: 'exact', head: true }).eq('estado', 'completado'),
        supabase.from('archivos').select('*', { count: 'exact', head: true }).eq('estado', 'completado').gte('created_at', haceUnMes),
        supabase.from('archivos').select('*', { count: 'exact', head: true }).eq('estado', 'completado').gte('created_at', haceUnaSemana)
      ]);

      setStats({
        total: resTotal.count || 0,
        mes: resMes.count || 0,
        semana: resSemana.count || 0
      });
    } catch (err) {
      console.error("Error calculando analíticas de archivos:", err);
    }
  };

  const fetchMovimientos = async (userId) => {
    const { data, error } = await supabase
      .from('movimientos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (!error) setMovimientos(data || []);
  };

  const handleOpenDetails = (user) => {
    setSelectedUser(user);
    fetchMovimientos(user.id);
  };

  const handleAdjustCredits = async (userId, currentCredits, accion) => {
    const amountStr = prompt(`¿Cuántos créditos desea ${accion.toLowerCase()}?`);
    if (!amountStr || isNaN(amountStr) || parseInt(amountStr) <= 0) return;
    const amount = parseInt(amountStr);

    if (accion === 'RESTAR' && currentCredits < amount) {
      alert("Error: El usuario no tiene suficientes créditos.");
      return;
    }

    const desc = prompt("Motivo del ajuste:",
      accion === 'SUMAR' ? "Carga manual de créditos" : "Retiro manual de créditos");
    if (desc === null) return;

    try {
      const nuevoTotal = accion === 'SUMAR' ? currentCredits + amount : currentCredits - amount;
      const tipoMovimiento = accion === 'SUMAR' ? 'carga' : 'gasto';

      const { error: errorUpdate } = await supabase
        .from('profiles')
        .update({ credits: nuevoTotal })
        .eq('id', userId);

      if (errorUpdate) throw errorUpdate;

      const { error: errorMov } = await supabase
        .from('movimientos')
        .insert([
          {
            user_id: userId,
            descripcion: desc,
            cantidad: amount,
            tipo: tipoMovimiento,
            admin_email: session?.user?.email
          }
        ]);

      if (errorMov) throw errorMov;

      alert(`✅ Operación exitosa. Nuevo saldo: ${nuevoTotal.toLocaleString('es-CL')}`);
      fetchUsers();
      if (selectedUser && selectedUser.id === userId) fetchMovimientos(userId);

    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const cambiarEstadoInmediato = async (nuevoEstado) => {
    const estadoAnterior = config?.is_online;
    setConfig(prev => ({ ...prev, is_online: nuevoEstado }));
    try {
      const { error } = await supabase
        .from('configuracion_global')
        .update({ is_online: nuevoEstado })
        .eq('id', 'atencion_cliente');

      if (error) throw error;

      window.dispatchEvent(new CustomEvent('config-updated'));
    } catch (err) {
      console.error("Error guardando configuración global:", err);
      setConfig(prev => ({ ...prev, is_online: estadoAnterior }));
      alert("No se pudo guardar el cambio: " + err.message);
    }
  };

  // --- LÓGICA DE FILTRADO Y PAGINACIÓN ---
  const usersFiltrados = users.filter(u => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (u.full_name?.toLowerCase().includes(searchLower)) ||
      (u.email?.toLowerCase().includes(searchLower))
    );
  });

  const totalPaginas = Math.ceil(usersFiltrados.length / itemsPorPagina);
  const indiceUltimo = paginaActual * itemsPorPagina;
  const indicePrimer = indiceUltimo - itemsPorPagina;
  const usersPaginados = usersFiltrados.slice(indicePrimer, indiceUltimo);

  // --- TOKENS DE DISEÑO CONFIGURADOS CON MODO OSCURO/CLARO ---
  const t = {
    bg: darkMode ? '#0f172a' : '#f6f6f9',
    surface: darkMode ? '#1e293b' : '#ffffff',
    ink: darkMode ? '#f8fafc' : '#18181b',
    inkSoft: darkMode ? '#94a3b8' : '#71717a',
    inkFaint: darkMode ? '#64748b' : '#a1a1aa',
    line: darkMode ? '#334155' : '#ececf0',
    brand: '#e11d48',
    brandSoft: darkMode ? 'rgba(225, 29, 72, 0.15)' : '#fff1f3',
    brandLine: darkMode ? 'rgba(225, 29, 72, 0.3)' : '#ffd7df',
    positive: darkMode ? '#4ade80' : '#15803d',
    positiveSoft: darkMode ? 'rgba(74, 222, 128, 0.15)' : '#f0fdf4',
    positiveLine: darkMode ? 'rgba(74, 222, 128, 0.3)' : '#bbf7d0',
  };

  const styles = {
    main: { 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column', 
      backgroundColor: t.bg, 
      minHeight: '100vh', 
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      transition: 'all 0.3s ease'
    },
    topBar: { display: 'flex', justifyContent: 'flex-end', padding: '20px 30px 0' },
    refreshBtn: (isLoading) => ({
      display: 'flex', alignItems: 'center', gap: '7px',
      padding: '9px 16px', cursor: isLoading ? 'default' : 'pointer', fontSize: '12px', fontWeight: 600,
      borderRadius: '9px', border: `1px solid ${t.line}`,
      backgroundColor: isLoading ? (darkMode ? '#0f172a' : '#fafafa') : (darkMode ? '#2563eb' : '#fff'), 
      color: isLoading ? t.inkFaint : (darkMode ? '#ffffff' : t.ink),
      transition: 'all 0.15s ease'
    }),
    switchCard: {
      backgroundColor: t.surface, margin: '18px 30px 0', padding: '24px 28px', borderRadius: '16px',
      border: `1px solid ${t.line}`, boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 1px 2px rgba(24,24,27,0.04), 0 8px 24px rgba(24,24,27,0.04)',
      display: 'flex', flexDirection: 'column', gap: '18px',
      transition: 'all 0.3s ease'
    },
    statusRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '10px' },
    statusDot: (color) => ({ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: color, display: 'inline-block', boxShadow: `0 0 0 4px ${color}22` }),
    statusPill: (color, soft) => ({
      display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: soft, color: color,
      padding: '7px 14px', borderRadius: '999px', fontWeight: 700, fontSize: '12.5px', letterSpacing: '0.01em'
    }),
    segmented: { display: 'flex', gap: '8px', width: '100%' },
    segBtn: (active, activeColor) => ({
      flex: 1, padding: '13px 10px', fontSize: '11.5px', fontWeight: 700, border: `1px solid ${active ? activeColor : t.line}`,
      borderRadius: '10px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.02em',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
      backgroundColor: active ? activeColor : (darkMode ? '#0f172a' : '#fafafa'), 
      color: active ? '#fff' : t.inkSoft,
      transition: 'all 0.15s ease', boxShadow: active ? `0 4px 12px ${activeColor}40` : 'none'
    }),
    
    // 📊 NUEVOS ESTILOS PARA LAS TARJETAS DE ESTADÍSTICAS
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
      gap: '20px',
      margin: '18px 30px 0'
    },
    statCard: {
      backgroundColor: t.surface,
      padding: '20px 24px',
      borderRadius: '14px',
      border: `1px solid ${t.line}`,
      boxShadow: darkMode ? '0 4px 15px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.02)',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      transition: 'all 0.3s ease'
    },
    statNumber: {
      fontSize: '24px',
      fontWeight: 800,
      color: t.ink,
      lineHeight: '1'
    },
    statLabel: {
      fontSize: '11.5px',
      fontWeight: 600,
      color: t.inkSoft,
      textTransform: 'uppercase',
      letterSpacing: '0.03em',
      marginTop: '4px'
    },
    statIconWrapper: {
      width: '40px',
      height: '40px',
      borderRadius: '10px',
      backgroundColor: darkMode ? 'rgba(37, 99, 235, 0.15)' : '#eff6ff',
      color: '#2563eb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },

    contentCard: {
      backgroundColor: t.surface, margin: '18px 30px 30px', padding: '30px 32px', borderRadius: '16px',
      border: `1px solid ${t.line}`, boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 1px 2px rgba(24,24,27,0.04), 0 8px 24px rgba(24,24,27,0.04)',
      transition: 'all 0.3s ease'
    },
    cardTitle: { fontSize: '17px', margin: '0 0 20px', fontWeight: 700, color: t.ink, letterSpacing: '-0.01em' },
    searchBar: {
      display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: darkMode ? '#0f172a' : '#fafafa',
      padding: '11px 14px', borderRadius: '10px', border: `1px solid ${t.line}`,
      marginBottom: '20px', width: '100%', maxWidth: '380px', transition: 'border-color 0.15s ease'
    },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '0 12px 12px', fontSize: '10.5px', color: t.inkFaint, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, borderBottom: `1px solid ${t.line}` },
    td: { padding: '14px 12px', fontSize: '13.5px', borderBottom: `1px solid ${t.line}`, color: t.ink },
    btnAction: (color) => ({
      backgroundColor: color, color: 'white', border: 'none', width: '30px', height: '30px', fontWeight: 'bold',
      cursor: 'pointer', borderRadius: '8px', fontSize: '10px', display: 'inline-flex', alignItems: 'center',
      justifyContent: 'center', transition: 'transform 0.12s ease'
    }),
    btnInfo: {
      backgroundColor: 'transparent', color: t.inkSoft, border: `1px solid ${t.line}`, padding: '0 12px', height: '30px',
      fontWeight: 700, cursor: 'pointer', borderRadius: '8px', fontSize: '10.5px', marginRight: '8px',
      display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s ease'
    },
    creditBadge: (positive) => ({
      display: 'inline-flex', alignItems: 'center', fontWeight: 700, fontSize: '13px',
      color: positive ? t.positive : t.brand
    }),
    modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(24,24,27,0.7)', backdropFilter: 'blur(2px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalBox: { 
      backgroundColor: t.surface, 
      padding: '30px 32px', 
      borderRadius: '18px', 
      width: '560px', 
      maxWidth: '92vw', 
      maxHeight: '85vh', 
      overflowY: 'auto', 
      boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
      border: darkMode ? '1px solid #334155' : 'none'
    },
    pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '26px' },
    pageBtn: (active) => ({
      minWidth: '32px', height: '32px', padding: '0 8px', cursor: 'pointer',
      backgroundColor: active ? (darkMode ? '#2563eb' : t.ink) : 'transparent', color: active ? '#fff' : t.inkSoft,
      border: active ? `1px solid ${darkMode ? '#2563eb' : t.ink}` : `1px solid ${t.line}`, borderRadius: '8px',
      fontSize: '12px', fontWeight: 700, transition: 'all 0.15s ease'
    }),
    navBtn: (disabled) => ({
      display: 'flex', alignItems: 'center', gap: '6px', height: '32px', padding: '0 12px',
      cursor: disabled ? 'default' : 'pointer', backgroundColor: 'transparent',
      color: disabled ? (darkMode ? '#334155' : '#d4d4d8') : t.inkSoft, border: `1px solid ${t.line}`, borderRadius: '8px',
      fontSize: '11.5px', fontWeight: 700, transition: 'all 0.15s ease'
    }),
    emptyState: { textAlign: 'center', color: t.inkFaint, padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', fontSize: '13px' },
    modalTime: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      color: t.inkFaint,
      fontSize: '11px',
      marginTop: '3px'
    }
  };

  if (!isAdmin) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', minHeight: '100vh', backgroundColor: t.bg, fontFamily: "'Inter', sans-serif", transition: 'all 0.3s ease' }}>
        <div style={{ display: 'inline-flex', width: '54px', height: '54px', borderRadius: '50%', backgroundColor: t.brandSoft, color: t.brand, alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
          <Icon.Lock width={22} height={22} />
        </div>
        <h2 style={{ color: t.ink, margin: 0 }}>Acceso denegado</h2>
        <p style={{ color: t.inkFaint, fontSize: '13px' }}>No tienes permisos de administrador para ver esta página.</p>
      </div>
    );
  }

  const currentOnlineState = config?.is_online;
  const isAutoActive = currentOnlineState === 'auto' || currentOnlineState === true || currentOnlineState === "true";
  const isManualOffActive = currentOnlineState === 'manual_off' || currentOnlineState === false || currentOnlineState === "false";

  const autoIsOpenNow = checkIsWorkTime();
  const systemIsOpenNow = isAutoActive && autoIsOpenNow;

  const statusColor = systemIsOpenNow ? t.positive : t.brand;
  const statusSoft = systemIsOpenNow ? t.positiveSoft : t.brandSoft;
  const statusLabel = isAutoActive
    ? (autoIsOpenNow ? 'Automático: online' : 'Automático: cerrado')
    : 'Bloqueado manualmente';

  return (
    <div style={styles.main}>
      <style>{`
        @keyframes adminSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes adminFadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes adminPop { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
        .admin-spin { animation: adminSpin 0.8s linear infinite; }
        .admin-row { animation: adminFadeIn 0.22s ease both; }
        .admin-row:hover { background-color: ${darkMode ? '#334155' : '#fafafa'} !important; }
        .admin-modal { animation: adminPop 0.18s ease both; }
        .admin-refresh:not(:disabled):hover { transform: translateY(-1px); border-color: ${darkMode ? '#475569' : '#d4d4d8'}; }
        .admin-seg:hover { filter: brightness(0.92); }
        .admin-icon-btn:hover { transform: translateY(-1px); }
        .admin-info-btn:hover { background-color: ${darkMode ? '#334155' : '#fafafa'}; border-color: ${darkMode ? '#475569' : '#d4d4d8'}; }
        .admin-search-input::placeholder { color: ${darkMode ? '#475569' : '#a1a1aa'}; }
      `}</style>

      <div style={styles.topBar}>
        <button
          className="admin-refresh"
          onClick={() => {
            fetchUsers();
            fetchFileStats(); // Refrescar métricas también al presionar actualizar
          }}
          disabled={loading}
          style={styles.refreshBtn(loading)}
        >
          <Icon.Refresh className={loading ? 'admin-spin' : ''} />
          {loading ? 'Actualizando' : 'Actualizar lista'}
        </button>
      </div>

      {/* CARD DE CONTROL GLOBAL - DOBLE BOTÓN */}
      <div style={styles.switchCard}>
        <div style={styles.statusRow}>
          <div>
            <h3 style={{ margin: 0, fontSize: '14.5px', color: t.ink, fontWeight: 700 }}>Estado de atención global</h3>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: t.inkFaint }}>
              Controla cómo se muestra el banner de atención en tiempo real.
            </p>
          </div>
          <span style={styles.statusPill(statusColor, statusSoft)}>
            <span style={styles.statusDot(statusColor)} />
            {statusLabel}
          </span>
        </div>

        <div style={styles.segmented}>
          <button className="admin-seg" onClick={() => cambiarEstadoInmediato('auto')} style={styles.segBtn(isAutoActive, darkMode ? '#2563eb' : t.ink)}>
            <Icon.Clock /> Modo auto
          </button>
          <button className="admin-seg" onClick={() => cambiarEstadoInmediato('manual_off')} style={styles.segBtn(isManualOffActive, t.brand)}>
            <Icon.Lock /> Forzar cierre
          </button>
        </div>
      </div>

      {/* 📊 NUEVO APARTADO: TARJETAS DE ARCHIVOS PROCESADOS */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIconWrapper}>
            <Icon.File />
          </div>
          <div>
            <div style={styles.statNumber}>{stats.semana}</div>
            <div style={styles.statLabel}>Archivos esta semana</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIconWrapper}>
            <Icon.File />
          </div>
          <div>
            <div style={styles.statNumber}>{stats.mes}</div>
            <div style={styles.statLabel}>Archivos este mes</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIconWrapper}>
            <Icon.File />
          </div>
          <div>
            <div style={styles.statNumber}>{stats.total}</div>
            <div style={styles.statLabel}>Total procesados</div>
          </div>
        </div>
      </div>

      <div style={styles.contentCard}>
        <h2 style={styles.cardTitle}>Usuarios y créditos</h2>

        <div style={styles.searchBar}>
          <Icon.Search style={{ color: t.inkFaint, flexShrink: 0 }} />
          <input
            className="admin-search-input"
            type="text"
            placeholder="Buscar por email o nombre..."
            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '13px', background: 'transparent', color: t.ink }}
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPaginaActual(1); }}
          />
        </div>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Nombre</th>
              <th style={styles.th}>Créditos</th>
              <th style={styles.th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usersPaginados.map((u, i) => (
              <tr key={u.id} className="admin-row" style={{ animationDelay: `${i * 25}ms` }}>
                <td style={styles.td}>{u.email}</td>
                <td style={{ ...styles.td, color: t.inkSoft }}>{u.full_name || 'Sin nombre'}</td>
                <td style={styles.td}>
                  <span style={styles.creditBadge(u.credits > 0)}>{u.credits?.toLocaleString('es-CL')}</span>
                </td>
                <td style={styles.td}>
                  <button className="admin-info-btn" style={styles.btnInfo} onClick={() => handleOpenDetails(u)}>
                    <Icon.Info /> Detalles
                  </button>
                  <button className="admin-icon-btn" style={{ ...styles.btnAction(t.positive), marginRight: '6px' }} onClick={() => handleAdjustCredits(u.id, u.credits, 'SUMAR')} title="Sumar créditos">
                    <Icon.Plus />
                  </button>
                  <button className="admin-icon-btn" style={styles.btnAction(t.brand)} onClick={() => handleAdjustCredits(u.id, u.credits, 'RESTAR')} title="Restar créditos">
                    <Icon.Minus />
                  </button>
                </td>
              </tr>
            ))}
            {!loading && usersPaginados.length === 0 && (
              <tr>
                <td colSpan="4">
                  <div style={styles.emptyState}>
                    <Icon.Inbox />
                    <span>No se encontraron usuarios.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* PAGINACIÓN */}
        {totalPaginas > 1 && (
          <div style={styles.pagination}>
            <button
              onClick={() => { setPaginaActual(p => Math.max(1, p - 1)); window.scrollTo(0, 0); }}
              disabled={paginaActual === 1}
              style={styles.navBtn(paginaActual === 1)}
            >
              <Icon.Chevron dir="left" /> Anterior
            </button>
            {[...Array(totalPaginas).keys()].map(n => (
              <button
                key={n + 1}
                onClick={() => { setPaginaActual(n + 1); window.scrollTo(0, 0); }}
                style={styles.pageBtn(paginaActual === n + 1)}
              >
                {n + 1}
              </button>
            ))}
            <button
              onClick={() => { setPaginaActual(p => Math.min(totalPaginas, p + 1)); window.scrollTo(0, 0); }}
              disabled={paginaActual === totalPaginas}
              style={styles.navBtn(paginaActual === totalPaginas)}
            >
              Siguiente <Icon.Chevron dir="right" />
            </button>
          </div>
        )}
      </div>

      {selectedUser && (
        <div style={styles.modalOverlay} onClick={() => setSelectedUser(null)}>
          <div className="admin-modal" style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', borderBottom: `1px solid ${t.line}`, paddingBottom: '18px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: t.brandSoft, color: t.brand, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon.User />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '15.5px', color: t.ink, fontWeight: 700 }}>Ficha del distribuidor</h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: t.inkFaint }}>{selectedUser.email}</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '20px' }}>
              <div>
                <p style={{ fontSize: '10px', color: t.inkFaint, margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nombre completo</p>
                <p style={{ fontSize: '14px', margin: '6px 0 15px', color: t.ink, borderBottom: `1px solid ${t.line}`, paddingBottom: '8px' }}>{selectedUser.full_name || 'No registrado'}</p>
              </div>
              <div>
                <p style={{ fontSize: '10px', color: t.inkFaint, margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Créditos disponibles</p>
                <p style={{ fontSize: '14px', margin: '6px 0 15px', fontWeight: 700, color: t.brand, borderBottom: `1px solid ${t.line}`, paddingBottom: '8px' }}>{selectedUser.credits?.toLocaleString('es-CL')}</p>
              </div>
            </div>

            <h4 style={{ marginTop: '10px', fontSize: '11px', color: t.inkFaint, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `1px solid ${t.line}`, paddingBottom: '10px' }}>
              Historial de movimientos
            </h4>
            <div style={{ maxHeight: '250px', overflowY: 'auto', marginTop: '8px' }}>
              <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ color: t.inkFaint }}>
                    <th style={{ textAlign: 'left', padding: '8px 0', fontWeight: 700 }}>Fecha / Hora</th>
                    <th style={{ textAlign: 'left', fontWeight: 700 }}>Detalle</th>
                    <th style={{ textAlign: 'right', fontWeight: 700 }}>Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map(m => {
                    const fechaObj = new Date(m.created_at);
                    return (
                      <tr key={m.id} style={{ borderTop: `1px solid ${t.line}` }}>
                        <td style={{ padding: '10px 0', color: t.inkSoft }}>
                          <div style={{ fontWeight: 600, color: t.ink }}>
                            {fechaObj.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </div>
                          <div style={styles.modalTime}>
                            <Icon.Clock />
                            {fechaObj.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} hrs
                          </div>
                        </td>
                        <td style={{ color: t.inkSoft, verticalAlign: 'middle' }}>{m.descripcion}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: m.tipo === 'gasto' ? t.brand : t.positive, verticalAlign: 'middle' }}>
                          {m.tipo === 'gasto' ? '-' : '+'}{m.cantidad.toLocaleString('es-CL')}
                        </td>
                      </tr>
                    );
                  })}
                  {movimientos.length === 0 && (
                    <tr><td colSpan="3" style={{ textAlign: 'center', padding: '18px 0', color: t.inkFaint }}>Sin movimientos registrados.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <button
              onClick={() => setSelectedUser(null)}
              style={{
                width: '100%', padding: '13px', marginTop: '22px', backgroundColor: t.ink, color: darkMode ? '#ffffff' : '#fff',
                border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '12.5px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'opacity 0.15s ease'
              }}
            >
              <Icon.Close /> Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;