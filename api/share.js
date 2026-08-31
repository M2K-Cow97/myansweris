import { sign } from './sign.js';

export const config = { runtime: 'edge' };

// 결과 링크를 발급한다. 서명이 붙어야 남이 URL 을 고쳐 결과를 바꾸지 못한다.
export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const menu = (searchParams.get('menu') || '').slice(0, 20);
  const page = searchParams.get('page') === 'gif' ? 'lunch-gif' : 'lunch';
  if (!menu) return new Response('{"error":"menu required"}', { status: 400 });

  const secret = process.env.DRAW_SECRET || '';
  const s = secret ? await sign(menu, secret) : '';
  const url = 'https://myansweris.vercel.app/' + page
    + '?m=' + encodeURIComponent(menu) + (s ? '&s=' + s : '');

  return new Response(JSON.stringify({ url }), {
    headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=86400' },
  });
}
