import { NextResponse } from 'next/server';
import { AI_PROVIDERS, DEFAULT_PROVIDER } from '../../../config/aiProviders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `You are VoxNote AI — a brilliant, friendly, and knowledgeable assistant built into the VoxNote platform. You help users with studying, research, brainstorming, writing, coding, and any intellectual task.

PERSONALITY:
- Warm, clear, and encouraging
- Give thorough but digestible answers
- Use markdown formatting: **bold** for emphasis, \`code\` for technical terms, bullet lists, numbered steps, headings with ##
- When explaining complex topics, break them into clear sections
- If asked about VoxNote, explain that it's an AI-powered voice-to-notes platform with Focus Mode for structured notes and Open Chat for free-form conversation

RULES:
- Never refuse a reasonable request
- Be concise when the question is simple, detailed when it's complex
- Use examples and analogies to clarify difficult concepts
- Format code blocks with the correct language identifier`;

// ── Provider-specific streaming handlers ────────────────────────────

/**
 * Stream from OpenAI-compatible providers (Groq, Gemini, Cerebras, OpenRouter, HuggingFace)
 */
function createOpenAIStream(provider, model, messages, apiKey) {
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  // OpenRouter requires extra headers
  if (provider.id === 'openrouter') {
    headers['HTTP-Referer'] = 'https://voxnote.app';
    headers['X-Title'] = 'VoxNote';
  }

  return {
    url: provider.baseUrl,
    headers,
    body: {
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 4096,
      stream: true,
    },
    parseStream: (chunk, lines) => {
      // Standard OpenAI SSE format: data: {...}\n\n
      const results = [];
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            results.push({ done: true });
            continue;
          }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              results.push({ content });
            }
          } catch {
            // Skip malformed chunks
          }
        }
      }
      return results;
    },
  };
}

/**
 * Stream from the Cohere v2 Chat API
 */
function createCohereStream(provider, model, messages, apiKey) {
  return {
    url: provider.baseUrl,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: {
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 4096,
      stream: true,
    },
    parseStream: (chunk, lines) => {
      // Cohere v2 SSE: data: {"type":"content-delta","delta":{"message":{"content":{"text":"..."}}}}
      const results = [];
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content-delta') {
              const text = parsed.delta?.message?.content?.text;
              if (text) results.push({ content: text });
            } else if (parsed.type === 'message-end') {
              results.push({ done: true });
            }
          } catch {
            // Skip malformed chunks
          }
        }
      }
      return results;
    },
  };
}

// ── Dispatch table ──────────────────────────────────────────────────

const STREAM_BUILDERS = {
  openai: createOpenAIStream,
  cohere: createCohereStream,
};

// ── Main handler ────────────────────────────────────────────────────

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      messages,
      provider: providerId = DEFAULT_PROVIDER,
      model: requestedModel,
    } = body;

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'No messages provided.' }, { status: 400 });
    }

    // ── Resolve provider ──────────────────────────────────────────────
    const provider = AI_PROVIDERS[providerId];
    if (!provider) {
      return NextResponse.json(
        { error: `Unknown provider: ${providerId}` },
        { status: 400 }
      );
    }

    const apiKey = process.env[provider.envKey];
    if (!apiKey || apiKey.trim().length === 0) {
      return NextResponse.json(
        { error: `API key not configured for ${provider.name}. Add ${provider.envKey} to .env.local.` },
        { status: 401 }
      );
    }

    const model = requestedModel || provider.models[0]?.id;

    // Check if provider supports streaming
    if (!provider.supportsStreaming) {
      return NextResponse.json(
        { error: `${provider.name} does not support streaming chat.` },
        { status: 400 }
      );
    }

    // ── Build request ─────────────────────────────────────────────────
    const format = provider.format;
    const buildStream = STREAM_BUILDERS[format];

    if (!buildStream) {
      return NextResponse.json(
        { error: `Unsupported provider format for streaming: ${format}` },
        { status: 500 }
      );
    }

    const config = buildStream(provider, model, messages, apiKey);

    const aiResponse = await fetch(config.url, {
      method: 'POST',
      headers: config.headers,
      body: JSON.stringify(config.body),
    });

    if (!aiResponse.ok) {
      const errBody = await aiResponse.json().catch(() => ({}));
      const errMsg = errBody?.error?.message || errBody?.message || aiResponse.statusText;
      console.error(`${provider.name} Chat API Error:`, errMsg);
      return NextResponse.json(
        { error: `${provider.name} API error: ${errMsg}` },
        { status: aiResponse.status }
      );
    }

    // ── Stream the response back to the client ────────────────────────
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = aiResponse.body.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(line => line.trim() !== '');

            const results = config.parseStream(chunk, lines);

            for (const result of results) {
              if (result.done) {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                controller.close();
                return;
              }
              if (result.content) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: result.content })}\n\n`));
              }
            }
          }
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat. Error: ' + error.message },
      { status: 500 }
    );
  }
}
