// Claude SDK şu anda yüklü değil - kullanmak için aşağıdaki adımları izleyin:
// 1. npm install @anthropic-ai/sdk
// 2. .env.local dosyasına CLAUDE_API_KEY=sk-ant-xxx ekleyin
// 3. Bu dosyadaki yorumları kaldırın ve aktif hale getirin

// import Anthropic from '@anthropic-ai/sdk';

export async function generateWithClaude(
  prompt: string,
  systemPrompt: string,
  model: string = 'claude-3-5-sonnet-20241022'
): Promise<string> {
  throw new Error(
    '❌ Claude AI şu anda kullanılamıyor.\n\n' +
    '📦 Kurulum için:\n' +
    '   npm install @anthropic-ai/sdk\n\n' +
    '🔑 API Key için:\n' +
    '   .env.local dosyasına CLAUDE_API_KEY=sk-ant-xxx ekleyin\n\n' +
    '💡 Alternatif: Şimdilik "Groq" seçeneğini kullanabilirsiniz.'
  );
}

export default function getClaudeClient() {
  throw new Error('Claude SDK yüklü değil');
}

/*
// Claude SDK yüklendiğinde bu kodu aktif edin:

import Anthropic from '@anthropic-ai/sdk';

let claudeInstance: Anthropic | null = null;

function getClaudeClient(): Anthropic {
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
  model: string = 'claude-3-5-sonnet-20241022'
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

export default getClaudeClient;
*/
