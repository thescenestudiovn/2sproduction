// Cloudflare Pages Function: POST /api/upload
// Tự động nhận file ảnh từ Admin CMS của 2Sproduction.com và lưu thẳng lên Cloudflare R2 Bucket

export async function onRequestPost(context) {
  const { request, env } = context;

  // Kiểm tra quyền Admin qua Header
  const authHeader = request.headers.get('X-Admin-Token');
  if (env.ADMIN_SECRET && authHeader !== env.ADMIN_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return new Response(JSON.stringify({ error: 'Không tìm thấy file ảnh tải lên' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const safeKey = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    // Lưu trực tiếp vào Cloudflare R2 Bucket (binding: MEDIA_BUCKET)
    if (env.MEDIA_BUCKET) {
      await env.MEDIA_BUCKET.put(safeKey, file.stream(), {
        httpMetadata: {
          contentType: file.type || 'image/jpeg',
          cacheControl: 'public, max-age=31536000'
        }
      });

      const publicBase = env.R2_PUBLIC_DOMAIN || new URL(request.url).origin;
      const publicUrl = env.R2_PUBLIC_DOMAIN
        ? `${publicBase.replace(/\/$/, '')}/${safeKey}`
        : `/api/upload?key=${encodeURIComponent(safeKey)}`;

      return new Response(JSON.stringify({
        success: true,
        key: safeKey,
        url: publicUrl
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      error: 'Chưa gắn R2 Bucket binding MEDIA_BUCKET trong Cloudflare Pages'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// GET /api/upload?key=uploads/... -> Trả ảnh trực tiếp từ Cloudflare R2 kèm CDN Cache
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const key = url.searchParams.get('key');

  if (!key || !env.MEDIA_BUCKET) {
    return new Response('Not Found', { status: 404 });
  }

  const object = await env.MEDIA_BUCKET.get(key);
  if (!object) {
    return new Response('Image Not Found', { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');

  return new Response(object.body, { headers });
}
