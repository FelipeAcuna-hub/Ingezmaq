import React, { useState, useEffect, useCallback } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import logoImg from '../../img/logoingezmaq.png';

// --- ICONOS SVG EN LÍNEA (sin dependencias externas) ---
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

// --- SUB-COMPONENTE INTERACTIVO PARA LAS ANIMACIONES (HOVER) ---
const SidebarLink = ({ to, currentPath, icon, text, onClick, activeStyle, inactiveStyle }) => {
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
      <li style={itemStyle}>
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
      </li>
    </Link>
  );
};

// --- FUNCIÓN DE CÁLCULO DE HORARIO CHILENO ---
const checkAutoOnline = () => {
  const chileTime = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Santiago",
    hour: "numeric", hour12: false, weekday: "long",
  }).formatToParts(new Date());

  const hour = parseInt(chileTime.find(p => p.type === 'hour').value);
  const day = chileTime.find(p => p.type === 'weekday').value;

  const isWorkDay = !['Sunday'].includes(day);
  const morningShift = hour >= 9 && hour < 13;
  const afternoonShift = day !== 'Saturday' && hour >= 15 && hour < 19;

  return isWorkDay && (morningShift || afternoonShift);
};

const Layout = ({ session }) => {
  const [dbCredits, setDbCredits] = useState(0);
  const [displayName, setDisplayName] = useState("USUARIO");
  const [status, setStatus] = useState({ is_online: true, mensaje: 'CARGANDO ESTADO...' });

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // --- ESTADO PARA EL MODO CLARO / OSCURO ---
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : true;
  });

  // --- RESPONSIVE REACTIVO ---
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // --- OBTENER ROL ADMINISTRADOR EN TIEMPO REAL ---
  const ADMIN_EMAILS = [
    'sebastianzunigavaldivia@gmail.com',
    'oliver.zuniga@gmail.com',
    'focaldevs@gmail.com'
  ];
  const isAdmin = ADMIN_EMAILS.includes(session?.user?.email?.toLowerCase());
  // 🛠️ FUNCIÓN DE SINCRONIZACIÓN MAESTRA EN LAYOUT
  const updateBannerStatus = useCallback(async () => {
    try {
      // Consultamos el estado real con un select directo sin filtros complejos
      const { data, error } = await supabase
        .from('configuracion_global')
        .select('is_online')
        .eq('id', 'atencion_cliente')
        .single();

      if (error) throw error;

      const dbState = data?.is_online;

      // Validaciones robustas para strings y booleanos de Supabase
      const isAuto = dbState === 'auto' || dbState === true || dbState === "true";
      const isManualOff = dbState === 'manual_off' || dbState === false || dbState === "false";

      // Calculamos el horario automático local
      const isScheduleOnline = checkAutoOnline();

      if (isAuto) {
        if (isScheduleOnline) {
          setStatus({ is_online: true, mensaje: "SISTEMA ONLINE - INGEZMAQ PROCESANDO" });
        } else {
          setStatus({ is_online: false, mensaje: "FUERA DE HORARIO DE ATENCIÓN" });
        }
      } else if (isManualOff) {
        setStatus({ is_online: false, mensaje: "FUERA DE HORARIO DE ATENCIÓN (CERRADO POR ADMINISTRACIÓN)" });
      } else {
        // Por si acaso existiera otro estado residual
        setStatus({ is_online: false, mensaje: "SISTEMA FUERA DE SERVICIO" });
      }

    } catch (err) {
      console.error("Error actualizando banner corporativo:", err);
      const localSchedule = checkAutoOnline();
      setStatus({
        is_online: localSchedule,
        mensaje: localSchedule ? "SISTEMA ONLINE - INGEZMAQ PROCESANDO" : "FUERA DE HORARIO DE ATENCIÓN"
      });
    }
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      if (session?.user) {
        const { data, error = null } = await supabase
          .from('profiles')
          .select('credits, full_name')
          .eq('id', session.user.id)
          .single();

        if (data && !error) {
          setDbCredits(data.credits || 0);
          setDisplayName(data.full_name || session.user.email.split('@')[0]);
        }
      }
    };

    fetchUserData();
    updateBannerStatus();

    // Sincronización automática cada un minuto
    const timer = setInterval(updateBannerStatus, 60000);

    // ⚡ ESCUCHADOR EN VIVO: Oye el evento disparado instantáneamente desde la sección Admin
    window.addEventListener('config-updated', updateBannerStatus);

    return () => {
      clearInterval(timer);
      window.removeEventListener('config-updated', updateBannerStatus);
    };
  }, [session, updateBannerStatus]);

  const toggleTheme = () => {
    const nextMode = !darkMode;
    setDarkMode(nextMode);
    localStorage.setItem('theme', nextMode ? 'dark' : 'light');
  };

  const styles = {
    container: {
      display: 'flex',
      height: '100vh',
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
      height: '100vh',
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
    instagramBrand: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      color: '#9ca3af',
      fontSize: '12px',
      textDecoration: 'none',
      transition: 'color 0.2s ease',
      cursor: 'pointer'
    },
    navItem: { padding: '13px 20px', cursor: 'pointer', color: '#9ca3af', listStyle: 'none', textDecoration: 'none', display: 'flex', alignItems: 'center', fontSize: '12.5px', fontWeight: 600, letterSpacing: '0.02em', borderRadius: '9px', margin: '2px 10px', transition: 'all 0.2s ease' },
    navItemActive: { padding: '13px 20px', color: 'white', background: 'linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%)', listStyle: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', fontSize: '12.5px', letterSpacing: '0.02em', borderRadius: '9px', margin: '2px 10px', boxShadow: '0 4px 14px rgba(37,99,235,0.35)' },
    main: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      width: '100%',
      backgroundColor: darkMode ? '#000000' : '#ffffff'
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
      borderRadius: '9px',
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
      borderRadius: '9px',
      fontSize: '11px',
      textTransform: 'uppercase',
      position: 'relative',
      zIndex: 1020,
      transition: 'all 0.2s ease'
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        .layout-nav-scroll::-webkit-scrollbar { width: 5px; }
        .layout-nav-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 10px; }
        .layout-logout-btn:hover { background-color: rgba(239,68,68,0.12); border-color: #ef4444; }
        .layout-simulador-item:hover { background-color: rgba(255,255,255,0.05); color: #d1d5db !important; }
        @keyframes layoutPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
        .layout-status-dot { animation: layoutPulse 2s ease-in-out infinite; }
      `}</style>

      <aside style={styles.sidebar}>

        <div style={styles.logoContainer}>
          <Link to="/" style={{ display: 'block', width: '100%', textAlign: 'center' }} onClick={() => setIsMenuOpen(false)}>
            <img src={logoImg} alt="Ingezmaq Logo" style={styles.logoImg} />
          </Link>

          <a
            href="https://www.instagram.com/ingezmaq"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.instagramBrand}
            onMouseEnter={(e) => e.currentTarget.style.color = '#e1306c'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
            <span>ingezmaq</span>
          </a>
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

          <SidebarLink
            to="/tickets"
            currentPath={location.pathname}
            icon={<Icon.Chat />}
            text="TICKETS"
            onClick={() => setIsMenuOpen(false)}
            activeStyle={styles.navItemActive}
            inactiveStyle={styles.navItem}
          />

          <SidebarLink
            to="/archivos"
            currentPath={location.pathname}
            icon={<Icon.File />}
            text="ARCHIVOS"
            onClick={() => setIsMenuOpen(false)}
            activeStyle={styles.navItemActive}
            inactiveStyle={styles.navItem}
          />

          {isAdmin && (
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
              {!isMobile && 'PORTAL DISTRIBUIDORES INGEZMAQ'}
            </div>
          </div>

          <div style={styles.creditPill}>
            <Icon.Card style={{ color: '#ffedd5' }} />
            <span style={{ color: '#ffffff', fontSize: '15px', fontWeight: '800' }}>{dbCredits.toLocaleString('es-CL')}</span>
            <span style={{ display: isMobile ? 'none' : 'inline', color: '#ffedd5', fontSize: '11px', fontWeight: 600 }}>CLP</span>
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