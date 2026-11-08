(function () {
  'use strict';
  const SLIDES = window.SLIDES;
  const N = SLIDES.length;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (_) {} },
    del(k) { try { localStorage.removeItem(k); } catch (_) {} },
  };

  // ---------- 상태 ----------
  let token = store.get('presenterToken');
  let isPresenter = false;
  let cur = 0;           // 현재 표시 중인 슬라이드 (1부터)
  let last = null;       // 마지막 서버 상태
  let questions = [];
  let qFilter = 'open';
  let es = null;
  let cid = store.get('cid');
  if (!cid) { cid = Math.random().toString(36).slice(2) + Date.now().toString(36); store.set('cid', cid); }
  let mine = {};
  try { mine = JSON.parse(store.get('mine') || '{}'); } catch (_) { mine = {}; }
  const saveMine = () => store.set('mine', JSON.stringify(mine));

  // ---------- 무대 구성 ----------
  const stage = $('#stage');
  const deck = $('#deck');
  deck.innerHTML = SLIDES.map((s, i) => `<section class="slide" data-n="${i + 1}">${s.html}</section>`).join('');
  const slideEl = (n) => deck.children[n - 1];
  deck.appendChild($('#spot')); // 스포트라이트는 슬라이드와 함께 확대/축소

  function fit() {
    if (isPresenter) {
      const W = window.innerWidth, Hh = window.innerHeight;
      const s = Math.min(W / 1440, Hh / 810);
      stage.style.width = 1440 * s + 'px';
      stage.style.height = 810 * s + 'px';
      stage.style.left = (W - 1440 * s) / 2 + 'px';
      stage.style.top = (Hh - 810 * s) / 2 + 'px';
      deck.style.transform = `scale(${s})`;
    } else {
      const w = stage.parentElement.clientWidth - 32;
      const s = w / 1440;
      stage.style.width = w + 'px';
      stage.style.height = 810 * s + 'px';
      stage.style.left = stage.style.top = '';
      deck.style.transform = `scale(${s})`;
    }
  }
  window.addEventListener('resize', fit);
  if (window.ResizeObserver) new ResizeObserver(() => fit()).observe(document.body);

  function show(n, animate = true) {
    n = Math.max(1, Math.min(N, n));
    if (n === cur) return;
    const prev = cur && slideEl(cur);
    if (prev) prev.classList.remove('active', 'play');
    cur = n;
    const el = slideEl(n);
    el.classList.add('active');
    if (animate) replay(); else el.classList.add('play');
    $('#pg').textContent = `${n} / ${N}`;
    $('#audPg').textContent = `${n} / ${N}`;
    $('#resetBtn').classList.toggle('hidden', !SLIDES[n - 1].interact);
    if (!isPresenter) renderPanel();
    // 다음 슬라이드 이미지 미리 불러오기
    [n + 1, n + 2].forEach((k) => k <= N && $$('img', slideEl(k)).forEach((im) => { const p = new Image(); p.src = im.src; }));
  }
  function replay() {
    const el = slideEl(cur);
    el.classList.remove('play');
    void el.offsetWidth;
    el.classList.add('play');
  }

  // ---------- 실시간 결과 렌더링 ----------
  const PALETTE = ['#224b99', '#138380', '#0e6ca5', '#6a54b8', '#d9822b', '#3462b4', '#c0392b', '#2b8a3e'];
  const hash = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };

  function renderResults(results) {
    for (const [n, r] of Object.entries(results)) {
      const el = slideEl(Number(n));
      const tot = $(`[data-total="${n}"]`, el);
      if (tot) tot.textContent = r.total;
      if (r.type === 'choice') renderChoice(el, r);
      else if (r.type === 'ox') renderOX(el, r);
      else if (r.type === 'number') renderNumbers(el, r);
      else if (Number(n) === 25) renderTop3(el, r);
      else renderCloud(el, n, r);
    }
  }
  function renderChoice(el, r) {
    const max = Math.max(1, ...r.counts);
    $$('.choice-row', el).forEach((row, i) => {
      const c = r.counts[i];
      $('.choice-fill', row).style.width = (c / max) * 100 + '%';
      const pct = r.total ? Math.round((c / r.total) * 100) : 0;
      $('.choice-num', row).innerHTML = `${c}<small>${pct}%</small>`;
    });
  }
  function renderOX(el, r) {
    const wrap = $('.ox-wrap', el);
    ['O', 'X'].forEach((k) => {
      const b = $(`.ox-card.${k} .ox-badge`, wrap);
      if (b.textContent !== String(r[k])) {
        b.textContent = r[k];
        b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump');
      }
      $(`.ox-card.${k}`, wrap).classList.toggle('answer', r.reveal === k);
    });
    wrap.classList.toggle('revealed', !!r.reveal);
  }
  function renderNumbers(el, r) {
    const area = $('.num-area', el);
    const chips = $$('.num-chip', area);
    const same = chips.length <= r.list.length && chips.every((c, i) => c.textContent === String(r.list[i]));
    if (!same) { area.innerHTML = ''; }
    if (!r.list.length) { area.innerHTML = '<span class="ph">휴대폰으로 괄호 안에 들어갈 숫자를 보내 주세요</span>'; return; }
    $('.ph', area)?.remove();
    for (let i = same ? chips.length : 0; i < r.list.length; i++) {
      const c = document.createElement('div');
      c.className = 'num-chip';
      c.textContent = r.list[i];
      area.appendChild(c);
    }
    area.classList.toggle('dense', r.list.length > 24);
  }
  function renderCloud(el, n, r) {
    const cloud = $('.cloud', el);
    $(`[data-empty="${n}"]`, el).classList.toggle('hidden', r.words.length > 0);
    const words = r.words.slice(0, 60).sort((a, b) => a.first - b.first);
    const max = Math.max(1, ...words.map((w) => w.count));
    const base = words.length < 10 ? 46 : words.length < 25 ? 36 : 28;
    const keep = new Set();
    for (const w of words) {
      const key = w.text.replace(/\s+/g, '').toLowerCase();
      keep.add(key);
      let node = cloud.querySelector(`[data-k="${CSS.escape(key)}"]`);
      if (!node) {
        node = document.createElement('span');
        node.className = 'w';
        node.dataset.k = key;
        node.style.color = PALETTE[hash(key) % PALETTE.length];
        cloud.appendChild(node);
      }
      node.textContent = w.text;
      if (w.count > 1) { const s = document.createElement('sup'); s.textContent = w.count; node.appendChild(s); }
      node.style.fontSize = Math.round(base + ((w.count - 1) / Math.max(1, max - 1)) * base * 1.25) + 'px';
    }
    $$('.w', cloud).forEach((nd) => { if (!keep.has(nd.dataset.k)) nd.remove(); });
  }
  function renderTop3(el, r) {
    $$('.top3', el).forEach((box, i) => {
      const w = r.words[i];
      const prevText = box.dataset.text || '';
      if (!w) { box.innerHTML = '<div class="q">?</div>'; box.dataset.text = ''; return; }
      box.innerHTML = '';
      const t = document.createElement('div'); t.className = 't'; t.textContent = w.text;
      const c = document.createElement('div'); c.className = 'c'; c.textContent = `${w.count}명`;
      box.append(t, c);
      box.classList.toggle('new', prevText !== w.text);
      box.dataset.text = w.text;
    });
    const ol = $('[data-rank="25"]', el);
    ol.innerHTML = '';
    r.words.slice(0, 10).forEach((w, i) => {
      const li = document.createElement('li');
      const a = document.createElement('span'); a.textContent = `${i + 1}. ${w.text}`;
      const b = document.createElement('b'); b.textContent = w.count;
      li.append(a, b); ol.appendChild(li);
    });
  }

  // 질문 스포트라이트 (모든 화면 공통)
  function renderSpot(sp) {
    const root = $('#spot');
    if (!sp) { root.innerHTML = ''; root.dataset.id = ''; return; }
    if (root.dataset.id === sp.id) return;
    root.dataset.id = sp.id;
    root.innerHTML = '<div class="spot"><div class="spot-card"><div class="k">Q. 참여자 질문</div><div class="tx"></div><div class="nm"></div></div></div>';
    $('.tx', root).textContent = sp.text;
    $('.nm', root).textContent = sp.name ? `— ${sp.name}` : '— 익명';
    if (isPresenter) $('.spot', root).addEventListener('click', () => api('spotlight', { id: null }));
  }

  // ---------- 서버 통신 ----------
  async function api(action, body = {}) {
    if (isPresenter) body.token = token;
    try {
      const res = await fetch('/api/' + action, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 && isPresenter) { openPin(); throw new Error('발표자 인증이 만료되었어요. 핀코드를 다시 입력해 주세요.'); }
      if (!res.ok) throw new Error(data.error || '요청 실패');
      return data;
    } catch (e) {
      toast(e.message === 'Failed to fetch' ? '서버에 연결할 수 없어요.' : e.message);
      throw e;
    }
  }

  function connect() {
    if (es) es.close();
    es = new EventSource('/events' + (isPresenter ? '?token=' + encodeURIComponent(token) : ''));
    const conn = $('#conn');
    es.onopen = () => { conn.textContent = '실시간 연결'; conn.classList.remove('off'); };
    es.onerror = () => { conn.textContent = '재연결 중'; conn.classList.add('off'); };
    es.addEventListener('state', (e) => {
      const s = JSON.parse(e.data);
      // 발표자가 응답을 초기화한 경우 내 기록도 비움
      for (const [n, r] of Object.entries(s.results)) if (r.total === 0 && mine[n]) { delete mine[n]; saveMine(); }
      const slideChanged = !last || last.slide !== s.slide;
      last = s;
      if (s.slide !== cur) show(s.slide);
      renderResults(s.results);
      renderSpot(s.spotlight);
      if (isPresenter) {
        $("#ppl").textContent = `참여자 ${s.clients}명 접속`;
      } else if (!slideChanged) {
        refreshPanelCounts();
      }
    });
    es.addEventListener('questions', (e) => {
      const prevOpen = questions.filter((q) => !q.done).length;
      questions = JSON.parse(e.data).questions;
      const open = questions.filter((q) => !q.done).length;
      const b = $('#qBadge');
      b.textContent = open;
      b.classList.toggle('zero', open === 0);
      if (open > prevOpen && prevOpen !== -1) { const q = $('#qBtn'); q.classList.remove('ring'); void q.offsetWidth; q.classList.add('ring'); }
      renderQuestions();
    });
  }

  // ---------- 참여자 입력 패널 ----------
  function refreshPanelCounts() { /* 패널은 내 응답만 표시하므로 별도 갱신 불필요 */ }

  function renderPanel() {
    const panel = $('#panel');
    const cfg = SLIDES[cur - 1].interact;
    panel.className = 'panel';
    panel.style.animation = 'none'; void panel.offsetWidth; panel.style.animation = '';
    if (!cfg) {
      panel.classList.add('idle');
      panel.innerHTML = '발표 화면을 함께 보고 있어요.<br>궁금한 점은 언제든 <b>질문하기</b>로 보내 주세요.';
      return;
    }
    const n = String(cur);
    const head = (sub) => `<h4></h4><p class="sub">${sub}</p>`;
    if (cfg.type === 'choice') {
      panel.innerHTML = head('하나를 선택해 주세요. 다시 눌러 바꿀 수 있어요.') + cfg.options.map((o, i) =>
        `<button class="opt${mine[n] === i + 1 ? ' sel' : ''}" data-v="${i + 1}"><span class="n">${i + 1}</span><span></span></button>`).join('');
      $$('.opt', panel).forEach((b, i) => {
        b.lastElementChild.textContent = cfg.options[i];
        b.onclick = async () => {
          await api('respond', { slide: cur, clientId: cid, value: i + 1 });
          mine[n] = i + 1; saveMine();
          $$('.opt', panel).forEach((x) => x.classList.toggle('sel', x === b));
        };
      });
    } else if (cfg.type === 'ox') {
      panel.innerHTML = head('O 또는 X를 골라 주세요. 바꿀 수 있어요.') +
        `<div class="oxbtns"><button class="O${mine[n] === 'O' ? ' sel' : ''}" data-v="O">O</button><button class="X${mine[n] === 'X' ? ' sel' : ''}" data-v="X">X</button></div>`;
      $$('.oxbtns button', panel).forEach((b) => {
        b.onclick = async () => {
          await api('respond', { slide: cur, clientId: cid, value: b.dataset.v });
          mine[n] = b.dataset.v; saveMine();
          $$('.oxbtns button', panel).forEach((x) => x.classList.toggle('sel', x === b));
          if (navigator.vibrate) navigator.vibrate(30);
        };
      });
    } else if (cfg.type === 'number') {
      panel.innerHTML = head('괄호 안에 들어갈 숫자를 입력해 주세요.') +
        `<form class="row"><input type="number" inputmode="numeric" placeholder="숫자 입력" required><button>보내기</button></form><div class="done-msg"></div>`;
      const msg = $('.done-msg', panel);
      if (mine[n] !== undefined) msg.textContent = `✓ 내 응답: ${mine[n]} (다시 보내면 바뀌어요)`;
      $('form', panel).onsubmit = async (e) => {
        e.preventDefault();
        const inp = $('input', panel);
        if (inp.value === '') return;
        await api('respond', { slide: cur, clientId: cid, value: inp.value });
        mine[n] = Number(inp.value); saveMine();
        msg.textContent = `✓ 내 응답: ${mine[n]} (다시 보내면 바뀌어요)`;
        inp.value = ''; inp.blur();
      };
    } else {
      const list = mine[n] || [];
      panel.innerHTML = head(`짧은 단어로 입력해 주세요. 한 번에 하나씩, 최대 ${cfg.max}개`) +
        `<form class="row"><input type="text" maxlength="20" placeholder="단어 입력" enterkeyhint="send" required><button>보내기</button></form><div class="mine"></div><div class="hint"></div>`;
      const renderMine = () => {
        const box = $('.mine', panel); box.innerHTML = '';
        (mine[n] || []).forEach((w) => { const s = document.createElement('span'); s.textContent = w; box.appendChild(s); });
        const left = cfg.max - (mine[n] || []).length;
        $('.hint', panel).textContent = left > 0 ? `${left}개 더 보낼 수 있어요.` : '모두 보냈어요. 발표 화면을 확인해 보세요!';
        $('input', panel).disabled = $('form button', panel).disabled = left <= 0;
      };
      renderMine();
      $('form', panel).onsubmit = async (e) => {
        e.preventDefault();
        const inp = $('input', panel);
        const v = inp.value.trim();
        if (!v) return;
        await api('respond', { slide: cur, clientId: cid, value: v });
        mine[n] = (mine[n] || []).concat(v); saveMine();
        inp.value = '';
        renderMine();
        if (!$('input', panel).disabled) inp.focus();
      };
      void list;
    }
    $('h4', panel).textContent = cfg.title;
  }

  // ---------- 질문하기 (참여자) ----------
  function openAsk() {
    const root = $('#modalRoot');
    root.innerHTML = `<div class="sheet"><div class="sheet-in">
      <h4>발표자에게 질문하기</h4><p>질문은 발표자에게만 전달돼요.</p>
      <textarea maxlength="300" placeholder="궁금한 점을 적어 주세요"></textarea>
      <input type="text" maxlength="20" placeholder="이름 (선택, 비우면 익명)">
      <div class="acts"><button class="btn sec" data-x>취소</button><button class="btn" data-send>보내기</button></div>
    </div></div>`;
    const sh = $('.sheet', root);
    const close = () => { root.innerHTML = ''; };
    sh.addEventListener('click', (e) => { if (e.target === sh || e.target.hasAttribute('data-x')) close(); });
    const nameInp = $('input', sh);
    nameInp.value = store.get('qname') || '';
    $('textarea', sh).focus();
    $('[data-send]', sh).onclick = async (e) => {
      const text = $('textarea', sh).value.trim();
      if (!text) { $('textarea', sh).focus(); return; }
      e.target.disabled = true;
      try {
        await api('question', { text, name: nameInp.value.trim() });
        store.set('qname', nameInp.value.trim());
        close();
        toast('질문이 전달되었어요 🙌');
      } catch (_) { e.target.disabled = false; }
    };
  }

  // ---------- 핀코드 ----------
  function openPin(onCancel) {
    const root = $('#modalRoot');
    root.innerHTML = `<div class="modal"><div class="pin-box">
      <h3>발표자 모드</h3><p>핀코드 4자리를 입력하세요</p>
      <div class="pin-dots"><i></i><i></i><i></i><i></i></div>
      <div class="pin-pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => `<button data-d="${d}">${d}</button>`).join('')}
        <button class="ghost" data-c>취소</button><button data-d="0">0</button><button class="ghost" data-b>지우기</button></div>
    </div></div>`;
    let code = '';
    const dots = $$('.pin-dots i', root);
    const paint = () => dots.forEach((d, i) => d.classList.toggle('on', i < code.length));
    const close = () => { root.innerHTML = ''; document.removeEventListener('keydown', onKey, true); };
    const press = async (d) => {
      if (code.length >= 4) return;
      code += d; paint();
      if (code.length === 4) {
        try {
          const res = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin: code }) });
          if (!res.ok) throw 0;
          const { token: t } = await res.json();
          token = t; store.set('presenterToken', t);
          close();
          if (location.pathname !== '/presenter') history.replaceState(null, '', '/presenter');
          enterPresenter();
        } catch (_) {
          const box = $('.pin-dots', root);
          box.classList.add('err');
          setTimeout(() => { box.classList.remove('err'); code = ''; paint(); }, 450);
        }
      }
    };
    const onKey = (e) => {
      if (/^\d$/.test(e.key)) { press(e.key); e.stopPropagation(); }
      else if (e.key === 'Backspace') { code = code.slice(0, -1); paint(); }
      else if (e.key === 'Escape') { close(); onCancel && onCancel(); }
    };
    document.addEventListener('keydown', onKey, true);
    $$('[data-d]', root).forEach((b) => (b.onclick = () => press(b.dataset.d)));
    $('[data-b]', root).onclick = () => { code = code.slice(0, -1); paint(); };
    $('[data-c]', root).onclick = () => { close(); onCancel && onCancel(); };
  }

  // ---------- 발표자 모드 ----------
  function go(n) {
    if (n < 1 || n > N || n === cur) return;
    show(n);
    api('slide', { slide: n }).catch(() => {});
  }

  function enterPresenter() {
    isPresenter = true;
    document.body.className = 'presenter';
    $('#aud').classList.add('hidden');
    $('#pres').classList.remove('hidden');
    document.body.appendChild(stage);
    fit();
    connect();
    wake();
    // 무료 호스팅이 잠들지 않도록 발표자 화면이 열려 있는 동안 4분마다 신호
    if (!window.__keepAlive) window.__keepAlive = setInterval(() => fetch('/api/info', { cache: 'no-store' }).catch(() => {}), 4 * 60 * 1000);
    // 모든 이미지 미리 불러오기
    $$('img', deck).forEach((im) => { const p = new Image(); p.src = im.src; });
  }

  function enterAudience() {
    isPresenter = false;
    document.body.className = 'audience';
    $('#pres').classList.add('hidden');
    $('#aud').classList.remove('hidden');
    $('#audStageSlot').appendChild(stage);
    fit();
    connect();
    if (cur) renderPanel();
  }

  function renderQuestions() {
    const list = $('#qlist');
    const items = questions.filter((q) => qFilter === 'all' || !q.done).slice().reverse();
    list.innerHTML = '';
    if (!items.length) {
      list.innerHTML = `<div class="qempty">${qFilter === 'all' ? '아직 받은 질문이 없어요.' : '답변할 질문이 없어요.'}<br>참여자는 QR 접속 후 <b>질문하기</b> 버튼으로 보낼 수 있어요.</div>`;
      return;
    }
    const spotId = last && last.spotlight && last.spotlight.id;
    for (const q of items) {
      const d = document.createElement('div');
      d.className = 'qitem' + (q.done ? ' done' : '') + (q.id === spotId ? ' spot-on' : '');
      const t = new Date(q.ts);
      d.innerHTML = `<div class="qt"></div><div class="qm"></div><div class="qa">
        <button class="pri" data-a="spot">${q.id === spotId ? '화면에서 내리기' : '화면에 띄우기'}</button>
        <button data-a="done">${q.done ? '미답변으로' : '답변 완료 ✓'}</button>
        <button data-a="del">삭제</button></div>`;
      $('.qt', d).textContent = q.text;
      $('.qm', d).textContent = `${q.name || '익명'} · ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
      $('[data-a="spot"]', d).onclick = () => api('spotlight', { id: q.id === spotId ? null : q.id });
      $('[data-a="done"]', d).onclick = () => api('qdone', { id: q.id });
      $('[data-a="del"]', d).onclick = () => { if (confirm('이 질문을 삭제할까요?')) api('qdelete', { id: q.id }); };
      list.appendChild(d);
    }
  }

  function openQrBig() {
    fetch('/api/info').then((r) => r.json()).then((info) => {
      const root = $('#modalRoot');
      root.innerHTML = `<div class="modal"><div class="qr-big"><img src="/qr.svg" alt="QR"><div class="u"></div><div class="s">휴대폰 카메라로 스캔해 참여하고 질문해 주세요</div></div></div>`;
      $('.u', root).textContent = info.joinUrl;
      $('.modal', root).onclick = () => { root.innerHTML = ''; };
    });
  }

  function toggleFs() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.(); else document.exitFullscreen?.();
  }

  // 발표자 이벤트 연결
  $('#prevBtn').onclick = () => go(cur - 1);
  $('#nextBtn').onclick = () => go(cur + 1);
  $('#replayBtn').onclick = replay;
  $('#fsBtn').onclick = toggleFs;
  $('#qrBigBtn').onclick = openQrBig;
  $('#qrCard').onclick = openQrBig;
  $('#resetBtn').onclick = () => { if (confirm(`${cur}페이지의 응답을 모두 지울까요?`)) api('reset', { slide: cur }); };
  $('#exitBtn').onclick = () => { store.del('presenterToken'); token = null; history.replaceState(null, '', '/'); enterAudience(); };
  $('#qBtn').onclick = () => $('#drawer').classList.toggle('open');
  $('#drawerClose').onclick = () => $('#drawer').classList.remove('open');
  $$('.filters button').forEach((b) => (b.onclick = () => {
    qFilter = b.dataset.f;
    $$('.filters button').forEach((x) => x.classList.toggle('on', x === b));
    renderQuestions();
  }));
  // OX 정답 공개 (발표자가 O/X 카드를 클릭)
  $$('.ox-wrap').forEach((w) => $$('.ox-card', w).forEach((c) => (c.onclick = () => {
    if (!isPresenter) return;
    const n = Number(w.dataset.ox);
    const curReveal = last && last.results[n] && last.results[n].reveal;
    api('reveal', { slide: n, value: curReveal === c.dataset.v ? null : c.dataset.v });
  })));

  // 키보드 (리모컨 포함)
  let jump = '';
  document.addEventListener('keydown', (e) => {
    if (!isPresenter || e.target.closest('input, textarea') || $('#modalRoot').innerHTML && e.key !== 'Escape') return;
    const k = e.key;
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(k)) {
      if (k === 'Enter' && jump) { go(Number(jump)); jump = ''; } else go(cur + 1);
      e.preventDefault();
    } else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(k)) { go(cur - 1); e.preventDefault(); }
    else if (k === 'Home') go(1);
    else if (k === 'End') go(N);
    else if (k === 'f' || k === 'F') toggleFs();
    else if (k === 'r' || k === 'R') replay();
    else if (k === 'q' || k === 'Q') $('#qrCard').classList.toggle('mini');
    else if (k === 'm' || k === 'M') $('#drawer').classList.toggle('open');
    else if (k === 'Escape') { $('#modalRoot').innerHTML = ''; $('#drawer').classList.remove('open'); }
    else if (/^\d$/.test(k)) { jump = (jump + k).slice(-2); setTimeout(() => { jump = ''; }, 1500); }
  });

  // 툴바 / 커서 자동 숨김
  let idleT;
  const wake = () => {
    $('#toolbar').classList.remove('idle');
    document.body.style.cursor = '';
    clearTimeout(idleT);
    idleT = setTimeout(() => {
      if (!isPresenter) return;
      $('#toolbar').classList.add('idle');
      document.body.style.cursor = 'none';
    }, 2600);
  };
  document.addEventListener('mousemove', wake);
  // 터치 스와이프 (태블릿 발표용)
  let tx = null;
  stage.addEventListener('touchstart', (e) => { tx = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    if (!isPresenter || tx === null) return;
    const dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 60) go(cur + (dx < 0 ? 1 : -1));
    tx = null;
  });

  // 참여자 이벤트
  $('#askBtn').onclick = openAsk;
  $('#lockBtn').onclick = () => openPin();

  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2400);
  }

  // ---------- 시작 ----------
  (async function init() {
    if (location.pathname === '/presenter') {
      if (token) {
        const ok = await fetch('/api/check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) })
          .then((r) => r.json()).then((d) => d.ok).catch(() => false);
        if (ok) { enterPresenter(); return; }
        store.del('presenterToken');
      }
      enterAudience();
      openPin(() => history.replaceState(null, '', '/'));
    } else {
      enterAudience();
    }
  })();
})();
