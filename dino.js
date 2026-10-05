// 🦖 공룡 게임
// 담당: 문정우
// 브랜치: feat/dino
//
// 만들 것: 스페이스바로 점프해서 선인장을 피하는 크롬 공룡 스타일 게임
//
// 규칙
//  - 이 파일만 수정하세요. index.html, style.css, 다른 기능 파일은 건드리지 않습니다.
//  - 결과는 dino-area 안에만 그립니다.
//  - 버튼을 누를 때마다 startDino()이 호출됩니다.

function startDino() {
  const area = document.getElementById('dino-area');
  area.__dinoCleanup?.();
  area.innerHTML = `
    <div class="dino-game">
      <style>
        .dino-game { max-width: 760px; margin: 0 auto; color: #fff; font-family: 'Noto Sans KR', sans-serif; }
        .dino-head { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 14px; }
        .dino-title { font-size: 18px; font-weight: 700; }
        .dino-score { color: #ff9daf; font: 700 14px ui-monospace, SFMono-Regular, Menlo, monospace; }
        .dino-canvas { display: block; width: 100%; height: auto; border: 1px solid rgba(255,255,255,.16); border-radius: 4px; background: #fff9f2; }
        .dino-footer { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 12px; color: #d9c8cd; font-size: 13px; }
        .dino-restart { border: 1px solid #ff3b6b; border-radius: 4px; padding: 7px 12px; background: transparent; color: #fff; font: inherit; cursor: pointer; }
        .dino-restart:hover { background: #7d0a1f; }
        @media (max-width: 520px) { .dino-head { align-items: flex-start; flex-direction: column; gap: 4px; } .dino-footer { align-items: flex-start; flex-direction: column; } }
      </style>
      <div class="dino-head">
        <strong class="dino-title">공룡 달리기</strong>
        <span class="dino-score" aria-live="polite">점수 00000</span>
      </div>
      <canvas class="dino-canvas" width="760" height="190" role="img" aria-label="선인장을 점프로 피하는 공룡 게임"></canvas>
      <div class="dino-footer">
        <span class="dino-message" aria-live="polite">스페이스바 또는 ↑ 키를 눌러 점프하세요</span>
        <button class="dino-restart" type="button">다시 시작</button>
      </div>
    </div>
  `;

  const canvas = area.querySelector('.dino-canvas');
  const context = canvas.getContext('2d');
  const scoreElement = area.querySelector('.dino-score');
  const messageElement = area.querySelector('.dino-message');
  const restartButton = area.querySelector('.dino-restart');
  const width = 760;
  const height = 190;
  const groundY = 151;
  const dino = { x: 72, y: groundY - 34, width: 30, height: 34, velocityY: 0 };
  const obstacles = [];
  let animationId = 0;
  let lastTime = 0;
  let elapsed = 0;
  let score = 0;
  let speed = 270;
  let gameOver = false;
  let jumpRequested = false;

  function resizeCanvas() {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw();
  }

  function draw() {
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#fff9f2';
    context.fillRect(0, 0, width, height);

    context.fillStyle = '#d8cfc5';
    context.fillRect(0, groundY, width, 2);
    context.fillStyle = '#a79c91';
    for (let i = 0; i < 12; i += 1) {
      const dashX = (i * 83 - (elapsed * speed) % 83 + width) % width;
      context.fillRect(dashX, groundY + 9, 18, 2);
    }

    const dinoTop = dino.y;
    context.fillStyle = '#27805c';
    context.fillRect(dino.x + 4, dinoTop + 10, 18, 21);
    context.fillRect(dino.x + 17, dinoTop + 2, 13, 14);
    context.fillRect(dino.x + 24, dinoTop + 8, 8, 5);
    context.fillRect(dino.x, dinoTop + 13, 8, 5);
    context.fillStyle = '#fff9f2';
    context.fillRect(dino.x + 25, dinoTop + 5, 2, 2);
    context.fillStyle = '#1b4938';
    const runningFrame = Math.floor(elapsed * 10) % 2;
    context.fillRect(dino.x + 7, dinoTop + 29, 5, runningFrame && !gameOver ? 5 : 3);
    context.fillRect(dino.x + 18, dinoTop + 29, 5, runningFrame || !gameOver ? 3 : 5);

    context.fillStyle = '#438b5a';
    obstacles.forEach((obstacle) => {
      context.fillRect(obstacle.x + 7, groundY - obstacle.height, 12, obstacle.height);
      context.fillRect(obstacle.x, groundY - obstacle.height + 9, 8, 5);
      context.fillRect(obstacle.x + 18, groundY - obstacle.height + 15, 7, 5);
      context.fillRect(obstacle.x + 2, groundY - obstacle.height + 4, 4, 9);
      context.fillRect(obstacle.x + 20, groundY - obstacle.height + 10, 4, 10);
    });

    if (gameOver) {
      context.fillStyle = 'rgba(255, 249, 242, .78)';
      context.fillRect(0, 0, width, height);
      context.fillStyle = '#6d1728';
      context.textAlign = 'center';
      context.font = '700 22px sans-serif';
      context.fillText('게임 종료', width / 2, 86);
      context.font = '14px sans-serif';
      context.fillText('다시 시작 버튼을 눌러 재도전하세요', width / 2, 111);
    }
  }

  function updateScore() {
    scoreElement.textContent = `점수 ${String(Math.floor(score)).padStart(5, '0')}`;
  }

  function jump() {
    if (gameOver) return;
    if (dino.y >= groundY - dino.height - 0.5) {
      dino.velocityY = -520;
    }
  }

  function onKeyDown(event) {
    if (event.code !== 'Space' && event.code !== 'ArrowUp') return;
    event.preventDefault();
    if (!event.repeat) jumpRequested = true;
  }

  function frame(time) {
    const delta = Math.min((time - (lastTime || time)) / 1000, 0.04);
    lastTime = time;

    if (!gameOver) {
      elapsed += delta;
      score += delta * 10;
      speed = Math.min(270 + score * 2, 520);
      dino.velocityY += 1500 * delta;
      dino.y = Math.min(dino.y + dino.velocityY * delta, groundY - dino.height);
      if (dino.y === groundY - dino.height) dino.velocityY = 0;
      if (jumpRequested) jump();
      jumpRequested = false;

      if (obstacles.length === 0 || obstacles[obstacles.length - 1].x < width - 300) {
        obstacles.push({ x: width + 10, width: 25, height: 25 + Math.random() * 16 });
      }
      obstacles.forEach((obstacle) => { obstacle.x -= speed * delta; });
      while (obstacles.length && obstacles[0].x + obstacles[0].width < 0) obstacles.shift();

      const collision = obstacles.some((obstacle) =>
        dino.x + dino.width - 5 > obstacle.x + 3 &&
        dino.x + 5 < obstacle.x + obstacle.width - 2 &&
        dino.y + dino.height - 3 > groundY - obstacle.height + 4
      );
      if (collision) {
        gameOver = true;
        messageElement.textContent = '선인장에 부딪혔어요';
      }
      updateScore();
    }

    draw();
    if (!gameOver) animationId = window.requestAnimationFrame(frame);
  }

  function restart() {
    window.cancelAnimationFrame(animationId);
    obstacles.length = 0;
    dino.y = groundY - dino.height;
    dino.velocityY = 0;
    elapsed = 0;
    score = 0;
    speed = 270;
    lastTime = 0;
    gameOver = false;
    messageElement.textContent = '스페이스바 또는 ↑ 키를 눌러 점프하세요';
    updateScore();
    animationId = window.requestAnimationFrame(frame);
  }

  window.addEventListener('keydown', onKeyDown);
  restartButton.addEventListener('click', restart);
  window.addEventListener('resize', resizeCanvas);
  area.__dinoCleanup = () => {
    window.cancelAnimationFrame(animationId);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('resize', resizeCanvas);
  };

  resizeCanvas();
  updateScore();
  animationId = window.requestAnimationFrame(frame);
}
