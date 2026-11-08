// 40장 슬라이드 정의 (1440×810 캔버스 기준 좌표)
// 애니메이션: class="a up|left|right|zoom|pop|fade|wipe|wipe-d|kb", style="--d:지연(s)"
(function () {
  const SEC = {
    1: '01 성취평가와 추정분할에 대한 이해',
    1.5: '01 성취평가와 추정분할에 대한 오해',
    2: '02 성취평가와 대입의 변화',
    3: '03 분할점수의 개념과 고정/추정분할점수',
    4: '04 추정분할점수 산출의 실제',
    5: '05 우리 학교에서 추정분할점수를 도입한다면?',
  };
  const H = (k) => `<div class="hdr">${SEC[k]}</div><div class="bar"></div>`;
  const T = (text, top = 196, d = 0.1) => `<h2 class="ttl a left" style="top:${top}px;--d:${d}s">${text}</h2>`;
  const IMG = (name, x, y, w, h, anim = 'up', d = 0.4, extra = '') =>
    `<img class="shot a ${anim}" src="/img/${name}.webp" alt="" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;--d:${d}s;${extra}">`;
  const FULL = (name, anim = 'kb') => `<img class="full a ${anim}" src="/img/${name}.webp" alt="" style="--d:0s">`;
  const RING = (x, y, w, h, d = 1.3, r = 18) =>
    `<div class="pulse" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;--d:${d}s;border-radius:${r}px"></div>`;
  const LOGO = (x = 95, y = 95) => `<img class="quiz-logo a down" src="/img/quiz.webp" alt="QUIZ" style="left:${x}px;top:${y}px;--d:0s">`;
  const TOTAL = (n) => `<div class="resp-total a fade" style="--d:.6s"><span data-total="${n}">0</span>명 참여</div>`;
  const STMT = (l1, l2, top = 305) =>
    `<p class="big abs a up" style="left:0;right:0;top:${top}px;font-size:54px;line-height:88px;--d:.35s">${l1}<br>${l2}</p>`;
  const OX = (n) => `
    <div class="ox-wrap a up" style="--d:.8s" data-ox="${n}">
      <button class="ox-card O" data-v="O"><img src="/img/o.webp" alt="O"><span class="ox-badge">0</span></button>
      <button class="ox-card X" data-v="X"><img src="/img/x.webp" alt="X"><span class="ox-badge">0</span></button>
    </div>${TOTAL(n)}`;
  const BUL = (top, l1, l2, d) =>
    `<p class="bul a left" style="top:${top}px;--d:${d}s">- ${l1}<span class="ind">${l2}</span></p>`;

  const slides = [];
  const add = (html, extra = {}) => slides.push(Object.assign({ html }, extra));

  // 1. 표지
  add(`
    <svg class="abs" width="1440" height="810" viewBox="0 0 1440 810" style="left:0;top:0">
      <line x1="1193" y1="0" x2="1193" y2="810" stroke="#ececec" stroke-width="2"/>
      <line x1="0" y1="563" x2="1440" y2="563" stroke="#ececec" stroke-width="2"/>
      <path d="M1193,810 A247,247 0 0 1 1440,563" fill="none" stroke="#e4e4e4" stroke-width="2"/>
      <path class="draw" style="--len:700;--d:.2s" d="M1219,-10 V330 A205,205 0 0 0 1424,535 H1460" fill="none" stroke="#eeeeee" stroke-width="52"/>
      <path class="draw" style="--len:1360;--d:.1s;--t:1.6s" d="M-10,588 H967 A200,200 0 0 1 1167,788 V830" fill="none" stroke="#224b99" stroke-width="50"/>
    </svg>
    <p class="abs a up" style="left:58px;top:282px;margin:0;font-size:38px;font-weight:600;--d:.5s">포천일고등학교 교원역량강화 연수</p>
    <h1 class="abs a up" style="left:50px;top:342px;margin:0;font-size:92px;font-weight:800;letter-spacing:-0.035em;--d:.75s">
      <span style="color:var(--navy)">성취평가와</span> <span style="color:var(--teal)">추정분할의</span> 이해</h1>
    <p class="abs a fade" style="left:92px;top:676px;margin:0;font-size:31px;font-weight:500;--d:1.4s">청학고등학교 교육연구부장 최주혁</p>`);

  // 2. 목차
  const toc = ['성취평가와 추정분할', '성취평가와 대입의 변화', '분할점수의 개념과 고정/추정분할점수', '추정분할점수 산출의 실제', '우리 학교에서 추정분할점수를 도입한다면?'];
  add(`
    <svg class="abs" width="1440" height="810" viewBox="0 0 1440 810" style="left:0;top:0">
      <line x1="420" y1="0" x2="420" y2="810" stroke="#ececec" stroke-width="2"/>
      <path d="M420,822 A200,200 0 0 1 620,622 H1440" fill="none" stroke="#e4e4e4" stroke-width="2"/>
      <path class="draw" style="--len:950;--d:.1s" d="M395,-10 V397 A200,200 0 0 1 195,597 H-10" fill="none" stroke="#224b99" stroke-width="50"/>
    </svg>
    <h2 class="abs a zoom" style="left:90px;top:88px;margin:0;font-size:88px;font-weight:800;color:var(--navy);--d:.4s">목차</h2>
    ${toc.map((t, i) => `<div class="toc-row a right" style="top:${90 + i * 87}px;--d:${0.5 + i * 0.14}s"><b>0${i + 1}</b>${t}</div>`).join('')}`);

  // 3. 선택형 (1~4)
  const choices = ['잘 모르겠다.', '들어는 보았으나, 깊이 알지 못한다.', '어느정도 알고 있다.', '잘 알고 있다.'];
  add(`${H(1)}
    <p class="big abs a up" style="left:0;right:0;top:215px;font-size:52px;color:#000;--d:.2s">나는 성취평가제를 잘 이해하고 있다.</p>
    <div class="choice-list" data-choice="3">
      ${choices.map((c, i) => `<div class="choice-row a left" style="--d:${0.5 + i * 0.12}s"><span>${i + 1}. ${c}</span><div class="choice-track"><div class="choice-fill"></div></div><div class="choice-num">0</div></div>`).join('')}
    </div>${TOTAL(3)}`,
  { interact: { type: 'choice', title: '나는 성취평가제를 잘 이해하고 있다.', options: choices } });

  // 4, 5. 단어 공유
  const wordSlide = (q, n) => `${H(1)}
    <p class="big abs a up" style="left:0;right:0;top:200px;font-size:54px;color:#000;--d:.2s">${q}</p>
    <div class="cloud" data-cloud="${n}"></div>
    <div class="cloud-empty a fade" style="--d:.8s" data-empty="${n}">휴대폰으로 떠오르는 단어를 보내 주세요<span class="dots"><span>.</span><span>.</span><span>.</span></span></div>
    ${TOTAL(n)}`;
  add(wordSlide("'성취평가제'에서 중요한 것은?", 4), { interact: { type: 'words', title: "'성취평가제'에서 중요한 것은?", max: 5 } });
  add(wordSlide("'추정분할점수' 하면 떠오르는 것은?", 5), { interact: { type: 'words', title: "'추정분할점수' 하면 떠오르는 것은?", max: 5 } });

  // 6. 오해 - 말풍선
  add(`${H(1.5)}
    <div class="bubble l a left" style="left:127px;top:212px;width:808px;height:146px;background:#224b99;font-size:44px;--d:.3s">어차피 등급만 잘 가르면 되는거 아닌가?</div>
    <div class="bubble r a right" style="left:540px;top:395px;width:807px;height:147px;background:#0e6ca5;font-size:38px;--d:1.1s">우리 학교 애들은 공부를 못하니까, 1등급이어도<br>B가 나오는 것은 자연스러운거 아냐?</div>
    <div class="bubble l a left" style="left:140px;top:592px;width:808px;height:146px;background:#8fa1c4;font-size:36px;padding:0 30px;--d:1.9s">굳이 왜 못하는 애를 잘 하는 것처럼 포장해줘야하지?</div>`);

  // 7. 성취평가제란?
  add(`${H(1)}${T('성취평가제란?')}
    ${BUL(326, '국가 교육과정에 근거하여 개발된 교과(목)별 <span class="hl">성취기준에</span>', '<span class="hl">도달한 정도</span>를 판별하여 학생의 성취수준을 평가하는 제도', 0.4)}
    ${BUL(536, '누가 더 잘했는지를 평가하는 것이 아니라', '<span class="hl mark" style="--d:1.6s">학생이 무엇을 어느 정도 성취하였는지</span> 평가', 0.9)}`);

  // 8
  add(`${H(1)}${T('성취평가제에서 학생에게 부여되는 2가지 평가결과')}${IMG('p08', 67, 305, 1154, 461, 'wipe', 0.4)}`);
  // 9
  add(`${H(1)}${T('성취평가제에서 A~E 단계 학습자는?', 162)}${IMG('p09', 67, 257, 1210, 530, 'wipe-d', 0.4)}${RING(72, 316, 1200, 96, 1.6, 10)}`);
  // 10
  add(`${H(1)}${IMG('p10', 243, 155, 954, 537, 'zoom', 0.2)}
    <p class="big abs a up" style="left:0;right:0;top:705px;font-size:52px;color:#000;--d:1s">이런 학생, 한 반에 몇 명 정도 되나요?</p>`);
  // 11
  add(`${H(2)}
    <p class="abs" style="left:87px;top:375px;margin:0;font-size:58px;font-weight:800;white-space:nowrap">
      <span class="a up" style="display:inline-block;--d:.2s">대입 성적 반영의 변화:</span>
      <span class="a left" style="display:inline-block;color:var(--blue);--d:.8s">등급위주 →</span>
      <span class="a pop" style="display:inline-block;color:var(--navy);font-size:70px;text-decoration:underline;text-underline-offset:10px;text-decoration-thickness:5px;--d:1.4s">등급+성취도</span></p>`);
  // 12-14 대학별
  add(`${FULL('p12')}${RING(326, 264, 200, 145, 1.2, 50)}`);
  add(`${FULL('p13')}${RING(315, 357, 248, 179, 1.2, 50)}`);
  add(`${FULL('p14')}${RING(912, 333, 162, 196, 1.2, 14)}`);

  // 15 성취도별 분포비율 (막대그래프 재구성)
  const vals = [28.2, 26.3, 24.4, 14.9, 6.1];
  add(`${H(2)}${T('성취도별 분포비율은 정보공시에서 확인이 가능합니다.', 180)}
    <p class="abs a fade" style="left:600px;top:262px;margin:0;font-size:23px;font-weight:700;--d:.4s">(학교알리미)</p>
    <div class="chart a fade" style="--d:.3s">
      <div class="tabs"><span class="on">✓ 1학기</span><span>2학기</span></div>
      <div class="ctitle">공통국어1 (3) 성취도별분포비율</div>
      <div class="plot" style="left:60px;right:20px;top:146px;bottom:29px">
        ${[4, 8, 12, 16, 20, 24, 28].map((g) => `<div class="grid" style="bottom:${(g / 30) * 100}%"><span>${g}</span></div>`).join('')}
        ${vals.map((v, i) => `<div class="col"><div class="val" style="--d2:${0.9 + i * 0.15}s">${v}</div><div class="barv" style="height:${(v / 30) * 100}%;--d:${0.5 + i * 0.15}s"></div><div class="lab">${'ABCDE'[i]}</div></div>`).join('')}
      </div>
    </div>`);
  // 16
  add(`${H(2)}${T('성취도별 분포비율은 정보공시에서 확인이 가능합니다.', 180)}
    <p class="abs a fade" style="left:600px;top:262px;margin:0;font-size:23px;font-weight:700;--d:.4s">(학교알리미)</p>
    ${IMG('p16', 70, 300, 577, 510, 'wipe-d', 0.5)}`);
  // 17
  add(`${H(2)}${T('자세히 들여다볼까요?', 183)}${IMG('p17', 70, 307, 1294, 330, 'zoom', 0.4)}${RING(1058, 486, 150, 128, 1.4, 14)}`);
  // 18
  add(`${H(2)}<p class="big abs a zoom" style="left:0;right:0;top:380px;font-size:60px;--d:.3s">성취도가 이렇게 중요해졌습니다.</p>`);
  // 19 분할점수란?
  add(`${H(3)}${T('분할점수란?')}
    ${BUL(326, '과목의 특성과 평가 문항 유형 및 난이도를 고려하여', '<span class="hl">성취수준을 구분</span>하기 위한 기준 점수', 0.4)}
    ${BUL(536, 'A와 B를 가르는 분할점수는 90점이므로,', '<span class="hl mark" style="--d:1.6s">90점은 A, 89점은 B</span>가 됩니다.', 0.9)}`);
  // 20
  add(`${H(3)}${T('고정분할점수 vs. 추정분할점수')}${IMG('p20a', 45, 297, 667, 444, 'left', 0.4)}${IMG('p20b', 712, 297, 665, 444, 'right', 1.0)}`);
  // 21
  add(`${H(2)}${IMG('p21', 229, 180, 1018, 572, 'zoom', 0.3)}
    <p class="abs a left" style="left:50px;top:152px;margin:0;font-size:48px;font-weight:800;--d:.1s">고정분할시</p>`);

  // 22 OX
  add(`${LOGO()}${STMT('수행평가는 고정분할로,', '정기시험은 추정분할로 할 수 있다.')}${OX(22)}`,
    { interact: { type: 'ox', title: '수행평가는 고정분할로, 정기시험은 추정분할로 할 수 있다.' } });
  // 23
  const circ = (n) => `<span style="display:inline-flex;width:50px;height:50px;border:3px solid #000;border-radius:50%;align-items:center;justify-content:center;font-size:36px;margin-right:10px;vertical-align:-6px">${n}</span>`;
  add(`${H(3)}${T('추정분할점수의 산출')}
    ${['수행평가 추정분할점수', '1차 정기시험 추정분할점수 X 반영비율', '2차 정기시험 추정분할점수 X 반영비율'].map((t, i) =>
      `<p class="abs a left" style="left:67px;top:${326 + i * 70}px;margin:0;font-size:40px;font-weight:700;--d:${0.4 + i * 0.25}s">${circ(i + 1)}${t}</p>`).join('')}
    <p class="abs a up" style="left:78px;top:612px;margin:0;font-size:48px;font-weight:800;--d:1.4s">${circ(1)}+${circ(2)}+${circ(3)}의 값이 <span class="hl mark" style="text-decoration:underline;text-underline-offset:8px;--d:2s">학기말 최종 성취도 분할 점수</span>가 됩니다.</p>`);
  // 24
  add(`${FULL('p24', 'wipe')}${RING(1063, 221, 324, 548, 1.6, 22)}`);
  // 25 TOP3
  add(`${LOGO(53, 68)}${IMG('p25', 270, 179, 825, 584, 'zoom', 0.2)}
    ${[[330, 499, 200, 181], [582, 495, 200, 190], [834, 488, 216, 197]].map(([x, y, w, h], i) =>
      `<div class="top3 a fade" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;--d:${0.8 + i * 0.15}s" data-top="${i}"><div class="q">?</div></div>`).join('')}
    <div class="rank a right" style="--d:.9s"><h4>전체 응답</h4><ol data-rank="25"></ol></div>${TOTAL(25)}`,
  { interact: { type: 'words', title: '분할점수 산출의 3가지 요소는?', max: 3 } });
  // 26
  add(`${H(3)}${T('정기시험 분할점수 산출 원리', 175)}${IMG('p26', 70, 247, 1355, 498, 'wipe-d', 0.4)}`);
  // 27 OX
  add(`${LOGO()}${STMT('정기시험을 어렵게 출제한 경우,', '추정분할점수는 높아지는 것이 정상이다.')}${OX(27)}`,
    { interact: { type: 'ox', title: '정기시험을 어렵게 출제한 경우, 추정분할점수는 높아지는 것이 정상이다.' } });
  // 28, 29
  add(`${H(4)}${T('정기시험 분할점수 산출 과정', 176)}${IMG('p28', 80, 269, 1076, 522, 'zoom', 0.4)}`);
  add(`${H(4)}${T('정기시험 분할점수 산출 과정', 175)}${IMG('p29', 67, 264, 1110, 539, 'zoom', 0.4)}`);
  // 30
  const chk = `<svg width="46" height="46" viewBox="0 0 46 46" style="vertical-align:-8px;margin-right:6px"><rect x="3" y="7" width="34" height="34" rx="3" fill="none" stroke="#224b99" stroke-width="4.5"/><path d="M11 22 L20 31 L42 6" fill="none" stroke="#224b99" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  add(`${H(4)}
    <p class="abs a left" style="left:35px;top:150px;margin:0;font-size:40px;font-weight:800;color:var(--navy);--d:.1s">${chk}교과협의-학관위 심의 후 결재</p>
    ${IMG('p30a', 90, 220, 486, 565, 'up', 0.4, 'box-shadow:0 6px 24px rgba(0,0,0,.08)')}
    <p class="abs a right" style="left:740px;top:150px;margin:0;font-size:40px;font-weight:800;color:var(--navy);--d:1s">${chk}평가 실시 전 가정통신문 발송</p>
    ${IMG('p30b', 745, 270, 675, 420, 'up', 1.3)}`);
  // 31 OX
  add(`${LOGO()}${STMT('한 과목을 여러 선생님이 가르치는 경우,', '추정분할점수 산출은 한 명의 대표교사가 실시한다.')}${OX(31)}`,
    { interact: { type: 'ox', title: '한 과목을 여러 선생님이 가르치는 경우, 추정분할점수 산출은 한 명의 대표교사가 실시한다.' } });
  // 32 숫자
  add(`${LOGO()}${STMT('추정분할점수 산출을 위한 라운드 등록은', '교사별로 최소 (<span class="blank"></span>)회 실시해야 한다.', 290)}
    <div class="num-area a up" style="--d:.8s" data-num="32"><span class="ph">휴대폰으로 괄호 안에 들어갈 숫자를 보내 주세요</span></div>${TOTAL(32)}`,
  { interact: { type: 'number', title: '추정분할점수 산출을 위한 라운드 등록은 교사별로 최소 (   )회 실시해야 한다.' } });
  // 33
  add(`${H(5)}${T('포천 관내 고등학교 - 추정분할점수 사용 현황', 175)}${IMG('p33', 47, 273, 1060, 513, 'up', 0.4)}${RING(72, 444, 1012, 68, 1.4, 6)}`);
  // 34
  const subj = [['주제탐구독서 47명', '세계문화와영어 26명', '기하 74명', '세계시민과 지리 29명'], ['세계사 22명', '사회와 문화 65명', '<span class="mark" style="--d:1.4s">정치 21명</span>', '지구과학 23명']];
  const cx = [68, 427, 810, 1027];
  add(`${H(5)}${T('왜 소규모 농어촌 학교는 추정분할점수를 고려하게 될까?', 175)}
    <p class="abs a up" style="left:68px;top:290px;margin:0;font-size:40px;font-weight:800;--d:.4s">(사례) 청학고등학교 2학년 7학급, 학년 인원 144명</p>
    ${subj.map((row, r) => row.map((s, c) => `<span class="abs a fade" style="left:${cx[c]}px;top:${390 + r * 62}px;font-size:33px;font-weight:500;white-space:nowrap;--d:${0.7 + (r * 4 + c) * 0.06}s">${s}</span>`).join('')).join('')}
    <p class="abs a left" style="left:85px;top:572px;margin:0;font-size:35px;font-weight:800;line-height:1.7;--d:1.6s">첫째, 학생 수가 적어 1등급에 해당하는 학생의 절대 인원(10%)이 제한적이다.</p>
    <p class="abs a left" style="left:85px;top:632px;margin:0;font-size:35px;font-weight:800;line-height:1.7;--d:2.1s">둘째, 학생들의 학업 성취 수준과 평가 난이도를 함께 고려해, 실제 성취가<br><span style="padding-left:100px">성취도에 타당하게 반영될 필요가 있다.</span></p>`);
  // 35
  add(`${H(5)}${T('(예시) 2학년 정치 과목', 176)}
    <p class="abs a left" style="left:67px;top:292px;margin:0;font-size:42px;font-weight:700;--d:.4s">- 수강생 21명 / 1등급 10% 2명일 때,</p>
    <p class="abs a left" style="left:67px;top:362px;margin:0;font-size:42px;font-weight:700;--d:.8s">- 3~5등 한 학생들이 정말 성실하고 열심히 한 학생들이라면?</p>
    <p class="big abs a pop" style="left:0;width:1394px;top:485px;font-size:52px;--d:1.4s">5등까지도 성취도 A를 부여하고 싶다...</p>
    <p class="abs a up" style="left:0;width:1394px;text-align:center;top:630px;margin:0;font-size:37px;font-weight:700;color:#666;line-height:1.85;--d:2s">*고정분할: 문항 난이도 조절<br>*추정분할: 분할점수 적정 산출</p>`);
  // 36, 37
  add(`${H(5)}${T('추정분할점수 사용 시 고려할 점', 176)}${IMG('p36', 67, 253, 1104, 520, 'wipe-d', 0.4)}`);
  add(`${H(5)}${T('추정분할점수 사용 시 고려할 점', 175)}${IMG('p37', 67, 266, 1044, 513, 'wipe-d', 0.4)}`);
  // 38, 39
  add(FULL('p38'));
  add(FULL('p39'));
  // 40
  add(`
    <svg class="abs" width="1440" height="810" viewBox="0 0 1440 810" style="left:0;top:0">
      <line x1="373" y1="0" x2="373" y2="810" stroke="#ececec" stroke-width="2"/>
      <path d="M373,810 V528 A260,260 0 0 1 633,268 H1440" fill="none" stroke="#e4e4e4" stroke-width="2"/>
      <path class="draw" style="--len:620;--d:.1s" d="M350,-10 V40 A200,200 0 0 1 150,240 H-10" fill="none" stroke="#224b99" stroke-width="50"/>
    </svg>
    <p class="abs a up" style="right:105px;top:605px;margin:0;font-size:74px;font-weight:800;color:var(--navy);--d:.6s">감사합니다.</p>`);

  window.SLIDES = slides;
})();
