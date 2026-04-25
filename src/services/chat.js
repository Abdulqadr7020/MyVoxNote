/**
 * Sends a chat message to the VoxNote Chat API and returns a stream reader.
 * @param {Array<{role: string, content: string}>} messages - Conversation history
 * @param {string} provider - AI provider ID (e.g. 'groq', 'gemini')
 * @param {string|null} model - Model ID, or null for provider default
 * @returns {Promise<ReadableStreamDefaultReader>} - A reader for streaming tokens
 */
export const sendChatMessage = async (messages, provider = 'groq', model = null) => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, provider, model }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Chat request failed: ${response.statusText}`);
  }

  return response.body.getReader();
};


/**
 * Consumes a stream reader and calls onToken for each incoming token.
 * @param {ReadableStreamDefaultReader} reader
 * @param {(token: string) => void} onToken - Called with each new text token
 * @param {() => void} onDone - Called when streaming is complete
 */
export const consumeStream = async (reader, onToken, onDone) => {
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const data = trimmed.slice(6);
        if (data === '[DONE]') {
          onDone();
          return;
        }

        try {
          const parsed = JSON.parse(data);
          if (parsed.content) {
            onToken(parsed.content);
          }
        } catch {
          // Skip malformed data
        }
      }
    }
    onDone();
  } catch (error) {
    console.error('Stream consumption error:', error);
    onDone();
  }
};
