import { verify } from './sign.js';

export const config = { runtime: 'edge' };

// ?m=메뉴&s=서명 으로 들어온 결과 페이지. 정적 HTML 은 쿼리에 따라 OG 태그를
// 바꿀 수 없으므로, 여기서 원본을 가져와 메타태그만 갈아끼운다.
export default async function handler(req) {
  const url = new URL(req.url);
  const p = url.searchParams.get('page') || '';
  const page = (p === 'gif' || p === 'lunch-gif' || url.pathname.includes('gif')) ? 'lunch-gif' : 'lunch';
  const menu = (url.searchParams.get('m') || '').slice(0, 20);
  const sig = (url.searchParams.get('s') || '').slice(0, 16);

  const origin = url.origin;
  const res = await fetch(origin + '/' + page + '.html');
  let html = await res.text();

  const secret = process.env.DRAW_SECRET || '';
  const ok = menu && (!secret || (await verify(menu, sig, secret)));

  if (ok) {
    // 서명이 맞을 때만 메뉴가 박힌 카드를 미리보기로 내보낸다.
    const img = origin + '/api/og?menu=' + encodeURIComponent(menu);
    html = html
      .replace(/(<meta property="og:image" content=")[^"]*(")/, '$1' + img + '$2')
      .replace(/(<meta name="twitter:image" content=")[^"]*(")/, '$1' + img + '$2')
      .replace(/(<meta property="og:description" content=")[^"]*(")/,
        '$1오늘 점심은 ' + menu + ' · 이의 제기는 받지 않습니다$2')
      .replace(/(<meta name="twitter:description" content=")[^"]*(")/,
        '$1오늘 점심은 ' + menu + ' · 이의 제기는 받지 않습니다$2');
  }

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=300',
    },
  });
}
