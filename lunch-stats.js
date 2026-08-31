// 점심 추첨 집계. 익명 기록만 남기고, 순위는 서버 함수로만 읽는다.
// anon 키는 공개돼도 되는 키다 — INSERT 권한만 있고 조회·삭제는 막혀 있다.
const SB_URL = 'https://agrkwhqwbmnvykhlucdb.supabase.co';
const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFncmt3aHF3Ym1udnlraGx1Y2RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwOTc5MTMsImV4cCI6MjEwMzY3MzkxM30.8OrH0es3x8DT7v0k0M4Yi4I7YZnC6o8QPCPXS8qGPYQ';

const SB_HEADERS = {
  'apikey': SB_ANON,
  'Authorization': 'Bearer ' + SB_ANON,
  'Content-Type': 'application/json',
};

// 결과를 기록한다. 실패해도 화면은 그대로 — 집계는 부가 기능이다.
function recordDraw(menu, flag, code, variant) {
  try {
    return fetch(SB_URL + '/rest/v1/draws', {
      method: 'POST',
      headers: SB_HEADERS,
      body: JSON.stringify({ menu: menu, flag: flag, code: code, variant: variant }),
      keepalive: true,
    }).catch(() => {});
  } catch (e) { return Promise.resolve(); }
}

function rpc(name) {
  return fetch(SB_URL + '/rest/v1/rpc/' + name, {
    method: 'POST', headers: SB_HEADERS, body: '{}',
  }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
}

// 서비스를 열자마자 "1명이 뽑았습니다" 가 뜨면 아무도 안 쓰는 것처럼 보인다.
// DB 에는 실제 기록만 남기고, 화면에 보여줄 때만 이만큼 얹는다 —
// 통계 쿼리는 여전히 진짜 숫자를 돌려준다.
const DISPLAY_BASE = 111;

// 목록 끝 글자의 받침에 따라 을/를 을 고른다.
// 한글 음절은 0xAC00 부터 종성 28개 단위로 배열돼 있어 나머지가 0이면 받침이 없다.
// 메뉴에 한글이 아닌 글자로 끝나는 이름은 없지만, 그런 경우엔 '를' 로 둔다.
function eul(word) {
  const c = word.charCodeAt(word.length - 1);
  if (c < 0xac00 || c > 0xd7a3) return '를';
  return (c - 0xac00) % 28 ? '을' : '를';
}

// 통계 줄을 갱신되는 것처럼 올린다. 두 줄을 각각 span 으로 넣고 시차를 줘서
// 내 순번이 먼저 서고 남들 결과가 뒤따라 붙는 순서를 만든다.
// 텍스트는 textContent 로만 넣는다 — 메뉴 이름은 DB 를 거쳐 온 값이다.
function paintStats(el, line) {
  if (!el || !line) return;
  el.textContent = '';
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  line.split('\n').forEach((t, i) => {
    const span = document.createElement('span');
    span.textContent = t;
    span.style.display = 'block';
    if (reduce) { el.appendChild(span); return; }
    span.style.cssText += ';opacity:0;transform:translateY(4px);' +
      'transition:opacity .45s ease,transform .45s ease;transition-delay:' + (i * 260) + 'ms';
    el.appendChild(span);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      span.style.opacity = '1';
      span.style.transform = 'none';
    }));
  });
}

// 결과 아래 두 줄. 기간 제한 없이 전체 누적으로 센다.
// 윗줄은 내 차례, 아랫줄은 남들 — 한 줄에 다 넣으면 좁은 화면에서 네 줄까지 흘렀다.
// 줄바꿈 문자로 돌려주고 CSS 의 white-space 가 살린다.
async function todayLine(menu) {
  const [rank, total, recent] = await Promise.all([
    rpc('all_ranking'), rpc('all_total'), rpc('all_recent'),
  ]);
  if (!total) return '';

  const mine = Array.isArray(rank) ? rank.find((r) => r.menu === menu) : null;
  const top = Array.isArray(rank) && rank.length ? rank[0] : null;

  // 윗줄 — 내 순번, 겹쳤으면 그 사실까지.
  let head = (Number(total) + DISPLAY_BASE).toLocaleString() + '번째로 뽑았습니다';
  if (mine && mine.cnt > 1) head += ' · 벌써 ' + mine.cnt + '명째 같은 메뉴';

  // 아랫줄 — 최근 목록은 최신순이라 지금 벌어지는 일로 말해도 사실이다.
  // 반면 순위는 전체 누적이라 같은 말투를 쓰면 거짓이 된다 — 표현을 나눈다.
  // 두 개까지만: 세 개를 넣으면 이름이 긴 메뉴가 겹칠 때 아랫줄이 두 줄로 접힌다.
  const others = Array.isArray(recent)
    ? recent.filter((r) => r.menu !== menu).slice(0, 2)
    : [];

  let tail = '';
  if (others.length) {
    const list = others.map((r) => r.menu).join(', ');
    tail = '다른 사람들은 ' + list + eul(list) + ' 뽑았습니다';
  } else if (top && top.cnt > 1) {
    tail = '요즘 제일 많이 나오는 건 ' + top.menu + ' ' + top.flag;
  }

  return tail ? head + '\n' + tail : head;
}
