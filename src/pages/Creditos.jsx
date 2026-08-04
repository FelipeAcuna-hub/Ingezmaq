import React, { useEffect, useState } from 'react';
import { Link, useOutletContext, useSearchParams } from 'react-router-dom';

// --- ICONOS SVG EN LÍNEA (sin dependencias externas) ---
const Icon = {
  Arrow: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  Bolt: (p) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Lock: (p) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="3" y="11" width="18" height="10" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  Check: (p) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Spinner: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" {...p}>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
    </svg>
  ),
  Card: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="2" y="5" width="20" height="14" rx="2.5" /><line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  )
};

const PAQUETES = [10, 30, 50];

const Creditos = ({ session }) => {
  const [loading, setLoading] = useState(false);
  const [loadingQty, setLoadingQty] = useState(null);
  const [payStatus, setPayStatus] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);

  // Estado para la cantidad de créditos personalizada ingresada por el usuario
  const [customQty, setCustomQty] = useState('');

  // Obtener el estado del tema desde el layout superior
  const { darkMode } = useOutletContext();

  const [searchParams, setSearchParams] = useSearchParams();

  // Al volver desde MercadoPago, back_urls trae ?status=success|failure|pending
  // y MP agrega su propio payment_id/collection_id a la misma URL.
  useEffect(() => {
    const status = searchParams.get('status');
    if (!status) return;

    setPayStatus(status);
    const paymentId = searchParams.get('payment_id') || searchParams.get('collection_id');
    setSearchParams({}, { replace: true });

    if (status === 'success' && paymentId) {
      setLoadingReceipt(true);
      fetch(`/.netlify/functions/get-payment?payment_id=${encodeURIComponent(paymentId)}`)
        .then((res) => res.json())
        .then((data) => setReceipt(data))
        .catch(() => setReceipt(null))
        .finally(() => setLoadingReceipt(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePagarPaquete = async (qty) => {
    const numQty = parseInt(qty);
    if (isNaN(numQty) || numQty <= 0) return;

    if (!session?.user?.id) {
      setErrorMsg('Debes iniciar sesión para comprar créditos.');
      return;
    }

    setErrorMsg('');
    setLoading(true);
    setLoadingQty(numQty);

    try {
      const res = await fetch('/.netlify/functions/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qty: numQty, userId: session.user.id }),
      });

      const data = await res.json();
      if (!res.ok || !data.init_point) {
        throw new Error(data.error || 'No se pudo iniciar el pago');
      }

      window.location.href = data.init_point;
    } catch (err) {
      setErrorMsg(err.message || 'No se pudo conectar con MercadoPago');
      setLoading(false);
      setLoadingQty(null);
    }
  };

  // --- TOKENS DE DISEÑO ---
  const t = {
    bg: darkMode ? '#0f172a' : '#f3f4f6',
    surface: darkMode ? '#1e293b' : '#ffffff',
    ink: darkMode ? '#f8fafc' : '#1f2937',
    inkSoft: darkMode ? '#94a3b8' : '#6b7280',
    inkFaint: darkMode ? '#64748b' : '#9ca3af',
    line: darkMode ? '#334155' : '#e5e7eb',
    brand: '#2563eb',
    brandSoft: darkMode ? 'rgba(37, 99, 235, 0.15)' : '#eff6ff',
    brandLine: darkMode ? 'rgba(37, 99, 235, 0.3)' : '#bfdbfe',
  };

  const styles = {
    mainContent: { 
      flex: 1, 
      padding: '36px 30px 60px', 
      backgroundColor: t.bg, 
      minHeight: '100vh', 
      fontFamily: "'Inter', sans-serif",
      transition: 'all 0.3s ease'
    },
    btnBack: {
      color: t.inkSoft, textDecoration: 'none', fontSize: '12.5px', fontWeight: 700,
      display: 'inline-flex', alignItems: 'center', gap: '7px', marginBottom: '26px',
      backgroundColor: t.surface, border: `1px solid ${t.line}`, padding: '8px 14px', borderRadius: '9px',
      transition: 'all 0.15s ease'
    },
    heroCard: {
      backgroundColor: t.surface, borderRadius: '18px', border: `1px solid ${t.line}`,
      padding: '30px 34px', marginBottom: '32px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px',
      boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.25)' : '0 1px 2px rgba(17,24,39,0.03), 0 10px 25px rgba(17,24,39,0.04)',
      color: t.ink,
      transition: 'all 0.3s ease'
    },
    heroIcon: {
      width: '48px', height: '48px', borderRadius: '13px', backgroundColor: t.brandSoft, color: t.brand,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
    },
    // --- NUEVO APARTADO PERSONALIZADO ---
    customCard: {
      backgroundColor: t.surface,
      borderRadius: '18px',
      border: `1.5px dashed ${t.brandLine}`,
      padding: '24px 34px',
      marginBottom: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '20px',
      boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.15)' : '0 4px 12px rgba(0,0,0,0.02)',
      transition: 'all 0.3s ease'
    },
    inputWrapper: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      flexWrap: 'wrap'
    },
    customInput: {
      width: '130px',
      padding: '12px 16px',
      fontSize: '16px',
      fontWeight: 'bold',
      borderRadius: '10px',
      border: `1px solid ${t.line}`,
      backgroundColor: darkMode ? '#0f172a' : '#ffffff',
      color: t.ink,
      outline: 'none',
      textAlign: 'center',
      transition: 'all 0.2s ease'
    },
    customPriceLabel: {
      fontSize: '18px',
      fontWeight: '800',
      color: t.ink,
      marginLeft: '10px'
    },
    btnComprarCustom: {
      backgroundColor: t.brand,
      color: 'white',
      border: 'none',
      padding: '12px 28px',
      fontWeight: 700,
      cursor: loading || !customQty || parseInt(customQty) <= 0 ? 'default' : 'pointer',
      textTransform: 'uppercase',
      fontSize: '12.5px',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      opacity: loading || !customQty || parseInt(customQty) <= 0 ? 0.5 : 1,
      transition: 'all 0.2s ease'
    },
    // --- CUADRÍCULA DE PAQUETES ---
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' },
    card: (highlighted) => ({
      backgroundColor: t.surface,
      padding: '30px 26px',
      textAlign: 'center',
      borderRadius: '18px',
      boxShadow: highlighted
        ? (darkMode ? '0 20px 40px -12px rgba(37,99,235,0.45)' : '0 20px 40px -12px rgba(37,99,235,0.28)')
        : (darkMode ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 6px -1px rgba(0,0,0,0.04), 0 10px 20px -6px rgba(0,0,0,0.05)'),
      border: highlighted ? `1.5px solid ${t.brand}` : `1px solid ${t.line}`,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      transform: highlighted ? 'translateY(-6px)' : 'none',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease, background-color 0.3s ease, border-color 0.3s ease'
    }),
    qtyIcon: (color, soft) => ({
      width: '46px', height: '46px', borderRadius: '13px', backgroundColor: soft, color: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
    }),
    qtyLabel: { fontWeight: 800, marginBottom: '4px', color: t.ink, letterSpacing: '0.02em', fontSize: '13px', textTransform: 'uppercase' },
    unitPrice: { fontSize: '11.5px', color: t.inkFaint, marginBottom: '18px' },
    price: { fontSize: '34px', fontWeight: 800, color: t.ink, marginBottom: '4px', letterSpacing: '-0.02em' },
    priceSub: { fontSize: '11px', color: t.inkFaint, marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '0.05em' },
    featureList: { listStyle: 'none', padding: 0, margin: '0 0 26px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '9px' },
    featureItem: { display: 'flex', alignItems: 'center', gap: '9px', fontSize: '12.5px', color: t.inkSoft },
    checkDot: (color, soft) => ({
      width: '18px', height: '18px', borderRadius: '50%', backgroundColor: soft, color: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
    }),
    btnComprar: (highlighted, isThisLoading) => ({
      backgroundColor: isThisLoading ? (darkMode ? '#f8fafc' : '#111827') : (highlighted ? t.brand : (darkMode ? '#334155' : t.ink)),
      color: isThisLoading && darkMode ? '#0f172a' : 'white', border: 'none', padding: '14px 0', width: '100%', fontWeight: 700,
      cursor: isThisLoading || loading ? 'default' : 'pointer', textTransform: 'uppercase', fontSize: '12.5px',
      borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
      marginTop: 'auto', opacity: loading && !isThisLoading ? 0.5 : 1,
      transition: 'all 0.2s ease'
    }),
    trustRow: {
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '18px', flexWrap: 'wrap',
      marginTop: '34px', fontSize: '11.5px', color: t.inkFaint
    },
    trustItem: { display: 'flex', alignItems: 'center', gap: '6px' }
  };

  // Cálculo del total para el input personalizado
  const customAmount = customQty ? parseInt(customQty) * 10000 : 0;
  const isCustomLoading = loading && loadingQty === parseInt(customQty);

  return (
    <div style={styles.mainContent}>
      <style>{`
        .cred-back:hover { border-color: ${darkMode ? '#475569' : '#d1d5db'}; color: ${darkMode ? '#ffffff' : '#1f2937'}; }
        .cred-btn:hover:not(:disabled) { filter: brightness(1.12); transform: translateY(-1px); }
        .cred-card { animation: credFadeUp 0.3s ease both; }
        .custom-input:focus { border-color: ${t.brand} !important; box-shadow: 0 0 0 3px ${t.brandSoft}; }
        @keyframes credFadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes credSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .cred-spin { animation: credSpin 0.8s linear infinite; }
      `}</style>

      <Link className="cred-back" to="/" style={styles.btnBack}>
        <Icon.Arrow /> VOLVER AL DASHBOARD
      </Link>

      {payStatus && (
        <div style={{
          padding: '14px 18px',
          borderRadius: '12px',
          marginBottom: '20px',
          fontSize: '13.5px',
          fontWeight: 600,
          backgroundColor: payStatus === 'success' ? (darkMode ? 'rgba(22,163,74,0.15)' : '#f0fdf4') : payStatus === 'pending' ? (darkMode ? 'rgba(245,158,11,0.15)' : '#fffbeb') : (darkMode ? 'rgba(220,38,38,0.15)' : '#fef2f2'),
          color: payStatus === 'success' ? '#16a34a' : payStatus === 'pending' ? '#b45309' : '#dc2626',
          border: `1px solid ${payStatus === 'success' ? '#16a34a55' : payStatus === 'pending' ? '#b4530955' : '#dc262655'}`
        }}>
          {payStatus === 'success' && 'Pago recibido. Tus créditos se acreditarán en unos segundos.'}
          {payStatus === 'pending' && 'Tu pago está pendiente de confirmación. Te avisaremos cuando se acredite.'}
          {payStatus === 'failure' && 'El pago no se pudo completar. Puedes intentarlo nuevamente.'}
        </div>
      )}

      {errorMsg && (
        <div style={{
          padding: '14px 18px',
          borderRadius: '12px',
          marginBottom: '20px',
          fontSize: '13.5px',
          fontWeight: 600,
          backgroundColor: darkMode ? 'rgba(220,38,38,0.15)' : '#fef2f2',
          color: '#dc2626',
          border: '1px solid #dc262655'
        }}>
          {errorMsg}
        </div>
      )}

      {payStatus === 'success' && (loadingReceipt || receipt) && (
        <div style={{
          backgroundColor: t.surface,
          borderRadius: '16px',
          border: '1px solid #16a34a55',
          padding: '22px 26px',
          marginBottom: '20px',
          boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.25)' : '0 1px 2px rgba(17,24,39,0.03), 0 10px 25px rgba(17,24,39,0.04)'
        }}>
          {loadingReceipt ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: t.inkSoft, fontSize: '13px', fontWeight: 600 }}>
              <Icon.Spinner className="cred-spin" /> Buscando comprobante...
            </div>
          ) : receipt?.status === 'approved' ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <span style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: darkMode ? 'rgba(22,163,74,0.15)' : '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon.Check />
                </span>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: t.ink }}>Comprobante de pago</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', fontSize: '13px' }}>
                <div>
                  <div style={{ color: t.inkFaint, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '3px' }}>Créditos acreditados</div>
                  <div style={{ color: t.ink, fontWeight: 700 }}>{receipt.credits ?? '—'}</div>
                </div>
                <div>
                  <div style={{ color: t.inkFaint, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '3px' }}>Monto pagado</div>
                  <div style={{ color: t.ink, fontWeight: 700 }}>${Number(receipt.amount || 0).toLocaleString('es-CL')} CLP</div>
                </div>
                <div>
                  <div style={{ color: t.inkFaint, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '3px' }}>N° de pago</div>
                  <div style={{ color: t.ink, fontWeight: 700 }}>{receipt.id}</div>
                </div>
                <div>
                  <div style={{ color: t.inkFaint, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '3px' }}>Fecha</div>
                  <div style={{ color: t.ink, fontWeight: 700 }}>{receipt.date ? new Date(receipt.date).toLocaleString('es-CL') : '—'}</div>
                </div>
              </div>
              <p style={{ margin: '14px 0 0', fontSize: '12px', color: t.inkFaint }}>
                También te enviamos este comprobante a tu correo.
              </p>
            </>
          ) : (
            <p style={{ margin: 0, fontSize: '13px', color: t.inkSoft }}>
              No pudimos cargar el detalle del comprobante, pero si el pago fue aprobado tus créditos se acreditarán igual. Revisa tu correo o el historial en unos minutos.
            </p>
          )}
        </div>
      )}

      <div style={styles.heroCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={styles.heroIcon}><Icon.Bolt /></div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: t.ink, margin: 0, letterSpacing: '-0.01em' }}>Cargar créditos</h1>
            <p style={{ color: t.inkSoft, fontSize: '13.5px', margin: '4px 0 0' }}>
              Selecciona un paquete predefinido o ingresa la cantidad exacta que necesitas a continuación.
            </p>
          </div>
        </div>
        <div style={styles.trustItem}>
          <Icon.Lock style={{ color: t.inkFaint }} />
          <span>Pago seguro vía MercadoPago</span>
        </div>
      </div>

      {/* === NUEVO APARTADO: COMPRA PERSONALIZADA DE CRÉDITOS === */}
      <div style={styles.customCard}>
        <div style={styles.inputWrapper}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: t.brand, letterSpacing: '0.05em' }}>COMPRA PERSONALIZADA</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: t.ink }}>¿Cuántos créditos deseas comprar?</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '10px' }}>
            <input
              type="number"
              className="custom-input"
              placeholder="Ej. 15"
              min="1"
              value={customQty}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setCustomQty(val);
              }}
              style={styles.customInput}
              disabled={loading}
            />
            {customAmount > 0 && (
              <span style={styles.customPriceLabel}>
                = ${customAmount.toLocaleString('es-CL')} <span style={{ fontSize: '12px', color: t.inkFaint, fontWeight: 'normal' }}>CLP</span>
              </span>
            )}
          </div>
        </div>

        <button
          className="cred-btn"
          disabled={loading || !customQty || parseInt(customQty) <= 0}
          onClick={() => handlePagarPaquete(customQty)}
          style={styles.btnComprarCustom}
        >
          {isCustomLoading ? (
            <>
              <Icon.Spinner className="cred-spin" /> Conectando...
            </>
          ) : (
            <>
              <Icon.Card /> Comprar créditos
            </>
          )}
        </button>
      </div>

      {/* PAQUETES PREDEFINIDOS EXCLUSIVOS */}
      <div style={styles.grid}>
        {PAQUETES.map((qty, i) => {
          const highlighted = true;
          const isThisLoading = loading && loadingQty === qty;
          const accentColor = t.brand;
          const accentSoft = t.brandSoft;

          return (
            <div key={qty} className="cred-card" style={{ ...styles.card(highlighted), animationDelay: `${i * 60}ms` }}>
              <div style={styles.qtyIcon(accentColor, accentSoft)}>
                <Icon.Bolt />
              </div>

              <div style={styles.qtyLabel}>{qty} créditos</div>
              <div style={styles.unitPrice}>${(10000).toLocaleString('es-CL')} por crédito</div>

              <div style={styles.price}>${(qty * 10000).toLocaleString('es-CL')}</div>
              <div style={styles.priceSub}>Pago único · CLP</div>

              <ul style={styles.featureList}>
                <li style={styles.featureItem}>
                  <span style={styles.checkDot(accentColor, accentSoft)}><Icon.Check /></span>
                  Acreditación inmediata
                </li>
                <li style={styles.featureItem}>
                  <span style={styles.checkDot(accentColor, accentSoft)}><Icon.Check /></span>
                  Sin vencimiento
                </li>
                <li style={styles.featureItem}>
                  <span style={styles.checkDot(accentColor, accentSoft)}><Icon.Check /></span>
                  Válido para todos tus archivos
                </li>
              </ul>

              <button
                className="cred-btn"
                disabled={loading}
                onClick={() => handlePagarPaquete(qty)}
                style={styles.btnComprar(highlighted, isThisLoading)}
              >
                {isThisLoading ? (
                  <>
                    <Icon.Spinner className="cred-spin" /> Conectando...
                  </>
                ) : (
                  <>
                    <Icon.Card /> Comprar ahora
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div style={styles.trustRow}>
        <span style={styles.trustItem}><Icon.Lock /> Conexión encriptada</span>
        <span style={styles.trustItem}><Icon.Card /> MercadoPago / Webpay</span>
        <span style={styles.trustItem}><Icon.Check /> Créditos acreditados al instante</span>
      </div>
    </div>
  );
};

export default Creditos;