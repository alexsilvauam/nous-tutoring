module.exports = async function (req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    res.status(500).json({ error: 'Missing OPENAI_API_KEY env var' });
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

  try {
    const sys = 'Eres Ratium, tutor matemático conciso, amable y pedagógico. Responde paso a paso solo lo necesario.';
    const prompt = `Usuario: ${user?.name || 'Anónimo'} (edad: ${user?.age || 'N/A'}).\nPregunta: ${message}`;

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
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
    let data;
    try { data = JSON.parse(text); } catch { data = null; }
    const reply = data?.choices?.[0]?.message?.content?.trim() || 'No pude generar respuesta.';
    res.status(200).json({ reply });
  } catch (err) {
    res.status(500).json({ error: 'AI error', detail: String(err?.message || err).slice(0, 500) });
  }
};

