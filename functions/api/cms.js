// Cloudflare Pages Function: GET & POST /api/cms
// Lưu và đồng bộ toàn bộ bài viết Services & Our Work trên Cloudflare KV

const CMS_KEY = '2SPRODUCTION_SITE_DATA';

export async function onRequestGet(context) {
  const { env } = context;
  if (!env.CMS_KV) {
    return new Response(JSON.stringify({ mode: 'local', data: null }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const raw = await env.CMS_KV.get(CMS_KEY);
  return new Response(raw || JSON.stringify({ mode: 'kv', data: null }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.CMS_KV) {
    return new Response(JSON.stringify({ error: 'CMS_KV binding not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const body = await request.text();
  await env.CMS_KV.put(CMS_KEY, body);

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
