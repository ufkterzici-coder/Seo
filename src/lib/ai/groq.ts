import Groq from 'groq-sdk';

let groqInstance: Groq | null = null;

function getGroqClient(): Groq {
  if (!groqInstance) {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      console.error('GROQ_API_KEY not found in environment variables');
      console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('GROQ')));
      throw new Error('GROQ_API_KEY environment variable is required');
    }

    console.log('Initializing Groq client with API key:', apiKey.substring(0, 10) + '...');
    groqInstance = new Groq({ apiKey });
  }

  return groqInstance;
}

export async function generateWithGroq(
  prompt: string,
  systemPrompt: string,
  model: string = 'llama-3.3-70b-versatile'
): Promise<string> {
  try {
    const groq = getGroqClient();

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      model,
      temperature: 0.3, // Lower temperature for more consistent JSON output
      max_tokens: 8000,
      response_format: { type: 'json_object' }, // Force JSON response
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Groq API Error:', error);
    throw new Error('Failed to generate content with Groq');
  }
}

export default getGroqClient;
