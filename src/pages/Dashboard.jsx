import React, { useState } from 'react'; // 🚀 Añadido useState para controlar el hover
import { Link } from 'react-router-dom';

const Dashboard = ({ session }) => {
  // 🔄 Estado para saber qué botón tiene el cursor encima ('archivos', 'creditos', 'tickets' o null)
  const [hoveredBtn, setHoveredBtn] = useState(null);
  
  const styles = {
    container: {
      padding: '40px 30px 0 30px', 
      backgroundColor: '#000000', 
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      boxSizing: 'border-box',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between' 
    },
    heroBanner: {
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      color: 'white',
      padding: '50px 40px',
      borderRadius: '12px',
      textAlign: 'left',
      marginBottom: '40px',
      boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.3)', 
      position: 'relative',
      overflow: 'hidden',
      borderLeft: '5px solid #3b82f6'
    },
    heroTag: {
      display: 'inline-block',
      backgroundColor: 'rgba(59, 130, 246, 0.15)',
      color: '#60a5fa',
      fontSize: '11px',
      fontWeight: 'bold',
      padding: '6px 12px',
      borderRadius: '20px',
      textTransform: 'uppercase',
      letterSpacing: '1.5px',
      marginBottom: '15px'
    },
    heroTitle: {
      fontSize: '36px',
      fontWeight: '800',
      letterSpacing: '-0.5px',
      margin: '0 0 8px 0',
      textTransform: 'uppercase'
    },
    heroSubtitle: {
      fontSize: '15px',
      color: '#94a3b8',
      fontWeight: '400',
      margin: '0',
      letterSpacing: '0.5px'
    },
    actionGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '30px',
      marginBottom: '50px'
    },
    actionCard: {
      backgroundColor: '#111111', 
      borderRadius: '12px',
      padding: '40px 30px',
      border: '1px solid #222222', 
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 10px 15px -3px rgba(0, 0, 0, 0.2)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      minHeight: '260px',
      transition: 'all 0.25s ease'
    },
    cardHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      marginBottom: '20px'
    },
    iconWrapper: {
      width: '50px',
      height: '50px',
      borderRadius: '10px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: '22px'
    },
    cardTitle: {
      fontSize: '18px',
      fontWeight: '700',
      color: '#ffffff', 
      margin: 0,
      letterSpacing: '0.3px'
    },
    cardDescription: {
      fontSize: '14px',
      color: '#9ca3af', 
      margin: '0 0 30px 0',
      lineHeight: '1.6',
      textAlign: 'left'
    },
    
    // 🚀 MODIFICADO: Sistema dinámico con animaciones de transformación y sombras dinámicas en el Hover
    btnAction: (color, isHovered) => ({
      backgroundColor: color,
      color: 'white',
      padding: '14px 24px',
      borderRadius: '8px',
      fontWeight: '600',
      textDecoration: 'none',
      fontSize: '13px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      width: '100%',
      textAlign: 'center',
      boxSizing: 'border-box',
      display: 'block',
      // Cambia la sombra y la escala dinámicamente si el cursor está encima
      boxShadow: isHovered ? `0 8px 20px ${color}50` : `0 4px 12px ${color}20`,
      transform: isHovered ? 'scale(1.02)' : 'scale(1)',
      filter: isHovered ? 'brightness(1.15)' : 'brightness(1)',
      transition: 'all 0.2s ease-in-out' // Transición suavizada para todos los componentes
    }),

    footerContainer: {
      width: '100%',
      backgroundColor: '#000000',
      borderTop: '1px solid #111111',
      padding: '60px 0 30px 0',
      marginTop: '60px',
      boxSizing: 'border-box'
    },
    footerGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '40px',
      marginBottom: '40px',
      textAlign: 'left'
    },
    footerBrandTitle: {
      fontSize: '20px',
      fontWeight: 'bold',
      letterSpacing: '1px',
      margin: '0 0 15px 0',
      textTransform: 'uppercase',
      color: '#ffffff'
    },
    footerBrandAccent: {
      color: '#1F2B9C', 
      fontWeight: '400',
      marginLeft: '8px'
    },
    footerBrandDesc: {
      fontSize: '13px',
      color: '#666666',
      lineHeight: '1.6',
      margin: 0
    },
    footerSectionTitle: {
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#ffffff',
      textTransform: 'uppercase',
      letterSpacing: '1.5px',
      marginBottom: '20px'
    },
    footerContactItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontSize: '13px',
      color: '#888888',
      marginBottom: '12px',
      textDecoration: 'none'
    },
    footerLink: {
      display: 'block',
      fontSize: '13px',
      color: '#888888',
      textDecoration: 'none',
      marginBottom: '12px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    footerBottom: {
      borderTop: '1px solid #111111',
      paddingTop: '25px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '15px',
      fontSize: '11px',
      color: '#444444'
    },
    focaldevLink: {
      color: '#1F2B9C', 
      textDecoration: 'none',
      fontWeight: 'bold',
      letterSpacing: '1px'
    }
  };

  return (
    <div style={styles.container}>
      
      {/* CUERPO PRINCIPAL DEL DASHBOARD */}
      <div>
        {/* 1. HERO BANNER REDISEÑADO */}
        <div style={styles.heroBanner}>
          <div style={styles.heroTag}>Plataforma Reseller</div>
          <h1 style={styles.heroTitle}>Dealer Online Global</h1>
          <p style={styles.heroSubtitle}>INGEZMAQ MOTORSPORT — Portal de Gestión Técnica Avanzada</p>
        </div>

        {/* 2. GRILLA DE OPERACIONES */}
        <div style={styles.actionGrid}>
          
          {/* OPERACIÓN 1: ARCHIVOS */}
          <div style={styles.actionCard}>
            <div>
              <div style={styles.cardHeader}>
                <div style={{ ...styles.iconWrapper, backgroundColor: 'rgba(37, 99, 235, 0.1)', color: '#60a5fa' }}>📁</div>
                <h3 style={styles.cardTitle}>Subir Archivos</h3>
              </div>
              <p style={styles.cardDescription}>
                Transfiere tus lecturas de cartografías y datos técnicos directamente al servidor para análisis inmediato.
              </p>
            </div>
            <Link 
              to="/upload" 
              style={styles.btnAction('#2563eb', hoveredBtn === 'archivos')}
              onMouseEnter={() => setHoveredBtn('archivos')}
              onMouseLeave={() => setHoveredBtn(null)}
            >
              Iniciar Carga
            </Link>
          </div>

          {/* OPERACIÓN 2: CRÉDITOS */}
          <div style={styles.actionCard}>
            <div>
              <div style={styles.cardHeader}>
                <div style={{ ...styles.iconWrapper, backgroundColor: 'rgba(22, 163, 74, 0.1)', color: '#4ade80' }}>⚡</div>
                <h3 style={styles.cardTitle}>Fondos de Cuenta</h3>
              </div>
              <p style={styles.cardDescription}>
                Abastece tu balance de forma instantánea vía Webpay o Mercado Pago para mantener tu taller operando sin pausas.
              </p>
            </div>
            <Link 
              to="/creditos" 
              style={styles.btnAction('#16a34a', hoveredBtn === 'creditos')}
              onMouseEnter={() => setHoveredBtn('creditos')}
              onMouseLeave={() => setHoveredBtn(null)}
            >
              Cargar Créditos
            </Link>
          </div>

          {/* OPERACIÓN 3: SOPORTE */}
          <div style={styles.actionCard}>
            <div>
              <div style={styles.cardHeader}>
                <div style={{ ...styles.iconWrapper, backgroundColor: 'rgba(71, 85, 105, 0.1)', color: '#94a3b8', border: '1px solid #333333' }}>🛠️</div>
                <h3 style={styles.cardTitle}>Mesa de Soporte</h3>
              </div>
              <p style={styles.cardDescription}>
                Contacta directo con ingenieros de soporte técnico. Tiempo estimado de respuesta: 15 - 45 minutos.
              </p>
            </div>
            <Link 
              to="/tickets" 
              style={styles.btnAction('#1f2937', hoveredBtn === 'tickets')}
              onMouseEnter={() => setHoveredBtn('tickets')}
              onMouseLeave={() => setHoveredBtn(null)}
            >
              Abrir Ticket
            </Link>
          </div>

        </div>
      </div>

      {/* 3. 🚀 FOOTER CORPORATIVO AVANZADO INGEZMAQ */}
      <footer style={styles.footerContainer}>
        <div style={styles.footerGrid}>
          
          {/* Columna 1: Branding */}
          <div>
            <h4 style={styles.footerBrandTitle}>
              INGEZMAQ<span style={styles.footerBrandAccent}>MOTORSPORT</span>
            </h4>
            <p style={styles.footerBrandDesc}>
              Plataforma de traspaso de archivos para Distribuidores.
            </p>
          </div>

          {/* Columna 2: Contacto Técnico */}
          <div>
            <h4 style={styles.footerSectionTitle}>Contacto Técnico</h4>
            <a href="https://wa.me/56984996539" target="_blank" rel="noreferrer" style={styles.footerContactItem}>
              <span>📞</span> +56 9 8499 6539 (WhatsApp)
            </a>
            <a href="mailto:alientechchile@gmail.com" style={styles.footerContactItem}>
              <span>✉️</span> alientechchile@gmail.com
            </a>
            <div style={styles.footerContactItem}>
              <span>📍</span> Chile — Despacho Internacional
            </div>
          </div>

          {/* Columna 3: Plataforma */}
          <div>
            <h4 style={styles.footerSectionTitle}>Plataforma</h4>
            <Link to="/" style={styles.footerLink}>Inicio</Link>
            <Link to="/upload" style={styles.footerLink}>Archivos</Link>
          </div>

        </div>

        {/* Barra inferior de Copyright y Créditos */}
        <div style={styles.footerBottom}>
          <div>
            © 2026 INGEZMAQ WEB v1.5 — TODOS LOS DERECHOS RESERVADOS
          </div>
          <div>
            DESARROLLADO POR <a href="https://focaldevs.com" target="_blank" rel="noreferrer" style={styles.focaldevLink}>FOCALDEV</a>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Dashboard;