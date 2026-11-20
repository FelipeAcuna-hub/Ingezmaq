const { createClient } = require('@supabase/supabase-js');

// Traspasa el historial de una cuenta eliminada a la cuenta nueva del mismo
// cliente, justo antes de aprobarla. Mismo listado de accesos que delete-client.
const CLIENTES_ACCESS_EMAILS = [
  'sebastianzunigavaldivia@gmail.com',
  'oliver.zuniga@gmail.com',
  'focaldevs@gmail.com',
  'respaldoestudiovaldivia@gmail.com',
  'alientechchile@gmail.com',
];

const normalizarRut = (rut) => (rut || '').replace(/[.\-\s]/g, '').toUpperCase();
const normalizarEmail = (email) => (email || '').trim().toLowerCase();

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Método no permitido' }) };
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Faltan variables de entorno de Supabase');
    return { statusCode: 500, body: JSON.stringify({ error: 'No configurado' }) };
  }

  const authHeader = event.headers.authorization || event.headers.Authorization;
  const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '') : null;
  if (!token) {
    return { statusCode: 401, body: JSON.stringify({ error: 'No autenticado' }) };
  }

  const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: callerData, error: callerErr } = await supabaseAdmin.auth.getUser(token);
  if (callerErr || !callerData?.user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Sesión inválida' }) };
  }

  if (!CLIENTES_ACCESS_EMAILS.includes((callerData.user.email || '').toLowerCase())) {
    return { statusCode: 403, body: JSON.stringify({ error: 'No tienes permisos para esta acción' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'JSON inválido' }) };
  }

  const { eliminadoId, nuevoId } = body;
  if (!eliminadoId || !nuevoId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Faltan datos de las cuentas' }) };
  }

  const { data: perfiles, error: perfilesErr } = await supabaseAdmin
    .from('profiles')
    .select('id, email, rut, is_approved, eliminado_at, historial_recuperado_en')
    .in('id', [eliminadoId, nuevoId]);

  if (perfilesErr) {
    console.error('Error leyendo cuentas a traspasar', perfilesErr);
    return { statusCode: 500, body: JSON.stringify({ error: 'No se pudieron verificar las cuentas' }) };
  }

  const eliminado = (perfiles || []).find((p) => p.id === eliminadoId);
  const nuevo = (perfiles || []).find((p) => p.id === nuevoId);

  if (
    !eliminado?.eliminado_at ||
    eliminado.historial_recuperado_en ||
    !nuevo ||
    nuevo.eliminado_at ||
    nuevo.is_approved === true
  ) {
    return { statusCode: 409, body: JSON.stringify({ error: 'Estas cuentas no se pueden traspasar' }) };
  }

  // El servidor exige que sea el mismo cliente: el navegador podría mandar
  // cualquier par de cuentas.
  const mismoEmail = normalizarEmail(eliminado.email) && normalizarEmail(eliminado.email) === normalizarEmail(nuevo.email);
  const mismoRut = normalizarRut(eliminado.rut) && normalizarRut(eliminado.rut) === normalizarRut(nuevo.rut);
  if (!mismoEmail && !mismoRut) {
    return { statusCode: 403, body: JSON.stringify({ error: 'Las cuentas no coinciden en correo ni RUT' }) };
  }

  const { error: rpcErr } = await supabaseAdmin.rpc('recuperar_historial_cliente', {
    p_eliminado: eliminadoId,
    p_nuevo: nuevoId,
  });

  if (rpcErr) {
    console.error('Error traspasando historial', rpcErr);
    return { statusCode: 500, body: JSON.stringify({ error: 'No se pudo recuperar el historial: ' + rpcErr.message }) };
  }

  return { statusCode: 200, body: JSON.stringify({ success: true }) };
};
