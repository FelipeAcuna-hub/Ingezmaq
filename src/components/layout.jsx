import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient'; 
import logoImg from '../../img/logoingezmaq.png';

// --- SUB-COMPONENTE INTERACTIVO PARA LAS ANIMACIONES (HOVER) ---
const SidebarLink = ({ to, currentPath, icon, text, onClick, activeStyle, inactiveStyle }) => {
  const [isHovered, setIsHovered] = useState(false);
  const isActive = currentPath === to;

  const linkStyle = {
    textDecoration: 'none',
    display: 'block',
    transition: 'all 0.25s ease',
    transform: isHovered && !isActive ? 'translateX(6px)' : 'translateX(0)',
  };

  const itemStyle = isActive 
    ? activeStyle 
    : {
        ...inactiveStyle,
        backgroundColor: isHovered ? 'rgba(37, 99, 235, 0.15)' : 'transparent',
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
          marginRight: '12px', 
          display: 'inline-block',
          transform: isHovered ? 'scale(1.2)' : 'scale(1)',
          transition: 'transform 0.2s ease' 
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
  const [status, setStatus] = useState({ is_online: true, mensaje: 'SISTEMA INGEZMAQ ONLINE' });

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isMobile = window.innerWidth < 768;

  // --- OBTENER ROL ADMINISTRADOR EN TIEMPO REAL ---
  const ADMIN_EMAILS = [
    'sebastianzunigavaldivia@gmail.com',
    'oliver.zuniga@gmail.com',
    'focaldevs@gmail.com'
  ];
  const isAdmin = ADMIN_EMAILS.includes(session?.user?.email?.toLowerCase());

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

    const updateBannerLocal = () => {
      const isScheduleOnline = checkAutoOnline();
      if (isScheduleOnline) {
        setStatus({ is_online: true, mensaje: "SISTEMA ONLINE - INGEZMAQ PROCESANDO" });
      } else {
        setStatus({ is_online: false, mensaje: "FUERA DE HORARIO DE ATENCIÓN" });
      }
    };

    fetchUserData();
    updateBannerLocal();
    const timer = setInterval(updateBannerLocal, 60000);

    return () => clearInterval(timer);
  }, [session]);

  const styles = {
    container: { 
      display: 'flex', 
      height: '100vh', 
      width: '100vw', 
      background: 'linear-gradient(180deg, #030712 0%, #02040a 100%)', 
      fontFamily: 'sans-serif', 
      margin: 0, 
      padding: 0, 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      overflow: 'hidden' 
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
      borderRight: '1px solid rgba(255, 255, 255, 0.05)', 
      transition: 'transform 0.3s ease-in-out',
      transform: isMobile && !isMenuOpen ? 'translateX(-100%)' : 'translateX(0)'
    },
    logoContainer: {
      padding: '20px 24px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      textDecoration: 'none',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    },
    logoImg: {
      width: '100%',
      maxWidth: '180px',
      height: 'auto',
      objectFit: 'contain'
    },
    navItem: { padding: '15px 24px', cursor: 'pointer', color: '#9ca3af', listStyle: 'none', textDecoration: 'none', display: 'flex', alignItems: 'center', fontSize: '13px', transition: 'all 0.2s ease' },
    navItemActive: { padding: '15px 24px', color: 'white', backgroundColor: '#2563eb', listStyle: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', fontSize: '13px', borderRadius: '4px', margin: '0 10px' },
    main: { 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column', 
      overflowY: 'auto', 
      width: '100%',
      backgroundColor: '#000000' 
    },
    header: {
      backgroundColor: '#ea580c', 
      padding: isMobile ? '10px 15px' : '15px 30px', 
      borderBottom: '1px solid #c2410c', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      flexShrink: 0,
      minHeight: '65px',
      position: 'relative',
      zIndex: 10
    },
    // Restablecido el estilo nativo del Banner de Horarios
    topBarStatus: { 
      backgroundColor: status.is_online ? '#16a34a' : '#dc2626', 
      color: 'white', 
      padding: isMobile ? '8px' : '12px 20px', 
      fontWeight: 'bold', 
      fontSize: isMobile ? '11px' : '13px', 
      textAlign: 'center', 
      transition: '0.5s', 
      flexShrink: 0 
    },
    menuButton: {
      display: isMobile ? 'block' : 'none',
      backgroundColor: 'transparent',
      color: '#ffffff', 
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      padding: '0',
      marginRight: '10px'
    }
  };

  return (
    <div style={styles.container}>
      <aside style={styles.sidebar}>
        <Link to="/" style={styles.logoContainer} onClick={() => setIsMenuOpen(false)}>
          <img src={logoImg} alt="Ingezmaq Logo" style={styles.logoImg} />
        </Link>

        <ul style={{ padding: '10px 0', margin: 0, listStyle: 'none', overflowY: 'auto' }}>
          <SidebarLink 
            to="/" 
            currentPath={location.pathname} 
            icon="💠" 
            text="DASHBOARD" 
            onClick={() => setIsMenuOpen(false)} 
            activeStyle={styles.navItemActive} 
            inactiveStyle={styles.navItem} 
          />

          <SidebarLink 
            to="/perfil" 
            currentPath={location.pathname} 
            icon="👤" 
            text="PERFIL" 
            onClick={() => setIsMenuOpen(false)} 
            activeStyle={styles.navItemActive} 
            inactiveStyle={styles.navItem} 
          />

          <SidebarLink 
            to="/historial" 
            currentPath={location.pathname} 
            icon="💳" 
            text="CRÉDITOS" 
            onClick={() => setIsMenuOpen(false)} 
            activeStyle={styles.navItemActive} 
            inactiveStyle={styles.navItem} 
          />

          <SidebarLink 
            to="/tickets" 
            currentPath={location.pathname} 
            icon="💬" 
            text="TICKETS" 
            onClick={() => setIsMenuOpen(false)} 
            activeStyle={styles.navItemActive} 
            inactiveStyle={styles.navItem} 
          />

          <SidebarLink 
            to="/archivos" 
            currentPath={location.pathname} 
            icon="📄" 
            text="ARCHIVOS" 
            onClick={() => setIsMenuOpen(false)} 
            activeStyle={styles.navItemActive} 
            inactiveStyle={styles.navItem} 
          />

          {isAdmin && (
            <SidebarLink 
              to="/clientes" 
              currentPath={location.pathname} 
              icon="👥" 
              text="CLIENTES" 
              onClick={() => setIsMenuOpen(false)} 
              activeStyle={styles.navItemActive} 
              inactiveStyle={styles.navItem} 
            />
          )}

          <Link to="/simulador" style={{ textDecoration: 'none', marginTop: '20px', display: 'block' }} onClick={() => setIsMenuOpen(false)}>
            <li style={{ ...styles.navItem, fontSize: '11px', color: '#4b5563' }}>
              SIMULA EL PRECIO DE UN ARCHIVO
            </li>
          </Link>

          {isAdmin && (
            <SidebarLink 
              to="/admin" 
              currentPath={location.pathname} 
              icon="⚙️" 
              text="ADMINISTRACIÓN" 
              onClick={() => setIsMenuOpen(false)} 
              activeStyle={styles.navItemActive} 
              inactiveStyle={styles.navItem} 
            />
          )}
        </ul>

        {/* CONTENEDOR BOTÓN INFERIOR DE SALIR */}
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', padding: '20px', marginTop: 'auto', position: 'relative', zIndex: 1010 }}>
          <button
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
            style={{
              width: '100%',
              backgroundColor: 'transparent',
              color: '#ef4444',
              border: '1px solid #ef4444',
              padding: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              borderRadius: '4px',
              fontSize: '11px',
              textTransform: 'uppercase',
              position: 'relative',
              zIndex: 1020
            }}
          >
            Salir
          </button>
        </div>
      </aside>

      <main style={styles.main}>
        {/* 🚨 RESTITUIDO: Banner de control de horario de atención automático */}
        <div style={styles.topBarStatus}>{status.mensaje}</div>
        
        {/* CABECERA CONFIGURADA EN TONOS BLANCOS SOBRE NARANJA */}
        <header style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} style={styles.menuButton}>
              {isMenuOpen ? '✕' : '☰'}
            </button>
            <div style={{ fontSize: isMobile ? '12px' : '14px', fontWeight: '800', color: '#ffffff', letterSpacing: '0.5px' }}>
              {!isMobile && 'PORTAL CORPORATIVO INGEZMAQ'}
            </div>
          </div>
          <div style={{ fontSize: isMobile ? '11px' : '13px', fontWeight: 'bold', color: '#ffedd5', textAlign: 'right' }}>
            💳 <span style={{ color: '#ffffff', fontSize: '15px', fontWeight: '800' }}>{dbCredits.toLocaleString('es-CL')}</span> <span style={{ display: isMobile ? 'none' : 'inline', color: '#ffedd5' }}>CLP</span> &nbsp;&nbsp;&nbsp;&nbsp; 👤 <span style={{ color: '#ffffff' }}>{displayName.split(' ')[0]}</span>
          </div>
        </header>

        <Outlet />
      </main>

      {isMobile && isMenuOpen && (
        <div
          onClick={() => setIsMenuOpen(false)}
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 999 }}
        />
      )}
    </div>
  );
};

export default Layout;