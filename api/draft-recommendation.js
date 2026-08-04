export default async function handler(req, res) {
  // Allow Chrome Extension CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { contextPayload } = req.body;
  if (!contextPayload) return res.status(400).json({ error: 'Missing contextPayload' });

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an elite fantasy football draft consultant. Analyze the user's draft context payload and league rules.
Provide a concise, 2-sentence actionable recommendation on who to target next based on roster needs and tier cliffs.
Tailor your advice strictly to their league settings (e.g., full PPR demands WR depth, Superflex demands early QB).`
          },
          { role: 'user', content: JSON.stringify(contextPayload) }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();
    return res.status(200).json({ recommendation: data.choices[0].message.content });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to generate recommendation' });
  }
}
