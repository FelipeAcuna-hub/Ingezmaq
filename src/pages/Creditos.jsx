import React, { useState } from 'react';
import { Link } from 'react-router-dom';

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
  Spark: (p) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />
    </svg>
  ),
  Crown: (p) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="m2 8 4 3 6-7 6 7 4-3-2 12H4Z" />
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

const PAQUETES = [
  { qty: 10, tag: null },
  { qty: 30, tag: 'MÁS ELEGIDO' },
  { qty: 50, tag: 'MEJOR VALOR' }
];

const Creditos = ({ session }) => {
  const [loading, setLoading] = useState(false);
  const [loadingQty, setLoadingQty] = useState(null);

  const handlePagarPaquete = (qty) => {
    const numQty = parseInt(qty);
    if (isNaN(numQty) || numQty <= 0) return;

    setLoading(true);
    setLoadingQty(numQty);
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
      setLoadingQty(null);
    }, 500);
  };

  const t = {
    bg: '#f3f4f6',
    surface: '#ffffff',
    ink: '#1f2937',
    inkSoft: '#6b7280',
    inkFaint: '#9ca3af',
    line: '#e5e7eb',
    brand: '#2563eb',
    brandSoft: '#eff6ff',
    brandLine: '#bfdbfe',
    gold: '#b45309',
    goldSoft: '#fffbeb',
    goldLine: '#fde68a'
  };

  const styles = {
    mainContent: { flex: 1, padding: '36px 30px 60px', backgroundColor: t.bg, minHeight: '100vh', fontFamily: "'Inter', sans-serif" },
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
      boxShadow: '0 1px 2px rgba(17,24,39,0.03), 0 10px 25px rgba(17,24,39,0.04)'
    },
    heroIcon: {
      width: '48px', height: '48px', borderRadius: '13px', backgroundColor: t.brandSoft, color: t.brand,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
    },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' },
    card: (highlighted) => ({
      backgroundColor: t.surface,
      padding: '38px 26px 30px',
      textAlign: 'center',
      borderRadius: '18px',
      boxShadow: highlighted
        ? '0 20px 40px -12px rgba(37,99,235,0.28)'
        : '0 4px 6px -1px rgba(0,0,0,0.04), 0 10px 20px -6px rgba(0,0,0,0.05)',
      border: highlighted ? `1.5px solid ${t.brand}` : `1px solid ${t.line}`,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      transform: highlighted ? 'translateY(-6px)' : 'none',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
    }),
    ribbon: (color, soft) => ({
      position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)',
      backgroundColor: color, color: '#fff', fontSize: '10px', fontWeight: 800, letterSpacing: '0.05em',
      padding: '6px 14px', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '5px',
      boxShadow: `0 4px 10px ${color}55`, whiteSpace: 'nowrap'
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
      backgroundColor: isThisLoading ? '#111827' : (highlighted ? t.brand : t.ink),
      color: 'white', border: 'none', padding: '14px 0', width: '100%', fontWeight: 700,
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

  return (
    <div style={styles.mainContent}>
      <style>{`
        .cred-back:hover { border-color: #d1d5db; color: #1f2937; }
        .cred-btn:hover:not(:disabled) { filter: brightness(1.12); transform: translateY(-1px); }
        .cred-card { animation: credFadeUp 0.3s ease both; }
        @keyframes credFadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes credSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .cred-spin { animation: credSpin 0.8s linear infinite; }
      `}</style>

      <Link className="cred-back" to="/" style={styles.btnBack}>
        <Icon.Arrow /> VOLVER AL DASHBOARD
      </Link>

      <div style={styles.heroCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={styles.heroIcon}><Icon.Bolt /></div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: t.ink, margin: 0, letterSpacing: '-0.01em' }}>Cargar créditos</h1>
            <p style={{ color: t.inkSoft, fontSize: '13.5px', margin: '4px 0 0' }}>
              Selecciona un paquete de créditos para tu cuenta de Ingezmaq.
            </p>
          </div>
        </div>
        <div style={styles.trustItem}>
          <Icon.Lock style={{ color: t.inkFaint }} />
          <span>Pago seguro vía MercadoPago</span>
        </div>
      </div>

      {/* PAQUETES PREDEFINIDOS EXCLUSIVOS */}
      <div style={styles.grid}>
        {PAQUETES.map(({ qty, tag }, i) => {
          const highlighted = tag === 'MÁS ELEGIDO';
          const isThisLoading = loading && loadingQty === qty;
          const accentColor = tag === 'MEJOR VALOR' ? t.gold : t.brand;
          const accentSoft = tag === 'MEJOR VALOR' ? t.goldSoft : t.brandSoft;

          return (
            <div key={qty} className="cred-card" style={{ ...styles.card(highlighted), animationDelay: `${i * 60}ms` }}>
              {tag && (
                <span style={styles.ribbon(accentColor, accentSoft)}>
                  {tag === 'MEJOR VALOR' ? <Icon.Crown /> : <Icon.Spark />} {tag}
                </span>
              )}

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