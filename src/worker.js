// OpenOS: Cloudflare Worker。静的ファイル(public/)は Assets が配信し、このWorkerは /proxy だけを処理します。
const PRIVATE = /^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.|\[?::1)/;
const STRIP = ['x-frame-options', 'content-security-policy', 'content-security-policy-report-only', 'content-encoding', 'content-length', 'set-cookie', 'refresh'];
const HOOK = `<script>
document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('a[href]');
if(a&&!a.href.startsWith('javascript:')&&a.getAttribute('href')[0]!=='#'){e.preventDefault();parent.postMessage({openos:a.href},'*')}},true);
document.addEventListener('submit',e=>{const f=e.target;if((f.method||'get').toLowerCase()!=='get')return;
e.preventDefault();const u=new URL(f.action||location.href);new FormData(f).forEach((v,k)=>u.searchParams.set(k,v));
parent.postMessage({openos:u.href},'*')},true)</script>`;

export default {
  async fetch(req, env) {
    const u = new URL(req.url);
    if (u.pathname !== '/proxy') return env.ASSETS.fetch(req);
    if (req.method !== 'GET') return new Response('GET only', { status: 405 });
    // OpenOS自身のiframeからのリクエストだけ許可(ブラウザが付けるSec-Fetch-Site)。外部利用したい場合は TOKEN を設定。
    const sameOrigin = req.headers.get('sec-fetch-site') === 'same-origin';
    const tokenOk = env.TOKEN && u.searchParams.get('token') === env.TOKEN;
    if (!sameOrigin && !tokenOk) return new Response('forbidden', { status: 403 });
    let target;
    try { target = new URL(u.searchParams.get('url')); } catch { return new Response('?url= が必要です', { status: 400 }); }
    if (!/^https?:$/.test(target.protocol) || PRIVATE.test(target.hostname)) return new Response('許可されていないURLです', { status: 403 });
    const r = await fetch(target, {
      headers: { 'user-agent': req.headers.get('user-agent') || 'OpenOS', 'accept-language': 'ja,en;q=0.8', accept: req.headers.get('accept') || '*/*' },
      redirect: 'follow',
    });
    const h = new Headers(r.headers);
    STRIP.forEach(k => h.delete(k));
    h.set('x-content-type-options', 'nosniff');
    if (!(h.get('content-type') || '').includes('text/html')) return new Response(r.body, { status: r.status, headers: h });
    const base = `<base href="${r.url.replace(/"/g, '%22')}">`;
    return new HTMLRewriter()
      .on('head', { element(e) { e.prepend(base + HOOK, { html: true }); } })
      .transform(new Response(r.body, { status: r.status, headers: h }));
  },
};
