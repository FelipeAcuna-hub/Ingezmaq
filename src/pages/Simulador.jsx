import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { precioServicio } from '../preciosEspeciales';

// --- SUB-COMPONENTE INTERACTIVO PARA LAS CATEGORÍAS (ANIMACIÓN HOVER) ---
const SimCategoryItem = ({ cat, isSelected, onClick, darkMode, baseCardStyle, selectedCardStyle }) => {
  const [isHovered, setIsHovered] = useState(false);

  const itemStyle = {
    ...baseCardStyle,
    ...(isSelected ? selectedCardStyle : {}),
    backgroundColor: isSelected 
      ? (darkMode ? '#1e3a8a' : '#eff6ff') 
      : (isHovered ? (darkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc') : (darkMode ? '#1e293b' : 'white')),
    color: isSelected ? '#ffffff' : (darkMode ? '#e2e8f0' : '#000000'),
    // Animación de desplazamiento horizontal sutil
    transform: isHovered && !isSelected ? 'translateX(6px)' : 'translateX(0)',
    borderLeft: isSelected ? '5px solid #2563eb' : (isHovered ? '1px solid #2563eb' : baseCardStyle.border),
    boxShadow: isSelected ? '0 4px 12px rgba(37,99,235,0.15)' : '0 2px 4px rgba(0,0,0,0.05)',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
  };

  return (
    <div 
      style={itemStyle} 
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span style={{ 
        fontWeight: 'bold',
        color: isSelected ? '#ffffff' : (isHovered ? '#2563eb' : 'inherit')
      }}>
        › {cat}
      </span>
    </div>
  );
};

// --- SUB-COMPONENTE INTERACTIVO PARA LAS OPCIONES DE SERVICIO (ANIMACIÓN HOVER) ---
const SimServiceItem = ({ s, isSelected, onClick, darkMode, baseCardStyle, selectedCardStyle, priceBadgeStyle }) => {
  const [isHovered, setIsHovered] = useState(false);

  const itemStyle = {
    ...baseCardStyle,
    ...(isSelected ? selectedCardStyle : {}),
    backgroundColor: isSelected 
      ? (darkMode ? '#1e3a8a' : '#eff6ff') 
      : (isHovered ? (darkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc') : (darkMode ? '#1e293b' : 'white')),
    color: isSelected ? '#ffffff' : (darkMode ? '#e2e8f0' : '#000000'),
    // Animación de escala sutil y desplazamiento
    transform: isHovered && !isSelected ? 'scale(1.01) translateX(3px)' : 'scale(1) translateX(0)',
    borderLeft: isSelected ? '5px solid #2563eb' : (isHovered ? '1px solid #2563eb' : baseCardStyle.border),
    boxShadow: isSelected ? '0 4px 12px rgba(37,99,235,0.15)' : '0 2px 4px rgba(0,0,0,0.05)',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
  };

  const badgeStyle = {
    ...priceBadgeStyle,
    transform: isHovered ? 'scale(1.08)' : 'scale(1)',
    backgroundColor: isSelected ? '#22c55e' : '#2563eb', // Cambia a verde al estar seleccionado para feedback visual
    transition: 'all 0.15s ease'
  };

  return (
    <div 
      style={itemStyle} 
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span style={{ fontWeight: 'bold', fontSize: '12px', maxWidth: '75%' }}>{s.name}</span>
      <span style={badgeStyle}>+{s.price}</span>
    </div>
  );
};

const Simulador = ({ session }) => {
  const navigate = useNavigate();
  const { darkMode } = useOutletContext();

  const [categoriaSel, setCategoriaSel] = useState(null);
  const [servicioSel, setServicioSel] = useState(null);
  const [esClienteEspecial, setEsClienteEspecial] = useState(false);

  useEffect(() => {
    const fetchClienteEspecial = async () => {
      if (!session?.user?.id) return;
      const { data } = await supabase
        .from('profiles')
        .select('cliente_especial')
        .eq('id', session.user.id)
        .single();
      setEsClienteEspecial(!!data?.cliente_especial);
    };
    fetchClienteEspecial();
  }, [session]);

  const SERVICIOS_CONFIG_BASE = {
    'REPRO POTENCIA GASOLINA': [
      { id: 'b_s1', name: 'STAGE 1 (INCLUYE VMAX OFF)', price: 14 },
      { id: 'b_s1pb', name: 'STAGE 1 + POPS AND BANGS', price: 18 },
      { id: 'b_s2', name: 'STAGE 2 (REQUIERE MODS)', price: 16 },
      { id: 'b_s2pb', name: 'STAGE 2 + POPS AND BANGS', price: 22 },
      { id: 'b_pb', name: 'POPS AND BANGS (SOLO)', price: 6 }
    ],
    'REPRO POTENCIA DIESEL': [
      { id: 'd_s1', name: 'STAGE 1', price: 14 },
      { id: 'd_s1egr', name: 'STAGE 1 + EGR OFF', price: 15 },
      { id: 'd_s1dpf', name: 'STAGE 1 + DPF OFF + EGR OFF', price: 16 },
      { id: 'd_s1full', name: 'STAGE 1 + DPF + EGR OFF + ADBLUE OFF', price: 19 },
      { id: 'd_s2', name: 'STAGE 2 (POTENCIA + MODS)', price: 16 }
    ],
    'ANULACIONES - ELIMINACIONES EURO DIESEL': [
      { id: 'dpf_only', name: 'DPF OFF', price: 7 },
      { id: 'dpf_egr', name: 'DPF OFF + EGR OFF', price: 9 },
      { id: 'adblue_full', name: 'ADBLUE + DPF & EGR OFF', price: 11 },
      { id: 'egr_only', name: 'EGR OFF', price: 7 },
      { id: 'adblue_only', name: 'ADBLUE OFF', price: 7 },
      { id: 'restauracion_orig', name: 'RESTAURACIÓN ORIG', price: 6 }
    ],
    'ANULACIONES - ELIMINACIONES HD / CAMIONES / AGRICOLA': [
      { id: 'truck_dpf_only', name: 'DPF OFF HD', price: 12 },
      { id: 'truck_egr_only', name: 'EGR OFF', price: 12 },
      { id: 'truck_adblue_only', name: 'ADBLUE OFF', price: 12 },
      { id: 'truck_dpf_egr', name: 'DPF + EGR OFF', price: 15 },
      { id: 'truck_dpf_adblue', name: 'DPF + ADBLUE OFF', price: 15 },
      { id: 'truck_egr_adblue', name: 'EGR + ADBLUE OFF', price: 15 },
      { id: 'truck_dpf_egr_adblue', name: 'DPF + EGR + ADBLUE OFF', price: 18 }
    ],
    'DESACTIVACIONES': [
      { id: 'dtc', name: 'DTC OFF', price: 3 },
      { id: 'lambda', name: 'LAMBDA OFF', price: 6 },
      { id: 'immo', name: 'IMMO OFF', price: 6 },
      { id: 'vmax', name: 'VMAX OFF (LIMITADOR DE VELOCIDAD)', price: 8 },
      { id: 'immo_toyota', name: 'IMMO OFF SPECIAL (TOYOTA)', price: 8 },
      { id: 'decat_off', name: 'DECAT OFF', price: 6 },
      { id: 'tva_off', name: 'TVA OFF', price: 6 },
      { id: 'flaps_swirls', name: 'FLAPS/SWIRLS', price: 6 }
    ]
  };

  const SERVICIOS_CONFIG = Object.fromEntries(
    Object.entries(SERVICIOS_CONFIG_BASE).map(([categoria, servicios]) => [
      categoria,
      servicios.map(s => ({ ...s, price: precioServicio(s.id, s.price, esClienteEspecial) }))
    ])
  );

  const totalPrice = servicioSel ? servicioSel.price : 0;

  const styles = {
    mainContent: { 
      padding: '40px', 
      flex: 1, 
      backgroundColor: darkMode ? '#0f172a' : '#f3f4f6', 
      minHeight: '100vh',
      transition: 'all 0.3s ease'
    },
    title: { 
      fontSize: '24px', 
      fontWeight: 'bold', 
      marginBottom: '30px', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '15px',
      color: darkMode ? '#ffffff' : '#000000',
      letterSpacing: '-0.01em'
    },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '40px' },
    columnTitle: { 
      fontSize: '18px', 
      fontWeight: 'bold', 
      marginBottom: '20px',
      color: darkMode ? '#f8fafc' : '#000000',
      letterSpacing: '-0.01em'
    },
    card: { 
      backgroundColor: darkMode ? '#1e293b' : 'white', 
      padding: '16px 20px', 
      borderRadius: '8px', 
      marginBottom: '12px', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      cursor: 'pointer', 
      border: darkMode ? '1px solid #334155' : '1px solid #ececf0', 
      color: darkMode ? '#e2e8f0' : '#000000'
    },
    cardSelected: { 
      borderColor: '#2563eb', 
      color: '#ffffff'
    },
    priceBadge: { color: 'white', padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px' },
    totalBox: { 
      backgroundColor: darkMode ? '#0f172a' : 'black', 
      color: 'white', 
      padding: '30px', 
      borderRadius: '12px', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginTop: '20px',
      border: darkMode ? '1px solid #334155' : 'none',
      boxShadow: '0 4px 14px rgba(0,0,0,0.1)'
    },
    btnCargar: { 
      backgroundColor: '#2563eb', 
      color: 'white', 
      padding: '14px 40px', 
      border: 'none', 
      borderRadius: '10px', 
      fontWeight: 'bold', 
      fontSize: '15px', 
      cursor: 'pointer', 
      alignSelf: 'stretch', 
      marginTop: '30px',
      textTransform: 'uppercase',
      letterSpacing: '0.02em',
      transition: 'all 0.2s ease'
    },
    infoBox: { 
      backgroundColor: darkMode ? 'rgba(254, 249, 195, 0.08)' : '#fef9c3', 
      padding: '20px', 
      borderRadius: '8px', 
      border: darkMode ? '1px solid rgba(254, 249, 195, 0.2)' : '1px solid #fde047', 
      color: darkMode ? '#fef08a' : '#854d0e', 
      fontSize: '13px', 
      lineHeight: '1.5' 
    },
    instruccionBox: {
      backgroundColor: darkMode ? 'rgba(56, 189, 248, 0.1)' : '#d1eaf0', 
      padding: '15px', 
      borderRadius: '8px', 
      marginBottom: '20px', 
      fontSize: '13px', 
      color: darkMode ? '#38bdf8' : '#1e5a69',
      border: darkMode ? '1px solid rgba(56, 189, 248, 0.2)' : 'none'
    }
  };

  return (
    <div style={styles.mainContent}>
      <div style={styles.title}>🔲 Simula el precio de tu archivo</div>

      <div style={styles.grid}>
        {/* 1. SELECCIÓN DE CATEGORÍA */}
        <div>
          <h3 style={styles.columnTitle}>1. TIPO SERVICIO</h3>
          <div style={styles.instruccionBox}>
            Selecciona la categoría principal.
          </div>
          {Object.keys(SERVICIOS_CONFIG).map(cat => (
            <SimCategoryItem
              key={cat}
              cat={cat}
              isSelected={categoriaSel === cat}
              darkMode={darkMode}
              baseCardStyle={styles.card}
              selectedCardStyle={styles.cardSelected}
              onClick={() => {
                setCategoriaSel(cat);
                setServicioSel(null); 
              }}
            />
          ))}
        </div>

        {/* 2. OPCIONES ESPECÍFICAS */}
        <div>
          <h3 style={styles.columnTitle}>2. OPCIONES</h3>
          {categoriaSel ? (
            SERVICIOS_CONFIG[categoriaSel].map(s => (
              <SimServiceItem
                key={s.id}
                s={s}
                isSelected={servicioSel?.id === s.id}
                darkMode={darkMode}
                baseCardStyle={styles.card}
                selectedCardStyle={styles.cardSelected}
                priceBadgeStyle={styles.priceBadge}
                onClick={() => setServicioSel(s)}
              />
            ))
          ) : (
            <div style={{ color: darkMode ? '#64748b' : '#999', textAlign: 'center', marginTop: '50px', fontStyle: 'italic', fontSize: '13px' }}>
              Selecciona una categoría a la izquierda para ver las opciones...
            </div>
          )}
        </div>

        {/* 3. TOTAL Y REDIRECCIÓN */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={styles.columnTitle}>3. TOTAL</h3>
          <div style={styles.infoBox}>
            Total de créditos que se descontarán de tu cuenta. (1 Crédito = $10.000 CLP)
          </div>
          
          <div style={styles.totalBox}>
            <span style={{ fontSize: '24px', fontWeight: 'bold', letterSpacing: '-0.01em' }}>Créditos</span>
            <span style={{ fontSize: '38px', fontWeight: 'bold', backgroundColor: '#2563eb', padding: '4px 24px', borderRadius: '10px' }}>
              {totalPrice}
            </span>
          </div>

          <button 
            className="cred-btn"
            style={{ 
              ...styles.btnCargar, 
              opacity: servicioSel ? 1 : 0.4,
              cursor: servicioSel ? 'pointer' : 'not-allowed'
            }} 
            onClick={() => {
              if (servicioSel) {
                navigate('/upload', { 
                  state: { 
                    servicio: servicioSel
                  } 
                });
              }
            }}
            disabled={!servicioSel}
          >
            CARGAR MI ARCHIVO
          </button>
        </div>
      </div>
    </div>
  );
};

export default Simulador;