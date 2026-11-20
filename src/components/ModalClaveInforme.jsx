import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

// Pide la contraseña del informe de archivos. La verifica la base de datos
// (función verificar_clave_informe): la contraseña no está en el código.
const ModalClaveInforme = ({ abierto, darkMode, onCancelar, onVerificada, descripcion = 'Ingresa la contraseña para descargar el informe de archivos.' }) => {
  const [clave, setClave] = useState('');
  const [verificando, setVerificando] = useState(false);
  const [error, setError] = useState('');

  if (!abierto) return null;

  const cerrar = () => {
    setClave('');
    setError('');
    onCancelar();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clave) return;
    setVerificando(true);
    setError('');
    try {
      const { data, error: rpcError } = await supabase.rpc('verificar_clave_informe', { p_clave: clave });
      if (rpcError) throw rpcError;
      if (data !== true) {
        setError('Contraseña incorrecta.');
        return;
      }
      setClave('');
      onVerificada();
    } catch (err) {
      setError(err.message || 'No se pudo verificar la contraseña.');
    } finally {
      setVerificando(false);
    }
  };

  const borde = darkMode ? '1px solid #334155' : '1px solid #ddd';

  return (
    <div
      onClick={cerrar}
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
      }}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '380px', padding: '28px', borderRadius: '10px',
          backgroundColor: darkMode ? '#1e293b' : '#ffffff', border: borde,
          boxShadow: '0 20px 50px rgba(0,0,0,0.35)', fontFamily: "'Inter', sans-serif"
        }}
      >
        <h3 style={{ margin: '0 0 6px', fontSize: '16px', color: darkMode ? '#ffffff' : '#111111' }}>
          🔒 Contraseña requerida
        </h3>
        <p style={{ margin: '0 0 18px', fontSize: '12.5px', color: darkMode ? '#94a3b8' : '#666666' }}>
          {descripcion}
        </p>
        <input
          type="password"
          autoFocus
          autoComplete="off"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          placeholder="Contraseña"
          disabled={verificando}
          style={{
            width: '100%', padding: '11px 12px', fontSize: '14px', borderRadius: '6px', boxSizing: 'border-box',
            border: error ? '1px solid #e11d48' : borde, outline: 'none',
            backgroundColor: darkMode ? '#0f172a' : '#ffffff', color: darkMode ? '#ffffff' : '#000000'
          }}
        />
        {error && <p style={{ margin: '8px 0 0', fontSize: '12px', fontWeight: 600, color: '#e11d48' }}>{error}</p>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button
            type="button"
            onClick={cerrar}
            style={{
              padding: '9px 16px', fontSize: '12px', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer',
              border: borde, backgroundColor: 'transparent', color: darkMode ? '#cbd5e1' : '#333333'
            }}
          >
            CANCELAR
          </button>
          <button
            type="submit"
            disabled={verificando || !clave}
            style={{
              padding: '9px 16px', fontSize: '12px', fontWeight: 'bold', borderRadius: '6px', border: 'none',
              backgroundColor: '#2563eb', color: '#ffffff',
              cursor: verificando || !clave ? 'default' : 'pointer', opacity: verificando || !clave ? 0.6 : 1
            }}
          >
            {verificando ? 'VERIFICANDO...' : 'DESCARGAR'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ModalClaveInforme;
