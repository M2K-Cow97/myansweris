import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

// 종이에 앉힐 글자 수가 늘면 크기를 줄인다 (마르게리타피자까지 한 줄로)
function menuSize(name) {
  const n = [...name].length;
  if (n <= 4) return 60;
  if (n <= 6) return 50;
  if (n <= 8) return 42;
  return 36;
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const menu = (searchParams.get('menu') || '???').slice(0, 20);
  const flag = (searchParams.get('flag') || '').slice(0, 8);
  const code = (searchParams.get('code') || '').replace(/[^A-Z]/g, '').slice(0, 4);

  // satori 는 woff2 를 못 읽는다 — otf 여야 한다.
  // 폰트를 못 받으면 한글이 네모로 나오므로, 실패 시엔 이미지 자체를 포기하고
  // 정적 카드로 넘긴다 (빈 응답보다 낫다).
  const FONT_URL = 'https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/public/static/Pretendard-Bold.otf';
  let font = null;
  try {
    const res = await fetch(FONT_URL);
    if (res.ok) {
      const buf = await res.arrayBuffer();
      // OTTO / true / 0x00010000 만 유효. 404 HTML 을 폰트로 넘기면 500 이 난다.
      const sig = new Uint8Array(buf.slice(0, 4));
      const tag = String.fromCharCode(...sig);
      if (tag === 'OTTO' || tag === 'true' || tag === '\u0000\u0001\u0000\u0000') font = buf;
    }
  } catch (e) {}
  if (!font) {
    return Response.redirect('https://myansweris.vercel.app/assets/og-lunch.jpg', 302);
  }

  const stripes = [[4, 15], [22, 8], [42, 3], [62, -3], [82, -8], [95, -15]];

  return new ImageResponse(
    {
      type: 'div',
      props: {
        style: {
          width: '800px', height: '800px', display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(150deg,#12aede 0%,#1b2fae 38%,#3c1a9e 62%,#a01283 100%)',
          fontFamily: 'P', position: 'relative', padding: '0 56px',
        },
        children: [
          ...stripes.map(([l, r]) => ({
            type: 'div',
            props: {
              style: {
                position: 'absolute', top: '-20%', left: l + '%', width: '110px', height: '150%',
                background: 'linear-gradient(180deg,rgba(255,255,255,0),rgba(255,255,255,.10) 50%,rgba(255,255,255,0))',
                transform: 'rotate(' + r + 'deg)',
              },
            },
          })),
          {
            type: 'div',
            props: {
              style: {
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                fontSize: '50px', color: '#fff', letterSpacing: '-1.6px',
                lineHeight: 1.28, textAlign: 'center', marginBottom: '44px',
              },
              children: [
                { type: 'div', props: { children: '점심 조추첨이' } },
                { type: 'div', props: { children: '완료되었습니다' } },
              ],
            },
          },
          {
            type: 'div',
            props: {
              style: {
                width: '470px', display: 'flex', flexDirection: 'column',
                borderRadius: '14px', overflow: 'hidden',
                background: 'linear-gradient(180deg,#fdfcf8,#f1eee4)',
                boxShadow: '0 22px 50px rgba(0,0,20,.45)',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      height: '42px', display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between', padding: '0 18px',
                      background: 'linear-gradient(100deg,#1b2c8f 0%,#2f3fa8 38%,#e0475e 58%,#27357f 82%,#1b2c8f 100%)',
                    },
                    children: [
                      { type: 'div', props: { style: { color: '#fff', fontSize: '13px', letterSpacing: '2.5px' }, children: 'MY ANSWER IS' } },
                      { type: 'div', props: { style: { color: 'rgba(255,255,255,.85)', fontSize: '13px' }, children: "DRAW '26" } },
                    ],
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      padding: '30px 20px 34px', color: '#101a4d',
                    },
                    children: [
                      { type: 'div', props: { style: { fontSize: menuSize(menu) + 'px', letterSpacing: '-1px' }, children: menu } },
                      (flag || code)
                        ? { type: 'div', props: { style: { fontSize: '24px', marginTop: '8px' }, children: (flag ? flag + ' ' : '') + (code ? '(' + code + ')' : '') } }
                        : null,
                    ].filter(Boolean),
                  },
                },
              ],
            },
          },
          {
            type: 'div',
            props: {
              style: {
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                marginTop: '52px', color: 'rgba(255,255,255,.72)', fontSize: '21px', textAlign: 'center',
              },
              children: [
                { type: 'div', props: { children: '이의 제기는 받지 않습니다' } },
                { type: 'div', props: { children: '재추첨 신청 반려됨' } },
              ],
            },
          },
        ],
      },
    },
    {
      width: 800,
      height: 800,
      fonts: [{ name: 'P', data: font, style: 'normal', weight: 700 }],
      headers: { 'cache-control': 'public, max-age=31536000, immutable' },
    }
  );
}
