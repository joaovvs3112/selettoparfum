/* ===========================================================
   Netlify Function · Meta Conversions API (CAPI)
   -----------------------------------------------------------
   Recebe POST do browser quando alguém clica em algum CTA de
   /decants e envia um evento 'Lead' server-side para o Meta.

   Deduplicação: usa o mesmo event_id gerado no browser (que
   também foi passado para fbq). Meta deduplica automaticamente
   quando os dois eventos (Pixel + CAPI) chegam com o mesmo id.

   Variáveis de ambiente (configurar na Netlify
   em Site settings → Build & deploy → Environment):
     META_CAPI_ACCESS_TOKEN  Token gerado em Events Manager →
                             Pixel 955834414180825 → Settings →
                             Conversions API → Generate access token
     META_PIXEL_ID           Opcional. Default: 955834414180825
     META_CAPI_TEST_CODE     Opcional. TEST#### do Events Manager
                             para debugar em tempo real sem contar
                             como conversão.
   =========================================================== */

const META_PIXEL_ID = process.env.META_PIXEL_ID || '955834414180825';
const ACCESS_TOKEN  = process.env.META_CAPI_ACCESS_TOKEN;
const TEST_CODE     = process.env.META_CAPI_TEST_CODE || null;

exports.handler = async function (event) {
  // Rejeita qualquer método diferente de POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  // Access token é obrigatório — sem ele o CAPI não existe
  if (!ACCESS_TOKEN) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing META_CAPI_ACCESS_TOKEN env var' })
    };
  }

  // Faz parse do body do browser (silencioso em caso de JSON inválido)
  let body;
  try { body = JSON.parse(event.body || '{}'); } catch (e) { body = {}; }

  // IP real do visitante. Netlify entrega em x-nf-client-connection-ip.
  const h = event.headers || {};
  const ip = h['x-nf-client-connection-ip']
          || (h['x-forwarded-for'] ? h['x-forwarded-for'].split(',')[0].trim() : null)
          || h['client-ip']
          || null;

  const ua         = body.user_agent      || h['user-agent'] || null;
  const sourceUrl  = body.event_source_url || null;

  // Payload no formato esperado pelo Graph API v18.0
  const payload = {
    data: [{
      event_name: 'Lead',
      event_time: Math.floor(Date.now() / 1000),
      event_id: body.event_id || null,       // deduplicação com Pixel browser
      event_source_url: sourceUrl,
      action_source: 'website',
      user_data: {
        client_ip_address: ip,
        client_user_agent: ua,
        fbp: body.fbp || null,
        fbc: body.fbc || null
      },
      custom_data: {
        content_name: 'Grupo VIP Decants'
      }
    }]
  };

  // Modo teste: evento aparece no Events Manager → Test Events
  // sem contar como conversão real. Útil enquanto você valida.
  if (TEST_CODE) payload.test_event_code = TEST_CODE;

  const endpoint = 'https://graph.facebook.com/v18.0/'
                 + encodeURIComponent(META_PIXEL_ID)
                 + '/events?access_token=' + encodeURIComponent(ACCESS_TOKEN);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const text = await res.text();
    return {
      statusCode: res.ok ? 200 : 500,
      headers: { 'Content-Type': 'application/json' },
      body: text
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: String(err && err.message || err) })
    };
  }
};
