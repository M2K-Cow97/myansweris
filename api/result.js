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
    // 카드 디자인 버전. og.js 의 응답은 immutable 로 1 년 캐시되므로, 문구나
    // 레이아웃을 바꿀 때 이 값을 올려야 카카오가 새 이미지로 인식한다.
    const img = origin + '/api/og?v=2&menu=' + encodeURIComponent(menu);
    html = html
      .replace(/(<meta property="og:image" content=")[^"]*(")/, '$1' + img + '$2')
      .replace(/(<meta name="twitter:image" content=")[^"]*(")/, '$1' + img + '$2')
      .replace(/(<meta property="og:description" content=")[^"]*(")/,
        '$1오늘 점심은 ' + menu + ' · 이의 제기는 받지 않습니다$2')
      .replace(/(<meta name="twitter:description" content=")[^"]*(")/,
        '$1오늘 점심은 ' + menu + ' · 이의 제기는 받지 않습니다$2');
  }

  // /r/... 에서 서빙하므로 상대경로 자산(lunch-menus.js 등)이 /r/ 기준으로
  // 해석된다. base 를 박아 원래 위치를 가리키게 한다.
  html = html.replace(/<head>/i, '<head><base href="' + origin + '/">');

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=300',
    },
  });
}
