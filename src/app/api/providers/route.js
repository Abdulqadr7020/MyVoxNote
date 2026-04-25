import { NextResponse } from 'next/server';
import { AI_PROVIDERS } from '../../../config/aiProviders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/providers
 * Returns the list of AI providers that have API keys configured.
 * The frontend uses this to populate the model selector — only
 * providers with valid keys show up.
 */
export async function GET() {
  try {
    const available = [];

    for (const [id, provider] of Object.entries(AI_PROVIDERS)) {
      const apiKey = process.env[provider.envKey];

      // Only include providers that have a non-empty API key
      if (apiKey && apiKey.trim().length > 0) {
        available.push({
          id: provider.id,
          name: provider.name,
          icon: provider.icon,
          description: provider.description,
          models: provider.models,
        });
      }
    }

    return NextResponse.json(available);
  } catch (error) {
    console.error('Providers API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch providers.' },
      { status: 500 }
    );
  }
}
