import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import logoImg from '../../img/logoingezmaq.png'; 

const Login = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [compania, setCompania] = useState('');
  
  const navigate = useNavigate();

  // 🔒 CONTROL DE SEGURIDAD INTERNO DE LOGOUT
  useEffect(() => {
    localStorage.clear();
    sessionStorage.clear();
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isRegistering) {
        if (!nombre.trim() || !apellido.trim() || !compania.trim()) {
          alert("Los campos Nombre, Apellido y Compañía son obligatorios para registrarse.");
          return;
        }

        // 1. Crear el usuario en el sistema de autenticación de Supabase
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: `${nombre} ${apellido}`,
              phone: telefono,
              company: compania,
              role: 'user'
            }
          }
        });
        
        if (signUpError) throw signUpError;

        // 2. 🚀 INSERCIÓN DIRECTA EN TABLA PROFILES: Asegura el guardado real de los campos
        if (signUpData?.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: signUpData.user.id,
                email: email.toLowerCase(),
                full_name: nombre.trim(),
                apellido: apellido.trim(),
                company: compania.trim(),
                phone: telefono.trim(),
                credits: 0,
                is_approved: false
              }
            ]);

          if (profileError) {
            console.error("Error al poblar la tabla profiles:", profileError.message);
          }
        }

        alert('Registro exitoso. Un administrador revisará tu solicitud y te notificará por email cuando tu acceso sea activado.');
        setIsRegistering(false); // Cambia automáticamente a la pestaña de inicio de sesión
        
      } else {
        const { data: { user }, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        
        if (loginError) throw loginError;

        if (user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('is_approved')
            .eq('id', user.id)
            .single();

          if (profileError) throw profileError;

          if (profile && !profile.is_approved) {
            await supabase.auth.signOut();
            alert("⚠️ Acceso en espera: Tu cuenta aún no ha sido aprobada por el administrador.");
            return;
          }
          navigate('/'); 
        }
      }
    } catch (error) {
      alert(error.message);
    }
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
      padding: 0, 
      position: 'absolute', 
      top: 0, 
      left: 0 
    },
    loginBox: { 
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
    inputGroup: { marginBottom: '15px' },
    row: { display: 'flex', gap: '10px', marginBottom: '15px' },
    label: { display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#64748b', marginBottom: '5px', textTransform: 'uppercase' },
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
      transition: 'border-color 0.2s'
    },
    passContainer: { position: 'relative', display: 'flex', alignItems: 'center' },
    eyeBtn: { position: 'absolute', right: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '16px', display: 'flex', alignItems: 'center' },
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
    toggleText: { textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#64748b' },
    link: { color: '#60a5fa', cursor: 'pointer', fontWeight: 'bold', marginLeft: '5px', textDecoration: 'none' }, 
    forgotPass: { display: 'block', textAlign: 'right', marginTop: '8px', fontSize: '11px', color: '#64748b', textDecoration: 'none', transition: '0.3s' }
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        <div style={styles.logoContainer}>
          <img src={logoImg} alt="Ingezmaq Portal" style={styles.logoImg} />
        </div>
        <div style={styles.subtitle}>{isRegistering ? 'Crea tu cuenta de Distribuidor' : 'Portal Distribuidores'}</div>
        <form onSubmit={handleAuth}>
          {isRegistering && (
            <>
              <div style={styles.row}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Nombre</label>
                  <input style={styles.input} type="text" placeholder="Ej: Juan" onChange={(e) => setNombre(e.target.value)} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Apellido</label>
                  <input style={styles.input} type="text" placeholder="Ej: Navarro" onChange={(e) => setApellido(e.target.value)} required />
                </div>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Compañía / Taller</label>
                <input style={styles.input} type="text" placeholder="Nombre de tu empresa" onChange={(e) => setCompania(e.target.value)} required />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>WhatsApp / Teléfono</label>
                <input style={styles.input} type="tel" placeholder="+569..." onChange={(e) => setTelefono(e.target.value)} required />
              </div>
            </>
          )}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input style={styles.input} type="email" placeholder="tu@email.com" onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Contraseña</label>
            <div style={styles.passContainer}>
              <input style={{ ...styles.input, paddingRight: '40px' }} type={showPassword ? "text" : "password"} placeholder="••••••••" onChange={(e) => setPassword(e.target.value)} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>{showPassword ? '🔒' : '👁️'}</button>
            </div>
            {!isRegistering && <Link to="/recuperar-password" style={styles.forgotPass}>¿Olvidaste tu contraseña?</Link>}
          </div>
          <button type="submit" style={styles.button}>{isRegistering ? 'REGISTRARSE' : 'INICIAR SESIÓN'}</button>
        </form>
        <div style={styles.toggleText}>
          {isRegistering ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
          <span style={styles.link} onClick={() => setIsRegistering(!isRegistering)}>{isRegistering ? 'Ingresa aquí' : 'Regístrate aquí'}</span>
        </div>
      </div>
    </div>
  );
};

export default Login;