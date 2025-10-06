export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const { message, user } = req.body || {};
    if (!message) {
      res.status(400).json({ error: 'message required' });
      return;
    }

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
    if (!r.ok) {
      const txt = await r.text();
      res.status(500).json({ error: 'Upstream error', detail: txt.slice(0, 200) });
      return;
    }
    const data = await r.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() || 'No pude generar respuesta.';
    res.status(200).json({ reply });
  } catch (err) {
    res.status(500).json({ error: 'AI error' });
  }
}

