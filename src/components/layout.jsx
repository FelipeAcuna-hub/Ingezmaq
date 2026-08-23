import React, { useState, useEffect, useCallback } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import logoImg from '../../img/logo.png';

// --- ICONOS SVG EN LÍNEA ---
const Icon = {
  Dashboard: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  User: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </svg>
  ),
  Card: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="2" y="5" width="20" height="14" rx="2.5" /><line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  ),
  Chat: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M21 11.5a8.38 8.38 0 0 1-9.5 8.3A8.5 8.5 0 1 1 21 11.5Z" />
    </svg>
  ),
  File: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  Users: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Settings: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  ),
  Calculator: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" />
      <line x1="8" y1="11" x2="8" y2="11.01" /><line x1="12" y1="11" x2="12" y2="11.01" /><line x1="16" y1="11" x2="16" y2="11.01" />
      <line x1="8" y1="15" x2="8" y2="15.01" /><line x1="12" y1="15" x2="12" y2="15.01" /><line x1="16" y1="15" x2="16" y2="15.01" />
    </svg>
  ),
  Sun: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="4.5" />
      <line x1="12" y1="1.5" x2="12" y2="3.5" /><line x1="12" y1="20.5" x2="12" y2="22.5" />
      <line x1="4.2" y1="4.2" x2="5.6" y2="5.6" /><line x1="18.4" y1="18.4" x2="19.8" y2="19.8" />
      <line x1="1.5" y1="12" x2="3.5" y2="12" /><line x1="20.5" y1="12" x2="22.5" y2="12" />
      <line x1="4.2" y1="19.8" x2="5.6" y2="18.4" /><line x1="18.4" y1="5.6" x2="19.8" y2="4.2" />
    </svg>
  ),
  Moon: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  ),
  LogOut: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  Menu: (p) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  Close: (p) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" {...p}>
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
};

// --- SUB-COMPONENTE INTERACTIVO ---
const SidebarLink = ({ to, currentPath, icon, text, onClick, activeStyle, inactiveStyle, badgeCount = 0 }) => {
  const [isHovered, setIsHovered] = useState(false);
  const isActive = currentPath === to;

  const linkStyle = {
    textDecoration: 'none',
    display: 'block',
    transition: 'all 0.25s ease',
    transform: isHovered && !isActive ? 'translateX(4px)' : 'translateX(0)',
  };

  const itemStyle = isActive
    ? activeStyle
    : {
      ...inactiveStyle,
      backgroundColor: isHovered ? 'rgba(37, 99, 235, 0.14)' : 'transparent',
      color: isHovered ? '#ffffff' : inactiveStyle.color,
    };

  return (
    <Link
      to={to}
      style={linkStyle}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <li style={{ ...itemStyle, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{
            marginRight: '13px',
            display: 'inline-flex',
            alignItems: 'center',
            color: isActive ? '#ffffff' : (isHovered ? '#60a5fa' : '#6b7280'),
            transition: 'all 0.2s ease'
          }}>
            {icon}
          </span>
          {text}
        </div>

        {/* BADGE NOTIFICACIÓN SOLO SI HAY PENDIENTES / ARCHIVOS ACTIVOS */}
        {badgeCount > 0 && (
          <span className="layout-badge-pulse" style={{
            backgroundColor: '#e11d48',
            color: '#ffffff',
            fontSize: '10px',
            fontWeight: '800',
            padding: '2px 7px',
            borderRadius: '999px',
            boxShadow: '0 0 8px rgba(225,29,72,0.8)'
          }}>
            {badgeCount}
          </span>
        )}
      </li>
    </Link>
  );
};

// --- CÁLCULO DE HORARIO CHILENO ---
const checkEstaAbierto = () => {
  const ahora = new Date();
  const horaChile = new Date(ahora.toLocaleString("en-US", { timeZone: "America/Santiago" }));
  const diaSemana = horaChile.getDay();
  const hora = horaChile.getHours();
  const minutos = horaChile.getMinutes();

  const esDiaHabil = diaSemana >= 1 && diaSemana <= 5;
  const tiempoEnHoras = hora + (minutos / 60);
  const esHorarioHabil = tiempoEnHoras >= 9 && tiempoEnHoras < 18.5;

  return esDiaHabil && esHorarioHabil;
};

const Layout = ({ session }) => {
  const [dbCredits, setDbCredits] = useState(0);
  const [displayName, setDisplayName] = useState("USUARIO");
  const [status, setStatus] = useState({ is_online: true, mensaje: 'CARGANDO ESTADO...' });
  const [ticketCount, setTicketCount] = useState(0);
  const [fileCount, setFileCount] = useState(0); // 🔴 ESTADO PARA NOTIFICACIÓN DE ARCHIVOS
  const [perfilIncompleto, setPerfilIncompleto] = useState(false);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : true;
  });

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const ADMIN_EMAILS = [
    'sebastianzunigavaldivia@gmail.com',
    'oliver.zuniga@gmail.com',
    'focaldevs@gmail.com',
    'respaldoestudiovaldivia@gmail.com'
  ];
  // Acceso a CLIENTES: admins completos, más quienes solo gestionan clientes.
  const CLIENTES_ACCESS_EMAILS = [...ADMIN_EMAILS, 'alientechchile@gmail.com'];
  // Acceso admin a ARCHIVOS (mismo criterio que Archivos.jsx).
  const ARCHIVOS_ADMIN_EMAILS = [...ADMIN_EMAILS, 'alientechchile@gmail.com'];
  const isAdmin = ADMIN_EMAILS.includes(session?.user?.email?.toLowerCase());
  const canAccessClientes = CLIENTES_ACCESS_EMAILS.includes(session?.user?.email?.toLowerCase());
  const isArchivosAdmin = ARCHIVOS_ADMIN_EMAILS.includes(session?.user?.email?.toLowerCase());

  // 📁 NOTIFICACIÓN DE ARCHIVOS: para admins de Archivos, archivos recién
  // subidos (pendientes de revisar); para clientes, sus propios archivos en gestión.
  const fetchActiveFilesCount = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      let queryFiles = supabase
        .from('archivos')
        .select('id, estado, user_id');

      if (!isArchivosAdmin) {
        queryFiles = queryFiles.eq('user_id', session.user.id);
      }

      const { data: filesData, error } = await queryFiles;
      if (error || !filesData) return;

      const count = isArchivosAdmin
        ? filesData.filter(f => f.estado === 'pendiente').length
        : filesData.filter(f => f.estado === 'en gestión').length;

      setFileCount(count);
    } catch (err) {
      console.error("Error calculando notificaciones de archivos:", err);
    }
  }, [session?.user?.id, isArchivosAdmin]);

  // 🛠️ NOTIFICACIÓN DE TICKETS
  const fetchPendingTicketsCount = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      let queryTickets = supabase
        .from('tickets')
        .select('id, estado, user_id, archivado');

      if (!isAdmin) {
        queryTickets = queryTickets.eq('user_id', session.user.id);
      }

      const { data: rawTicketsData, error: errTickets } = await queryTickets;
      if (errTickets || !rawTicketsData) return;

      // Los tickets archivados no deben seguir avisando (ni al admin ni al cliente).
      const ticketsData = rawTicketsData.filter(t => !t.archivado);

      let count = ticketsData.filter(t => t.estado === 'Pendiente').length;
      const otherTickets = ticketsData.filter(t => t.estado !== 'Pendiente');

      for (const t of otherTickets) {
        const { data: msgs } = await supabase
          .from('ticket_messages')
          .select('is_admin_reply, user_id, created_at')
          .eq('ticket_id', t.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (msgs && msgs.length > 0) {
          const lastMsg = msgs[0];
          if (isAdmin ? !lastMsg.is_admin_reply : lastMsg.is_admin_reply) {
            count += 1;
          }
        }
      }

      setTicketCount(count);
    } catch (err) {
      console.error("Error calculando notificaciones de tickets:", err);
    }
  }, [session?.user?.id, isAdmin]);

  const updateBannerStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('configuracion_global')
        .select('is_online')
        .eq('id', 'atencion_cliente')
        .single();

      if (error) throw error;

      const dbState = data?.is_online;
      const isAuto = dbState === 'auto' || dbState === true || dbState === "true";
      const isManualOff = dbState === 'manual_off' || dbState === false || dbState === "false";
      
      const isScheduleOnline = checkEstaAbierto();

      if (isAuto) {
        if (isScheduleOnline) {
          setStatus({ is_online: true, mensaje: "SISTEMA ONLINE - CHIPTUNING PROCESANDO" });
        } else {
          setStatus({ is_online: false, mensaje: "FUERA DE HORARIO DE ATENCIÓN" });
        }
      } else if (isManualOff) {
        setStatus({ is_online: false, mensaje: "FUERA DE HORARIO DE ATENCIÓN (CERRADO POR ADMINISTRACIÓN)" });
      } else {
        setStatus({ is_online: false, mensaje: "SISTEMA FUERA DE SERVICIO" });
      }

    } catch (err) {
      console.error("Error actualizando banner corporativo:", err);
      const localSchedule = checkEstaAbierto();
      setStatus({
        is_online: localSchedule,
        mensaje: localSchedule ? "SISTEMA ONLINE - CHIPTUNING PROCESANDO" : "FUERA DE HORARIO DE ATENCIÓN"
      });
    }
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      if (session?.user) {
        const { data, error = null } = await supabase
          .from('profiles')
          .select('credits, full_name, fecha_nacimiento')
          .eq('id', session.user.id)
          .single();

        if (data && !error) {
          setDbCredits(data.credits || 0);
          setDisplayName(data.full_name || session.user.email.split('@')[0]);
          setPerfilIncompleto(!data.fecha_nacimiento);
        }
      }
    };

    fetchUserData();
    updateBannerStatus();
    fetchPendingTicketsCount();
    fetchActiveFilesCount();

    const timer = setInterval(updateBannerStatus, 60000);
    window.addEventListener('config-updated', updateBannerStatus);

    // ⚡ REALTIME CANAL TRIPLE: Escucha tickets, mensajes y archivos
    const channel = supabase
      .channel('realtime_layout_notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => {
        fetchPendingTicketsCount();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_messages' }, () => {
        fetchPendingTicketsCount();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'archivos' }, () => {
        fetchActiveFilesCount();
      })
      .subscribe();

    return () => {
      clearInterval(timer);
      window.removeEventListener('config-updated', updateBannerStatus);
      supabase.removeChannel(channel);
    };
  }, [session, updateBannerStatus, fetchPendingTicketsCount, fetchActiveFilesCount]);

  const toggleTheme = () => {
    const nextMode = !darkMode;
    setDarkMode(nextMode);
    localStorage.setItem('theme', nextMode ? 'dark' : 'light');
  };

  const styles = {
    container: {
      display: 'flex',
      width: '100vw',
      background: darkMode
        ? 'linear-gradient(180deg, #030712 0%, #02040a 100%)'
        : 'linear-gradient(180deg, #f9fafb 0%, #f3f4f6 100%)',
      fontFamily: "'Inter', sans-serif",
      margin: 0,
      padding: 0,
      position: 'fixed', top: 0, left: 0, overflow: 'hidden'
    },
    sidebar: {
      width: '260px',
      background: 'linear-gradient(185deg, #070f24 0%, #02050d 100%)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      shrink: 0,
      position: isMobile ? 'fixed' : 'relative',
      zIndex: 1000,
      borderRight: '1px solid rgba(255, 255, 255, 0.06)',
      boxShadow: isMobile ? '10px 0 30px rgba(0,0,0,0.4)' : 'none',
      transition: 'transform 0.3s ease-in-out',
      transform: isMobile && !isMenuOpen ? 'translateX(-100%)' : 'translateX(0)'
    },
    logoContainer: {
      padding: '36px 24px 16px 24px',
      textDecoration: 'none',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
    },
    logoImg: {
      width: '100%',
      maxWidth: '170px',
      height: 'auto',
      objectFit: 'contain',
      marginBottom: '12px'
    },
    navItem: { padding: '13px 20px', cursor: 'pointer', color: '#9ca3af', listStyle: 'none', textDecoration: 'none', display: 'flex', alignItems: 'center', fontSize: '12.5px', fontWeight: 600, letterSpacing: '0.02em', borderRadius: '9px', margin: '2px 10px', transition: 'all 0.2s ease' },
    navItemActive: { padding: '13px 20px', color: 'white', background: 'linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%)', listStyle: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', fontSize: '12.5px', letterSpacing: '0.02em', borderRadius: '9px', margin: '2px 10px', boxShadow: '0 4px 14px rgba(37,99,235,0.35)' },
    main: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      width: '100%',
      backgroundColor: darkMode ? '#0f172a' : '#f6f6f9'
    },
    header: {
      background: 'linear-gradient(90deg, #ea580c 0%, #dc4f0d 100%)',
      padding: isMobile ? '10px 15px' : '14px 30px',
      borderBottom: '1px solid #c2410c',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexShrink: 0,
      minHeight: '64px',
      position: 'relative',
      zIndex: 10
    },
    topBarStatus: {
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
      backgroundColor: status.is_online ? '#16a34a' : '#dc2626',
      color: 'white',
      padding: isMobile ? '7px' : '10px 20px',
      fontWeight: 700,
      fontSize: isMobile ? '10.5px' : '12px',
      letterSpacing: '0.03em',
      textAlign: 'center',
      transition: '0.4s',
      flexShrink: 0
    },
    statusDot: {
      width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#fff',
      boxShadow: '0 0 0 3px rgba(255,255,255,0.3)'
    },
    menuButton: {
      display: isMobile ? 'flex' : 'none',
      alignItems: 'center',
      backgroundColor: 'transparent',
      color: '#ffffff',
      border: 'none',
      cursor: 'pointer',
      padding: '0',
      marginRight: '10px'
    },
    creditPill: {
      display: 'flex', alignItems: 'center', gap: '10px',
      backgroundColor: 'rgba(0,0,0,0.15)',
      padding: isMobile ? '6px 10px' : '7px 16px',
      borderRadius: '999px',
      border: '1px solid rgba(255,255,255,0.15)'
    },
    avatarCircle: {
      width: '26px', height: '26px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: '#fff', flexShrink: 0
    },
    themeToggle: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      color: '#9ca3af',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      padding: '11px 14px',
      borderRadius: '999px',
      fontSize: '11px',
      fontWeight: 'bold',
      cursor: 'pointer',
      marginBottom: '10px',
      transition: 'all 0.2s ease',
      textTransform: 'uppercase'
    },
    logoutBtn: {
      width: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
      backgroundColor: 'transparent',
      color: '#ef4444',
      border: '1px solid rgba(239,68,68,0.4)',
      padding: '11px',
      fontWeight: 'bold',
      cursor: 'pointer',
      borderRadius: '999px',
      fontSize: '11px',
      textTransform: 'uppercase',
      position: 'relative',
      zIndex: 1020,
      transition: 'all 0.2s ease'
    }
  };

  return (
    <div className="layout-viewport-h" style={styles.container}>
      <style>{`
        /* En mobile, 100vh no descuenta la barra de direcciones de Safari/Chrome
           (aparece/desaparece al hacer scroll), dejando un hueco blanco abajo.
           100dvh sí la descuenta; los navegadores viejos ignoran esa línea y
           se quedan con el 100vh de arriba. */
        .layout-viewport-h { height: 100vh; height: 100dvh; }
        .layout-nav-scroll::-webkit-scrollbar { width: 5px; }
        .layout-nav-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 10px; }
        .layout-logout-btn:hover { background-color: rgba(239,68,68,0.12); border-color: #ef4444; }
        .layout-simulador-item:hover { background-color: rgba(255,255,255,0.05); color: #d1d5db !important; }
        @keyframes layoutPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
        .layout-status-dot { animation: layoutPulse 2s ease-in-out infinite; }
        @keyframes badgePulse { 0% { transform: scale(1); } 50% { transform: scale(1.15); } 100% { transform: scale(1); } }
        .layout-badge-pulse { animation: badgePulse 1.8s infinite; }
      `}</style>

      <aside className="layout-viewport-h" style={styles.sidebar}>

        <div style={styles.logoContainer}>
          <Link to="/" style={{ display: 'block', width: '100%', textAlign: 'center' }} onClick={() => setIsMenuOpen(false)}>
            <img src={logoImg} alt="Chiptuning Logo" style={styles.logoImg} />
          </Link>
        </div>

        <ul className="layout-nav-scroll" style={{ padding: '14px 0', margin: 0, listStyle: 'none', overflowY: 'auto' }}>
          <SidebarLink
            to="/"
            currentPath={location.pathname}
            icon={<Icon.Dashboard />}
            text="DASHBOARD"
            onClick={() => setIsMenuOpen(false)}
            activeStyle={styles.navItemActive}
            inactiveStyle={styles.navItem}
          />

          <SidebarLink
            to="/perfil"
            currentPath={location.pathname}
            icon={<Icon.User />}
            text="PERFIL"
            onClick={() => setIsMenuOpen(false)}
            activeStyle={styles.navItemActive}
            inactiveStyle={styles.navItem}
          />

          <SidebarLink
            to="/historial"
            currentPath={location.pathname}
            icon={<Icon.Card />}
            text="CRÉDITOS"
            onClick={() => setIsMenuOpen(false)}
            activeStyle={styles.navItemActive}
            inactiveStyle={styles.navItem}
          />

          {/* 🔔 NOTIFICACIÓN CONDICIONAL DE TICKETS */}
          <SidebarLink
            to="/tickets"
            currentPath={location.pathname}
            icon={<Icon.Chat />}
            text="TICKETS"
            badgeCount={ticketCount}
            onClick={() => setIsMenuOpen(false)}
            activeStyle={styles.navItemActive}
            inactiveStyle={styles.navItem}
          />

          {/* 🔴 NOTIFICACIÓN DE ARCHIVOS ("En Gestión" o "Completado") */}
          <SidebarLink
            to="/archivos"
            currentPath={location.pathname}
            icon={<Icon.File />}
            text="ARCHIVOS"
            badgeCount={fileCount}
            onClick={() => setIsMenuOpen(false)}
            activeStyle={styles.navItemActive}
            inactiveStyle={styles.navItem}
          />

          {canAccessClientes && (
            <SidebarLink
              to="/clientes"
              currentPath={location.pathname}
              icon={<Icon.Users />}
              text="CLIENTES"
              onClick={() => setIsMenuOpen(false)}
              activeStyle={styles.navItemActive}
              inactiveStyle={styles.navItem}
            />
          )}

          <Link to="/simulador" style={{ textDecoration: 'none', marginTop: '18px', display: 'block' }} onClick={() => setIsMenuOpen(false)}>
            <li className="layout-simulador-item" style={{ ...styles.navItem, fontSize: '10.5px', color: '#4b5563', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Icon.Calculator />
              SIMULA EL PRECIO DE UN ARCHIVO
            </li>
          </Link>

          {isAdmin && (
            <SidebarLink
              to="/admin"
              currentPath={location.pathname}
              icon={<Icon.Settings />}
              text="ADMINISTRACIÓN"
              onClick={() => setIsMenuOpen(false)}
              activeStyle={styles.navItemActive}
              inactiveStyle={styles.navItem}
            />
          )}

          {perfilIncompleto && (
            <Link to="/perfil" style={{ textDecoration: 'none', display: 'block', margin: '14px 10px 4px' }} onClick={() => setIsMenuOpen(false)}>
              <li style={{
                listStyle: 'none',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '11px 12px',
                borderRadius: '9px',
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                color: '#fbbf24',
                fontSize: '11px',
                lineHeight: 1.4,
                fontWeight: 600
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}>
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span>Debes terminar de completar la información de tu perfil.</span>
              </li>
            </Link>
          )}
        </ul>

        {/* CONTENEDOR BOTÓN INFERIOR (MODO Y SALIR) */}
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', padding: '18px', marginTop: 'auto', position: 'relative', zIndex: 1010 }}>

          <button
            onClick={toggleTheme}
            style={styles.themeToggle}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.color = '#9ca3af';
            }}
          >
            <span>{darkMode ? "Modo Claro" : "Modo Oscuro"}</span>
            <span style={{ display: 'flex' }}>{darkMode ? <Icon.Sun /> : <Icon.Moon />}</span>
          </button>

          <button
            className="layout-logout-btn"
            onClick={async () => {
              try {
                await supabase.auth.signOut();
                localStorage.clear();
                navigate('/login');
              } catch (error) {
                console.error("Error al cerrar sesión:", error.message);
                navigate('/login');
              }
            }}
            style={styles.logoutBtn}
          >
            <Icon.LogOut /> Salir
          </button>
        </div>
      </aside>

      <main style={styles.main}>
        <div style={styles.topBarStatus}>
          <span className="layout-status-dot" style={styles.statusDot} />
          {status.mensaje}
        </div>

        <header style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} style={styles.menuButton}>
              {isMenuOpen ? <Icon.Close /> : <Icon.Menu />}
            </button>
            <div style={{ fontSize: isMobile ? '12px' : '14px', fontWeight: '800', color: '#ffffff', letterSpacing: '0.5px' }}>
              {!isMobile && 'PORTAL DISTRIBUIDORES CHIPTUNING'}
            </div>
          </div>

          <div style={styles.creditPill}>
            <Icon.Card style={{ color: '#ffedd5' }} />
            <span style={{ color: '#ffffff', fontSize: '15px', fontWeight: '800' }}>{dbCredits.toLocaleString('es-CL')}</span>
            <span style={{ display: isMobile ? 'none' : 'inline', color: '#ffedd5', fontSize: '11px', fontWeight: 600 }}>Credits</span>
            <span style={{ width: '1px', height: '18px', backgroundColor: 'rgba(255,255,255,0.25)' }} />
            <div style={styles.avatarCircle}>{displayName.charAt(0).toUpperCase()}</div>
            <span style={{ color: '#ffffff', fontSize: isMobile ? '11px' : '13px', fontWeight: 700 }}>{displayName.split(' ')[0]}</span>
          </div>
        </header>

        <Outlet context={{ darkMode }} />
      </main>

      {isMobile && isMenuOpen && (
        <div
          onClick={() => setIsMenuOpen(false)}
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(2px)', zIndex: 999 }}
        />
      )}
    </div>
  );
};

export default Layout;