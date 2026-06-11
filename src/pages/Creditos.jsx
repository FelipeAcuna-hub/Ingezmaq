import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Creditos = ({ session }) => {
  const [loading, setLoading] = useState(false);

  const handlePagarPaquete = (qty) => {
    const numQty = parseInt(qty);
    if (isNaN(numQty) || numQty <= 0) return;

    setLoading(true);
    const totalCLP = numQty * 10000;

    // Guardamos los datos localmente por control de flujo interno
    localStorage.setItem('pending_credits', numQty);
    localStorage.setItem('pending_amount', totalCLP);

    // URL de redirección directa usando tu ID de cliente real (5397606411635255)
    const urlCheckoutSandbox = `https://www.mercadopago.cl/checkout/v1/payment/redirect/?source=link&preference-id=anonymous&client_id=5397606411635255&title=Carga+de+${numQty}+Creditos+Ingezmaq&price=${totalCLP}&currency=CLP&external_reference=${session?.user?.id || 'invitado'}`;

    // Abre la pasarela en una pestaña nueva para resguardar la app principal
    setTimeout(() => {
      window.open(urlCheckoutSandbox, '_blank');
      setLoading(false);
    }, 500);
  };

  const styles = {
    mainContent: { flex: 1, padding: '30px', backgroundColor: '#f3f4f6', minHeight: '100vh', fontFamily: 'sans-serif' },
    btnBack: { color: '#666', textDecoration: 'none', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontWeight: 'bold' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '25px', marginTop: '20px' },
    card: { backgroundColor: 'white', padding: '40px 20px', textAlign: 'center', borderRadius: '4px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #eee' },
    price: { fontSize: '32px', fontWeight: 'bold', color: '#2563eb', marginBottom: '25px' },
    btnComprar: { backgroundColor: '#1f2937', color: 'white', border: 'none', padding: '14px 0', width: '100%', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase', fontSize: '13px', borderRadius: '4px', transition: '0.2s' }
  };

  return (
    <div style={styles.mainContent}>
      <Link to="/" style={styles.btnBack}>← VOLVER AL DASHBOARD</Link>

      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>CARGAR CRÉDITOS</h1>
        <p style={{ color: '#666', fontSize: '14px' }}>Selecciona un paquete de créditos para tu cuenta de Ingezmaq.</p>
      </div>

      {/* PAQUETES PREDEFINIDOS EXCLUSIVOS */}
      <div style={styles.grid}>
        {[10, 30, 50].map(qty => (
          <div key={qty} style={styles.card}>
            <div style={{ fontWeight: 'bold', marginBottom: '15px', color: '#374151', letterSpacing: '0.5px' }}>
              {qty} CRÉDITOS
            </div>
            <div style={styles.price}>
              ${(qty * 10000).toLocaleString('es-CL')}
            </div>
            <button 
              disabled={loading} 
              onClick={() => handlePagarPaquete(qty)} 
              style={styles.btnComprar}
            >
              {loading ? 'Conectando...' : 'Comprar Ahora'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Creditos;