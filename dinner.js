// 🍜 저녁 메뉴 룰렛
// 담당: (여기에 이름)
// 브랜치: feat/dinner
//
// 만들 것: 버튼을 누르면 룰렛이 돌아가며 오늘 저녁 메뉴를 골라주는 프로그램
//
// 규칙
//  - 이 파일만 수정하세요. index.html, style.css, 다른 기능 파일은 건드리지 않습니다.
//  - 결과는 dinner-area 안에만 그립니다.
//  - 버튼을 누를 때마다 startDinner()이 호출됩니다.

(function () {
  const DEFAULT_MENUS = ['치킨', '피자', '삼겹살', '짜장면', '초밥', '떡볶이', '김치찌개', '햄버거'];
  const COLORS = ['#ff3b6b', '#7d0a1f', '#ff7a93', '#4a0f1f', '#e0244f', '#5e1428', '#ff9fb2', '#3a0a18'];

  // 버튼을 다시 눌러도 메뉴 목록은 유지
  let menus = DEFAULT_MENUS.slice();
  let angle = 0;          // 현재 회전 각도(라디안)
  let spinning = false;
  let rafId = null;

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  const STYLE = `
    #dinner-area .dn-wrap { display: flex; gap: 28px; align-items: center; justify-content: center; flex-wrap: wrap; }
    #dinner-area .dn-wheel { position: relative; width: 300px; max-width: 100%; aspect-ratio: 1; }
    #dinner-area .dn-wheel canvas { width: 100%; height: 100%; display: block; }
    #dinner-area .dn-pointer {
      position: absolute; top: -6px; left: 50%; transform: translateX(-50%);
      width: 0; height: 0; border-left: 14px solid transparent; border-right: 14px solid transparent;
      border-top: 26px solid #fff; filter: drop-shadow(0 2px 3px rgba(0,0,0,.5)); z-index: 2;
    }
    #dinner-area .dn-side { flex: 1; min-width: 220px; max-width: 320px; display: flex; flex-direction: column; gap: 14px; }
    #dinner-area .dn-title { font-size: 20px; font-weight: 700; }
    #dinner-area .dn-result {
      min-height: 56px; padding: 14px; border-radius: 6px; background: #170a0e;
      color: var(--sub); text-align: center; font-size: 15px; display: flex; align-items: center; justify-content: center;
    }
    #dinner-area .dn-result strong { color: var(--pink); font-size: 22px; margin: 0 4px; }
    #dinner-area .dn-btn {
      padding: 12px 16px; border: 1px solid var(--pink); border-radius: 6px; background: var(--box);
      color: #fff; font: inherit; font-weight: 700; cursor: pointer; transition: transform .15s, opacity .15s;
    }
    #dinner-area .dn-btn:hover:not(:disabled) { transform: translateY(-2px); }
    #dinner-area .dn-btn:disabled { opacity: .5; cursor: default; }
    #dinner-area .dn-add { display: flex; gap: 6px; }
    #dinner-area .dn-add input {
      flex: 1; min-width: 0; padding: 9px 10px; border-radius: 6px; border: 1px solid #4a2a33;
      background: #170a0e; color: #fff; font: inherit; font-size: 14px;
    }
    #dinner-area .dn-add button {
      padding: 0 14px; border-radius: 6px; border: 1px solid #4a2a33; background: transparent;
      color: #fff; font: inherit; font-size: 14px; cursor: pointer;
    }
    #dinner-area .dn-chips { display: flex; flex-wrap: wrap; gap: 6px; }
    #dinner-area .dn-chip {
      display: inline-flex; align-items: center; gap: 4px; padding: 4px 6px 4px 10px; border-radius: 999px;
      background: #3a1520; font-size: 13px; color: var(--sub);
    }
    #dinner-area .dn-chip button {
      border: 0; background: transparent; color: var(--muted); cursor: pointer; font-size: 14px; line-height: 1; padding: 0 4px;
    }
    #dinner-area .dn-chip button:hover { color: var(--pink); }
    #dinner-area .dn-note { font-size: 12px; color: var(--muted); }
  `;

  function drawWheel(canvas) {
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const r = size / 2;
    const n = menus.length;
    const slice = (Math.PI * 2) / n;

    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(r, r);
    ctx.rotate(angle);

    for (let i = 0; i < n; i++) {
      // 0번 칸이 12시 방향에서 시작하도록 -90도 보정
      const start = i * slice - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r - 6, start, start + slice);
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      if (n % COLORS.length === 1 && i === n - 1) ctx.fillStyle = COLORS[1]; // 첫 칸과 같은 색 방지
      ctx.fill();
      ctx.strokeStyle = '#170a0e';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 글자
      ctx.save();
      ctx.rotate(start + slice / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      const fontSize = Math.max(14, Math.min(26, 220 / n + 6));
      ctx.font = `700 ${fontSize}px 'Noto Sans KR', sans-serif`;
      let label = menus[i];
      if (label.length > 6) label = label.slice(0, 6) + '…';
      ctx.fillText(label, r - 24, 0);
      ctx.restore();
    }
    ctx.restore();

    // 바깥 테두리 + 가운데 원
    ctx.beginPath();
    ctx.arc(r, r, r - 4, 0, Math.PI * 2);
    ctx.strokeStyle = '#ff3b6b';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(r, r, size * 0.08, 0, Math.PI * 2);
    ctx.fillStyle = '#26131a';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  // 12시 방향 화살표가 가리키는 칸 번호
  function currentIndex() {
    const n = menus.length;
    const slice = (Math.PI * 2) / n;
    const a = ((-angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    return Math.floor(a / slice) % n;
  }

  function render(area) {
    if (rafId) cancelAnimationFrame(rafId);
    spinning = false;

    area.innerHTML = `
      <style>${STYLE}</style>
      <div class="dn-wrap">
        <div class="dn-wheel">
          <div class="dn-pointer"></div>
          <canvas width="600" height="600"></canvas>
        </div>
        <div class="dn-side">
          <div class="dn-title">🍜 오늘 저녁 뭐 먹지?</div>
          <div class="dn-result">룰렛을 돌려 메뉴를 정해보세요</div>
          <button class="dn-btn dn-spin">룰렛 돌리기</button>
          <form class="dn-add">
            <input type="text" maxlength="12" placeholder="메뉴 추가 (예: 쌀국수)" />
            <button type="submit">추가</button>
          </form>
          <div class="dn-chips"></div>
          <div class="dn-note">메뉴는 2개 이상 12개 이하로 넣을 수 있어요</div>
        </div>
      </div>
    `;

    const canvas = area.querySelector('canvas');
    const resultEl = area.querySelector('.dn-result');
    const spinBtn = area.querySelector('.dn-spin');
    const form = area.querySelector('.dn-add');
    const input = form.querySelector('input');
    const chips = area.querySelector('.dn-chips');

    function renderChips() {
      chips.innerHTML = menus
        .map((m, i) => `<span class="dn-chip">${escapeHtml(m)}<button type="button" data-i="${i}" title="삭제">×</button></span>`)
        .join('');
      spinBtn.disabled = spinning || menus.length < 2;
    }

    chips.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-i]');
      if (!btn || spinning) return;
      if (menus.length <= 2) {
        resultEl.textContent = '메뉴는 최소 2개가 필요해요';
        return;
      }
      menus.splice(Number(btn.dataset.i), 1);
      renderChips();
      drawWheel(canvas);
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (spinning) return;
      const name = input.value.trim();
      if (!name) return;
      if (menus.includes(name)) {
        resultEl.textContent = '이미 있는 메뉴예요';
        return;
      }
      if (menus.length >= 12) {
        resultEl.textContent = '메뉴는 12개까지만 넣을 수 있어요';
        return;
      }
      menus.push(name);
      input.value = '';
      renderChips();
      drawWheel(canvas);
    });

    spinBtn.addEventListener('click', () => {
      if (spinning || menus.length < 2) return;
      spinning = true;
      renderChips();
      form.querySelector('button').disabled = true;
      resultEl.textContent = '두구두구두구…';

      const start = angle;
      const extra = Math.PI * 2 * (5 + Math.random() * 3); // 5~8바퀴 + 랜덤 위치
      const duration = 4000 + Math.random() * 1000;
      const t0 = performance.now();
      const easeOut = (t) => 1 - Math.pow(1 - t, 4);

      function frame(now) {
        const t = Math.min(1, (now - t0) / duration);
        angle = start + extra * easeOut(t);
        drawWheel(canvas);
        if (t < 1) {
          rafId = requestAnimationFrame(frame);
        } else {
          angle %= Math.PI * 2;
          spinning = false;
          rafId = null;
          form.querySelector('button').disabled = false;
          const pick = menus[currentIndex()];
          resultEl.innerHTML = `오늘 저녁은 <strong>${escapeHtml(pick)}</strong> 어때요? 🎉`;
          renderChips();
        }
      }
      rafId = requestAnimationFrame(frame);
    });

    renderChips();
    drawWheel(canvas);
    // 웹폰트가 늦게 로드되면 한 번 더 그리기
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!spinning) drawWheel(canvas); });
  }

  window.startDinner = function startDinner() {
    const area = document.getElementById('dinner-area');
    if (!area) return;
    render(area);
  };
})();
