const { MercadoPagoConfig, Payment, WebhookSignatureValidator, InvalidWebhookSignatureError } = require('mercadopago');
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  try {
    const params = event.queryStringParameters || {};
    let body = {};
    try { body = JSON.parse(event.body || '{}'); } catch { /* algunas notificaciones no traen body */ }

    const dataId = params['data.id'] || params.id || body?.data?.id;
    const type = params.type || params.topic || body?.type;

    // Solo nos interesan las notificaciones de pago; el resto se ignora sin error.
    if (!dataId || (type && type !== 'payment')) {
      return { statusCode: 200, body: 'ignored' };
    }

    if (process.env.MP_WEBHOOK_SECRET) {
      try {
        WebhookSignatureValidator.validate({
          xSignature: event.headers['x-signature'] || event.headers['X-Signature'],
          xRequestId: event.headers['x-request-id'] || event.headers['X-Request-Id'],
          dataId,
          secret: process.env.MP_WEBHOOK_SECRET,
        });
      } catch (err) {
        if (err instanceof InvalidWebhookSignatureError) {
          console.warn('Firma de webhook MP inválida');
          return { statusCode: 401, body: 'invalid signature' };
        }
        throw err;
      }
    } else {
      console.warn('MP_WEBHOOK_SECRET no configurado: se omite validación de firma');
    }

    if (!process.env.MP_ACCESS_TOKEN || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Faltan variables de entorno para procesar el webhook de MP');
      return { statusCode: 500, body: 'missing config' };
    }

    const mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
    const payment = await new Payment(mpClient).get({ id: dataId });

    if (payment.status !== 'approved') {
      return { statusCode: 200, body: `status ${payment.status}` };
    }

    const [userId, qtyStr] = String(payment.external_reference || '').split('::');
    const qty = parseInt(qtyStr, 10);

    if (!userId || !Number.isInteger(qty) || qty <= 0) {
      console.error('external_reference inválida en pago', payment.id, payment.external_reference);
      return { statusCode: 200, body: 'invalid reference' };
    }

    const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    // Registro de idempotencia: si ya procesamos este pago, la clave única evita acreditar dos veces.
    const { error: insertError } = await supabaseAdmin
      .from('pagos_mercadopago')
      .insert({
        mp_payment_id: String(payment.id),
        user_id: userId,
        credits: qty,
        amount: payment.transaction_amount,
        status: payment.status,
      });

    if (insertError) {
      if (insertError.code === '23505') {
        return { statusCode: 200, body: 'already processed' };
      }
      throw insertError;
    }

    const { data: perfil, error: perfilErr } = await supabaseAdmin
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    if (perfilErr) throw perfilErr;

    const { error: updateErr } = await supabaseAdmin
      .from('profiles')
      .update({ credits: (perfil.credits || 0) + qty })
      .eq('id', userId);

    if (updateErr) throw updateErr;

    await supabaseAdmin.from('historial_movimientos').insert({
      perfil_id: userId,
      tipo: 'recarga',
      cantidad: qty,
      descripcion: `Recarga vía MercadoPago (pago ${payment.id})`,
      fecha: new Date().toISOString(),
    });

    return { statusCode: 200, body: 'ok' };
  } catch (err) {
    console.error('Error en webhook de MercadoPago', err);
    return { statusCode: 500, body: 'error' };
  }
};
