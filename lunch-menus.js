// [메뉴, 국기, 국가명] — 원본 조추첨 카드의 "팀명 / (국가코드)" 3줄 구조를 그대로 따른다.
const MENUS = [
  ["제육볶음","🇰🇷","KOR"],["김치찌개","🇰🇷","KOR"],["된장찌개","🇰🇷","KOR"],["부대찌개","🇰🇷","KOR"],
  ["순두부찌개","🇰🇷","KOR"],["국밥","🇰🇷","KOR"],["돼지국밥","🇰🇷","KOR"],["순대국","🇰🇷","KOR"],
  ["설렁탕","🇰🇷","KOR"],["갈비탕","🇰🇷","KOR"],["삼계탕","🇰🇷","KOR"],["감자탕","🇰🇷","KOR"],
  ["뼈해장국","🇰🇷","KOR"],["육개장","🇰🇷","KOR"],["비빔밥","🇰🇷","KOR"],["돌솥비빔밥","🇰🇷","KOR"],
  ["불고기","🇰🇷","KOR"],["쭈꾸미볶음","🇰🇷","KOR"],["오징어볶음","🇰🇷","KOR"],["닭갈비","🇰🇷","KOR"],
  ["보쌈","🇰🇷","KOR"],["족발","🇰🇷","KOR"],["냉면","🇰🇷","KOR"],["콩국수","🇰🇷","KOR"],
  ["칼국수","🇰🇷","KOR"],["수제비","🇰🇷","KOR"],["김밥","🇰🇷","KOR"],["떡볶이","🇰🇷","KOR"],
  ["라면","🇰🇷","KOR"],["백반","🇰🇷","KOR"],
  ["짜장면","🇨🇳","CHN"],["짬뽕","🇨🇳","CHN"],["탕수육","🇨🇳","CHN"],["마라탕","🇨🇳","CHN"],
  ["마라샹궈","🇨🇳","CHN"],["양꼬치","🇨🇳","CHN"],["볶음밥","🇨🇳","CHN"],["마파두부","🇨🇳","CHN"],
  ["깐풍기","🇨🇳","CHN"],["울면","🇨🇳","CHN"],["군만두","🇨🇳","CHN"],["훠궈","🇨🇳","CHN"],
  ["초밥","🇯🇵","JPN"],["돈까스","🇯🇵","JPN"],["카레","🇯🇵","JPN"],["라멘","🇯🇵","JPN"],
  ["우동","🇯🇵","JPN"],["소바","🇯🇵","JPN"],["규동","🇯🇵","JPN"],["가츠동","🇯🇵","JPN"],
  ["오야코동","🇯🇵","JPN"],["텐동","🇯🇵","JPN"],["사케동","🇯🇵","JPN"],["오므라이스","🇯🇵","JPN"],
  ["타코야키","🇯🇵","JPN"],["나베","🇯🇵","JPN"],["야키소바","🇯🇵","JPN"],
  ["파스타","🇮🇹","ITA"],["크림파스타","🇮🇹","ITA"],["알리오올리오","🇮🇹","ITA"],["라자냐","🇮🇹","ITA"],
  ["피자","🇮🇹","ITA"],["마르게리타피자","🇮🇹","ITA"],["리조또","🇮🇹","ITA"],["뇨끼","🇮🇹","ITA"],
  ["햄버거","🇺🇸","USA"],["치즈버거","🇺🇸","USA"],["스테이크","🇺🇸","USA"],["BBQ립","🇺🇸","USA"],
  ["핫도그","🇺🇸","USA"],["샌드위치","🇺🇸","USA"],["콥샐러드","🇺🇸","USA"],["치킨텐더","🇺🇸","USA"],
  ["팟타이","🇹🇭","THA"],["똠얌꿍","🇹🇭","THA"],["그린커리","🇹🇭","THA"],["카오팟","🇹🇭","THA"],
  ["뿌팟퐁커리","🇹🇭","THA"],
  ["쌀국수","🇻🇳","VIE"],["분짜","🇻🇳","VIE"],["반미","🇻🇳","VIE"],["월남쌈","🇻🇳","VIE"],
  ["타코","🇲🇽","MEX"],["부리토","🇲🇽","MEX"],["퀘사디아","🇲🇽","MEX"],["나초","🇲🇽","MEX"],
  ["버터치킨커리","🇮🇳","IND"],["탄두리치킨","🇮🇳","IND"],["난&커리","🇮🇳","IND"],["비리야니","🇮🇳","IND"],
  ["빠에야","🇪🇸","ESP"],["감바스","🇪🇸","ESP"],["타파스","🇪🇸","ESP"],
  ["크로크무슈","🇫🇷","FRA"],["키슈","🇫🇷","FRA"],["라따뚜이","🇫🇷","FRA"],
  ["케밥","🇹🇷","TUR"],["피데","🇹🇷","TUR"],
  ["딤섬","🇭🇰","HKG"],["슈니첼","🇩🇪","GER"],
];

const CEREMONY_MS = 4200;
const GIF = 'assets/lunch-draw.gif';
const STILL = 'assets/lunch-still.png';   // 추첨이 끝나면 마지막 프레임에서 멈춘다
const KAKAO_KEY = '0a6d4475254b25344a9e9f7777580b92';

const $ = (id) => document.getElementById(id);
const stage = $('stage'), scene = $('scene'), cover = $('cover'), slip = $('slip');
const elName = $('name'), elCountry = $('country'), patch = $('patch');
const btnStart = $('start'), rowAfter = $('after'), btnRedraw = $('redraw'), btnShare = $('share');
const elTitle = $('title'), elSub = $('sub'), elHint = $('hint'), btnSound = $('sound');

let last = -1, timer = null, current = null;

// 공유 링크에 결과를 담기 위한 인코딩 (답변 앱과 같은 방식)
function b64encode(str) {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64decode(str) {
  const b = str.replace(/-/g, '+').replace(/_/g, '/');
  return decodeURIComponent(escape(atob(b + '==='.slice((b.length + 3) % 4))));
}
// #메뉴 로 들어오면 그 결과를 고정한다
function seededMenu() {
  const h = location.hash.slice(1);
  if (!h) return null;
  try {
    const name = b64decode(h);
    return MENUS.find((m) => m[0] === name) || null;
  } catch (e) { return null; }
}

function pick() {
  let i;
  do { i = Math.floor(Math.random() * MENUS.length); } while (i === last && MENUS.length > 1);
  last = i;
  return MENUS[i];
}

// 종이는 좁다. 긴 메뉴명은 두 줄로 흘리고, 그래도 넘치면 글자를 줄인다.
function fitSlip() {
  const w = stage.clientWidth;
  let fs = w * 0.050;
  elName.style.fontSize = fs + 'px';
  elCountry.style.fontSize = (w * 0.040) + 'px';
  const box = slip.clientWidth * 0.98;
  let guard = 0;
  while ((elName.scrollWidth > box || slip.scrollHeight > slip.clientHeight) && fs > 6 && guard++ < 40) {
    fs *= 0.94;
    elName.style.fontSize = fs + 'px';
    elCountry.style.fontSize = (fs * 0.8) + 'px';
  }
}

function draw() {
  clearTimeout(timer);
  slip.classList.remove('on');
  patch.classList.remove('on');
  rowAfter.hidden = true;
  btnStart.hidden = false;
  btnStart.textContent = '추첨 중…';
  btnStart.disabled = true;
  elTitle.innerHTML = '공 하나를, <span>뽑는 중.</span>';
  elSub.textContent = '진행자가 캡슐을 여는 중입니다';
  scene.src = '';
  scene.src = GIF;
  const seed = seededMenu();
  if (seed) { current = seed; last = MENUS.indexOf(seed); }
  else current = pick();
  timer = setTimeout(() => {
    const [name, flag, code] = current;
    elName.textContent = name;
    elCountry.textContent = flag + ' (' + code + ')';
    elName.style.animation = 'none'; elCountry.style.animation = 'none';
    void elName.offsetWidth;
    elName.style.animation = ''; elCountry.style.animation = '';
    scene.src = STILL;          // GIF 반복을 끊고 정지 프레임으로 교체
    patch.classList.add('on');
    slip.classList.add('on');
    fitSlip();
    btnStart.hidden = true;
    btnStart.disabled = false;
    rowAfter.hidden = false;
    elTitle.innerHTML = '오늘 점심은, <span>이걸로.</span>';
    elSub.textContent = '번복은 불가능합니다';
    speak(name);
  }, CEREMONY_MS);
}

btnStart.addEventListener('click', () => {
  cover.classList.add('hide');
  draw();
});
btnRedraw.addEventListener('click', () => {
  if (location.hash) history.replaceState(null, '', location.pathname);
  draw();
});
window.addEventListener('resize', () => { if (slip.classList.contains('on')) fitSlip(); });

btnShare.addEventListener('click', () => {
  if (!current) return;
  const [name, flag] = current;
  const text = '오늘 점심은 ' + name + ' ' + flag;
  const base = location.href.split('#')[0];
  const resultUrl = base + '#' + b64encode(name);
  const url = base;
  try {
    if (window.Kakao) {
      if (!window.Kakao.isInitialized()) window.Kakao.init(KAKAO_KEY);
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: '점심 조추첨이 완료 되었습니다.',
          description: text + ' · 이의 제기는 받지 않습니다',
          imageUrl: 'https://myansweris.vercel.app/assets/og-lunch.jpg',
          imageWidth: 800,
          imageHeight: 800,
          link: { mobileWebUrl: url, webUrl: url }
        },
        buttons: [
          { title: '결과 보기', link: { mobileWebUrl: resultUrl, webUrl: resultUrl } },
          { title: '나도 뽑기', link: { mobileWebUrl: url, webUrl: url } }
        ]
      });
      return;
    }
  } catch (e) {}
  if (navigator.share) { navigator.share({ text: text, url: url }).catch(() => {}); return; }
  if (navigator.clipboard) navigator.clipboard.writeText(text + ' ' + url);
  btnShare.textContent = '복사됨 ✓';
  setTimeout(() => { btnShare.textContent = '카톡 공유'; }, 1600);
});

/* ---- 배경음악: 답변 앱과 동일 규칙 (반복, 0.6, 첫 조작에 시작) ---- */
const audio = new Audio('assets/champs.m4a');
audio.loop = true; audio.volume = 0.45; audio.preload = 'auto';
let muted = false;
const startBgm = () => { if (!muted) audio.play().catch(() => {}); };
startBgm();
const unlock = () => { startBgm(); primeSpeech(); };
['pointerdown', 'touchstart', 'keydown'].forEach((e) =>
  window.addEventListener(e, unlock, { passive: true }));

btnSound.addEventListener('click', () => {
  muted = !muted;
  btnSound.textContent = muted ? '🔇' : '🔊';
  btnSound.setAttribute('aria-label', muted ? '음악 켜기' : '음악 끄기');
  if (muted) { audio.pause(); stopSpeak(); }
  else audio.play().catch(() => {});
});

/* ---- TTS: 남성 저음, 읽는 동안 음악 더킹 ---- */
function pickVoice() {
  const ko = speechSynthesis.getVoices().filter((v) => /^ko/i.test(v.lang));
  if (!ko.length) return null;
  const ORDER = [/rocko/i, /reed/i, /\bko-kr-x-ko[db]\b/i, /injoon|minsu|jinho/i, /eddy/i, /grandpa/i, /male|남성|남자/i];
  for (const re of ORDER) { const hit = ko.find((v) => re.test(v.name)); if (hit) return hit; }
  const FEMALE = /\b(yuna|sora|heami|nari|sunhi|jiwon|flo|sandy|shelley|grandma|female|여성|여자|ko-kr-x-ko[ac])\b/i;
  return ko.find((v) => !FEMALE.test(v.name)) || ko[0];
}
function stopSpeak() {
  try { speechSynthesis.cancel(); } catch (e) {}
  if (!muted) audio.volume = 0.45;
}
// iOS는 사용자 제스처 안에서 speak() 를 한 번 거쳐야 이후 재생을 허용한다.
let speechPrimed = false;
function primeSpeech() {
  if (speechPrimed || !window.speechSynthesis) return;
  speechPrimed = true;
  try {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0; u.lang = 'ko-KR';
    speechSynthesis.speak(u);
  } catch (e) {}
}
// 화면에는 국기를 두되, 읽을 때는 뺀다
function speechText(text) {
  return String(text || '')
    .replace(/[\u{1F1E6}-\u{1F1FF}]{2}/gu, ' ')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, ' ')
    .replace(/\s+/g, ' ').trim();
}
function speak(text) {
  const say = speechText(text);
  if (!window.speechSynthesis || muted || !say) return;
  const go = () => {
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(say);
      u.lang = 'ko-KR'; u.rate = 0.9; u.pitch = 1.4;
      const v = pickVoice();
      if (v) u.voice = v;           // 못 찾아도 기본 음성으로 읽는다
      const restore = () => { if (!muted) audio.volume = 0.45; };
      audio.volume = 0.12;
      u.onend = restore; u.onerror = restore;
      speechSynthesis.speak(u);
    } catch (e) {}
  };
  if (!speechSynthesis.getVoices().length) {   // 모바일은 목록이 늦게 온다
    let done = false;
    const once = () => { if (done) return; done = true; go(); };
    try { speechSynthesis.addEventListener('voiceschanged', once, { once: true }); } catch (e) {}
    setTimeout(once, 700);
    return;
  }
  go();
}
