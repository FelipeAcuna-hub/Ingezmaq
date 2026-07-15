import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom'; // 1. Importamos el hook para el modo oscuro

const Simulador = () => {
  const navigate = useNavigate();
  
  // --- OBTENER EL ESTADO DEL TEMA DESDE EL LAYOUT ---
  const { darkMode } = useOutletContext(); // 2. Extraemos darkMode

  // 1. ESTADOS PARA FILTRADO DINÁMICO
  const [categoriaSel, setCategoriaSel] = useState(null);
  const [servicioSel, setServicioSel] = useState(null);

  // 2. CONFIGURACIÓN COMPLETA (Categorías separadas para que sea dinámico)
  const SERVICIOS_CONFIG = {
    'REPRO GASOLINA': [
      { id: 'b_s1', name: 'STAGE 1 (INCLUYE VMAX OFF)', price: 14 },
      { id: 'b_s1pb', name: 'STAGE 1 + POPS AND BANGS', price: 18 },
      { id: 'b_s2', name: 'STAGE 2 (REQUIERE MODS)', price: 16 },
      { id: 'b_s2pb', name: 'STAGE 2 + POPS AND BANGS', price: 22 },
      { id: 'b_pb', name: 'POPS AND BANGS (SOLO)', price: 6 }
    ],
    'REPRO DIÉSEL': [
      { id: 'd_s1', name: 'STAGE 1', price: 14 },
      { id: 'd_s1egr', name: 'STAGE 1 + EGR OFF', price: 15 },
      { id: 'd_s1dpf', name: 'STAGE 1 + DPF OFF + EGR OFF', price: 16 },
      { id: 'd_s1full', name: 'STAGE 1 + DPF + EGR OFF + ADBLUE OFF', price: 19 },
      { id: 'd_s2', name: 'STAGE 2 (POTENCIA + MODS)', price: 16 }
    ],
    'ANULACIONES EURO': [
      { id: 'dpf_egr', name: 'DPF OFF + EGR OFF', price: 6 },
      { id: 'adblue_full', name: 'ADBLUE + DPF & EGR OFF', price: 8 },
      { id: 'egr_only', name: 'EGR OFF', price: 4 },
      { id: 'adblue_only', name: 'ADBLUE OFF', price: 6 },
      { id: 'restauracion_orig', name: 'RESTAURACIÓN ORIG', price: 6 }
    ],
    'ANULACIONES EURO (CAMIONES)': [
      { id: 'truck_dpf_egr', name: 'DPF OFF + EGR OFF', price: 12 },
      { id: 'truck_adblue_full', name: 'ADBLUE + DPF & EGR OFF', price: 16 },
      { id: 'truck_egr_only', name: 'EGR OFF', price: 8 }, 
      { id: 'truck_adbue_only', name: 'ADBLUE OFF', price: 20 },  
      { id: 'truck_dpf_only', name: 'DPF OFF', price: 12 }, 
      { id: 'truck_cummins_emissions', name: 'CUMMINS EMISSIONS', price: 35 }
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

  const totalPrice = servicioSel ? servicioSel.price : 0;

  // --- CONFIGURACIÓN DE STYLES COMPATIBLES CON MODO OSCURO/CLARO ---
  const styles = {
    mainContent: { 
      padding: '40px', 
      flex: 1, 
      backgroundColor: darkMode ? '#0f172a' : '#f3f4f6', 
      minHeight: '100vh',
      transition: 'all 0.3s ease'
    },
    title: { 
      fontSize: '28px', 
      fontWeight: 'bold', 
      marginBottom: '30px', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '15px',
      color: darkMode ? '#ffffff' : '#000000'
    },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '40px' },
    columnTitle: { 
      fontSize: '20px', 
      fontWeight: 'bold', 
      marginBottom: '20px',
      color: darkMode ? '#f8fafc' : '#000000'
    },
    card: { 
      backgroundColor: darkMode ? '#1e293b' : 'white', 
      padding: '15px 20px', 
      borderRadius: '4px', 
      marginBottom: '15px', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      cursor: 'pointer', 
      border: darkMode ? '1px solid #334155' : '1px solid #ddd', 
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)', 
      transition: '0.3s',
      color: darkMode ? '#e2e8f0' : '#000000'
    },
    cardSelected: { 
      borderColor: '#2563eb', 
      backgroundColor: darkMode ? '#1e3a8a' : '#eff6ff', 
      borderLeft: '5px solid #2563eb',
      color: '#ffffff'
    },
    priceBadge: { backgroundColor: '#2563eb', color: 'white', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '14px' },
    totalBox: { 
      backgroundColor: darkMode ? '#0f172a' : 'black', 
      color: 'white', 
      padding: '30px', 
      borderRadius: '8px', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginTop: '20px',
      border: darkMode ? '1px solid #334155' : 'none'
    },
    btnCargar: { backgroundColor: '#2563eb', color: 'white', padding: '15px 40px', border: 'none', borderRadius: '50px', fontWeight: 'bold', fontSize: '18px', cursor: 'pointer', alignSelf: 'flex-end', marginTop: '40px' },
    infoBox: { 
      backgroundColor: darkMode ? 'rgba(254, 249, 195, 0.1)' : '#fef9c3', 
      padding: '20px', 
      borderRadius: '4px', 
      border: darkMode ? '1px solid rgba(254, 249, 195, 0.3)' : '1px solid #fde047', 
      color: darkMode ? '#fef08a' : '#854d0e', 
      fontSize: '13px', 
      lineHeight: '1.5' 
    },
    instruccionBox: {
      backgroundColor: darkMode ? '#1e293b' : '#d1eaf0', 
      padding: '15px', 
      borderRadius: '4px', 
      marginBottom: '20px', 
      fontSize: '13px', 
      color: darkMode ? '#38bdf8' : '#1e5a69',
      border: darkMode ? '1px solid #334155' : 'none'
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
            <div 
              key={cat} 
              style={{ ...styles.card, ...(categoriaSel === cat ? styles.cardSelected : {}) }}
              onClick={() => {
                setCategoriaSel(cat);
                setServicioSel(null); 
              }}
            >
              <span style={{ fontWeight: 'bold' }}>› {cat}</span>
            </div>
          ))}
        </div>

        {/* 2. OPCIONES ESPECÍFICAS */}
        <div>
          <h3 style={styles.columnTitle}>2. OPCIONES</h3>
          {categoriaSel ? (
            SERVICIOS_CONFIG[categoriaSel].map(s => (
              <div 
                key={s.id} 
                style={{ ...styles.card, ...(servicioSel?.id === s.id ? styles.cardSelected : {}) }}
                onClick={() => setServicioSel(s)}
              >
                <span style={{ fontWeight: 'bold', fontSize: '12px', maxWidth: '75%' }}>{s.name}</span>
                <span style={styles.priceBadge}>+{s.price}</span>
              </div>
            ))
          ) : (
            <div style={{ color: darkMode ? '#64748b' : '#999', textAlign: 'center', marginTop: '50px', fontStyle: 'italic' }}>
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
            <span style={{ fontSize: '32px', fontWeight: 'bold' }}>Créditos</span>
            <span style={{ fontSize: '48px', fontWeight: 'bold', backgroundColor: '#2563eb', padding: '0 20px', borderRadius: '8px' }}>
              {totalPrice}
            </span>
          </div>

          <button 
            style={{ ...styles.btnCargar, opacity: servicioSel ? 1 : 0.5 }} 
            onClick={() => {
              if (servicioSel) {
                // REDIRECCIÓN CON ESTADO: Enviamos el nombre y el precio
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