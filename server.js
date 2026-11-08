// 실시간 인터랙티브 발표 서버 (Node 내장 http + Server-Sent Events)
// 실행: node server.js   (환경변수 PORT, PUBLIC_URL, PIN 선택)
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const QRCode = require('qrcode');

const PORT = Number(process.env.PORT) || 8080;
const PIN = process.env.PIN || '0821';
const PUBLIC_DIR = path.join(__dirname, 'public');
const STATE_FILE = path.join(__dirname, 'state.json');
const TOTAL_SLIDES = 40;

// 인터랙션이 있는 슬라이드 (1부터 시작하는 페이지 번호)
const INTERACTIONS = {
  3: { type: 'choice', options: 4 },
  4: { type: 'words', max: 5 },
  5: { type: 'words', max: 5 },
  22: { type: 'ox' },
  25: { type: 'words', max: 3 },
  27: { type: 'ox' },
  31: { type: 'ox' },
  32: { type: 'number' },
};

// ---------- 상태 ----------
let state = {
  slide: 1,
  responses: {},   // { [slide]: { [clientId]: value | value[] } }
  questions: [],   // { id, text, name, ts, done }
  spotlight: null, // 화면에 띄운 질문 id
  reveal: {},      // { [slide]: 'O' | 'X' }  OX 정답 공개
  tokens: [],      // 발표자 인증 토큰 (서버 재시작 후에도 유지)
};
try {
  const saved = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  state = Object.assign(state, saved);
} catch (_) { /* 처음 실행 */ }

let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    fs.writeFile(STATE_FILE, JSON.stringify(state), () => {});
  }, 300);
}

const tokens = new Set(state.tokens || []);

// ---------- 집계 ----------
const norm = (s) => s.replace(/\s+/g, '').toLowerCase();

function aggregate(slide) {
  const cfg = INTERACTIONS[slide];
  const r = state.responses[slide] || {};
  const people = Object.keys(r).length;
  if (cfg.type === 'choice') {
    const counts = Array(cfg.options).fill(0);
    for (const v of Object.values(r)) if (counts[v - 1] !== undefined) counts[v - 1]++;
    return { type: 'choice', counts, total: people };
  }
  if (cfg.type === 'ox') {
    const c = { O: 0, X: 0 };
    for (const v of Object.values(r)) if (v in c) c[v]++;
    return { type: 'ox', O: c.O, X: c.X, total: people, reveal: state.reveal[slide] || null };
  }
  if (cfg.type === 'number') {
    // 응답 하나하나를 제출 순서대로
    const list = Object.values(r).sort((a, b) => a.ts - b.ts).map((v) => v.n);
    return { type: 'number', list, total: people };
  }
  // words
  const groups = new Map();
  for (const arr of Object.values(r)) {
    for (const w of arr) {
      const k = norm(w.t);
      if (!k) continue;
      const g = groups.get(k) || { text: w.t, count: 0, first: w.ts, forms: {} };
      g.count++;
      g.forms[w.t] = (g.forms[w.t] || 0) + 1;
      g.first = Math.min(g.first, w.ts);
      groups.set(k, g);
    }
  }
  const words = [...groups.values()].map((g) => {
    const text = Object.entries(g.forms).sort((a, b) => b[1] - a[1])[0][0];
    return { text, count: g.count, first: g.first };
  });
  words.sort((a, b) => b.count - a.count || a.first - b.first);
  return { type: 'words', words: words.slice(0, 80), total: people };
}

function publicState() {
  const results = {};
  for (const s of Object.keys(INTERACTIONS)) results[s] = aggregate(Number(s));
  const spot = state.questions.find((q) => q.id === state.spotlight);
  return {
    slide: state.slide,
    results,
    questionCount: state.questions.length,
    openQuestions: state.questions.filter((q) => !q.done).length,
    spotlight: spot ? { id: spot.id, text: spot.text, name: spot.name } : null,
    clients: [...clients.values()].filter((c) => !c.presenter).length,
  };
}

// ---------- SSE ----------
const clients = new Map(); // res -> { presenter: bool }
let broadcastTimer = null;
function broadcast() {
  if (broadcastTimer) return;
  broadcastTimer = setTimeout(() => {
    broadcastTimer = null;
    const pub = JSON.stringify(publicState());
    const pres = JSON.stringify({ questions: state.questions });
    for (const [res, info] of clients) {
      res.write(`event: state\ndata: ${pub}\n\n`);
      if (info.presenter) res.write(`event: questions\ndata: ${pres}\n\n`);
    }
  }, 60);
}
setInterval(() => { for (const res of clients.keys()) res.write(': ping\n\n'); }, 20000);

// ---------- 유틸 ----------
function lanAddress() {
  for (const list of Object.values(os.networkInterfaces())) {
    for (const a of list || []) {
      if (a.family === 'IPv4' && !a.internal && !a.address.startsWith('169.254')) return a.address;
    }
  }
  return 'localhost';
}
function joinUrl(req) {
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL.replace(/\/?$/, '/');
  const host = req && req.headers.host;
  if (host && !/^(localhost|127\.0\.0\.1)/.test(host)) {
    const proto = req.headers['x-forwarded-proto'] || 'http';
    return `${proto}://${host}/`;
  }
  return `http://${lanAddress()}:${PORT}/`;
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > 10000) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); } });
  });
}
function json(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json',
};
function serveStatic(req, res, pathname) {
  if (pathname === '/' || pathname === '/presenter') pathname = '/index.html';
  const file = path.normalize(path.join(PUBLIC_DIR, decodeURIComponent(pathname)));
  if (!file.startsWith(PUBLIC_DIR)) return json(res, 403, { error: 'forbidden' });
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return json(res, 404, { error: 'not found' });
    const ext = path.extname(file);
    const longCache = ['.webp', '.woff2', '.png'].includes(ext);
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': longCache ? 'public, max-age=86400' : 'no-cache',
    });
    fs.createReadStream(file).pipe(res);
  });
}
const isPresenter = (body) => body && tokens.has(body.token);
const cleanText = (s, max) => String(s || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);

// ---------- 라우팅 ----------
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;

  if (req.method === 'GET' && p === '/events') {
    const presenter = tokens.has(url.searchParams.get('token'));
    res.writeHead(200, {
      'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache',
      Connection: 'keep-alive', 'X-Accel-Buffering': 'no',
    });
    res.write('retry: 2000\n\n');
    clients.set(res, { presenter });
    res.write(`event: state\ndata: ${JSON.stringify(publicState())}\n\n`);
    if (presenter) res.write(`event: questions\ndata: ${JSON.stringify({ questions: state.questions })}\n\n`);
    broadcast();
    req.on('close', () => { clients.delete(res); broadcast(); });
    return;
  }

  if (req.method === 'GET' && p === '/api/info') {
    return json(res, 200, { joinUrl: joinUrl(req), total: TOTAL_SLIDES });
  }

  if (req.method === 'GET' && p === '/qr.svg') {
    const svg = await QRCode.toString(joinUrl(req), { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#1b2f5e', light: '#ffffff' } });
    res.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-cache' });
    return res.end(svg);
  }

  if (req.method === 'POST' && p.startsWith('/api/')) {
    const body = await readBody(req);
    const action = p.slice(5);

    if (action === 'login') {
      if (String(body.pin) !== PIN) return json(res, 401, { error: '핀코드가 올바르지 않습니다.' });
      const token = crypto.randomBytes(16).toString('hex');
      tokens.add(token);
      state.tokens = [...tokens].slice(-20);
      save();
      return json(res, 200, { token });
    }
    if (action === 'check') return json(res, 200, { ok: isPresenter(body) });

    // ----- 참여자 -----
    if (action === 'respond') {
      const slide = Number(body.slide);
      const cfg = INTERACTIONS[slide];
      const cid = cleanText(body.clientId, 64);
      if (!cfg || !cid) return json(res, 400, { error: 'bad request' });
      if (slide !== state.slide) return json(res, 409, { error: '지금은 응답할 수 없는 화면이에요.' });
      const bucket = (state.responses[slide] = state.responses[slide] || {});
      const v = body.value;
      if (cfg.type === 'choice') {
        const n = Number(v);
        if (!(n >= 1 && n <= cfg.options)) return json(res, 400, { error: 'bad value' });
        bucket[cid] = n;
      } else if (cfg.type === 'ox') {
        if (v !== 'O' && v !== 'X') return json(res, 400, { error: 'bad value' });
        bucket[cid] = v;
      } else if (cfg.type === 'number') {
        const n = Number(String(v).trim());
        if (!Number.isFinite(n) || String(v).trim() === '' || Math.abs(n) > 9999) return json(res, 400, { error: '숫자를 입력해 주세요.' });
        bucket[cid] = { n: Math.round(n * 100) / 100, ts: (bucket[cid] && bucket[cid].ts) || Date.now() };
      } else {
        const t = cleanText(v, 20);
        if (!t) return json(res, 400, { error: '단어를 입력해 주세요.' });
        const arr = (bucket[cid] = bucket[cid] || []);
        if (arr.length >= cfg.max) return json(res, 429, { error: `최대 ${cfg.max}개까지 보낼 수 있어요.` });
        if (arr.some((w) => norm(w.t) === norm(t))) return json(res, 409, { error: '이미 보낸 단어예요.' });
        arr.push({ t, ts: Date.now() });
      }
      save(); broadcast();
      return json(res, 200, { ok: true });
    }
    if (action === 'question') {
      const text = cleanText(body.text, 300);
      if (!text) return json(res, 400, { error: '질문을 입력해 주세요.' });
      state.questions.push({
        id: crypto.randomBytes(6).toString('hex'), text,
        name: cleanText(body.name, 20), ts: Date.now(), done: false,
      });
      save(); broadcast();
      return json(res, 200, { ok: true });
    }

    // ----- 발표자 전용 -----
    if (!isPresenter(body)) return json(res, 401, { error: '발표자 인증이 필요합니다.' });
    if (action === 'slide') {
      const n = Number(body.slide);
      if (n >= 1 && n <= TOTAL_SLIDES) state.slide = n;
    } else if (action === 'reset') {
      delete state.responses[Number(body.slide)];
      delete state.reveal[Number(body.slide)];
    } else if (action === 'reveal') {
      const s = Number(body.slide);
      if (body.value === 'O' || body.value === 'X') state.reveal[s] = body.value; else delete state.reveal[s];
    } else if (action === 'qdone') {
      const q = state.questions.find((x) => x.id === body.id);
      if (q) q.done = !q.done;
    } else if (action === 'qdelete') {
      state.questions = state.questions.filter((x) => x.id !== body.id);
      if (state.spotlight === body.id) state.spotlight = null;
    } else if (action === 'spotlight') {
      state.spotlight = body.id || null;
    } else {
      return json(res, 404, { error: 'unknown action' });
    }
    save(); broadcast();
    return json(res, 200, { ok: true });
  }

  if (req.method === 'GET') return serveStatic(req, res, p);
  json(res, 405, { error: 'method not allowed' });
});

server.listen(PORT, '0.0.0.0', () => {
  const url = process.env.PUBLIC_URL || `http://${lanAddress()}:${PORT}/`;
  console.log('\n  ▶ 인터랙티브 발표 서버가 시작되었습니다.');
  console.log(`  · 참여자 접속 주소 (QR): ${url}`);
  console.log(`  · 발표자 화면:          ${url.replace(/\/$/, '')}/presenter  (핀코드 ${PIN})\n`);
});
