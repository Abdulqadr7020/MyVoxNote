import { NextResponse } from 'next/server';
import { AI_PROVIDERS, DEFAULT_PROVIDER, DEFAULT_MODEL } from '../../../config/aiProviders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ── Provider-specific request builders ──────────────────────────────

/**
 * Build a request for OpenAI-compatible providers
 * (Groq, Gemini, Cerebras, OpenRouter, HuggingFace)
 */
function buildOpenAIRequest(provider, model, systemPrompt, userMessage, apiKey) {
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  // OpenRouter requires extra headers
  if (provider.id === 'openrouter') {
    headers['HTTP-Referer'] = 'https://voxnote.app';
    headers['X-Title'] = 'VoxNote';
  }

  const body = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.4,
    max_tokens: 8000,
  };

  // Add JSON mode if supported
  if (provider.supportsJsonMode) {
    body.response_format = { type: 'json_object' };
  }

  return { url: provider.baseUrl, headers, body };
}

/**
 * Build a request for the Cohere v2 Chat API
 */
function buildCohereRequest(provider, model, systemPrompt, userMessage, apiKey) {
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  const body = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.4,
    max_tokens: 8000,
  };

  return { url: provider.baseUrl, headers, body };
}

/**
 * Parse response from OpenAI-compatible providers
 */
function parseOpenAIResponse(data) {
  return data.choices?.[0]?.message?.content?.trim() || null;
}

/**
 * Parse response from Cohere v2
 */
function parseCohereResponse(data) {
  // Cohere v2 returns { message: { content: [{ text }] } }
  const content = data?.message?.content;
  if (Array.isArray(content) && content.length > 0) {
    return content[0].text?.trim() || null;
  }
  return null;
}

// ── Dispatch table ──────────────────────────────────────────────────

const REQUEST_BUILDERS = {
  openai: buildOpenAIRequest,
  cohere: buildCohereRequest,
};

const RESPONSE_PARSERS = {
  openai: parseOpenAIResponse,
  cohere: parseCohereResponse,
};

// ── Main handler ────────────────────────────────────────────────────

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      transcript,
      mode = 'default',
      provider: providerId = DEFAULT_PROVIDER,
      model: requestedModel,
    } = body;

    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json({ error: 'No transcript provided.' }, { status: 400 });
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

    // Use requested model or fall back to provider's first model
    const model = requestedModel || provider.models[0]?.id || DEFAULT_MODEL;

    // ── Mode-specific depth settings ─────────────────────────────────
    const modeConfig = {
      exam: {
        summaryLen: '5-7 rich sentences',
        bulletCount: '7-10',
        questionCount: '9-12',
        flowNodes: 10,
        mindDepth: 3,
        timelineEvents: 8,
        extraInstruction: 'This is EXAM MODE. Every bullet must include sub-details with definitions, examples, and implications. Questions must be exam-grade with full structured answers including: definition, explanation, example, and significance.'
      },
      quickRevision: {
        summaryLen: '2-3 razor-sharp sentences',
        bulletCount: '4-5',
        questionCount: '4-5',
        flowNodes: 6,
        mindDepth: 2,
        timelineEvents: 5,
        extraInstruction: 'This is QUICK REVISION MODE. Be hyper-concise. Every sentence must carry maximum information density. No fluff.'
      },
      default: {
        summaryLen: '4-5 clear sentences',
        bulletCount: '5-7',
        questionCount: '5-7',
        flowNodes: 8,
        mindDepth: 3,
        timelineEvents: 6,
        extraInstruction: 'Standard balanced mode. Provide thorough yet digestible notes.'
      }
    };

    const cfg = modeConfig[mode] || modeConfig.default;

    // ── System prompt ─────────────────────────────────────────────────
    const systemPrompt = `You are VoxNote's elite AI analyst. Transform the user's transcript into highly accurate, information-rich structured notes. Your output will be rendered directly into a premium UI — every field MUST be accurate, complete, and specific to the actual content of the transcript.

CRITICAL RULES:
1. Every piece of output MUST be derived from the actual transcript content — never use generic placeholders.
2. All text fields must be substantive and meaningful.
3. Return ONLY a valid JSON object — no markdown fences, no extra text, no comments.
4. All node/edge IDs must be unique strings (use descriptive slugs like "photosynthesis-process", not "n1").
5. TABLE RULES: Use specific, descriptive keys for each column (e.g., "Component", "Function", "Impact") instead of generic "Column1". DO NOT use markdown bolding (**), italics, or other formatting inside table values; keep them as raw, clean text.
6. ${cfg.extraInstruction}

═══════════════════════════════════════════
OUTPUT SCHEMA (fill ALL fields accurately):
═══════════════════════════════════════════

{
  "summary": "<${cfg.summaryLen}>. Start with the core thesis. Use [HEADING] tag before each major section title (e.g. [HEADING] Key Mechanisms). Use **double asterisks** around critical terms, names, numbers, and concepts. Make every sentence count.",

  "detailed": "<Full formal notes — use multiple [HEADING] sections. Cover EVERY significant point from the transcript. Use **bold** for all key terms, dates, names, figures. Write as if this is the only study resource a student will use.>",

  "bullets": [
    {
      "title": "<Clear, specific main point — not a vague label>",
      "details": [
        "<Specific sub-point with actual content from the transcript>",
        "<Another specific detail, include numbers/facts/examples where present>",
        "<A third supporting detail if applicable>"
      ]
    }
    /* Provide ${cfg.bulletCount} bullet objects total */
  ],

  "questions": [
    {
      "question": "<A meaningful, specific question that tests real understanding of the transcript content>",
      "answer": "<A complete, well-structured answer with explanation and examples drawn from the transcript>"
    }
    /* Provide ${cfg.questionCount} question objects total */
  ],

  "visuals": {

    "graphData": {
      /* FLOWCHART — shows the LOGICAL/CAUSAL flow of concepts from the transcript */
      /* Rules: 
         - Create exactly 1 core node.
         - Create ${cfg.flowNodes - 1} supporting nodes.
         - Use a "Hub & Spoke" layout where some nodes flow INTO the core and some flow OUT of the core.
         - EDGE LABELS: MUST be dynamic and descriptive (e.g., "implements", "evolved from", "solves", "categorizes", "triggers"). Avoid generic "includes" for everything.
         - NODE subLabel: Every node must have a specific "subLabel" (e.g., "CORE PRINCIPLE", "REAL-WORLD USE", "SUB-DOMAIN", "CRITICAL CHALLENGE"). Do NOT use "Supporting Detail" for all.
         - CONTENT: Ensure no major concept mentioned in the transcript is missing. Every node should be an insight.
      */
      "nodes": [
        { "id": "<slug-id>", "label": "<Concept Name>", "type": "core", "subLabel": "CENTRAL PILLAR", "details": "<Full definition from transcript>" },
        { "id": "<slug-id>", "label": "<Insightful Topic>", "type": "supporting", "subLabel": "<Specific type like 'APPLICATION' or 'METHOD'>", "details": "<Contextual explanation>" }
      ],
      "edges": [
        { "source": "<source-id>", "target": "<target-id>", "label": "<Dynamic, descriptive verb phrase>" }
      ]
    },

    "mindMapData": {
      /* MIND MAP — hierarchical breakdown of ALL main topics from the transcript */
      /* Root → Branches (main topics) → Leaves (specific details) */
      /* Use category values: "root", "theory", "action", "fact", "meta" */
      /* edgeLabel should be a short verb describing the relationship (e.g. "includes", "explains", "leads to") */
      "id": "root",
      "label": "<Central topic of the transcript — be specific>",
      "type": "root",
      "category": "root",
      "children": [
        {
          "id": "<branch-slug>",
          "label": "<Main topic 1 from transcript>",
          "type": "branch",
          "category": "theory",
          "edgeLabel": "covers",
          "children": [
            { "id": "<leaf-slug-1>", "label": "<Specific detail or subtopic>", "type": "leaf", "category": "fact", "edgeLabel": "includes" },
            { "id": "<leaf-slug-2>", "label": "<Another specific detail>", "type": "leaf", "category": "fact", "edgeLabel": "includes" }
          ]
        }
        /* Provide ${cfg.mindDepth >= 3 ? '4-5' : '3-4'} branch children, each with 2-3 leaf children */
      ]
    },

    "timelineData": [
      /* TIMELINE — ordered sequence of events, phases, steps, or stages from the transcript */
      /* If content is conceptual (not chronological), use it as a learning progression or process stages */
      /* category must be one of: "milestone", "task", "event" */
      {
        "id": "step-1",
        "time": "<Phase/Time label — e.g. 'Phase 1', 'Step 1', '09:00 AM', 'Week 1', '1905'>",
        "title": "<Clear event/phase title from the transcript>",
        "description": "<2-3 sentences describing what happens at this stage, its significance, and outcomes>",
        "category": "milestone"
      }
      /* Provide ${cfg.timelineEvents} timeline events in logical order */
    ],

    "table": [
      /* Provide as many rows as are necessary to represent all relevant structured data points in the transcript. Don't limit the row count – let it be driven by the actual content complexity. */
      /* Use descriptive keys (e.g. "Theory", "Founder", "Core_Concept") that will act as the column headers. */
      {
        "Key_Concept": "<value>",
        "Description": "<value>",
        "Impact": "<value>",
        "Context": "<value>",
        "Significance": "<value>"
      }
    ]
  }
}`;

    const userMessage = `Transcript to analyze:\n\n"${transcript.trim()}"`;

    // ── Build & dispatch request ──────────────────────────────────────
    const format = provider.format;
    const buildRequest = REQUEST_BUILDERS[format];
    const parseResponse = RESPONSE_PARSERS[format];

    if (!buildRequest || !parseResponse) {
      return NextResponse.json(
        { error: `Unsupported provider format: ${format}` },
        { status: 500 }
      );
    }

    const { url, headers, body: requestBody } = buildRequest(
      provider, model, systemPrompt, userMessage, apiKey
    );

    const aiResponse = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!aiResponse.ok) {
      const errBody = await aiResponse.json().catch(() => ({}));
      const errMsg = errBody?.error?.message || errBody?.message || aiResponse.statusText;
      console.error(`${provider.name} API Error:`, errMsg);
      return NextResponse.json(
        { error: `${provider.name} API error: ${errMsg}` },
        { status: aiResponse.status }
      );
    }

    const aiData = await aiResponse.json();
    const responseText = parseResponse(aiData);

    if (!responseText) {
      return NextResponse.json({ error: `Empty response from ${provider.name}.` }, { status: 500 });
    }

    // Strip any accidental markdown fences
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const cleanJson = jsonMatch ? jsonMatch[0] : responseText;

    let parsed;
    try {
      parsed = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.error('JSON parse error:', parseErr, '\nRaw response:', cleanJson.slice(0, 500));
      return NextResponse.json(
        { error: 'AI returned malformed JSON. Please try again or switch to a different model.' },
        { status: 500 }
      );
    }

    // ── Sanitize & validate visual data before returning ────────────

    // Ensure graphData edges reference valid node IDs
    if (parsed?.visuals?.graphData) {
      const gd = parsed.visuals.graphData;
      const nodeIds = new Set((gd.nodes || []).map(n => n.id));
      gd.edges = (gd.edges || []).filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));
    }

    // Ensure mindMapData IDs are unique across the whole tree
    if (parsed?.visuals?.mindMapData) {
      const seenIds = new Set();
      const dedupeIds = (node) => {
        if (seenIds.has(node.id)) {
          node.id = node.id + '-' + Math.random().toString(36).slice(2, 6);
        }
        seenIds.add(node.id);
        if (node.children) node.children.forEach(dedupeIds);
      };
      dedupeIds(parsed.visuals.mindMapData);
    }

    // Ensure timelineData items have valid categories
    if (parsed?.visuals?.timelineData) {
      const validCats = new Set(['milestone', 'task', 'event']);
      parsed.visuals.timelineData = parsed.visuals.timelineData.map((e, i) => ({
        ...e,
        id: e.id || `event-${i + 1}`,
        category: validCats.has(e.category) ? e.category : (i === 0 ? 'milestone' : 'event')
      }));
    }

    // Ensure table rows all have the same keys
    if (parsed?.visuals?.table && parsed.visuals.table.length > 0) {
      const headers = Object.keys(parsed.visuals.table[0]);
      parsed.visuals.table = parsed.visuals.table.map(row => {
        const normalized = {};
        headers.forEach(h => { normalized[h] = row[h] ?? '—'; });
        return normalized;
      });
    }

    return NextResponse.json(parsed);

  } catch (error) {
    console.error('Format API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process content. Error: ' + error.message },
      { status: 500 }
    );
  }
}
