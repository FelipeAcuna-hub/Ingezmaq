import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import logoImg from '../../img/logoingezmaq.png'; // 🚀 IMPORTAMOS TU LOGO REAL

const RecuperarPassword = () => {
  const [email, setEmail] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/actualizar-password`,
    });
    if (error) {
      alert("Error: " + error.message);
    } else {
      setMensaje("✅ Se ha enviado un enlace de recuperación a tu correo.");
    }
    setLoading(false);
  };

  const styles = {
    // 🌌 FONDO NEGRO ABSOLUTO
    container: {
      height: '100vh', width: '100vw', display: 'flex', justifyContent: 'center',
      alignItems: 'center', backgroundColor: '#000000', fontFamily: 'sans-serif',
      margin: 0, padding: 0, position: 'absolute', top: 0, left: 0
    },
    // 🌌 CUADRADO CENTRAL: Modificado con tu degradado azul oscuro profundo a negro
    box: {
      background: 'linear-gradient(135deg, #070f24 0%, #02050d 100%)',
      padding: '40px', 
      borderRadius: '12px', 
      width: '100%',
      maxWidth: '450px', 
      border: '1px solid rgba(255, 255, 255, 0.05)', 
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
    },
    logoContainer: { 
      width: '100%', 
      display: 'flex', 
      justifyContent: 'center', 
      marginBottom: '20px' 
    },
    logoImg: { width: '300px', height: 'auto' },
    subtitle: { fontSize: '11px', color: '#94a3b8', textAlign: 'center', marginBottom: '25px', textTransform: 'uppercase', letterSpacing: '2px' },
    label: { display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#64748b', marginBottom: '5px', textTransform: 'uppercase' },
    // Input moderno translúcido a tono con el login
    input: {
      width: '100%', 
      padding: '12px', 
      backgroundColor: 'rgba(0, 0, 0, 0.3)', 
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '6px', 
      color: 'white', 
      outline: 'none', 
      boxSizing: 'border-box', 
      fontSize: '14px', 
      marginBottom: '20px'
    },
    // 🔵 Botón en Azul Eléctrico Oscuro con Letras Blancas
    button: {
      width: '100%', 
      backgroundColor: '#2563eb', 
      color: '#ffffff', 
      padding: '14px',
      border: 'none', 
      fontWeight: 'bold', 
      cursor: 'pointer', 
      borderRadius: '6px', 
      marginTop: '10px',
      letterSpacing: '0.5px',
      textTransform: 'uppercase',
      fontSize: '13px',
      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
      transition: 'background-color 0.2s ease'
    },
    // Enlace secundario en azul claro para destacar
    link: { color: '#60a5fa', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'none', fontSize: '13px' }
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        {/* ELIMINADA LA MARCA ANTERIOR Y PUESTO TU LOGO DE INGEZMAQ */}
        <div style={styles.logoContainer}>
          <img src={logoImg} alt="Ingezmaq Portal" style={styles.logoImg} />
        </div>
        <div style={styles.subtitle}>Recuperar acceso al portal</div>

        {mensaje ? (
          <div style={{ textAlign: 'center', color: 'white', padding: '20px 0' }}>
            <p style={{ fontSize: '14px', marginBottom: '20px', color: '#94a3b8' }}>{mensaje}</p>
            <Link to="/login" style={styles.link}>Volver al inicio</Link>
          </div>
        ) : (
          <form onSubmit={handleReset}>
            <div style={{ marginBottom: '15px' }}>
              <label style={styles.label}>Email de tu cuenta</label>
              <input 
                style={styles.input} 
                type="email" 
                placeholder="tu@email.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>

            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? 'ENVIANDO...' : 'ENVIAR INSTRUCCIONES'}
            </button>
            
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <Link to="/login" style={styles.link}>Volver al inicio</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default RecuperarPassword;