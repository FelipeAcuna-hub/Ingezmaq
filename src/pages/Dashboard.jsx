import React from 'react';
import { Link } from 'react-router-dom';

const Dashboard = ({ session }) => {
  
  const styles = {
    container: {
      padding: '40px 30px',
      backgroundColor: '#000000', // FONDO NEGRO PURO
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      boxSizing: 'border-box',
      color: 'white' // TEXTO GLOBAL BLANCO
    },
    // Banner Principal - Manteniendo el Degradado Titanio
    heroBanner: {
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      color: 'white',
      padding: '50px 40px',
      borderRadius: '12px',
      textAlign: 'left',
      marginBottom: '40px',
      boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.3)', // Sombra más oscura
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
    // Grilla Avanzada (3 Columnas Simétricas)
    actionGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '30px',
      marginBottom: '50px'
    },
    actionCard: {
      backgroundColor: '#111111', // TARJETAS GRIS CASI NEGRO
      borderRadius: '12px',
      padding: '40px 30px',
      border: '1px solid #222222', // BORDES OSCUROS
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
      color: '#ffffff', // TITULOS BLANCOS
      margin: 0,
      letterSpacing: '0.3px'
    },
    cardDescription: {
      fontSize: '14px',
      color: '#9ca3af', // DESCRIPCIONES GRIS CLARO
      margin: '0 0 30px 0',
      lineHeight: '1.6',
      textAlign: 'left'
    },
    // Botones con Hover y Microborde
    btnAction: (color) => ({
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
      boxShadow: `0 4px 12px ${color}20`,
      transition: 'opacity 0.2s ease'
    }),
    // Footer Corporativo Técnico
    partnerSection: {
      textAlign: 'center',
      marginTop: '40px',
      borderTop: '1px solid #222222', // BORDE OSCURO
      paddingTop: '35px'
    },
    partnerTitle: {
      fontSize: '11px',
      color: '#4b5563', // TITULO GRIS MEDIO
      letterSpacing: '2.5px',
      textTransform: 'uppercase',
      marginBottom: '10px',
      fontWeight: '600'
    },
    partnerBrand: {
      fontSize: '15px',
      color: '#6b7280', // MARCA GRIS CLARO
      fontWeight: '700',
      letterSpacing: '5px'
    }
  };

  return (
    <div style={styles.container}>
      
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
          <Link to="/upload" style={styles.btnAction('#2563eb')}>
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
          <Link to="/creditos" style={styles.btnAction('#16a34a')}>
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
          <Link to="/tickets" style={styles.btnAction('#1f2937')}>
            Abrir Ticket
          </Link>
        </div>

      </div>

      {/* 3. SECCIÓN DE MARCA */}
      <div style={styles.partnerSection}>
        <div style={styles.partnerTitle}>Official Technology Network</div>
        <div style={styles.partnerBrand}>INGEZMAQ SYSTEM</div>
      </div>

    </div>
  );
};

export default Dashboard;