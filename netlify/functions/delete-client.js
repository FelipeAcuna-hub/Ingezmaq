const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// Mismo listado usado en el frontend (App.jsx / Clientes.jsx) para decidir
// quién puede administrar clientes. Se repite acá porque esta función corre
// en el servidor y no puede confiar en nada que diga el navegador sobre
// quién es admin: lo verifica ella misma con el token de sesión de quien llama.
const ADMIN_EMAILS = [
  'sebastianzunigavaldivia@gmail.com',
  'oliver.zuniga@gmail.com',
  'focaldevs@gmail.com',
  'respaldoestudiovaldivia@gmail.com',
];
const CLIENTES_ACCESS_EMAILS = [...ADMIN_EMAILS, 'alientechchile@gmail.com'];

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

  // Quién llama debe ser un admin real: se valida el token contra Supabase Auth,
  // no un email que mande el body (eso lo podría falsificar cualquiera).
  const { data: callerData, error: callerErr } = await supabaseAdmin.auth.getUser(token);
  if (callerErr || !callerData?.user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Sesión inválida' }) };
  }

  const callerEmail = (callerData.user.email || '').toLowerCase();
  if (!CLIENTES_ACCESS_EMAILS.includes(callerEmail)) {
    return { statusCode: 403, body: JSON.stringify({ error: 'No tienes permisos para esta acción' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'JSON inválido' }) };
  }

  const targetId = body.userId;
  if (!targetId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Falta userId' }) };
  }

  const { data: perfil, error: perfilErr } = await supabaseAdmin
    .from('profiles')
    .select('is_approved, eliminado_at')
    .eq('id', targetId)
    .maybeSingle();

  if (perfilErr) {
    console.error('Error verificando cliente a eliminar', perfilErr);
    return { statusCode: 500, body: JSON.stringify({ error: 'No se pudo verificar el cliente' }) };
  }

  // Una cuenta ya eliminada solo guarda el historial del cliente: nadie debe
  // poder borrarla por esta vía.
  if (perfil?.eliminado_at) {
    return { statusCode: 409, body: JSON.stringify({ error: 'Este cliente ya fue eliminado' }) };
  }

  // RECHAZAR una solicitud y ELIMINAR un cliente usan esta misma función.
  // Quien tiene acceso a Clientes sin ser admin completo (alientechchile) solo
  // puede rechazar solicitudes pendientes, nunca borrar un cliente ya aprobado.
  if (!ADMIN_EMAILS.includes(callerEmail) && (!perfil || perfil.is_approved === true)) {
    return { statusCode: 403, body: JSON.stringify({ error: 'No tienes permisos para eliminar clientes activos' }) };
  }

  try {
    const { count: totalArchivos, error: archivosErr } = await supabaseAdmin
      .from('archivos')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', targetId);
    if (archivosErr) throw archivosErr;

    // Eliminar a un cliente solo le quita el acceso: su perfil y todo lo que
    // cuelga de él siguen intactos. Se libera su correo cambiándolo en Auth,
    // así puede registrarse de cero (cuenta nueva, nueva aprobación), y al
    // aprobarlo se le traspasa este historial (ver recuperar-historial-cliente).
    if (perfil && (perfil.is_approved === true || totalArchivos > 0)) {
      const { error: authUpdErr } = await supabaseAdmin.auth.admin.updateUserById(targetId, {
        email: `cuenta-eliminada+${targetId}@chiptuning.cl`,
        email_confirm: true,
        password: crypto.randomBytes(32).toString('hex'),
        ban_duration: '876000h',
      });
      if (authUpdErr && authUpdErr.status !== 404) {
        throw new Error('No se pudo quitar el acceso: ' + authUpdErr.message);
      }

      const { error: perfilUpdErr } = await supabaseAdmin
        .from('profiles')
        .update({
          is_approved: false,
          eliminado_at: new Date().toISOString(),
          eliminado_por: callerEmail,
        })
        .eq('id', targetId);
      if (perfilUpdErr) {
        throw new Error('Se quitó el acceso, pero no se pudo marcar el perfil: ' + perfilUpdErr.message);
      }

      return { statusCode: 200, body: JSON.stringify({ success: true, datosConservados: true }) };
    }

    // Solicitud rechazada que nunca llegó a tener archivos: borrado completo,
    // no hay historial que conservar.
    //
    // Se borra explícitamente cada tabla relacionada (en vez de confiar en que
    // las Foreign Keys tengan ON DELETE CASCADE configurado) porque no todas
    // se crearon con ese SQL versionado; borrar de más sobre filas que no
    // existen no falla, así que este orden es seguro sin importar cómo haya
    // quedado cada FK.
    const { data: ticketsDelUsuario } = await supabaseAdmin
      .from('tickets')
      .select('id')
      .eq('user_id', targetId);

    const ticketIds = (ticketsDelUsuario || []).map((t) => t.id);
    if (ticketIds.length > 0) {
      await supabaseAdmin.from('ticket_messages').delete().in('ticket_id', ticketIds);
    }

    await supabaseAdmin.from('tickets').delete().eq('user_id', targetId);
    await supabaseAdmin.from('archivos').delete().eq('user_id', targetId);
    await supabaseAdmin.from('movimientos').delete().eq('user_id', targetId);
    await supabaseAdmin.from('historial_movimientos').delete().eq('perfil_id', targetId);
    await supabaseAdmin.from('pagos_mercadopago').delete().eq('user_id', targetId);

    const { error: profileDelErr } = await supabaseAdmin.from('profiles').delete().eq('id', targetId);
    if (profileDelErr) {
      throw new Error('No se pudo eliminar el perfil: ' + profileDelErr.message);
    }

    // Esto es lo que de verdad impide volver a entrar sin repetir todo el
    // proceso: sin esto, el email/contraseña seguirían existiendo en
    // Supabase Auth aunque ya no tenga perfil ni acceso a nada.
    const { error: authDelErr } = await supabaseAdmin.auth.admin.deleteUser(targetId);
    if (authDelErr && authDelErr.status !== 404) {
      throw new Error('El perfil se eliminó, pero no se pudo eliminar la cuenta de acceso: ' + authDelErr.message);
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error('Error eliminando cliente', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message || 'No se pudo eliminar el cliente' }) };
  }
};
