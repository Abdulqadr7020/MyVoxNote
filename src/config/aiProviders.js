/**
 * ═══════════════════════════════════════════════════════════════
 * VoxNote AI Provider Registry
 * ═══════════════════════════════════════════════════════════════
 * Central config for all supported AI providers.
 * Each provider specifies its base URL, env key name, available
 * models, and capabilities.
 *
 * To add a new provider:
 *  1. Add an entry here
 *  2. Add the API key to .env.local
 *  3. If format !== 'openai', add an adapter in the API routes
 */

export const AI_PROVIDERS = {
  groq: {
    id: 'groq',
    name: 'Groq',
    icon: '⚡',
    description: 'Ultra-fast inference (LPU)',
    baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
    envKey: 'GROQ_API_KEY',
    format: 'openai',
    supportsJsonMode: true,
    supportsStreaming: true,
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', tag: 'Recommended' },
      { id: 'gemma2-9b-it', name: 'Gemma 2 9B', tag: 'Fast' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', tag: '32K Context' },
    ],
  },

  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    icon: '💎',
    description: '1M+ token context window',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    envKey: 'GEMINI_API_KEY',
    format: 'openai',
    supportsJsonMode: true,
    supportsStreaming: true,
    models: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', tag: 'Best Free' },
      { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', tag: 'Fastest' },
    ],
  },

  cerebras: {
    id: 'cerebras',
    name: 'Cerebras',
    icon: '🧠',
    description: 'Wafer-scale speed demon',
    baseUrl: 'https://api.cerebras.ai/v1/chat/completions',
    envKey: 'CEREBRAS_API_KEY',
    format: 'openai',
    supportsJsonMode: true,
    supportsStreaming: true,
    models: [
      { id: 'llama-3.3-70b', name: 'Llama 3.3 70B', tag: 'Fast' },
    ],
  },

  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    icon: '🌐',
    description: 'Multi-model gateway',
    baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
    envKey: 'OPENROUTER_API_KEY',
    format: 'openai',
    supportsJsonMode: true,
    supportsStreaming: true,
    models: [
      { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B', tag: 'Free' },
      { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1', tag: 'Reasoning' },
    ],
  },

  cohere: {
    id: 'cohere',
    name: 'Cohere',
    icon: '🔷',
    description: 'RAG & retrieval specialist',
    baseUrl: 'https://api.cohere.com/v2/chat',
    envKey: 'COHERE_API_KEY',
    format: 'cohere',
    supportsJsonMode: false,
    supportsStreaming: true,
    models: [
      { id: 'command-r', name: 'Command R', tag: 'Balanced' },
      { id: 'command-r-plus', name: 'Command R+', tag: 'Powerful' },
    ],
  },

  huggingface: {
    id: 'huggingface',
    name: 'HuggingFace',
    icon: '🤗',
    description: 'Open-source community hub',
    baseUrl: 'https://router.huggingface.co/novita/v3/openai/chat/completions',
    envKey: 'HUGGINGFACE_API_KEY',
    format: 'openai',
    supportsJsonMode: true,
    supportsStreaming: true,
    models: [
      { id: 'deepseek/deepseek-r1-0528', name: 'DeepSeek R1', tag: 'Reasoning' },
      { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', tag: 'Popular' },
    ],
  },
};

export const DEFAULT_PROVIDER = 'groq';
export const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

/**
 * Get the default model ID for a given provider.
 */
export function getDefaultModelForProvider(providerId) {
  const provider = AI_PROVIDERS[providerId];
  if (!provider || !provider.models.length) return null;
  return provider.models[0].id;
}
