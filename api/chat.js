module.exports = async function (req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let payload = {};
  try {
    payload = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  } catch (e) {
    res.status(400).json({ error: 'Invalid JSON body' });
    return;
  }

  const { message, user } = payload;
  if (!message) {
    res.status(400).json({ error: 'message required' });
    return;
  }

  const sys = 'Eres Ratium, tutor matemático conciso, amable y pedagógico. Responde paso a paso solo lo necesario.';
  const prompt = `Usuario: ${user?.name || 'Anónimo'} (edad: ${user?.age || 'N/A'}).\nPregunta: ${message}`;

  const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
  const CF_API_TOKEN = process.env.CF_API_TOKEN;
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  try {
    if (CF_ACCOUNT_ID && CF_API_TOKEN) {
      // Cloudflare Workers AI
      const model = '@cf/meta/llama-3.1-8b-instruct';
      const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${model}`;
      const r = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CF_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: sys },
            { role: 'user', content: prompt }
          ]
        })
      });
      const text = await r.text();
      if (!r.ok) {
        res.status(500).json({ error: 'Cloudflare error', detail: text.slice(0, 500) });
        return;
      }
      let data; try { data = JSON.parse(text); } catch { data = null; }
      const reply = data?.result?.response || data?.response || 'No pude generar respuesta.';
      res.status(200).json({ reply, provider: 'cloudflare' });
      return;
    }

    if (OPENAI_API_KEY) {
      // OpenAI (fallback)
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo-0125',
          messages: [
            { role: 'system', content: sys },
            { role: 'user', content: prompt }
          ],
          temperature: 0.4,
          max_tokens: 400
        })
      });
      const text = await r.text();
      if (!r.ok) {
        res.status(500).json({ error: 'Upstream error', detail: text.slice(0, 500) });
        return;
      }
      let data; try { data = JSON.parse(text); } catch { data = null; }
      const reply = data?.choices?.[0]?.message?.content?.trim() || 'No pude generar respuesta.';
      res.status(200).json({ reply, provider: 'openai' });
      return;
    }

    res.status(500).json({ error: 'No provider configured', detail: 'Set CF_ACCOUNT_ID + CF_API_TOKEN or OPENAI_API_KEY' });
  } catch (err) {
    res.status(500).json({ error: 'AI error', detail: String(err?.message || err).slice(0, 500) });
  }
};

