import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// --- ICONOS SVG EN LÍNEA ---
const Icon = {
  Arrow: (props) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  Upload: (props) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  Bolt: (props) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Wrench: (props) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L2 19v3h3l7.3-7.3a4 4 0 0 0 5.4-5.4l-2.65 2.65a1 1 0 0 1-1.4 0l-1.6-1.6a1 1 0 0 1 0-1.4Z" />
    </svg>
  ),
  Whatsapp: (props) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.5 2 12.04 2Zm5.8 14.13c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.12.11-1.81-.11-.42-.13-.95-.31-1.64-.6-2.88-1.24-4.76-4.12-4.9-4.31-.14-.19-1.17-1.56-1.17-2.98 0-1.41.74-2.11 1-2.4.26-.29.57-.36.76-.36h.55c.18 0 .42-.07.65.5.24.58.82 2 .89 2.15.07.15.12.32.02.51-.1.19-.15.31-.3.48-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.29.76 1.25 1.63 2.02 1.12 1 2.06 1.31 2.35 1.46.29.15.46.13.63-.08.17-.21.72-.84.91-1.13.19-.29.38-.24.63-.14.26.1 1.65.78 1.93.92.29.14.48.21.55.33.07.12.07.68-.17 1.36Z" />
    </svg>
  ),
  Mail: (props) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 6-10 7L2 6" />
    </svg>
  ),
  Pin: (props) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Clock: (props) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Bell: (props) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
};

const Dashboard = ({ session }) => {
  const [hoveredBtn, setHoveredBtn] = useState(null);
  const [activeTicketAlert, setActiveTicketAlert] = useState(null);

  const { darkMode } = useOutletContext();

  // 🔔 CONSULTA SI EXISTE UN TICKET EXCLUSIVAMENTE EN ESTADO 'PENDIENTE'
  useEffect(() => {
    const checkActiveTickets = async () => {
      if (!session?.user?.id) return;

      const { data, error } = await supabase
        .from('tickets')
        .select('id, asunto, estado')
        .eq('user_id', session.user.id)
        .eq('estado', 'Pendiente') // 👈 Solo busca tickets con estado 'Pendiente'
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        setActiveTicketAlert(data[0]);
      } else {
        setActiveTicketAlert(null); // Si no hay pendientes, limpia la alerta
      }
    };

    checkActiveTickets();
  }, [session]);

  const styles = {
    container: {
      padding: '40px 30px 0 30px',
      backgroundColor: darkMode ? '#0f172a' : '#f3f4f6',
      minHeight: '100vh',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      boxSizing: 'border-box',
      color: darkMode ? '#ffffff' : '#1e293b',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      transition: 'all 0.3s ease'
    },

    // 🔔 BANNER DE NOTIFICACIÓN TICKET PENDIENTE
    ticketNoticeBanner: {
      backgroundColor: darkMode ? 'rgba(225, 29, 72, 0.15)' : '#ffe4e6',
      border: '1px solid #f43f5e',
      borderRadius: '14px',
      padding: '16px 24px',
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '15px',
      boxShadow: '0 4px 15px rgba(225, 29, 72, 0.2)'
    },
    ticketNoticeInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '14px'
    },
    ticketNoticeTitle: {
      margin: 0,
      fontSize: '14px',
      fontWeight: '700',
      color: darkMode ? '#fecdd3' : '#881337'
    },
    ticketNoticeSubtitle: {
      margin: '2px 0 0 0',
      fontSize: '12.5px',
      color: darkMode ? '#fda4af' : '#9f1239'
    },
    ticketNoticeBtn: {
      backgroundColor: '#e11d48',
      color: '#ffffff',
      padding: '8px 16px',
      borderRadius: '8px',
      fontSize: '12px',
      fontWeight: '700',
      textDecoration: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      boxShadow: '0 2px 8px rgba(225,29,72,0.4)'
    },

    heroBanner: {
      background: darkMode
        ? 'radial-gradient(circle at 15% 20%, #1e293b 0%, #0f172a 55%)'
        : 'radial-gradient(circle at 15% 20%, #1e3a5f 0%, #0f172a 65%)',
      color: 'white',
      padding: '54px 44px',
      borderRadius: '18px',
      textAlign: 'left',
      marginBottom: '36px',
      boxShadow: darkMode ? '0 10px 30px -5px rgba(0, 0, 0, 0.5)' : '0 20px 40px -12px rgba(15, 23, 42, 0.35)',
      position: 'relative',
      overflow: 'hidden',
      border: '1px solid rgba(96, 165, 250, 0.18)',
      transition: 'all 0.3s ease'
    },
    heroGlowOne: {
      position: 'absolute', top: '-90px', right: '-60px', width: '260px', height: '260px',
      borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.35) 0%, rgba(59,130,246,0) 70%)',
      pointerEvents: 'none'
    },
    heroGlowTwo: {
      position: 'absolute', bottom: '-100px', left: '20%', width: '220px', height: '220px',
      borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.18) 0%, rgba(34,197,94,0) 70%)',
      pointerEvents: 'none'
    },
    heroContent: { position: 'relative', zIndex: 1 },
    heroTag: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '7px',
      backgroundColor: 'rgba(59, 130, 246, 0.15)',
      color: '#60a5fa',
      fontSize: '11px',
      fontWeight: 'bold',
      padding: '6px 14px',
      borderRadius: '20px',
      textTransform: 'uppercase',
      letterSpacing: '1.5px',
      marginBottom: '18px',
      border: '1px solid rgba(96, 165, 250, 0.25)'
    },
    heroDot: {
      width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4ade80',
      boxShadow: '0 0 0 3px rgba(74, 222, 128, 0.25)'
    },
    heroTitle: {
      fontSize: '38px',
      fontWeight: '800',
      letterSpacing: '-0.5px',
      margin: '0 0 10px 0',
      textTransform: 'uppercase',
      lineHeight: 1.1
    },
    heroSubtitle: {
      fontSize: '15px',
      color: '#94a3b8',
      fontWeight: '400',
      margin: '0',
      letterSpacing: '0.5px',
      maxWidth: '520px'
    },
    actionGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '26px',
      marginBottom: '50px'
    },
    actionCard: {
      backgroundColor: darkMode ? '#1e293b' : '#ffffff',
      borderRadius: '16px',
      padding: '36px 30px',
      border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0',
      boxShadow: darkMode ? '0 4px 20px rgba(0, 0, 0, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.04), 0 10px 20px -6px rgba(0, 0, 0, 0.06)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      minHeight: '250px'
    },
    cardHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '18px',
      marginBottom: '18px'
    },
    iconWrapper: {
      width: '52px',
      height: '52px',
      borderRadius: '14px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0
    },
    cardTitle: {
      fontSize: '18px',
      fontWeight: '700',
      color: darkMode ? '#ffffff' : '#1e293b',
      margin: 0,
      letterSpacing: '0.2px'
    },
    cardDescription: {
      fontSize: '13.5px',
      color: darkMode ? '#94a3b8' : '#64748b',
      margin: '0 0 28px 0',
      lineHeight: '1.6',
      textAlign: 'left'
    },

    btnAction: (color, isHovered) => ({
      backgroundColor: color,
      color: 'white',
      padding: '14px 22px',
      borderRadius: '10px',
      fontWeight: '600',
      textDecoration: 'none',
      fontSize: '12.5px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      width: '100%',
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      boxShadow: isHovered ? `0 10px 22px ${color}55` : `0 4px 12px ${color}25`,
      transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
      filter: isHovered ? 'brightness(1.12)' : 'brightness(1)',
      transition: 'all 0.2s ease-in-out'
    }),

    footerContainer: {
      width: '100%',
      backgroundColor: darkMode ? '#0f172a' : '#ffffff',
      borderTop: darkMode ? '1px solid #334155' : '1px solid #e2e8f0',
      padding: '56px 0 28px 0',
      marginTop: '10px',
      boxSizing: 'border-box',
      transition: 'all 0.3s ease'
    },
    footerGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '40px',
      marginBottom: '36px',
      textAlign: 'left'
    },
    footerBrandTitle: {
      fontSize: '19px',
      fontWeight: 'bold',
      letterSpacing: '1px',
      margin: '0 0 12px 0',
      textTransform: 'uppercase',
      color: darkMode ? '#ffffff' : '#0f172a'
    },
    footerBrandAccent: {
      color: '#2563eb',
      fontWeight: '400'
    },
    footerBrandDesc: {
      fontSize: '13px',
      color: darkMode ? '#94a3b8' : '#64748b',
      lineHeight: '1.6',
      margin: 0
    },
    footerSectionTitle: {
      fontSize: '11.5px',
      fontWeight: 'bold',
      color: darkMode ? '#ffffff' : '#0f172a',
      textTransform: 'uppercase',
      letterSpacing: '1.5px',
      marginBottom: '18px'
    },
    footerContactItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '13px',
      color: darkMode ? '#94a3b8' : '#475569',
      marginBottom: '12px',
      textDecoration: 'none',
      transition: 'color 0.2s ease'
    },
    footerLink: {
      display: 'block',
      fontSize: '13px',
      color: darkMode ? '#94a3b8' : '#475569',
      textDecoration: 'none',
      marginBottom: '12px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      transition: 'color 0.2s ease'
    },
    footerBottom: {
      borderTop: darkMode ? '1px solid #334155' : '1px solid #e2e8f0',
      paddingTop: '22px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '15px',
      fontSize: '11px',
      color: darkMode ? '#64748b' : '#94a3b8'
    },
    focaldevLink: {
      color: '#2563eb',
      textDecoration: 'none',
      fontWeight: 'bold',
      letterSpacing: '1px'
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes dashFadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .dash-card { animation: dashFadeUp 0.35s ease both; transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease; }
        .dash-card:hover { transform: translateY(-4px); }
        .dash-card:hover .dash-icon-wrapper { transform: scale(1.06); }
        .dash-icon-wrapper { transition: transform 0.2s ease; }
        .dash-btn-arrow { transition: transform 0.2s ease; }
        .dash-btn:hover .dash-btn-arrow { transform: translateX(3px); }
        @keyframes bellPulse { 0% { transform: scale(1); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
        .bell-icon-pulse { animation: bellPulse 1.5s infinite; color: #e11d48; }
      `}</style>

      {/* CUERPO PRINCIPAL DEL DASHBOARD */}
      <div>

        {/* 🔔 BANNER DE ALERTA DE TICKET PENDIENTE */}
        {activeTicketAlert && (
          <div style={styles.ticketNoticeBanner}>
            <div style={styles.ticketNoticeInfo}>
              <div className="bell-icon-pulse">
                <Icon.Bell />
              </div>
              <div>
                <h4 style={styles.ticketNoticeTitle}>
                  Tienes un ticket pendiente: "{activeTicketAlert.asunto}"
                </h4>
                <p style={styles.ticketNoticeSubtitle}>
                  Estado actual: <strong>PENDIENTE</strong>. Haz clic para ver los detalles y comunicarte con soporte.
                </p>
              </div>
            </div>
            <Link to="/tickets" style={styles.ticketNoticeBtn}>
              IR AL CHAT
              <Icon.Arrow />
            </Link>
          </div>
        )}

        {/* 1. HERO BANNER REDISEÑADO */}
        <div style={styles.heroBanner}>
          <div style={styles.heroGlowOne} />
          <div style={styles.heroGlowTwo} />
          <div style={styles.heroContent}>
            <div style={styles.heroTag}>
              <span style={styles.heroDot} />
              Plataforma Reseller
            </div>
            <h1 style={styles.heroTitle}>Dealer Online Global</h1>
            <p style={styles.heroSubtitle}>CHIPTUNING — Portal de Gestión Técnica Avanzada</p>
          </div>
        </div>

        {/* 2. GRILLA DE OPERACIONES */}
        <div style={styles.actionGrid}>

          {/* OPERACIÓN 1: ARCHIVOS */}
          <div className="dash-card" style={{ ...styles.actionCard, animationDelay: '0ms' }}>
            <div>
              <div style={styles.cardHeader}>
                <div className="dash-icon-wrapper" style={{ ...styles.iconWrapper, backgroundColor: 'rgba(37, 99, 235, 0.1)', color: '#60a5fa' }}>
                  <Icon.Upload />
                </div>
                <h3 style={styles.cardTitle}>Subir Archivos</h3>
              </div>
              <p style={styles.cardDescription}>
                Transfiere tus lecturas de cartografías y datos técnicos directamente al servidor para análisis inmediato.
              </p>
            </div>
            <Link
              className="dash-btn"
              to="/upload"
              style={styles.btnAction('#2563eb', hoveredBtn === 'archivos')}
              onMouseEnter={() => setHoveredBtn('archivos')}
              onMouseLeave={() => setHoveredBtn(null)}
            >
              Iniciar Carga
              <Icon.Arrow className="dash-btn-arrow" />
            </Link>
          </div>

          {/* OPERACIÓN 2: CRÉDITOS */}
          <div className="dash-card" style={{ ...styles.actionCard, animationDelay: '60ms' }}>
            <div>
              <div style={styles.cardHeader}>
                <div className="dash-icon-wrapper" style={{ ...styles.iconWrapper, backgroundColor: 'rgba(22, 163, 74, 0.1)', color: '#4ade80' }}>
                  <Icon.Bolt />
                </div>
                <h3 style={styles.cardTitle}>Fondos de Cuenta</h3>
              </div>
              <p style={styles.cardDescription}>
                Abastece tu balance de forma instantánea vía Webpay o Mercado Pago para mantener tu taller operando sin pausas.
              </p>
            </div>
            <Link
              className="dash-btn"
              to="/creditos"
              style={styles.btnAction('#16a34a', hoveredBtn === 'creditos')}
              onMouseEnter={() => setHoveredBtn('creditos')}
              onMouseLeave={() => setHoveredBtn(null)}
            >
              Cargar Créditos
              <Icon.Arrow className="dash-btn-arrow" />
            </Link>
          </div>

          {/* OPERACIÓN 3: SOPORTE */}
          <div className="dash-card" style={{ ...styles.actionCard, animationDelay: '120ms' }}>
            <div>
              <div style={styles.cardHeader}>
                <div className="dash-icon-wrapper" style={{ ...styles.iconWrapper, backgroundColor: 'rgba(71, 85, 105, 0.1)', color: '#94a3b8', border: darkMode ? '1px solid #475569' : '1px solid #ddd' }}>
                  <Icon.Wrench />
                </div>
                <h3 style={styles.cardTitle}>Mesa de Soporte</h3>
              </div>
              <p style={styles.cardDescription}>
                Contacta directo con ingenieros de soporte técnico. Tiempo estimado de respuesta: 15 - 45 minutos.
              </p>
            </div>
            <Link
              className="dash-btn"
              to="/tickets"
              style={styles.btnAction(darkMode ? '#475569' : '#1f2937', hoveredBtn === 'tickets')}
              onMouseEnter={() => setHoveredBtn('tickets')}
              onMouseLeave={() => setHoveredBtn(null)}
            >
              Abrir Ticket
              <Icon.Arrow className="dash-btn-arrow" />
            </Link>
          </div>

        </div>
      </div>

      {/* 3. FOOTER CORPORATIVO */}
      <footer style={styles.footerContainer}>
        <div style={styles.footerGrid}>

          {/* Columna 1: Branding */}
          <div>
            <h4 style={styles.footerBrandTitle}>
              CHIP<span style={styles.footerBrandAccent}>TUNING</span>
            </h4>
            <p style={styles.footerBrandDesc}>
              Plataforma de gestión de archivos para Partners.
            </p>
          </div>

          {/* Columna 2: Contacto Técnico */}
          <div>
            <h4 style={styles.footerSectionTitle}>Contacto Técnico</h4>
            <a
              href="https://wa.me/56997525948"
              target="_blank"
              rel="noreferrer"
              style={styles.footerContactItem}
              onMouseEnter={(e) => e.currentTarget.style.color = '#25d366'}
              onMouseLeave={(e) => e.currentTarget.style.color = darkMode ? '#94a3b8' : '#475569'}
            >
              <Icon.Whatsapp /> +56 9 9752 5948 (WhatsApp)
            </a>
            <a
              href="mailto:alientechchile@gmail.com"
              style={styles.footerContactItem}
              onMouseEnter={(e) => e.currentTarget.style.color = '#2563eb'}
              onMouseLeave={(e) => e.currentTarget.style.color = darkMode ? '#94a3b8' : '#475569'}
            >
              <Icon.Mail /> alientechchile@gmail.com
            </a>
            <div style={styles.footerContactItem}>
              <Icon.Clock /> Lun - Vie: 9:00 AM - 6:30 PM
            </div>
            <div style={styles.footerContactItem}>
              <Icon.Pin /> Chile
            </div>
          </div>

          {/* Columna 3: Plataforma */}
          <div>
            <h4 style={styles.footerSectionTitle}>Plataforma</h4>
            <Link
              to="/"
              style={styles.footerLink}
              onMouseEnter={(e) => e.currentTarget.style.color = '#2563eb'}
              onMouseLeave={(e) => e.currentTarget.style.color = darkMode ? '#94a3b8' : '#475569'}
            >Inicio</Link>
            <Link
              to="/upload"
              style={styles.footerLink}
              onMouseEnter={(e) => e.currentTarget.style.color = '#2563eb'}
              onMouseLeave={(e) => e.currentTarget.style.color = darkMode ? '#94a3b8' : '#475569'}
            >Archivos</Link>
          </div>

        </div>

        {/* Barra inferior */}
        <div style={styles.footerBottom}>
          <div>
            © 2026 CHIPTUNING WEB v1.2 — TODOS LOS DERECHOS RESERVADOS
          </div>
          <div>
            DESARROLLADO POR <a href="https://focaldev.cl" target="_blank" rel="noreferrer" style={styles.focaldevLink}>FOCALDEV</a>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Dashboard;