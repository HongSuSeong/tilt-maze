# 원소 섞기 Implementation Plan

**Goal:** 합체 3개(증기·눈덩이·폭발 돌진), 흔적 반응 2개(빙판·전기 웅덩이), 도감, 8–10세계 섞기 판.

**Spec:** `docs/superpowers/specs/2026-11-09-tilt-maze-design.md` — "원소 섞기 (2026-11-11 추가)"

## Global Constraints

- Values from the spec: steam 4 s, snow 5 s, blast 1.5 s; rest after fusing = fusion time + 3 s; boost adds to fusions; snow breaks walls once rolled 40 at speed 30; blast speed 520; first find gives 10 coins.
- Every stage must still pass `validateLevel`, and every kit element stays required.
- Hard, hell and god maps stay as they are.

## Tasks

1. **Recipes and fusing** (`src/elements.js`, `src/run.js`; `test/elements.test.js`, `test/run.test.js`)
   - `FUSIONS = { steam, snow, blast }` each `{ name, color, dur, of: [a, b], use }`; `fusionOf(a, b)` → id or null, order-free.
   - `useSlot`: while worn from the other slot and a recipe exists, `run.coat = { el, left, dur, of, fused: true, kick? }`; both slots rest `dur + 3`; `run.state.snow = 0`. No recipe: as before.
   - `tickRun`: a `kick` coat sends the ball at `DASH_V = 520` toward the tilt (velocity if tilt < 2°).
   - `canFuse(run, i)` for the slot hint.
2. **Physics** (`src/physics.js`; `test/physics.test.js`)
   - `LIKE = { snow: 'water', blast: 'fire' }`; steam floats (gaps, deep, lava, pillars, puddles, wind ×3, enemies stop).
   - snow: `state.snow` grows by distance; ≥ 40 breaks crack/thick at 30. blast breaks crack/thick on touch.
   - Puddles: ice freezes one (`state.iced`, event `icepool`); a frozen one is slick. Spark in an unfrozen one powers switches within 2.5 of it (event `power` with `via: 'pool'`).
3. **Validator** (`src/levels/validate.js`; `test/validate.test.js`)
   - `validateLevel(level, { fuse = true, trace = true } = {})`. steam: deep/gaps/lava open. snow, blast: thick and crack open, no run-up. A thick wall touching a pool needs ice beside stone (trace) unless fused. Switches touching a reachable pool open with spark (trace).
4. **Stages** (`src/levels/generate.js`; `test/levels.test.js`)
   - `COMBO` table for easy worlds 8–10; `level.combo`; devices per combo; hints in world 8.
   - Tests: each combo stage fails with its fusion or trace off.
5. **Save, codex, UI, look** (`src/save.js`, `src/ui.js`, `src/main.js`, `src/text.js`, `src/aura.js`, `src/render3d.js`, `src/style.css`; `test/save.test.js`)
   - `save.found` (default `[]`); first find adds 10 coins and a toast.
   - Shop tab `도감`; dock slot class `fuse` when `canFuse`; dock fill for fused coats.
   - Aura forms for steam (white floating cloud), snow (rolling, grows), blast (comet). Frozen puddle turns to ice; a powered puddle flashes.
   - `#shot=` tokens `steam`, `snow`, `blast`, and `shop:book`.
6. **Check:** `npm test`, `npm run build`, `npm run smoke`, captures.
