import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

// --- FUNCIÓN DE CÁLCULO DE HORARIO CHILENO (MANTENIDA) ---
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
  // Datos locales fijos para desarrollo de Ingezmaq sin Supabase
  const [dbCredits, setDbCredits] = useState(150000); // Créditos de prueba
  const [displayName, setDisplayName] = useState("FELIPE ACUÑA"); // Usuario por defecto
  const [status, setStatus] = useState({ is_online: true, mensaje: 'SISTEMA INGEZMAQ ONLINE' });
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  // Roles fijos en desarrollo
  const isAdmin = true; 
  const isMobile = window.innerWidth < 768;

  useEffect(() => {
    // Lógica del reloj de atención adaptada a modo local
    const updateBannerLocal = () => {
      const isScheduleOnline = checkAutoOnline();
      if (isScheduleOnline) {
        setStatus({ is_online: true, mensaje: "SISTEMA ONLINE - INGEZMAQ PROCESANDO" });
      } else {
        setStatus({ is_online: false, mensaje: "FUERA DE HORARIO DE ATENCIÓN" });
      }
    };

    updateBannerLocal();
    const timer = setInterval(updateBannerLocal, 60000);

    return () => clearInterval(timer);
  }, [session]);

  const styles = {
    container: { display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif', margin: 0, padding: 0, position: 'fixed', top: 0, left: 0, overflow: 'hidden' },
    sidebar: { 
      width: '260px', 
      backgroundColor: '#1f2937', // Cambiado a un gris oscuro industrial para Ingezmaq
      color: 'white', 
      display: 'flex', 
      flexDirection: 'column', 
      shrink: 0,
      position: isMobile ? 'fixed' : 'relative',
      zIndex: 1000,
      height: '100vh',
      transition: 'transform 0.3s ease-in-out',
      transform: isMobile && !isMenuOpen ? 'translateX(-100%)' : 'translateX(0)'
    },
    logoContainer: { 
      padding: '24px', 
      borderBottom: '1px solid #374151', 
      textDecoration: 'none', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      color: '#fff',
      fontWeight: 'bold',
      fontSize: '20px',
      letterSpacing: '1px'
    },
    navItem: { padding: '15px 24px', cursor: 'pointer', color: '#9ca3af', listStyle: 'none', textDecoration: 'none', display: 'flex', alignItems: 'center', fontSize: '13px' },
    navItemActive: { padding: '15px 24px', color: 'white', backgroundColor: '#2563eb', listStyle: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', fontSize: '13px' }, // Cambiado a Azul para Ingezmaq
    main: { flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', width: '100%' },
    header: { 
      backgroundColor: 'white', 
      padding: isMobile ? '10px 15px' : '15px 30px', 
      borderBottom: '1px solid #ddd', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      shrink: 0,
      minHeight: '60px'
    },
    topBarStatus: { backgroundColor: status.is_online ? '#16a34a' : '#dc2626', color: 'white', padding: isMobile ? '8px' : '12px 20px', fontWeight: 'bold', fontSize: isMobile ? '11px' : '13px', textAlign: 'center', transition: '0.5s' },
    menuButton: {
      display: isMobile ? 'block' : 'none',
      backgroundColor: 'transparent',
      color: '#2563eb',
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
        {/* CORRECCIÓN: Reemplazado temporalmente por un título de texto para evitar caídas por imágenes ausentes */}
        <Link to="/" style={styles.logoContainer} onClick={() => setIsMenuOpen(false)}>
          <span>INGEZMAQ</span>
        </Link>

        <ul style={{ padding: 0, margin: 0, listStyle: 'none', flex: 1 }}>
          <Link to="/" style={{ textDecoration: 'none' }} onClick={() => setIsMenuOpen(false)}>
            <li style={location.pathname === "/" ? styles.navItemActive : styles.navItem}>
              <span style={{ marginRight: '12px' }}>💠</span> DASHBOARD
            </li>
          </Link>
          <Link to="/perfil" style={{ textDecoration: 'none' }} onClick={() => setIsMenuOpen(false)}>
            <li style={location.pathname === "/perfil" ? styles.navItemActive : styles.navItem}>
              <span style={{ marginRight: '12px' }}>👤</span> PERFIL
            </li>
          </Link>
          <Link to="/historial" style={{ textDecoration: 'none' }} onClick={() => setIsMenuOpen(false)}>
            <li style={location.pathname === "/historial" ? styles.navItemActive : styles.navItem}>
              <span style={{ marginRight: '12px' }}>💳</span> CRÉDITOS</li>
          </Link>
          <Link to="/tickets" style={{ textDecoration: 'none' }} onClick={() => setIsMenuOpen(false)}>
            <li style={location.pathname === "/tickets" ? styles.navItemActive : styles.navItem}>
              <span style={{ marginRight: '12px' }}>💬</span> TICKETS
            </li>
          </Link>
          <Link to="/archivos" style={{ textDecoration: 'none' }} onClick={() => setIsMenuOpen(false)}>
            <li style={location.pathname === "/archivos" ? styles.navItemActive : styles.navItem}>
              <span style={{ marginRight: '12px' }}>📄</span> ARCHIVOS
            </li>
          </Link>

          {isAdmin && (
            <Link to="/clientes" style={{ textDecoration: 'none' }} onClick={() => setIsMenuOpen(false)}>
              <li style={location.pathname === "/clientes" ? styles.navItemActive : styles.navItem}>
                <span style={{ marginRight: '12px' }}>👥</span> CLIENTES
              </li>
            </Link>
          )}

          <Link to="/simulador" style={{ textDecoration: 'none', marginTop: '20px', display: 'block' }} onClick={() => setIsMenuOpen(false)}>
            <li style={{ ...styles.navItem, fontSize: '11px', color: '#666' }}>SIMULA EL PRECIO DE UN ARCHIVO</li>
          </Link>
          
          {isAdmin && (
            <Link to="/admin" style={{ textDecoration: 'none', marginTop: '10px', display: 'block' }} onClick={() => setIsMenuOpen(false)}>
              <li style={location.pathname === "/admin" ? styles.navItemActive : styles.navItem}>⚙️ ADMINISTRACIÓN</li>
            </Link>
          )}
        </ul>
        <div style={{ borderTop: '1px solid #374151', padding: '20px' }}>
          <button onClick={() => console.log('Cerrar sesión simulado')} style={{ width: '100%', backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '12px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', fontSize: '11px', textTransform: 'uppercase' }}>SALIR</button>
        </div>
      </aside>

      <main style={styles.main}>
        <div style={styles.topBarStatus}>{status.mensaje}</div>
        <header style={styles.header}>
          <div style={{display: 'flex', alignItems: 'center'}}>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} style={styles.menuButton}>
              {isMenuOpen ? '✕' : '☰'}
            </button>
            <div style={{fontSize: isMobile ? '12px' : '14px', fontWeight: 'bold', color: '#2563eb'}}>
              {isMobile ? 'INGEZMAQ' : 'PORTAL CORPORATIVO INGEZMAQ'}
            </div>
          </div>
          <div style={{fontSize: isMobile ? '10px' : '12px', fontWeight: 'bold', color: '#555', textAlign: 'right'}}>
            💳 {dbCredits.toLocaleString('es-CL')} <span style={{display: isMobile ? 'none' : 'inline'}}>CLP</span> &nbsp;&nbsp; 👤 {displayName.split(' ')[0]}
          </div>
        </header>
        <Outlet /> 
      </main>

      {isMobile && isMenuOpen && (
        <div 
          onClick={() => setIsMenuOpen(false)}
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999 }}
        />
      )}
    </div>
  );
};

export default Layout;