import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { PRECIOS_ESPECIALES, precioServicio } from '../preciosEspeciales';

const SERVICIOS_CONFIG_BASE = {
  'REPRO POTENCIA GASOLINA': [
    { id: 'b_s1', name: 'STAGE 1 + VMAX', price: 13 }, //revisado
    { id: 'b_s1pb', name: 'STAGE 1 + POPS AND BANGS', price: 14 }, //revisado
    { id: 'b_s2', name: 'STAGE 2 (REQUIERE MODS)', price: 18 }, //revisado
    { id: 'b_s2pb', name: 'STAGE 2 + POPS AND BANGS', price: 22 }, //no esta en la lista 
    { id: 'b_pb', name: 'POPS AND BANGS (SOLO)', price: 6 } //revisado
  ],
  'REPRO POTENCIA DIESEL': [
    { id: 'd_s1', name: 'STAGE 1', price: 12 },//revisado
    { id: 'd_s1egr', name: 'STAGE 1 + EGR OFF', price: 13 },//revisado
    { id: 'd_s1dpf', name: 'STAGE 1 + DPF OFF + EGR OFF', price: 14 },//revisado
    { id: 'd_s1full', name: 'STAGE 1 + DPF + EGR OFF + ADBLUE OFF', price: 15 },//revisado
    { id: 'd_s2', name: 'STAGE 2 (POTENCIA + MODS)', price: 16 } //no esta en la lista 
  ],
  'ANULACIONES - ELIMINACIONES EURO DIESEL': [
    { id: 'dpf_only', name: 'DPF OFF', price: 7 }, //revisado
    { id: 'dpf_egr', name: 'DPF OFF + EGR OFF', price: 9 }, //revisado
    { id: 'adblue_full', name: 'ADBLUE + DPF & EGR OFF', price: 11 }, //revisado
    { id: 'egr_only', name: 'EGR OFF', price: 7 }, //revisado
    { id: 'dpf_adblue', name: 'DPF + ADBLUE', price: 9 }, //revisado
    { id: 'adblue_only', name: 'ADBLUE OFF', price: 7 }, //revisado
    { id: 'restauracion_orig', name: 'RESTAURACION ORI', price: 6 } 
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
    { id: 'dtc', name: 'DTC OFF', price: 4 }, //revisado
    { id: 'lambda', name: 'LAMBDA OFF', price: 6 }, // Revisar si eliminar
    { id: 'mafof', name: 'MAF OFF', price: 5 }, //revisado
    { id: 'immo', name: 'IMMO OFF', price: 6 }, //preguntar
    { id: 'vmax', name: 'VMAX OFF (LIMITADOR DE VELOCIDAD)', price: 5 }, //revisado
    { id: 'immo_toyota', name: 'IMMO OFF SPECIAL (TOYOTA)', price: 8 }, //preguntar
    { id: 'decat_off', name: 'DECAT-CAT OFF', price: 5 }, //revisado
    { id: 'tva_off', name: 'TVA OFF', price: 6 }, //preguntar
    { id: 'flaps_swirls', name: 'FLAPS/SWIRLS', price: 7 } //revisado  
  ]
};

// --- SUB-COMPONENTE INTERACTIVO PARA LAS CATEGORÍAS (CON ANIMACIÓN HOVER) ---
const CategoryItem = ({ cat, isSelected, onClick, darkMode }) => {
  const [isHovered, setIsHovered] = useState(false);

  const itemStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 18px',
    marginBottom: '10px',
    border: isSelected
      ? '2px solid #2563eb'
      : (darkMode ? '1px solid #334155' : '1px solid #eee'),
    borderRadius: '8px',
    cursor: 'pointer',
    backgroundColor: isSelected
      ? (darkMode ? 'rgba(37, 99, 235, 0.25)' : '#eff6ff')
      : (isHovered ? (darkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc') : (darkMode ? '#0f172a' : 'white')),
    color: isSelected ? '#ffffff' : (darkMode ? '#cbd5e1' : '#000000'),
    fontWeight: isSelected ? '700' : '500',
    transform: isHovered && !isSelected ? 'translateX(4px)' : 'translateX(0)',
    boxShadow: isSelected ? '0 4px 12px rgba(37,99,235,0.15)' : 'none',
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
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        color: isSelected ? '#60a5fa' : (isHovered ? '#2563eb' : (darkMode ? '#94a3b8' : '#666'))
      }}>
        › {cat}
      </span>
    </div>
  );
};

// --- SUB-COMPONENTE INTERACTIVO PARA LAS OPCIONES DE SERVICIO (CON ANIMACIÓN HOVER) ---
const ServiceOptionItem = ({ s, isSelected, onClick, darkMode }) => {
  const [isHovered, setIsHovered] = useState(false);

  const itemStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 18px',
    marginBottom: '10px',
    border: isSelected
      ? '2px solid #22c55e'
      : (darkMode ? '1px solid #334155' : '1px solid #eee'),
    borderRadius: '8px',
    cursor: 'pointer',
    backgroundColor: isSelected
      ? (darkMode ? 'rgba(34, 197, 94, 0.15)' : '#f0fdf4')
      : (isHovered ? (darkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc') : (darkMode ? '#0f172a' : 'white')),
    color: isSelected ? (darkMode ? '#4ade80' : '#15803d') : (darkMode ? '#cbd5e1' : '#000000'),
    transform: isHovered && !isSelected ? 'scale(1.01) translateX(2px)' : 'scale(1) translateX(0)',
    boxShadow: isSelected ? '0 4px 12px rgba(34,197,94,0.15)' : 'none',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
  };

  const badgeStyle = {
    backgroundColor: isSelected ? '#22c55e' : '#2563eb',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 'bold',
    transform: isHovered ? 'scale(1.08)' : 'scale(1)',
    transition: 'transform 0.15s ease'
  };

  return (
    <div
      style={itemStyle}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span style={{ fontSize: '12px', fontWeight: isSelected ? '700' : '500', maxWidth: '80%' }}>{s.name}</span>
      <span style={badgeStyle}>+{s.price}</span>
    </div>
  );
};


const UploadFile = ({ session }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const years = Array.from({ length: 2026 - 1990 + 1 }, (_, i) => 2026 - i);

  const { darkMode } = useOutletContext();

  const [fileId, setFileId] = useState(null);
  const [fileMapa, setFileMapa] = useState(null);
  const [filePass, setFilePass] = useState(null);
  const [filesExtra, setFilesExtra] = useState([]);
  const fileIdRef = useRef(null);
  const fileMapaRef = useRef(null);
  const filePassRef = useRef(null);
  const filesExtraRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [categoriaSel, setCategoriaSel] = useState(null);
  const [servicioSel, setServicioSel] = useState(null);
  const [descuentoPct, setDescuentoPct] = useState(0);
  const [esClienteEspecial, setEsClienteEspecial] = useState(false);

  const [formData, setFormData] = useState({
    patente: '', marca: '', modelo: '', anio: '',
    motor: '', hp: '', ecu: '', combustible: '',
    tipo_modulo: '', comentarios: ''
  });

  // Precios reales que se cobran: los especiales fijos no dependen de lo que
  // venga por navegación desde el Simulador, siempre se recalculan acá.
  const SERVICIOS_CONFIG = Object.fromEntries(
    Object.entries(SERVICIOS_CONFIG_BASE).map(([categoria, servicios]) => [
      categoria,
      servicios.map(s => ({ ...s, price: precioServicio(s.id, s.price, esClienteEspecial) }))
    ])
  );

  useEffect(() => {
    if (location.state?.servicio) {
      const { id } = location.state.servicio;
      const categoriaEncontrada = Object.keys(SERVICIOS_CONFIG).find(cat =>
        SERVICIOS_CONFIG[cat].some(s => s.id === id)
      );
      if (categoriaEncontrada) {
        const servicio = SERVICIOS_CONFIG[categoriaEncontrada].find(s => s.id === id);
        setCategoriaSel(categoriaEncontrada);
        setServicioSel(servicio);
        if (categoriaEncontrada === 'REPRO POTENCIA DIESEL') setFormData(prev => ({ ...prev, combustible: 'Diesel' }));
        if (categoriaEncontrada === 'REPRO POTENCIA GASOLINA') setFormData(prev => ({ ...prev, combustible: 'Gasolina' }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, esClienteEspecial]);

  useEffect(() => {
    const fetchDescuentos = async () => {
      if (!session?.user?.id) return;
      const { data } = await supabase
        .from('profiles')
        .select('descuento_porcentaje, cliente_especial')
        .eq('id', session.user.id)
        .single();
      setDescuentoPct(data?.descuento_porcentaje || 0);
      setEsClienteEspecial(!!data?.cliente_especial);
    };
    fetchDescuentos();
  }, [session]);

  const esServicioEspecial = servicioSel && esClienteEspecial && PRECIOS_ESPECIALES[servicioSel.id] != null;
  const totalCreditos = servicioSel
    ? (esServicioEspecial ? servicioSel.price : Math.round(servicioSel.price * (1 - descuentoPct / 100)))
    : 0;

  const handlePatenteChange = (e) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (val.length <= 6) {
      setFormData({ ...formData, patente: val });
    }
  };

  const isFormValid = formData.patente.length >= 4 && formData.marca.trim() && fileMapa && servicioSel;

  const uploadSingleFile = async (file, prefix, folderName) => {
    if (!file) return null;
    const fileNameClean = file.name.replace(/\s+/g, '_');
    const filePath = `${session.user.id}/${folderName}/${prefix}_${fileNameClean}`;

    const { error: uploadError } = await supabase.storage
      .from('archivos-vehiculos')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('archivos-vehiculos')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async () => {
    if (!isFormValid) {
      alert("Faltan campos obligatorios (Patente, Marca, Mapa o Servicio)");
      return;
    }

    setLoading(true);
    try {
      const { data: perfil, error: perfilErr } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', session.user.id)
        .single();

      if (perfilErr) throw perfilErr;

      if (perfil.credits < totalCreditos) {
        alert(`Saldo insuficiente. Tienes ${perfil.credits} créditos y necesitas ${totalCreditos}.`);
        setLoading(false);
        return;
      }

      const folderName = Date.now();
      const urlId = await uploadSingleFile(fileId, 'ID', folderName);
      const urlMapa = await uploadSingleFile(fileMapa, 'MAPA', folderName);
      const urlPass = await uploadSingleFile(filePass, 'PASS', folderName);

      const archivosAdicionales = [];
      for (let i = 0; i < filesExtra.length; i++) {
        const url = await uploadSingleFile(filesExtra[i], `EXTRA${i + 1}`, folderName);
        if (url) archivosAdicionales.push({ nombre: filesExtra[i].name, url });
      }

      const { error: updateCreditsError } = await supabase
        .from('profiles')
        .update({ credits: perfil.credits - totalCreditos })
        .eq('id', session.user.id);

      if (updateCreditsError) throw updateCreditsError;

      await supabase.from('historial_movimientos').insert([
        {
          perfil_id: session.user.id,
          tipo: 'canje',
          cantidad: totalCreditos,
          descripcion: `Canje: ${formData.marca} ${formData.modelo} (${formData.patente}) - ${servicioSel.name}`,
          fecha: new Date().toISOString(),
        }
      ]);

      const { error: dbError } = await supabase.from('archivos').insert({
        user_id: session.user.id,
        patente: formData.patente,
        marca_modelo: `${formData.marca} ${formData.modelo}`.trim(),
        estado: 'pendiente',
        file_url_id: urlId,
        file_url_mapa: urlMapa,
        file_url_password: urlPass,
        detalles_tecnicos: {
          ...formData,
          servicios_solicitados: servicioSel.name,
          costo_creditos: totalCreditos,
          archivos_adicionales: archivosAdicionales
        }
      });

      if (dbError) throw dbError;

      try {
        const archivosLista = [];
        if (fileId) archivosLista.push("ID (Export Console)");
        if (fileMapa) archivosLista.push("MAPA");
        if (filePass) archivosLista.push("PASSWORD");

        const emailHtmlNuevo = `
          <div style="font-family: 'Helvetica', Arial, sans-serif; background-color: #f9f9f9; padding: 40px 0;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
              <div style="background-color: #000000; padding: 20px; text-align: center;">
                <h1 style="color: #2563eb; margin: 0; font-size: 24px; letter-spacing: 2px;">NUEVA SOLICITUD</h1>
              </div>
              <div style="padding: 30px; line-height: 1.6; color: #333;">
                <h2 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px;">Datos del Requerimiento</h2>
                <p>Se ha recibido un nuevo archivo para procesar:</p>
                
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 5px 0;"><strong>Cliente:</strong></td><td>${session.user.email}</td></tr>
                  <tr><td style="padding: 5px 0;"><strong>Patente:</strong></td><td>${formData.patente}</td></tr>
                  <tr><td style="padding: 5px 0;"><strong>Vehículo:</strong></td><td>${formData.marca} ${formData.modelo}</td></tr>
                  <tr><td style="padding: 5px 0;"><strong>Servicio:</strong></td><td>${servicioSel?.name || 'No especificado'}</td></tr>
                  <tr><td style="padding: 5px 0;"><strong>Archivos:</strong></td><td>${archivosLista.join(', ')}</td></tr>
                </table>

                <div style="background-color: #eff6ff; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0;">
                  <strong>Comentarios:</strong><br/>
                  ${formData.comentarios || 'Sin comentarios adicionales.'}
                </div>

                <div style="text-align: center; margin-top: 30px;">
                  <a href="https://chiptuning.cl/archivos" style="background-color: #2563eb; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">VER EN EL PORTAL DE ADMIN</a>
                </div>
              </div>
            </div>
          </div>
        `;

        const adminEmailsString = 'alientechchile@gmail.com, sebastianzunigavaldivia@gmail.com';

        const adminEmailsArray = adminEmailsString.split(',').map(email => email.trim());

        await supabase.functions.invoke('swift-function', {
          body: {
            to: adminEmailsArray,
            subject: `🚀 ARCHIVO: ${formData.patente} - ${formData.marca}`,
            html: emailHtmlNuevo
          },
        });

        console.log("Notificación de nuevo archivo enviada con éxito");
      } catch (mailErr) {
        console.error("Error enviando notificación inicial:", mailErr);
      }

      alert(`✅ Archivos enviados con éxito.`);
      navigate('/archivos');

    } catch (error) {
      console.error("Error completo:", error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    main: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: darkMode ? '#0f172a' : '#f3f4f6',
      transition: 'all 0.3s ease'
    },
    formCard: {
      backgroundColor: darkMode ? '#1e293b' : 'white',
      margin: '30px',
      padding: '40px',
      borderRadius: '4px',
      boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.05)',
      color: darkMode ? '#ffffff' : '#000000',
      transition: 'all 0.3s ease'
    },
    row: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '20px', marginBottom: '20px' },
    label: { display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '8px', color: darkMode ? '#94a3b8' : '#333', textTransform: 'uppercase' },
    // Oculta el <input type="file"> sin display:none (Safari a veces no abre el
    // selector con eso) y sin recortarlo a 1px (eso hacía que Chrome/Safari
    // saltaran la página al enfocarlo, por quedar mal ubicado dentro de
    // contenedores con position:fixed). Cubre el mismo espacio que el
    // recuadro visible, solo que invisible.
    hiddenFileInput: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      margin: 0,
      padding: 0,
      border: 0,
      opacity: 0,
      cursor: 'pointer'
    },
    input: {
      width: '100%',
      height: '42px',
      padding: '10px',
      fontSize: '13px',
      border: darkMode ? '1px solid #475569' : '1px solid #ccc',
      borderRadius: '4px',
      boxSizing: 'border-box',
      backgroundColor: darkMode ? '#0f172a' : '#ffffff',
      color: darkMode ? '#ffffff' : '#000000',
      outline: 'none',
      transition: 'all 0.2s ease'
    },
    gridFiles: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '25px' },
    fileBox: (hasFile, isRequired) => ({
      position: 'relative',
      border: hasFile
        ? '2px solid #22c55e'
        : (isRequired ? '2px dashed #2563eb' : (darkMode ? '2px dashed #475569' : '2px dashed #ddd')),
      padding: '20px',
      textAlign: 'center',
      borderRadius: '4px',
      backgroundColor: hasFile
        ? (darkMode ? 'rgba(34, 197, 94, 0.15)' : '#f0fdf4')
        : (isRequired ? (darkMode ? 'rgba(37, 99, 235, 0.15)' : '#eff6ff') : (darkMode ? '#0f172a' : '#f9f9f9')),
      cursor: 'pointer',
      transition: '0.3s'
    }),
    button: { backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '15px 40px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '2px', textTransform: 'uppercase', fontSize: '13px' },
    btnBack: { color: darkMode ? '#60a5fa' : '#666', textDecoration: 'none', fontSize: '13px', marginLeft: '30px', marginTop: '20px', display: 'inline-block', fontWeight: 'bold' },
    selectorGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', margin: '20px 0' },
    resumenBox: {
      backgroundColor: darkMode ? '#0f172a' : '#000',
      color: 'white',
      padding: '30px',
      borderRadius: '4px',
      textAlign: 'center',
      marginTop: '30px',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      border: darkMode ? '1px solid #334155' : 'none'
    }
  };

  return (
    <div style={styles.main}>
      <Link to="/" style={styles.btnBack}>← VOLVER AL DASHBOARD</Link>
      <div style={styles.formCard}>
        <h2 style={{ fontSize: '20px', marginBottom: '30px', borderBottom: darkMode ? '1px solid #334155' : '1px solid #eee', paddingBottom: '10px' }}>
          INFORMACIÓN DEL VEHÍCULO
        </h2>

        <div style={styles.row}>
          <div>
            <label style={styles.label}>Patente (Obligatorio)</label>
            <input
              style={{ ...styles.input, borderColor: formData.patente ? (darkMode ? '#475569' : '#ccc') : '#2563eb' }}
              placeholder="AACC82"
              value={formData.patente}
              onChange={handlePatenteChange}
            />
            <small style={{ fontSize: '9px', color: darkMode ? '#64748b' : '#999' }}>Máx. 6 caracteres</small>
          </div>
          <div>
            <label style={styles.label}>Marca (Obligatorio)</label>
            <input
              style={{ ...styles.input, borderColor: formData.marca ? (darkMode ? '#475569' : '#ccc') : '#2563eb' }}
              placeholder="AUDI"
              value={formData.marca}
              onChange={e => setFormData({ ...formData, marca: e.target.value.toUpperCase() })}
            />
          </div>
          <div><label style={styles.label}>Modelo</label><input style={styles.input} placeholder="Q7" value={formData.modelo} onChange={e => setFormData({ ...formData, modelo: e.target.value.toUpperCase() })} /></div>
          <div style={{ minWidth: 0 }}>
            <label style={styles.label}>Año</label>
            <select style={{ ...styles.input, width: '100%' }} value={formData.anio} onChange={e => setFormData({ ...formData, anio: e.target.value })}>
              <option value="">Seleccionar año</option>
              {years.map(year => (<option key={year} value={year}>{year}</option>))}
            </select>
          </div>
        </div>

        <div style={styles.row}>
          <div><label style={styles.label}>Motor</label><input style={styles.input} placeholder="Ej: 2.000, 1.600" value={formData.motor} onChange={e => setFormData({ ...formData, motor: e.target.value.toUpperCase() })} /></div>
          <div><label style={styles.label}>HP</label><input style={styles.input} placeholder="200" value={formData.hp} onChange={e => setFormData({ ...formData, hp: e.target.value.toUpperCase() })} /></div>
          <div><label style={styles.label}>Marca de ECU</label><input style={styles.input} placeholder="Ej: EDC17C60 - SID321 - DCU17CP42" value={formData.ecu} onChange={e => setFormData({ ...formData, ecu: e.target.value.toUpperCase() })} /></div>
          <div style={{ minWidth: 0 }}>
            <label style={styles.label}>Combustible</label>
            <select style={{ ...styles.input, width: '100%' }} value={formData.combustible} onChange={e => setFormData({ ...formData, combustible: e.target.value })}>
              <option value="">Seleccionar</option>
              <option value="Gasolina">Gasolina</option>
              <option value="Diesel">Diesel</option>
              <option value="Híbrido">Híbrido</option>
            </select>
          </div>
        </div>

        <h2 style={{ fontSize: '20px', margin: '40px 0 20px', borderBottom: darkMode ? '1px solid #334155' : '1px solid #eee', paddingBottom: '10px' }}>
          SIMULA EL PRECIO DE TU ARCHIVO
        </h2>

        <div style={styles.selectorGrid}>
          <div>
            <label style={styles.label}>1. TIPO SERVICIO</label>
            {Object.keys(SERVICIOS_CONFIG).map(cat => (
              <CategoryItem
                key={cat}
                cat={cat}
                isSelected={categoriaSel === cat}
                darkMode={darkMode}
                onClick={() => { setCategoriaSel(cat); setServicioSel(null); }}
              />
            ))}
          </div>
          <div>
            <label style={styles.label}>2. DETALLE</label>
            {categoriaSel ? SERVICIOS_CONFIG[categoriaSel].map(s => (
              <ServiceOptionItem
                key={s.id}
                s={s}
                isSelected={servicioSel?.id === s.id}
                darkMode={darkMode}
                onClick={() => setServicioSel(s)}
              />
            )) : <p style={{ fontSize: '12px', color: darkMode ? '#64748b' : '#999', textAlign: 'center', marginTop: '20px', fontStyle: 'italic' }}>Selecciona una categoría primero...</p>}
          </div>
        </div>

        <div style={{ marginBottom: '25px' }}>
          <label style={styles.label}>Tipo de Módulo</label>
          <select style={styles.input} value={formData.tipo_modulo} onChange={e => setFormData({ ...formData, tipo_modulo: e.target.value })}>
            <option value="">Selecciona</option>
            <option value="ECU">ECU</option>
            <option value="TCU">TCU</option>
          </select>
        </div>

        <div style={{ marginBottom: '25px' }}>
          <label style={styles.label}>Comentarios</label>
          <textarea style={{ ...styles.input, height: '80px' }} placeholder="Información del estado del vehículo (Limitación, pérdida de potencia, etc.), DTC, Alertas encendidas en tablero" value={formData.comentarios} onChange={e => setFormData({ ...formData, comentarios: e.target.value })}></textarea>
        </div>

        <h2 style={{ fontSize: '20px', margin: '40px 0 20px', borderBottom: darkMode ? '1px solid #334155' : '1px solid #eee', paddingBottom: '10px' }}>
          ADJUNTAR ARCHIVOS
        </h2>

        <div style={styles.gridFiles}>
          {/* --- 1. SUBIR ID --- */}
          <label style={styles.fileBox(!!fileId, false)}>
            <input ref={fileIdRef} type="file" style={styles.hiddenFileInput} onChange={(e) => setFileId(e.target.files[0])} />
            <div style={{ fontSize: '24px', marginBottom: '5px' }}>🆔</div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: fileId ? '#22c55e' : (darkMode ? '#94a3b8' : '#333') }}>
              {fileId ? 'ID LISTO' : 'SUBIR ID '}
            </div>
            <div style={{ fontSize: '10px', color: darkMode ? '#64748b' : '#888', wordBreak: 'break-all' }}>
              {fileId ? fileId.name : ''}
            </div>

            {/* 🗑️ BOTÓN QUITAR ID */}
            {fileId && (
              <button
                onClick={(e) => {
                  e.preventDefault(); // Evita reabrir el selector de archivos (label)
                  e.stopPropagation();
                  setFileId(null);
                  if (fileIdRef.current) fileIdRef.current.value = '';
                }}
                style={{
                  position: 'relative',
                  zIndex: 1,
                  marginTop: '6px',
                  backgroundColor: 'transparent',
                  color: '#ef4444',
                  border: '1px solid #ef4444',
                  borderRadius: '3px',
                  padding: '2px 8px',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                ✕ Quitar archivo
              </button>
            )}
          </label>

          {/* --- 2. SUBIR MAPA --- */}
          <label style={styles.fileBox(!!fileMapa, true)}>
            <input ref={fileMapaRef} type="file" style={styles.hiddenFileInput} onChange={(e) => setFileMapa(e.target.files[0])} />
            <div style={{ fontSize: '24px', marginBottom: '5px' }}>🗺️</div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: fileMapa ? '#22c55e' : '#2563eb' }}>
              {fileMapa ? 'MAPA LISTO' : 'SUBIR MAPA (OBLIGATORIO)'}
            </div>
            <div style={{ fontSize: '10px', color: darkMode ? '#94a3b8' : '#888', wordBreak: 'break-all' }}>
              {fileMapa ? fileMapa.name : 'Lectura de mapa requerida'}
            </div>

            {/* 🗑️ BOTÓN QUITAR MAPA */}
            {fileMapa && (
              <button
                onClick={(e) => {
                  e.preventDefault(); // Evita reabrir el selector de archivos (label)
                  e.stopPropagation();
                  setFileMapa(null);
                  if (fileMapaRef.current) fileMapaRef.current.value = '';
                }}
                style={{
                  position: 'relative',
                  zIndex: 1,
                  marginTop: '6px',
                  backgroundColor: 'transparent',
                  color: '#ef4444',
                  border: '1px solid #ef4444',
                  borderRadius: '3px',
                  padding: '2px 8px',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                ✕ Quitar archivo
              </button>
            )}
          </label>

          {/* --- 3. SUBIR PASS --- */}
          <label style={styles.fileBox(!!filePass, false)}>
            <input ref={filePassRef} type="file" style={styles.hiddenFileInput} onChange={(e) => setFilePass(e.target.files[0])} />
            <div style={{ fontSize: '24px', marginBottom: '5px' }}>🔑</div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: filePass ? '#22c55e' : (darkMode ? '#94a3b8' : '#333') }}>
              {filePass ? 'PASS LISTO' : 'SUBIR PASS (OPCIONAL)'}
            </div>
            <div style={{ fontSize: '10px', color: darkMode ? '#64748b' : '#888', wordBreak: 'break-all' }}>
              {filePass ? filePass.name : 'Solo si el archivo lo requiere'}
            </div>

            {/* 🗑️ BOTÓN QUITAR PASS */}
            {filePass && (
              <button
                onClick={(e) => {
                  e.preventDefault(); // Evita reabrir el selector de archivos (label)
                  e.stopPropagation();
                  setFilePass(null);
                  if (filePassRef.current) filePassRef.current.value = '';
                }}
                style={{
                  position: 'relative',
                  zIndex: 1,
                  marginTop: '6px',
                  backgroundColor: 'transparent',
                  color: '#ef4444',
                  border: '1px solid #ef4444',
                  borderRadius: '3px',
                  padding: '2px 8px',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                ✕ Quitar archivo
              </button>
            )}
          </label>
        </div>

        <h2 style={{ fontSize: '20px', margin: '40px 0 10px', borderBottom: darkMode ? '1px solid #334155' : '1px solid #eee', paddingBottom: '10px' }}>
          ANEXOS ADICIONALES
        </h2>
        <p style={{ fontSize: '12px', color: darkMode ? '#94a3b8' : '#666', marginTop: 0, marginBottom: '15px' }}>
          Opcional. Sube fotos o PDFs extra si los necesitas: PDF INFORME, FOTO TABLERO, PATENTE, ANEXOS, etc.
        </p>

        <label
          style={{ ...styles.fileBox(filesExtra.length > 0, false), marginBottom: '15px' }}
        >
          <input
            ref={filesExtraRef}
            type="file"
            multiple
            accept="image/*,.pdf"
            style={styles.hiddenFileInput}
            onChange={(e) => {
              setFilesExtra(prev => [...prev, ...Array.from(e.target.files)]);
              e.target.value = '';
            }}
          />
          <div style={{ fontSize: '24px', marginBottom: '5px' }}>📎</div>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: filesExtra.length > 0 ? '#22c55e' : (darkMode ? '#94a3b8' : '#333') }}>
            {filesExtra.length > 0 ? `${filesExtra.length} ARCHIVO(S) LISTO(S)` : 'SUBIR ANEXOS (OPCIONAL)'}
          </div>
          <div style={{ fontSize: '10px', color: darkMode ? '#64748b' : '#888' }}>
            Puedes seleccionar más de uno
          </div>
        </label>

        {filesExtra.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '25px' }}>
            {filesExtra.map((f, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', borderRadius: '4px',
                backgroundColor: darkMode ? '#1e293b' : '#f9f9f9',
                border: darkMode ? '1px solid #334155' : '1px solid #eee'
              }}>
                <span style={{ fontSize: '11px', color: darkMode ? '#e2e8f0' : '#333', wordBreak: 'break-all' }}>{f.name}</span>
                <button
                  onClick={() => setFilesExtra(prev => prev.filter((_, idx) => idx !== i))}
                  style={{
                    backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444',
                    borderRadius: '3px', padding: '2px 8px', fontSize: '9px', fontWeight: 'bold', cursor: 'pointer', flexShrink: 0, marginLeft: '10px'
                  }}
                >
                  ✕ Quitar
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={styles.resumenBox}>
          <div style={{ textAlign: 'left' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#aaa' }}>Créditos a descontar:</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <h1 style={{ margin: 0, fontSize: '48px', color: '#fff' }}>{totalCreditos}</h1>
              {esServicioEspecial && (
                <>
                  {Object.values(SERVICIOS_CONFIG_BASE).flat().find(s => s.id === servicioSel.id)?.price !== totalCreditos && (
                    <span style={{ fontSize: '18px', color: '#6b7280', textDecoration: 'line-through' }}>
                      {Object.values(SERVICIOS_CONFIG_BASE).flat().find(s => s.id === servicioSel.id)?.price}
                    </span>
                  )}
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#16a34a', backgroundColor: 'rgba(22,163,74,0.15)', padding: '3px 8px', borderRadius: '999px' }}>PRECIO ESPECIAL</span>
                </>
              )}
              {!esServicioEspecial && descuentoPct > 0 && servicioSel && (
                <>
                  <span style={{ fontSize: '18px', color: '#6b7280', textDecoration: 'line-through' }}>{servicioSel.price}</span>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#16a34a', backgroundColor: 'rgba(22,163,74,0.15)', padding: '3px 8px', borderRadius: '999px' }}>-{descuentoPct}%</span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={handleSubmit}
            style={{
              ...styles.button,
              opacity: (loading || !isFormValid) ? 0.4 : 1,
              cursor: (loading || !isFormValid) ? 'not-allowed' : 'pointer',
              backgroundColor: !isFormValid && !loading ? '#666' : '#2563eb'
            }}
            disabled={loading || !isFormValid}
          >
            {loading ? 'PROCESANDO...' :
              !formData.patente ? 'FALTA PATENTE' :
                !formData.marca.trim() ? 'FALTA MARCA' :
                  !fileMapa ? 'FALTA ARCHIVO MAPA' :
                    !servicioSel ? 'SELECCIONA SERVICIO' :
                      'CARGAR ARCHIVOS'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadFile;