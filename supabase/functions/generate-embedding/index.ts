// Supabase Edge Function: generate-embedding
// Triggered on decision insert/update to generate and store a vector embedding.
//
// Deploy with: supabase functions deploy generate-embedding
// Invoke via database webhook or HTTP call after decision save.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

interface DecisionPayload {
  id: string;
  title: string;
  why: unknown;
  context: string | null;
  outcome_status: string;
  outcome_notes: string | null;
}

function extractTextFromTiptap(doc: unknown): string {
  if (!doc || typeof doc !== 'object') return '';
  const node = doc as { type?: string; text?: string; content?: unknown[] };
  if (node.type === 'text' && node.text) return node.text;
  if (Array.isArray(node.content)) {
    return node.content.map(extractTextFromTiptap).join(' ');
  }
  return '';
}

function buildEmbeddingText(decision: DecisionPayload): string {
  const parts = [decision.title];

  const whyText = extractTextFromTiptap(decision.why);
  if (whyText) parts.push(whyText);

  if (decision.context) parts.push(decision.context);

  if (decision.outcome_status !== 'pending' && decision.outcome_notes) {
    parts.push(`Outcome (${decision.outcome_status}): ${decision.outcome_notes}`);
  }

  return parts.join('\n\n');
}

Deno.serve(async (req) => {
  try {
    const { decision_id } = await req.json();

    if (!decision_id) {
      return new Response(JSON.stringify({ error: 'decision_id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch the decision
    const { data: decision, error: fetchError } = await supabase
      .from('decisions')
      .select('id, title, why, context, outcome_status, outcome_notes')
      .eq('id', decision_id)
      .single();

    if (fetchError || !decision) {
      return new Response(JSON.stringify({ error: 'Decision not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const text = buildEmbeddingText(decision as DecisionPayload);

    // Call OpenAI embeddings API (or swap for another provider)
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const embeddingRes = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: text,
        dimensions: EMBEDDING_DIMENSIONS,
      }),
    });

    if (!embeddingRes.ok) {
      const errBody = await embeddingRes.text();
      return new Response(JSON.stringify({ error: 'Embedding API failed', details: errBody }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const embeddingData = await embeddingRes.json();
    const embedding = embeddingData.data[0].embedding;

    // Store the embedding in the decisions table
    const { error: updateError } = await supabase
      .from('decisions')
      .update({ embedding: JSON.stringify(embedding) })
      .eq('id', decision_id);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to store embedding', details: updateError.message }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify({ success: true, decision_id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
