# 틸트 미로 2차: 난이도 틀과 함정 구멍 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** 쉬움·보통 두 난이도로 들판 세계를 할 수 있게 한다. 보통에는 함정 구멍, 짧은 시간, 좁은 통로가 있다. 어려움·지옥·신은 처음 화면에 잠긴 채 보인다.

**Architecture:** 단계 데이터는 그대로 두고, `applyDifficulty(level, diff)`가 난이도에 맞는 단계를 만들어 낸다(순수 함수). 저장은 난이도별 진행으로 바꾸고 v1 기록을 옮긴다.

**Spec:** `docs/superpowers/specs/2026-11-09-tilt-maze-design.md` ("난이도")

## Global Constraints
- 1차의 손맛 값과 화면 규칙 그대로. 커밋은 한국어, Why/What, Co-Authored-By 없음.
- 보통: 시간 `Math.round(time × 0.75)`, 벽 양쪽 +1(판 안쪽으로 잘라 냄), 함정은 `level.normal.traps`.
- 함정 포획 반지름 `trap.r − 4.2×0.35`, 가장자리 끌림은 목표 구멍과 같음. 단계 검사에서는 함정 중심 `trap.r` 안을 지나갈 수 없는 곳으로 본다.
- 저장 키 `tilt-maze:v1`은 그대로 두고 형식 `v: 2`로 올린다(`v: 1`을 읽으면 옮김).

## Review Focus
1. 예전(v1) 기록을 가진 사람 → 쉬움 기록과 진행이 그대로 남는다. (Task 3)
2. 함정 구멍 바로 옆 목표 구멍 → 둘 중 가까운 쪽에 빠진다(먼저 판정되는 쪽이 아님). (Task 1)
3. 보통에서 두꺼워진 벽이 코인·시작점을 덮음 → 단계 검사가 잡는다. (Task 2)

### Task 1: 함정 구멍 물리
- Files: `src/physics.js`, `test/physics.test.js`
- Produces: `level.traps?: {x, y, r}[]`, 이벤트 `{type:'trap', trap: i}`, 빠진 뒤 `{type:'lost'}`(목표 구멍의 `sunk` 대신)
- [ ] 시험: 함정에 빠지면 `trap` 뒤 `lost`, `sunk` 없음 / 목표와 함정이 가까우면 더 가까운 쪽 / 함정 가장자리는 공을 끌어당김
- [ ] 구현, 시험 통과, 커밋

### Task 2: 난이도 적용과 검사
- Files: `src/difficulty.js`, `src/levels/validate.js`, `src/levels/world1.js`(보통 함정, 쉬움 시간), `src/levels/index.js`, `test/difficulty.test.js`, `test/validate.test.js`, `test/levels.test.js`
- Produces: `DIFFS = [{id:'easy',name:'쉬움'},{id:'normal',name:'보통'},{id:'hard',name:'어려움'},{id:'hell',name:'지옥'},{id:'god',name:'신'}]`, `BUILT = ['easy','normal']`, `applyDifficulty(level, diffId) -> Level`, `levelsFor(diffId) -> Level[]`(보통은 연습 제외), `nextLevel(id, diffId)`
- 검사 추가: 시작점이 함정 안, 함정으로 막혀 구멍에 못 감
- 들판 쉬움 시간: 50, 50, 48, 46, 45, 44, 42, 41, 40, 38
- [ ] 시험: 보통 시간 75%, 벽 +1, 함정 붙음, 쉬움은 그대로 / `levelsFor('normal')`에 연습 없음 / 함정이 통로를 막으면 검사가 잡음 / 쉬움·보통 들판 20개 모두 검사 통과
- [ ] 구현(함정 배치는 단계마다 1–3개, 길목 옆), 시험 통과, 커밋

### Task 3: 난이도별 저장과 열림
- Files: `src/save.js`, `src/run.js`(afterClear), `test/save.test.js`, `test/flow.test.js`
- Produces: `defaultSave() -> { v: 2, coins, diff: 'easy', prog: { easy: { best, reached: 't1' }, normal: { best, reached: 'w1-1' } }, opt }`, `recordClear(s, diffId, id, stars, time, coins)`, `isOpen(s, diffId) -> boolean`(쉬움 항상, 보통은 쉬움 들판 10개를 모두 깼을 때, 아직 안 만든 난이도는 false), `createRun(level, diffId)`가 `run.diff`를 가짐
- [ ] 시험: v1 → v2 옮김(best, reached, coins, opt 유지) / 난이도별 기록 분리 / 들판 9개만 깨면 보통 잠김, 10개면 열림 / afterClear가 run.diff에 기록
- [ ] 구현, 시험 통과, 커밋

### Task 4: 화면
- Files: `src/ui.js`, `src/main.js`, `src/render3d.js`, `src/text.js`, `src/style.css`, `tools/smoke.mjs`
- 처음 화면 맨 위에 난이도 칸 5개(열림/잠김, 잠긴 것은 "쉬움을 모두 깨면 열려요" 또는 "곧 열려요"), 고른 난이도의 단계 칸과 이어하기. 위 막대 작은 글씨에 `들판 · 보통`. 실패 이유 `구멍에 빠졌어요`.
- 함정 구멍 그리기: 어두운 구멍에 주황·빨강 고리(`#FF8A65`, 다크 `#FF7A59`), 살짝 깜박임.
- [ ] 캡처: 처음 화면(보통 열림/잠김), 보통 들판 5 (밝게/어둡게)
- [ ] 연기 시험: 난이도 칸이 보이고, 새 저장에서는 보통이 잠김
- [ ] `npm test`, `npm run smoke` 통과, 커밋

### Task 5: 배포
- [ ] main에 합치고 올림 → Actions 성공 확인 → 사용자에게 보통으로 해 보시게 함
