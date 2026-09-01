import React from 'react';
import { supabase } from '../supabaseClient';
import logoImg from '../../img/logo.png';

const PendingApproval = ({ email }) => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const styles = {
    container: {
      height: '100vh',
      width: '100vw',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#000000',
      fontFamily: 'sans-serif',
      margin: 0,
      padding: '20px',
      position: 'absolute',
      top: 0,
      left: 0
    },
    box: {
      background: 'linear-gradient(135deg, #070f24 0%, #02050d 100%)',
      padding: '40px',
      borderRadius: '12px',
      width: '100%',
      maxWidth: '450px',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
      textAlign: 'center'
    },
    logoContainer: {
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      marginBottom: '20px'
    },
    logoImg: { width: '260px', height: 'auto' },
    icon: {
      width: '56px',
      height: '56px',
      borderRadius: '50%',
      backgroundColor: 'rgba(251, 191, 36, 0.12)',
      color: '#fbbf24',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 20px'
    },
    title: {
      color: '#ffffff',
      fontSize: '20px',
      fontWeight: 800,
      margin: '0 0 12px'
    },
    text: {
      color: '#94a3b8',
      fontSize: '13.5px',
      lineHeight: 1.6,
      margin: '0 0 6px'
    },
    email: {
      color: '#e11d48',
      fontWeight: 700
    },
    button: {
      marginTop: '28px',
      backgroundColor: 'transparent',
      color: '#94a3b8',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      borderRadius: '8px',
      padding: '11px 24px',
      fontSize: '12px',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      cursor: 'pointer'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <div style={styles.logoContainer}>
          <img src={logoImg} alt="Chiptuning Logo" style={styles.logoImg} />
        </div>
        <div style={styles.icon}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <polyline points="12 7 12 12 15.5 14" />
          </svg>
        </div>
        <h2 style={styles.title}>Cuenta en espera de aprobación</h2>
        <p style={styles.text}>
          Tu cuenta {email && <>(<span style={styles.email}>{email}</span>)</>} fue creada correctamente, pero todavía no puedes ingresar al portal.
        </p>
        <p style={styles.text}>
          Un administrador tiene que revisar y confirmar tu acceso antes de que puedas entrar. Te avisaremos por correo apenas esté listo.
        </p>
        <button style={styles.button} onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};

export default PendingApproval;
