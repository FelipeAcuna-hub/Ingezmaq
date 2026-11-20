// Informe "Descargar info archivos": toda la info de cada solicitud, sin los
// archivos en sí. Lo usan Archivos.jsx y Admin.jsx, así ambos botones generan
// exactamente el mismo Excel.

const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

const formatearFecha = (valor) => valor ? new Date(valor).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' }) : '';

export const nombreCliente = (perfil) => `${perfil?.full_name || ''} ${perfil?.apellido || ''}`.trim();

// Nombre de pestaña para un mes, por ejemplo "NOV 2026".
export const nombrePestanaMes = (fecha) => `${MESES[fecha.getMonth()]} ${fecha.getFullYear()}`;

const filaInforme = (a) => {
  const dt = a.detalles_tecnicos || {};
  return {
    'N° Orden': a.numero_orden || '',
    'ID Solicitud': a.id,
    'Nombre completo cliente': nombreCliente(a.profiles),
    'Empresa': a.profiles?.company || 'PARTICULAR',
    'Correo cliente': a.profiles?.email || '',
    'Teléfono cliente': a.profiles?.phone || '',
    'RUT cliente': a.profiles?.rut || '',
    'Actividad cliente': a.profiles?.actividad || '',
    'País cliente': a.profiles?.country || '',
    'Fecha de nacimiento cliente': a.profiles?.fecha_nacimiento || '',
    'Créditos actuales del cliente': a.profiles?.credits ?? '',
    'Cuenta aprobada': a.profiles?.is_approved ? 'Sí' : 'No',
    'Cliente especial': a.profiles?.cliente_especial ? 'Sí' : 'No',
    'Descuento del cliente (%)': a.profiles?.descuento_porcentaje ?? 0,
    'Aprobado por': a.profiles?.approved_by || '',
    'Fecha de aprobación del cliente': formatearFecha(a.profiles?.approved_at),
    'Patente': a.patente || '',
    'Marca / Modelo': a.marca_modelo || '',
    'Año': dt.anio || '',
    'Motor': dt.motor || '',
    'HP': dt.hp || '',
    'Combustible': dt.combustible || '',
    'ECU': dt.ecu || '',
    'Tipo de módulo': dt.tipo_modulo || '',
    'Servicio solicitado': dt.servicios_solicitados || '',
    'Programa Modificador': a.programa_modificador || '',
    'Centralita / ECU / TCU': a.centralita_ecu_tcu || '',
    'Créditos (costo)': dt.costo_creditos ?? '',
    'Comentarios del cliente': dt.comentarios || '',
    'Estado actual': a.estado || '',
    'Fecha y hora de solicitud': formatearFecha(a.created_at),
    'Fecha y hora "en gestión"': formatearFecha(a.en_gestion_at),
    'Admin que puso "en gestión"': a.en_gestion_by || '',
    'Fecha y hora envío MOD': formatearFecha(a.mod_uploaded_at),
    'Admin que subió MOD': a.mod_uploaded_by || '',
    'Fecha y hora envío V2': formatearFecha(a.mod_extra_uploaded_at),
    'Admin que subió V2': a.mod_extra_uploaded_by || '',
    'Fecha y hora envío V3': formatearFecha(a.mod_v3_uploaded_at),
    'Admin que subió V3': a.mod_v3_uploaded_by || '',
    'Notas de instalación (mensaje técnico)': a.notas_instalacion || '',
    'Anexos adicionales del cliente': dt.archivos_adicionales?.length || 0
  };
};

const agregarHoja = (XLSX, wb, archivos, nombre) => {
  const filas = archivos.length > 0
    ? archivos.map(filaInforme)
    : [{ 'N° Orden': '', 'ID Solicitud': 'Sin solicitudes registradas' }];
  const hoja = XLSX.utils.json_to_sheet(filas);
  hoja['!cols'] = Object.keys(filas[0]).map(() => ({ wch: 22 }));
  XLSX.utils.book_append_sheet(wb, hoja, nombre);
};

// separarPorMes: además de la hoja principal, una pestaña por cada mes con
// solicitudes (según la fecha de creación, en hora local), de la más antigua
// a la más reciente.
export const crearLibroInforme = (XLSX, archivos, { nombreHoja = 'Solicitudes', separarPorMes = false } = {}) => {
  const ordenados = [...archivos].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const wb = XLSX.utils.book_new();
  agregarHoja(XLSX, wb, ordenados, nombreHoja);

  if (separarPorMes) {
    const porMes = new Map();
    for (const a of ordenados) {
      const fecha = new Date(a.created_at);
      if (!a.created_at || isNaN(fecha)) continue;
      const clave = fecha.getFullYear() * 12 + fecha.getMonth();
      if (!porMes.has(clave)) porMes.set(clave, { nombre: nombrePestanaMes(fecha), archivos: [] });
      porMes.get(clave).archivos.push(a);
    }
    [...porMes.keys()]
      .sort((x, y) => x - y)
      .forEach(clave => agregarHoja(XLSX, wb, porMes.get(clave).archivos, porMes.get(clave).nombre));
  }

  return wb;
};
