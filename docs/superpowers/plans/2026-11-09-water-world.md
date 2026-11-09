# 틸트 미로 3차: 물의 세계와 원소 장착 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans.

**Goal:** 물의 세계 10단계(쉬움·보통)와 원소 장착 칸이 실제로 동작하게 한다.

**Spec:** `docs/superpowers/specs/2026-11-09-tilt-maze-design.md` ("원소와 장착", "물의 세계 세부")

## Global Constraints
- 원소 두르기 5초, 다시 쓰기까지 3초. 칸 2개.
- 물웅덩이 안 구름 저항 ×5. 불기둥은 원(`{x, y, r}`), 공이 `r + 4.2` 안에 들면 닿음.
- 물의 세계 쉬움 제한 시간 50–40초, 보통은 1·2차 규칙 그대로(75%, 벽 +1, 함정).
- 커밋은 한국어, Why/What, Co-Authored-By 없음.

## Review Focus
1. 물을 두른 채 불기둥 두 개를 연달아 지나감 → 5초 안이면 둘 다 꺼진다. (Task 1)
2. 두르기가 끝나는 바로 그 순간 불기둥에 닿음 → 끝난 뒤면 실패. (Task 2)
3. 예전 저장에서 이미 연 보통·이미 깬 들판 10 → 다시 잠기지 않고 물 1이 열린다. (Task 4)

### Task 1: 물리 — 물웅덩이와 불기둥
- `stepBall(ball, tilt, dt, level, state, sens, coat = null)`; `level.pools: {x,y,w,h}[]`, `level.fires: {x,y,r}[]`, `state.doused: Set`
- 이벤트 `douse {fire}`(물을 두르고 닿음), `burn {fire}`(안 두르고 닿음; 공은 멈춤)
- 시험: 웅덩이 안에서 느려짐 / 물 없이 닿으면 burn / 물 두르고 닿으면 douse, 그다음은 지나감 / 연달아 두 개

### Task 2: 원소와 한 판
- `src/elements.js`: `ELEMENTS = { water: { name: '물', color: '#5BB8F5', dur: 5, cool: 3 } }`, `WORLD_ELEMENT = { 2: 'water' }`, `ownedFor(world) -> id[]`
- `createRun(level, diff, slots = defaultSlots(level))`, `run.slots`, `run.coat = { el, left } | null`, `run.cool = [0, 0]`, `useSlot(run, i) -> boolean`, `setSlots(run, slots)`
- burn → 실패, 이유 `fire`
- 시험: 기본 칸 / 쓰면 5초 두르고 3초 뒤 다시 / 빈 칸·쿨타임엔 false / 두르기 끝난 뒤 닿으면 실패 / 다시 하면 칸은 그대로, 두르기·쿨타임은 처음으로

### Task 3: 단계 검사
- 불기둥은 `level.kit`에 'water'가 있으면 지나갈 수 있는 곳, 없으면 막힌 곳. 웅덩이는 지나갈 수 있음.
- `requires(level, el) -> boolean`: 그 원소 없이는 구멍에 못 가면 true
- 시험: 불기둥이 막아도 kit에 물이 있으면 통과 / kit에 없으면 '구멍에 갈 수 없음'

### Task 4: 저장 — 다시 잠기지 않기
- 저장에 `opened: string[]`; `isOpen`은 opened에 있거나 조건을 만족하면 true; `markOpened(s) -> Save`
- `reachedOf(s, diff)`: 기록된 reached부터, 깬 단계면 다음 단계로 넘어가며 처음 안 깬 단계(또는 끝)
- 형식 2 저장에 `opened`가 없으면 들판(세계 1)만으로 조건을 따져 채움
- 시험: 들판 10까지 깬 옛 저장 → 쉬움 reachedOf가 w2-1, 보통 열림 유지

### Task 5: 물의 세계 10단계
- `src/levels/world2.js`, `T.worlds[2] = '물가'`, 1단계에 안내 문구, 모든 단계 `kit: ['water']`
- 시험: 20개(쉬움·보통) 검사 통과, 모든 물 단계 `requires(level, 'water')`

### Task 6: 3D — 불기둥, 김, 물웅덩이, 물 두른 공, 세계 색
- 세계 2 판 색: 바탕 `#EAF4FB`, 판 `#CDEBFA`, 점 `#B5DDF4`, 고리 `#7FC4E8`. 다크는 1과 같은 틀에 푸른 기
- 불기둥: 받침 + 흔들리는 불꽃(빛남). 꺼지면 김 몇 초 뒤 받침만
- 물 두른 공: 반투명 파란 껍질
- 캡처로 확인

### Task 7: 화면
- 준비 카드에 원소 칸 고르기(가진 원소 칩, 칸 2개), 아래 칸은 원소 아이콘·남은 두르기 시간·쿨타임 표시, 누르면 사용
- 실패 이유 `불기둥에 닿았어요`, 안내 문구는 모든 단계에서
- 연기 시험: 물 1까지 가서 칸이 보이고 누를 수 있음
- 배포
