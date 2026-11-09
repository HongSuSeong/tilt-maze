# 틸트 미로 1차: 기반과 들판 세계 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 폰에서 처음부터 끝까지 놀 수 있는 첫 판을 만든다. 튜토리얼 3판과 1번 세계(들판, 1–10단계)를 3D로 하고, 진행을 저장하고, GitHub Pages로 배포한다.

**Architecture:** 물리, 기울기 읽기, 단계 검사, 저장, 진행 규칙은 DOM과 Three.js를 모르는 순수 모듈로 두고 vitest로 시험한다. 3D 그리기(`render3d.js`)와 화면(`ui.js`)은 그 결과만 받아 그린다. 단계는 코드가 아니라 데이터 파일이다.

**Tech Stack:** Vite 5, three 0.160.0 (npm), vitest 1, 순수 ES 모듈(JavaScript). 배포는 GitHub Actions → Pages.

**Spec:** `docs/superpowers/specs/2026-11-09-tilt-maze-design.md`

## Global Constraints

- 세로 화면 폰이 기준이다. 버튼 높이 52px 이상, 누르면 눌린 모습.
- 손맛 값(설계 "조작과 손맛"): 판 100×160 단위, 공 반지름 4.2, 가속 `5/7 × 9.81 × 400 × sin(기울기) × 민감도`, 구름 저항 0.6/초, 튕김 0.35, 최고 속도 1400, 무시할 기울기 1°, 센서 다듬기 0.5, 벽 깨는 속도 220(깨진 뒤 속도 75% 유지), 구멍 포획 반지름 `hole.r − 4.2×0.35`, 한 화면 물리 4분할.
- 사용자가 바꾸는 손맛 값은 민감도(0.5–1.5) 하나다.
- 화면 속 판은 손 기울기의 40%만큼 기운다. 카메라는 약 62° 내려다본다.
- 기본 테마 "말랑 장난감": 바탕 `#EAF8F1`, 판 `#C7EFDB`(점 `#B1E4CB`), 벽 흰색, 금 간 벽 `#FFD7A3`/`#E39B57`, 구멍 `#0E2F2A`와 고리 `#7FD4B4`, 공 `#FF6E5E`에 크림 물방울무늬, 코인 `#FFD34E`, 글씨체 Jua.
- 글은 모두 한국어이고 `src/text.js` 한 곳에 모은다.
- 저장 키 `tilt-maze:v1`, 저장 형식에 `v: 1`.
- 커밋 메시지: 한국어 Conventional Commits, Why/What 본문, `Co-Authored-By` 줄 없음.

## Review Focus

1. 기울기 센서가 없거나 거부됨 → 게임은 방향키로 움직이고, 시작 화면에 이유와 설정 방법이 보인다. (Task 3, Task 9)
2. 놀다가 다른 앱으로 갔다 옴(긴 프레임 간격) → 물리가 벽을 뚫지 않고, 단계가 일시 정지된다. (Task 2, Task 9)
3. 브라우저 저장소가 막힘(사파리 개인 정보 보호 모드) → 게임은 저장 없이 그대로 돌아간다. (Task 6)
4. 놀다가 화면이 가로로 돌아감 → 기울기 방향이 화면 기준으로 맞게 바뀐다. (Task 3)
5. 작은 폰(375×667) → 판과 위·아래 막대가 겹치지 않는다. (Task 8)

---

## 파일 구조

```
index.html               첫 화면 하나 (Vite 진입점)
vite.config.js           base: '/tilt-maze/'
package.json
.github/workflows/pages.yml
public/spike/2d.html     기존 index.html 시험판 (옮김)
public/spike/3d.html     기존 3d.html 시험판 (옮김)
src/
  feel.js                손맛 상수
  physics.js             공 한 걸음: 벽, 금 간 벽, 코인, 구멍
  tilt.js                센서 값 → 화면 기준 기울기
  levels/validate.js     단계 검사 (풀 수 있는가)
  levels/tutorial.js     튜토리얼 3판 데이터
  levels/world1.js       들판 10단계 데이터
  levels/index.js        단계 목록과 찾기
  save.js                저장/불러오기
  run.js                 한 판의 진행 규칙 (시간, 별, 코인, 실패, 쉬기)
  render3d.js            Three.js 장면
  sound.js               소리와 진동
  text.js                화면 글
  ui.js                  위·아래 막대, 시작·통과·실패·쉬기·설정·홈 화면
  main.js                연결과 매 화면 루프
test/*.test.js           vitest
tools/shot.sh            폰 크기 화면 캡처 (chrome-headless-shell)
```

## 단계 데이터 형식 (Task 4–5가 정하고 이후 모두가 쓴다)

```js
// 좌표는 판 단위(가로 0–100, 세로 0–160). 테두리 벽은 데이터에 넣지 않는다: 검사와 물리가 두께 3으로 둘러준다.
{
  id: 'w1-3',            // 튜토리얼은 't1'..'t3'
  world: 1, index: 3,    // 튜토리얼은 world 0
  name: '들판 3',
  time: 60,              // 제한 시간(초)
  start: { x: 12, y: 15 },
  hole: { x: 84, y: 143, r: 7.4 },
  walls: [{ x, y, w, h, kind: 'wall' | 'crack' }],
  coins: [{ x, y }],
  hint: '...'            // 튜토리얼만: 판 위에 띄울 안내
}
```

---

### Task 1: 프로젝트 뼈대와 Pages 배포

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `src/main.js`(빈 연결), `src/feel.js`, `.github/workflows/pages.yml`, `.gitignore`, `test/feel.test.js`
- Move: `index.html` → `public/spike/2d.html`, `3d.html` → `public/spike/3d.html`

**Interfaces:**
- Produces: `src/feel.js`가 `export const FEEL = { BW: 100, BH: 160, RIM: 3, R: 4.2, G: 9.81 * 400 * 5 / 7, fric: 0.6, bounce: 0.35, vmax: 1400, brk: 220, keep: 0.75, dead: 1, smooth: 0.5, sub: 4, lean: 0.4 }`

- [ ] **Step 1: 시험 작성** `test/feel.test.js`: `FEEL.G`가 `2802.857…`(소수 둘째 자리까지 2802.86), `FEEL.brk === 220`, `FEEL.R === 4.2`.
- [ ] **Step 2: 실행** `npx vitest run` → FAIL (`feel.js` 없음)
- [ ] **Step 3: 구현** `package.json`(scripts: `dev`, `build`, `test: vitest run`; deps `three@0.160.0`; devDeps `vite@5`, `vitest@1`), `vite.config.js`(`base: '/tilt-maze/'`), `src/feel.js`. 시험판 두 파일을 `public/spike/`로 옮긴다. `.gitignore`에 `node_modules`, `dist`.
- [ ] **Step 4: 실행** `npm install && npm test && npm run build` → PASS, `dist/index.html`과 `dist/spike/3d.html`이 생김
- [ ] **Step 5: 배포 설정** `.github/workflows/pages.yml`: main에 push되면 `npm ci && npm test && npm run build` 후 `actions/upload-pages-artifact@v3`(path `dist`)와 `actions/deploy-pages@v4`. 저장소 Settings → Pages → Source를 **GitHub Actions**로 바꾸는 일은 사용자가 한다. 바꾸기 전까지는 예전 시험판 링크가 그대로다.
- [ ] **Step 6: 커밋** `chore: Vite 프로젝트 뼈대와 Pages 배포`

### Task 2: 물리

**Files:**
- Create: `src/physics.js`, `test/physics.test.js`

**Interfaces:**
- Consumes: `FEEL`
- Produces:
  - `createBall(x, y) -> { x, y, vx, vy, fall: 0 }`
  - `stepBall(ball, tilt, dt, level, state, sens) -> Event[]` — `tilt`는 `{x, y}`(도), `state`는 `{ broken: Set<wallIndex>, got: Set<coinIndex> }`(호출자가 갖고 있고 이 함수가 채움). `dt`는 1/30초를 넘으면 1/30으로 자른다. 테두리 벽(두께 `FEEL.RIM`)을 스스로 더한다.
  - `Event = { type: 'knock', speed } | { type: 'break', wall: index } | { type: 'coin', coin: index } | { type: 'hole' }`
  - `ball.fall > 0`이면 공은 구멍으로 빨려 들어가는 중이고 `stepBall`은 구멍 쪽으로만 옮긴다. `fall`이 1.1을 넘으면 `{ type: 'sunk' }`를 한 번 낸다.

- [ ] **Step 1: 시험 작성** (판: 벽 없음 + 필요한 벽만)
  - `rests in the corner it is tilted to`: 빈 판, 공 (50, 80), 기울기 (8, 8)로 1/60초씩 3초 → 공이 (92.8±0.2, 152.8±0.2)에 멈춤, 속도 < 1
  - `a level board leaves the ball where it is`: 기울기 (0, 0)으로 2초 → 공 위치 변화 0 (무시할 기울기는 Task 3의 `read`가 처리한다)
  - `a cracked wall breaks from a long run at 15°`: 금 간 벽 `{x:20,y:38,w:6,h:28}`, 공 (90, 52), 기울기 (−15, 0) → 1초 안에 `break` 이벤트, `state.broken`에 들어감
  - `...but only knocks at 10°`: 같은 판, 기울기 (−10, 0)으로 2초 → `break` 없음, `knock` 있음
  - `does not tunnel at top speed`: 공 (50, 80), vx 1400, 큰 dt 0.5 한 번 → x ≤ 100 − 3 − 4.2 + 0.01
  - `picks up a coin once`: 코인 (60, 80), 공 (50, 80), 기울기 (10, 0) → `coin` 이벤트 정확히 한 번
  - `drops into the hole`: 구멍 (50, 120, r 7.4), 공 (50, 100), 기울기 (0, 10) → `hole` 이벤트 뒤 1.2초 안에 `sunk`
- [ ] **Step 2: 실행** `npx vitest run test/physics.test.js` → FAIL
- [ ] **Step 3: 구현** 시험판 `public/spike/3d.html`의 `step`/`collide`를 옮긴다(원·축정렬 사각형 충돌, 4분할, 지수 감쇠, 구멍 가장자리 당김 `900×dt`). 깨진 벽과 주운 코인은 `state`로만 기억한다(레벨 데이터는 바꾸지 않는다).
- [ ] **Step 4: 실행** → PASS
- [ ] **Step 5: 커밋** `feat: 공의 물리`

### Task 3: 기울기 읽기

**Files:**
- Create: `src/tilt.js`, `test/tilt.test.js`

**Interfaces:**
- Produces:
  - `mapTilt(raw, ref, angle) -> {x, y}` — `raw`, `ref`는 `{beta, gamma}`, `angle`은 화면 회전(0, 90, 180, 270, −90도 받음). 세로 기준 `x = gamma−ref.gamma`, `y = beta−ref.beta`, 90: `(y, −x)`, 270: `(−y, x)`, 180: `(−x, −y)`.
  - `deadZone(v, dead) -> number`
  - `createTilt() -> { feed(raw), calibrate(), read(angle, keys) -> {x, y}, hasSensor: boolean }` — `read`는 다듬기 0.5와 무시할 기울기를 적용하고, 센서 값이 없으면 방향키(±14°, 다듬기 0.2)로 대신한다.

- [ ] **Step 1: 시험 작성**
  - `portrait reads gamma as x and beta as y`: raw (beta 10, gamma 5), ref 0, angle 0 → (5, 10)
  - `turned screens rotate the axes`: 같은 raw로 90 → (10, −5), 270 → (−10, 5), 180 → (−5, −10), −90은 270과 같음
  - `the dead zone takes away the first degree`: `deadZone(0.8, 1) === 0`, `deadZone(3, 1) === 2`, `deadZone(-3, 1) === -2`
  - `without a sensor the arrow keys tilt`: `createTilt().read(0, {ArrowRight: true})`를 30번 → x가 13.9 이상
  - `calibrate takes the present pose as level`: feed (beta 20, gamma −4) → calibrate → read 여러 번 → (0, 0)
- [ ] **Step 2: 실행** → FAIL
- [ ] **Step 3: 구현** `src/tilt.js`
- [ ] **Step 4: 실행** → PASS
- [ ] **Step 5: 커밋** `feat: 화면 기준 기울기 읽기`

### Task 4: 단계 검사

**Files:**
- Create: `src/levels/validate.js`, `test/validate.test.js`

**Interfaces:**
- Consumes: `FEEL`
- Produces: `validateLevel(level) -> string[]` (빈 배열이면 통과). 검사:
  1. 모든 벽, 코인, 시작, 구멍이 판 안(테두리 안쪽)
  2. 시작점과 코인은 벽에서 공 반지름 이상 떨어짐
  3. 판을 1단위 격자로 나누고 공 중심이 갈 수 있는 칸(모든 벽에서 4.2 이상)을 너비 우선 탐색. 금 간 벽은 지나갈 수 있는 것으로 본다. 구멍 중심과 모든 코인에 닿아야 함.
  4. 금 간 벽마다, 벽에 수직인 방향 중 적어도 한쪽에 공이 곧게 달릴 수 있는 길이 50단위 이상 (벽 가운데 줄을 따라 빈 칸 수를 셈)
  5. `time`은 20–120 사이
- 메시지는 한국어 한 줄, 예: `'구멍에 갈 수 없음'`, `'금 간 벽 2: 달릴 거리 28 (50 필요)'`

- [ ] **Step 1: 시험 작성**
  - `a plain board passes`: 벽 없음, 시작 (12,15), 구멍 (84,143) → `[]`
  - `a wall across the board blocks the hole`: 벽 `{x:3,y:80,w:94,h:6}` → `'구멍에 갈 수 없음'` 포함
  - `a cracked wall across the board does not block`: 같은 벽을 crack, 위로 74단위 달릴 수 있음 → `[]`
  - `a cracked wall needs a run-up`: 금 간 벽 두 개 `{x:3,y:30,w:94,h:6}`, `{x:3,y:70,w:94,h:6}`(둘 다 crack). 벽 0은 위로 27, 아래로 34만 달릴 수 있음 → `'금 간 벽 0: 달릴 거리'` 포함, 벽 1(아래로 81)은 메시지 없음
  - `a coin inside a wall is caught`: 코인을 벽 안에 → 메시지 하나 이상
- [ ] **Step 2: 실행** → FAIL
- [ ] **Step 3: 구현** `src/levels/validate.js`
- [ ] **Step 4: 실행** → PASS
- [ ] **Step 5: 커밋** `feat: 단계 검사(풀 수 있는가)`

### Task 5: 튜토리얼과 들판 10단계

**Files:**
- Create: `src/levels/tutorial.js`, `src/levels/world1.js`, `src/levels/index.js`, `test/levels.test.js`

**Interfaces:**
- Consumes: 단계 데이터 형식, `validateLevel`
- Produces: `LEVELS: Level[]`(튜토리얼 3 + 들판 10, 순서대로), `levelById(id)`, `nextLevel(id) -> Level | null`

- 튜토리얼 (설계 "튜토리얼")
  - `t1`: 빈 판, 코인 4개를 위·아래·왼쪽·오른쪽 끝에 두고 구멍은 가운데 아래. `hint: '폰을 기울여 네 방향의 코인을 모아 보세요'`. 시간 90.
  - `t2`: 긴 통로 끝 금 간 벽 하나를 지나야 구멍. `hint: '길게 달려 세게 부딪히면 주황 벽이 깨져요'`. 시간 90.
  - `t3`: 짧은 미로와 구멍. `hint: '구멍에 넣으면 한 단계 내려가요'`. 시간 60.
- 들판 1–10: 벽 수와 길이가 점점 늘고, 3단계부터 금 간 벽, 7단계부터 금 간 벽 두 개. 제한 시간은 60에서 45까지 줄인다. 첫 레이아웃은 `public/spike/3d.html`의 판을 `w1-3`으로 쓴다.

- [ ] **Step 1: 시험 작성** `every level passes the check`(13개 모두 `validateLevel` → `[]`), `ids are unique and in order`, `nextLevel('t3').id === 'w1-1'`, `nextLevel('w1-10') === null`, `world 1 gets harder`(w1-10의 벽 수 > w1-1의 벽 수, time 비증가)
- [ ] **Step 2: 실행** → FAIL
- [ ] **Step 3: 구현** 데이터 세 파일. 실패하는 단계는 검사 메시지를 보고 배치를 고친다.
- [ ] **Step 4: 실행** → PASS
- [ ] **Step 5: 커밋** `feat: 튜토리얼과 들판 세계 10단계`

### Task 6: 저장

**Files:**
- Create: `src/save.js`, `test/save.test.js`

**Interfaces:**
- Produces:
  - `defaultSave() -> { v: 1, coins: 0, best: {}, reached: 't1', opt: { sens: 1, snd: true, vib: true, dark: false } }` — `best[id] = { stars, time }`
  - `loadSave(storage = localStorage) -> Save` — 없거나 깨졌거나 `v`가 다르거나 storage가 예외를 던지면 `defaultSave()`
  - `writeSave(s, storage = localStorage) -> boolean` — 예외면 false
  - `recordClear(s, id, stars, time, coins) -> Save` — 별과 시간은 더 좋은 쪽을 남기고, 코인은 더하고, `reached`를 다음 단계로

- [ ] **Step 1: 시험 작성** 가짜 storage(`{getItem, setItem}`)로: 왕복, 깨진 JSON → 기본값, `v: 2` → 기본값, getItem이 throw → 기본값, setItem이 throw → false, `recordClear`가 별 3→2로 덮지 않음, `reached`가 `nextLevel`을 따라감
- [ ] **Step 2: 실행** → FAIL
- [ ] **Step 3: 구현** `src/save.js`
- [ ] **Step 4: 실행** → PASS
- [ ] **Step 5: 커밋** `feat: 진행 저장`

### Task 7: 한 판의 규칙

**Files:**
- Create: `src/run.js`, `test/run.test.js`

**Interfaces:**
- Consumes: `createBall`, `stepBall`, `Event`, `Level`
- Produces:
  - `createRun(level) -> Run` — `{ level, ball, state, left: level.time, coins: 0, phase: 'ready' | 'play' | 'paused' | 'clear' | 'fail' | 'rest', fails: 0, restLeft: 0 }`
  - `startRun(run)`: ready → play
  - `tickRun(run, tilt, dt, sens) -> Event[]` — play일 때만 물리와 시간을 진행. 시간이 0이 되면 `{type:'timeout'}`과 phase `fail`. `sunk`면 phase `clear`.
  - `retry(run)`: 같은 판 처음부터, `fails` 하나 늘림. `fails`가 3이 되면 phase `rest`, `restLeft = 30`.
  - `tickRest(run, dt)`: `restLeft`가 0이 되면 ready
  - `skipRest(run, save) -> boolean`: 코인 20개로 바로 ready
  - `starsFor(run) -> 1 | 2 | 3` — 남은 시간이 제한의 50% 이상 3, 25% 이상 2, 아니면 1
  - `rewardFor(run) -> number` — 주운 코인 + 5 + 별마다 5
  - `pauseRun(run)`, `resumeRun(run)`

- [ ] **Step 1: 시험 작성** 시간 초과 → fail, 구멍 → clear, 별 경계(50%·25% 정확히), 보상 계산(코인 2, 별 3 → 22), 세 번 실패 → rest 30, rest가 끝나면 ready, 코인 19개로는 `skipRest` false, paused에서는 시간이 안 감
- [ ] **Step 2: 실행** → FAIL
- [ ] **Step 3: 구현** `src/run.js`
- [ ] **Step 4: 실행** → PASS
- [ ] **Step 5: 커밋** `feat: 한 판의 진행 규칙(시간, 별, 코인, 쉬기)`

### Task 8: 3D 그리기

**Files:**
- Create: `src/render3d.js`, `tools/shot.sh`
- Test: 화면 캡처 (자동 시험 없음 — WebGL은 vitest에서 그리지 않는다)

**Interfaces:**
- Consumes: `FEEL`, `Level`, `Run`
- Produces: `createView(container) -> { load(level), update(run, tilt, dt, events), setDark(on), resize(), destroy() }`
  - `load`는 판, 벽(둥근 블록, 높이 1.0), 금 간 벽, 코인, 구멍을 만든다. 테두리 벽은 `FEEL.RIM`으로 둘러 만든다.
  - `update`는 판 기울기(`FEEL.lean`), 공 굴림(진행 방향에 수직인 축으로 `거리/반지름` 회전), 구멍에 빠지는 연출, 깨진 벽 조각, 빠를 때 불꽃 꼬리, 코인 회전과 사라짐을 그린다. 이벤트 `break`, `coin`은 그 자리에서 효과를 낸다.
  - 다크 모드 색: 바탕 `#0F1A1F`, 판 `#15262B`(점 `#203A40`), 벽 `#2E474F`, 구멍 고리 `#55E0AE`, 코인과 금 간 벽은 빛남(emissive).
  - 카메라는 판(+여백 1.2)이 위 92px·아래 92px 막대 사이를 채우도록 거리를 잡는다.
- `tools/shot.sh NAME HASH [WxH]`: `public/spike`와 같은 chrome-headless-shell 경로로 `dist/index.html#HASH`를 찍어 `tools/out/NAME.png`

- [ ] **Step 1: 캡처 장면 준비** `main.js`가 `#shot=LEVELID[:dark]`이면 시작 화면 없이 그 판을 그린다.
- [ ] **Step 2: 구현** `src/render3d.js`(시험판 `3d.html`의 장면을 모듈로 옮김)
- [ ] **Step 3: 확인** `npm run build && tools/shot.sh w1-3 shot=w1-3 && tools/shot.sh w1-3-dark shot=w1-3:dark && tools/shot.sh se shot=w1-3 375,667` → 세 장을 열어 본다. 기대: 판이 화면 폭을 채우고 위·아래 막대와 겹치지 않음, 다크 모드에서 코인·구멍이 보임, 375×667에서도 안 겹침.
- [ ] **Step 4: 커밋** `feat: 3D 판 그리기와 다크 모드`

### Task 9: 화면, 소리, 연결

**Files:**
- Create: `src/text.js`, `src/sound.js`, `src/ui.js`
- Modify: `src/main.js`, `index.html`
- Test: `test/flow.test.js`(순수 부분), 화면 캡처

**Interfaces:**
- Consumes: 앞 모든 모듈
- Produces:
  - `src/sound.js`: `createSound(opt) -> { unlock(), knock(speed), crash(), ding(), plop(), fail() }` — 소리 꺼짐/진동 꺼짐을 따른다. 진동은 `navigator.vibrate`가 있을 때만.
  - `src/ui.js`: `createUI(root, handlers) -> { show(screen, data), hud(run), toast(text) }` — 화면: `home`(이어하기 + 튜토리얼·들판 단계 칸과 별), `start`(센서 허용 버튼, 거부 시 안내), `ready`(단계 이름, 판 미리보기, 시작), `play`(위 막대: 세계 이름·단계, 남은 시간 막대, 코인 / 아래: 원소 칸 2개는 비어 있음 "원소는 물의 세계부터", 일시 정지), `pause`(계속, 다시, 홈, 설정), `clear`(별, 받은 코인, 다음), `fail`(이유, 다시), `rest`(남은 초, "코인 20개로 바로"), `settings`(민감도 50–150%, 소리, 진동, 다크 모드, 수평 다시 잡기)
  - `src/main.js`: 루프는 `requestAnimationFrame`. `visibilitychange`로 숨겨지면 `pauseRun`. 판을 시작할 때마다 `tilt.calibrate()`.
- 시험판의 시작 흐름(아이폰 `DeviceOrientationEvent.requestPermission`, 화면 꺼짐 방지 `wakeLock`)을 그대로 쓴다.

- [ ] **Step 1: 시험 작성** `test/flow.test.js`: `afterClear(save, run)`이 `recordClear`와 `rewardFor`를 엮어 코인·별·reached를 바꾸고 `nextLevel`을 돌려줌, 마지막 판(`w1-10`) 뒤에는 `null`(홈으로). 이 함수는 `src/run.js`에 추가.
- [ ] **Step 2: 실행** → FAIL
- [ ] **Step 3: 구현** `afterClear`, 그리고 `text.js`, `sound.js`, `ui.js`, `main.js`
- [ ] **Step 4: 실행** `npm test` → 전부 PASS
- [ ] **Step 5: 화면 확인** `#shot` 해시를 화면 이름까지 받게 넓혀(`#shot=w1-3:play`, `:clear`, `:rest`, `:settings`, `home`) 390×844로 캡처해 본다. 기대: 버튼이 손가락 크기, 글씨 안 잘림, 다크 모드 설정 켜면 판과 화면 둘 다 어두워짐.
- [ ] **Step 6: 커밋** `feat: 화면과 소리, 한 판의 흐름 연결`

### Task 10: 배포와 폰 확인

- [ ] **Step 1:** `npm test && npm run build` → PASS
- [ ] **Step 2:** 사용자에게 Pages Source를 GitHub Actions로 바꿔 달라고 요청(Task 1 Step 5) → push → Actions 성공 확인(`curl -s -o /dev/null -w "%{http_code}" https://hongsuseong.github.io/tilt-maze/` → 200, 응답에 `assets/` 스크립트)
- [ ] **Step 3:** 사용자에게 폰으로 튜토리얼부터 들판 10단계까지 해 보게 하고, 손맛·화면·난이도 의견을 받는다. 다음 계획(물의 세계와 원소 장착)의 입력이 된다.
- [ ] **Step 4: 커밋** 필요한 수정이 있으면 각각 커밋
