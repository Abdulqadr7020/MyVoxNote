import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { transcript, config } = await request.json();
    const groqApiKey = process.env.GROQ_API_KEY;

    if (!groqApiKey || groqApiKey === 'your_groq_api_key_here') {
      return NextResponse.json(
        { error: 'Groq API Key is not configured. Please add GROQ_API_KEY to .env.' },
        { status: 401 }
      );
    }

    const cfg = {
      extraInstruction: config?.extraInstruction || '',
      flowNodes: config?.flowNodes || 6,
      mindDepth: config?.mindDepth || 3,
      timelineEvents: config?.timelineEvents || 5
    };

    const systemPrompt = `You are VoxNote's elite AI analyst. Transform the user's transcript into highly accurate, information-rich structured notes. Your output will be rendered directly into a premium UI.

CRITICAL RULES:
1. Every piece of output MUST be derived from the actual transcript content.
2. Return ONLY a valid JSON object.
3. All node/edge IDs must be unique strings.
4. TABLE RULES: Use specific, descriptive keys. No markdown formatting inside table values.
5. ${cfg.extraInstruction}

JSON SCHEMA:
{
  "summary": "5-7 sentences. Use [HEADING] and **bold** concepts.",
  "detailed": "Full formal notes using multiple [HEADING] sections and **bold** terms.",
  "bullets": [
    {
      "title": "Main point",
      "details": ["Detail 1", "Detail 2"]
    }
  ],
  "questions": [
    {
      "question": "Question text",
      "answer": "Complete answer"
    }
  ],
  "visuals": {
    "graphData": {
      "nodes": [
        { "id": "id1", "label": "Label", "type": "core", "subLabel": "Sub", "details": "Desc" }
      ],
      "edges": [
        { "source": "id1", "target": "id2", "label": "Link" }
      ]
    },
    "mindMapData": {
      "id": "root",
      "label": "Root",
      "type": "root",
      "category": "root",
      "children": []
    },
    "timelineData": [
      {
        "id": "s1",
        "time": "Time",
        "title": "Title",
        "description": "Desc",
        "category": "milestone"
      }
    ],
    "table": [
      { "Concept": "value", "Description": "value" }
    ]
  }
}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqApiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `TRANSCRIPT:\n${transcript}` }
        ],
        temperature: 0.3,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const err = await response.json();
      return NextResponse.json(
        { error: err.error?.message || response.statusText },
        { status: response.status }
      );
    }

    const data = await response.json();
    const responseText = data.choices[0]?.message?.content;

    if (!responseText) {
      return NextResponse.json({ error: 'Empty response from Groq.' }, { status: 500 });
    }

    // DEBUG: Log the first 500 chars of the response
    console.log('--- RAW GROQ RESPONSE (START) ---');
    console.log(responseText.slice(0, 500));
    console.log('--- RAW GROQ RESPONSE (END) ---');

    let cleanJson = responseText.trim();
    
    // Safety check for first '{' and last '}'
    const firstBrace = cleanJson.indexOf('{');
    const lastBrace = cleanJson.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleanJson = cleanJson.slice(firstBrace, lastBrace + 1);
    }

    let parsed;
    try {
      parsed = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.error('JSON parse error:', parseErr);
      return NextResponse.json(
        { error: 'AI returned malformed JSON. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Format API error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
