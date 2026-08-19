import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const Archivos = ({ session }) => {
  const [archivos, setArchivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [archivoDetalle, setArchivoDetalle] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina] = useState(8);
  const [statusFilter, setStatusFilter] = useState('todos');

  const { darkMode } = useOutletContext();

  const ADMIN_EMAILS = [
    'sebastianzunigavaldivia@gmail.com',
    'oliver.zuniga@gmail.com',
    'focaldevs@gmail.com',
    'alientechchile@gmail.com'
  ];

  const isAdmin =
    session?.user?.user_metadata?.role === 'admin' ||
    ADMIN_EMAILS.includes(session?.user?.email?.toLowerCase());

  const fetchArchivos = async () => {
    try {
      setLoading(true);
      if (!session?.user?.id) return;

      let query = supabase
        .from('archivos')
        .select(`
          *,
          profiles:user_id (
            company,
            email,
            cliente_especial
          )
        `);

      if (!isAdmin) {
        query = query.eq('user_id', session.user.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setArchivos(data || []);
    } catch (error) {
      console.error("Error al cargar archivos:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchivos();
  }, [session, isAdmin]);

  const handleForceDownload = async (url) => {
    if (!url) return;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;

      const baseName = url.split('/').pop();
      const cleanName = baseName.replace(/^\d+_/, '').replace(/^(ID_|MAPA_|PASS_|MOD_|EXTRA_)/, '');

      link.setAttribute('download', cleanName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error("Error en descarga:", e);
      window.open(url, '_blank');
    }
  };

  const handleCancelarSolicitud = async (archivo) => {
    if (archivo.estado !== 'pendiente') {
      alert("Solo se pueden cancelar solicitudes en estado pendiente.");
      return;
    }

    const costo = archivo.detalles_tecnicos?.costo_creditos || 0;

    if (window.confirm(`¿Estás seguro de cancelar esta solicitud? Se te devolverán ${costo} créditos.`)) {
      try {
        setLoading(true);

        const { error: errorDelete } = await supabase
          .from('archivos')
          .delete()
          .eq('id', archivo.id);

        if (errorDelete) throw new Error("No se pudo eliminar de la base de datos.");

        setArchivos(prevArchivos => prevArchivos.filter(a => a.id !== archivo.id));

        const { data: perfil, error: errorPerfil } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', session.user.id)
          .single();

        if (errorPerfil) throw errorPerfil;

        const nuevosCreditos = (perfil.credits || 0) + costo;

        await supabase
          .from('profiles')
          .update({ credits: nuevosCreditos })
          .eq('id', session.user.id);

        await supabase.from('movimientos').insert([
          {
            user_id: session.user.id,
            tipo: 'carga',
            cantidad: costo,
            descripcion: `Cancelación Solicitud: ${archivo.marca_modelo} (${archivo.patente})`,
            created_at: new Date()
          }
        ]);

        alert("✅ Solicitud eliminada y créditos devueltos.");
        fetchArchivos();

      } catch (error) {
        console.error("Error:", error.message);
        alert("Error crítico: " + error.message);
        fetchArchivos();
      } finally {
        setLoading(false);
      }
    }
  };

  // --- SUBIR ARCHIVO MODIFICADO / EXTRA CON TIMESTAMP ---
  const handleUploadModificado = async (archivoId, file, patente, clienteEmail, campoDestino = 'mod_file_url') => {
    let nota = null;
    if (campoDestino === 'mod_file_url') {
      nota = window.prompt("Nota de instalación (Opcional):");
    }

    try {
      if (!file) return;
      setLoading(true);

      const fileNameClean = file.name.replace(/\s+/g, '_');
      const storagePath = `procesados/${Date.now()}/${fileNameClean}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('archivos-vehiculos')
        .upload(storagePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('archivos-vehiculos')
        .getPublicUrl(storagePath);

      // 1. Mapeamos la columna correcta según el archivo que se está subiendo (MOD, V2 o V3)
      let campoFecha = 'mod_uploaded_at';
      if (campoDestino === 'mod_file_extra_url') {
        campoFecha = 'mod_extra_uploaded_at';
      } else if (campoDestino === 'mod_v3_file_url') {
        campoFecha = 'mod_v3_uploaded_at'; // 👈 Se asigna la fecha correspondiente a V3
      }

      const updateData = {
        [campoDestino]: publicUrl,
        [campoFecha]: new Date().toISOString(), // 👈 Registramos la hora y fecha exacta
        estado: 'completado'
      };

      if (nota) updateData.notas_instalacion = nota;

      const { error: dbError } = await supabase
        .from('archivos')
        .update(updateData)
        .eq('id', archivoId);

      if (dbError) throw dbError;

      await handleStatusChange(archivoId, 'completado', clienteEmail, patente);
      alert(`✅ Subido con éxito: ${fileNameClean}`);
      fetchArchivos();

    } catch (error) {
      console.error("Error:", error.message);
      alert("Error al subir.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarNota = async (archivoId, notaActual) => {
    if (!isAdmin) return;

    const nuevaNota = window.prompt("Instrucciones de instalación:", notaActual || "");

    if (nuevaNota !== null) {
      const { error } = await supabase
        .from('archivos')
        .update({ notas_instalacion: nuevaNota })
        .eq('id', archivoId);

      if (error) alert("Error al guardar nota");
      else fetchArchivos();
    }
  };

  const handleStatusChange = async (archivoId, nuevoEstado, clienteEmail, patente) => {
    try {
      const { error } = await supabase
        .from('archivos')
        .update({ estado: nuevoEstado })
        .eq('id', archivoId);

      if (error) throw error;

      if (clienteEmail) {
        const subjectText = nuevoEstado === 'completado'
          ? `✅ Archivo Listo - Patente ${patente}`
          : `🔍 Archivo en gestión - Patente ${patente}`;

        const emailHtml = `
          <div style="font-family: 'Helvetica', Arial, sans-serif; background-color: #f9f9f9; padding: 40px 0;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
              <div style="background-color: #000000; padding: 20px; text-align: center;">
                <h1 style="color: #2563eb; margin: 0; font-size: 24px; letter-spacing: 2px;">CHIPTUNING SYSTEM</h1>
              </div>
              <div style="padding: 30px; line-height: 1.6; color: #333;">
                <h2 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px;">Actualización de Requerimiento</h2>
                <p>Hola,</p>
                <p>Te informamos que el archivo para el vehículo con patente <strong>${patente}</strong> ha cambiado su estado a:</p>
                <div style="background-color: #f3f4f6; padding: 15px; border-left: 4px solid ${nuevoEstado === 'completado' ? '#22c55e' : '#facc15'}; margin: 20px 0; font-weight: bold; font-size: 18px; text-align: center; text-transform: uppercase; color: ${nuevoEstado === 'completado' ? '#166534' : '#854d0e'};">
                  ${nuevoEstado === 'completado' ? '✅ ' + nuevoEstado : '🔍 ' + nuevoEstado}
                </div>
                <p>${nuevoEstado === 'completado' ? 'Ya puedes descargar tu archivo modificado desde el portal oficial.' : 'Nuestro equipo técnico ya está trabajando en tu solicitud.'}</p>
                <div style="text-align: center; margin-top: 30px;">
                  <a href="https://chiptuning.cl/archivos" style="background-color: #2563eb; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">IR AL PORTAL</a>
                </div>
              </div>
            </div>
          </div>
        `;

        await supabase.functions.invoke('swift-function', {
          body: { to: clienteEmail, subject: subjectText, html: emailHtml },
        });
      }

      setArchivos(prev => prev.map(a => a.id === archivoId ? { ...a, estado: nuevoEstado } : a));
    } catch (error) {
      console.error("Error:", error.message);
    }
  };

  const styles = {
    mainContent: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: darkMode ? '#0f172a' : '#f3f4f6',
      width: '100%',
      minHeight: '100vh',
      transition: 'all 0.3s ease'
    },
    tableCard: {
      backgroundColor: darkMode ? '#1e293b' : 'white',
      margin: '10px',
      padding: '15px',
      borderRadius: '4px',
      boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.05)',
      color: darkMode ? '#ffffff' : '#333333',
      transition: 'all 0.3s ease'
    },
    responsiveContainer: { width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginBottom: '20px' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '20px', minWidth: '800px' },
    th: {
      textAlign: 'left',
      padding: '12px',
      borderBottom: darkMode ? '2px solid #334155' : '2px solid #eee',
      fontSize: '10px',
      color: darkMode ? '#94a3b8' : '#666',
      textTransform: 'uppercase',
      fontWeight: 'bold'
    },
    td: {
      padding: '12px',
      borderBottom: darkMode ? '1px solid #334155' : '1px solid #eee',
      fontSize: '12px',
      color: darkMode ? '#e2e8f0' : '#333333'
    },
    statusBadge: { padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', color: 'white', textTransform: 'uppercase', whiteSpace: 'nowrap' },
    selectAdmin: {
      padding: '5px',
      fontSize: '10px',
      fontWeight: 'bold',
      borderRadius: '4px',
      border: darkMode ? '1px solid #475569' : '1px solid #ddd',
      cursor: 'pointer',
      outline: 'none',
      backgroundColor: darkMode ? '#0f172a' : 'white',
      color: darkMode ? '#ffffff' : '#000000'
    },
    searchBar: {
      display: 'flex',
      alignItems: 'center',
      backgroundColor: darkMode ? '#0f172a' : '#f3f4f6',
      padding: '6px 12px',
      borderRadius: '4px',
      border: darkMode ? '1px solid #334155' : '1px solid #ddd'
    },
    statusSelector: {
      padding: '6px 12px',
      borderRadius: '4px',
      border: darkMode ? '1px solid #334155' : '1px solid #ddd',
      fontSize: '12px',
      outline: 'none',
      backgroundColor: darkMode ? '#0f172a' : '#fff',
      cursor: 'pointer',
      fontWeight: 'bold',
      color: darkMode ? '#ffffff' : '#333',
      marginRight: '10px'
    },
    modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' },
    modalContent: {
      backgroundColor: darkMode ? '#1e293b' : 'white',
      width: '100%',
      maxWidth: '500px',
      borderRadius: '4px',
      overflow: 'hidden',
      boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
      border: darkMode ? '1px solid #334155' : 'none'
    },
    modalHeader: { backgroundColor: '#000', color: '#2563eb', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #2563eb' },
    modalBody: { padding: '25px', maxHeight: '75vh', overflowY: 'auto' },
    infoTable: { width: '100%', borderCollapse: 'collapse', marginBottom: '20px' },
    infoLabel: {
      padding: '8px 0',
      fontWeight: 'bold',
      fontSize: '11px',
      color: darkMode ? '#ffffff' : '#000',
      borderBottom: darkMode ? '1px solid #334155' : '1px solid #eee',
      textTransform: 'uppercase',
      width: '40%'
    },
    infoValue: {
      padding: '8px 0',
      fontSize: '12px',
      color: darkMode ? '#cbd5e1' : '#444',
      borderBottom: darkMode ? '1px solid #334155' : '1px solid #eee'
    },
    pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '30px', paddingBottom: '20px' },
    pageBtn: (active) => ({
      padding: '8px 16px',
      cursor: 'pointer',
      backgroundColor: active ? '#2563eb' : (darkMode ? '#0f172a' : 'white'),
      color: active ? 'white' : (darkMode ? '#94a3b8' : '#666'),
      border: darkMode ? '1px solid #334155' : '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: 'bold',
      transition: '0.2s'
    }),
    btnDownload: { border: 'none', fontSize: '9px', padding: '6px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'none', textAlign: 'center', color: 'white', display: 'block', width: '100%' },
    timeTag: {
      fontSize: '9px',
      color: darkMode ? '#94a3b8' : '#666',
      textAlign: 'center',
      marginTop: '2px',
      fontWeight: '500'
    }
  };

  const getBadgeColor = (estado) => {
    const e = estado?.toLowerCase();
    if (e === 'completado') return '#22c55e';
    if (e === 'pendiente') return '#f59e0b';
    if (e === 'en gestión') return '#3b82f6';
    return '#2563eb';
  };

  const filteredArchivos = archivos.filter(a => {
    const term = searchTerm.trim().toLowerCase();

    const matchOrden = a.numero_orden?.toString() === term;
    const matchPatente = a.patente?.toLowerCase().includes(term);
    const matchEmail = a.profiles?.email?.toLowerCase().includes(term);

    const matchSearch = !term || matchOrden || matchPatente || matchEmail;
    const matchStatus = statusFilter === 'todos' || a.estado === statusFilter;

    return matchSearch && matchStatus;
  });

  const totalPaginas = Math.ceil(filteredArchivos.length / itemsPorPagina);
  const indiceUltimo = paginaActual * itemsPorPagina;
  const indicePrimer = indiceUltimo - itemsPorPagina;
  const archivosPaginados = filteredArchivos.slice(indicePrimer, indiceUltimo);

  return (
    <div style={styles.mainContent}>
      <div style={styles.tableCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ backgroundColor: '#2563eb', color: 'white', padding: '5px 12px', fontSize: '10px', fontWeight: 'bold' }}>
            {isAdmin ? "MODO ADMINISTRADOR" : "PORTAL OFICIAL"}
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <select style={styles.statusSelector} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPaginaActual(1); }}>
              <option value="todos">ESTADO (TODOS)</option>
              <option value="pendiente">PENDIENTES</option>
              <option value="en gestión">EN GESTIÓN</option>
              <option value="completado">COMPLETADOS</option>
            </select>
            <div style={styles.searchBar}>
              <span style={{ fontSize: '12px', marginRight: '8px', color: darkMode ? '#94a3b8' : '#333' }}>🔍</span>
              <input
                type="text"
                placeholder="Buscar..."
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '12px', width: '150px', color: darkMode ? '#ffffff' : '#000000' }}
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPaginaActual(1); }}
              />
            </div>
          </div>
        </div>

        {/* 🕒 --- BANNER INFORMATIVO DE HORARIO --- */}
        <div style={{
          marginTop: '15px',
          padding: '10px 14px',
          backgroundColor: darkMode ? '#0f172a' : '#f8fafc',
          borderLeft: '4px solid #f59e0b', // Borde lateral amarillo/ámbar de advertencia
          borderTop: darkMode ? '1px solid #1e293b' : '1px solid #e2e8f0',
          borderRight: darkMode ? '1px solid #1e293b' : '1px solid #e2e8f0',
          borderBottom: darkMode ? '1px solid #1e293b' : '1px solid #e2e8f0',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: darkMode ? '#cbd5e1' : '#475569',
          fontSize: '11px'
        }}>
          <span style={{ fontSize: '16px' }}>🕒</span>
          <div>
            <strong>Horario de atención técnica:</strong> Lunes a Viernes de 09:00 a 18:30 hrs.
            <span style={{ color: darkMode ? '#94a3b8' : '#64748b', marginLeft: '5px' }}>
              (Las solicitudes recibidas fuera de este horario o en días festivos se procesarán a primera hora del siguiente día hábil).
            </span>
          </div>
        </div>

        <div style={styles.responsiveContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>N° Orden / Fecha / Hora</th>
                {isAdmin && <th style={styles.th}>Empresa</th>}
                {isAdmin && <th style={styles.th}>Correo</th>}
                <th style={styles.th}>Patente</th>
                <th style={styles.th}>Marca / Modelo</th>
                <th style={styles.th}>Ficha</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Acción</th>
                <th style={styles.th}>Acción ADMI</th>
                <th style={styles.th}>Mensaje Técnico</th>
                <th style={styles.th}>Eliminar</th>
              </tr>
            </thead>
            <tbody>
              {archivosPaginados.map((archivo) => (
                <tr key={archivo.id}>
                  <td style={styles.td}>
                    <div style={{ fontWeight: 'bold', color: '#2563eb', fontSize: '14px' }}>
                      #{archivo.numero_orden || '---'}
                    </div>
                    <div style={{ fontSize: '11px', color: darkMode ? '#94a3b8' : '#666', fontWeight: '500', marginTop: '2px' }}>
                      📅 {new Date(archivo.created_at).toLocaleDateString('es-CL')}
                    </div>
                    <div style={{ fontSize: '11px', color: darkMode ? '#64748b' : '#888', fontStyle: 'italic', marginTop: '1px' }}>
                      🕒 {new Date(archivo.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} hrs
                    </div>
                  </td>

                  {isAdmin && <td style={{ ...styles.td, fontWeight: 'bold', color: '#2563eb' }}>{archivo.profiles?.company || 'PARTICULAR'}</td>}
                  {isAdmin && (
                    <td style={{ ...styles.td, fontSize: '11px', color: darkMode ? '#cbd5e1' : '#555' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        {archivo.profiles?.cliente_especial && (
                          <span
                            title="Cliente especial"
                            style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b', flexShrink: 0, display: 'inline-block' }}
                          />
                        )}
                        {archivo.profiles?.email || '---'}
                      </span>
                    </td>
                  )}
                  <td style={styles.td}>{archivo.patente}</td>
                  <td style={styles.td}>{archivo.marca_modelo}</td>
                  <td style={styles.td}>
                    <button onClick={() => setArchivoDetalle(archivo)} style={{ backgroundColor: darkMode ? '#2563eb' : '#000', color: '#fff', border: 'none', padding: '4px 8px', fontSize: '9px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '2px' }}>DETALLES</button>
                  </td>
                  <td style={styles.td}>
                    {isAdmin ? (
                      <select style={{ ...styles.selectAdmin, color: getBadgeColor(archivo.estado), borderColor: getBadgeColor(archivo.estado) }} value={archivo.estado} onChange={(e) => handleStatusChange(archivo.id, e.target.value, archivo.profiles?.email, archivo.patente)}>
                        <option value="pendiente">Pendiente</option>
                        <option value="en gestión">En Gestión</option>
                        <option value="completado">Completado</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    ) : <span style={{ ...styles.statusBadge, backgroundColor: getBadgeColor(archivo.estado) }}>{archivo.estado}</span>}
                  </td>

                  {/* --- COLUMNA ACCIÓN (USUARIO) --- */}
                  <td style={styles.td}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', minWidth: '110px' }}>
                      {archivo.file_url_id && <button onClick={() => handleForceDownload(archivo.file_url_id)} style={{ ...styles.btnDownload, background: '#3b82f6' }}>🆔 ID (Export Console)</button>}
                      {archivo.file_url_mapa && <button onClick={() => handleForceDownload(archivo.file_url_mapa)} style={{ ...styles.btnDownload, background: '#8b5cf6' }}>🗺️ MAPA</button>}
                      {archivo.file_url_password && <button onClick={() => handleForceDownload(archivo.file_url_password)} style={{ ...styles.btnDownload, background: '#f59e0b' }}>🔑 PASSWORD</button>}

                      {archivo.file_url && !archivo.file_url_id && !archivo.file_url_mapa && (
                        <button onClick={() => handleForceDownload(archivo.file_url)} style={{ ...styles.btnDownload, background: darkMode ? '#334155' : '#fff', border: darkMode ? '1px solid #475569' : '1px solid #ddd', color: darkMode ? '#ffffff' : '#666' }}>📄 ORIGINAL</button>
                      )}
                    </div>
                  </td>

                  {/* --- COLUMNA ACCIÓN ADMI (DESCARGA CON HORA Y DÍA) --- */}
                  {/* --- COLUMNA ACCIÓN ADMI (V1, V2 y V3) --- */}
                  <td style={styles.td}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '130px' }}>

                      {/* --- ARCHIVO MOD / V1 --- */}
                      {archivo.mod_file_url ? (
                        <div>
                          <button onClick={() => handleForceDownload(archivo.mod_file_url)} style={{ ...styles.btnDownload, background: '#22c55e' }}>🚀 DESCARGAR MOD</button>
                          {archivo.mod_uploaded_at && (
                            <div style={styles.timeTag}>
                              📅 {new Date(archivo.mod_uploaded_at).toLocaleDateString('es-CL')} 🕒 {new Date(archivo.mod_uploaded_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </div>
                      ) : isAdmin && (
                        <label style={{ backgroundColor: '#000', color: '#22c55e', padding: '5px', fontSize: '9px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #22c55e', textAlign: 'center', fontWeight: 'bold' }}>
                          {loading ? '...' : '📤 SUBIR MOD'}
                          <input type="file" style={{ display: 'none' }} onChange={(e) => handleUploadModificado(archivo.id, e.target.files[0], archivo.patente, archivo.profiles?.email, 'mod_file_url')} />
                        </label>
                      )}

                      {/* --- ARCHIVO V2 --- */}
                      {archivo.mod_file_extra_url ? (
                        <div>
                          <button onClick={() => handleForceDownload(archivo.mod_file_extra_url)} style={{ ...styles.btnDownload, background: '#10b981' }}>📦 DESCARGAR V2</button>
                          {archivo.mod_extra_uploaded_at && (
                            <div style={styles.timeTag}>
                              📅 {new Date(archivo.mod_extra_uploaded_at).toLocaleDateString('es-CL')} 🕒 {new Date(archivo.mod_extra_uploaded_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </div>
                      ) : isAdmin && (
                        <label style={{ backgroundColor: '#111', color: '#10b981', padding: '5px', fontSize: '9px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #10b981', textAlign: 'center', fontWeight: 'bold' }}>
                          {loading ? '...' : '➕ SUBIR V2'}
                          <input type="file" style={{ display: 'none' }} onChange={(e) => handleUploadModificado(archivo.id, e.target.files[0], archivo.patente, archivo.profiles?.email, 'mod_file_extra_url')} />
                        </label>
                      )}

                      {/* --- ARCHIVO V3 --- */}
                      {archivo.mod_v3_file_url ? (
                        <div>
                          <button onClick={() => handleForceDownload(archivo.mod_v3_file_url)} style={{ ...styles.btnDownload, background: '#06b6d4' }}>⚡ DESCARGAR V3</button>
                          {archivo.mod_v3_uploaded_at && (
                            <div style={styles.timeTag}>
                              📅 {new Date(archivo.mod_v3_uploaded_at).toLocaleDateString('es-CL')} 🕒 {new Date(archivo.mod_v3_uploaded_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </div>
                      ) : isAdmin && (
                        <label style={{ backgroundColor: '#083344', color: '#06b6d4', padding: '5px', fontSize: '9px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #06b6d4', textAlign: 'center', fontWeight: 'bold' }}>
                          {loading ? '...' : '⚡ SUBIR V3'}
                          <input type="file" style={{ display: 'none' }} onChange={(e) => handleUploadModificado(archivo.id, e.target.files[0], archivo.patente, archivo.profiles?.email, 'mod_v3_file_url')} />
                        </label>
                      )}

                    </div>
                  </td>
                  {/* --- MENSAJE TÉCNICO --- */}
                  <td style={{ ...styles.td, minWidth: '180px' }}>
                    <div style={{
                      fontSize: '11px', padding: '10px',
                      backgroundColor: archivo.notas_instalacion ? (darkMode ? '#312e81' : '#fffbeb') : (darkMode ? '#0f172a' : '#f9f9f9'),
                      border: '1px solid ' + (archivo.notas_instalacion ? (darkMode ? '#4338ca' : '#fef3c7') : (darkMode ? '#334155' : '#eee')),
                      borderRadius: '4px', color: darkMode ? '#e2e8f0' : '#333', minHeight: '50px'
                    }}>
                      {archivo.notas_instalacion ? (
                        <><div style={{ fontWeight: 'bold', color: darkMode ? '#a5b4fc' : '#92400e', marginBottom: '4px', fontSize: '9px' }}>📝 INSTRUCCIONES:</div>{archivo.notas_instalacion}</>
                      ) : (
                        <span style={{ color: darkMode ? '#475569' : '#aaa', fontStyle: 'italic' }}>No se han subido instrucciones...</span>
                      )}
                      {isAdmin && (
                        <button onClick={() => handleGuardarNota(archivo.id, archivo.notas_instalacion)} style={{ display: 'block', marginTop: '8px', backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '3px 7px', fontSize: '9px', fontWeight: 'bold', borderRadius: '2px', cursor: 'pointer' }}>
                          {archivo.notas_instalacion ? 'EDITAR MENSAJE' : '+ ESCRIBIR NOTA'}
                        </button>
                      )}
                    </div>
                  </td>

                  {/* --- ELIMINAR / CANCELAR --- */}
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    {!isAdmin && archivo.estado === 'pendiente' ? (
                      <button
                        onClick={() => handleCancelarSolicitud(archivo)}
                        style={{
                          backgroundColor: darkMode ? '#0f172a' : 'white',
                          color: '#2563eb',
                          border: '1px solid #2563eb',
                          padding: '6px 10px',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          borderRadius: '4px',
                        }}
                      >
                        ❌ CANCELAR
                      </button>
                    ) : (
                      <span style={{ color: darkMode ? '#475569' : '#ccc', fontSize: '10px' }}>---</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPaginas > 1 && (
          <div style={styles.pagination}>
            <button onClick={() => { setPaginaActual(p => Math.max(1, p - 1)); window.scrollTo(0, 0); }} disabled={paginaActual === 1} style={{ ...styles.pageBtn(false), opacity: paginaActual === 1 ? 0.3 : 1 }}>← ANTERIOR</button>
            {[...Array(totalPaginas).keys()].map(n => <button key={n + 1} onClick={() => { setPaginaActual(n + 1); window.scrollTo(0, 0); }} style={styles.pageBtn(paginaActual === n + 1)}>{n + 1}</button>)}
            <button onClick={() => { setPaginaActual(p => Math.min(totalPaginas, p + 1)); window.scrollTo(0, 0); }} disabled={paginaActual === totalPaginas} style={{ ...styles.pageBtn(false), opacity: paginaActual === totalPaginas ? 0.3 : 1 }}>SIGUIENTE →</button>
          </div>
        )}
      </div>

      {archivoDetalle && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '13px', color: '#ffffff' }}>ORDEN N° {archivoDetalle.numero_orden} - {archivoDetalle.patente}</h3>
              <button onClick={() => setArchivoDetalle(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={styles.modalBody}>
              <table style={styles.infoTable}>
                <tbody>
                  {[
                    ['License Plate', archivoDetalle.patente],
                    ['Brand / Model', archivoDetalle.marca_modelo],
                    ['Year', archivoDetalle.detalles_tecnicos?.anio],
                    ['Motor', archivoDetalle.detalles_tecnicos?.motor],
                    ['HP', archivoDetalle.detalles_tecnicos?.hp],
                    ['Fuel', archivoDetalle.detalles_tecnicos?.combustible],
                    ['ECU', archivoDetalle.detalles_tecnicos?.ecu],
                    ['Services', archivoDetalle.detalles_tecnicos?.servicios_solicitados],
                    ['Credits', archivoDetalle.detalles_tecnicos?.costo_creditos]
                  ].map(([label, value]) => (
                    <tr key={label}>
                      <td style={styles.infoLabel}>{label}</td>
                      <td style={styles.infoValue}>{value || '---'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: '20px', backgroundColor: darkMode ? '#0f172a' : '#f9f9f9', padding: '15px', borderLeft: '4px solid #2563eb' }}>
                <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#2563eb' }}>COMMENTS:</div>
                <p style={{ margin: 0, fontSize: '12px', fontStyle: 'italic', color: darkMode ? '#cbd5e1' : '#444' }}>{archivoDetalle.detalles_tecnicos?.comentarios || 'No comments provided.'}</p>
              </div>

              {archivoDetalle.detalles_tecnicos?.archivos_adicionales?.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#2563eb', marginBottom: '8px' }}>ARCHIVOS ADICIONALES:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {archivoDetalle.detalles_tecnicos.archivos_adicionales.map((adj, i) => (
                      <button
                        key={i}
                        onClick={() => handleForceDownload(adj.url)}
                        style={{ ...styles.btnDownload, background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        ⬇️ {adj.nombre || `Adjunto ${i + 1}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div style={{ padding: '15px', textAlign: 'right', borderTop: darkMode ? '1px solid #334155' : 'none' }}>
              <button onClick={() => setArchivoDetalle(null)} style={{ backgroundColor: '#000', color: 'white', border: 'none', padding: '8px 25px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', borderRadius: '2px' }}>CLOSE</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Archivos;