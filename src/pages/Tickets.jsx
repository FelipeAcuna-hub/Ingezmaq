import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const Tickets = ({ session }) => {
  const [tickets, setTickets] = useState([]);
  const [clientes, setClientes] = useState([]); // Lista de clientes para el select admin
  const [selectedClienteId, setSelectedClienteId] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const [asunto, setAsunto] = useState('');
  const [mensajeInicial, setMensajeInicial] = useState('');
  const [nuevoTicketFile, setNuevoTicketFile] = useState(null);

  const { darkMode } = useOutletContext();

  const ADMIN_EMAILS = [
    'sebastianzunigavaldivia@gmail.com',
    'oliver.zuniga@gmail.com',
    'focaldevs@gmail.com'
  ];
  const isAdmin = ADMIN_EMAILS.includes(session?.user?.email?.toLowerCase());

  useEffect(() => { 
    fetchTickets(); 
    if (isAdmin) {
      fetchClientes();
    }
  }, [session, isAdmin]);
  
  useEffect(() => { 
    if (selectedTicket?.id) {
      fetchMessages(selectedTicket.id); 
    }
  }, [selectedTicket?.id]);

  const fetchClientes = async () => {
    // Obtenemos los perfiles para que el admin escoja el destinatario
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, company, full_name')
      .order('email', { ascending: true });

    if (!error && data) {
      setClientes(data);
      if (data.length > 0) setSelectedClienteId(data[0].id);
    }
  };

  const fetchTickets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tickets')
      .select('*, profiles:user_id(email, company, full_name)')
      .order('created_at', { ascending: false });
  
    if (!error) {
      setTickets(isAdmin ? data : data.filter(t => t.user_id === session.user.id));
    }
    setLoading(false);
  };

  const fetchMessages = async (ticketId) => {
    const { data, error } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    if (error) console.error("Error al cargar mensajes:", error);
    if (data) setMessages(data);
  };

  const abrirWhatsappSoporte = () => {
    const telefonoSoporte = "56997525948";
    const texto = encodeURIComponent("Hola *Chiptuning* 🏎️, necesito soporte técnico para un archivo.");
    window.open(`https://wa.me/${telefonoSoporte}?text=${texto}`, '_blank');
  };

  // 📧 FUNCIÓN MODIFICADA PARA ENVIAR PLANTILLA HTML BONITA
  const enviarNotificacionEmail = async (destinatario, asuntoEmail, mensajeTexto, fileUrl = null) => {
    try {
      // Plantilla HTML con diseño oscuro corporativo CHIP TUNING
      const plantillaHtml = `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #030712; padding: 25px; color: #ffffff; margin: 0;">
          <div style="max-width: 580px; margin: 0 auto; background-color: #070f24; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            
            <!-- CABECERA INSTITUCIONAL -->
            <div style="background-color: #000000; padding: 25px; text-align: center; border-bottom: 3px solid #ea580c;">
              <h1 style="color: #ffffff; margin: 0; font-size: 20px; letter-spacing: 2px; font-weight: bold; text-transform: uppercase;">CHIP TUNING</h1>
              <span style="color: #ea580c; font-size: 11px; font-weight: bold; letter-spacing: 1px; display: block; margin-top: 4px;">SISTEMA DE SOPORTE TÉCNICO</span>
            </div>

            <!-- CUERPO DE LA NOTIFICACIÓN -->
            <div style="padding: 30px;">
              <h2 style="font-size: 16px; color: #ffffff; margin-top: 0; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">
                📌 ${asuntoEmail}
              </h2>

              <div style="background-color: #0d1527; border: 1px solid #1e293b; padding: 20px; border-radius: 8px; margin-top: 20px; margin-bottom: 25px;">
                <div style="font-size: 10px; color: #ea580c; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Detalle del Mensaje</div>
                <div style="font-size: 14px; color: #e2e8f0; line-height: 1.5; white-space: pre-wrap;">${mensajeTexto}</div>

                ${fileUrl ? `
                  <div style="margin-top: 15px; padding-top: 12px; border-top: 1px dashed #334155;">
                    <a href="${fileUrl}" target="_blank" style="color: #38bdf8; font-weight: bold; font-size: 12px; text-decoration: none; display: inline-flex; align-items: center; gap: 5px;">
                      📎 DESCARGAR ARCHIVO ADJUNTO
                    </a>
                  </div>
                ` : ''}
              </div>

              <!-- BOTÓN DE ACCIÓN DIRECTA -->
              <div style="text-align: center; margin-top: 30px;">
                <a href="https://chiptuning.cl/tickets" style="background-color: #ea580c; color: #ffffff; padding: 12px 26px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 12px; display: inline-block; letter-spacing: 1px;">
                  VER EN EL PORTAL DE SOPORTE
                </a>
              </div>
            </div>

            <!-- PIE DE PÁGINA -->
            <div style="background-color: #02050d; padding: 15px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #1e293b;">
              Este es un mensaje automático generado por la plataforma Chiptuning.cl
            </div>

          </div>
        </div>
      `;

      await supabase.functions.invoke('swift-function', {
        body: { 
          to: destinatario, 
          subject: asuntoEmail, 
          html: plantillaHtml 
        },
      });
    } catch (err) { 
      console.error("Error email:", err); 
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedTicket) return;

    try {
      setUploadingFile(true);
      const nombreOriginal = file.name;
      const fileName = `${Date.now()}_${nombreOriginal.replace(/\s+/g, '_')}`;
      const filePath = `tickets/${selectedTicket.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('archivos-vehiculos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('archivos-vehiculos')
        .getPublicUrl(filePath);

      await insertarMensaje(`📎 Archivo enviado: ${nombreOriginal}`, publicUrl);
      
    } catch (error) {
      alert("Error al subir archivo: " + error.message);
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  const insertarMensaje = async (texto, fileUrl = null) => {
    // 💡 Corregido: la columna real en la tabla es "mensaje" (antes decía "menssage", que no existe)
    const { error } = await supabase.from('ticket_messages').insert({
      ticket_id: selectedTicket.id,
      sender_id: session.user.id, // 👈 Nombre correcto según tu base de datos
      mensaje: texto,   // columna que usa la UI para mostrar el mensaje
      message: texto,   // 👈 la tabla exige esta columna como NOT NULL, se manda el mismo texto
      file_url: fileUrl,
      is_admin_reply: isAdmin // 👈 Agregado: sin esto, todos los mensajes se veían como si fueran del cliente
    });

    if (!error) {
      fetchMessages(selectedTicket.id);
      const emailDestino = isAdmin ? selectedTicket.profiles?.email : ADMIN_EMAILS.join(',');
      await enviarNotificacionEmail(
        emailDestino, 
        `Nuevo mensaje en ticket: ${selectedTicket.asunto}`, 
        texto,
        fileUrl
      );
    } else {
      console.error("Error al insertar mensaje:", error);
      alert("No se pudo guardar el mensaje: " + error.message);
    }
  };

  const enviarRespuesta = async (e) => {
    e.preventDefault();
    if (!nuevoMensaje.trim()) return;
    try {
      setSendingMsg(true);
      await insertarMensaje(nuevoMensaje);
      setNuevoMensaje('');
    } catch (err) {
      console.error(err);
    } finally {
      setSendingMsg(false);
    }
  };

  const cambiarEstado = async (id, nuevoEstado) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, estado: nuevoEstado } : t));
    if (selectedTicket?.id === id) setSelectedTicket(prev => ({ ...prev, estado: nuevoEstado }));
    await supabase.from('tickets').update({ estado: nuevoEstado }).eq('id', id);
  };

  const crearTicket = async (e) => {
    e.preventDefault();
    let uploadedFileUrl = null;

    // Determinamos quién es el dueño del ticket (El usuario logueado o el cliente seleccionado por el admin)
    const targetUserId = isAdmin ? selectedClienteId : session.user.id;

    if (!targetUserId) {
      alert("Por favor selecciona un cliente para el ticket.");
      return;
    }

    if (nuevoTicketFile) {
      try {
        const cleanName = nuevoTicketFile.name
          .replace(/\s+/g, '_')
          .replace(/[()]/g, '')
          .replace(/[{}]/g, '');

        const folderName = Date.now();
        const filePath = `${targetUserId}/${folderName}_${cleanName}`;

        const { error: uploadError } = await supabase.storage
          .from('archivos-tickets')
          .upload(filePath, nuevoTicketFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('archivos-tickets')
          .getPublicUrl(filePath);

        uploadedFileUrl = publicUrl;
      } catch (uploadErr) {
        alert("Error al subir el archivo adjunto: " + uploadErr.message);
        return;
      }
    }

    const { error } = await supabase.from('tickets').insert({
      user_id: targetUserId,
      asunto,
      mensaje_inicial: mensajeInicial,
      estado: 'Pendiente',
      file_url: uploadedFileUrl,
      is_admin_ticket: isAdmin // 👈 para saber si el mensaje inicial lo escribió el admin (ticket creado a nombre de un cliente)
    });

    if (!error) {
      alert("✅ Ticket enviado exitosamente.");
      const clienteTarget = clientes.find(c => c.id === targetUserId);
      const emailNotif = isAdmin ? clienteTarget?.email : ADMIN_EMAILS.join(',');

      if (emailNotif) {
        await enviarNotificacionEmail(
          emailNotif, 
          `NUEVO TICKET: ${asunto}`, 
          mensajeInicial,
          uploadedFileUrl
        );
      }
      
      setShowModal(false); 
      setAsunto(''); 
      setMensajeInicial(''); 
      setNuevoTicketFile(null); 
      fetchTickets();
    } else {
      alert("Error al crear el ticket: " + error.message);
    }
  };

  // Función helper para dar formato a fecha y hora
  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.toLocaleDateString('es-CL')} ${date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} hrs`;
  };

  const styles = {
    mainContent: { 
      flex: 1, 
      padding: '20px', 
      backgroundColor: darkMode ? '#0f172a' : '#f3f4f6', 
      minHeight: '100vh', 
      fontFamily: 'sans-serif',
      transition: 'all 0.3s ease'
    },
    card: { 
      backgroundColor: darkMode ? '#1e293b' : 'white', 
      padding: '30px', 
      borderRadius: '4px', 
      boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.05)', 
      marginBottom: '20px',
      color: darkMode ? '#ffffff' : '#333333',
      transition: 'all 0.3s ease'
    },
    btnTicket: { backgroundColor: '#e11d48', color: 'white', padding: '12px 24px', border: 'none', fontWeight: 'bold', cursor: 'pointer', borderRadius: '2px' },
    btnWhatsapp: { backgroundColor: '#25D366', color: 'white', padding: '12px 24px', border: 'none', fontWeight: 'bold', cursor: 'pointer', borderRadius: '2px', display: 'inline-flex', alignItems: 'center', gap: '8px' },
    badge: (estado) => ({
      padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold',
      backgroundColor: estado === 'Resuelto' ? '#267358' : estado === 'En Curso' ? '#f59e0b' : '#e11d48', color: 'white'
    }),
    modal: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
    chatBox: { 
      backgroundColor: darkMode ? '#1e293b' : 'white', 
      width: '90%', 
      maxWidth: '600px', 
      height: '85vh', 
      borderRadius: '8px', 
      display: 'flex', 
      flexDirection: 'column', 
      overflow: 'hidden',
      border: darkMode ? '1px solid #334155' : 'none'
    },
    // 💡 "esMio" es relativo a quién está viendo el chat: mis propios mensajes siempre a la derecha (rojo),
    // los del otro (cliente o admin, según corresponda) siempre a la izquierda (gris).
    message: (esMio) => ({
      alignSelf: esMio ? 'flex-end' : 'flex-start',
      backgroundColor: esMio 
        ? '#e11d48' 
        : (darkMode ? '#334155' : '#f1f1f1'),
      color: esMio 
        ? 'white' 
        : (darkMode ? '#f1f5f9' : '#333'),
      padding: '10px 15px', borderRadius: '10px', marginBottom: '10px', maxWidth: '80%', fontSize: '14px',
      wordBreak: 'break-word', overflowWrap: 'anywhere', display: 'flex', flexDirection: 'column'
    }),
    messageDate: (esMio) => ({
      fontSize: '10px',
      marginTop: '5px',
      alignSelf: 'flex-end',
      opacity: 0.8,
      color: esMio ? '#f8fafc' : (darkMode ? '#94a3b8' : '#666')
    }),
    tableHeader: {
      textAlign: 'left', 
      borderBottom: darkMode ? '2px solid #334155' : '2px solid #eee', 
      fontSize: '12px', 
      color: darkMode ? '#94a3b8' : '#888'
    },
    tableRow: {
      borderBottom: darkMode ? '1px solid #334155' : '1px solid #eee'
    },
    thCell: { padding: '12px' },
    tdCell: {
      padding: '12px',
      fontSize: '13px',
      color: darkMode ? '#e2e8f0' : '#333333'
    },
    inputStyle: {
      width: '100%', 
      padding: '10px', 
      marginBottom: '15px', 
      border: darkMode ? '1px solid #475569' : '1px solid #ddd',
      backgroundColor: darkMode ? '#0f172a' : '#ffffff',
      color: darkMode ? '#ffffff' : '#000000',
      outline: 'none',
      borderRadius: '4px'
    },
    labelStyle: {
      display: 'block',
      fontSize: '11px',
      fontWeight: 'bold',
      color: darkMode ? '#94a3b8' : '#333333',
      marginBottom: '5px'
    }
  };

  return (
    <div style={styles.mainContent}>
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <h2 style={{ margin: 0, textTransform: 'uppercase', color: darkMode ? '#f8fafc' : '#333333' }}>Soporte Técnico</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button style={styles.btnWhatsapp} onClick={abrirWhatsappSoporte}>
              <span style={{ fontSize: '18px' }}>💬</span> SOPORTE POR WHATSAPP
            </button>
            <button style={styles.btnTicket} onClick={() => setShowModal(true)}>
              {isAdmin ? "NUEVO TICKET ADMIN" : "NUEVO TICKET"}
            </button>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.thCell}>FECHA</th>
              <th style={styles.thCell}>ASUNTO</th>
              {isAdmin && <th style={styles.thCell}>CLIENTE / EMPRESA</th>}
              <th style={styles.thCell}>ESTADO</th>
              <th style={styles.thCell}>ACCIÓN</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map(t => (
              <tr key={t.id} style={styles.tableRow}>
                <td style={styles.tdCell}>{formatDateTime(t.created_at)}</td>
                <td style={styles.tdCell}><strong>{t.asunto}</strong></td>
                {isAdmin && (
                  <td style={styles.tdCell}>
                    <div style={{ fontWeight: 'bold' }}>{t.profiles?.company || 'Particular'}</div>
                    <div style={{ fontSize: '11px', color: darkMode ? '#94a3b8' : '#888' }}>{t.profiles?.email}</div>
                  </td>
                )}
                <td style={styles.tdCell}>
                  <span style={styles.badge(t.estado)}>{t.estado?.toUpperCase()}</span>
                </td>
                <td style={styles.tdCell}>
                  <button 
                    onClick={() => setSelectedTicket(t)} 
                    style={{ 
                      padding: '5px 10px', 
                      cursor: 'pointer', 
                      borderRadius: '4px', 
                      fontSize: '12px',
                      backgroundColor: darkMode ? '#334155' : '#f1f1f1',
                      color: darkMode ? '#ffffff' : '#333333',
                      border: darkMode ? '1px solid #475569' : '1px solid #ddd'
                    }}
                  >
                    VER CHAT
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedTicket && (
        <div style={styles.modal}>
          <div style={styles.chatBox}>
            <div style={{ 
              padding: '20px', 
              borderBottom: darkMode ? '1px solid #334155' : '1px solid #eee', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              backgroundColor: darkMode ? '#0f172a' : '#fafafa' 
            }}>
              <div>
                <h4 style={{ margin: 0, color: darkMode ? '#ffffff' : '#333333' }}>{selectedTicket.asunto}</h4>
                {isAdmin && (
                  <select 
                    value={selectedTicket.estado} 
                    onChange={(e) => cambiarEstado(selectedTicket.id, e.target.value)} 
                    style={{ 
                      marginTop: '5px',
                      backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                      color: darkMode ? '#ffffff' : '#333333',
                      border: darkMode ? '1px solid #475569' : '1px solid #ddd',
                      padding: '4px',
                      borderRadius: '4px'
                    }}
                  >
                    <option value="Pendiente">PENDIENTE</option>
                    <option value="En Curso">EN CURSO</option>
                    <option value="Resuelto">RESUELTO</option>
                  </select>
                )}
              </div>
              <button 
                onClick={() => setSelectedTicket(null)} 
                style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer', color: darkMode ? '#ffffff' : '#333333' }}
              >&times;</button>
            </div>

            <div style={{ 
              flex: 1, 
              padding: '20px', 
              overflowY: 'auto', 
              display: 'flex', 
              flexDirection: 'column', 
              backgroundColor: darkMode ? '#0f172a' : '#f9f9f9' 
            }}>
              {/* Mensaje inicial del ticket. 
                  selectedTicket.is_admin_ticket indica si fue el admin quien lo escribió (ticket creado a nombre de un cliente).
                  Requiere la columna: alter table tickets add column is_admin_ticket boolean default false; */}
              {(() => {
                // El mensaje "Inicio" siempre se muestra como si lo hubiera escrito el administrador
                const inicioEsMio = isAdmin;
                return (
                  <div style={styles.message(inicioEsMio)}>
                    <strong>Inicio:</strong><br/>{selectedTicket.mensaje_inicial}
                    {selectedTicket.file_url && (
                      <div style={{ marginTop: '10px', padding: '10px', backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: '6px' }}>
                        <a href={selectedTicket.file_url} target="_blank" rel="noreferrer" style={{ color: inicioEsMio ? 'white' : '#e11d48', fontWeight: 'bold', fontSize: '12px', textDecoration: 'underline' }}>
                          📥 DESCARGAR ADJUNTO INICIAL
                        </a>
                      </div>
                    )}
                    <span style={styles.messageDate(inicioEsMio)}>
                      {formatDateTime(selectedTicket.created_at)}
                    </span>
                  </div>
                );
              })()}
              
              {/* Resto de mensajes en el chat: "esMio" depende de si quien mira es admin o cliente */}
              {messages.map(m => {
                const esMio = isAdmin ? m.is_admin_reply : !m.is_admin_reply;
                return (
                  <div key={m.id} style={styles.message(esMio)}>
                    {m.mensaje}
                    {m.file_url && (
                      <div style={{ marginTop: '10px', padding: '10px', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '6px' }}>
                        <a href={m.file_url} target="_blank" rel="noreferrer" style={{ color: esMio ? 'white' : '#e11d48', fontWeight: 'bold' }}>
                          📥 DESCARGAR ARCHIVO
                        </a>
                      </div>
                    )}
                    <span style={styles.messageDate(esMio)}>
                      {formatDateTime(m.created_at)}
                    </span>
                  </div>
                );
              })}
            </div>

            <form onSubmit={enviarRespuesta} style={{ 
              padding: '20px', 
              borderTop: darkMode ? '1px solid #334155' : '1px solid #eee', 
              display: 'flex', 
              gap: '10px', 
              alignItems: 'center',
              backgroundColor: darkMode ? '#1e293b' : '#ffffff'
            }}>
              <label style={{ cursor: uploadingFile ? 'default' : 'pointer', fontSize: '20px', color: darkMode ? '#94a3b8' : '#333' }}>
                {uploadingFile ? '⏳' : '📎'}
                <input type="file" style={{ display: 'none' }} onChange={handleFileUpload} disabled={uploadingFile} />
              </label>
              <input 
                style={{ 
                  flex: 1, 
                  padding: '12px', 
                  border: darkMode ? '1px solid #475569' : '1px solid #ddd', 
                  borderRadius: '4px', 
                  backgroundColor: darkMode ? '#0f172a' : 'white', 
                  color: darkMode ? '#ffffff' : '#333' 
                }} 
                placeholder="Escribe un mensaje..." 
                value={nuevoMensaje} 
                onChange={(e) => setNuevoMensaje(e.target.value)} 
              />
              <button type="submit" style={styles.btnTicket} disabled={sendingMsg}>
                {sendingMsg ? 'ENVIANDO...' : 'ENVIAR'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showModal && (
        <div style={styles.modal}>
          <div style={{ ...styles.card, width: '400px', border: darkMode ? '1px solid #334155' : 'none' }}>
            <h3 style={{ color: darkMode ? '#ffffff' : '#333333' }}>
              {isAdmin ? "Crear Ticket de Administrador" : "Nueva Consulta"}
            </h3>
            <form onSubmit={crearTicket}>
              {/* SI ES ADMIN, MOSTRAMOS LA LISTA DE CLIENTES EN LA PARTE SUPERIOR */}
              {isAdmin && (
                <div style={{ marginBottom: '15px' }}>
                  <label style={styles.labelStyle}>SELECCIONAR CLIENTE</label>
                  <select 
                    value={selectedClienteId} 
                    onChange={(e) => setSelectedClienteId(e.target.value)}
                    style={styles.inputStyle}
                    required
                  >
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.company ? `${c.company} (${c.email})` : c.email}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <label style={styles.labelStyle}>ASUNTO</label>
              <input style={styles.inputStyle} required value={asunto} onChange={e => setAsunto(e.target.value)} />
              
              <label style={styles.labelStyle}>MENSAJE</label>
              <textarea style={{ ...styles.inputStyle, height: '100px' }} required value={mensajeInicial} onChange={e => setMensajeInicial(e.target.value)} />
              
              <div style={{ marginBottom: '20px' }}>
                <label style={styles.labelStyle}>ADJUNTAR ARCHIVO (OPCIONAL)</label>
                <input 
                  type="file" 
                  onChange={(e) => setNuevoTicketFile(e.target.files[0])} 
                  style={{ 
                    width: '100%', 
                    padding: '5px', 
                    fontSize: '12px', 
                    border: darkMode ? '1px solid #475569' : '1px solid #eee', 
                    borderRadius: '4px', 
                    backgroundColor: darkMode ? '#0f172a' : '#fafafa',
                    color: darkMode ? '#94a3b8' : '#333333'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" style={styles.btnTicket}>ENVIAR</button>
                <button type="button" onClick={() => { setShowModal(false); setNuevoTicketFile(null); }} style={{ ...styles.btnTicket, backgroundColor: '#666' }}>CERRAR</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tickets;