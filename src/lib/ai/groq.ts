import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function generateWithGroq(
  prompt: string,
  systemPrompt: string,
  model: string = 'llama-3.3-70b-versatile'
): Promise<string> {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      model,
      temperature: 0.7,
      max_tokens: 8000,
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Groq API Error:', error);
    throw new Error('Failed to generate content with Groq');
  }
}

export default groq;
