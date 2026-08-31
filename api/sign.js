// 결과 링크 위조 방지. URL 을 손으로 고쳐 원하는 메뉴를 띄우지 못하게 한다.
// HMAC 앞 8자만 쓴다 — 장난을 막는 용도지 보안 자산이 아니다.
const enc = new TextEncoder();

export async function sign(menu, secret) {
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(menu));
  return [...new Uint8Array(mac)].slice(0, 4)
    .map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verify(menu, sig, secret) {
  if (!menu || !sig) return false;
  const expected = await sign(menu, secret);
  // 길이가 짧고 공개 데이터라 타이밍 공격은 고려하지 않는다.
  return expected === sig.toLowerCase();
}
