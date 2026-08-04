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
      .select('credits, email')
      .eq('id', userId)
      .single();

    if (perfilErr) throw perfilErr;

    const { error: updateErr } = await supabaseAdmin
      .from('profiles')
      .update({ credits: (perfil.credits || 0) + qty })
      .eq('id', userId);

    if (updateErr) throw updateErr;

    // Misma tabla que usa Admin.jsx para cargas manuales, para que aparezca en
    // "Mi historial de créditos" (Historial.jsx) como recarga positiva, no como canje.
    await supabaseAdmin.from('movimientos').insert({
      user_id: userId,
      tipo: 'carga',
      cantidad: qty,
      descripcion: `Recarga vía MercadoPago (pago ${payment.id})`,
      admin_email: null,
    });

    const destinatario = perfil.email;
    if (destinatario) {
      const montoCLP = Number(payment.transaction_amount || 0).toLocaleString('es-CL');
      const fechaPago = new Date().toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Santiago' });
      const emailHtml = `
        <div style="font-family: 'Helvetica', Arial, sans-serif; background-color: #f9f9f9; padding: 40px 0;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            <div style="background-color: #000000; padding: 20px; text-align: center;">
              <h1 style="color: #2563eb; margin: 0; font-size: 24px; letter-spacing: 2px;">CHIPTUNING SYSTEM</h1>
            </div>
            <div style="padding: 30px; line-height: 1.6; color: #333;">
              <h2 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px;">Comprobante de compra de créditos</h2>
              <p>Hola, tu pago fue aprobado y ya acreditamos los créditos en tu cuenta.</p>
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr><td style="padding: 5px 0;"><strong>Créditos acreditados:</strong></td><td>${qty}</td></tr>
                <tr><td style="padding: 5px 0;"><strong>Monto pagado:</strong></td><td>$${montoCLP} CLP</td></tr>
                <tr><td style="padding: 5px 0;"><strong>N° de pago MercadoPago:</strong></td><td>${payment.id}</td></tr>
                <tr><td style="padding: 5px 0;"><strong>Fecha:</strong></td><td>${fechaPago}</td></tr>
              </table>
              <div style="text-align: center; margin-top: 30px;">
                <a href="https://chiptuning.cl/historial" style="background-color: #2563eb; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">VER MI HISTORIAL</a>
              </div>
            </div>
          </div>
        </div>
      `;

      const { error: emailErr } = await supabaseAdmin.functions.invoke('swift-function', {
        body: {
          to: destinatario,
          subject: `✅ Compra de ${qty} créditos aprobada`,
          html: emailHtml,
        },
      });

      if (emailErr) console.error('Error enviando correo de confirmación de pago', emailErr);
    } else {
      console.error('No se encontró email de perfil para enviar comprobante', userId);
    }

    return { statusCode: 200, body: 'ok' };
  } catch (err) {
    console.error('Error en webhook de MercadoPago', err);
    return { statusCode: 500, body: 'error' };
  }
};
