import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// --- 1. DEFINICIÓN DE SERVICIOS DINÁMICOS ---
const SERVICIOS_CONFIG = {
  'REPRO GASOLINA': [
    { id: 'b_s1', name: 'STAGE 1 + VMAX', price: 13 },
    { id: 'b_s1pb', name: 'STAGE 1 + POPS AND BANGS', price: 18 },
    { id: 'b_s2', name: 'STAGE 2 (REQUIERE MODS)', price: 16 },
    { id: 'b_s2pb', name: 'STAGE 2 + POPS AND BANGS', price: 22 },
    { id: 'b_pb', name: 'POPS AND BANGS (SOLO)', price: 6 }
  ],
  'REPRO DIÉSEL': [
    { id: 'd_s1', name: 'STAGE 1', price: 14 },
    { id: 'd_s1egr', name: 'STAGE 1 + EGR OFF', price: 13 },
    { id: 'd_s1dpf', name: 'STAGE 1 + DPF OFF + EGR OFF', price: 14 },
    { id: 'd_s1full', name: 'STAGE 1 + DPF + EGR OFF + ADBLUE OFF', price: 15 },
    { id: 'd_s2', name: 'STAGE 2 (POTENCIA + MODS)', price: 16 }
  ],
  'ANULACIONES EURO': [
    { id: 'dpf_only', name: 'DPF OFF', price: 7 },
    { id: 'dpf_egr', name: 'DPF OFF + EGR OFF', price: 9 },
    { id: 'adblue_full', name: 'ADBLUE + DPF & EGR OFF', price: 11 },
    { id: 'egr_only', name: 'EGR OFF', price: 7 },
    { id: 'dpf_adblue', name: 'DPF + ADBLUE', price: 9 },
    { id: 'adblue_only', name: 'ADBLUE OFF', price: 7 },
    { id: 'restauracion_orig', name: 'RESTAURACION ORI', price: 6 }
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

  const [loading, setLoading] = useState(false);
  const [categoriaSel, setCategoriaSel] = useState(null);
  const [servicioSel, setServicioSel] = useState(null);

  const [formData, setFormData] = useState({
    patente: '', marca: '', modelo: '', anio: '',
    motor: '', hp: '', ecu: '', combustible: '',
    tipo_modulo: '', comentarios: ''
  });

  useEffect(() => {
    if (location.state?.servicio) {
      const { name, price, id } = location.state.servicio;
      const categoriaEncontrada = Object.keys(SERVICIOS_CONFIG).find(cat =>
        SERVICIOS_CONFIG[cat].some(s => s.id === id)
      );
      if (categoriaEncontrada) {
        setCategoriaSel(categoriaEncontrada);
        setServicioSel({ id, name, price });
        if (categoriaEncontrada === 'REPRO DIÉSEL') setFormData(prev => ({ ...prev, combustible: 'Diesel' }));
        if (categoriaEncontrada === 'REPRO GASOLINA') setFormData(prev => ({ ...prev, combustible: 'Gasolina' }));
      }
    }
  }, [location]);

  const totalCreditos = servicioSel ? servicioSel.price : 0;

  const handlePatenteChange = (e) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (val.length <= 6) {
      setFormData({ ...formData, patente: val });
    }
  };

  const isFormValid = formData.patente.length >= 4 && fileId && fileMapa && servicioSel;

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
      alert("Faltan campos obligatorios (Patente, ID o Mapa)");
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
          costo_creditos: totalCreditos
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

        // 1. Cadena de texto plana con los correos de los administradores
        const adminEmailsString = 'focaldevs@gmail.com, felipe.acuna.fajardo@gmail.com';
        
        // 2. 🛠️ Se separan por coma y se limpian espacios en blanco laterales creando un Array compatible
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
    input: { 
      width: '100%', 
      padding: '10px', 
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
          <div><label style={styles.label}>Marca</label><input style={styles.input} placeholder="AUDI" value={formData.marca} onChange={e => setFormData({ ...formData, marca: e.target.value.toUpperCase() })} /></div>
          <div><label style={styles.label}>Modelo</label><input style={styles.input} placeholder="Q7" value={formData.modelo} onChange={e => setFormData({ ...formData, modelo: e.target.value.toUpperCase() })} /></div>
          <div>
            <label style={styles.label}>Año</label>
            <select style={styles.input} value={formData.anio} onChange={e => setFormData({ ...formData, anio: e.target.value })}>
              <option value="">Seleccionar año</option>
              {years.map(year => (<option key={year} value={year}>{year}</option>))}
            </select>
          </div>
        </div>

        <div style={styles.row}>
          <div><label style={styles.label}>Motor</label><input style={styles.input} placeholder="EA888" value={formData.motor} onChange={e => setFormData({ ...formData, motor: e.target.value.toUpperCase() })} /></div>
          <div><label style={styles.label}>HP</label><input style={styles.input} placeholder="200" value={formData.hp} onChange={e => setFormData({ ...formData, hp: e.target.value.toUpperCase() })} /></div>
          <div><label style={styles.label}>ECU</label><input style={styles.input} placeholder="Bosch/Delco/etc.." value={formData.ecu} onChange={e => setFormData({ ...formData, ecu: e.target.value.toUpperCase() })} /></div>
          <div>
            <label style={styles.label}>Combustible</label>
            <select style={styles.input} value={formData.combustible} onChange={e => setFormData({ ...formData, combustible: e.target.value })}>
              <option value="">Seleccionar</option>
              <option value="Gasolina">Gasolina</option>
              <option value="Diesel">Diesel</option>
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
          <textarea style={{ ...styles.input, height: '80px' }} placeholder="..." value={formData.comentarios} onChange={e => setFormData({ ...formData, comentarios: e.target.value })}></textarea>
        </div>

        <h2 style={{ fontSize: '20px', margin: '40px 0 20px', borderBottom: darkMode ? '1px solid #334155' : '1px solid #eee', paddingBottom: '10px' }}>
          ADJUNTAR ARCHIVOS
        </h2>

        <div style={styles.gridFiles}>
          <div style={styles.fileBox(!!fileId, true)} onClick={() => document.getElementById('fileId').click()}>
            <input type="file" id="fileId" style={{ display: 'none' }} onChange={(e) => setFileId(e.target.files[0])} />
            <div style={{ fontSize: '24px', marginBottom: '5px' }}>🆔</div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: fileId ? '#22c55e' : '#2563eb' }}>{fileId ? 'ID LISTO' : 'SUBIR ID (OBLIGATORIO)'}</div>
            <div style={{ fontSize: '10px', color: darkMode ? '#94a3b8' : '#888' }}>{fileId ? fileId.name : 'Export Console requerido'}</div>
          </div>

          <div style={styles.fileBox(!!fileMapa, true)} onClick={() => document.getElementById('fileMapa').click()}>
            <input type="file" id="fileMapa" style={{ display: 'none' }} onChange={(e) => setFileMapa(e.target.files[0])} />
            <div style={{ fontSize: '24px', marginBottom: '5px' }}>🗺️</div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: fileMapa ? '#22c55e' : '#2563eb' }}>{fileMapa ? 'MAPA LISTO' : 'SUBIR MAPA (OBLIGATORIO)'}</div>
            <div style={{ fontSize: '10px', color: darkMode ? '#94a3b8' : '#888' }}>{fileMapa ? fileMapa.name : 'Lectura de mapa requerida'}</div>
          </div>

          <div style={styles.fileBox(!!filePass, false)} onClick={() => document.getElementById('filePass').click()}>
            <input type="file" id="filePass" style={{ display: 'none' }} onChange={(e) => setFilePass(e.target.files[0])} />
            <div style={{ fontSize: '24px', marginBottom: '5px' }}>🔑</div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: filePass ? '#22c55e' : (darkMode ? '#94a3b8' : '#333') }}>{filePass ? 'PASS LISTO' : 'SUBIR PASS (OPCIONAL)'}</div>
            <div style={{ fontSize: '10px', color: darkMode ? '#64748b' : '#888' }}>{filePass ? filePass.name : 'Solo si el archivo lo requiere'}</div>
          </div>
        </div>

        <div style={styles.resumenBox}>
          <div style={{ textAlign: 'left' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#aaa' }}>Créditos a descontar:</p>
            <h1 style={{ margin: 0, fontSize: '48px', color: '#fff' }}>{totalCreditos}</h1>
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
                !fileId ? 'FALTA ARCHIVO ID' :
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