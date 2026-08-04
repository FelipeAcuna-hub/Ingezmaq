const { MercadoPagoConfig, Payment } = require('mercadopago');

// Solo lectura: se usa para mostrar el comprobante en pantalla al volver del
// checkout. Acreditar créditos sigue siendo trabajo exclusivo de mp-webhook.js.
exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Método no permitido' }) };
  }

  const paymentId = event.queryStringParameters?.payment_id;
  if (!paymentId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Falta payment_id' }) };
  }

  if (!process.env.MP_ACCESS_TOKEN) {
    console.error('Falta la variable de entorno MP_ACCESS_TOKEN');
    return { statusCode: 500, body: JSON.stringify({ error: 'Pasarela de pagos no configurada' }) };
  }

  try {
    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
    const payment = await new Payment(client).get({ id: paymentId });

    const [, qtyStr] = String(payment.external_reference || '').split('::');
    const credits = parseInt(qtyStr, 10);

    return {
      statusCode: 200,
      body: JSON.stringify({
        id: payment.id,
        status: payment.status,
        amount: payment.transaction_amount,
        credits: Number.isInteger(credits) ? credits : null,
        date: payment.date_approved || payment.date_created,
      }),
    };
  } catch (err) {
    console.error('Error consultando pago de MercadoPago', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'No se pudo obtener el comprobante' }) };
  }
};
