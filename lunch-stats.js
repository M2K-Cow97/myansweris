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

// 결과 아래 한 줄. 표가 몰리면 순위를, 다 갈리면 최근 뽑힌 것들을 보여준다.
async function todayLine(menu) {
  const [rank, total, recent] = await Promise.all([
    rpc('today_ranking'), rpc('today_total'), rpc('today_recent'),
  ]);
  if (!total) return '';
  const parts = ['오늘 ' + total + '명이 뽑았습니다'];
  const top = Array.isArray(rank) && rank.length ? rank[0] : null;
  const mine = Array.isArray(rank) ? rank.find((r) => r.menu === menu) : null;

  if (mine && mine.cnt > 1) parts.push('그중 ' + mine.cnt + '명이 같은 운명');

  if (top && top.cnt > 1) {
    // 표가 몰린 메뉴가 있을 때만 순위가 의미를 갖는다.
    parts.push('1위 ' + top.menu + ' ' + top.flag + ' ' + top.cnt + '표');
  } else if (Array.isArray(recent) && recent.length > 1) {
    // 다 제각각이면 순위 대신 남들이 뭘 받았는지 보여준다.
    const others = recent.filter((r) => r.menu !== menu).slice(0, 3);
    if (others.length) parts.push('방금 전 ' + others.map((r) => r.menu).join(' · '));
  }
  return parts.join(' · ');
}
