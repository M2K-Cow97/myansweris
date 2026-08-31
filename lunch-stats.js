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

// 결과 아래 한 줄. 기간 제한 없이 전체 누적으로 센다.
// 표가 몰리면 순위를, 다 갈리면 최근 뽑힌 것들을 보여준다.
async function todayLine(menu) {
  const [rank, total, recent] = await Promise.all([
    rpc('all_ranking'), rpc('all_total'), rpc('all_recent'),
  ]);
  if (!total) return '';
  const parts = ['방금 ' + (Number(total) + DISPLAY_BASE).toLocaleString() + '번째로 뽑혔습니다'];
  const top = Array.isArray(rank) && rank.length ? rank[0] : null;
  const mine = Array.isArray(rank) ? rank.find((r) => r.menu === menu) : null;

  if (mine && mine.cnt > 1) parts.push('벌써 ' + mine.cnt + '명째 같은 메뉴');

  // 최근 목록은 순서가 최신순이라 "바로 앞"이라고 말해도 사실이다.
  // 반면 순위는 전체 누적이라 지금 벌어지는 일처럼 쓰면 거짓이 된다 — 표현을 나눈다.
  const others = Array.isArray(recent)
    ? recent.filter((r) => r.menu !== menu).slice(0, 3)
    : [];

  if (others.length) {
    parts.push('바로 앞은 ' + others.map((r) => r.menu).join(', '));
  } else if (top && top.cnt > 1) {
    parts.push('요즘 제일 많이 나오는 건 ' + top.menu + ' ' + top.flag);
  }
  return parts.join(' · ');
}
