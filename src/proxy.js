// OpenOS Web Proxy (Cloudflare Worker)
// 埋め込み禁止ヘッダを外し、リンクとGETフォームをOpenOSブラウザへ返すだけの小さな中継です。
// wrangler.jsonc: { "name": "openos-proxy", "main": "openos_proxy_worker.js", "compatibility_date": "2026-11-01" }
// 公開前に `wrangler secret put TOKEN` を設定し、OpenOSには https://<name>.workers.dev/?token=<TOKEN> を入れます。
const PRIVATE = /^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.|\[?::1)/;
const HOOK = `<script>
document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('a[href]');
if(a&&!a.href.startsWith('javascript:')&&a.getAttribute('href')[0]!=='#'){e.preventDefault();parent.postMessage({openos:a.href},'*')}},true);
document.addEventListener('submit',e=>{const f=e.target;if((f.method||'get').toLowerCase()!=='get')return;
e.preventDefault();const u=new URL(f.action||location.href);new FormData(f).forEach((v,k)=>u.searchParams.set(k,v));
parent.postMessage({openos:u.href},'*')},true)</script>`;
export default {
  async fetch(req, env) {
    const u = new URL(req.url);
    const cors = { 'access-control-allow-origin': '*' };
    if (req.method === 'OPTIONS') return new Response(null, { headers: { ...cors, 'access-control-allow-methods': 'GET', 'access-control-allow-headers': '*' } });
    if (env.TOKEN && u.searchParams.get('token') !== env.TOKEN) return new Response('unauthorized', { status: 401, headers: cors });
    let target;
    try { target = new URL(u.searchParams.get('url')); } catch { return new Response('?url= が必要です', { status: 400, headers: cors }); }
    if (!/^https?:$/.test(target.protocol) || PRIVATE.test(target.hostname)) return new Response('許可されていないURLです', { status: 403, headers: cors });
    const r = await fetch(target, { headers: { 'user-agent': req.headers.get('user-agent') || 'OpenOS', 'accept-language': 'ja,en;q=0.8', accept: req.headers.get('accept') || '*/*' }, redirect: 'follow' });
    const h = new Headers(r.headers);
    ['x-frame-options', 'content-security-policy', 'content-security-policy-report-only', 'content-encoding', 'content-length'].forEach(k => h.delete(k));
    h.set('access-control-allow-origin', '*');
    if (!(h.get('content-type') || '').includes('text/html')) return new Response(r.body, { status: r.status, headers: h });
    const base = `<base href="${r.url.replace(/"/g, '%22')}">`;
    return new HTMLRewriter().on('head', { element(e) { e.prepend(base + HOOK, { html: true }); } }).transform(new Response(r.body, { status: r.status, headers: h }));
  },
};
