import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const MAX_BYTES = 24 * 1024 * 1024;

const EXT_BY_TYPE: Record<string, string> = {
  'video/webm': 'webm',
  'audio/webm': 'webm',
  'video/mp4': 'mp4',
  'audio/mp4': 'm4a',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

    // --- auth: validate the caller's JWT in code ---
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) return json({ error: 'Not authenticated' }, 401);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) return json({ error: 'Not authenticated' }, 401);

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) return json({ error: 'Transcription is not configured' }, 500);

    // --- input validation ---
    const contentType = req.headers.get('content-type') ?? '';
    if (!contentType.includes('multipart/form-data')) {
      return json({ error: 'Expected multipart/form-data upload' }, 400);
    }

    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File) || file.size === 0) {
      return json({ error: 'No media file provided' }, 400);
    }
    if (file.size < 2048) {
      return json({ error: 'That clip is too short or silent to caption.' }, 400);
    }
    if (file.size > MAX_BYTES) {
      return json({ error: 'Clip is too large to caption (max 24MB).' }, 413);
    }

    const baseType = (file.type || 'video/webm').split(';')[0];
    const ext = EXT_BY_TYPE[baseType] ?? 'webm';

    const upstream = new FormData();
    upstream.append('model', 'openai/gpt-4o-transcribe');
    upstream.append('file', file, `clip.${ext}`);

    const res = await fetch('https://ai.gateway.lovable.dev/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: upstream,
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error('Transcription failed', res.status, detail);
      if (res.status === 429) return json({ error: 'Too many requests — try again in a moment.' }, 429);
      if (res.status === 402) return json({ error: 'AI credits exhausted. Add credits to keep captioning.' }, 402);
      return json({ error: 'Could not caption this clip. Make sure it has clear audio.' }, res.status);
    }

    const data = await res.json();
    const text = (data?.text ?? '').trim();
    if (!text) return json({ error: 'No speech was detected in this clip.' }, 422);

    return json({ text });
  } catch (error) {
    console.error('transcribe-video error', error);
    return json({ error: 'Unexpected error while generating captions.' }, 500);
  }
});
