import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

// 종이에 앉힐 글자 수가 늘면 크기를 줄인다 (마르게리타피자까지 한 줄로)
function menuSize(name) {
  const n = [...name].length;
  if (n <= 3) return 30;
  if (n <= 5) return 26;
  if (n <= 7) return 22;
  return 19;
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const menu = (searchParams.get('menu') || '???').slice(0, 20);
  const flag = (searchParams.get('flag') || '').slice(0, 8);
  const code = (searchParams.get('code') || '').replace(/[^A-Z]/g, '').slice(0, 4);
  // 카톡은 경로마다 비율이 다르다: 링크 붙여넣기는 가로형, 공유 버튼(feed)은 정사각형.
  const square = searchParams.get('ratio') === 'square';

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

  // 로고는 실패해도 그냥 생략한다 (카드 자체는 나와야 하므로)
  let logo = null;
  try {
    const r = await fetch('https://myansweris.vercel.app/assets/logo-cut.png');
    if (r.ok) {
      const b = await r.arrayBuffer();
      let bin = '';
      const bytes = new Uint8Array(b);
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      logo = 'data:image/png;base64,' + btoa(bin);
    }
  } catch (e) {}

  // 실제 화면 그대로: 정지 프레임 위에 종이를 얹는다.
  let still = null;
  try {
    const r = await fetch('https://myansweris.vercel.app/assets/lunch-still.png');
    if (r.ok) {
      const b = await r.arrayBuffer();
      let bin = '';
      const bytes = new Uint8Array(b);
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      still = 'data:image/png;base64,' + btoa(bin);
    }
  } catch (e) {}
  if (!still) {
    return Response.redirect('https://myansweris.vercel.app/assets/og-lunch.jpg', 302);
  }

  // 1200x630 가로형. 링크 붙여넣기 경로가 이 비율을 쓴다.
  // 위아래가 잘려도 살아남도록 내용을 세로 중앙에 모은다.
  const W = square ? 800 : 1200, H = square ? 800 : 630;
  const SW = square ? 720 : 660, SH = square ? 403 : 370;   // 스틸(400x224) 비율 유지
  const PX = 79 / 400 * SW, PY = 60 / 224 * SH;
  const PW = (222 - 79) / 400 * SW, PH = (124 - 60) / 224 * SH;

  return new ImageResponse(
    {
      type: 'div',
      props: {
        style: {
          width: W + 'px', height: H + 'px', display: 'flex',
          flexDirection: square ? 'column' : 'row',
          alignItems: 'center', justifyContent: 'center', gap: square ? '0' : '54px',
          background: 'linear-gradient(150deg,#12aede 0%,#1b2fae 38%,#3c1a9e 62%,#a01283 100%)',
          fontFamily: 'P', padding: '0 60px',
        },
        children: [
          // 왼쪽: 로고와 문구
          {
            type: 'div',
            props: {
              style: {
                display: 'flex', flexDirection: 'column',
                alignItems: square ? 'center' : 'flex-start', justifyContent: 'center',
                marginBottom: square ? '38px' : '0',
              },
              children: [
                logo ? { type: 'img', props: { src: logo, width: 260, style: { marginBottom: '26px' } } } : null,
                {
                  type: 'div',
                  props: {
                    style: { display: 'flex', fontSize: '46px', color: '#fff', letterSpacing: '-1.4px' },
                    children: [
                      { type: 'div', props: { children: '오늘 점심은,\u00A0' } },
                      { type: 'div', props: { style: { color: '#8db6ff' }, children: '이걸로.' } },
                    ],
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: { fontSize: '21px', color: 'rgba(255,255,255,.55)', marginTop: '14px' },
                    children: '번복은 불가능합니다',
                  },
                },
              ].filter(Boolean),
            },
          },
          // 오른쪽: 뽑은 카드
          {
            type: 'div',
            props: {
              style: {
                position: 'relative', display: 'flex',
                width: SW + 'px', height: SH + 'px',
                borderRadius: '16px', overflow: 'hidden',
                boxShadow: '0 20px 46px rgba(0,0,20,.45)',
              },
              children: [
                { type: 'img', props: { src: still, width: SW, height: SH } },
                {
                  type: 'div',
                  props: {
                    style: {
                      position: 'absolute', left: (PX - 4) + 'px', top: (PY - 4) + 'px',
                      width: (PW + 8) + 'px', height: (PH + 8) + 'px',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      background: 'linear-gradient(177deg,#f7f7f5 0%,#f0f0ee 52%,#e7e7e5 100%)',
                      transform: 'rotate(-0.9deg)', color: '#20242c',
                    },
                    children: [
                      { type: 'div', props: { style: { fontSize: menuSize(menu) + 'px', letterSpacing: '-0.5px' }, children: menu } },
                      (flag || code)
                        ? { type: 'div', props: { style: { fontSize: '18px', marginTop: '4px' }, children: (flag ? flag + ' ' : '') + (code ? '(' + code + ')' : '') } }
                        : null,
                    ].filter(Boolean),
                  },
                },
              ],
            },
          },
        ].filter(Boolean),
      },
    },
    {
      width: W,
      height: H,
      fonts: [{ name: 'P', data: font, style: 'normal', weight: 700 }],
      headers: { 'cache-control': 'public, max-age=31536000, immutable' },
    }
  );
}
