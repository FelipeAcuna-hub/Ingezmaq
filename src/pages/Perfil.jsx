import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom'; // 1. Importamos el hook de contexto
import { supabase } from '../supabaseClient';

const Perfil = ({ session }) => {
  const [loading, setLoading] = useState(false);
  
  // --- OBTENER EL ESTADO DEL TEMA DESDE EL LAYOUT ---
  const { darkMode } = useOutletContext(); // 2. Extraemos darkMode del contexto

  // --- ESTADOS UNIFICADOS PARA CONTRASEÑA ---
  const [newPassword, setNewPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const [profile, setProfile] = useState({
    full_name: '',
    apellido: '',
    phone: '',
    company: '',
    rut: '',
    actividad: '',
    country: 'Chile',
    fecha_nacimiento: '',
    credits: 0
  });

  useEffect(() => {
    const getProfile = async () => {
      let userId = session?.user?.id;
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id;
      }
      if (!userId) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (data) {
          setProfile({
            full_name: data.full_name || '',
            apellido: data.apellido || '',
            phone: data.phone || '',
            company: data.company || '',
            rut: data.rut || '',
            actividad: data.actividad || '',
            country: data.country || 'Chile',
            fecha_nacimiento: data.fecha_nacimiento || '',
            credits: data.credits || 0
          });
        }
      } catch (error) {
        console.error('Error cargando perfil:', error.message);
      }
    };

    getProfile();
  }, [session]);

  // --- FUNCIÓN PARA CAMBIAR CONTRASEÑA ---
  const handlePasswordChange = async () => {
    if (!newPassword || newPassword.length < 6) {
      alert("Por favor, escribe una nueva contraseña de al menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
      alert("✅ ¡Contraseña actualizada con éxito!");
      setNewPassword(""); 
    } catch (error) {
      alert("Error al cambiar contraseña: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    let userId = session?.user?.id;
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
    }

    if (!userId) {
      alert('Error: No se pudo identificar al usuario.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: userId,
        ...profile,
        fecha_nacimiento: profile.fecha_nacimiento || null,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      alert('✅ ¡Perfil actualizado correctamente!');
    } catch (error) {
      alert('Error al actualizar: ' + (error.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  // --- PALETA DE COLORES DINÁMICA ---
  const styles = {
    mainContent: { 
      flex: 1, 
      padding: '0', 
      backgroundColor: darkMode ? '#0f172a' : '#f3f4f6', // Gris claro o azul slate oscuro
      minHeight: '100vh',
      transition: 'all 0.3s ease'
    },
    formCard: { 
      backgroundColor: darkMode ? '#1e293b' : 'white', // Tarjeta clara o azul oscuro
      margin: '30px', 
      padding: '40px', 
      borderRadius: '4px', 
      boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.05)',
      transition: 'all 0.3s ease'
    },
    sectionTitle: { 
      fontSize: '18px', 
      fontWeight: 'bold', 
      marginBottom: '25px', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '10px', 
      color: darkMode ? '#f8fafc' : '#333', // Texto principal blanco o negro
      borderBottom: darkMode ? '1px solid #334155' : '1px solid #e2e8f0',
      paddingBottom: '8px'
    },
    inputGroup: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' },
    label: { 
      display: 'block', 
      fontSize: '11px', 
      fontWeight: 'bold', 
      color: darkMode ? '#94a3b8' : '#333', // Etiquetas grises claras o negras
      marginBottom: '8px', 
      textTransform: 'uppercase' 
    },
    input: { 
      width: '100%', 
      padding: '12px', 
      border: darkMode ? '1px solid #475569' : '1px solid #ddd', 
      backgroundColor: darkMode ? '#0f172a' : '#ffffff', // Fondo de inputs
      color: darkMode ? '#ffffff' : '#000000', // Texto de inputs
      borderRadius: '4px', 
      fontSize: '14px', 
      boxSizing: 'border-box', 
      outline: 'none',
      transition: 'all 0.2s ease'
    },
    inputWarning: {
      width: '100%',
      padding: '12px',
      border: '1px solid #f59e0b',
      backgroundColor: darkMode ? 'rgba(245, 158, 11, 0.1)' : '#fffbeb',
      color: darkMode ? '#ffffff' : '#000000',
      borderRadius: '4px',
      fontSize: '14px',
      boxSizing: 'border-box',
      outline: 'none',
      transition: 'all 0.2s ease'
    },
    warningText: {
      margin: '6px 0 0',
      fontSize: '11px',
      fontWeight: 600,
      color: '#f59e0b'
    },
    submitBtn: {
      backgroundColor: darkMode ? '#2563eb' : '#000000', // Botón principal azul o negro
      color: 'white', 
      border: 'none', 
      padding: '15px 40px', 
      fontWeight: 'bold', 
      cursor: 'pointer', 
      borderRadius: '4px', 
      textTransform: 'uppercase', 
      fontSize: '13px', 
      opacity: loading ? 0.7 : 1,
      transition: 'all 0.2s ease'
    }
  };

  return (
    <div style={styles.mainContent}>
      <form onSubmit={handleUpdate} style={styles.formCard}>
        <div style={styles.sectionTitle}>👤 INFORMACIÓN PERSONAL</div>
        <div style={styles.inputGroup}>
          <div>
            <label style={styles.label}>NOMBRE</label>
            <input
              style={styles.input}
              type="text"
              value={profile.full_name}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
            />
          </div>
          <div>
            <label style={styles.label}>APELLIDO</label>
            <input
              style={styles.input}
              type="text"
              value={profile.apellido}
              onChange={(e) => setProfile({ ...profile, apellido: e.target.value })}
            />
          </div>
          <div>
            <label style={styles.label}>TELÉFONO</label>
            <input
              style={styles.input}
              type="text"
              placeholder="+56 9 ..."
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            />
          </div>
          <div>
            <label style={styles.label}>FECHA DE CUMPLEAÑOS</label>
            <input
              style={profile.fecha_nacimiento ? styles.input : styles.inputWarning}
              type="date"
              value={profile.fecha_nacimiento}
              onChange={(e) => setProfile({ ...profile, fecha_nacimiento: e.target.value })}
            />
            {!profile.fecha_nacimiento && (
              <p style={styles.warningText}>⚠️ Falta completar este campo.</p>
            )}
          </div>
        </div>

        <div style={styles.sectionTitle}>📄 INFORMACIÓN DE FACTURACIÓN</div>
        <div style={styles.inputGroup}>
          <div>
            <label style={styles.label}>COMPAÑÍA</label>
            <input style={styles.input} type="text" placeholder="Nombre de tu taller" value={profile.company} onChange={(e) => setProfile({ ...profile, company: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>RUT / VAT</label>
            <input style={styles.input} type="text" placeholder="12.345.678-9" value={profile.rut} onChange={(e) => setProfile({ ...profile, rut: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>ACTIVIDAD</label>
            <input style={styles.input} type="text" placeholder="Giro comercial" value={profile.actividad} onChange={(e) => setProfile({ ...profile, actividad: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>PAÍS</label>
            <select style={styles.input} value={profile.country} onChange={(e) => setProfile({ ...profile, country: e.target.value })}>
              <option value="Chile">Chile</option>
              <option value="Argentina">Argentina</option>
              <option value="Peru">Perú</option>
            </select>
          </div>
        </div>

        <div style={styles.sectionTitle}>🔑 ACCESO</div>
        <div style={styles.inputGroup}>
          <div>
            <label style={styles.label}>E-MAIL</label>
            <input
              style={{ 
                ...styles.input, 
                backgroundColor: darkMode ? '#1e293b' : '#f9f9f9', // Campo bloqueado más opaco
                borderColor: darkMode ? '#334155' : '#ddd',
                color: darkMode ? '#64748b' : '#666'
              }}
              type="email"
              value={session?.user?.email}
              disabled
            />
          </div>

          <div>
            <label style={styles.label}>NUEVA CONTRASEÑA</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                style={{ ...styles.input, paddingRight: '40px' }}
                type={mostrarPassword ? "text" : "password"}
                placeholder="Escribe tu nueva clave"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  padding: '5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: darkMode ? '#94a3b8' : '#333'
                }}
              >
                {mostrarPassword ? '🔒' : '👁️'}
              </button>
            </div>

            <p
              onClick={handlePasswordChange}
              style={{
                fontSize: '11px',
                color: '#e11d48',
                cursor: 'pointer',
                marginTop: '8px',
                fontWeight: 'bold',
                display: 'inline-block'
              }}
            >
              {loading ? 'Procesando...' : 'Aplicar cambio de contraseña'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Perfil;