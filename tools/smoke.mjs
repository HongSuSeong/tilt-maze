// A quick run through the real game in a headless browser: home → ready → start → roll with the arrow keys → clear.
// Uses the Playwright headless shell already on this Mac. Run after `npm run build` (serves dist/ itself).
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { homedir } from 'node:os';

const PORT = 4180, exe = process.env.CHROME || `${homedir()}/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-x64/chrome-headless-shell`;
const srv = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 2500));
const browser = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => m.type() === 'error' && errors.push(m.text()));
let ok = true; const check = (c, what) => { console.log((c ? 'PASS ' : 'FAIL ') + what); if (!c) ok = false; };
try {
  await page.goto(`http://localhost:${PORT}/tilt-maze/?test`);
  check(await page.getByRole('button', { name: '쉬움' }).getAttribute('aria-pressed') === 'true', 'easy is chosen at first');
  await page.getByRole('button', { name: /보통/ }).click();
  check(await page.getByText('앞 난이도의 들판을 모두 깨면 열려요').isVisible(), 'normal is locked on a fresh save, and says why');
  await page.getByRole('button', { name: /이어하기/ }).click();
  check(await page.getByRole('button', { name: '시작' }).isVisible(), 'ready card after continue');
  await page.getByRole('button', { name: '시작' }).click();
  check(await page.locator('#hud').isVisible(), 'the bars while playing');
  // steer toward the hole with the arrow keys, looking at where the ball is, until the stage is cleared
  const held = new Set(), hold = async (k, on) => { if (on && !held.has(k)) { held.add(k); await page.keyboard.down(k); } if (!on && held.has(k)) { held.delete(k); await page.keyboard.up(k); } };
  let seen = false;
  for (let i = 0; i < 400 && !seen; i++) {
    const s = await page.evaluate(() => { const r = window.__tm.run; return { x: r.ball.x, y: r.ball.y, vx: r.ball.vx, vy: r.ball.vy, hx: r.level.hole.x, hy: r.level.hole.y, phase: r.phase }; });
    if (s.phase === 'clear') { seen = await page.getByText('통과!').isVisible(); break; }
    const ex = s.hx - (s.x + s.vx * 0.25), ey = s.hy - (s.y + s.vy * 0.25);   // aim where the ball will be, so it does not overshoot
    await hold('ArrowRight', ex > 2); await hold('ArrowLeft', ex < -2); await hold('ArrowDown', ey > 2); await hold('ArrowUp', ey < -2);
    await page.waitForTimeout(50);
  }
  for (const k of [...held]) await hold(k, false);
  check(seen, 'clears the first stage');
  if (seen) { await page.getByRole('button', { name: '다음 단계' }).click(); check(await page.getByText('연습 2').first().isVisible(), 'next stage is 연습 2'); }
  await page.reload();
  check((await page.locator('.grid button small').first().textContent()).includes('★'), 'stars kept after reload');
  // an old save that had cleared the fields: the waterside opens next, its ready card offers water, and a slot coats the ball
  await page.evaluate(() => {
    const best = {}; for (const id of ['t1', 't2', 't3', ...Array.from({ length: 10 }, (_, i) => `w1-${i + 1}`)]) best[id] = { stars: 2, time: 30 };
    localStorage.setItem('tilt-maze:v1', JSON.stringify({ v: 1, coins: 40, best, reached: 'w1-10', opt: { sens: 1, snd: true, vib: true, dark: false } }));
  });
  await page.reload();
  check(await page.getByRole('button', { name: /이어하기 · 물가 1/ }).isVisible(), 'an old save that cleared the fields goes on to the waterside');
  check(await page.getByRole('button', { name: '보통' }).getAttribute('data-locked') === null, 'and keeps normal open');
  await page.getByRole('button', { name: /이어하기/ }).click();
  check(await page.getByRole('button', { name: /칸 1: 물/ }).first().isVisible(), 'the ready card offers water');
  await page.getByRole('button', { name: '시작' }).click();
  await page.locator('#slot0').dispatchEvent('pointerdown');
  check(await page.evaluate(() => window.__tm.run.coat?.el) === 'water', 'the slot coats the ball in water');
  // fields and waterside cleared: the fire canyon comes next with water and fire in the two slots
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('tilt-maze:v1'));
    for (let i = 1; i <= 10; i++) s.prog.easy.best[`w2-${i}`] = { stars: 1, time: 40 };
    localStorage.setItem('tilt-maze:v1', JSON.stringify(s));
  });
  await page.reload();
  check(await page.getByRole('button', { name: /이어하기 · 불의 협곡 1/ }).isVisible(), 'after the waterside comes the fire canyon');
  await page.getByRole('button', { name: /이어하기/ }).click(); await page.getByRole('button', { name: '시작' }).click();
  await page.locator('#slot1').dispatchEvent('pointerdown');
  check(await page.evaluate(() => window.__tm.run.coat?.el) === 'fire', 'the second slot coats the ball in fire');
  check(errors.length === 0, `no errors in the page${errors.length ? ': ' + errors.join(' | ') : ''}`);
} finally { await browser.close(); srv.kill(); }
console.log(ok ? 'ALL PASS' : 'FAILED'); process.exitCode = ok ? 0 : 1;
