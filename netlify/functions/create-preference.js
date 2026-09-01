const { MercadoPagoConfig, Preference } = require('mercadopago');
const { createClient } = require('@supabase/supabase-js');

const UNIT_PRICE_CLP = 10000;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Método no permitido' }) };
  }

  if (!process.env.MP_ACCESS_TOKEN) {
    console.error('Falta la variable de entorno MP_ACCESS_TOKEN');
    return { statusCode: 500, body: JSON.stringify({ error: 'Pasarela de pagos no configurada' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'JSON inválido' }) };
  }

  const qty = parseInt(body.qty, 10);
  const userId = body.userId;

  if (!Number.isInteger(qty) || qty <= 0 || !userId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Parámetros inválidos' }) };
  }

  // El frontend ya oculta este flujo a usuarios no aprobados, pero eso no
  // alcanza: esta función es la que de verdad mueve plata, así que vuelve a
  // verificar acá, sin confiar en nada que venga del navegador.
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Faltan variables de entorno de Supabase para verificar al usuario');
    return { statusCode: 500, body: JSON.stringify({ error: 'Pasarela de pagos no configurada' }) };
  }

  const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: perfil, error: perfilErr } = await supabaseAdmin
    .from('profiles')
    .select('is_approved, email, full_name, phone, rut')
    .eq('id', userId)
    .single();

  if (perfilErr || !perfil) {
    return { statusCode: 403, body: JSON.stringify({ error: 'No pudimos verificar tu cuenta. Contacta a soporte.' }) };
  }

  if (!perfil.is_approved) {
    return { statusCode: 403, body: JSON.stringify({ error: 'Tu cuenta aún no ha sido aprobada por un administrador.' }) };
  }

  // Requerido para que, si el pago se aprueba, el webhook pueda acreditarlo
  // y avisarle por correo sin fallar por datos faltantes (así terminó el
  // caso de un cliente cuyo pago quedó "perdido" del lado de la app).
  const CAMPOS_OBLIGATORIOS = ['email', 'full_name', 'phone', 'rut'];
  const camposFaltantes = CAMPOS_OBLIGATORIOS.filter(campo => !perfil[campo] || String(perfil[campo]).trim() === '');

  if (camposFaltantes.length > 0) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: 'Debes completar tu perfil (todos los campos) antes de comprar créditos.' }),
    };
  }

  const siteUrl = process.env.URL || 'http://localhost:8888';
  // El external_reference viaja hasta el webhook para saber a quién y cuánto acreditar.
  const externalReference = `${userId}::${qty}::${Date.now()}`;

  try {
    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
    const preference = new Preference(client);

    const preferenceBody = {
      items: [
        {
          id: 'creditos-chiptuning',
          title: 'Créditos Chiptuning',
          quantity: qty,
          unit_price: UNIT_PRICE_CLP,
          currency_id: 'CLP',
        },
      ],
      external_reference: externalReference,
      back_urls: {
        success: `${siteUrl}/creditos?status=success`,
        failure: `${siteUrl}/creditos?status=failure`,
        pending: `${siteUrl}/creditos?status=pending`,
      },
      notification_url: `${siteUrl}/.netlify/functions/mp-webhook`,
    };

    // auto_return exige que back_urls sea una URL pública https; en localhost, MercadoPago
    // rechaza la preferencia entera ("back_url.success must be defined"), así que en dev
    // el usuario vuelve manualmente con el link "volver" del checkout.
    if (siteUrl.startsWith('https://')) {
      preferenceBody.auto_return = 'approved';
    }

    const result = await preference.create({ body: preferenceBody });

    // MP sigue devolviendo sandbox_init_point aunque se usen credenciales de producción,
    // así que no sirve para decidir el modo. init_point es lo correcto en ambos casos.
    const checkoutUrl = result.init_point;

    return {
      statusCode: 200,
      body: JSON.stringify({ init_point: checkoutUrl }),
    };
  } catch (err) {
    console.error('Error creando preferencia de MercadoPago', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'No se pudo iniciar el pago' }) };
  }
};
