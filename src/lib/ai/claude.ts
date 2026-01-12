import Anthropic from '@anthropic-ai/sdk';

let claudeInstance: Anthropic | null = null;

export default function getClaudeClient(): Anthropic {
  if (!claudeInstance) {
    const apiKey = process.env.CLAUDE_API_KEY;

    if (!apiKey) {
      console.error('CLAUDE_API_KEY not found in environment variables');
      throw new Error('CLAUDE_API_KEY environment variable is required');
    }

    console.log('Initializing Claude client with API key:', apiKey.substring(0, 10) + '...');
    claudeInstance = new Anthropic({ apiKey });
  }

  return claudeInstance;
}

export async function generateWithClaude(
  prompt: string,
  systemPrompt: string,
  model: string = 'claude-sonnet-4-20250514'
): Promise<string> {
  try {
    const claude = getClaudeClient();

    const response = await claude.messages.create({
      model,
      max_tokens: 16000,
      temperature: 0.5,
      system: systemPrompt,
      messages: [
        { role: 'user', content: prompt }
      ],
    });

    const textContent = response.content.find((block) => block.type === 'text');
    return textContent && textContent.type === 'text' ? textContent.text : '';
  } catch (error) {
    console.error('Claude API Error:', error);
    throw new Error('Failed to generate content with Claude');
  }
}
