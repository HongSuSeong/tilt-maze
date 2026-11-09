# 틸트 미로 4차: 불의 세계 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans.

**Goal:** 불의 세계 10단계(쉬움·보통). 불 원소, 덩굴·얼음벽, 횃불과 문, 용암(물로 식힘), 물웅덩이에서 불 꺼짐.

**Spec:** `docs/superpowers/specs/2026-11-09-tilt-maze-design.md` ("불의 세계 세부")

## Global Constraints
- 불: 이름 '불', 색 `#FF7A45`, 5초 두르기, 3초 쉬기. `WORLD_ELEMENT[3] = 'fire'`.
- 벽 종류 `vine`, `ice`(불로 사라짐), `door`(횃불 `{x, y, door}`로 열림). 용암 `level.lava: {x,y,w,h}[]`.
- 횃불은 공 중심이 `4.2 + 2.5` 안에 들면 닿음. 용암: 공이 사각형에 겹치면 물로 식힘, 공 중심이 사각형 안(가장자리 `4.2×0.4` 안쪽)이면 실패.
- 커밋은 한국어, Why/What, Co-Authored-By 없음.

## Review Focus
1. 불을 두른 채 물웅덩이를 스치고 덩굴 벽에 닿음 → 불이 꺼졌으니 벽은 그대로. (Task 1)
2. 물을 두르고 용암 가장자리에 닿음 → 공이 빠지기 전에 식는다. (Task 1)
3. 불 없이 문 앞까지 → 검사가 막힌 것으로 본다. (Task 3)

### Task 1: 물리
- `collide`가 지금 두른 원소를 받음: `vine`/`ice` + 불 → `state.broken`, 이벤트 `burnwall {wall}`
- 횃불 + 불 → `state.lit`, 문 열림(`state.broken.add(door)`), 이벤트 `light {torch}`
- 용암 + 물 → `state.cooled`, 이벤트 `cool {lava}` / 물 없이 중심이 들어가면 `lava {lava}`, 공 멈춤
- 불을 두르고 웅덩이 안 → 이벤트 `quench`
- 시험: 각 경우와 Review Focus 1·2

### Task 2: 불 원소와 한 판
- `ELEMENTS.fire`, `WORLD_ELEMENT[3]`, `quench` → coat 사라짐, `lava` → 실패(이유 `lava`)

### Task 3: 검사
- kit에 불이 없으면 vine/ice/door는 벽, 횃불에 갈 수 있어야 함. kit에 물이 없으면 용암은 지나갈 수 없음
- 시험: 문·덩굴·용암 각각 막힘/열림

### Task 4: 불의 협곡 10단계
- `src/levels/world3.js`, `T.worlds[3] = '불의 협곡'`, 1단계 안내, `kit: ['water', 'fire']`
- 시험: 쉬움·보통 20개 검사 통과, 모두 `requires(l, 'fire')`, 5개 이상 `requires(l, 'water')`

### Task 5: 3D와 화면
- 세계 3 판 색 `#FFE2CC`/`#FFD0AE`, 바탕 `#FFF1E6`, 고리 `#FFB48A`
- 용암(빛나는 주황, 식으면 회색 돌), 덩굴 벽(초록), 얼음벽(반투명 하늘), 나무 문, 횃불(꺼짐/켜짐), 불 두른 공(주황 껍질)
- 불 아이콘, 실패 이유 `용암에 빠졌어요`, 불이 꺼지면 알림
- 캡처, 연기 시험(불의 협곡 1에서 칸 두 개), 배포
