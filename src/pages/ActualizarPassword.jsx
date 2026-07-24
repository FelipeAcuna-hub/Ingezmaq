import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import logoImg from '../../img/logo.png'; // 🚀 Tu logo de Chiptuning

const ActualizarPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMensaje('');
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);

    // Actualizamos la contraseña utilizando el token activo del enlace de recovery
    const { error } = await supabase.auth.updateUser({ password: password });

    if (error) {
      setErrorMsg('Error al actualizar: ' + error.message);
    } else {
      setMensaje('✅ Contraseña actualizada con éxito. Redirigiendo al inicio...');
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    }
    setLoading(false);
  };

  const styles = {
    // 🌌 FONDO NEGRO ABSOLUTO
    container: {
      height: '100vh', 
      width: '100vw', 
      display: 'flex', 
      justifyContent: 'center',
      alignItems: 'center', 
      backgroundColor: '#000000', 
      fontFamily: 'sans-serif',
      margin: 0, 
      padding: 0, 
      position: 'absolute', 
      top: 0, 
      left: 0
    },
    // 🌌 CUADRADO CENTRAL: Degradado azul oscuro a negro idéntico al Login
    box: {
      background: 'linear-gradient(135deg, #070f24 0%, #02050d 100%)',
      padding: '40px', 
      borderRadius: '12px', 
      width: '100%',
      maxWidth: '450px', 
      border: '1px solid rgba(255, 255, 255, 0.05)', 
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
      boxSizing: 'border-box'
    },
    logoContainer: { 
      width: '100%', 
      display: 'flex', 
      justifyContent: 'center', 
      marginBottom: '20px' 
    },
    logoImg: { width: '300px', height: 'auto' },
    subtitle: { 
      fontSize: '11px', 
      color: '#94a3b8', 
      textAlign: 'center', 
      marginBottom: '25px', 
      textTransform: 'uppercase', 
      letterSpacing: '2px' 
    },
    label: { 
      display: 'block', 
      fontSize: '10px', 
      fontWeight: 'bold', 
      color: '#64748b', 
      marginBottom: '5px', 
      textTransform: 'uppercase' 
    },
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
      marginBottom: '15px'
    },
    // 🔵 Botón en Azul Eléctrico
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
    errorBox: {
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid #ef4444',
      color: '#f87171',
      padding: '10px',
      borderRadius: '6px',
      fontSize: '13px',
      textAlign: 'center',
      marginBottom: '15px'
    },
    successBox: {
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      border: '1px solid #22c55e',
      color: '#4ade80',
      padding: '10px',
      borderRadius: '6px',
      fontSize: '13px',
      textAlign: 'center',
      marginBottom: '15px'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <div style={styles.logoContainer}>
          <img src={logoImg} alt="Chiptuning Portal" style={styles.logoImg} />
        </div>
        <div style={styles.subtitle}>Establecer nueva contraseña</div>

        {errorMsg && <div style={styles.errorBox}>{errorMsg}</div>}
        {mensaje && <div style={styles.successBox}>{mensaje}</div>}

        <form onSubmit={handleUpdate}>
          <div style={{ marginBottom: '5px' }}>
            <label style={styles.label}>Nueva Contraseña</label>
            <input 
              style={styles.input} 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={styles.label}>Confirmar Contraseña</label>
            <input 
              style={styles.input} 
              type="password" 
              placeholder="••••••••" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required 
            />
          </div>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'GUARDANDO...' : 'ACTUALIZAR CONTRASEÑA'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ActualizarPassword;